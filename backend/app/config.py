from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Kugaya AI Language Tutor"
    API_V1_PREFIX: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./kugaya.db"
    
    # AI Reasoning Provider (evon | gemini | mock)
    AI_PROVIDER: str = "mock"
    EVON_API_KEY: Optional[str] = None
    EVON_API_BASE: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    
    # Gnani AI Speech Integrations
    GNANI_API_KEY: Optional[str] = None
    GNANI_PRISMA_STT_URL: str = "https://api.gnani.ai/v2.5/stt"
    GNANI_TIMBRE_TTS_URL: str = "https://api.gnani.ai/v2.5/tts"
    GNANI_MOCK_FALLBACK: bool = True
    
    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
