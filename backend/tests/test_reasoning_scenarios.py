"""
Comprehensive Verification Suite for Phase 8:
1. Explain binary search in Telugu-English (Tenglish).
2. Explain operating system processes in Hinglish.
3. Explain DBMS normalization in simple English.
4. Explain recursion using an everyday analogy.
5. Answer a follow-up question using previous conversation context.
"""

import pytest
import pytest_asyncio
import os
from dotenv import load_dotenv

# Ensure environment loaded
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(env_path)

from app.database import AsyncSessionLocal, init_db
from app.services.reasoning_service import reasoning_service

@pytest_asyncio.fixture(autouse=True)
async def prepare_db():
    await init_db()

@pytest.mark.asyncio
async def test_scenario_1_binary_search_tenglish():
    async with AsyncSessionLocal() as db:
        explanation, conv_id, msg_id, latency_ms, *_ = await reasoning_service.answer_student_inquiry(
            db=db,
            query="Explain binary search and why array must be sorted",
            conversation_id=None,
            language="Telugu",
            dialect="Andhra & Telangana",
            topic="Algorithms"
        )
        print(f"\n[Scenario 1 - Binary Search (Tenglish)] ({latency_ms}ms, Conv: {conv_id})")
        print("Simple Vernacular Explanation:", explanation.simple_explanation[:140] + "...")
        print("Analogy:", explanation.real_life_analogy[:120] + "...")
        print("Technical terms count:", len(explanation.technical_terms))
        print("Check Question:", explanation.comprehension_check)
        
        assert explanation.simple_explanation is not None
        assert len(explanation.technical_terms) >= 2
        assert explanation.exam_ready_answer is not None

@pytest.mark.asyncio
async def test_scenario_2_os_process_hinglish():
    async with AsyncSessionLocal() as db:
        explanation, conv_id, msg_id, latency_ms, *_ = await reasoning_service.answer_student_inquiry(
            db=db,
            query="What is an Operating System Process and how is it different from a thread?",
            conversation_id=None,
            language="Hindi",
            dialect="National & North",
            topic="Operating Systems"
        )
        print(f"\n[Scenario 2 - OS Process (Hinglish)] ({latency_ms}ms, Conv: {conv_id})")
        print("Simple Explanation:", explanation.simple_explanation[:140] + "...")
        assert "thread" in explanation.simple_explanation.lower() or "process" in explanation.simple_explanation.lower()

@pytest.mark.asyncio
async def test_scenario_3_dbms_normalization_english():
    async with AsyncSessionLocal() as db:
        explanation, conv_id, msg_id, latency_ms, *_ = await reasoning_service.answer_student_inquiry(
            db=db,
            query="Explain Database Normalization (1NF, 2NF, 3NF)",
            conversation_id=None,
            language="English",
            dialect="Standard Academic",
            topic="DBMS"
        )
        print(f"\n[Scenario 3 - DBMS Normalization (English)] ({latency_ms}ms, Conv: {conv_id})")
        print("Exam Ready Answer:", explanation.exam_ready_answer[:160] + "...")
        assert explanation.exam_ready_answer is not None

@pytest.mark.asyncio
async def test_scenario_4_recursion_analogy():
    async with AsyncSessionLocal() as db:
        explanation, conv_id, msg_id, latency_ms, *_ = await reasoning_service.answer_student_inquiry(
            db=db,
            query="Explain recursion using an everyday Indian analogy",
            conversation_id=None,
            language="Telugu",
            dialect="Andhra & Telangana",
            topic="Data Structures"
        )
        print(f"\n[Scenario 4 - Recursion Analogy] ({latency_ms}ms)")
        print("Real-life Analogy:", explanation.real_life_analogy)
        assert explanation.real_life_analogy is not None

@pytest.mark.asyncio
async def test_scenario_5_multi_turn_followup():
    async with AsyncSessionLocal() as db:
        # Turn 1: Primary inquiry
        exp1, conv_id, msg1, _, *_ = await reasoning_service.answer_student_inquiry(
            db=db,
            query="What is a mutex lock in OS?",
            conversation_id=None,
            language="Telugu",
            dialect="Andhra & Telangana",
            topic="Operating Systems"
        )
        assert conv_id is not None
        
        # Turn 2: Follow-up question relying on previous context
        exp2, conv_id2, msg2, latency2, *_ = await reasoning_service.answer_student_inquiry(
            db=db,
            query="What if two threads try to acquire it at the exact same millisecond? Who wins?",
            conversation_id=conv_id,
            language="Telugu",
            dialect="Andhra & Telangana",
            topic="Operating Systems"
        )
        assert conv_id2 == conv_id
        print(f"\n[Scenario 5 - Multi-turn Follow-up] ({latency2}ms, Turn 2 Msg: {msg2})")
        print("Follow-up Explanation:", exp2.simple_explanation[:160] + "...")
        assert exp2.simple_explanation is not None
