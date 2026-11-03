import type {
  UserProfile,
  TutorInquiryResponse,
  ConversationSummary,
  ConversationDetail,
  SavedLessonItem,
  SavedLessonCreate,
  DataPurgeResponse,
  STTResponse,
  TTSResponse,
  CurriculumDocumentSummary,
  CurriculumUploadResponse,
} from '../types';

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const API_BASE = `${API_ORIGIN}/api/v1`;

/**
 * Universal fetch wrapper that attaches tunnel bypass headers (e.g. Localtunnel / Pinggy)
 * ensuring remote mobile demo requests are never intercepted by provider reminder pages.
 */
async function appFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers || {});
  headers.set('Bypass-Tunnel-Reminder', 'true');
  return fetch(url, {
    ...init,
    headers,
  });
}

// --- User Profile & Preferences ---

export async function fetchProfile(): Promise<UserProfile> {
  const res = await appFetch(`${API_BASE}/profile`);
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export async function updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const res = await appFetch(`${API_BASE}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export async function purgeUserData(): Promise<DataPurgeResponse> {
  const res = await appFetch(`${API_BASE}/profile/data`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to reset user data');
  return res.json();
}

// --- Tutor Reasoning ---

export async function sendTutorQuery(
  query: string,
  language: string,
  dialect: string,
  conversationId?: string,
  topic?: string,
  useCurriculumRag = true
): Promise<TutorInquiryResponse> {
  const res = await appFetch(`${API_BASE}/tutor/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      language,
      dialect,
      conversation_id: conversationId,
      topic: topic || 'Computer Science',
      use_curriculum_rag: useCurriculumRag,
    }),
  });
  if (!res.ok) throw new Error('Failed to generate tutor explanation');
  return res.json();
}

// --- Conversations History ---

export async function fetchConversations(searchQuery?: string): Promise<ConversationSummary[]> {
  const url = searchQuery && searchQuery.trim()
    ? `${API_BASE}/conversations?q=${encodeURIComponent(searchQuery.trim())}`
    : `${API_BASE}/conversations`;
  const res = await appFetch(url);
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

export async function createConversation(
  title = 'New Conversation',
  topic = 'Computer Science',
  language = 'Telugu',
  dialect = 'Andhra & Telangana'
): Promise<ConversationSummary> {
  const res = await appFetch(`${API_BASE}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, topic, language, dialect }),
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  return res.json();
}

export async function fetchConversationDetail(conversationId: string): Promise<ConversationDetail> {
  const res = await appFetch(`${API_BASE}/conversations/${conversationId}`);
  if (!res.ok) throw new Error('Failed to fetch conversation detail');
  return res.json();
}

export async function deleteConversation(conversationId: string): Promise<{ status: string; deleted_conversation_id: string }> {
  const res = await appFetch(`${API_BASE}/conversations/${conversationId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete conversation');
  return res.json();
}

// --- Saved Lessons ---

export async function fetchSavedLessons(searchQuery?: string, category?: string): Promise<SavedLessonItem[]> {
  const params = new URLSearchParams();
  if (searchQuery && searchQuery.trim()) params.append('q', searchQuery.trim());
  if (category && category.trim() && category.trim().toLowerCase() !== 'all') params.append('category', category.trim());
  const queryString = params.toString() ? `?${params.toString()}` : '';

  const res = await appFetch(`${API_BASE}/saved${queryString}`);
  if (!res.ok) throw new Error('Failed to fetch saved lessons');
  return res.json();
}

export async function fetchSavedLessonDetail(lessonId: string): Promise<SavedLessonItem> {
  const res = await appFetch(`${API_BASE}/saved/${lessonId}`);
  if (!res.ok) throw new Error('Failed to fetch saved lesson');
  return res.json();
}

export async function saveLesson(
  item: SavedLessonCreate
): Promise<SavedLessonItem> {
  const res = await appFetch(`${API_BASE}/saved`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to save lesson');
  return res.json();
}

export async function deleteSavedLesson(lessonId: string): Promise<{ status: string; deleted_lesson_id: string }> {
  const res = await appFetch(`${API_BASE}/saved/${lessonId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete saved lesson');
  return res.json();
}

// --- Voice STT & TTS ---

export async function transcribeAudio(audioBlob: Blob, language = 'te'): Promise<STTResponse> {
  const formData = new FormData();
  const ext = audioBlob.type.includes('webm') ? 'webm' : audioBlob.type.includes('ogg') ? 'ogg' : 'wav';
  formData.append('audio', audioBlob, `student_query.${ext}`);
  formData.append('language', language);

  const res = await appFetch(`${API_BASE}/voice/stt`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to transcribe audio');
  return res.json();
}

export async function synthesizeTTS(text: string, language = 'te', speed = 1.0): Promise<TTSResponse> {
  const res = await appFetch(`${API_BASE}/voice/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language, speed }),
  });
  if (!res.ok) throw new Error('Failed to synthesize speech');
  return res.json();
}

// --- Curriculum RAG ---

export async function fetchCurriculumDocuments(): Promise<CurriculumDocumentSummary[]> {
  const res = await appFetch(`${API_BASE}/curriculum/documents`);
  if (!res.ok) throw new Error('Failed to fetch curriculum documents');
  return res.json();
}

export async function uploadCurriculumDocument(
  file: File,
  title?: string,
  subject = 'Computer Science'
): Promise<CurriculumUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (title) formData.append('title', title);
  formData.append('subject', subject);

  const res = await appFetch(`${API_BASE}/curriculum/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Failed to upload curriculum document');
  }
  return res.json();
}

export async function deleteCurriculumDocument(documentId: string): Promise<{ status: string; deleted_document_id: string }> {
  const res = await appFetch(`${API_BASE}/curriculum/documents/${documentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete curriculum document');
  return res.json();
}
