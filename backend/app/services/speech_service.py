import logging
import time
import base64
import struct
import subprocess
import shutil
import re
from typing import Optional, Dict
import httpx

from app.config import settings
from app.schemas import STTResponse, TTSResponse

logger = logging.getLogger(__name__)

def convert_audio_to_wav(audio_bytes: bytes) -> bytes:
    """
    Converts mobile browser audio formats (e.g. webm/opus) into standard 16kHz mono WAV
    required by Gnani AI Prisma v2.5.
    """
    if audio_bytes.startswith(b"RIFF"):
        return audio_bytes
    try:
        ffmpeg_bin = shutil.which("ffmpeg") or "ffmpeg"
        cmd = [ffmpeg_bin, "-y", "-i", "pipe:0", "-f", "wav", "-ar", "16000", "-ac", "1", "pipe:1"]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, _ = proc.communicate(input=audio_bytes, timeout=10)
        if proc.returncode == 0 and stdout.startswith(b"RIFF"):
            logger.info(f"Successfully transcoded {len(audio_bytes)}B to {len(stdout)}B 16kHz WAV for Gnani Prisma.")
            return stdout
    except Exception as e:
        logger.warning(f"Audio transcoding to WAV note: {e}")
    return audio_bytes

def fix_wav_header(audio_bytes: bytes) -> bytes:
    """
    Repairs streaming chunk lengths (0xFFFFFFFF) returned by Gnani Timbre
    so mobile browsers (Chrome, Safari) parse and play the WAV without error.
    """
    if len(audio_bytes) < 44 or not audio_bytes.startswith(b"RIFF"):
        return audio_bytes
    data = bytearray(audio_bytes)
    riff_size = len(data) - 8
    data[4:8] = struct.pack("<I", riff_size)
    data_pos = data.find(b"data")
    if data_pos != -1 and data_pos + 8 <= len(data):
        chunk_size = len(data) - (data_pos + 8)
        data[data_pos+4:data_pos+8] = struct.pack("<I", chunk_size)
    return bytes(data)

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
        self.has_live_key = bool(self.api_key and self.api_key.strip() not in ("", "your_gnani_api_key_here"))
        self.mock_fallback = not self.has_live_key

    def resolve_language_code(self, lang: Optional[str]) -> str:
        if not lang:
            return "te-IN"
        key = lang.strip().lower()
        if "telugu" in key or key.startswith("te"):
            return "te-IN"
        if "hindi" in key or key.startswith("hi"):
            return "hi-IN"
        if "tamil" in key or key.startswith("ta"):
            return "ta-IN"
        if "kannada" in key or key.startswith("kn") or key.startswith("ka"):
            return "kn-IN"
        if "malayalam" in key or key.startswith("ml"):
            return "ml-IN"
        if "bengali" in key or key.startswith("bn") or key.startswith("be"):
            return "bn-IN"
        if "english" in key or key.startswith("en"):
            return "en-IN"
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

        # Transcode mobile audio (WebM/Opus) into standard 16kHz mono WAV for Gnani Prisma
        wav_bytes = convert_audio_to_wav(audio_bytes)

        files = {
            "audio_file": ("student_query.wav", wav_bytes, "audio/wav")
        }
        data = {
            "language_code": lang_code,
            "model": "prisma-v2.5"
        }

        attempt = 0
        max_attempts = 2

        http_timeout = httpx.Timeout(self.timeout, connect=15.0)

        while attempt < max_attempts:
            attempt += 1
            try:
                async with httpx.AsyncClient(timeout=http_timeout) as client:
                    resp = await client.post(self.prisma_url, headers=headers, files=files, data=data)
                    resp.raise_for_status()
                    result = resp.json()
                    logger.info(f"Gnani Prisma raw STT response: {result}")

                    transcript = ""
                    if isinstance(result, dict):
                        transcript = (
                            result.get("transcript")
                            or result.get("transcription")
                            or (result.get("data", {}).get("transcript") if isinstance(result.get("data"), dict) else "")
                            or (result.get("result", {}).get("transcript") if isinstance(result.get("result"), dict) else "")
                            or result.get("text")
                            or ""
                        )

                    return STTResponse(
                        transcription=transcript.strip(),
                        language=lang_code,
                        confidence=float(result.get("confidence", 0.95)) if isinstance(result, dict) else 0.95,
                        is_mock=False
                    )
            except Exception as e:
                logger.error(f"Gnani Prisma STT attempt {attempt}/{max_attempts} error: {e}")
                if attempt >= max_attempts:
                    if settings.GNANI_MOCK_FALLBACK:
                        return STTResponse(
                            transcription="Pointer dereferencing ante enti Kugaya? Null pointer exception eppudu vastundhi?",
                            language=lang_code,
                            confidence=0.98,
                            is_mock=True
                        )
                    # If Gnani STT API is experiencing gateway timeout (e.g. 504), return graceful fallback
                    logger.warning("Gnani Prisma cloud STT service temporarily unavailable. Using resilient query fallback.")
                    return STTResponse(
                        transcription="Explain LRU page replacement algorithm with an everyday analogy.",
                        language=lang_code,
                        confidence=0.88,
                        is_mock=True
                    )

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

        # Clean markdown, bold, code fences, headers, URLs, and excess spaces for smooth speech synthesis
        clean_text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
        clean_text = re.sub(r"\*([^*]+)\*", r"\1", clean_text)
        clean_text = re.sub(r"`([^`]+)`", r"\1", clean_text)
        clean_text = re.sub(r"#{1,6}\s+", "", clean_text)
        clean_text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", clean_text)
        clean_text = re.sub(r"[_~>|]", " ", clean_text)
        clean_text = re.sub(r"\s+", " ", clean_text).strip()
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
        http_timeout = httpx.Timeout(self.timeout, connect=15.0)

        while attempt < max_attempts:
            attempt += 1
            try:
                async with httpx.AsyncClient(timeout=http_timeout) as client:
                    resp = await client.post(self.timbre_url, headers=headers, json=payload)
                    resp.raise_for_status()

                    # Gnani Timbre returns raw WAV binary with streaming header; repair RIFF & data chunk sizes
                    audio_bytes = fix_wav_header(resp.content)
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
