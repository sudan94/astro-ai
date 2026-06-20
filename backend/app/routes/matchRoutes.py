from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.config.database import get_db
from app.controller.authController import get_current_user
from app.controller import matchController
from app.models.User import User


router = APIRouter(prefix="/match", tags=["match"])


class MatchRequest(BaseModel):
    person1_id: int
    person2_id: int


@router.post("/kundali")
async def kundali_match(
    body: MatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await matchController.calculate_match(
        db, body.person1_id, body.person2_id, current_user
    )
