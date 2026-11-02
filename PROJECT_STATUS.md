# KUGAYA — AI-Powered Indian Language Learning Tutor
## PROJECT_STATUS.md

**Last Updated:** 2026-11-02  
**Current Milestone:** User Management and Learning Persistence Implemented & Verified.

---

### 1. User Management & Learning Persistence Architecture
- [x] **Database Audit & Schema Evolution**:
  - Reused existing SQLite database (`kugaya.db`) and SQLAlchemy Async engine.
  - Safe automatic column migration in `init_db()` (`_apply_column_migrations`) preserving all pre-existing records with zero data loss.
  - Enforced SQLite foreign key constraints (`PRAGMA foreign_keys = ON;`).
  - Cascading deletes on conversation messages when a conversation is deleted (`ondelete="CASCADE"`).
  - Preserved relationships between users, conversations, messages, saved lessons, and RAG document chunks.
- [x] **User Preferences & Profiles**:
  - Persisted attributes: `base_language`, `dialect`, `speaking_mode` ("bilingual" | "immersion"), `code_mixing_style` ("balanced_50_50" | "indic_heavy" | "english_heavy"), `explanation_complexity` ("beginner" | "intermediate" | "exam_rigorous"), `technical_terminology_mode` ("english_standard" | "vernacular_glossary"), `audio_playback_auto` (bool), `speech_playback_speed` (0.75x–1.5x), `streak_days`, `points`, `daily_goal_minutes`.
  - Stored in SQLite and cached via `localStorage` on boot for instant UI responsiveness.
  - Interactive preferences updated via `PUT /api/v1/profile` with live sync to `UserContext`.
- [x] **Multi-turn Conversation History**:
  - Full CRUD: Create, read summary list with search (`GET /api/v1/conversations?q=...`), get full message detail with citation restoration (`GET /api/v1/conversations/{id}`), continue existing threads, and delete thread (`DELETE /api/v1/conversations/{id}`).
  - Persists student queries, assistant 5-tier explanations, latency, and verified textbook citation arrays.
- [x] **Saved Lessons & Notebook**:
  - Full CRUD: Bookmarking explanations directly from the AI Tutor 5-card stream, category filtering (`GET /api/v1/saved?category=...`), keyword search (`GET /api/v1/saved?q=...`), get single lesson detail, and unsave/delete (`DELETE /api/v1/saved/{id}`).
  - Stores complete `ExplanationCards` JSON and associated `CurriculumGroundingSource` citations.
- [x] **Privacy & Data Reset**:
  - Added `DELETE /api/v1/profile/data` to purge student conversation history and saved lessons on demand while preserving base profile settings.
- [x] **Frontend Neon UI Integration**:
  - `HistoryScreen.tsx`: Real backend conversations, keyword search filter, conversation pill selector, continue in AI Tutor CTA, delete confirmation, and message thread stream.
  - `SavedScreen.tsx`: Real saved lessons, category filter chips, search input, concept review modal with full 5-tier cards, Gnani Timbre voice review player, and unsave action.
  - `LanguageScreen.tsx`: Base language selector (Telugu, Hindi, Tamil, Kannada, Malayalam, Bengali, Marathi, English), delivery mode, code-mixing ratio, complexity level, technical terminology policy, and persistent save.
  - `ProfileScreen.tsx`: Editable name, daily streak, points, daily target goal selector, speech playback speed controls (0.75x–1.5x), auto-play audio toggle, and learning data purge modal.

---

### 2. Comprehensive Test Verification (`backend/tests/`)

All 17 tests across the entire backend regression suite passed:

```
tests/test_api.py::test_health PASSED                                    [  5%]
tests/test_api.py::test_user_profile PASSED                              [ 11%]
tests/test_api.py::test_tutor_query PASSED                               [ 17%]
tests/test_api.py::test_voice_stt PASSED                                 [ 23%]
tests/test_rag_pipeline.py::test_1_curriculum_ingestion_and_indexing PASSED [ 29%]
tests/test_rag_pipeline.py::test_2_exact_curriculum_grounding_retrieval PASSED [ 35%]
tests/test_rag_pipeline.py::test_3_multilingual_tenglish_query_grounding PASSED [ 41%]
tests/test_rag_pipeline.py::test_4_technical_terminology_precision PASSED [ 47%]
tests/test_rag_pipeline.py::test_5_end_to_end_reasoning_with_rag_citations PASSED [ 52%]
tests/test_rag_pipeline.py::test_6_document_deletion_cleanup PASSED      [ 58%]
tests/test_persistence_pipeline.py::test_1_save_and_retrieve_user_preferences PASSED [ 64%]
tests/test_persistence_pipeline.py::test_2_persistence_after_simulated_restart PASSED [ 70%]
tests/test_persistence_pipeline.py::test_3_conversation_creation_and_listing PASSED [ 76%]
tests/test_persistence_pipeline.py::test_4_save_ai_response_and_multi_turn_continuation PASSED [ 82%]
tests/test_persistence_pipeline.py::test_5_saved_lessons_crud_and_search PASSED [ 88%]
tests/test_persistence_pipeline.py::test_6_delete_conversation_cascade PASSED [ 94%]
tests/test_persistence_pipeline.py::test_7_privacy_and_data_purge PASSED [100%]

====================== 17 passed in 46.59s =======================
```

- Frontend build (`tsc -b && vite build`): **PASSED** (0 errors, 692ms).

---

### 3. Complete Architecture Status
- **Speech-to-Text (STT)**: Live Gnani AI Prisma v2.5 (`https://api.vachana.ai/stt/v3`)
- **Reasoning Model**: Live Meta Muse Spark Open via Baseten (`https://inference.baseten.co/v1`)
- **Text-to-Speech (TTS)**: Live Gnani AI Timbre v2.5 (`https://api.vachana.ai/api/v1/tts/inference`)
- **Curriculum RAG**: Hybrid Dense (Multilingual Vector) + Sparse (BM25Okapi) with RRF Fusion and Chapter/Page Grounding
- **Persistence & User Management**: SQLite AsyncSession + SQLAlchemy with multi-turn conversations, saved lessons, preference migrations, and cascade integrity.
