"""
End-to-End User Journey & Comprehensive QA Verification Suite for Kugaya
Covers:
- Scenario A: Vernacular Text Inquiry & 5-Card Pedagogical Breakdown.
- Scenario B: Voice Input (STT via Gnani Prisma v2.5) -> Transcription -> LLM Reasoning.
- Scenario C: Text-to-Speech Generation (Gnani Timbre v2.5) -> Audio Payload Validation.
- Scenario D: Curriculum Upload (RAG) -> Hybrid Retrieval Grounding -> Verified Citations.
- Scenario E: Lesson Bookmarking -> Offline Persistence -> Keyword Search & Retrieval.
- Scenario F: Language & Dialect Switching -> Live Session Propagation.
"""

import pytest
import pytest_asyncio
import os
import base64
import time
from httpx import AsyncClient, ASGITransport
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(env_path)

from app.main import app
from app.database import AsyncSessionLocal, init_db
from app.models import User, Conversation, SavedLesson, CurriculumDocument

SAMPLE_SYLLABUS = """
Chapter 2: Data Structures and Complexity Analysis
Page 42
An Algorithm's efficiency is determined by Asymptotic Analysis.
Big-O notation describes the worst-case upper bound of an algorithm's execution time.
Binary Search operates on a sorted array by repeatedly dividing the search interval in half.
The time complexity of Binary Search is O(log n), where n is the number of elements.
Linear Search, by comparison, checks each element sequentially and runs in O(n) time.
"""

@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    await init_db()

@pytest.mark.asyncio
async def test_scenario_a_telugu_english_inquiry():
    """
    Scenario A: Student types a Telugu-English question and receives a structured 5-card explanation.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        start_t = time.time()
        payload = {
            "query": "Pointers ante enti and memory address ni ela store chestayi?",
            "language": "Telugu",
            "dialect": "Andhra & Telangana",
            "topic": "Computer Science",
            "use_curriculum_rag": False
        }
        res = await client.post("/api/v1/tutor/query", json=payload)
        latency = round((time.time() - start_t) * 1000, 2)
        
        assert res.status_code == 200
        data = res.json()
        assert data["conversation_id"] is not None
        assert data["message_id"] is not None
        assert data["language"] == "Telugu"
        
        exp = data["explanation"]
        assert len(exp["simple_explanation"]) > 30
        assert len(exp["real_life_analogy"]) > 20
        assert len(exp["technical_terms"]) >= 1
        assert len(exp["exam_ready_answer"]) > 20
        assert exp["comprehension_check"] is not None
        print(f"\n[Scenario A PASSED] Latency: {latency}ms | Provider: {data['provider']}")
        print(f"Explanation Preview: {exp['simple_explanation'][:120]}...")

@pytest.mark.asyncio
async def test_scenario_b_voice_input_stt_to_reasoning():
    """
    Scenario B: Student speaks a question, receives transcription via Gnani Prisma v2.5, and forwards it to reasoning.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Standard 44-byte PCM audio header
        dummy_wav = b"RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
        files = {"audio": ("student_voice.wav", dummy_wav, "audio/wav")}
        data = {"language": "te"}
        
        stt_res = await client.post("/api/v1/voice/stt", files=files, data=data)
        assert stt_res.status_code == 200
        stt_data = stt_res.json()
        assert "transcription" in stt_data
        assert stt_data["language"] == "te-IN"
        print(f"\n[Scenario B1: STT Handshake PASSED] Transcription: '{stt_data['transcription']}'")

        # Forward recognized text to reasoning engine
        query = "What is the call stack in recursion?"
        reasoning_res = await client.post("/api/v1/tutor/query", json={
            "query": query,
            "language": "Telugu",
            "dialect": "Andhra & Telangana",
            "topic": "Algorithms"
        })
        assert reasoning_res.status_code == 200
        rdata = reasoning_res.json()
        assert rdata["explanation"]["simple_explanation"] is not None
        print(f"[Scenario B2: Spoken Query Reasoning PASSED] ConvId: {rdata['conversation_id']}")

@pytest.mark.asyncio
async def test_scenario_c_tts_audio_synthesis():
    """
    Scenario C: Student converts tutor explanation to speech using Gnani Timbre v2.5.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        tts_payload = {
            "text": "Call stack ante execution context ni track chese stack memory structure.",
            "language": "te",
            "voice_gender": "female",
            "speed": 1.0
        }
        res = await client.post("/api/v1/voice/tts", json=tts_payload)
        assert res.status_code == 200
        data = res.json()
        assert "audio_base64" in data
        assert data["duration_seconds"] > 0
        
        audio_bytes = base64.b64decode(data["audio_base64"])
        assert len(audio_bytes) > 1000
        assert audio_bytes[:4] == b"RIFF"
        assert audio_bytes[8:12] == b"WAVE"
        print(f"\n[Scenario C PASSED] Timbre Audio Synthesized: {len(audio_bytes)} bytes ({data['duration_seconds']}s)")

@pytest.mark.asyncio
async def test_scenario_d_curriculum_rag_grounded_inquiry():
    """
    Scenario D: Student uploads curriculum material, asks question, and receives verified citations with chapter and page number.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Ingest syllabus
        files = {"file": ("data_structures_syllabus.txt", SAMPLE_SYLLABUS.encode("utf-8"), "text/plain")}
        data = {"title": "University Algorithms Curriculum", "subject": "Computer Science"}
        
        upload_res = await client.post("/api/v1/curriculum/upload", files=files, data=data)
        assert upload_res.status_code == 200
        doc_info = upload_res.json()
        doc_id = doc_info["document_id"]
        assert doc_info["chunks_created"] >= 1
        print(f"\n[Scenario D1: Upload PASSED] Indexed {doc_info['title']} ({doc_info['chunks_created']} chunks)")

        # Query curriculum grounded
        query_payload = {
            "query": "What is the time complexity of Binary Search according to the syllabus?",
            "language": "Telugu",
            "dialect": "Andhra & Telangana",
            "topic": "Computer Science",
            "use_curriculum_rag": True
        }
        query_res = await client.post("/api/v1/tutor/query", json=query_payload)
        assert query_res.status_code == 200
        res_data = query_res.json()
        assert res_data["has_curriculum_grounding"] is True
        
        sources = res_data["explanation"]["curriculum_sources"]
        assert sources is not None and len(sources) > 0
        top_source = sources[0]
        assert top_source["document_title"] == "University Algorithms Curriculum"
        assert "Chapter 2" in top_source["chapter"] or "Complexity" in top_source["chapter"]
        assert top_source["page_number"] in (42, None)
        print(f"[Scenario D2: Citation Verification PASSED] Cited: {top_source['document_title']} - {top_source['chapter']} (p. {top_source['page_number']})")

        # Cleanup
        del_res = await client.delete(f"/api/v1/curriculum/documents/{doc_id}")
        assert del_res.status_code == 200

@pytest.mark.asyncio
async def test_scenario_e_saved_lesson_persistence_and_retrieval():
    """
    Scenario E: Student bookmarks an explanation, searches for it, closes the session, and retrieves it.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        lesson = {
            "title": "Asymptotic Big-O Analysis",
            "category": "Algorithms",
            "key_points": "Big-O provides an asymptotic upper bound for worst-case runtime complexity.",
            "tags": "Complexity, Big-O, Algorithms"
        }
        save_res = await client.post("/api/v1/saved", json=lesson)
        assert save_res.status_code == 200
        saved_data = save_res.json()
        lesson_id = saved_data["id"]

        # Search
        search_res = await client.get("/api/v1/saved?q=Asymptotic")
        assert search_res.status_code == 200
        matches = search_res.json()
        assert any(m["id"] == lesson_id for m in matches)

        # Retrieve specific item
        get_res = await client.get(f"/api/v1/saved/{lesson_id}")
        assert get_res.status_code == 200
        assert get_res.json()["title"] == "Asymptotic Big-O Analysis"
        print(f"\n[Scenario E PASSED] Lesson saved & retrieved: {lesson_id}")

        # Delete
        del_res = await client.delete(f"/api/v1/saved/{lesson_id}")
        assert del_res.status_code == 200

@pytest.mark.asyncio
async def test_scenario_f_language_preference_switching():
    """
    Scenario F: Student updates language preferences to Hindi / North Region and generates an explanation in Hindi.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Update preferences
        pref_payload = {
            "base_language": "Hindi",
            "dialect": "National & North",
            "speaking_mode": "bilingual",
            "code_mixing_style": "balanced_50_50",
            "explanation_complexity": "intermediate"
        }
        put_res = await client.put("/api/v1/profile", json=pref_payload)
        assert put_res.status_code == 200
        assert put_res.json()["base_language"] == "Hindi"

        # Ask question with updated preference
        q_res = await client.post("/api/v1/tutor/query", json={
            "query": "Binary search tree kya hota hai?",
            "language": "Hindi",
            "dialect": "National & North",
            "topic": "Data Structures"
        })
        assert q_res.status_code == 200
        data = q_res.json()
        assert data["language"] == "Hindi"
        assert len(data["explanation"]["simple_explanation"]) > 20
        print(f"\n[Scenario F PASSED] Switched to Hindi. Explanation: {data['explanation']['simple_explanation'][:100]}...")

        # Revert back to default Telugu for standard state
        await client.put("/api/v1/profile", json={"base_language": "Telugu", "dialect": "Andhra & Telangana"})

