import logging
import time
from typing import Optional, Dict
import httpx

from app.config import settings
from app.schemas import STTResponse, TTSResponse

logger = logging.getLogger(__name__)

# BCP-47 and Gnani regional language mappings
LANGUAGE_CODE_MAP: Dict[str, str] = {
    "telugu": "te-IN",
    "te": "te-IN",
    "hindi": "hi-IN",
    "hi": "hi-IN",
    "tamil": "ta-IN",
    "ta": "ta-IN",
    "kannada": "kn-IN",
    "kn": "kn-IN",
    "malayalam": "ml-IN",
    "ml": "ml-IN",
    "english": "en-IN",
    "en": "en-IN"
}

ALLOWED_MIME_TYPES = {
    "audio/wav", "audio/x-wav", "audio/wave",
    "audio/webm", "audio/ogg", "audio/mp3", "audio/mpeg",
    "audio/flac", "audio/aac", "audio/m4a", "audio/mp4"
}

class GnaniSpeechService:
    """
    Production Speech-to-Text adapter for Gnani AI Prisma v2.5.
    - Base URL: https://api.vachana.ai/stt/v3
    - Header: X-API-Key-ID: <GNANI_API_KEY>
    - Form-data: audio_file, language_code
    - Handles code-mixed Indic speech (Tenglish, Hinglish, Tanglish, Kanglish).
    """

    def __init__(self):
        self.api_key = settings.GNANI_API_KEY
        self.prisma_url = settings.GNANI_PRISMA_STT_URL
        self.timbre_url = settings.GNANI_TIMBRE_TTS_URL
        self.timeout = settings.GNANI_TIMEOUT_SECONDS
        self.mock_fallback = settings.GNANI_MOCK_FALLBACK or not bool(self.api_key and self.api_key.strip() != "your_gnani_api_key_here")

    def resolve_language_code(self, lang: Optional[str]) -> str:
        if not lang:
            return "te-IN"
        key = lang.strip().lower()
        return LANGUAGE_CODE_MAP.get(key, "te-IN")

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        filename: str = "audio.wav",
        content_type: str = "audio/wav",
        language: str = "te"
    ) -> STTResponse:
        """
        Validates audio and sends to Gnani AI Prisma v2.5.
        """
        # 1. Validation checks
        if not audio_bytes or len(audio_bytes) < 32:
            raise ValueError("Audio payload is empty or too short for processing.")

        if len(audio_bytes) > settings.MAX_AUDIO_SIZE_BYTES:
            raise ValueError(f"Audio file size exceeds limit of {settings.MAX_AUDIO_SIZE_BYTES // (1024 * 1024)} MB.")

        lang_code = self.resolve_language_code(language)

        # 2. Mock mode if unconfigured
        if self.mock_fallback:
            logger.info("Gnani Prisma STT: Operating in mock mode.")
            return STTResponse(
                transcription="Pointer dereferencing ante enti Kugaya? Null pointer exception eppudu vastundhi?",
                language=lang_code,
                confidence=0.98,
                is_mock=True
            )

        # 3. Live call to Gnani Prisma v2.5
        headers = {
            "X-API-Key-ID": self.api_key,
        }

        # Determine proper extension
        ext = "wav"
        if "webm" in content_type:
            ext = "webm"
        elif "ogg" in content_type:
            ext = "ogg"
        elif "mp3" in content_type or "mpeg" in content_type:
            ext = "mp3"

        files = {
            "audio_file": (f"student_query.{ext}", audio_bytes, content_type)
        }
        data = {
            "language_code": lang_code,
            "model": "prisma-v2.5"
        }

        start_time = time.time()
        attempt = 0
        max_attempts = 2

        while attempt < max_attempts:
            attempt += 1
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(self.prisma_url, headers=headers, files=files, data=data)
                    resp.raise_for_status()
                    result = resp.json()

                    transcript = result.get("transcript") or result.get("transcription") or ""
                    # Handle empty transcript if speech was silent
                    if not transcript.strip():
                        # Check nested keys or alternative response shapes
                        if "data" in result and isinstance(result["data"], dict):
                            transcript = result["data"].get("transcript", "")

                    return STTResponse(
                        transcription=transcript.strip(),
                        language=lang_code,
                        confidence=float(result.get("confidence", 0.95)),
                        is_mock=False
                    )
            except Exception as e:
                logger.error(f"Gnani Prisma STT attempt {attempt}/{max_attempts} error: {e}")
                if attempt >= max_attempts:
                    if settings.GNANI_MOCK_FALLBACK:
                        logger.warning("Failing over to offline fallback mock.")
                        return STTResponse(
                            transcription="Pointer dereferencing ante enti Kugaya?",
                            language=lang_code,
                            confidence=0.90,
                            is_mock=True
                        )
                    raise

    async def synthesize_speech(
        self,
        text: str,
        language: str = "te",
        voice_gender: str = "female"
    ) -> TTSResponse:
        """
        Synthesizes natural Indic audio via Gnani Timbre v2.5.
        """
        lang_code = self.resolve_language_code(language)

        if self.mock_fallback:
            # Valid 44-byte silent WAV header for browser audio element compatibility
            mock_wav_b64 = "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
            return TTSResponse(
                audio_base64=mock_wav_b64,
                duration_seconds=3.0,
                is_mock=True
            )

        headers = {
            "X-API-Key-ID": self.api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "language_code": lang_code,
            "gender": voice_gender,
            "audio_format": "wav"
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(self.timbre_url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    return TTSResponse(
                        audio_base64=data.get("audio_content", "") or data.get("audio", ""),
                        duration_seconds=data.get("duration", 3.0),
                        is_mock=False
                    )
        except Exception as e:
            logger.warning(f"Gnani Timbre TTS live call failed ({e}); falling back to mock audio.")

        mock_wav_b64 = "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
        return TTSResponse(
            audio_base64=mock_wav_b64,
            duration_seconds=3.0,
            is_mock=True
        )

gnani_speech_service = GnaniSpeechService()
