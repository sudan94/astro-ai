# app/models/user.py
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime
)
from sqlalchemy.sql import func
from app.config.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    google_id = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)

    name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)

    provider = Column(String(50), default="google", nullable=False)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now()
    )
