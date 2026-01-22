from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.controller import astroController


router = APIRouter(prefix="/astro", tags=["astro"])

@router.get("/vedic-chart/{person_id}")
async def get_vedic_chart_route(person_id: int, db: Session = Depends(get_db)):
    """Get Vedic astrology chart for a person by ID"""

    chart_data = await astroController.get_vedic_chart(db, person_id)
    return chart_data