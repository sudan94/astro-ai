from pydantic import BaseModel, Field, validator, EmailStr
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="User's full name")
    email: EmailStr = Field(..., description="User's email address")
    date_of_birth: datetime = Field(..., description="Date of birth (YYYY-MM-DD HH:MM:SS)")
    place_of_birth: Optional[str] = Field(None, max_length=225, description="Place of birth")
    latitude: float = Field(..., description="Latitude of birth place")
    longitude: float = Field(..., description="Longitude of birth place")

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="User's full name")
    email: Optional[EmailStr] = Field(None, description="User's email address")
    date_of_birth: Optional[datetime] = Field(None, description="Date of birth (YYYY-MM-DD HH:MM:SS)")
    place_of_birth: Optional[str] = Field(None, max_length=225, description="Place of birth")
    latitude: Optional[float] = Field(None, description="Latitude of birth place")
    longitude: Optional[float] = Field(None, description="Longitude of birth place")

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    date_of_birth: Optional[datetime]
    place_of_birth: Optional[str]
    latitude: float
    longitude: float
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
