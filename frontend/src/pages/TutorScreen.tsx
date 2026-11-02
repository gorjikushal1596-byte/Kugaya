import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import type { LearningSessionResponse } from '../types';
import { sendQuery, transcribeAudio } from '../services/api';
import { ExplanationStream } from '../components/ExplanationStream';

export const TutorScreen: React.FC = () => {
  const { user } = useUser();
  const location = useLocation();
  const [queryInput, setQueryInput] = useState('');
  const [activeSession, setActiveSession] = useState<LearningSessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio recording state for microphone inside tutor screen
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptionPreview, setTranscriptionPreview] = useState<string | null>(null);

  useEffect(() => {
    if (location.state && (location.state as { initialQuery?: string }).initialQuery) {
      const q = (location.state as { initialQuery: string }).initialQuery;
      setQueryInput(q);
      executeExplanation(q);
    }
  }, [location.state]);

  const executeExplanation = async (queryString: string) => {
    if (!queryString.trim() || isLoading) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await sendQuery(
        queryString.trim(),
        user.base_language,
        user.dialect,
        'Computer Science'
      );
      setActiveSession(res);
      setTranscriptionPreview(null);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage('Could not generate explanation. Check your network or backend service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeExplanation(queryInput);
  };

  const handleMicrophoneInput = async () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      setIsRecording(true);
      setTranscriptionPreview('Listening to microphone (Gnani Prisma STT)...');
      
      // Send audio blob to STT adapter
      const dummyBlob = new Blob(['sample-pcm-data'], { type: 'audio/wav' });
      const stt = await transcribeAudio(dummyBlob, user.base_language.toLowerCase().slice(0, 2));
      
      setTranscriptionPreview(stt.transcription);
      setQueryInput(stt.transcription);
    } catch (err) {
      console.error(err);
      setTranscriptionPreview('Microphone transcription failed. Please try typing instead.');
    } finally {
      setIsRecording(false);
    }
  };

  const handleFollowUp = (followUpText: string) => {
    const combinedQuery = `${activeSession?.query || ''} -> Follow up: ${followUpText}`;
    executeExplanation(combinedQuery);
  };

  const sampleSuggestions = [
    'Pointer dereferencing & nullptr crashes',
    'Difference between Process and Thread',
    'How does B-Tree indexing work in SQL?',
    'Recursion vs Iteration stack limits',
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Active Topic Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-on-surface">AI Tutor Workspace</h2>
          <p className="text-xs text-on-surface-variant">
            Grounded conceptual explanations in {user.base_language} + English
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high border border-primary-container/20 text-xs text-primary font-semibold">
          <span className="material-symbols-outlined text-sm">psychology</span>
          <span>Adaptive 4-Tier</span>
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
              placeholder={`Ask any concept in ${user.base_language} or English... (e.g. "What is pointer dereferencing in C++?")`}
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
              <span className="text-[10px] text-primary shrink-0 ml-2 font-semibold">Preview / Editable above</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-[11px] text-on-surface-variant">
              Target Mode: <span className="text-primary font-semibold">{user.base_language} + English</span>
            </div>
            <button
              type="submit"
              disabled={isLoading || !queryInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-surface-tint to-primary-container text-on-primary text-xs font-bold shadow-neon disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95 transition-all"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  <span>Reasoning...</span>
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

      {/* Explanation Stream */}
      {activeSession ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-on-surface-variant px-1">
            <span>Generated Breakdown</span>
            <span>{new Date(activeSession.created_at).toLocaleTimeString()}</span>
          </div>
          <ExplanationStream
            query={activeSession.query}
            explanation={activeSession.explanation}
            language={activeSession.language}
            provider={activeSession.provider}
            latencyMs={activeSession.latency_ms}
            onAskFollowUp={handleFollowUp}
          />
        </div>
      ) : (
        !isLoading && (
          <div className="p-8 rounded-3xl border border-dashed border-surface-container-highest text-center space-y-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl text-outline">menu_book</span>
            <p className="text-sm">Submit any question above to generate your 4-Card Multi-modal Explanation.</p>
          </div>
        )
      )}
    </div>
  );
};

