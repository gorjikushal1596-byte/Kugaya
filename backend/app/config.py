from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Kugaya AI Language Tutor"
    API_V1_PREFIX: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./kugaya.db"
    
    # AI Reasoning Provider (baseten | mock | gemini | evon)
    AI_PROVIDER: str = "baseten"
    
    # Baseten Meta Muse Spark Open Configuration
    BASETEN_API_KEY: Optional[str] = None
    BASETEN_BASE_URL: str = "https://inference.baseten.co/v1"
    BASETEN_MODEL_ID: str = "meta-models/muse-spark-open"
    BASETEN_TIMEOUT_SECONDS: float = 30.0
    BASETEN_MAX_RETRIES: int = 3
    
    # Fallback / Alternative Providers
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

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
