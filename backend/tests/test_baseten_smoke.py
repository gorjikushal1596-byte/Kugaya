"""
Automated Smoke and Benchmark Test Suite for Baseten Meta Muse Spark Open.
Evaluates:
1. Simple English educational query
2. Telugu-English (Tenglish) query
3. Hinglish query
4. Complex Computer Science explanation
5. Question with retrieved curriculum context (RAG)
"""

import pytest
import time
from app.services.baseten_service import baseten_client
from app.services.ai_reasoning_service import ai_reasoning_adapter
from app.schemas import CurriculumGroundingSource

@pytest.mark.asyncio
async def test_english_educational_query():
    query = "Explain binary search and time complexity"
    start = time.time()
    explanation, provider, latency = await ai_reasoning_adapter.generate_explanation(
        query=query,
        language="English",
        dialect="Standard Academic"
    )
    duration = time.time() - start

    assert explanation.simple_explanation is not None
    assert len(explanation.technical_terms) > 0
    assert explanation.exam_ready_answer is not None
    print(f"\n[Test 1] English Query: {latency}ms (Wall duration: {round(duration*1000, 2)}ms), Provider: {provider}")

@pytest.mark.asyncio
async def test_telugu_english_tenglish_query():
    query = "Pointer dereferencing ante enti? Real life lo ela relate avtundi?"
    explanation, provider, latency = await ai_reasoning_adapter.generate_explanation(
        query=query,
        language="Telugu",
        dialect="Andhra & Telangana"
    )
    
    assert explanation.real_life_analogy is not None
    assert "Dereferencing" in explanation.technical_terms[0] or "Pointer" in explanation.simple_explanation
    print(f"\n[Test 2] Telugu-English Query: {latency}ms, Provider: {provider}")

@pytest.mark.asyncio
async def test_hinglish_query():
    query = "Process aur Thread mein kya farak hai?"
    explanation, provider, latency = await ai_reasoning_adapter.generate_explanation(
        query=query,
        language="Hindi",
        dialect="National & North"
    )

    assert explanation.simple_explanation is not None
    assert explanation.exam_ready_answer is not None
    print(f"\n[Test 3] Hinglish Query: {latency}ms, Provider: {provider}")

@pytest.mark.asyncio
async def test_complex_cs_explanation():
    query = "Explain Deadlock Coffman conditions and prevention in operating systems"
    explanation, provider, latency = await ai_reasoning_adapter.generate_explanation(
        query=query,
        language="Telugu",
        dialect="Andhra & Telangana"
    )

    assert len(explanation.technical_terms) >= 3
    assert explanation.exam_ready_answer is not None
    print(f"\n[Test 4] Complex CS Query: {latency}ms, Provider: {provider}")

@pytest.mark.asyncio
async def test_curriculum_grounded_rag_query():
    query = "What causes stack overflow in recursive functions?"
    explanation, provider, latency = await ai_reasoning_adapter.generate_explanation(
        query=query,
        language="Telugu",
        dialect="Andhra & Telangana"
    )

    assert explanation.curriculum_sources is not None
    assert len(explanation.curriculum_sources) > 0
    assert "Recursion" in explanation.curriculum_sources[0].chapter or "Foundations" in explanation.curriculum_sources[0].chapter
    print(f"\n[Test 5] RAG Query with Citation: {latency}ms, Grounding Chapter: {explanation.curriculum_sources[0].chapter}")
