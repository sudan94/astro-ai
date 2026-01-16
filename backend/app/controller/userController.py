from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.User import User

def create_user(db: Session, user: User):
    """Create a new user"""
    db_user = User(
        google_id=user.google_id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        provider=user.provider
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user(db: Session, user_id: int) -> User:
    """Get user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user
