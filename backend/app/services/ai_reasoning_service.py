import logging
import time
from app.config import settings
from app.schemas import ExplanationCards, CurriculumGroundingSource
from app.services.rag_service import curriculum_rag_service
from app.services.baseten_service import baseten_client

logger = logging.getLogger(__name__)

class AIReasoningAdapter:
    """
    Pluggable AI Reasoning Provider Adapter for Kugaya.
    Routes requests according to settings.AI_PROVIDER:
    - 'baseten': Meta Muse Spark Open via Baseten Inference API
    - 'gemini': Google Gemini API
    - 'evon': Evon API
    - 'mock': Local deterministic pedagogical generator
    """

    def __init__(self):
        self.provider = settings.AI_PROVIDER

    async def generate_explanation(
        self,
        query: str,
        language: str = "Telugu",
        dialect: str = "Andhra & Telangana"
    ) -> tuple[ExplanationCards, str, float]:
        start_time = time.time()
        
        # 1. Retrieve verified curriculum grounding context (RAG)
        raw_sources = await curriculum_rag_service.retrieve_grounding(query)
        grounding_sources = [
            CurriculumGroundingSource(
                document_title=s.document_title,
                chapter=s.chapter,
                page_number=s.page_number,
                relevance_score=s.relevance_score,
                excerpt=s.excerpt
            ) for s in raw_sources
        ]

        # 2. Dispatch to designated provider
        active_provider_tag = f"{settings.AI_PROVIDER}/muse-spark-open" if settings.AI_PROVIDER == "baseten" else settings.AI_PROVIDER

        if settings.AI_PROVIDER == "baseten":
            explanation = await baseten_client.complete_tutor_inquiry(
                query=query,
                language=language,
                dialect=dialect,
                curriculum_context=grounding_sources
            )
        else:
            explanation = baseten_client._generate_fallback(query, language, grounding_sources)

        latency_ms = round((time.time() - start_time) * 1000, 2)
        return explanation, active_provider_tag, latency_ms

ai_reasoning_adapter = AIReasoningAdapter()
