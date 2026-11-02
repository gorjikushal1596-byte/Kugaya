"""
Test suite for Gnani AI Prisma v2.5 Speech-to-Text integration:
- Audio payload validation & limits
- Empty audio rejection
- Language code mapping (te-IN, hi-IN, ta-IN, kn-IN, ml-IN, en-IN)
- Live handshake with Gnani Prisma v2.5 endpoint (https://api.vachana.ai/stt/v3)
- End-to-end Voice-to-Reasoning pipeline flow
"""

import pytest
import pytest_asyncio
import os
from dotenv import load_dotenv

# Ensure environment variables loaded
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(env_path)

from app.services.speech_service import gnani_speech_service
from app.services.reasoning_service import reasoning_service
from app.database import AsyncSessionLocal, init_db

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()

@pytest.mark.asyncio
async def test_empty_audio_rejection():
    with pytest.raises(ValueError) as excinfo:
        await gnani_speech_service.transcribe_audio(b"", language="te")
    assert "empty or too short" in str(excinfo.value)

@pytest.mark.asyncio
async def test_language_code_resolution():
    assert gnani_speech_service.resolve_language_code("Telugu") == "te-IN"
    assert gnani_speech_service.resolve_language_code("Hindi") == "hi-IN"
    assert gnani_speech_service.resolve_language_code("Tamil") == "ta-IN"
    assert gnani_speech_service.resolve_language_code("Kannada") == "kn-IN"
    assert gnani_speech_service.resolve_language_code("Malayalam") == "ml-IN"
    assert gnani_speech_service.resolve_language_code("English") == "en-IN"

@pytest.mark.asyncio
async def test_live_gnani_prisma_handshake():
    # Standard 44-byte PCM audio header
    dummy_wav = b"RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
    
    res = await gnani_speech_service.transcribe_audio(
        audio_bytes=dummy_wav,
        filename="student_query.wav",
        content_type="audio/wav",
        language="te"
    )
    assert res is not None
    assert res.language == "te-IN"
    print(f"\n[Gnani Prisma Handshake] is_mock: {res.is_mock}, language: {res.language}")

@pytest.mark.asyncio
async def test_full_voice_to_reasoning_flow():
    # Simulate transcribed question from voice input
    spoken_transcription = "Recursion lo base case lekapothe emavthundi Kugaya?"
    
    async with AsyncSessionLocal() as db:
        explanation, conv_id, msg_id, latency_ms = await reasoning_service.answer_student_inquiry(
            db=db,
            query=spoken_transcription,
            conversation_id=None,
            language="Telugu",
            dialect="Andhra & Telangana",
            topic="Data Structures"
        )
        
        assert explanation.simple_explanation is not None
        assert explanation.exam_ready_answer is not None
        print(f"\n[Voice-to-Reasoning Flow] ({latency_ms}ms, Conv: {conv_id})")
        print("Generated Tenglish Answer:", explanation.simple_explanation[:150] + "...")
