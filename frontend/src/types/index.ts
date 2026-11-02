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
