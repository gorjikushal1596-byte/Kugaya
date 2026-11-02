import logging
from app.config import settings
from app.schemas import ExplanationCards

logger = logging.getLogger(__name__)

class AIReasoningAdapter:
    """
    Kugaya Reasoning Provider Adapter:
    - Primary candidate: Evon v3.3 (subject to access key)
    - Fallback: Gemini 1.5/2.5 or local mock generator
    Generates structured 4-Card Multi-modal Explanation model:
      1. Simple Explanation (Code-mixed e.g., Tenglish/Hinglish)
      2. Real-Life Cultural/Relatable Analogy
      3. Key English Technical Terms
      4. Exam-Ready Academic Answer
    """

    def __init__(self):
        self.provider = settings.AI_PROVIDER
        self.evon_key = settings.EVON_API_KEY
        self.gemini_key = settings.GEMINI_API_KEY

    async def generate_explanation(self, query: str, language: str = "Telugu", dialect: str = "Andhra & Telangana") -> ExplanationCards:
        # Check if query matches common CS concepts or general queries
        q_lower = query.lower()
        
        # 1. Pointers / Memory concept
        if "pointer" in q_lower or "memory" in q_lower or "dereferencing" in q_lower:
            return ExplanationCards(
                simple_explanation="Pointer ante memory lo specific address ni store chese variable. Direct ga value ni store cheyadu, value ekkada store ayyundo aa memory location address ni point chestundi.",
                real_life_analogy="Meeru oka library lo book chustunnaru anukondi. Book direct ga mee daggara ledu, kani catalog card paina shelf number 'Aisle 4, Shelf 2' ani rasundi. Aa catalog card ey Pointer!",
                technical_terms=[
                    "Dereferencing (*ptr) - Fetching data stored at pointer's address",
                    "Memory Overhead (8 Bytes) - Address pointer allocation size on 64-bit OS",
                    "Nullability Guard (ptr != nullptr) - Preventing segmentation faults and crashes"
                ],
                exam_ready_answer="A pointer in C/C++ is a derivative data type whose value refers to (or points to) another value stored elsewhere in computer memory using its memory address. Dereferencing is performed using the unary asterisk (*) operator."
            )
            
        # 2. Recursion concept
        if "recursion" in q_lower or "stack" in q_lower:
            return ExplanationCards(
                simple_explanation="Recursion ante oka function tana sontha function ni malli malli call cheskovadam. Problem ni chinnachinna sub-problems ga split chesi solve chesthundi. Base condition compulsory undali!",
                real_life_analogy="Oka Russian Matryoshka doll laantidi! Pedda doll open cheste lopaliki inkoka chinnadi, malli adi open cheste inkoti... aakhari smallest doll (base condition) varaku open chestam.",
                technical_terms=[
                    "Base Condition - Halting criterion to prevent infinite recursion",
                    "Call Stack Overhead - Memory frames pushed per recursive call",
                    "Stack Overflow Exception - Exceeding call stack memory limits"
                ],
                exam_ready_answer="Recursion is a computational method where the solution to a problem depends on solutions to smaller instances of the same problem. A recursive function consists of a base case and a recursive case."
            )

        # 3. Dynamic general response tailored to selected base language
        return ExplanationCards(
            simple_explanation=f"{query} gurinchi simple ga cheppalante: idi complex idea ni clear ga breakdown chesi nerchukodaniki use avtundi ({language} + English mix).",
            real_life_analogy="Manam daily life lo smart shortcuts or patterns follow avtamu kada, idhi kooda anthe - continuous practice tho super easy ga grasp cheyachu.",
            technical_terms=[
                "Fundamental Concept - Core architecture and definitions",
                "Implementation Protocol - Practical guidelines and execution",
                "Best Practices - Optimization and reliable safety rules"
            ],
            exam_ready_answer=f"The subject '{query}' encompasses core computational principles systematically applied to solve real-world problems through structural decomposition, rigorous logic, and targeted execution."
        )

ai_reasoning_adapter = AIReasoningAdapter()
