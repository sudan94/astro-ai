import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.User import User

def update_user_name(db: Session, user_id: int, new_name: str):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.name = new_name
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user