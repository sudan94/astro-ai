from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import timedelta
import os
import jwt
from app.config.database import get_db
from app.controller import authController
from app.schemas import userSchema
from app.models.User import User

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/verify")
async def verify_token(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    token = auth_header.split(" ")[1]
    user = authController.get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"user": userSchema.UserResponse.from_orm(user)}

@router.post("/login")
async def login(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    google_token = data.get("token")
    if not google_token:
        raise HTTPException(status_code=400, detail="Token required")

    google_user = authController.verify_google_token(google_token)

    google_id = google_user["sub"]
    email = google_user["email"]
    name = google_user.get("name")
    avatar_url = google_user.get("picture")

    user = authController.create_or_update_user(db, google_id, email, name, avatar_url)

    access_token = authController.create_access_token(user, timedelta(minutes=authController.ACCESS_TOKEN_EXPIRE_MINUTES))

    return {"token": access_token, "user": userSchema.UserResponse.from_orm(user)}