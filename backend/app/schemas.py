from pydantic import BaseModel, Field
from typing import Optional, List
import datetime

class CurriculumGroundingSource(BaseModel):
    document_title: str
    chapter: str
    page_number: Optional[int] = None
    relevance_score: float
    excerpt: str

class ExplanationCards(BaseModel):
    simple_explanation: str
    real_life_analogy: str
    technical_terms: List[str]
    exam_ready_answer: str
    comprehension_check: Optional[str] = None
    curriculum_sources: Optional[List[CurriculumGroundingSource]] = None

class MessageItem(BaseModel):
    id: str
    role: str # user | assistant
    query: str
    explanation: Optional[ExplanationCards] = None
    created_at: datetime.datetime

class ConversationSummary(BaseModel):
    id: str
    title: str
    topic: str
    language: str
    message_count: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

class ConversationDetail(BaseModel):
    id: str
    title: str
    topic: str
    language: str
    dialect: str
    messages: List[MessageItem]
    created_at: datetime.datetime

class TutorInquiryRequest(BaseModel):
    query: str
    conversation_id: Optional[str] = None
    language: Optional[str] = "Telugu"
    dialect: Optional[str] = "Andhra & Telangana"
    topic: Optional[str] = "Computer Science"

class TutorInquiryResponse(BaseModel):
    conversation_id: str
    message_id: str
    topic: str
    language: str
    query: str
    explanation: ExplanationCards
    provider: str = "baseten/muse-spark-open"
    latency_ms: Optional[float] = None
    created_at: datetime.datetime

class STTResponse(BaseModel):
    transcription: str
    language: str
    confidence: float
    is_mock: bool

class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = "te"
    voice_gender: Optional[str] = "female"
    speed: Optional[float] = 1.0

class TTSResponse(BaseModel):
    audio_base64: str
    duration_seconds: float
    is_mock: bool

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    base_language: Optional[str] = None
    dialect: Optional[str] = None
    speaking_mode: Optional[str] = None

class UserProfileResponse(BaseModel):
    id: str
    name: str
    base_language: str
    dialect: str
    speaking_mode: str
    streak_days: int = 4
    points: int = 1250

class SavedLessonItem(BaseModel):
    id: str
    title: str
    category: str
    key_points: str
    saved_at: datetime.datetime
