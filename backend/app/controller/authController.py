from app.config.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
import os
import jwt
import requests as http_requests
from jwt import encode as jwt_encode
from datetime import datetime, timedelta
from google.oauth2 import id_token
import google.auth.transport.requests
from app.models.User import User


SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(user: User, expires_delta: timedelta = None):
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))

    to_encode = {
        "sub": str(user.id),   # 🔑 INTERNAL USER ID
        "exp": expire,
    }

    return jwt_encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_google_token(token: str):
    # Try as ID token (JWT credential from GoogleLogin button)
    try:
        request = google.auth.transport.requests.Request()
        decoded = id_token.verify_oauth2_token(token, request, GOOGLE_CLIENT_ID)
        return decoded
    except Exception:
        pass

    # Try as OAuth2 access token (from useGoogleLogin hook)
    try:
        response = http_requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        if response.status_code == 200:
            return response.json()
    except Exception:
        pass

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

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = db.query(User).filter(User.id == int(user_id)).first()

        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Unauthorized")

        return user

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def update_user_name(db: Session, user_id: int, new_name: str):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.name = new_name
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user