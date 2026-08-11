import logging
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from app.models.ChatSession import ChatSession
from app.models.Chat import Chat, senderEnum
from app.models.Astro import Astro
from app.models.Person import Person
from app.schemas import chatShema
from app.utilities import context as context_builder
from app.utilities import llm
from app.utilities.prompts import CHAT_SYSTEM_PROMPT, TITLE_PROMPT_TEMPLATE
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


async def chat_session(db: Session, chat: chatShema.ChatSessionCreate):
    """Create a new chat session for a person"""
    try:
        db_chatsession = ChatSession(
            person_id=chat.person_id,
            title = "New Chat"
        )
        db.add(db_chatsession)
        db.commit()
        db.refresh(db_chatsession)

        return db_chatsession
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chat session could not be created"
        )


async def get_sessions_for_person(db: Session, person_id: int) -> List[ChatSession]:
    """List chat sessions for a person (newest first)."""
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.person_id == person_id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )
    return sessions


async def get_chat_history(db: Session, session_id: int) -> List[Dict]:
    """Get chat history for a session"""
    chats = db.query(Chat).filter(Chat.session_id == session_id).order_by(Chat.created_at.asc()).all()

    history = []
    for chat in chats:
        if chat.sender == senderEnum.user:
            history.append({"role": "user", "content": chat.message})
        elif chat.sender == senderEnum.assistant:
            history.append({"role": "assistant", "content": chat.message})

    return history


async def llm_chat(db: Session, chat: chatShema.ChatMessageCreate) -> Dict:
    """
    Process a chat message, generate AI response using astrological context,
    and save both user message and assistant response to the database.
    """
    try:
        # Verify session exists and get person_id
        session = db.query(ChatSession).filter(ChatSession.id == chat.session_id).first()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )

        person_id = session.person_id

        # Get astrological data for the person
        astro_data = db.query(Astro).filter(Astro.person_id == person_id).first()
        person_data = db.query(Person).filter(Person.id == person_id).first()

        if not astro_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Astrological data not found for this person. Please generate the chart first."
            )

        # Get chat history for context (before saving new message)
        chat_history = await get_chat_history(db, chat.session_id)

        if not chat_history:
            # Naming the session is cosmetic — never fail the user's message on it.
            try:
                await create_chat_title(db, chat.session_id, chat.message)
            except Exception:  # noqa: BLE001
                logger.warning(
                    "Title generation failed for session_id=%s", chat.session_id,
                    exc_info=True,
                )
                db.rollback()

        # Save user message
        user_chat = Chat(
            session_id=chat.session_id,
            sender=senderEnum.user,
            message=chat.message
        )
        db.add(user_chat)
        db.commit()

        # Prepare astrological context
        astro_context = prepare_astro_context(astro_data, person_data)

        # Generate AI response
        ai_response = await generate_chat_response(
            user_message=chat.message,
            astro_context=astro_context,
            chat_history=chat_history
        )

        # Save assistant response
        assistant_chat = Chat(
            session_id=chat.session_id,
            sender=senderEnum.assistant,
            message=ai_response
        )
        db.add(assistant_chat)
        db.commit()
        db.refresh(assistant_chat)

        return {
            "user_message": chat.message,
            "assistant_response": ai_response,
            "message_id": assistant_chat.id
        }

    except HTTPException:
        raise
    except llm.LLMUnavailableError:
        db.rollback()
        logger.exception("Chat model unavailable for session_id=%s", chat.session_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The astrology assistant is temporarily unavailable. Please try again."
        )
    except Exception:
        db.rollback()
        # Log the detail, return a generic message: exception text can carry
        # provider payloads and internal identifiers.
        logger.exception("Error processing chat for session_id=%s", chat.session_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing chat"
        )


def prepare_astro_context(astro_data: Astro, person_data: Person) -> str:
    """Prepare astrological context string from Astro and Person models.

    Delegates to the context builder, which renders the chart as compact facts
    instead of raw JSON — see `app/utilities/context.py` for why.
    """
    return context_builder.build_astro_context(astro_data, person_data)


async def generate_chat_response(
    user_message: str,
    astro_context: str,
    chat_history: List[Dict]
) -> str:
    """Generate AI response using LLM with astrological context.

    History is trimmed to a token budget before it is replayed, so prompt size
    (and cost per turn) stays bounded no matter how long the session runs.
    """
    trimmed_history = context_builder.trim_history(chat_history)

    if len(trimmed_history) < len(chat_history):
        logger.info(
            "chat history trimmed from %d to %d messages",
            len(chat_history),
            len(trimmed_history),
        )

    stats = context_builder.context_stats(astro_context, trimmed_history)
    logger.info(
        "chat prompt context_tokens=%d history_tokens=%d history_messages=%d",
        stats["context_tokens"],
        stats["history_tokens"],
        stats["history_messages"],
    )

    messages = [llm.SystemMessage(content=CHAT_SYSTEM_PROMPT)]

    if astro_context:
        messages.append(llm.SystemMessage(
            content=f"Astrological Context for this person:\n{astro_context}"
        ))

    for msg in trimmed_history:
        if msg["role"] == "user":
            messages.append(llm.HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            messages.append(llm.AIMessage(content=msg["content"]))

    messages.append(llm.HumanMessage(content=user_message))

    response, _call = await llm.ainvoke_text(
        messages,
        operation="chat_reply",
        temperature=0.7,
    )

    return response


async def create_chat_title(db: Session, session_id: int, message: str) -> ChatSession:
    """Update the title of a chat session"""
    response, _call = await llm.ainvoke_text(
        [llm.HumanMessage(content=TITLE_PROMPT_TEMPLATE.format(message=message))],
        operation="chat_title",
        temperature=0.7,
    )
    title = response.strip().strip('"')[:120] or "New Chat"

    chat_session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not chat_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )

    chat_session.title = title
    db.commit()
    db.refresh(chat_session)

    return chat_session


async def update_chat_session_title(db: Session, session_id: int, title: str) -> ChatSession:
    """Update chat session title."""
    chat_session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not chat_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )

    chat_session.title = title.strip()
    db.commit()
    db.refresh(chat_session)

    return chat_session


async def delete_chat_session(db: Session, session_id: int) -> None:
    """Delete a chat session and its history."""
    chat_session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not chat_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )

    db.query(Chat).filter(Chat.session_id == session_id).delete()
    db.delete(chat_session)
    db.commit()

