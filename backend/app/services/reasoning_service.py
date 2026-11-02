import logging
import time
from typing import Optional, List, Dict
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.schemas import ExplanationCards, CurriculumGroundingSource
from app.services.rag_service import curriculum_rag_service
from app.services.baseten_service import baseten_client
from app.services.conversation_service import conversation_service

logger = logging.getLogger(__name__)

class AIReasoningService:
    """
    Central AI Reasoning Engine for Kugaya:
    - Coordinates curriculum grounding retrieval (RAG).
    - Fetches multi-turn conversation memory for follow-up questions.
    - Dispatches prompt to Meta Muse Spark Open on Baseten.
    - Persists conversational turns and records latency metrics.
    """

    async def answer_student_inquiry(
        self,
        db: AsyncSession,
        query: str,
        conversation_id: Optional[str] = None,
        language: str = "Telugu",
        dialect: str = "Andhra & Telangana",
        topic: str = "Computer Science",
        use_curriculum_rag: bool = True
    ) -> tuple[ExplanationCards, str, str, float, bool]:
        start_time = time.time()

        # 1. Ensure conversation session exists
        conv = await conversation_service.get_or_create_conversation(
            db=db,
            conversation_id=conversation_id,
            user_id="user_default",
            topic=topic,
            language=language,
            dialect=dialect
        )

        # 2. Retrieve multi-turn history context for context-aware follow-up reasoning
        history_context = await conversation_service.get_recent_history_context(
            db=db,
            conversation_id=conv.id,
            limit=6
        )

        # 3. Retrieve verified curriculum grounding context (RAG)
        grounding_sources: List[CurriculumGroundingSource] = []
        has_curriculum_grounding = False

        if use_curriculum_rag:
            raw_sources = await curriculum_rag_service.retrieve_grounding(db, query)
            grounding_sources = [
                CurriculumGroundingSource(
                    document_title=s.document_title,
                    chapter=s.chapter,
                    page_number=s.page_number,
                    relevance_score=s.relevance_score,
                    excerpt=s.excerpt
                ) for s in raw_sources
            ]
            has_curriculum_grounding = any(
                s.document_title != "AICTE / Standard University Engineering Syllabus"
                for s in grounding_sources
            )

        # 4. Generate structured 5-card pedagogical breakdown
        explanation = await baseten_client.generate_tutor_response(
            query=query,
            language=language,
            dialect=dialect,
            history_context=history_context,
            curriculum_context=grounding_sources if grounding_sources else None
        )

        latency_ms = round((time.time() - start_time) * 1000, 2)

        # 5. Persist the turn to conversation database
        message_id = await conversation_service.record_turn(
            db=db,
            conversation_id=conv.id,
            user_query=query,
            explanation=explanation,
            language=language,
            latency_ms=int(latency_ms)
        )

        return explanation, conv.id, message_id, latency_ms, has_curriculum_grounding

reasoning_service = AIReasoningService()

