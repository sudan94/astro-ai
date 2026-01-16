from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.config.database import Base


class Astro(Base):
    __tablename__ = "astro"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, nullable=False, index=True)
    ascendent_sign = Column(String(255), nullable=True)
    vedic_chart = Column(Text, nullable=True)  # Storing chart data as JSON string

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())