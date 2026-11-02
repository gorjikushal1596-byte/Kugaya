# KUGAYA — AI-Powered Indian Language Learning Tutor

**KUGAYA** is an AI language and engineering tutor designed for Indian students. It delivers complex STEM, computer science, and university curriculum concepts explained through mother-tongue code-mixing (Telugu/Tenglish, Hindi/Hinglish, Tamil/Tanglish, Kannada, and Malayalam) grounded in culturally intuitive real-life analogies, technical terms, and exam-ready notes.

---

## 🌟 Architecture & Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS (Stitch "Futuristic Neon Intelligence" theme).
- **Backend**: Python 3.14 + FastAPI + Pydantic v2 + SQLite with Async SQLAlchemy (`greenlet` & `aiosqlite`).
- **Speech Integration**:
  - **Gnani AI Prisma v2.5**: High-accuracy Speech-to-Text (ASR) tuned for Indian code-mixed speech.
  - **Gnani AI Timbre v2.5**: Expressive Text-to-Speech (TTS) with natural Indian accents and intonation.
  - Includes transparent developer mock fallbacks when API keys are unconfigured.
- **Reasoning Provider Adapter**:
  - Pluggable support for Evon v3.3, Gemini 1.5/2.5 Flash, or Local Mock.
  - Generates the standard **4-Card Multi-modal Explanation Model**:
    1. *Simple Vernacular Explanation* (e.g. Tenglish)
    2. *Relatable Real-Life Analogy*
    3. *English Technical Terms Breakdown*
    4. *Exam-Ready Academic Answer*

---

## 📱 Integrated Screens (Preserving Google Stitch Neon Identity)

1. **Onboarding & Dialect Selector** (`/onboarding`): Regional language & speaking mode configuration.
2. **Home Dashboard** (`/`): Streaks, quick queries, topic carousels, and high-yield exam alerts.
3. **AI Tutor Workspace** (`/tutor`): Interactive prompt canvas rendering the 4-tier explanation stream.
4. **Voice Learning Mode** (`/voice`): Animated Neural Sound Orb visualizer with live transcription and audio playback.
5. **Learning History** (`/history`): Browsable timeline of past inquiries and concept breakdowns.
6. **Saved Lessons** (`/saved`): Bookmarked cards and exam revision notes.
7. **Language Preferences** (`/languages`): Real-time switching of native base language and dialect.
8. **Profile & Settings** (`/profile`): User mastery points, streaks, and provider diagnostics.

---

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```
Runs at `http://localhost:8000`. Swagger API documentation available at `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Runs at `http://localhost:5173`. Proxies `/api` to the FastAPI backend.

### 3. Automated Test Suite
```bash
cd backend
$env:PYTHONPATH="."
.\venv\Scripts\pytest tests/ -v
```
All tests pass (Health, Profiles, Multi-card reasoning generation, and Speech STT).

