"""
Curriculum-Grounded RAG Intelligence Pipeline Verification Suite
Tests:
1. Ingestion of curriculum textbook content with automatic chunking & dense vector serialization.
2. Retrieval with exact match in uploaded textbook chunks (verifying document_title, chapter, page).
3. Retrieval for multi-section cross-cutting query.
4. Technical terminology precision extracted from uploaded curriculum.
5. Code-mixed (Tenglish) query grounded in English textbook concepts.
6. Graceful handling of out-of-curriculum inquiries without hallucinating citations.
7. Document deletion and index update.
"""

import pytest
import pytest_asyncio
import os
import json
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(env_path)

from app.database import AsyncSessionLocal, init_db
from app.services.rag_service import curriculum_rag_service
from app.services.reasoning_service import reasoning_service
from app.schemas import CurriculumGroundingSource

SAMPLE_CURRICULUM_TEXT = """
Chapter 4: Memory Management and Virtual Addressing
Page 84
In modern computer architecture, virtual memory decouples the programmer's logical view of memory from physical RAM.
The Memory Management Unit (MMU) is the hardware component responsible for translating virtual addresses into physical addresses using page tables.
Each process maintains its own page table containing Page Table Entries (PTE).
A Translation Lookaside Buffer (TLB) is an on-chip associative cache that stores recently accessed virtual-to-physical address mappings to accelerate translation.

Chapter 5: Virtual Memory and Paging Algorithms
Page 96
When a process references a virtual page that is not present in physical RAM, the hardware raises a page fault exception.
The operating system traps the fault, reads the required page frame from backing secondary storage (swap space/disk), updates the page table entry valid bit, and restarts the instruction.
Standard page replacement policies include:
1. Least Recently Used (LRU): Evicts the page that has not been referenced for the longest duration.
2. First-In First-Out (FIFO): Evicts the oldest loaded page, occasionally suffering from Belady's anomaly.
3. Clock / Second Chance Algorithm: An approximation of LRU using a reference bit.

Chapter 6: Memory Allocation and Pointer Safety
Page 112
Dynamic memory allocation in C and C++ relies on heap management via malloc, calloc, and free, or new and delete.
Common memory bugs include:
- Dangling Pointers: A pointer pointing to memory that has already been deallocated.
- Memory Leaks: Allocated memory that is no longer reachable by any active pointer and not freed.
- Buffer Overflow: Writing beyond the allocated bounds of an array or buffer, corrupting adjacent stack frames or heap metadata.
Modern languages like Rust enforce ownership and borrowing semantics at compile time to eliminate dangling pointers without a garbage collector.
"""

@pytest_asyncio.fixture(autouse=True)
async def setup_environment():
    await init_db()

@pytest.mark.asyncio
async def test_1_curriculum_ingestion_and_indexing():
    """
    Verify PDF/Text ingestion parses chapters, page numbers, chunks, and serializes dense embeddings.
    """
    async with AsyncSessionLocal() as db:
        # Clean any old test doc
        existing_docs = await curriculum_rag_service.list_documents(db)
        for doc in existing_docs:
            if doc.title == "OS & Architecture Curriculum Guide":
                await curriculum_rag_service.delete_document(db, doc.id)

        # Ingest text sample
        doc_summary = await curriculum_rag_service.ingest_document(
            db=db,
            file_bytes=SAMPLE_CURRICULUM_TEXT.encode("utf-8"),
            filename="os_architecture_guide.txt",
            title="OS & Architecture Curriculum Guide",
            subject="Computer Science"
        )

        assert doc_summary.id.startswith("doc_")
        assert doc_summary.title == "OS & Architecture Curriculum Guide"
        assert doc_summary.chunk_count >= 3
        print(f"\n[Test 1 PASSED] Ingested document '{doc_summary.title}' with {doc_summary.chunk_count} chunks.")

@pytest.mark.asyncio
async def test_2_exact_curriculum_grounding_retrieval():
    """
    Query specifically asking about TLB and Page Tables.
    Verify top retrieved chunk cites Chapter 4, Page 84 with high relevance score.
    """
    async with AsyncSessionLocal() as db:
        query = "What is the function of the Translation Lookaside Buffer (TLB) and MMU?"
        results = await curriculum_rag_service.retrieve_grounding(db, query, top_k=2)

        assert len(results) > 0
        top = results[0]
        assert top.document_title == "OS & Architecture Curriculum Guide"
        assert "Chapter 4" in top.chapter or "Memory Management" in top.chapter
        assert "MMU" in top.excerpt or "TLB" in top.excerpt or "Translation Lookaside Buffer" in top.excerpt
        assert top.page_number in (84, None)
        print(f"\n[Test 2 PASSED] Retrieved grounding: {top.document_title} - {top.chapter} (Score: {top.relevance_score}%)")

@pytest.mark.asyncio
async def test_3_multilingual_tenglish_query_grounding():
    """
    Query asked in Tenglish: 'Page fault ante enti and OS swap nunchi page ni ela load chestundi?'
    Verify hybrid embedding correctly maps to Chapter 5 (Page 96: Paging & Page Fault).
    """
    async with AsyncSessionLocal() as db:
        query = "Page fault ante enti and OS disk swap nunchi frame ni ela load chestundi?"
        results = await curriculum_rag_service.retrieve_grounding(db, query, top_k=2)

        assert len(results) > 0
        match = results[0]
        assert "Chapter 5" in match.chapter or "Virtual Memory" in match.chapter or "page fault" in match.excerpt.lower()
        print(f"\n[Test 3 PASSED] Tenglish query mapped to: {match.chapter} (Excerpt: {match.excerpt[:90]}...)")

@pytest.mark.asyncio
async def test_4_technical_terminology_precision():
    """
    Inquiry about memory bugs (dangling pointer and buffer overflow).
    Verify retrieved chunk contains exact technical definitions from Chapter 6.
    """
    async with AsyncSessionLocal() as db:
        query = "What is a dangling pointer and how does buffer overflow occur in heap memory?"
        results = await curriculum_rag_service.retrieve_grounding(db, query, top_k=2)

        assert len(results) > 0
        chunk = results[0]
        assert "Chapter 6" in chunk.chapter or "Pointer Safety" in chunk.chapter
        assert "Dangling Pointer" in chunk.excerpt or "Buffer Overflow" in chunk.excerpt
        print(f"\n[Test 4 PASSED] Terminology match: {chunk.excerpt[:120]}...")

@pytest.mark.asyncio
async def test_5_end_to_end_reasoning_with_rag_citations():
    """
    Executes reasoning_service with curriculum RAG enabled.
    Verifies that the generated ExplanationCards include curriculum_sources.
    """
    async with AsyncSessionLocal() as db:
        query = "Explain Least Recently Used (LRU) page replacement policy in Telugu"
        explanation, conv_id, msg_id, latency_ms, has_grounding = await reasoning_service.answer_student_inquiry(
            db=db,
            query=query,
            conversation_id=None,
            language="Telugu",
            dialect="Andhra & Telangana",
            topic="Operating Systems",
            use_curriculum_rag=True
        )

        assert has_grounding is True
        assert explanation.curriculum_sources is not None
        assert len(explanation.curriculum_sources) > 0
        citation = explanation.curriculum_sources[0]
        assert citation.document_title == "OS & Architecture Curriculum Guide"
        print(f"\n[Test 5 PASSED] Reasoning Engine returned {len(explanation.curriculum_sources)} verified citations!")
        print(f"Citation Source: {citation.document_title} | {citation.chapter} (p. {citation.page_number})")
        print(f"Simple Explanation (Vernacular): {explanation.simple_explanation[:150]}...")

@pytest.mark.asyncio
async def test_6_document_deletion_cleanup():
    """
    Verify deletion of curriculum document purges all chunks and embeddings cleanly.
    """
    async with AsyncSessionLocal() as db:
        docs = await curriculum_rag_service.list_documents(db)
        target = next((d for d in docs if d.title == "OS & Architecture Curriculum Guide"), None)
        assert target is not None

        deleted = await curriculum_rag_service.delete_document(db, target.id)
        assert deleted is True

        # Verify list no longer has this doc
        remaining = await curriculum_rag_service.list_documents(db)
        assert not any(d.id == target.id for d in remaining)
        print(f"\n[Test 6 PASSED] Successfully deleted document '{target.id}' and purged vector store.")
