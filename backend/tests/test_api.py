import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()

@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"

@pytest.mark.asyncio
async def test_user_profile():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/profile")
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Priya"
        assert data["base_language"] == "Telugu"

@pytest.mark.asyncio
async def test_tutor_query():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "query": "What is pointer dereferencing in C++?",
            "language": "Telugu",
            "dialect": "Andhra & Telangana",
            "topic": "C++ Systems"
        }
        resp = await client.post("/api/v1/tutor/query", json=payload)
        assert resp.status_code == 200
        res = resp.json()
        assert "explanation" in res
        assert "simple_explanation" in res["explanation"]
        assert "real_life_analogy" in res["explanation"]
        assert len(res["explanation"]["technical_terms"]) > 0

@pytest.mark.asyncio
async def test_voice_stt():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Valid dummy WAV header with padding (44 bytes standard PCM header)
        dummy_wav = b"RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
        files = {"audio": ("sample.wav", dummy_wav, "audio/wav")}
        data = {"language": "te"}
        resp = await client.post("/api/v1/voice/stt", files=files, data=data)
        assert resp.status_code == 200
        res = resp.json()
        assert "transcription" in res
        assert "language" in res

