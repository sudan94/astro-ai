from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from app.models.ChatSession import ChatSession
from app.models.Chat import Chat, senderEnum
from app.models.Astro import Astro
from app.schemas import chatShema
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from typing import List, Dict, Optional
import json


async def chat_session(db: Session, chat: chatShema.ChatSessionCreate):
    """Create a new chat session for a person"""
    try:
        db_chatsession = ChatSession(
            person_id=chat.person_id,
            title = "Chat Session"
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

        if not astro_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Astrological data not found for this person. Please generate the chart first."
            )

        # Get chat history for context (before saving new message)
        chat_history = await get_chat_history(db, chat.session_id)

        # Save user message
        user_chat = Chat(
            session_id=chat.session_id,
            sender=senderEnum.user,
            message=chat.message
        )
        db.add(user_chat)
        db.commit()

        # Prepare astrological context
        astro_context = prepare_astro_context(astro_data)

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
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat: {str(e)}"
        )


def prepare_astro_context(astro_data: Astro) -> str:
    """Prepare astrological context string from Astro model"""
    context_parts = []

    if astro_data.ascendent_sign:
        context_parts.append(f"Ascendant Sign: {astro_data.ascendent_sign}")

    if astro_data.summary:
        context_parts.append(f"\nChart Summary:\n{astro_data.summary}")

    if astro_data.ai_analysis:
        try:
            if isinstance(astro_data.ai_analysis, dict):
                analysis = astro_data.ai_analysis
            else:
                analysis = json.loads(astro_data.ai_analysis) if isinstance(astro_data.ai_analysis, str) else {}

            context_parts.append("\nAI Analysis:")
            context_parts.append(json.dumps(analysis, indent=2))
        except:
            pass

    if astro_data.vedic_chart:
        try:
            if isinstance(astro_data.vedic_chart, dict):
                chart = astro_data.vedic_chart
            else:
                chart = json.loads(astro_data.vedic_chart) if isinstance(astro_data.vedic_chart, str) else {}

            context_parts.append("\nVedic Chart Data:")
            context_parts.append(json.dumps(chart, indent=2))
        except:
            pass

    return "\n".join(context_parts)


async def generate_chat_response(
    user_message: str,
    astro_context: str,
    chat_history: List[Dict]
) -> str:
    """Generate AI response using LLM with astrological context"""

    llm = ChatOpenAI(
        model="gpt-4.1-mini",
        temperature=0.7,
    )

    system_prompt = """You are a knowledgeable and compassionate Vedic Astrology expert and spiritual advisor.
You help people understand their birth chart, life path, and spiritual journey based on Vedic astrology principles.

Guidelines:
- Use the provided astrological data to give personalized insights
- Be empathetic, supportive, and encouraging
- Explain astrological concepts in clear, understandable language
- If asked about something not in the chart data, acknowledge it and provide general guidance
- Maintain a conversational, friendly tone
- Reference specific aspects of their chart when relevant
- Help them understand how their chart influences their life, personality, and path
"""

    # Build conversation messages
    messages = [SystemMessage(content=system_prompt)]

    # Add astrological context as a system message
    if astro_context:
        messages.append(SystemMessage(
            content=f"Astrological Context for this person:\n{astro_context}"
        ))

    # Add chat history
    for msg in chat_history:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            messages.append(AIMessage(content=msg["content"]))

    # Add current user message
    messages.append(HumanMessage(content=user_message))

    # Generate response
    response = await llm.ainvoke(messages)

    return response.content

