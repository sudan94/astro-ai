from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func
from app.config.database import Base

class ChatSession(Base):

    __tablename__ = "chat_session"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())