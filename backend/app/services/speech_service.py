import logging
from app.config import settings
from app.schemas import STTResponse, TTSResponse

logger = logging.getLogger(__name__)

class GnaniSpeechAdapter:
    """
    Adapter for Gnani AI Speech services:
    - Gnani Prisma v2.5: Speech-to-Text (ASR) with Indian language code-mixing
    - Gnani Timbre v2.5: Text-to-Speech (TTS) with expressive Indian prosody
    """

    def __init__(self):
        self.api_key = settings.GNANI_API_KEY
        self.prisma_url = settings.GNANI_PRISMA_STT_URL
        self.timbre_url = settings.GNANI_TIMBRE_TTS_URL
        self.mock_fallback = settings.GNANI_MOCK_FALLBACK or not bool(self.api_key)

    async def transcribe_audio(self, audio_bytes: bytes, language: str = "te") -> STTResponse:
        """
        Converts speech audio bytes into code-mixed Indian language transcription.
        """
        if self.mock_fallback:
            logger.info("Gnani Prisma STT: Operating in Development Mock mode.")
            # Realistic code-mixed Telugu/Hinglish student voice query
            return STTResponse(
                transcription="Pointer dereferencing ante enti Kugaya? Null pointer exception eppudu vastundhi?",
                language=language,
                confidence=0.96,
                is_mock=True
            )
        
        # Real integration path when GNANI_API_KEY is configured
        import httpx
        headers = {"Authorization": f"Bearer {self.api_key}"}
        files = {"audio": ("input.wav", audio_bytes, "audio/wav")}
        data = {"lang": language, "model": "prisma_v2.5"}
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(self.prisma_url, headers=headers, files=files, data=data)
            resp.raise_for_status()
            result = resp.json()
            return STTResponse(
                transcription=result.get("transcript", ""),
                language=language,
                confidence=result.get("confidence", 1.0),
                is_mock=False
            )

    async def synthesize_speech(self, text: str, language: str = "te", voice_gender: str = "female") -> TTSResponse:
        """
        Synthesizes Indian language audio via Gnani Timbre v2.5.
        """
        if self.mock_fallback:
            logger.info("Gnani Timbre TTS: Operating in Development Mock mode.")
            # Tiny silent WAV base64 header for browser audio element compatibility
            mock_wav_b64 = "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
            return TTSResponse(
                audio_base64=mock_wav_b64,
                duration_seconds=3.5,
                is_mock=True
            )

        import httpx
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "lang": language,
            "gender": voice_gender,
            "engine": "timbre_v2.5"
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(self.timbre_url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return TTSResponse(
                audio_base64=data.get("audio_content", ""),
                duration_seconds=data.get("duration", 3.0),
                is_mock=False
            )

gnani_adapter = GnaniSpeechAdapter()

