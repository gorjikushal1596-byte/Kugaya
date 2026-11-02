import logging
import time
from app.config import settings
from app.schemas import ExplanationCards
from app.database import AsyncSessionLocal
from app.services.reasoning_service import reasoning_service

logger = logging.getLogger(__name__)

class AIReasoningAdapter:
    """
    Pluggable AI Reasoning Provider Adapter for Kugaya.
    Delegates cleanly to Kugaya's central Reasoning Service with persistent session.
    """

    def __init__(self):
        self.provider = settings.AI_PROVIDER

    async def generate_explanation(
        self,
        query: str,
        language: str = "Telugu",
        dialect: str = "Andhra & Telangana",
        topic: str = "Computer Science"
    ) -> tuple[ExplanationCards, str, float]:
        async with AsyncSessionLocal() as db:
            explanation, conv_id, msg_id, latency_ms, has_grounding = await reasoning_service.answer_student_inquiry(
                db=db,
                query=query,
                conversation_id=None,
                language=language,
                dialect=dialect,
                topic=topic
            )
            provider_tag = f"baseten/{settings.BASETEN_MODEL_ID.split('/')[-1]}"
            return explanation, provider_tag, latency_ms

ai_reasoning_adapter = AIReasoningAdapter()
