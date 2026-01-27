from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.controller import astroController
from app.schemas import astroSchema


router = APIRouter(prefix="/astro", tags=["astro"])

@router.get("/vedic-chart/{person_id}")
async def get_vedic_chart_route(person_id: int, db: Session = Depends(get_db)):
    """Get Vedic astrology chart for a person by ID"""

    chart_data = await astroController.get_vedic_chart(db, person_id)
    return chart_data


@router.get("/person/{person_id}", response_model=astroSchema.AstroResponse)
async def get_saved_astro_route(person_id: int, db: Session = Depends(get_db)):
    """Get saved astro data (chart + analysis) for a person by ID"""
    return await astroController.get_saved_astro(db, person_id, generate_if_missing=True)