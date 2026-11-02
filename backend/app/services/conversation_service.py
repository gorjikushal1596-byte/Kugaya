import uuid
import datetime
import json
import logging
from typing import Optional, List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models import Conversation, ConversationMessage, User
from app.schemas import ExplanationCards, ConversationSummary, ConversationDetail, MessageItem

logger = logging.getLogger(__name__)

class ConversationService:
    """
    Manages multi-turn student conversations:
    - Creates and fetches conversation threads.
    - Persists user prompts and assistant 5-tier explanations.
    - Restores past context to feed follow-up questions to Meta Muse Spark Open.
    """

    async def get_or_create_conversation(
        self,
        db: AsyncSession,
        conversation_id: Optional[str],
        user_id: str = "user_default",
        topic: str = "Computer Science",
        language: str = "Telugu",
        dialect: str = "Andhra & Telangana"
    ) -> Conversation:
        if conversation_id:
            res = await db.execute(
                select(Conversation)
                .filter(Conversation.id == conversation_id)
                .options(selectinload(Conversation.messages))
            )
            conv = res.scalar_one_or_none()
            if conv:
                return conv

        # Create new conversation thread
        new_id = f"conv_{uuid.uuid4().hex[:10]}"
        conv = Conversation(
            id=new_id,
            user_id=user_id,
            title="New Conversation",
            topic=topic,
            language=language,
            dialect=dialect
        )
        db.add(conv)
        await db.commit()
        await db.refresh(conv)
        return conv

    async def get_recent_history_context(
        self,
        db: AsyncSession,
        conversation_id: str,
        limit: int = 6
    ) -> List[Dict[str, str]]:
        """
        Retrieves recent turns formatted as [{"role": "user"|"assistant", "content": ...}]
        for model multi-turn prompting.
        """
        res = await db.execute(
            select(ConversationMessage)
            .filter(ConversationMessage.conversation_id == conversation_id)
            .order_by(ConversationMessage.created_at.asc())
        )
        messages = res.scalars().all()
        history: List[Dict[str, str]] = []

        for m in messages[-limit:]:
            if m.role == "user":
                history.append({"role": "user", "content": m.query})
            else:
                # Assistant summary context for follow-up reasoning
                content = m.simple_explanation or m.query
                history.append({"role": "assistant", "content": content})

        return history

    async def record_turn(
        self,
        db: AsyncSession,
        conversation_id: str,
        user_query: str,
        explanation: ExplanationCards,
        language: str,
        latency_ms: Optional[int] = None
    ) -> str:
        """
        Saves both student query and tutor explanation in conversation history.
        """
        conv = await db.get(Conversation, conversation_id)
        if conv and conv.title == "New Conversation":
            # Set dynamic title from first query
            conv.title = user_query[:40] + ("..." if len(user_query) > 40 else "")
            conv.updated_at = datetime.datetime.utcnow()

        # User message
        user_msg = ConversationMessage(
            id=f"msg_{uuid.uuid4().hex[:8]}",
            conversation_id=conversation_id,
            role="user",
            query=user_query,
            language=language
        )
        db.add(user_msg)

        # Assistant explanation message
        asst_msg_id = f"msg_{uuid.uuid4().hex[:8]}"
        asst_msg = ConversationMessage(
            id=asst_msg_id,
            conversation_id=conversation_id,
            role="assistant",
            query=user_query,
            language=language,
            simple_explanation=explanation.simple_explanation,
            real_life_analogy=explanation.real_life_analogy,
            technical_terms=json.dumps(explanation.technical_terms),
            exam_ready_answer=explanation.exam_ready_answer,
            comprehension_check=explanation.comprehension_check,
            latency_ms=latency_ms
        )
        db.add(asst_msg)
        await db.commit()
        return asst_msg_id

    async def list_conversations(
        self,
        db: AsyncSession,
        user_id: str = "user_default"
    ) -> List[ConversationSummary]:
        res = await db.execute(
            select(Conversation)
            .filter(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
            .options(selectinload(Conversation.messages))
        )
        conversations = res.scalars().all()
        return [
            ConversationSummary(
                id=c.id,
                title=c.title or "Untitled Conversation",
                topic=c.topic or "Computer Science",
                language=c.language or "Telugu",
                message_count=len(c.messages),
                created_at=c.created_at,
                updated_at=c.updated_at
            )
            for c in conversations
        ]

    async def get_conversation_detail(
        self,
        db: AsyncSession,
        conversation_id: str
    ) -> Optional[ConversationDetail]:
        res = await db.execute(
            select(Conversation)
            .filter(Conversation.id == conversation_id)
            .options(selectinload(Conversation.messages))
        )
        conv = res.scalar_one_or_none()
        if not conv:
            return None

        msg_items: List[MessageItem] = []
        for m in conv.messages:
            terms = []
            if m.technical_terms:
                try:
                    terms = json.loads(m.technical_terms)
                except Exception:
                    terms = []

            exp = None
            if m.role == "assistant":
                exp = ExplanationCards(
                    simple_explanation=m.simple_explanation or "",
                    real_life_analogy=m.real_life_analogy or "",
                    technical_terms=terms,
                    exam_ready_answer=m.exam_ready_answer or "",
                    comprehension_check=m.comprehension_check
                )

            msg_items.append(
                MessageItem(
                    id=m.id,
                    role=m.role,
                    query=m.query,
                    explanation=exp,
                    created_at=m.created_at
                )
            )

        return ConversationDetail(
            id=conv.id,
            title=conv.title or "Conversation",
            topic=conv.topic or "Computer Science",
            language=conv.language or "Telugu",
            dialect=conv.dialect or "Standard",
            messages=msg_items,
            created_at=conv.created_at
        )

conversation_service = ConversationService()

