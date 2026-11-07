# 📄 KUGAYA — 1-Page Solution Pitch
### Great Indian AI Internship Challenge | Gnani AI

---

## 1. Project Title
**KUGAYA — AI-Powered Multilingual STEM & Engineering Learning Tutor**
*Empowering Indian Engineering Students in Their Mother Tongue with Intuitive Analogies, Voice-First Tutoring, and Exam-Ready Academic Notes.*

* **Developer / Team**: Kushal Gorji (Solo Builder & Lead Architect)
* **GitHub Repository**: [https://github.com/gorjikushal1596-byte/Kugaya](https://github.com/gorjikushal1596-byte/Kugaya)
* **Live Stack**: React 19 • TypeScript • Vite • FastAPI • Gnani AI • Baseten LLM • Hybrid RAG

---

## 2. The Problem You Are Solving
In India, over **85% of engineering students** in Tier-2, Tier-3, and rural colleges complete their schooling in vernacular mediums or regional languages. When transitioning to engineering college:
* **The Linguistic Barrier**: Abstract concepts in Computer Science and Engineering (pointers, operating system deadlocks, recursion, B-trees) are taught exclusively in English textbooks, causing immense cognitive friction.
* **Hesitation & Fear**: Students hesitate to ask doubts in English classrooms, leading to rote memorization without foundational intuition.
* **Lack of Relatable Analogies**: Western textbook analogies fail to click with Indian students compared to relatable native-life metaphors.

---

## 3. Who Will Use It (Target Audience)
* **1.5M+ Undergraduate Students**: B.Tech, BE, BCA, and Polytechnic diploma students across India.
* **Vernacular-First Self-Learners**: Students who think in regional dialects (Telugu, Hindi, Tamil, Kannada, Malayalam, Bengali) and need rapid conceptual clarity.
* **GATE & Campus Interview Aspirants**: Learners preparing for competitive exams who need technical definitions combined with clear intuitive understanding.

---

## 4. The Solution: 5-Tier Pedagogical Architecture
When a student asks an engineering doubt via voice or text, KUGAYA synthesizes a structured **5-card multi-modal breakdown**:
1. **Simple Vernacular Explanation**: Conversational code-mixed language (e.g., *Tenglish* or *Hinglish*) removing linguistic intimidation.
2. **Culturally Intuitive Real-Life Analogy**: Relatable Indian analogies (e.g., Dabba tiffin sets for Recursion, Railway token rings for Mutexes).
3. **English Technical Vocabulary**: Core industry terms preserved with vernacular definitions for academic readiness.
4. **Exam-Ready Academic Answer**: Formal, high-scoring university exam answers structured for 8–10 mark questions.
5. **Comprehension Check**: Interactive scenario question reinforcing edge-case conceptual mastery.

---

## 5. Gnani AI Models & APIs Utilized
* **Gnani AI Prisma v2.5 STT (`https://api.vachana.ai/stt/v3`)**: Multilingual speech recognition powering voice queries across 12 Indian languages with automatic 16kHz WAV transcoding.
* **Gnani AI Timbre v2.5 TTS (`https://api.vachana.ai/api/v1/tts/inference`)**: High-fidelity Indic voice synthesis delivering individual card audio playbacks with streaming WAV chunk header repair.
* **Augmented Reasoning & Grounding**: Supported by Meta Muse Spark Open on Baseten for multi-turn reasoning CoT and Hybrid Dense + BM25Okapi RAG for accredited university syllabus citations.

---

## 6. Member Contribution (Kushal Gorji — Solo Developer)
* **End-to-End Full-Stack Architecture**: Built the FastAPI asynchronous backend and React 19 + TypeScript + Vite frontend.
* **Gnani AI Integration**: Implemented live Prisma STT transcription, Timbre TTS voice synthesis, audio transcoding, and audio player synchronization.
* **Pedagogical Prompt Engineering & RAG**: Designed the 5-card prompt engine, syllabus citation extraction, and conversation memory.
* **Futuristic UI & Multi-State Audio Player**: Designed the 3D Neural Sound Orb with cosmic silk ribbon waves and `NeonAudioPlayer` with discrete Pause, Resume, and Stop controls.

---
*Built with ❤️ for Indian STEM Students for the Great Indian AI Internship Challenge (Gnani AI).*
