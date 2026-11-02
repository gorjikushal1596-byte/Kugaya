import React, { useState } from 'react';
import type { UserProfile, LearningSessionResponse } from '../types';
import { sendQuery } from '../services/api';
import { ExplanationStream } from '../components/ExplanationStream';

interface TutorScreenProps {
  user: UserProfile;
  activeSession: LearningSessionResponse | null;
  setActiveSession: (sess: LearningSessionResponse | null) => void;
}

export const TutorScreen: React.FC<TutorScreenProps> = ({ user, activeSession, setActiveSession }) => {
  const [queryInput, setQueryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim() || isLoading) return;

    try {
      setIsLoading(true);
      const res = await sendQuery(
        queryInput.trim(),
        user.base_language,
        user.dialect,
        'Computer Science'
      );
      setActiveSession(res);
      setQueryInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleSuggestions = [
    'Pointer dereferencing & nullptr crashes',
    'Difference between Process and Thread',
    'How does B-Tree indexing work in SQL?',
    'Recursion vs Iteration stack limits'
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
          <span>Adaptive Mode</span>
        </div>
      </div>

      {/* Query Input Section */}
      <div className="p-4 rounded-3xl bg-surface-container-low border border-surface-container-highest shadow-md space-y-3">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder={`Type any engineering or science question in ${user.base_language} or English... (e.g. "What is pointer dereferencing?")`}
              className="w-full p-3.5 rounded-2xl bg-surface-container-high border border-surface-container-highest text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-[11px] text-on-surface-variant">
              Target: <span className="text-primary font-semibold">{user.base_language} + English Mix</span>
            </div>
            <button
              type="submit"
              disabled={isLoading || !queryInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-surface-tint to-primary-container text-on-primary text-xs font-bold shadow-neon disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95 transition-all"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  <span>Synthesizing...</span>
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
            Try Sample Concepts:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sampleSuggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setQueryInput(s)}
                className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-[11px] text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Explanation Results Display */}
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
          />
        </div>
      ) : (
        <div className="p-8 rounded-3xl border border-dashed border-surface-container-highest text-center space-y-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-3xl text-outline">menu_book</span>
          <p className="text-sm">Submit any question above to generate your 4-Card Multi-modal Explanation.</p>
        </div>
      )}
    </div>
  );
};
