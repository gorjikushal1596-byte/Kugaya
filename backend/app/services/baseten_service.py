import json
import logging
import re
import time
from typing import Optional, List
import httpx

from app.config import settings
from app.schemas import ExplanationCards, CurriculumGroundingSource
from app.services.prompts import KUGAYA_PEDAGOGICAL_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

class BasetenMuseSparkClient:
    """
    Dedicated OpenAI-compatible client for Meta Muse Spark Open deployed on Baseten.
    - Base URL: https://inference.baseten.co/v1 (or custom model endpoint)
    - Model: meta-models/muse-spark-open
    - Supports bounded retries, timeout enforcement, rate-limit resilience,
      CoT reasoning token budget allocation, and robust JSON extraction.
    """

    def __init__(self):
        self.api_key = settings.BASETEN_API_KEY
        self.base_url = settings.BASETEN_BASE_URL.rstrip("/")
        self.model_id = settings.BASETEN_MODEL_ID
        self.timeout = settings.BASETEN_TIMEOUT_SECONDS
        self.max_retries = settings.BASETEN_MAX_RETRIES

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip() not in ("", "your_baseten_api_key_here"))

    async def complete_tutor_inquiry(
        self,
        query: str,
        language: str = "Telugu",
        dialect: str = "Andhra & Telangana",
        curriculum_context: Optional[List[CurriculumGroundingSource]] = None
    ) -> ExplanationCards:
        """
        Sends the student inquiry and pedagogical context to Muse Spark Open on Baseten.
        """
        if not self.is_configured():
            logger.warning("Baseten API key is not configured; using offline fallback.")
            return self._generate_fallback(query, language, curriculum_context)

        # Assemble user prompt with student language and optional curriculum context
        user_message_parts = [
            f"STUDENT QUERY: {query}",
            f"LEARNER BASE LANGUAGE: {language}",
            f"REGIONAL DIALECT: {dialect}",
        ]

        if curriculum_context:
            user_message_parts.append("\nVERIFIED CURRICULUM GROUNDING (TEXTBOOK EXCERPTS):")
            for idx, src in enumerate(curriculum_context, 1):
                user_message_parts.append(
                    f"[{idx}] Source: {src.document_title} | {src.chapter} (p. {src.page_number or 'N/A'})\n"
                    f"Excerpt: {src.excerpt}"
                )

        user_content = "\n".join(user_message_parts)

        # Muse Spark Open uses internal reasoning tokens, so allocate ample max_tokens (3072)
        payload = {
            "model": self.model_id,
            "messages": [
                {"role": "system", "content": KUGAYA_PEDAGOGICAL_SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            "temperature": 0.4,
            "max_tokens": 3072
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        url = f"{self.base_url}/chat/completions"
        attempt = 0

        while attempt < self.max_retries:
            attempt += 1
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    
                    if resp.status_code == 429:
                        backoff = 2 ** attempt
                        logger.warning(f"Baseten rate limit hit (429). Backing off {backoff}s...")
                        time.sleep(backoff)
                        continue

                    resp.raise_for_status()
                    data = resp.json()
                    message_obj = data["choices"][0]["message"]
                    raw_content = message_obj.get("content") or ""
                    
                    # Extract JSON object even if enclosed in markdown code fences
                    json_match = re.search(r'\{.*\}', raw_content, re.DOTALL)
                    if json_match:
                        raw_json = json_match.group(0)
                        parsed = json.loads(raw_json)
                    else:
                        parsed = json.loads(raw_content)

                    return ExplanationCards(
                        simple_explanation=parsed.get("simple_explanation", ""),
                        real_life_analogy=parsed.get("real_life_analogy", ""),
                        technical_terms=parsed.get("technical_terms", []),
                        exam_ready_answer=parsed.get("exam_ready_answer", ""),
                        comprehension_check=parsed.get("comprehension_check"),
                        curriculum_sources=curriculum_context
                    )
            except Exception as e:
                logger.error(f"Baseten call attempt {attempt}/{self.max_retries} error: {e}")

        logger.error(f"All {self.max_retries} attempts to call Baseten Muse Spark Open failed. Using fallback.")
        return self._generate_fallback(query, language, curriculum_context)

    def _generate_fallback(
        self,
        query: str,
        language: str,
        curriculum_context: Optional[List[CurriculumGroundingSource]] = None
    ) -> ExplanationCards:
        q_lower = query.lower()

        if "pointer" in q_lower or "memory" in q_lower or "dereferencing" in q_lower:
            return ExplanationCards(
                simple_explanation="Pointer ante memory lo specific address ni store chese variable. Direct ga value ni store cheyadu, value ekkada store ayyundo aa memory location address ni point chestundi.",
                real_life_analogy="Meeru oka library lo book chustunnaru anukondi. Book direct ga mee daggara ledu, kani catalog card paina shelf number 'Aisle 4, Shelf 2' ani rasundi. Aa catalog card ey Pointer!",
                technical_terms=[
                    "Dereferencing (*ptr) - Accessing value located at pointer address",
                    "Memory Overhead (8 Bytes) - Address storage cost on 64-bit systems",
                    "Nullability Guard (ptr != nullptr) - Preventing segmentation faults and OS crashes"
                ],
                exam_ready_answer="A pointer in C/C++ is a derivative data type whose value refers to (or points to) another value stored elsewhere in computer memory using its memory address. Dereferencing is performed using the unary asterisk (*) operator.",
                comprehension_check="What happens when you dereference a null pointer? (A) Returns 0 (B) Segmentation fault / crash (C) Memory doubles",
                curriculum_sources=curriculum_context
            )

        if "recursion" in q_lower or "stack" in q_lower:
            return ExplanationCards(
                simple_explanation="Recursion ante oka function tana sontha function ni malli malli call cheskovadam. Problem ni chinnachinna sub-problems ga split chesi solve chesthundi. Base condition compulsory undali!",
                real_life_analogy="Oka Russian Matryoshka doll laantidi! Pedda doll open cheste lopaliki inkoka chinnadi, malli adi open cheste inkoti... aakhari smallest doll (base condition) varaku open chestam.",
                technical_terms=[
                    "Base Condition - Halting criterion to prevent infinite recursion",
                    "Call Stack Overhead - Memory frames pushed per recursive call",
                    "Stack Overflow Exception - Exceeding call stack memory limits"
                ],
                exam_ready_answer="Recursion is a computational method where the solution to a problem depends on solutions to smaller instances of the same problem. A recursive function consists of a base case and a recursive case.",
                comprehension_check="Without a base condition, what runtime error occurs in recursive code? (A) Memory Leak (B) StackOverflowError (C) Syntax Error",
                curriculum_sources=curriculum_context
            )

        return ExplanationCards(
            simple_explanation=f"{query} gurinchi simple ga cheppalante: idi complex idea ni clear ga breakdown chesi nerchukodaniki use avtundi ({language} + English mix).",
            real_life_analogy="Manam daily life lo smart shortcuts or patterns follow avtamu kada, idhi kooda anthe - continuous practice tho super easy ga grasp cheyachu.",
            technical_terms=[
                "Fundamental Concept - Core architecture and definitions",
                "Implementation Protocol - Practical guidelines and execution",
                "Best Practices - Optimization and reliable safety rules"
            ],
            exam_ready_answer=f"The subject '{query}' encompasses core computational principles systematically applied to solve real-world problems through structural decomposition, rigorous logic, and targeted execution.",
            comprehension_check="Can you explain in your own words how this concept connects to the foundation principles?",
            curriculum_sources=curriculum_context
        )

baseten_client = BasetenMuseSparkClient()
