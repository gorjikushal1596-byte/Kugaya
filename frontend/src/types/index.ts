export interface UserProfile {
  id: string;
  name: string;
  base_language: string;
  dialect: string;
  speaking_mode: 'bilingual' | 'immersion';
  code_mixing_style?: string; // 'balanced_50_50' | 'indic_heavy' | 'english_heavy'
  explanation_complexity?: string; // 'beginner' | 'intermediate' | 'exam_rigorous'
  technical_terminology_mode?: string; // 'english_standard' | 'vernacular_glossary'
  audio_playback_auto?: boolean;
  speech_playback_speed?: number;
  streak_days: number;
  points: number;
  daily_goal_minutes?: number;
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
  comprehension_check?: string;
  curriculum_sources?: CurriculumGroundingSource[];
}

export interface TutorInquiryResponse {
  conversation_id: string;
  message_id: string;
  topic: string;
  language: string;
  query: string;
  explanation: ExplanationCards;
  provider?: string;
  latency_ms?: number;
  has_curriculum_grounding?: boolean;
  created_at: string;
}

export interface CurriculumDocumentSummary {
  id: string;
  title: string;
  filename: string;
  file_type: string;
  subject: string;
  file_size_bytes: number;
  page_count: number;
  chunk_count: number;
  created_at: string;
}

export interface CurriculumUploadResponse {
  document_id: string;
  title: string;
  chunks_created: number;
  message: string;
}

export interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  query: string;
  explanation?: ExplanationCards;
  created_at: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  topic: string;
  language: string;
  message_count: number;
  last_message_snippet?: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  topic: string;
  language: string;
  dialect: string;
  messages: MessageItem[];
  created_at: string;
}

export interface SavedLessonItem {
  id: string;
  conversation_id?: string;
  title: string;
  category: string;
  key_points: string;
  full_explanation?: ExplanationCards;
  curriculum_sources?: CurriculumGroundingSource[];
  tags?: string;
  saved_at: string;
}

export interface SavedLessonCreate {
  id?: string;
  conversation_id?: string;
  title: string;
  category?: string;
  key_points: string;
  full_explanation?: ExplanationCards;
  curriculum_sources?: CurriculumGroundingSource[];
  tags?: string;
}

export interface DataPurgeResponse {
  status: string;
  conversations_deleted: number;
  saved_lessons_deleted: number;
  message: string;
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
