import os
import logging
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import Optional, Union, List

logger = logging.getLogger("kugaya.config")

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
    
    # Gnani AI Speech Integrations (Prisma v2.5 STT & Timbre v2.5 TTS)
    GNANI_API_KEY: Optional[str] = None
    GNANI_PRISMA_STT_URL: str = "https://api.vachana.ai/stt/v3"
    GNANI_TIMBRE_TTS_URL: str = "https://api.vachana.ai/api/v1/tts/inference"
    GNANI_MOCK_FALLBACK: bool = False
    GNANI_TIMEOUT_SECONDS: float = 25.0
    GNANI_DEFAULT_VOICE: str = "Nalini"
    MAX_AUDIO_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB
    
    # CORS
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://kugaya.vercel.app"
    ]

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
            elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    def validate_production_readiness(self) -> dict:
        """
        Validates environment readiness without ever exposing raw secret values.
        """
        has_baseten = bool(self.BASETEN_API_KEY and len(self.BASETEN_API_KEY.strip()) > 5)
        has_gnani = bool(self.GNANI_API_KEY and len(self.GNANI_API_KEY.strip()) > 5)
        
        status = {
            "environment": self.ENVIRONMENT,
            "ai_provider": self.AI_PROVIDER,
            "baseten_configured": has_baseten,
            "gnani_speech_configured": has_gnani,
            "database_type": "sqlite" if "sqlite" in self.DATABASE_URL else "postgresql",
        }
        
        if self.ENVIRONMENT == "production":
            if not has_baseten:
                logger.warning("[PRODUCTION ALERT] BASETEN_API_KEY is not configured or empty!")
            if not has_gnani:
                logger.warning("[PRODUCTION ALERT] GNANI_API_KEY is not configured or empty!")
                
        return status

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
