"""Builds the context a chat turn is grounded in, under a token budget.

The naive version of this — dumping `json.dumps(chart, indent=2)` plus the full
analysis plus every prior turn into the prompt — grows without bound: a long
conversation re-sends the entire chart on every message, and cost per turn rises
with the length of the session.

Two things fix that. The chart is rendered as compact facts rather than raw JSON
(the model needs the placements, not the floating-point latitudes and speeds),
and history is trimmed to a token budget from the most recent turn backwards, so
the prompt has a ceiling regardless of session length.
"""

import os
from typing import Any, Dict, List, Optional

from app.utilities.llm import estimate_tokens

# Ceiling on replayed conversation history. Recent turns carry most of the
# conversational state; older ones are dropped oldest-first.
HISTORY_TOKEN_BUDGET = int(os.getenv("CHAT_HISTORY_TOKEN_BUDGET", "2000"))

# Hard cap on turns regardless of budget, so a session of very short messages
# can't still replay hundreds of turns.
MAX_HISTORY_TURNS = int(os.getenv("CHAT_MAX_HISTORY_TURNS", "20"))


def _as_dict(value: Any) -> Dict:
    """Accept either a JSON column already decoded to a dict, or a JSON string."""
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        import json

        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return {}
        return parsed if isinstance(parsed, dict) else {}
    return {}


def render_chart_facts(chart: Any) -> str:
    """Render a computed chart as compact lines instead of raw JSON.

    Drops what the model can't use — ecliptic latitude, speed, full-precision
    longitudes — and keeps sign, nakshatra and pada, which is what an
    interpretation actually rests on.
    """
    data = _as_dict(chart)
    if not data or "error" in data:
        return ""

    lines: List[str] = []

    ascendant = data.get("ascendant") or {}
    ascendant_sign = ascendant.get("sign") or data.get("ascendant_sign")
    if ascendant_sign:
        lines.append(f"Ascendant: {ascendant_sign}")

    planets = data.get("planets") or {}
    if planets:
        lines.append("Planets (sidereal, Lahiri):")
        for name, body in planets.items():
            if not isinstance(body, dict):
                continue
            sign = body.get("sign", "?")
            nakshatra = body.get("nakshatra") or {}
            degrees = body.get("longitude")
            degree_text = f"{degrees:.1f}deg" if isinstance(degrees, (int, float)) else "?"
            nakshatra_text = ""
            if nakshatra.get("name"):
                nakshatra_text = f", {nakshatra['name']} pada {nakshatra.get('pada', '?')}"
            lines.append(f"  {name}: {sign} {degree_text}{nakshatra_text}")

    houses = data.get("houses") or {}
    if houses:
        parts = []
        for index in range(1, 13):
            house = houses.get(f"house_{index}")
            if isinstance(house, dict) and house.get("sign"):
                parts.append(f"{index}:{house['sign']}")
        if parts:
            lines.append("Houses (whole sign): " + ", ".join(parts))

    return "\n".join(lines)


def render_analysis(analysis: Any) -> str:
    """Flatten the stored reading into labelled bullets."""
    data = _as_dict(analysis)
    if not data:
        return ""

    lines: List[str] = []

    summary = data.get("summary")
    if isinstance(summary, dict):
        for key in ("core_identity", "life_focus", "overall_tone"):
            if summary.get(key):
                lines.append(f"{key.replace('_', ' ').title()}: {summary[key]}")

    for key in (
        "personality",
        "career",
        "relationships",
        "strengths",
        "challenges",
        "health_tendencies",
        "spiritual_path",
    ):
        values = data.get(key)
        if isinstance(values, list) and values:
            joined = "; ".join(str(item) for item in values if item)
            if joined:
                lines.append(f"{key.replace('_', ' ').title()}: {joined}")

    for key in ("key_yogas", "key_doshas"):
        values = data.get(key)
        if isinstance(values, list) and values:
            named = [
                f"{item.get('name')} ({item.get('description')})"
                for item in values
                if isinstance(item, dict) and item.get("name")
            ]
            if named:
                lines.append(f"{key.replace('_', ' ').title()}: {'; '.join(named)}")

    return "\n".join(lines)


def build_astro_context(astro_data: Any, person_data: Any) -> str:
    """Assemble the grounding context for one person's chat."""
    sections: List[str] = []

    identity: List[str] = []
    name = getattr(person_data, "name", None)
    if name:
        identity.append(f"Name: {name}")
    date_of_birth = getattr(person_data, "date_of_birth", None)
    if date_of_birth:
        identity.append(f"Date of Birth: {date_of_birth.isoformat()}")
    place_of_birth = getattr(person_data, "place_of_birth", None)
    if place_of_birth:
        identity.append(f"Place of Birth: {place_of_birth}")
    if identity:
        sections.append("\n".join(identity))

    chart_facts = render_chart_facts(getattr(astro_data, "vedic_chart", None))
    if chart_facts:
        sections.append("Computed chart:\n" + chart_facts)
    else:
        ascendant = getattr(astro_data, "ascendent_sign", None)
        if ascendant:
            sections.append(f"Ascendant Sign: {ascendant}")

    analysis_text = render_analysis(getattr(astro_data, "ai_analysis", None))
    if analysis_text:
        sections.append("Stored analysis:\n" + analysis_text)

    return "\n\n".join(sections)


def trim_history(
    history: List[Dict[str, str]],
    *,
    token_budget: int = HISTORY_TOKEN_BUDGET,
    max_turns: int = MAX_HISTORY_TURNS,
) -> List[Dict[str, str]]:
    """Keep the most recent turns that fit the budget, oldest dropped first.

    Walks backwards from the latest message so the current exchange always
    survives; a single message larger than the whole budget is still kept, since
    dropping it would strip the immediate context.
    """
    if not history:
        return []

    kept: List[Dict[str, str]] = []
    used = 0

    for message in reversed(history[-max_turns:]):
        cost = estimate_tokens(message.get("content", ""))
        if kept and used + cost > token_budget:
            break
        kept.append(message)
        used += cost

    kept.reverse()
    return kept


def context_stats(context: str, history: List[Dict[str, str]]) -> Dict[str, int]:
    """Estimated prompt size, for logging what a turn actually costs."""
    history_tokens = sum(estimate_tokens(m.get("content", "")) for m in history)
    return {
        "context_tokens": estimate_tokens(context),
        "history_tokens": history_tokens,
        "history_messages": len(history),
    }
