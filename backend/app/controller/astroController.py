from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.Person import Person
from typing import Dict, Optional
from app.utilities.astro_calc import calculate_vedic_chart
from app.models.Astro import Astro


def get_vedic_chart(db: Session, person_id: int) -> Dict:
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
    if not astro_entry:
        astro_entry = Astro(
            person_id=person_id,
            vedic_chart=str(chart_data),
            ascendent_sign=chart_data.get("ascendant_sign")
        )
        db.add(astro_entry)
    else:
        astro_entry.vedic_chart = str(chart_data)
        astro_entry.ascendent_sign = chart_data.get("ascendant_sign")

    db.commit()
    db.refresh(astro_entry)

    return chart_data


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

    if "nakshatra" in chart_data:
        summary_parts.append(f"Nakshatra: {chart_data['nakshatra']}")

    if "ascendant" in chart_data:
        summary_parts.append(f"Ascendant: {chart_data['ascendant']:.2f}")

    if "planets" in chart_data:
        summary_parts.append("\nPlanetary Positions:")
        for planet, data in chart_data["planets"].items():
            sign = data.get("sign", "Unknown")
            longitude = data.get("longitude", 0)
            summary_parts.append(f"  {planet}: {longitude:.2f} ({sign})")

    return "\n".join(summary_parts)
