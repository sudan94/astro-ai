from sqlalchemy import Column, Integer, Enum, Text, DateTime
from sqlalchemy.sql import func
from app.config.database import Base
import enum

class senderEnum(enum.Enum):
    user = 1
    assistant = 2

class Chat(Base):

    __tablename__ = "chat_message"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, nullable=False, index=True)
    sender = Column(Enum(senderEnum))
    message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())