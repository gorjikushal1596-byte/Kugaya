from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import datetime

class CurriculumGroundingSource(BaseModel):
    document_title: str
    chapter: str
    page_number: Optional[int] = None
    relevance_score: float
    excerpt: str

class CurriculumDocumentSummary(BaseModel):
    id: str
    title: str
    filename: str
    file_type: str
    subject: str
    file_size_bytes: int
    page_count: int
    chunk_count: int
    created_at: datetime.datetime

class CurriculumUploadResponse(BaseModel):
    document_id: str
    title: str
    chunks_created: int
    message: str

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

class ConversationCreateRequest(BaseModel):
    title: Optional[str] = "New Conversation"
    topic: Optional[str] = "Computer Science"
    language: Optional[str] = "Telugu"
    dialect: Optional[str] = "Andhra & Telangana"

class ConversationSummary(BaseModel):
    id: str
    title: str
    topic: str
    language: str
    message_count: int
    last_message_snippet: Optional[str] = None
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
    use_curriculum_rag: Optional[bool] = True

class TutorInquiryResponse(BaseModel):
    conversation_id: str
    message_id: str
    topic: str
    language: str
    query: str
    explanation: ExplanationCards
    provider: str = "baseten/muse-spark-open"
    latency_ms: Optional[float] = None
    has_curriculum_grounding: bool = False
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
    code_mixing_style: Optional[str] = None
    explanation_complexity: Optional[str] = None
    technical_terminology_mode: Optional[str] = None
    audio_playback_auto: Optional[bool] = None
    speech_playback_speed: Optional[float] = None
    streak_days: Optional[int] = None
    points: Optional[int] = None
    daily_goal_minutes: Optional[int] = None

class UserProfileResponse(BaseModel):
    id: str
    name: str
    base_language: str
    dialect: str
    speaking_mode: str
    code_mixing_style: str = "balanced_50_50"
    explanation_complexity: str = "intermediate"
    technical_terminology_mode: str = "english_standard"
    audio_playback_auto: bool = False
    speech_playback_speed: float = 1.0
    streak_days: int = 4
    points: int = 1250
    daily_goal_minutes: int = 20

class SavedLessonItem(BaseModel):
    id: str
    conversation_id: Optional[str] = None
    title: str
    category: str
    key_points: str
    full_explanation: Optional[ExplanationCards] = None
    curriculum_sources: Optional[List[CurriculumGroundingSource]] = None
    tags: Optional[str] = ""
    saved_at: datetime.datetime

class SavedLessonCreate(BaseModel):
    id: Optional[str] = None
    conversation_id: Optional[str] = None
    title: str
    category: Optional[str] = "Computer Science"
    key_points: str
    full_explanation: Optional[ExplanationCards] = None
    curriculum_sources: Optional[List[CurriculumGroundingSource]] = None
    tags: Optional[str] = ""

class DataPurgeResponse(BaseModel):
    status: str
    conversations_deleted: int
    saved_lessons_deleted: int
    message: str
