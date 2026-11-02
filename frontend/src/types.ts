export interface UserProfile {
  id: string;
  name: string;
  base_language: string;
  dialect: string;
  speaking_mode: 'bilingual' | 'immersion';
  streak_days: number;
  points: number;
}

export interface ExplanationCards {
  simple_explanation: string;
  real_life_analogy: string;
  technical_terms: string[];
  exam_ready_answer: string;
}

export interface LearningSessionResponse {
  session_id: string;
  topic: string;
  language: string;
  query: string;
  explanation: ExplanationCards;
  created_at: string;
}

export interface SavedLessonItem {
  id: string;
  title: string;
  category: string;
  key_points: string;
  saved_at: string;
}

export interface STTResponse {
  transcription: string;
  language: string;
  confidence: number;
  is_mock: boolean;
}

export interface TTSResponse {
  audio_base64: string;
  duration_seconds: number;
  is_mock: boolean;
}
