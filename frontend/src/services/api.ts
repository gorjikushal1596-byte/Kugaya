import type {
  UserProfile,
  TutorInquiryResponse,
  ConversationSummary,
  ConversationDetail,
  SavedLessonItem,
  STTResponse,
  TTSResponse,
  CurriculumDocumentSummary,
  CurriculumUploadResponse,
} from '../types';

const API_BASE = '/api/v1';

export async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/profile`);
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export async function updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export async function sendTutorQuery(
  query: string,
  language: string,
  dialect: string,
  conversationId?: string,
  topic?: string,
  useCurriculumRag = true
): Promise<TutorInquiryResponse> {
  const res = await fetch(`${API_BASE}/tutor/query`, {
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

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const res = await fetch(`${API_BASE}/conversations`);
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

export async function fetchConversationDetail(conversationId: string): Promise<ConversationDetail> {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}`);
  if (!res.ok) throw new Error('Failed to fetch conversation detail');
  return res.json();
}

export async function fetchSavedLessons(): Promise<SavedLessonItem[]> {
  const res = await fetch(`${API_BASE}/saved`);
  if (!res.ok) throw new Error('Failed to fetch saved lessons');
  return res.json();
}

export async function saveLesson(
  item: Omit<SavedLessonItem, 'id' | 'saved_at'>
): Promise<{ status: string; id: string }> {
  const res = await fetch(`${API_BASE}/saved`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...item, id: '', saved_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error('Failed to save lesson');
  return res.json();
}

export async function transcribeAudio(audioBlob: Blob, language = 'te'): Promise<STTResponse> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.wav');
  formData.append('language', language);

  const res = await fetch(`${API_BASE}/voice/stt`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to transcribe audio');
  return res.json();
}

export async function synthesizeTTS(text: string, language = 'te', speed = 1.0): Promise<TTSResponse> {
  const res = await fetch(`${API_BASE}/voice/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language, speed }),
  });
  if (!res.ok) throw new Error('Failed to synthesize speech');
  return res.json();
}

export async function fetchCurriculumDocuments(): Promise<CurriculumDocumentSummary[]> {
  const res = await fetch(`${API_BASE}/curriculum/documents`);
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

  const res = await fetch(`${API_BASE}/curriculum/upload`, {
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
  const res = await fetch(`${API_BASE}/curriculum/documents/${documentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete curriculum document');
  return res.json();
}
