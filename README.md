# KUGAYA — AI-Powered Indian Language STEM Learning Tutor

**KUGAYA** is an AI-powered multilingual engineering and STEM tutor designed for Indian students. It explains complex computer science and university concepts in natural mother-tongue code-mixing (Telugu/Tenglish, Hindi/Hinglish, Tamil/Tanglish, Kannada, Malayalam, and Bengali) grounded in culturally intuitive real-life analogies, technical terminology preservation, exam-ready answers, and verified curriculum citations.

---

## 🌟 Production Architecture

```
+---------------------------------------------------------------------------------------+
|                                    KUGAYA FRONTEND                                    |
|            React 19 + TypeScript + Vite (Neon Cyber-Vernacular UI - 8 Screens)        |
|                  Bundle: 357 kB JS, 34 kB CSS | Production Build: 580ms               |
+-------------------------------------------+-------------------------------------------+
                                            | (REST / Multipart / JSON)
+-------------------------------------------v-------------------------------------------+
|                                    FASTAPI BACKEND                                    |
|                      Async SQLAlchemy + Pydantic v2 + SQLite Engine                   |
+-----------+----------------------+--------------------+-------------------------------+
            |                      |                    |                               |
+-----------v-----------+ +--------v----------+ +-------v-------+ +---------------------v-----+
|    BASETEN CLOUD      | |   GNANI PRISMA    | | GNANI TIMBRE  | |       HYBRID RAG &        |
|  Meta Muse Spark Open | |     v2.5 STT      | |   v2.5 TTS    | |       PERSISTENCE         |
|  Endpoint: 2bmx5h6q   | |  Vachana STT v3   | |  Vachana TTS  | | Dense Embeddings + BM25Okapi|
|  Latency: 4.8s - 15.6s| |  Latency: ~450ms  | | Latency: 1.2s | | Reciprocal Rank Fusion (RRF)|
|  Token Cap: 3,072     | |  12 Indian Langs  | | 200+ kB Audio | | SQLite: <5ms read/write     |
+-----------------------+ +-------------------+ +---------------+ +-----------------------------+
```

### Key Integrations
1. **Primary Reasoning**: **Meta Muse Spark Open** deployed on **Baseten** (`meta-models/muse-spark-open`). Generates a 5-card pedagogical breakdown:
   - *Simple Vernacular Explanation* (conversational code-mixing)
   - *Relatable Indian Real-Life Analogy*
   - *English Technical Terms Breakdown*
   - *Exam-Ready Academic Formulation*
   - *Comprehension Check Question*
2. **Speech-to-Text (ASR)**: **Gnani AI Prisma v2.5** (`https://api.vachana.ai/stt/v3`) supporting 12 Indian languages and dialects.
3. **Text-to-Speech (TTS)**: **Gnani AI Timbre v2.5** (`https://api.vachana.ai/api/v1/tts/inference`) delivering natural Indian speech synthesis.
4. **Curriculum-Grounded RAG**: Hybrid Dense (256-dim Multilingual Embeddings) + Sparse (BM25Okapi) with Reciprocal Rank Fusion (RRF) and chapter/page textbook citation extraction.
5. **Persistence**: Async SQLAlchemy with SQLite (`PRAGMA foreign_keys = ON;`) or Managed PostgreSQL (`asyncpg`), dynamic schema migrations, and cascading thread management.

---

## 📱 8 Neon Cyber-Vernacular UI Screens

1. **Onboarding & Dialect Selector** (`/onboarding`): Configure student name, grade, native language, and dialect.
2. **Home Dashboard** (`/`): Daily streaks, quick inquiries, subject chips, and active metrics.
3. **AI Tutor Workspace** (`/tutor`): Multi-turn pedagogical chat with 5-card explanations, streaming indicator, and verified citation badges.
4. **Voice Learning Mode** (`/voice`): Full-screen conversational interface with live recording, audio visualizer, STT transcript, and auto-playback.
5. **Learning History** (`/history`): Browsable timeline of past conversations with search and thread continuation.
6. **Saved Lessons Notebook** (`/saved`): Bookmarked lessons, category filters, concept review modal, and keyword search.
7. **Language Preferences** (`/languages`): Real-time switcher for base languages (Telugu, Hindi, Tamil, Kannada, Malayalam, Bengali) and speaking modes.
8. **Profile & Settings** (`/profile`): Speech rate controls, auto-play toggles, and GDPR/privacy-compliant data purge.

---

## 🚀 Local Development Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # On Windows (or source venv/bin/activate on Linux/macOS)
pip install -r requirements.txt
cp .env.example .env      # Add BASETEN_API_KEY and GNANI_API_KEY
uvicorn app.main:app --reload --port 8000
```
- API Health: `http://localhost:8000/health`
- Swagger Docs: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

### 3. Automated Test Suite
```bash
cd backend
$env:PYTHONPATH="."
.\venv\Scripts\pytest tests/ -v
```
All 42 tests pass across API, Baseten inference, Gnani STT/TTS, RAG, and Persistence suites.

---

## 🌐 Production Deployment Guide

### Option A: Decoupled Cloud Deployment (Recommended)

#### 1. Backend on Render
1. Create a **New Web Service** connected to `gorjikushal1596-byte/Kugaya`.
2. Root Directory: `backend`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Attach Persistent Disk mounted at `/data` (1 GB).
6. Set Environment Variables:
   - `ENVIRONMENT` = `production`
   - `DEBUG` = `false`
   - `AI_PROVIDER` = `baseten`
   - `BASETEN_API_KEY` = `[Your Baseten Key]`
   - `BASETEN_BASE_URL` = `https://inference.baseten.co/v1`
   - `BASETEN_MODEL_ID` = `meta-models/muse-spark-open`
   - `GNANI_API_KEY` = `[Your Gnani Key]`
   - `DATABASE_URL` = `sqlite+aiosqlite:////data/kugaya.db`
   - `ALLOWED_ORIGINS` = `https://kugaya.vercel.app`

#### 2. Frontend on Vercel
1. Import repository `gorjikushal1596-byte/Kugaya` in Vercel.
2. Root Directory: `frontend`
3. Framework: `Vite`
4. Environment Variable:
   - `VITE_API_BASE_URL` = `https://<your-render-service>.onrender.com`
5. Deploy. SPA routing and caching headers are pre-configured in `frontend/vercel.json`.

### Option B: Unified Single-Container (Docker / Railway / Fly.io / Hugging Face Spaces)
Build and run the full stack from the root directory:
```bash
docker build -t kugaya .
docker run -p 8000:8000 -v kugaya_data:/data --env-file backend/.env kugaya
```
Access the application at `http://localhost:8000`.

---

## 🔒 Security & Privacy
- **Credential Protection**: API keys are strictly server-side; zero secrets exist in frontend client bundles.
- **Data Persistence**: Conversation histories and bookmarks persist with full foreign-key cascade integrity.
- **User Privacy**: Complete data reset modal allows students to wipe conversation histories on demand.
