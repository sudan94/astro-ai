from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import timedelta
import os
import jwt
from app.config.database import get_db
from app.controller.authController import create_access_token, verify_google_token, create_or_update_user, ACCESS_TOKEN_EXPIRE_MINUTES
from app.schemas.userSchema import UserResponse
from app.models.User import User

router = APIRouter(prefix="/auth", tags=["auth"])

def get_current_user(token: str, db: Session):
    try:
        payload = jwt.decode(token, os.getenv("SECRET_KEY", "your-secret-key"), algorithms=["HS256"])
        google_id = payload.get("sub")
        if not google_id:
            return None
        return db.query(User).filter(User.google_id == google_id).first()
    except:
        return None

@router.get("/verify")
async def verify_token(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    token = auth_header.split(" ")[1]
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"user": UserResponse.from_orm(user)}

@router.post("/login")
async def login(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    google_token = data.get("token")
    if not google_token:
        raise HTTPException(status_code=400, detail="Token required")

    google_user = verify_google_token(google_token)

    google_id = google_user["sub"]
    email = google_user["email"]
    name = google_user.get("name")
    avatar_url = google_user.get("picture")

    user = create_or_update_user(db, google_id, email, name, avatar_url)

    access_token = create_access_token({"sub": user.google_id}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

    return {"token": access_token, "user": UserResponse.from_orm(user)}