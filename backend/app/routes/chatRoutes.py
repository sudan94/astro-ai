from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.schemas import chatShema
from app.controller import chatController

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/session", response_model=chatShema.ChatSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_chat_session(
    chat: chatShema.ChatSessionCreate,
    db: Session = Depends(get_db)
):
    """Create a new chat session for a person"""
    return await chatController.chat_session(db, chat)


@router.get("/person/{person_id}/sessions", response_model=list[chatShema.ChatSessionResponse])
async def list_chat_sessions_for_person(
    person_id: int,
    db: Session = Depends(get_db),
):
    """List chat sessions for a person (newest first)."""
    return await chatController.get_sessions_for_person(db, person_id)


@router.post("/message")
async def send_chat_message(
    chat: chatShema.ChatMessageCreate,
    db: Session = Depends(get_db)
):
    """Send a chat message and get AI response with astrological context"""
    return await chatController.llm_chat(db, chat)


@router.get("/session/{session_id}/history")
async def get_chat_history(
    session_id: int,
    db: Session = Depends(get_db)
):
    """Get chat history for a session"""
    history = await chatController.get_chat_history(db, session_id)
    return {"session_id": session_id, "messages": history}
