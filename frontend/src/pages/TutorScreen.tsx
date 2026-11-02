import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import type { TutorInquiryResponse, MessageItem } from '../types';
import { sendTutorQuery, transcribeAudio } from '../services/api';
import { ExplanationStream } from '../components/ExplanationStream';

export const TutorScreen: React.FC = () => {
  const { user } = useUser();
  const location = useLocation();

  const [queryInput, setQueryInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [latestResponse, setLatestResponse] = useState<TutorInquiryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Microphone recording simulation & speech-to-text preview
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptionPreview, setTranscriptionPreview] = useState<string | null>(null);

  useEffect(() => {
    if (location.state && (location.state as { initialQuery?: string }).initialQuery) {
      const q = (location.state as { initialQuery: string }).initialQuery;
      setQueryInput(q);
      executeExplanation(q, null);
    }
  }, [location.state]);

  const executeExplanation = async (queryString: string, convId: string | null = conversationId) => {
    if (!queryString.trim() || isLoading) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Append user inquiry message immediately
      const userMsg: MessageItem = {
        id: `local_${Date.now()}`,
        role: 'user',
        query: queryString.trim(),
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Call FastAPI Baseten reasoning engine
      const res = await sendTutorQuery(
        queryString.trim(),
        user.base_language,
        user.dialect,
        convId || undefined,
        'Computer Science'
      );

      setConversationId(res.conversation_id);
      setLatestResponse(res);

      // Append assistant explanation message
      const asstMsg: MessageItem = {
        id: res.message_id,
        role: 'assistant',
        query: queryString.trim(),
        explanation: res.explanation,
        created_at: res.created_at,
      };
      setMessages((prev) => [...prev, asstMsg]);
      setTranscriptionPreview(null);
      setQueryInput('');
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage('Could not complete inquiry with Baseten Meta Muse Spark Open. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeExplanation(queryInput);
  };

  const handleStartNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setLatestResponse(null);
    setQueryInput('');
    setErrorMessage(null);
  };

  const handleMicrophoneInput = async () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      setIsRecording(true);
      setTranscriptionPreview(`Listening via Gnani Prisma (${user.base_language})...`);

      const dummyBlob = new Blob(['sample-pcm-data'], { type: 'audio/wav' });
      const stt = await transcribeAudio(dummyBlob, user.base_language.toLowerCase().slice(0, 2));

      setTranscriptionPreview(stt.transcription);
      setQueryInput(stt.transcription);
    } catch (err) {
      console.error(err);
      setTranscriptionPreview('Voice transcription failed. You can type your query directly.');
    } finally {
      setIsRecording(false);
    }
  };

  const handleFollowUp = (followUpText: string) => {
    executeExplanation(followUpText, conversationId);
  };

  const sampleSuggestions = [
    'Pointer dereferencing & nullptr crashes',
    'Difference between Process and Thread',
    'How does B-Tree indexing work in SQL?',
    'Recursion vs Iteration stack limits',
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Active Workspace Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-on-surface">AI Tutor Workspace</h2>
          <p className="text-xs text-on-surface-variant">
            Powered by Meta Muse Spark Open via Baseten in {user.base_language} + English
          </p>
        </div>
        <div className="flex items-center gap-2">
          {conversationId && (
            <button
              onClick={handleStartNewConversation}
              className="px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-surface-container-highest border border-surface-container-highest text-[11px] text-on-surface-variant hover:text-primary transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>New Thread</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high border border-primary-container/20 text-xs text-primary font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
            <span>Live Muse Spark</span>
          </div>
        </div>
      </div>

      {/* Query Input Box */}
      <div className="p-4 rounded-3xl bg-surface-container-low border border-surface-container-highest shadow-md space-y-3">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder={`Ask any university or technical question in ${user.base_language} or English... (e.g. "Explain binary search with everyday analogy")`}
              className="w-full p-3.5 pr-12 rounded-2xl bg-surface-container-high border border-surface-container-highest text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container resize-none"
            />
            {/* Inline Mic Trigger */}
            <button
              type="button"
              onClick={handleMicrophoneInput}
              className={`absolute right-3 top-3 p-2 rounded-xl border transition-all ${
                isRecording
                  ? 'bg-primary-container text-on-primary-container border-primary-container animate-pulse'
                  : 'bg-surface-container-lowest text-primary border-outline-variant/30 hover:border-primary-container'
              }`}
              title="Voice Input"
            >
              <span className="material-symbols-outlined text-base">mic</span>
            </button>
          </div>

          {/* Transcription preview with quick edit notice */}
          {transcriptionPreview && (
            <div className="p-2.5 rounded-xl bg-surface-container-high/80 border border-primary-container/30 flex items-center justify-between text-xs text-on-surface">
              <span className="truncate italic">STT: "{transcriptionPreview}"</span>
              <span className="text-[10px] text-primary shrink-0 ml-2 font-semibold">
                Preview / Editable
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-[11px] text-on-surface-variant">
              Tutor Delivery:{' '}
              <span className="text-primary font-semibold">
                {user.base_language} + English Code-mixed
              </span>
            </div>
            <button
              type="submit"
              disabled={isLoading || !queryInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-surface-tint to-primary-container text-on-primary text-xs font-bold shadow-neon disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95 transition-all"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  <span>Reasoning (Muse Spark)...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  <span>Explain Concept</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="pt-2 border-t border-surface-container-highest/60">
          <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
            Try High-Yield Concepts:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sampleSuggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQueryInput(s);
                  executeExplanation(s);
                }}
                className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-[11px] text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-error-container/20 border border-error/40 text-error text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => executeExplanation(queryInput)} className="underline font-bold">
            Retry
          </button>
        </div>
      )}

      {/* Conversation Thread / Message Stream */}
      {messages.length > 0 ? (
        <div className="space-y-6">
          {messages.map((m) => {
            if (m.role === 'assistant' && m.explanation) {
              return (
                <div key={m.id} className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-on-surface-variant px-1">
                    <span className="font-semibold text-primary">Kugaya Explanation</span>
                    <span>{new Date(m.created_at).toLocaleTimeString()}</span>
                  </div>
                  <ExplanationStream
                    query={m.query}
                    explanation={m.explanation}
                    language={user.base_language}
                    provider={latestResponse?.provider || 'baseten/muse-spark-open'}
                    latencyMs={latestResponse?.latency_ms}
                    onAskFollowUp={handleFollowUp}
                  />
                </div>
              );
            }
            return null;
          })}
        </div>
      ) : (
        !isLoading && (
          <div className="p-8 rounded-3xl border border-dashed border-surface-container-highest text-center space-y-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl text-outline">menu_book</span>
            <p className="text-sm">
              Submit any question above to generate your 5-Card Multi-modal Explanation from Meta Muse
              Spark Open.
            </p>
          </div>
        )
      )}
    </div>
  );
};
