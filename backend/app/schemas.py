from pydantic import BaseModel
from typing import Optional, List
import datetime

class ExplanationCards(BaseModel):
    simple_explanation: str
    real_life_analogy: str
    technical_terms: List[str]
    exam_ready_answer: str

class QueryRequest(BaseModel):
    query: str
    language: Optional[str] = "Telugu"
    dialect: Optional[str] = "Andhra & Telangana"
    topic: Optional[str] = "General"

class QueryResponse(BaseModel):
    session_id: str
    topic: str
    language: str
    query: str
    explanation: ExplanationCards
    created_at: datetime.datetime

class STTResponse(BaseModel):
    transcription: str
    language: str
    confidence: float
    is_mock: bool

class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = "te" # te, hi, ta, kn, ml, en
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
