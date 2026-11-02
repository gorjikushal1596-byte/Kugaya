import type {
  UserProfile,
  TutorInquiryResponse,
  ConversationSummary,
  ConversationDetail,
  SavedLessonItem,
  STTResponse,
  TTSResponse,
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
  topic?: string
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

export async function synthesizeTTS(text: string, language = 'te'): Promise<TTSResponse> {
  const res = await fetch(`${API_BASE}/voice/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language }),
  });
  if (!res.ok) throw new Error('Failed to synthesize speech');
  return res.json();
}
