from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.controller.astroController import (
    get_vedic_chart,
    get_chart_summary
)


router = APIRouter(prefix="/astro", tags=["astro"])

@router.get("/vedic-chart/{person_id}")
def get_vedic_chart_route(person_id: int, db: Session = Depends(get_db)):
    """Get Vedic astrology chart for a person by ID"""

    chart_data = get_vedic_chart(db, person_id)
    return chart_data