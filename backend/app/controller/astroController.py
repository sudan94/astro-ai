from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.Person import Person
from typing import Dict, Optional
from app.utilities.astro_calc import calculate_vedic_chart
from app.models.Astro import Astro
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
import json
from app.utilities.prompts import SYSTEM_PROMPT
import os


async def get_vedic_chart(db: Session, person_id: int) -> Dict:
    # Fetch person details from database
    person = db.query(Person).filter(Person.id == person_id).first()

    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found"
        )

    chart_data = calculate_vedic_chart(
        date_of_birth=person.date_of_birth,
        latitude=person.latitude,
        longitude=person.longitude,
        timezone=None
    )

    # Save the chart data to the database
    astro_entry = db.query(Astro).filter(Astro.person_id == person_id).first()
    ai_analysis = await run_chart_analysis(chart_data)

    if not astro_entry:
        astro_entry = Astro(
            person_id=person_id,
            vedic_chart=chart_data,
            ascendent_sign=(chart_data.get("ascendant") or {}).get("sign") or chart_data.get("ascendant_sign"),
            summary=get_chart_summary(chart_data),
            ai_analysis=ai_analysis
        )
        db.add(astro_entry)
    else:
        astro_entry.vedic_chart = chart_data
        astro_entry.ascendent_sign = (chart_data.get("ascendant") or {}).get("sign") or chart_data.get("ascendant_sign")
        astro_entry.summary = get_chart_summary(chart_data)
        astro_entry.ai_analysis = ai_analysis
    db.commit()
    db.refresh(astro_entry)

    return chart_data


async def get_saved_astro(db: Session, person_id: int, generate_if_missing: bool = True) -> Astro:
    """
    Return saved astro row for a person. Optionally generate if missing.
    """
    person = db.query(Person).filter(Person.id == person_id).first()
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found"
        )

    astro_entry = db.query(Astro).filter(Astro.person_id == person_id).first()
    if astro_entry:
        return astro_entry

    if generate_if_missing:
        await get_vedic_chart(db, person_id)
        astro_entry = db.query(Astro).filter(Astro.person_id == person_id).first()
        if astro_entry:
            return astro_entry

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Astrological data not found for this person"
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

    if "planets" in chart_data:
        summary_parts.append(f"Nakshatra: {chart_data['planets']['Moon']['nakshatra']['name']} ({chart_data['planets']['Moon']['nakshatra']['pada']})")

    if "ascendant_sign" in chart_data:
        summary_parts.append(f"Ascendant: {chart_data['ascendant_sign']}")

    if "planets" in chart_data:
        summary_parts.append("\nPlanetary Positions:")
        for planet, data in chart_data["planets"].items():
            sign = data.get("sign", "Unknown")
            longitude = data.get("longitude", 0)
            summary_parts.append(f"  {planet}: {longitude:.2f} ({sign})")

    return "\n".join(summary_parts)


async def run_chart_analysis(chart_data: dict) -> dict:
    llm = ChatOpenAI(
    model=os.getenv("OPENAPI_MODEL", "gpt-5-chat-latest"),
    temperature=0,
    response_format={"type": "json_object"}
    )

    prompt = f"""
{SYSTEM_PROMPT}

Chart Data:
{json.dumps(chart_data, indent=2)}

Return a COMPLETE and VALID JSON object.
DO NOT include markdown.
DO NOT truncate.
DO NOT add comments.
Ensure all fields are present.
{{
  "summary": {{
    "core_identity": "",
    "life_focus": "",
    "overall_tone": ""
  }},
  "personality": [],
  "career": [],
  "relationships": [],
  "strengths": [],
  "challenges": [],
  "health_tendencies": [],
  "spiritual_path": [],
  "key_yogas": [{{'name' : '', 'description': ''}}],
  "key_doshas": [{{'name' : '', 'description': ''}}]
}}
"""
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(
            content=prompt
        )
    ]

    response = await llm.ainvoke(messages)

    try:
        return json.loads(response.content)
    except json.JSONDecodeError:
        raise ValueError("LLM returned invalid JSON")

