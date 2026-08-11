from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.controller import astroController
from app.controller.authController import get_current_user
from app.models.User import User
from app.schemas import astroSchema


router = APIRouter(prefix="/astro", tags=["astro"])

@router.get("/vedic-chart/{person_id}")
async def get_vedic_chart_route(
    person_id: int,
    refresh: bool = Query(
        False,
        description="Regenerate the AI analysis instead of reusing the stored one.",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get Vedic astrology chart for a person by ID"""

    chart_data = await astroController.get_vedic_chart(
        db, person_id, current_user.id, refresh=refresh
    )
    return chart_data


@router.get("/person/{person_id}", response_model=astroSchema.AstroResponse)
async def get_saved_astro_route(person_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get saved astro data (chart + analysis) for a person by ID"""
    return await astroController.get_saved_astro(db, person_id, current_user.id, generate_if_missing=True)