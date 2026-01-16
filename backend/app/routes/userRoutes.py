from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.schemas.userSchema import UserResponse, UserCreate
from app.controller.userController import create_user, get_user

router = APIRouter(prefix="/users", tags=["users"])

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user_route(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    return create_user(db, user)

@router.get("/{user_id}", response_model=UserResponse)
def get_user_route(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID"""
    return get_user(db, user_id)