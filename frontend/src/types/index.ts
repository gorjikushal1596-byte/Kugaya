export interface UserProfile {
  id: string;
  name: string;
  base_language: string;
  dialect: string;
  speaking_mode: 'bilingual' | 'immersion';
  streak_days: number;
  points: number;
}

export interface CurriculumGroundingSource {
  document_title: string;
  chapter: string;
  page_number?: number;
  relevance_score: number;
  excerpt: string;
}

export interface ExplanationCards {
  simple_explanation: string;
  real_life_analogy: string;
  technical_terms: string[];
  exam_ready_answer: string;
  curriculum_sources?: CurriculumGroundingSource[];
}

export interface FollowUpItem {
  id: string;
  query: string;
  timestamp: string;
}

export interface LearningSessionResponse {
  session_id: string;
  topic: string;
  language: string;
  dialect?: string;
  query: string;
  explanation: ExplanationCards;
  follow_ups?: FollowUpItem[];
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

export interface AppErrorState {
  code: string;
  message: string;
  retryAction?: () => void;
}
