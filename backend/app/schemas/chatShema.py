from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ChatSessionCreate(BaseModel):
    person_id: int
    title: str = Field(..., example="Chat about astrology")

class ChatSessionResponse(BaseModel):
    id: int
    person_id: int
    title: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class ChatMessageCreate(BaseModel):
    session_id: int
    message: str

class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    sender: str
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True