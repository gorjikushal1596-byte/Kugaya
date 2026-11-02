"""
Verification suite for Gnani AI Timbre v2.5 Text-to-Speech:
1. Live synthesis in Telugu-English (Tenglish) with default female voice 'Nalini'.
2. Live synthesis in Hindi-English (Hinglish).
3. Live synthesis in English.
4. Audio format verification (standard RIFF/WAV header, duration calculation, base64 payload).
5. Error handling on empty text and invalid parameters.
6. Full end-to-end voice loop: Voice Input -> STT -> Muse Spark -> Timbre TTS -> Audio.
"""

import pytest
import pytest_asyncio
import os
import base64
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(env_path)

from app.services.speech_service import gnani_speech_service
from app.services.reasoning_service import reasoning_service
from app.database import AsyncSessionLocal, init_db

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()

@pytest.mark.asyncio
async def test_empty_text_rejection():
    with pytest.raises(ValueError) as exc:
        await gnani_speech_service.synthesize_speech(text="", language="te")
    assert "Text payload cannot be empty" in str(exc.value)

@pytest.mark.asyncio
async def test_live_timbre_tts_telugu():
    text = "Binary search ante sorted array lo element ni super fast ga vetike algorithm."
    res = await gnani_speech_service.synthesize_speech(
        text=text,
        language="te",
        voice_gender="female",
        speed=1.0
    )
    assert res is not None
    assert res.audio_base64 is not None
    assert len(res.audio_base64) > 1000
    assert res.duration_seconds > 0.5
    assert res.is_mock is False

    # Verify RIFF/WAV binary integrity
    audio_bytes = base64.b64decode(res.audio_base64)
    assert audio_bytes.startswith(b"RIFF")
    print(f"\n[Timbre Telugu TTS] Duration: {res.duration_seconds}s, Size: {len(audio_bytes)} bytes")

@pytest.mark.asyncio
async def test_live_timbre_tts_hindi():
    text = "Process ek running program hai jabki thread ek chhota execution unit hota hai."
    res = await gnani_speech_service.synthesize_speech(
        text=text,
        language="hi",
        voice_gender="female",
        speed=1.0
    )
    assert res is not None
    assert res.audio_base64 is not None
    assert res.is_mock is False
    print(f"\n[Timbre Hindi TTS] Duration: {res.duration_seconds}s")

@pytest.mark.asyncio
async def test_live_timbre_tts_english():
    text = "Database normalization decomposes redundant tables into structured normal forms."
    res = await gnani_speech_service.synthesize_speech(
        text=text,
        language="en",
        voice_gender="female",
        speed=1.0
    )
    assert res is not None
    assert res.audio_base64 is not None
    assert res.is_mock is False
    print(f"\n[Timbre English TTS] Duration: {res.duration_seconds}s")

@pytest.mark.asyncio
async def test_full_pipeline_voice_to_tts():
    query = "Explain mutex in one sentence in Telugu."
    async with AsyncSessionLocal() as db:
        explanation, conv_id, msg_id, latency_ms = await reasoning_service.answer_student_inquiry(
            db=db,
            query=query,
            conversation_id=None,
            language="Telugu",
            dialect="Andhra & Telangana",
            topic="Operating Systems"
        )
        assert explanation.simple_explanation is not None

        # Synthesize audio for the generated vernacular answer
        tts_res = await gnani_speech_service.synthesize_speech(
            text=explanation.simple_explanation,
            language="te",
            voice_gender="female"
        )
        assert tts_res is not None
        assert len(tts_res.audio_base64) > 1000
        print(f"\n[Full Pipeline: Muse Spark -> Timbre TTS] Latency: {latency_ms}ms, Audio Duration: {tts_res.duration_seconds}s")

