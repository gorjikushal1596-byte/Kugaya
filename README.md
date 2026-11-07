# 🌌 KUGAYA — AI-Powered Multilingual STEM Learning Tutor

<p align="center">
  <img src="https://raw.githubusercontent.com/gorjikushal1596-byte/Kugaya/main/frontend/src/assets/kugaya-preview.png" alt="Kugaya AI Banner" width="800" onerror="this.style.display='none'" />
</p>

<p align="center">
  <strong>Master Complex Engineering Concepts in Your Mother Tongue with Culturally Intuitive Analogies, Voice-First Tutoring, and Exam-Ready Academic Notes.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Baseten_Meta_Muse_Spark_Open-FF6B6B?style=for-the-badge" alt="Baseten Meta Muse Spark Open" />
  <img src="https://img.shields.io/badge/Gnani_AI_Prisma_&_Timbre-7928CA?style=for-the-badge" alt="Gnani AI" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/SQLite_%2F_PostgreSQL-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="Database" />
</p>

---

## 📖 Overview

**KUGAYA** is an AI-powered multilingual STEM and engineering learning platform tailored for Indian students. While engineering education in India is predominantly delivered in English, millions of students think and learn most effectively in their native vernacular languages. 

KUGAYA bridges this linguistic divide by explaining complex computer science, data structures, algorithms, and university curricula using **natural mother-tongue code-mixing** (*Tenglish, Hinglish, Tanglish, Kannada, Malayalam, Bengali*). Every inquiry is distilled into a structured **5-card pedagogical breakdown**, paired with real-life cultural analogies, preserved technical English keywords, university exam formulation, and natural Indic voice synthesis.

---

## ⚡ Live API Connectivity Matrix

All core backend integrations have been tested and verified:

| Integration / API | Service Provider | Purpose | Status |
| :--- | :--- | :--- | :--- |
| **Meta Muse Spark Open** | **Baseten Cloud** (`meta-models/muse-spark-open`) | Primary Multi-Turn Reasoning & 5-Card Pedagogical Engine | ✅ **CONNECTED (HTTP 200 OK)** |
| **Timbre v2.5 TTS** | **Gnani AI** (`https://api.vachana.ai/api/v1/tts/inference`) | Natural Indic Text-to-Speech Voice Synthesis | ✅ **CONNECTED (Live Indic Audio)** |
| **Prisma v2.5 STT** | **Gnani AI** (`https://api.vachana.ai/stt/v3`) | Multilingual Speech-to-Text Recognition (12 Indian Languages) | ✅ **REACHABLE & READY** |
| **Curriculum RAG** | **Hybrid Dense + BM25Okapi** | Retrieval-Augmented Textbook & University Syllabus Grounding | ✅ **CONNECTED & INDEXED** |
| **Persistence Engine** | **SQLite (Async SQLAlchemy + aiosqlite)** | User Profiles, Multi-Turn History, Bookmarks, and Notes | ✅ **INITIALIZED & PERSISTENT** |

---

## ✨ Key Features & Capabilities

### 1. 🔮 Futuristic Floating Neural Orb & Cosmic Silk Ribbons
* **Dual Neon Spherical Rim**: Glowing cyan (`#00f0ff`) and electric purple (`#e879f9`) halo with deep-space glassmorphic dark backdrop.
* **3D Spherical Dot-Matrix Hologram**: Multi-latitude particle lattice inside the sphere with forward perspective tilt creating a transparent hologram globe.
* **Undulating Plasma Containment Ring**: Smooth organic SVG wave contour wrapping the sphere that gently rotates and ripples.
* **7-Bar Dynamic Equalizer**: Neon pill capsule bars (`#00f0ff` to `#c084fc`) centered inside the orb that react dynamically to speaking cadence timings and live microphone input.
* **Flowing Cosmic Silk Ribbons**: Multi-layered horizontal purple and cyan soundwave ribbons undulating across the dark canvas with fine harmonic strands.
* **Interactive Feature Pills**: Quick-access shortcuts for `🎓 Explain Concepts`, `⚡ Solve Doubts`, `📖 Use Your Curriculum`, and `🔊 Speak & Listen`.

### 2. 🎴 5-Tier Conceptual Pedagogical Framework
Every inquiry submitted via voice or text produces a multi-tiered breakdown:
1. **Simple Vernacular Explanation**: Conversational mother-tongue code-mixing (e.g. *Tenglish/Hinglish*) making concepts instantly understandable.
2. **Culturally Intuitive Analogy**: Relatable real-world analogies drawn from everyday Indian life (e.g. Dabba tiffin sets for Recursion, Railway token rings for Mutexes, Post office queues for Round Robin).
3. **English Technical Vocabulary**: English industry terms with clear vernacular definitions to ensure academic and career readiness.
4. **Exam-Ready Academic Answer**: Formal, high-scoring textbook definitions and bullet points structured for 8–10 mark university exam questions.
5. **Comprehension Check**: Interactive scenario-based check to reinforce understanding and test edge cases.

### 3. 🔊 Individual Card Voice Controls (`NeonAudioPlayer`)
* **Independent Card Synthesis**: Every single card in the breakdown can be synthesized into Indic speech on demand via Gnani Timbre v2.5.
* **Discrete Playback Controls**: Dedicated **Pause** (amber), **Resume** (emerald), and **Stop** (red) buttons that stay visible and synchronized with browser audio.
* **Instant In-Memory Caching**: Synthesized audio is cached in-memory per card—tapping Listen again plays immediately with zero network delay.
* **Audio Coordinator**: Guarantees that starting audio on one card automatically pauses any other card so audio streams never collide.
* **Scrubber & Speed Controls**: Fine-grained seeking with timeline slider, replay, and variable speed playback (0.75x, 1x, 1.25x, 1.5x).

### 4. 📚 Verified Curriculum Grounding (RAG)
* Dual sparse (BM25Okapi) and dense multilingual vector indexing over AICTE, Anna University, JNTU, and VTU engineering syllabi.
* Textbook and syllabus citations with document title, chapter number, page references, and accredited relevance match percentages.

---

## 🏛️ System Architecture

```
+---------------------------------------------------------------------------------------+
|                                    KUGAYA FRONTEND                                    |
|          React 19 + TypeScript + Vite + Tailwind CSS (Neon Cyber-Vernacular UI)       |
|                 Floating Neural Orb Visualizer • NeonAudioPlayer Components           |
+-------------------------------------------+-------------------------------------------+
                                            | (REST / JSON / Multipart Audio)
+-------------------------------------------v-------------------------------------------+
|                                    FASTAPI BACKEND                                    |
|           Async SQLAlchemy 2.0 • Pydantic v2 • Audio Transcoding • Rate Limiting      |
+-----------+----------------------+--------------------+-------------------------------+
            |                      |                    |                               |
+-----------v-----------+ +--------v----------+ +-------v-------+ +---------------------v-----+
|    BASETEN CLOUD      | |   GNANI PRISMA    | | GNANI TIMBRE  | |       HYBRID RAG &        |
|  Meta Muse Spark Open | |     v2.5 STT      | |   v2.5 TTS    | |       PERSISTENCE         |
|  Reasoning Engine     | |  Vachana STT v3   | |  Vachana TTS  | | Dense Embeddings + BM25Okapi|
|  Model: muse-spark-open| |  12 Indian Langs | |  Indic Voice  | | Reciprocal Rank Fusion (RRF)|
|  Token Cap: 3,072     | |  Low Latency ASR  | |  WAV Repair   | | SQLite (aiosqlite) / Postgres|
+-----------------------+ +-------------------+ +---------------+ +-----------------------------+
```

---

## 📱 Application Screens

| Screen | Route | Description |
| :--- | :--- | :--- |
| **Home Dashboard** | `/` | Greeting banner, streak tracking, quick search pill, continue learning carousel, and high-yield exam topics. |
| **Futuristic Voice Mode** | `/voice` | Floating 3D Neural Orb with cosmic silk ribbons, audio-reactive visualizer, live STT preview, and full multi-modal explanation stream. |
| **AI Tutor Workspace** | `/tutor` | Multi-turn conversational tutor workspace with 5-card explanations, individual card voice-over, and curriculum grounding citations. |
| **Learning History** | `/history` | Browsable timeline of past conversations with search and session continuation. |
| **Saved Lessons Notebook** | `/saved` | Bookmarked lessons and concepts with category filters and revision views. |
| **Language & Dialect** | `/languages` | Language selector supporting Telugu, Hindi, Tamil, Kannada, Malayalam, Bengali, and English. |
| **User Profile & Settings** | `/profile` | Audio speed settings, daily goals, learning statistics, and GDPR-compliant data purge. |
| **Onboarding** | `/onboarding` | Welcoming setup flow for new students to customize their learning profile. |

---

## 🛠️ Project Structure

```
KUGAYA AI/
├── backend/
│   ├── app/
│   │   ├── services/
│   │   │   ├── baseten_service.py       # Baseten Meta Muse Spark Open LLM client
│   │   │   ├── speech_service.py        # Gnani Prisma STT & Timbre TTS client with WAV repair
│   │   │   ├── reasoning_service.py     # Central AI orchestration coordinating RAG & LLM
│   │   │   ├── conversation_service.py  # Multi-turn history & saved lessons manager
│   │   │   ├── rag_service.py           # Hybrid Dense + BM25Okapi curriculum retrieval
│   │   │   └── prompts.py               # Pedagogical system prompt & guidelines
│   │   ├── api.py                       # FastAPI REST endpoints
│   │   ├── config.py                    # Pydantic BaseSettings environment validation
│   │   ├── database.py                  # Async SQLAlchemy session factory & migrations
│   │   ├── main.py                      # FastAPI application entrypoint & CORS
│   │   ├── models.py                    # SQLAlchemy database tables (User, Conversation, Message, Lesson)
│   │   └── schemas.py                   # Pydantic request/response data contracts
│   ├── tests/                           # Comprehensive test suite (42 tests)
│   ├── requirements.txt                 # Backend Python dependencies
│   └── .env.example                     # Environment template
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── NeuralOrb.tsx            # Floating 3D Orb & cosmic silk soundwave ribbons
│   │   │   ├── NeonAudioPlayer.tsx      # Multi-state card audio player (Pause, Resume, Stop)
│   │   │   ├── ExplanationStream.tsx    # 5-card multi-modal pedagogical layout
│   │   │   └── ...                      # UI cards, badges, and layout widgets
│   │   ├── pages/
│   │   │   ├── HomeScreen.tsx           # Home dashboard
│   │   │   ├── VoiceScreen.tsx          # Dedicated voice learning session with Neural Orb
│   │   │   ├── TutorScreen.tsx          # Interactive multi-turn tutor workspace
│   │   │   ├── HistoryScreen.tsx        # Conversation history & archive
│   │   │   ├── SavedScreen.tsx          # Bookmarked concepts library
│   │   │   └── ProfileScreen.tsx        # User settings & learning analytics
│   │   ├── utils/
│   │   │   └── audioCoordinator.ts      # Audio coordinator preventing overlapping voice streams
│   │   ├── hooks/
│   │   │   └── useAudioRecorder.ts      # Cross-browser microphone recording hook
│   │   ├── services/
│   │   │   └── api.ts                   # Typed frontend API client
│   │   └── index.css                    # Tailwind CSS + custom keyframe animations
│   ├── package.json                     # Frontend dependencies
│   └── vite.config.ts                   # Vite bundler configuration & local API proxy
│
└── README.md                            # Comprehensive project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Python**: 3.10+ (Recommended: Python 3.11)
* **Node.js**: 18.0+ (Recommended: Node 20 or 22)
* **npm** or **pnpm**
* **Git**

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

Open `backend/.env` and provide your API keys:
```env
ENVIRONMENT=development
DEBUG=True
AI_PROVIDER=baseten
BASETEN_API_KEY=your_baseten_api_key_here
GNANI_API_KEY=your_gnani_api_key_here
```

Start the FastAPI server:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* **API Server**: `http://127.0.0.1:8000`
* **Interactive Docs (Swagger UI)**: `http://127.0.0.1:8000/docs`
* **API Health Check**: `http://127.0.0.1:8000/health`

---

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

* **Frontend Application**: `http://localhost:5173`
* **Direct Voice Orb Mode**: `http://localhost:5173/voice`
* **AI Tutor Workspace**: `http://localhost:5173/tutor`

---

### 3. Production Build

To verify production compilation:
```bash
cd frontend
npm run build
```
Vite transforms and bundles all assets in under 1 second:
```
dist/index.html                   1.18 kB │ gzip:   0.63 kB
dist/assets/index-tIE7L-DX.css   40.94 kB │ gzip:   7.42 kB
dist/assets/index-B533ewob.js   374.05 kB │ gzip: 105.71 kB
✓ built in 998ms
```

---

## ⚙️ Environment Configuration Reference

### Backend (`backend/.env`)

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | string | `development` | Deployment environment (`development` / `production`). |
| `DEBUG` | boolean | `True` | FastAPI debug mode and verbose log formatting. |
| `DATABASE_URL` | string | `sqlite+aiosqlite:///./kugaya.db` | Async SQLAlchemy database connection string. |
| `AI_PROVIDER` | string | `baseten` | AI reasoning provider (`baseten` or `mock`). |
| `BASETEN_API_KEY` | string | `""` | Baseten API authentication token. |
| `BASETEN_BASE_URL` | string | `https://inference.baseten.co/v1` | Baseten OpenAI-compatible inference base URL. |
| `BASETEN_MODEL_ID` | string | `meta-models/muse-spark-open` | Meta Muse Spark Open deployed model identifier. |
| `GNANI_API_KEY` | string | `""` | Gnani AI API key for Prisma STT & Timbre TTS. |
| `GNANI_PRISMA_STT_URL` | string | `https://api.vachana.ai/stt/v3` | Gnani Prisma speech-to-text endpoint. |
| `GNANI_TIMBRE_TTS_URL` | string | `https://api.vachana.ai/api/v1/tts/inference` | Gnani Timbre text-to-speech inference endpoint. |
| `GNANI_DEFAULT_VOICE` | string | `Nalini` | Default Timbre voice model (`Nalini` or `Deepak`). |
| `ALLOWED_ORIGINS` | string | `http://localhost:5173` | Comma-separated CORS allowed domains. |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `""` (empty) | In local dev, leave blank to use the Vite `/api` proxy. In production, point to the deployed backend URL. |

---

## 🌐 Production Deployment

### Option A: Cloud Deployment (Render + Vercel)

1. **Deploy Backend on Render / Railway / Fly.io**:
   * Set Root Directory to `backend`.
   * Build Command: `pip install -r requirements.txt`.
   * Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
   * Mount a persistent disk at `/data` if using SQLite, or provide a managed PostgreSQL URL in `DATABASE_URL`.
   * Set `BASETEN_API_KEY`, `GNANI_API_KEY`, and `ENVIRONMENT=production`.

2. **Deploy Frontend on Vercel / Netlify**:
   * Set Root Directory to `frontend`.
   * Framework Preset: `Vite`.
   * Add environment variable: `VITE_API_BASE_URL=https://<your-backend-domain>`.
   * Deploy! Pre-configured client routing in `vercel.json` ensures full SPA support.

---

## 🛡️ Security & Privacy

* **Zero Leaked Secrets**: All sensitive API keys are strictly loaded server-side. Client bundles contain zero secrets.
* **Audio Privacy**: Temporary audio streams are processed in memory and never stored without user permission.
* **Student Data Purge**: Fully functional data-reset endpoint allows students to purge all conversation histories and saved lessons instantly.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).

<p align="center">
  <strong>Built with ❤️ for Indian STEM Students by the Kugaya AI Team.</strong>
</p>
