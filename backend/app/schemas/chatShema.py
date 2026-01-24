from pydantic import BaseModel, Field
from datetime import datetime

class ChatSessionCreate(BaseModel):
    person_id: int
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class ChatSessionResponse(BaseModel):
    id: int
    person_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatMessageCreate(BaseModel):
    session_id: int
    sender: str
    message: str
    timestamp: datetime = Field(default_factory=datetime.now)

class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    sender: str
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True