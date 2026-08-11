import json
import logging
from typing import Dict, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config.database import SessionLocal
from app.models.Astro import Astro
from app.models.Person import Person
from app.schemas.analysisSchema import ChartAnalysis
from app.utilities import llm
from app.utilities.astro_calc import calculate_vedic_chart
from app.utilities.prompts import SYSTEM_PROMPT, build_analysis_prompt

logger = logging.getLogger(__name__)


def _load_person(db: Session, person_id: int, user_id: int) -> Person:
    """Fetch a person scoped to its owner.

    Authorization lives in the query: a person belonging to another user is
    indistinguishable from one that doesn't exist.
    """
    person = (
        db.query(Person)
        .filter(Person.id == person_id, Person.user_id == user_id)
        .first()
    )
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Person not found"
        )
    return person


async def get_vedic_chart(
    db: Session,
    person_id: int,
    user_id: int,
    refresh: bool = False,
) -> Dict:
    """Return the computed chart for a person, generating it only when needed.

    The chart itself is cheap and deterministic, so it is always recomputed. The
    LLM analysis is not: it is generated once and reused, and only regenerated
    when `refresh` is set or when a previous run left the row without one. A
    failed analysis never blocks the chart — the placements are the product; the
    reading is a layer on top.
    """
    person = _load_person(db, person_id, user_id)

    chart_data = calculate_vedic_chart(
        date_of_birth=person.date_of_birth,
        latitude=person.latitude,
        longitude=person.longitude,
        timezone=None,
    )

    astro_entry = db.query(Astro).filter(Astro.person_id == person_id).first()

    needs_analysis = refresh or astro_entry is None or not astro_entry.ai_analysis
    ai_analysis = astro_entry.ai_analysis if astro_entry else None

    if needs_analysis:
        try:
            ai_analysis = await run_chart_analysis(chart_data)
        except (llm.LLMSchemaError, llm.LLMUnavailableError) as exc:
            # Persist the chart regardless; `get_saved_astro` will retry the
            # analysis on the next read rather than leaving the user with a 500.
            logger.error("Chart analysis failed for person_id=%s: %s", person_id, exc)
            ai_analysis = astro_entry.ai_analysis if astro_entry else None

    summary = get_chart_summary(chart_data)
    ascendant_sign = (chart_data.get("ascendant") or {}).get("sign") or chart_data.get(
        "ascendant_sign"
    )

    if not astro_entry:
        astro_entry = Astro(
            person_id=person_id,
            vedic_chart=chart_data,
            ascendent_sign=ascendant_sign,
            summary=summary,
            ai_analysis=ai_analysis,
        )
        db.add(astro_entry)
    else:
        astro_entry.vedic_chart = chart_data
        astro_entry.ascendent_sign = ascendant_sign
        astro_entry.summary = summary
        if ai_analysis is not None:
            astro_entry.ai_analysis = ai_analysis

    db.commit()
    db.refresh(astro_entry)

    return chart_data


async def generate_chart_in_background(person_id: int, user_id: int) -> None:
    """
    Generate and store a chart outside the request cycle.

    Opens its own session because the request-scoped one from `get_db`
    is already closed by the time background tasks run.
    """
    db = SessionLocal()
    try:
        await get_vedic_chart(db, person_id, user_id)
    except Exception:  # noqa: BLE001 - nothing upstream can handle this
        # Background tasks have no caller to raise to; an unlogged exception here
        # would vanish silently.
        logger.exception("Background chart generation failed for person_id=%s", person_id)
    finally:
        db.close()


async def get_saved_astro(
    db: Session,
    person_id: int,
    user_id: int,
    generate_if_missing: bool = True,
) -> Astro:
    """
    Return saved astro row for a person. Optionally generate if missing.
    """
    _load_person(db, person_id, user_id)

    astro_entry = db.query(Astro).filter(Astro.person_id == person_id).first()
    if astro_entry and astro_entry.ai_analysis:
        return astro_entry

    if generate_if_missing:
        await get_vedic_chart(db, person_id, user_id)
        astro_entry = db.query(Astro).filter(Astro.person_id == person_id).first()
        if astro_entry:
            return astro_entry

    if astro_entry:
        return astro_entry

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Astrological data not found for this person",
    )


def get_chart_summary(chart_data: Dict) -> str:
    """
    Generate a human-readable summary of the chart.

    Args:
        chart_data: Vedic chart data dictionary

    Returns:
        Formatted summary string
    """
    if "error" in chart_data:
        return f"Error: {chart_data.get('message', 'Unknown error')}"

    summary_parts = []

    planets = chart_data.get("planets") or {}

    moon = planets.get("Moon")
    if isinstance(moon, dict):
        nakshatra = moon.get("nakshatra") or {}
        summary_parts.append(
            f"Nakshatra: {nakshatra.get('name', 'Unknown')} ({nakshatra.get('pada', '?')})"
        )

    if "ascendant_sign" in chart_data:
        summary_parts.append(f"Ascendant: {chart_data['ascendant_sign']}")

    if planets:
        summary_parts.append("\nPlanetary Positions:")
        for planet, data in planets.items():
            sign = data.get("sign", "Unknown")
            longitude = data.get("longitude", 0)
            summary_parts.append(f"  {planet}: {longitude:.2f} ({sign})")

    return "\n".join(summary_parts)


async def run_chart_analysis(chart_data: dict) -> dict:
    """Turn a computed chart into a stored reading.

    Goes through `ainvoke_structured`, so the result is guaranteed to satisfy
    `ChartAnalysis` before it reaches the database — a response that is valid
    JSON but missing `career`, or padded with empty strings, is sent back for
    repair rather than persisted.
    """
    messages = [
        llm.SystemMessage(content=SYSTEM_PROMPT),
        llm.HumanMessage(
            content=build_analysis_prompt(json.dumps(chart_data, indent=2))
        ),
    ]

    analysis, _call = await llm.ainvoke_structured(
        messages,
        schema=ChartAnalysis,
        operation="chart_analysis",
        temperature=0,
    )

    return analysis.model_dump()
