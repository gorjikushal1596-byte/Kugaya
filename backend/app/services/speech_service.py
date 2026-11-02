import logging
import time
import base64
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

# Supported Voices for Timbre v2.5
TIMBRE_VOICES = {
    "female": "Nalini",
    "male": "Deepak"
}

class GnaniSpeechService:
    """
    Unified speech service for Gnani AI:
    - Speech-to-Text: Gnani Prisma v2.5 (https://api.vachana.ai/stt/v3)
    - Text-to-Speech: Gnani Timbre v2.5 (https://api.vachana.ai/api/v1/tts/inference)
    """

    def __init__(self):
        self.api_key = settings.GNANI_API_KEY
        self.prisma_url = settings.GNANI_PRISMA_STT_URL
        self.timbre_url = settings.GNANI_TIMBRE_TTS_URL
        self.timeout = settings.GNANI_TIMEOUT_SECONDS
        self.default_voice = settings.GNANI_DEFAULT_VOICE
        self.mock_fallback = settings.GNANI_MOCK_FALLBACK or not bool(
            self.api_key and self.api_key.strip() not in ("", "your_gnani_api_key_here")
        )

    def resolve_language_code(self, lang: Optional[str]) -> str:
        if not lang:
            return "te-IN"
        key = lang.strip().lower()
        return LANGUAGE_CODE_MAP.get(key, "te-IN")

    def resolve_voice(self, voice_gender: Optional[str], requested_voice: Optional[str] = None) -> str:
        if requested_voice and requested_voice.strip():
            return requested_voice.strip()
        if voice_gender and voice_gender.lower() == "male":
            return TIMBRE_VOICES["male"]
        return TIMBRE_VOICES["female"]

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
        if not audio_bytes or len(audio_bytes) < 32:
            raise ValueError("Audio payload is empty or too short for processing.")

        if len(audio_bytes) > settings.MAX_AUDIO_SIZE_BYTES:
            raise ValueError(f"Audio file size exceeds limit of {settings.MAX_AUDIO_SIZE_BYTES // (1024 * 1024)} MB.")

        lang_code = self.resolve_language_code(language)

        if self.mock_fallback:
            logger.info("Gnani Prisma STT: Operating in mock mode.")
            return STTResponse(
                transcription="Pointer dereferencing ante enti Kugaya? Null pointer exception eppudu vastundhi?",
                language=lang_code,
                confidence=0.98,
                is_mock=True
            )

        headers = {
            "X-API-Key-ID": self.api_key,
        }

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
                    if not transcript.strip() and "data" in result and isinstance(result["data"], dict):
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
        voice_gender: str = "female",
        speed: float = 1.0,
        voice_name: Optional[str] = None
    ) -> TTSResponse:
        """
        Synthesizes natural Indic speech using Gnani Timbre v2.5.
        Returns base64-encoded WAV with duration estimation.
        """
        if not text or not text.strip():
            raise ValueError("Text payload cannot be empty for speech synthesis.")

        clean_text = text.strip()
        lang_code = self.resolve_language_code(language)
        voice = self.resolve_voice(voice_gender, voice_name)

        if self.mock_fallback:
            logger.info("Gnani Timbre TTS: Operating in mock mode.")
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
            "text": clean_text,
            "voice": voice,
            "model": "timbre-v2.5",
            "language": lang_code,
            "speed": max(0.5, min(2.0, float(speed))),
            "audio_config": {
                "encoding": "linear_pcm",
                "container": "wav",
                "num_channels": 1,
                "sample_rate": 24000,
                "sample_width": 2
            }
        }

        attempt = 0
        max_attempts = 2

        while attempt < max_attempts:
            attempt += 1
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(self.timbre_url, headers=headers, json=payload)
                    resp.raise_for_status()

                    # Gnani Timbre returns raw WAV binary with 'RIFF' header
                    audio_bytes = resp.content
                    if not audio_bytes.startswith(b"RIFF"):
                        # If raw PCM, encapsulate or decode
                        logger.warning("Gnani Timbre response did not start with standard RIFF header.")

                    audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
                    
                    # Estimate duration based on PCM 24000Hz 16-bit mono (48,000 bytes per second)
                    duration_sec = round(max(0.5, (len(audio_bytes) - 44) / 48000), 2)

                    return TTSResponse(
                        audio_base64=audio_b64,
                        duration_seconds=duration_sec,
                        is_mock=False
                    )
            except Exception as e:
                logger.error(f"Gnani Timbre TTS attempt {attempt}/{max_attempts} error: {e}")
                if attempt >= max_attempts:
                    if settings.GNANI_MOCK_FALLBACK:
                        mock_wav_b64 = "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
                        return TTSResponse(
                            audio_base64=mock_wav_b64,
                            duration_seconds=3.0,
                            is_mock=True
                        )
                    raise

gnani_speech_service = GnaniSpeechService()
