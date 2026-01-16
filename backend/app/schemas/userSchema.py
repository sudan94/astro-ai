# app/schemas/user.py
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    google_id: str

class UserResponse(UserBase):
    id: int
    google_id: str
    is_active: bool

    class Config:
        from_attributes = True
