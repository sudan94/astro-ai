"""Instrumented access layer for every model call in the app.

Controllers don't construct `ChatOpenAI` directly. Routing calls through here
makes four things true everywhere at once:

* **Retries** — transient provider errors back off and retry instead of
  surfacing as a 500.
* **Schema enforcement** — `ainvoke_structured` validates the response against a
  Pydantic model and, when the model drifts, feeds the validation errors back as
  a repair turn rather than persisting a malformed reading.
* **Observability** — every call logs operation, model, attempts, latency, token
  usage and (when pricing is configured) estimated cost.
* **Configuration** — model name and limits live in one place.

Pricing is read from the environment rather than hardcoded, because per-token
rates change independently of this code. With it unset, tokens are still logged
and cost is simply reported as unknown.
"""

import asyncio
import json
import logging
import os
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Sequence, Tuple, Type, TypeVar

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from pydantic import BaseModel, ValidationError

logger = logging.getLogger("app.llm")

TModel = TypeVar("TModel", bound=BaseModel)


class LLMUnavailableError(RuntimeError):
    """The provider could not be reached, or failed every retry."""


class LLMSchemaError(ValueError):
    """The model never produced output matching the requested schema."""

DEFAULT_MODEL = os.getenv("OPENAPI_MODEL", "gpt-5-chat-latest")

# Transient-failure retry policy (network blips, rate limits, 5xx).
MAX_ATTEMPTS = int(os.getenv("LLM_MAX_ATTEMPTS", "3"))
RETRY_BASE_DELAY_SECONDS = float(os.getenv("LLM_RETRY_BASE_DELAY", "0.5"))

# How many times a schema-invalid response is handed back for repair.
MAX_REPAIR_ATTEMPTS = int(os.getenv("LLM_MAX_REPAIR_ATTEMPTS", "2"))

# Roughly 4 characters per token for English prose. Deliberately an estimate:
# it is only used for context budgeting, where being slightly conservative is
# fine and pulling in a tokenizer dependency is not worth it.
CHARS_PER_TOKEN = 4


def _price_per_million(var_name: str) -> Optional[float]:
    raw = os.getenv(var_name)
    if not raw:
        return None
    try:
        return float(raw)
    except ValueError:
        logger.warning("Ignoring non-numeric %s=%r", var_name, raw)
        return None


def estimate_tokens(text: str) -> int:
    """Approximate token count for budgeting. Not exact — see CHARS_PER_TOKEN."""
    if not text:
        return 0
    return max(1, len(text) // CHARS_PER_TOKEN)


@dataclass
class LLMCall:
    """What one logical operation cost, across however many attempts it took."""

    operation: str
    model: str
    attempts: int = 0
    repairs: int = 0
    latency_ms: float = 0.0
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    ok: bool = False
    error: Optional[str] = None
    _extra: Dict[str, Any] = field(default_factory=dict)

    @property
    def total_tokens(self) -> Optional[int]:
        if self.input_tokens is None and self.output_tokens is None:
            return None
        return (self.input_tokens or 0) + (self.output_tokens or 0)

    @property
    def estimated_cost_usd(self) -> Optional[float]:
        """None when pricing isn't configured or the provider returned no usage."""
        input_price = _price_per_million("LLM_PRICE_INPUT_PER_1M")
        output_price = _price_per_million("LLM_PRICE_OUTPUT_PER_1M")
        if input_price is None or output_price is None:
            return None
        if self.input_tokens is None and self.output_tokens is None:
            return None
        return (
            (self.input_tokens or 0) * input_price
            + (self.output_tokens or 0) * output_price
        ) / 1_000_000

    def log(self) -> None:
        cost = self.estimated_cost_usd
        logger.info(
            "llm operation=%s model=%s ok=%s attempts=%d repairs=%d "
            "latency_ms=%.0f in_tokens=%s out_tokens=%s cost_usd=%s%s",
            self.operation,
            self.model,
            self.ok,
            self.attempts,
            self.repairs,
            self.latency_ms,
            self.input_tokens if self.input_tokens is not None else "?",
            self.output_tokens if self.output_tokens is not None else "?",
            f"{cost:.6f}" if cost is not None else "?",
            f" error={self.error}" if self.error else "",
        )


def _build_client(temperature: float, model: Optional[str], json_mode: bool):
    """Construct the chat client.

    Imported lazily so that modules importing this file (the eval harness, the
    schema tests) don't require `langchain_openai` to be installed.
    """
    from langchain_openai import ChatOpenAI

    kwargs: Dict[str, Any] = {
        "model": model or DEFAULT_MODEL,
        "temperature": temperature,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    return ChatOpenAI(**kwargs)


def _extract_usage(response: Any) -> Tuple[Optional[int], Optional[int]]:
    """Pull token counts off the response, tolerating providers that omit them."""
    usage = getattr(response, "usage_metadata", None)
    if isinstance(usage, dict):
        return usage.get("input_tokens"), usage.get("output_tokens")

    metadata = getattr(response, "response_metadata", None)
    if isinstance(metadata, dict):
        token_usage = metadata.get("token_usage") or metadata.get("usage")
        if isinstance(token_usage, dict):
            return (
                token_usage.get("prompt_tokens"),
                token_usage.get("completion_tokens"),
            )

    return None, None


def _content_as_text(response: Any) -> str:
    """Normalise content, which may arrive as a string or as content blocks."""
    content = getattr(response, "content", "")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict) and isinstance(block.get("text"), str):
                parts.append(block["text"])
        return "".join(parts)
    return str(content)


async def _invoke_with_retry(
    messages: Sequence[Any],
    *,
    call: LLMCall,
    temperature: float,
    model: Optional[str],
    json_mode: bool,
    max_attempts: int,
) -> Tuple[str, Any]:
    """Invoke the model, retrying transient failures with exponential backoff.

    Accumulates attempt count, latency and token usage onto `call` so a caller
    that repairs several times still sees the true total.
    """
    last_error: Optional[Exception] = None

    for attempt in range(1, max_attempts + 1):
        call.attempts += 1
        started = time.perf_counter()
        try:
            client = _build_client(temperature, model, json_mode)
            response = await client.ainvoke(list(messages))
        except Exception as exc:  # noqa: BLE001 - provider errors are opaque
            call.latency_ms += (time.perf_counter() - started) * 1000
            last_error = exc
            logger.warning(
                "llm attempt failed operation=%s attempt=%d/%d error=%s",
                call.operation,
                attempt,
                max_attempts,
                exc,
            )
            if attempt < max_attempts:
                await asyncio.sleep(RETRY_BASE_DELAY_SECONDS * (2 ** (attempt - 1)))
            continue

        call.latency_ms += (time.perf_counter() - started) * 1000
        input_tokens, output_tokens = _extract_usage(response)
        if input_tokens is not None:
            call.input_tokens = (call.input_tokens or 0) + input_tokens
        if output_tokens is not None:
            call.output_tokens = (call.output_tokens or 0) + output_tokens

        return _content_as_text(response), response

    raise LLMUnavailableError(
        f"{call.operation}: model call failed after {max_attempts} attempts"
    ) from last_error


async def ainvoke_text(
    messages: Sequence[Any],
    *,
    operation: str,
    temperature: float = 0.7,
    model: Optional[str] = None,
    max_attempts: int = MAX_ATTEMPTS,
) -> Tuple[str, LLMCall]:
    """Free-text call. Returns the content and the metrics for the call."""
    call = LLMCall(operation=operation, model=model or DEFAULT_MODEL)
    try:
        text, _ = await _invoke_with_retry(
            messages,
            call=call,
            temperature=temperature,
            model=model,
            json_mode=False,
            max_attempts=max_attempts,
        )
    except Exception as exc:
        call.error = str(exc)
        call.log()
        raise

    call.ok = True
    call.log()
    return text, call


def _format_validation_errors(exc: ValidationError) -> str:
    lines = []
    for error in exc.errors():
        location = ".".join(str(part) for part in error["loc"]) or "(root)"
        lines.append(f"- {location}: {error['msg']}")
    return "\n".join(lines)


async def ainvoke_structured(
    messages: Sequence[Any],
    *,
    schema: Type[TModel],
    operation: str,
    temperature: float = 0.0,
    model: Optional[str] = None,
    max_attempts: int = MAX_ATTEMPTS,
    max_repairs: int = MAX_REPAIR_ATTEMPTS,
) -> Tuple[TModel, LLMCall]:
    """Call the model in JSON mode and validate the result against `schema`.

    JSON mode guarantees syntactic JSON, not the *right* JSON — a model can
    return well-formed output with a missing field or an empty list. When
    validation fails, the offending response and the specific Pydantic errors go
    back to the model as a repair turn. Only output that validates is returned,
    so callers never persist a partial reading.
    """
    call = LLMCall(operation=operation, model=model or DEFAULT_MODEL)
    conversation: List[Any] = list(messages)
    last_problem: Optional[str] = None

    try:
        for repair_round in range(max_repairs + 1):
            call.repairs = repair_round
            raw, _ = await _invoke_with_retry(
                conversation,
                call=call,
                temperature=temperature,
                model=model,
                json_mode=True,
                max_attempts=max_attempts,
            )

            try:
                payload = json.loads(raw)
            except json.JSONDecodeError as exc:
                last_problem = f"The response was not valid JSON: {exc}"
            else:
                try:
                    validated = schema.model_validate(payload)
                except ValidationError as exc:
                    last_problem = (
                        "The JSON did not match the required schema:\n"
                        f"{_format_validation_errors(exc)}"
                    )
                else:
                    call.ok = True
                    call.log()
                    return validated, call

            logger.warning(
                "llm schema repair operation=%s round=%d problem=%s",
                operation,
                repair_round + 1,
                last_problem,
            )

            if repair_round == max_repairs:
                break

            conversation = conversation + [
                AIMessage(content=raw),
                HumanMessage(
                    content=(
                        f"{last_problem}\n\n"
                        "Return the corrected, complete JSON object only. "
                        "Every required field must be present and non-empty. "
                        "Do not include markdown fences or commentary."
                    )
                ),
            ]
    except Exception as exc:
        call.error = str(exc)
        call.log()
        raise

    call.error = last_problem
    call.log()
    raise LLMSchemaError(
        f"{operation}: model did not return schema-valid output after "
        f"{max_repairs + 1} rounds. Last problem: {last_problem}"
    )


__all__ = [
    "AIMessage",
    "HumanMessage",
    "SystemMessage",
    "LLMCall",
    "LLMSchemaError",
    "LLMUnavailableError",
    "ainvoke_structured",
    "ainvoke_text",
    "estimate_tokens",
]
