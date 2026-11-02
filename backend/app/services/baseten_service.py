import json
import logging
import re
import time
from typing import Optional, List, Dict, Any
import httpx

from app.config import settings
from app.schemas import ExplanationCards, CurriculumGroundingSource
from app.services.prompts import KUGAYA_PEDAGOGICAL_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

class BasetenMuseSparkClient:
    """
    Production client for Meta Muse Spark Open on Baseten.
    - Handles prompt formatting with multi-turn conversation memory.
    - Allocates internal reasoning CoT budget (max_tokens: 3072).
    - Robust JSON extractor handling raw JSON, markdown-wrapped JSON, and conversational fallbacks.
    - Rate limit backoff and bounded retries.
    """

    def __init__(self):
        self.api_key = settings.BASETEN_API_KEY
        self.base_url = settings.BASETEN_BASE_URL.rstrip("/")
        self.model_id = settings.BASETEN_MODEL_ID
        self.timeout = settings.BASETEN_TIMEOUT_SECONDS
        self.max_retries = settings.BASETEN_MAX_RETRIES

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip() not in ("", "your_baseten_api_key_here"))

    async def generate_tutor_response(
        self,
        query: str,
        language: str = "Telugu",
        dialect: str = "Andhra & Telangana",
        history_context: Optional[List[Dict[str, str]]] = None,
        curriculum_context: Optional[List[CurriculumGroundingSource]] = None
    ) -> ExplanationCards:
        """
        Sends the inquiry along with multi-turn chat history to Meta Muse Spark Open.
        """
        if not self.is_configured():
            logger.warning("Baseten API key is not configured; generating offline pedagogical fallback.")
            return self._generate_fallback(query, language, curriculum_context)

        messages = [{"role": "system", "content": KUGAYA_PEDAGOGICAL_SYSTEM_PROMPT}]

        # Inject conversation history context (limiting to last 4 exchanges to protect context window)
        if history_context:
            for item in history_context[-6:]:
                role = item.get("role", "user")
                content = item.get("content", "")
                if content:
                    messages.append({"role": role, "content": content})

        # Assemble current user prompt
        user_parts = [
            f"STUDENT INQUIRY: {query}",
            f"STUDENT PREFERRED BASE LANGUAGE: {language}",
            f"REGIONAL DIALECT: {dialect}",
        ]

        if curriculum_context:
            user_parts.append("\nVERIFIED CURRICULUM GROUNDING (TEXTBOOK EXCERPTS):")
            for idx, src in enumerate(curriculum_context, 1):
                user_parts.append(
                    f"[{idx}] Source: {src.document_title} | {src.chapter} (p. {src.page_number or 'N/A'})\n"
                    f"Excerpt: {src.excerpt}"
                )

        messages.append({"role": "user", "content": "\n".join(user_parts)})

        payload = {
            "model": self.model_id,
            "messages": messages,
            "temperature": 0.35,
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
                        logger.warning(f"Baseten rate limit hit (429). Retrying in {backoff}s...")
                        time.sleep(backoff)
                        continue

                    resp.raise_for_status()
                    data = resp.json()
                    message_obj = data["choices"][0]["message"]
                    raw_content = message_obj.get("content") or ""
                    
                    # Extract JSON object even if enclosed in markdown code fences or conversational text
                    parsed = self._extract_json(raw_content)
                    if parsed:
                        return ExplanationCards(
                            simple_explanation=parsed.get("simple_explanation", ""),
                            real_life_analogy=parsed.get("real_life_analogy", ""),
                            technical_terms=parsed.get("technical_terms", []),
                            exam_ready_answer=parsed.get("exam_ready_answer", ""),
                            comprehension_check=parsed.get("comprehension_check"),
                            curriculum_sources=curriculum_context
                        )
                    else:
                        logger.warning(f"Failed to parse JSON from Muse Spark Open output. Raw: {raw_content[:200]}")
                        return self._wrap_plain_text(raw_content, language, curriculum_context)

            except Exception as e:
                logger.error(f"Baseten call attempt {attempt}/{self.max_retries} failed: {e}")

        logger.error(f"All {self.max_retries} attempts failed. Returning offline fallback.")
        return self._generate_fallback(query, language, curriculum_context)

    def _extract_json(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Attempts direct parsing, regex curly bracket extraction, and markdown block extraction.
        """
        text = text.strip()
        try:
            return json.loads(text)
        except Exception:
            pass

        # Search for ```json ... ``` code fence
        fence_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if fence_match:
            try:
                return json.loads(fence_match.group(1))
            except Exception:
                pass

        # Search for widest { ... } block
        curly_match = re.search(r'(\{.*\})', text, re.DOTALL)
        if curly_match:
            try:
                return json.loads(curly_match.group(1))
            except Exception:
                pass

        return None

    def _wrap_plain_text(
        self,
        text: str,
        language: str,
        curriculum_context: Optional[List[CurriculumGroundingSource]]
    ) -> ExplanationCards:
        """
        Fallback formatting if the LLM provided text without strict JSON markers.
        """
        return ExplanationCards(
            simple_explanation=text,
            real_life_analogy="This concept helps simplify structural engineering and modular programming in your software systems.",
            technical_terms=["Core Concept - Fundamental mechanism", "Application - Practical use in production"],
            exam_ready_answer=f"Technical computational principle applied across modern systems ({language} context).",
            comprehension_check="How would you apply this concept in a live application?",
            curriculum_sources=curriculum_context
        )

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

        if "binary search" in q_lower:
            return ExplanationCards(
                simple_explanation="Binary Search anedhi sorted elements lo oka item ni vethakadaniki use chese fastest divide-and-conquer algorithm. Prathi step lo search space ni sagam chesthundi.",
                real_life_analogy="Meeru dictionary lo 'Kugaya' ane word vethukuthunnaru anukondi. First book exact center open chestharu. Page 'M' vachindi kabatti left half lo chustaru, right half antha direct ga discard chestaru!",
                technical_terms=[
                    "Divide-and-Conquer - Splitting search interval in half each iteration",
                    "Time Complexity O(log n) - Logarithmic search scaling",
                    "Pre-condition - Input array must be strictly sorted"
                ],
                exam_ready_answer="Binary Search is an efficient interval-halving algorithm with O(log n) time complexity that operates on sorted datasets by repeatedly comparing the target value to the middle element.",
                comprehension_check="What is the time complexity of Binary Search? (A) O(n) (B) O(log n) (C) O(n^2)",
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
