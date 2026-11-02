# KUGAYA — AI-Powered Indian Language Learning Tutor
## PROJECT_STATUS.md

**Last Updated:** 2026-11-02  
**Current Milestone:** Gnani AI Prisma v2.5 Speech-to-Text Live Integration Succeeded.

---

### 1. Gnani AI Prisma v2.5 STT Verification
- [x] **API Specification & Handshake**:
  - Endpoint: `https://api.vachana.ai/stt/v3`
  - Authentication: Custom header `X-API-Key-ID: <GNANI_API_KEY>`
  - Request Format: `multipart/form-data` with `audio_file` and `language_code`
  - Model tag: `prisma-v2.5`
  - Regional Language Code resolution: `te-IN` (Telugu), `hi-IN` (Hindi), `ta-IN` (Tamil), `kn-IN` (Kannada), `ml-IN` (Malayalam), `en-IN` (English).
  - Status: **Live Authenticated Handshake Verified** (`HTTP 200 OK`, `is_mock: False`).
- [x] **Backend Implementation**:
  - Service: `backend/app/services/speech_service.py` (`GnaniSpeechService`).
  - Validation: Enforces minimum audio payload length and maximum file size (`MAX_AUDIO_SIZE_BYTES = 25 MB`).
  - Supported audio formats: WAV, WebM, OGG, MP3, FLAC, M4A.
  - Fail-safe retry logic: Configurable timeout (`25.0s`) and bounded retries.
- [x] **Frontend Voice Interface**:
  - Hook: `frontend/src/hooks/useAudioRecorder.ts` with real-time `MediaRecorder`, `AudioContext`, and volume metering.
  - Visualizer: `NeuralOrb.tsx` animated waveform oscillating according to live voice loudness.
  - Voice Screen: `frontend/src/pages/VoiceScreen.tsx` supporting:
    1. Mic permission request
    2. Real-time recording with elapsed timer
    3. Waveform oscillations
    4. Auto-submission to Gnani Prisma STT
    5. Recognized text preview card
    6. Inline transcription editing before submitting
    7. Forwarding to Meta Muse Spark Open on Baseten.
- [x] **End-to-End Pipeline Testing**:
  - Test Suite: `backend/tests/test_gnani_stt.py`
  - Empty audio payload rejection: PASSED (HTTP 400).
  - Language code mappings: PASSED across 6 Indic languages.
  - Live Prisma endpoint handshake: PASSED (`is_mock: False`).
  - Full Voice-to-Reasoning pipeline flow: PASSED (Recorded query `Recursion lo base case lekapothe emavthundi Kugaya?` successfully recognized and answered by Muse Spark Open in Tenglish).
  - Frontend production build: PASSED (`npm run build`).

---

### 2. Full Architecture Status
- **Speech-to-Text (STT)**: Live Gnani AI Prisma v2.5 (`https://api.vachana.ai/stt/v3`)
- **Reasoning Model**: Live Meta Muse Spark Open via Baseten (`https://inference.baseten.co/v1`)
- **Text-to-Speech (TTS)**: Gnani AI Timbre v2.5 (`https://api.vachana.ai/tts/v3`)
- **Persistence**: SQLite (Async SQLAlchemy) tracking multi-turn conversations and messages.
