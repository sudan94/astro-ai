from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.controller import authController
from app.models.User import User
import os

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "sudanupadhaya@gmail.com")


def require_admin(request: Request, db: Session = Depends(get_db)) -> User:
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth_header.split(" ")[1]
    user = authController.get_current_user(token, db)
    if not user or user.email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Forbidden")
    return user


@router.get("/users")
async def list_users(request: Request, db: Session = Depends(get_db)):
    require_admin(request, db)
    users = db.query(User).order_by(User.last_active_at.desc()).all()
    return {
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "avatar_url": u.avatar_url,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "last_active_at": u.last_active_at.isoformat() if u.last_active_at else None,
            }
            for u in users
        ]
    }
