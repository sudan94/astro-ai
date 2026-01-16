from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.config.database import Base


class Person(Base):

    __tablename__ = "persons"

    id = Column(Integer, primary_key= True, index=True)
    name = Column(String(255), nullable=False, index=True)
    date_of_birth = Column(DateTime, nullable=True)
    place_of_birth = Column(String(225), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
