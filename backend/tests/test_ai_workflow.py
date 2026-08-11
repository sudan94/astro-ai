"""Tests for the AI workflow layer: schema repair, retries, context budgeting,
analysis caching and the eval graders.

No network and no API key: every test injects a fake chat client through
`llm._build_client`, so the retry and repair behaviour is asserted against
scripted model responses rather than a live provider.
"""

import json
from datetime import datetime
from types import SimpleNamespace

import pytest

from app.schemas.analysisSchema import ChartAnalysis, analysis_json_skeleton
from app.utilities import context as context_builder
from app.utilities import llm
from evals import checks

VALID_ANALYSIS = {
    "summary": {
        "core_identity": "Steady and analytical.",
        "life_focus": "Craft and service.",
        "overall_tone": "Grounded.",
    },
    "personality": ["Methodical."],
    "career": ["Suited to detailed work."],
    "relationships": ["Loyal once committed."],
    "strengths": ["Persistence."],
    "challenges": ["Overthinking."],
    "health_tendencies": ["Watch digestion."],
    "spiritual_path": ["Study-led."],
    "key_yogas": [{"name": "Budhaditya", "description": "Sun and Mercury together."}],
    "key_doshas": [],
}

# Whole-sign chart with Leo rising, so Sun in Virgo lands in house 2.
CHART = {
    "ascendant": {"longitude": 127.5, "sign": "Leo"},
    "ascendant_sign": "Leo",
    "houses": {f"house_{i}": {"sign": s} for i, s in enumerate(
        ["Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn",
         "Aquarius", "Pisces", "Aries", "Taurus", "Gemini", "Cancer"], start=1)},
    "planets": {
        "Sun": {"longitude": 165.2, "sign": "Virgo", "latitude": 0.0, "speed": 0.98,
                "nakshatra": {"name": "Hasta", "number": 13, "pada": 2}},
        "Moon": {"longitude": 95.4, "sign": "Cancer", "latitude": 1.2, "speed": 13.1,
                 "nakshatra": {"name": "Pushya", "number": 8, "pada": 1}},
        "Mars": {"longitude": 220.8, "sign": "Scorpio", "latitude": -0.4, "speed": 0.5,
                 "nakshatra": {"name": "Anuradha", "number": 17, "pada": 3}},
    },
    "calculated_at": "2026-01-01T00:00:00",
}


class FakeResponse:
    def __init__(self, content):
        self.content = content
        self.usage_metadata = {"input_tokens": 120, "output_tokens": 60}


class ScriptedClient:
    """Returns queued responses in order; an Exception in the queue is raised."""

    def __init__(self, script):
        self.script = list(script)
        self.calls = []

    async def ainvoke(self, messages):
        self.calls.append(messages)
        if not self.script:
            raise AssertionError("ScriptedClient ran out of scripted responses")
        item = self.script.pop(0)
        if isinstance(item, Exception):
            raise item
        return FakeResponse(item if isinstance(item, str) else json.dumps(item))


@pytest.fixture
def scripted(monkeypatch):
    """Install a scripted client and remove retry backoff so tests stay fast."""
    monkeypatch.setattr(llm, "RETRY_BASE_DELAY_SECONDS", 0.0)

    holder = {}

    def install(script):
        client = ScriptedClient(script)
        holder["client"] = client
        monkeypatch.setattr(llm, "_build_client", lambda *a, **k: client)
        return client

    return install


# --- structured output: validation and repair --------------------------------


@pytest.mark.asyncio
async def test_structured_call_returns_validated_model(scripted):
    client = scripted([VALID_ANALYSIS])

    result, call = await llm.ainvoke_structured(
        [llm.HumanMessage(content="go")],
        schema=ChartAnalysis,
        operation="test",
    )

    assert isinstance(result, ChartAnalysis)
    assert result.summary.core_identity == "Steady and analytical."
    assert call.ok is True
    assert call.repairs == 0
    assert call.attempts == 1
    assert len(client.calls) == 1


@pytest.mark.asyncio
async def test_structured_call_repairs_schema_violation(scripted):
    """Valid JSON with a missing required field is sent back, not persisted."""
    broken = {k: v for k, v in VALID_ANALYSIS.items() if k != "career"}
    client = scripted([broken, VALID_ANALYSIS])

    result, call = await llm.ainvoke_structured(
        [llm.HumanMessage(content="go")],
        schema=ChartAnalysis,
        operation="test",
    )

    assert result.career == ["Suited to detailed work."]
    assert call.repairs == 1
    assert call.attempts == 2

    # The repair turn must tell the model which field was wrong.
    repair_prompt = client.calls[1][-1].content
    assert "career" in repair_prompt


@pytest.mark.asyncio
async def test_structured_call_repairs_malformed_json(scripted):
    client = scripted(["not json at all", VALID_ANALYSIS])

    result, call = await llm.ainvoke_structured(
        [llm.HumanMessage(content="go")],
        schema=ChartAnalysis,
        operation="test",
    )

    assert result.summary.life_focus == "Craft and service."
    assert call.repairs == 1


@pytest.mark.asyncio
async def test_structured_call_rejects_padded_empty_entries(scripted):
    """A list padded with blank strings must not count as populated."""
    padded = dict(VALID_ANALYSIS, personality=["", "   "])
    client = scripted([padded, VALID_ANALYSIS])

    result, call = await llm.ainvoke_structured(
        [llm.HumanMessage(content="go")],
        schema=ChartAnalysis,
        operation="test",
    )

    assert result.personality == ["Methodical."]
    assert call.repairs == 1


@pytest.mark.asyncio
async def test_structured_call_gives_up_after_max_repairs(scripted):
    broken = {"summary": {}}
    scripted([broken, broken, broken])

    with pytest.raises(llm.LLMSchemaError):
        await llm.ainvoke_structured(
            [llm.HumanMessage(content="go")],
            schema=ChartAnalysis,
            operation="test",
            max_repairs=2,
        )


# --- transient failure handling ----------------------------------------------


@pytest.mark.asyncio
async def test_transient_error_is_retried(scripted):
    client = scripted([RuntimeError("502 bad gateway"), "a reply"])

    text, call = await llm.ainvoke_text(
        [llm.HumanMessage(content="go")], operation="test"
    )

    assert text == "a reply"
    assert call.attempts == 2
    assert call.ok is True


@pytest.mark.asyncio
async def test_persistent_error_raises_llm_unavailable(scripted):
    scripted([RuntimeError("down"), RuntimeError("down"), RuntimeError("down")])

    with pytest.raises(llm.LLMUnavailableError):
        await llm.ainvoke_text(
            [llm.HumanMessage(content="go")], operation="test", max_attempts=3
        )


@pytest.mark.asyncio
async def test_token_usage_accumulates_across_attempts(scripted):
    scripted([{"summary": {}}, VALID_ANALYSIS])

    _result, call = await llm.ainvoke_structured(
        [llm.HumanMessage(content="go")],
        schema=ChartAnalysis,
        operation="test",
    )

    # Both the failed attempt and the repair are paid for, so both are counted.
    assert call.input_tokens == 240
    assert call.output_tokens == 120


def test_cost_is_unknown_without_pricing(monkeypatch):
    monkeypatch.delenv("LLM_PRICE_INPUT_PER_1M", raising=False)
    monkeypatch.delenv("LLM_PRICE_OUTPUT_PER_1M", raising=False)
    call = llm.LLMCall(operation="t", model="m", input_tokens=1000, output_tokens=500)

    assert call.estimated_cost_usd is None


def test_cost_is_computed_when_pricing_is_configured(monkeypatch):
    monkeypatch.setenv("LLM_PRICE_INPUT_PER_1M", "2.50")
    monkeypatch.setenv("LLM_PRICE_OUTPUT_PER_1M", "10.00")
    call = llm.LLMCall(operation="t", model="m", input_tokens=1_000_000, output_tokens=1_000_000)

    assert call.estimated_cost_usd == pytest.approx(12.50)


# --- context budgeting -------------------------------------------------------


def test_chart_facts_are_smaller_than_raw_json():
    raw = json.dumps(CHART, indent=2)
    compact = context_builder.render_chart_facts(CHART)

    assert llm.estimate_tokens(compact) < llm.estimate_tokens(raw) / 2
    # The placements a reading rests on must survive the compaction.
    assert "Sun: Virgo" in compact
    assert "Hasta pada 2" in compact
    assert "Ascendant: Leo" in compact
    # The noise must not.
    assert "speed" not in compact
    assert "calculated_at" not in compact


def test_trim_history_keeps_most_recent_within_budget():
    history = [
        {"role": "user", "content": "x" * 400},       # ~100 tokens each
        {"role": "assistant", "content": "y" * 400},
        {"role": "user", "content": "z" * 400},
    ]

    trimmed = context_builder.trim_history(history, token_budget=150)

    assert trimmed == [history[-1]]


def test_trim_history_keeps_everything_under_budget():
    history = [{"role": "user", "content": "short"} for _ in range(4)]

    assert context_builder.trim_history(history, token_budget=1000) == history


def test_trim_history_respects_turn_cap():
    history = [{"role": "user", "content": "hi"} for _ in range(50)]

    trimmed = context_builder.trim_history(history, token_budget=10_000, max_turns=6)

    assert len(trimmed) == 6


def test_trim_history_keeps_one_oversized_message():
    """Dropping the only message would strip the immediate context entirely."""
    history = [{"role": "user", "content": "x" * 40_000}]

    assert context_builder.trim_history(history, token_budget=10) == history


def test_build_astro_context_includes_chart_and_analysis():
    astro = SimpleNamespace(
        vedic_chart=CHART, ai_analysis=VALID_ANALYSIS, ascendent_sign="Leo", summary="s"
    )
    person = SimpleNamespace(
        name="Alice",
        date_of_birth=datetime(1990, 5, 1, 10, 30),
        place_of_birth="Kathmandu",
    )

    built = context_builder.build_astro_context(astro, person)

    assert "Alice" in built
    assert "Mars: Scorpio" in built
    assert "Budhaditya" in built


# --- eval graders ------------------------------------------------------------


def test_grounding_check_passes_on_faithful_analysis():
    analysis = dict(VALID_ANALYSIS, personality=["With the Sun in Virgo, precision matters."])

    result = checks.check_placements_grounded(CHART, analysis)

    assert result.passed
    assert "1 placement claim" in result.detail


def test_grounding_check_catches_hallucinated_placement():
    """The exact failure a schema check cannot see: valid shape, wrong facts."""
    analysis = dict(VALID_ANALYSIS, career=["Mars in Aries drives a competitive career."])

    result = checks.check_placements_grounded(CHART, analysis)

    assert not result.passed
    assert "chart has Mars in Scorpio" in result.failures[0]


def test_house_check_catches_wrong_house():
    # Leo rising puts Virgo in house 2, so "Sun in the 5th house" is wrong.
    analysis = dict(VALID_ANALYSIS, strengths=["The Sun in the 5th house grants authority."])

    result = checks.check_houses_grounded(CHART, analysis)

    assert not result.passed
    assert "house 2" in result.failures[0]


def test_house_check_passes_on_correct_house():
    analysis = dict(VALID_ANALYSIS, strengths=["The Sun in the 2nd house grants resources."])

    assert checks.check_houses_grounded(CHART, analysis).passed


def test_time_varying_check_catches_dasha_language():
    analysis = dict(VALID_ANALYSIS, career=["Your Saturn dasha brings a shift."])

    result = checks.check_no_time_varying_claims(CHART, analysis)

    assert not result.passed


def test_coverage_check_catches_empty_section():
    analysis = dict(VALID_ANALYSIS, career=[])

    result = checks.check_coverage(CHART, analysis)

    assert not result.passed
    assert "career is empty" in result.failures


def test_all_graders_pass_on_the_reference_analysis():
    results = checks.run_all(CHART, VALID_ANALYSIS)

    assert [r.name for r in results if not r.passed] == []


# --- prompt/schema coupling --------------------------------------------------


def test_prompt_skeleton_covers_every_schema_field():
    """Guards against adding a field to the schema and forgetting the prompt."""
    skeleton = json.loads(analysis_json_skeleton())

    assert set(skeleton) == set(ChartAnalysis.model_fields)
