import uuid
import datetime
import json
import logging
from typing import Optional, List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, delete
from sqlalchemy.orm import selectinload

from app.models import Conversation, ConversationMessage, User, SavedLesson
from app.schemas import (
    ExplanationCards,
    ConversationSummary,
    ConversationDetail,
    MessageItem,
    CurriculumGroundingSource,
    SavedLessonItem,
    SavedLessonCreate
)

logger = logging.getLogger(__name__)

class ConversationService:
    """
    Manages persistent student learning conversations and saved lesson library.
    """

    async def create_conversation(
        self,
        db: AsyncSession,
        user_id: str = "user_default",
        title: str = "New Conversation",
        topic: str = "Computer Science",
        language: str = "Telugu",
        dialect: str = "Andhra & Telangana"
    ) -> ConversationSummary:
        new_id = f"conv_{uuid.uuid4().hex[:10]}"
        conv = Conversation(
            id=new_id,
            user_id=user_id,
            title=title,
            topic=topic,
            language=language,
            dialect=dialect,
            created_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow()
        )
        db.add(conv)
        await db.commit()
        await db.refresh(conv)
        return ConversationSummary(
            id=conv.id,
            title=conv.title,
            topic=conv.topic,
            language=conv.language,
            message_count=0,
            last_message_snippet=None,
            created_at=conv.created_at,
            updated_at=conv.updated_at
        )

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
            dialect=dialect,
            created_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow()
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
        conv = await db.get(Conversation, conversation_id)
        if conv:
            if conv.title == "New Conversation" or not conv.title:
                conv.title = user_query[:40] + ("..." if len(user_query) > 40 else "")
            conv.updated_at = datetime.datetime.utcnow()

        # User message
        user_msg = ConversationMessage(
            id=f"msg_{uuid.uuid4().hex[:8]}",
            conversation_id=conversation_id,
            role="user",
            query=user_query,
            language=language,
            created_at=datetime.datetime.utcnow()
        )
        db.add(user_msg)

        # Assistant explanation message
        sources_json = None
        if explanation.curriculum_sources:
            sources_json = json.dumps([s.model_dump() for s in explanation.curriculum_sources])

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
            curriculum_sources_json=sources_json,
            latency_ms=latency_ms,
            created_at=datetime.datetime.utcnow()
        )
        db.add(asst_msg)
        await db.commit()
        return asst_msg_id

    async def list_conversations(
        self,
        db: AsyncSession,
        user_id: str = "user_default",
        search_query: Optional[str] = None
    ) -> List[ConversationSummary]:
        stmt = (
            select(Conversation)
            .filter(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
            .options(selectinload(Conversation.messages))
        )

        if search_query and search_query.strip():
            q = f"%{search_query.strip().lower()}%"
            stmt = stmt.filter(
                or_(
                    Conversation.title.ilike(q),
                    Conversation.topic.ilike(q)
                )
            )

        res = await db.execute(stmt)
        conversations = res.scalars().all()

        summaries = []
        for c in conversations:
            last_snippet = None
            if c.messages:
                last_m = c.messages[-1]
                last_snippet = (last_m.simple_explanation or last_m.query)[:80]

            summaries.append(
                ConversationSummary(
                    id=c.id,
                    title=c.title or "Untitled Conversation",
                    topic=c.topic or "Computer Science",
                    language=c.language or "Telugu",
                    message_count=len(c.messages),
                    last_message_snippet=last_snippet,
                    created_at=c.created_at,
                    updated_at=c.updated_at
                )
            )
        return summaries

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

            sources = []
            if m.curriculum_sources_json:
                try:
                    raw_s = json.loads(m.curriculum_sources_json)
                    sources = [CurriculumGroundingSource(**item) for item in raw_s]
                except Exception:
                    sources = []

            exp = None
            if m.role == "assistant":
                exp = ExplanationCards(
                    simple_explanation=m.simple_explanation or "",
                    real_life_analogy=m.real_life_analogy or "",
                    technical_terms=terms,
                    exam_ready_answer=m.exam_ready_answer or "",
                    comprehension_check=m.comprehension_check,
                    curriculum_sources=sources if sources else None
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

    async def delete_conversation(self, db: AsyncSession, conversation_id: str) -> bool:
        conv = await db.get(Conversation, conversation_id)
        if not conv:
            return False
        await db.delete(conv)
        await db.commit()
        return True

    # Saved Lessons Operations
    async def save_lesson(
        self,
        db: AsyncSession,
        user_id: str,
        item: SavedLessonCreate
    ) -> SavedLessonItem:
        lesson_id = item.id or f"saved_{uuid.uuid4().hex[:8]}"

        full_exp_json = None
        if item.full_explanation:
            full_exp_json = json.dumps(item.full_explanation.model_dump())

        curr_src_json = None
        if item.curriculum_sources:
            curr_src_json = json.dumps([s.model_dump() for s in item.curriculum_sources])

        new_lesson = SavedLesson(
            id=lesson_id,
            user_id=user_id,
            conversation_id=item.conversation_id,
            title=item.title,
            category=item.category or "Computer Science",
            key_points=item.key_points,
            full_explanation_json=full_exp_json,
            curriculum_sources_json=curr_src_json,
            tags=item.tags or "",
            saved_at=datetime.datetime.utcnow()
        )
        db.add(new_lesson)
        await db.commit()
        await db.refresh(new_lesson)

        return self._to_saved_item(new_lesson)

    async def list_saved_lessons(
        self,
        db: AsyncSession,
        user_id: str = "user_default",
        search_query: Optional[str] = None,
        category: Optional[str] = None
    ) -> List[SavedLessonItem]:
        stmt = (
            select(SavedLesson)
            .filter(SavedLesson.user_id == user_id)
            .order_by(SavedLesson.saved_at.desc())
        )

        if category and category.strip() and category.strip().lower() != "all":
            stmt = stmt.filter(SavedLesson.category.ilike(category.strip()))

        if search_query and search_query.strip():
            q = f"%{search_query.strip().lower()}%"
            stmt = stmt.filter(
                or_(
                    SavedLesson.title.ilike(q),
                    SavedLesson.key_points.ilike(q),
                    SavedLesson.category.ilike(q),
                    SavedLesson.tags.ilike(q)
                )
            )

        res = await db.execute(stmt)
        lessons = res.scalars().all()
        return [self._to_saved_item(l) for l in lessons]

    async def get_saved_lesson(self, db: AsyncSession, lesson_id: str) -> Optional[SavedLessonItem]:
        lesson = await db.get(SavedLesson, lesson_id)
        if not lesson:
            return None
        return self._to_saved_item(lesson)

    async def delete_saved_lesson(self, db: AsyncSession, lesson_id: str) -> bool:
        lesson = await db.get(SavedLesson, lesson_id)
        if not lesson:
            return False
        await db.delete(lesson)
        await db.commit()
        return True

    async def purge_user_data(self, db: AsyncSession, user_id: str = "user_default") -> Dict[str, int]:
        """
        Safely deletes all conversations and saved lessons for a user (Privacy & Data Reset).
        """
        # Count and delete conversations
        convs_res = await db.execute(select(Conversation).filter(Conversation.user_id == user_id))
        convs = convs_res.scalars().all()
        conv_count = len(convs)
        for c in convs:
            await db.delete(c)

        # Count and delete saved lessons
        lessons_res = await db.execute(select(SavedLesson).filter(SavedLesson.user_id == user_id))
        lessons = lessons_res.scalars().all()
        lesson_count = len(lessons)
        for l in lessons:
            await db.delete(l)

        await db.commit()
        return {"conversations_deleted": conv_count, "saved_lessons_deleted": lesson_count}

    def _to_saved_item(self, l: SavedLesson) -> SavedLessonItem:
        full_exp = None
        if l.full_explanation_json:
            try:
                full_exp = ExplanationCards(**json.loads(l.full_explanation_json))
            except Exception:
                full_exp = None

        curr_src = None
        if l.curriculum_sources_json:
            try:
                raw_s = json.loads(l.curriculum_sources_json)
                curr_src = [CurriculumGroundingSource(**item) for item in raw_s]
            except Exception:
                curr_src = None

        return SavedLessonItem(
            id=l.id,
            conversation_id=l.conversation_id,
            title=l.title,
            category=l.category,
            key_points=l.key_points,
            full_explanation=full_exp,
            curriculum_sources=curr_src,
            tags=l.tags,
            saved_at=l.saved_at
        )

conversation_service = ConversationService()
