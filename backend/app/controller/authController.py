from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
import os
import jwt
from jwt import encode as jwt_encode
from datetime import datetime, timedelta
from google.oauth2 import id_token
import google.auth.transport.requests
from app.models.User import User


SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt_encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_google_token(token: str):
    try:
        # Verify the token using Google's library, which handles cert fetching automatically
        request = google.auth.transport.requests.Request()
        decoded = id_token.verify_oauth2_token(token, request, GOOGLE_CLIENT_ID)
        return decoded
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid Google token")

def create_or_update_user(db: Session, google_id: str, email: str, name: str = None, avatar_url: str = None):
    user = db.query(User).filter(User.google_id == google_id).first()
    if user:
        user.name = name or user.name
        user.avatar_url = avatar_url or user.avatar_url
        user.updated_at = datetime.utcnow()
    else:
        user = User(google_id=google_id, email=email, name=name, avatar_url=avatar_url)
        db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_current_user(token: str, db: Session):
    try:
        payload = jwt.decode(
            token,
            os.getenv("SECRET_KEY", "your-secret-key"),
            algorithms=["HS256"],
        )
        google_id = payload.get("sub")
        if not google_id:
            return None
        user = db.query(User).filter(User.google_id == google_id).first()
        if not user or not user.is_active:
            return None
        return user
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_current_user_id(token: str, db: Session):
    user = get_current_user(token, db)
    return user.id if user else None