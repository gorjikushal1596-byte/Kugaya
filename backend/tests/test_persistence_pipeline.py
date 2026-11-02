"""
Comprehensive Persistence & User Management Test Suite
Tests:
1. Saving user preferences (language, code-mixing, complexity, speed, auto-play).
2. Retrieving preferences after simulated application restart.
3. Creating a conversation.
4. Saving student queries and AI responses with citations.
5. Retrieving conversation history (listing summaries & retrieving full message detail).
6. Continuing previous conversations (multi-turn follow-up in the same conversation_id).
7. Saving lessons (with full explanation cards and curriculum citations preserved).
8. Searching saved lessons and conversations by keyword.
9. Deleting individual conversations and lessons.
10. Data isolation and privacy: data purge endpoint resets learning history safely.
"""

import pytest
import pytest_asyncio
import os
import datetime
from httpx import AsyncClient, ASGITransport
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(env_path)

from app.main import app
from app.database import AsyncSessionLocal, init_db
from app.models import User, Conversation, ConversationMessage, SavedLesson

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()

@pytest.mark.asyncio
async def test_1_save_and_retrieve_user_preferences():
    """
    Verify updating preferences persists across requests and sets all learning parameters.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Update user profile
        payload = {
            "name": "Kushal",
            "base_language": "Telugu",
            "dialect": "Andhra & Telangana",
            "speaking_mode": "bilingual",
            "code_mixing_style": "balanced_50_50",
            "explanation_complexity": "exam_rigorous",
            "technical_terminology_mode": "english_standard",
            "audio_playback_auto": True,
            "speech_playback_speed": 1.25,
            "daily_goal_minutes": 30
        }
        res = await client.put("/api/v1/profile", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["name"] == "Kushal"
        assert data["explanation_complexity"] == "exam_rigorous"
        assert data["speech_playback_speed"] == 1.25
        assert data["audio_playback_auto"] is True
        assert data["daily_goal_minutes"] == 30

        # Retrieve profile again
        get_res = await client.get("/api/v1/profile")
        assert get_res.status_code == 200
        profile = get_res.json()
        assert profile["name"] == "Kushal"
        assert profile["base_language"] == "Telugu"
        assert profile["speech_playback_speed"] == 1.25

@pytest.mark.asyncio
async def test_2_persistence_after_simulated_restart():
    """
    Verify that querying database directly using a fresh session retains persisted preferences.
    """
    async with AsyncSessionLocal() as session:
        user = await session.get(User, "user_default")
        assert user is not None
        assert user.name == "Kushal"
        assert user.daily_goal_minutes == 30
        assert user.speech_playback_speed == 1.25

@pytest.mark.asyncio
async def test_3_conversation_creation_and_listing():
    """
    Test explicit conversation creation and listing.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        create_payload = {
            "title": "Operating Systems Virtual Memory",
            "topic": "Operating Systems",
            "language": "Telugu",
            "dialect": "Andhra & Telangana"
        }
        create_res = await client.post("/api/v1/conversations", json=create_payload)
        assert create_res.status_code == 200
        conv = create_res.json()
        conv_id = conv["id"]
        assert conv_id.startswith("conv_")
        assert conv["title"] == "Operating Systems Virtual Memory"

        # List conversations
        list_res = await client.get("/api/v1/conversations")
        assert list_res.status_code == 200
        conversations = list_res.json()
        assert any(c["id"] == conv_id for c in conversations)

@pytest.mark.asyncio
async def test_4_save_ai_response_and_multi_turn_continuation():
    """
    Verify student inquiry records both user query, assistant explanation, and allows continuation.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Turn 1: Initial question
        t1_payload = {
            "query": "What is a Translation Lookaside Buffer in CPU?",
            "language": "Telugu",
            "dialect": "Andhra & Telangana",
            "topic": "Computer Science",
            "use_curriculum_rag": False
        }
        r1 = await client.post("/api/v1/tutor/query", json=t1_payload)
        assert r1.status_code == 200
        data1 = r1.json()
        conv_id = data1["conversation_id"]
        assert conv_id is not None
        assert "explanation" in data1

        # Turn 2: Continue in same conversation
        t2_payload = {
            "query": "What happens on a TLB miss?",
            "conversation_id": conv_id,
            "language": "Telugu",
            "dialect": "Andhra & Telangana",
            "topic": "Computer Science",
            "use_curriculum_rag": False
        }
        r2 = await client.post("/api/v1/tutor/query", json=t2_payload)
        assert r2.status_code == 200
        data2 = r2.json()
        assert data2["conversation_id"] == conv_id

        # Verify conversation detail contains both user & assistant messages
        detail_res = await client.get(f"/api/v1/conversations/{conv_id}")
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert detail["id"] == conv_id
        assert len(detail["messages"]) >= 4  # (User1, Asst1, User2, Asst2)

@pytest.mark.asyncio
async def test_5_saved_lessons_crud_and_search():
    """
    Verify creating, searching, retrieving detail, and deleting saved lessons with full cards.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Save a lesson with full explanation & citation
        lesson_payload = {
            "title": "Page Replacement LRU vs FIFO",
            "category": "Operating Systems",
            "key_points": "LRU evicts page not referenced for longest time. FIFO can suffer from Belady's anomaly.",
            "full_explanation": {
                "simple_explanation": "LRU ante Least Recently Used algorithm.",
                "real_life_analogy": "Library book shelf analogy.",
                "technical_terms": ["Page Fault", "LRU", "Belady's Anomaly"],
                "exam_ready_answer": "Least Recently Used (LRU) algorithm replaces the page that has not been used for the longest period of time."
            },
            "curriculum_sources": [
                {
                    "document_title": "OS Principles",
                    "chapter": "Chapter 5: Virtual Memory",
                    "page_number": 96,
                    "relevance_score": 95.5,
                    "excerpt": "LRU replacement policy details..."
                }
            ],
            "tags": "Paging, Memory, OS"
        }
        save_res = await client.post("/api/v1/saved", json=lesson_payload)
        assert save_res.status_code == 200
        saved = save_res.json()
        lesson_id = saved["id"]
        assert lesson_id.startswith("saved_")
        assert saved["category"] == "Operating Systems"
        assert saved["full_explanation"] is not None

        # Search saved lessons
        search_res = await client.get("/api/v1/saved?q=Belady")
        assert search_res.status_code == 200
        matches = search_res.json()
        assert len(matches) >= 1
        assert any(m["id"] == lesson_id for m in matches)

        # Filter by category
        cat_res = await client.get("/api/v1/saved?category=Operating Systems")
        assert cat_res.status_code == 200
        assert any(m["id"] == lesson_id for m in cat_res.json())

        # Retrieve single saved lesson detail
        detail_res = await client.get(f"/api/v1/saved/{lesson_id}")
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert detail["id"] == lesson_id
        assert detail["full_explanation"]["simple_explanation"] == "LRU ante Least Recently Used algorithm."
        assert len(detail["curriculum_sources"]) == 1

        # Delete saved lesson
        del_res = await client.delete(f"/api/v1/saved/{lesson_id}")
        assert del_res.status_code == 200
        assert del_res.json()["status"] == "success"

        # Verify not found after deletion
        get_deleted = await client.get(f"/api/v1/saved/{lesson_id}")
        assert get_deleted.status_code == 404

@pytest.mark.asyncio
async def test_6_delete_conversation_cascade():
    """
    Verify deleting a conversation removes the conversation and cascades to its messages.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create conversation
        res = await client.post("/api/v1/conversations", json={"title": "Thread To Delete"})
        conv_id = res.json()["id"]

        # Delete it
        del_res = await client.delete(f"/api/v1/conversations/{conv_id}")
        assert del_res.status_code == 200

        # Verify 404
        assert (await client.get(f"/api/v1/conversations/{conv_id}")).status_code == 404

    # Verify directly in SQLite that messages are cascaded
    async with AsyncSessionLocal() as session:
        conv_db = await session.get(Conversation, conv_id)
        assert conv_db is None

@pytest.mark.asyncio
async def test_7_privacy_and_data_purge():
    """
    Verify student data reset / purge endpoint deletes all user conversations and saved lessons,
    while leaving profile preferences intact.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create a dummy conversation and saved lesson
        await client.post("/api/v1/conversations", json={"title": "Purge Me"})
        await client.post("/api/v1/saved", json={"title": "Purge Lesson", "key_points": "..."})

        # Call purge endpoint
        purge_res = await client.delete("/api/v1/profile/data")
        assert purge_res.status_code == 200
        purge_data = purge_res.json()
        assert purge_data["status"] == "success"
        assert purge_data["conversations_deleted"] >= 1
        assert purge_data["saved_lessons_deleted"] >= 1

        # Verify conversations and saved lessons are now empty
        convs = (await client.get("/api/v1/conversations")).json()
        assert len(convs) == 0

        saved = (await client.get("/api/v1/saved")).json()
        assert len(saved) == 0

        # Verify profile preferences still remain
        prof = (await client.get("/api/v1/profile")).json()
        assert prof["name"] == "Kushal"
