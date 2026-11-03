import React, { useState } from 'react';
import type { ExplanationCards } from '../types';
import { saveLesson } from '../services/api';
import { NeonAudioPlayer } from './NeonAudioPlayer';

interface ExplanationStreamProps {
  query: string;
  explanation: ExplanationCards;
  language: string;
  provider?: string;
  latencyMs?: number;
  onAskFollowUp?: (followUpQuery: string) => void;
}

export const ExplanationStream: React.FC<ExplanationStreamProps> = ({
  query,
  explanation,
  language,
  provider,
  latencyMs,
  onAskFollowUp,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);
  const [followUpText, setFollowUpText] = useState('');

  const handleSave = async () => {
    try {
      await saveLesson({
        title: query,
        category: 'Computer Science',
        key_points: explanation.exam_ready_answer.slice(0, 160) + '...',
        full_explanation: explanation,
        curriculum_sources: explanation.curriculum_sources,
        tags: explanation.technical_terms?.slice(0, 3).join(', ') || '',
      });
      setIsSaved(true);
      setSaveSuccessMessage(true);
      setTimeout(() => setSaveSuccessMessage(false), 3000);
    } catch (e) {
      console.error('Failed to save concept:', e);
    }
  };

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (followUpText.trim() && onAskFollowUp) {
      onAskFollowUp(followUpText.trim());
      setFollowUpText('');
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Student Question Card with Listen All Voice Action */}
      <div className="p-4 rounded-2xl bg-surface-container-high/60 border border-primary-container/20 backdrop-blur-md shadow-md">
        <div className="flex items-center justify-between text-xs text-on-surface-variant mb-2">
          <span className="flex items-center gap-1.5 text-primary font-semibold">
            <span className="material-symbols-outlined text-sm">school</span>
            Student Inquiry
          </span>
          <div className="flex items-center gap-2">
            {provider && (
              <span className="px-2 py-0.5 rounded-full bg-secondary-container/30 text-[10px] text-secondary font-mono">
                {provider} {latencyMs ? `(${latencyMs}ms)` : ''}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-[10px] text-primary">
              {language} + English
            </span>
          </div>
        </div>
        <p className="text-base font-semibold text-on-surface">{query}</p>

        {/* Listen to Complete Vernacular Answer */}
        <div className="mt-3 pt-3 border-t border-surface-container-highest/60 flex items-center justify-between">
          <span className="text-xs text-on-surface-variant font-medium">Gnani Timbre v2.5 Voice:</span>
          <div className="max-w-xs">
            <NeonAudioPlayer
              textToSpeak={`${explanation.simple_explanation}. Here is a real life analogy: ${explanation.real_life_analogy}`}
              language={language}
              label="Listen Full Breakdown"
            />
          </div>
        </div>
      </div>

      {/* Card 1: Simple Vernacular Explanation (Code-Mixed) */}
      <div className="p-5 rounded-2xl bg-surface-container-low border border-primary-container/30 shadow-neon relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container shadow-[0_0_8px_#00e5ff]"></span>
            <h3 className="text-sm font-bold tracking-wide text-primary uppercase">
              1. Simple Explanation ({language} + Eng)
            </h3>
          </div>
          <div>
            <NeonAudioPlayer
              textToSpeak={explanation.simple_explanation}
              language={language}
              label="Listen"
            />
          </div>
        </div>
        <p className="text-sm md:text-base text-on-surface leading-relaxed whitespace-pre-line">
          {explanation.simple_explanation}
        </p>
      </div>

      {/* Card 2: Cultural / Real-life Analogy */}
      <div className="p-5 rounded-2xl bg-surface-container-low border border-secondary/30 shadow-purple-glow relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">lightbulb</span>
            <h3 className="text-sm font-bold tracking-wide text-secondary uppercase">
              2. Real-Life Analogy
            </h3>
          </div>
          <div>
            <NeonAudioPlayer
              textToSpeak={explanation.real_life_analogy}
              language={language}
              label="Listen Analogy"
            />
          </div>
        </div>
        <p className="text-sm md:text-base text-on-surface/90 leading-relaxed italic">
          "{explanation.real_life_analogy}"
        </p>
      </div>

      {/* Card 3: Key Technical Terms */}
      <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container-highest shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-surface-tint text-lg">code</span>
            <h3 className="text-sm font-bold tracking-wide text-on-surface uppercase">
              3. English Technical Vocabulary
            </h3>
          </div>
          <div>
            <NeonAudioPlayer
              textToSpeak={`Key technical terms: ${explanation.technical_terms.join('. ')}.`}
              language="en"
              label="Listen Terms"
            />
          </div>
        </div>
        <div className="space-y-2">
          {explanation.technical_terms.map((term, i) => (
            <div
              key={i}
              className="p-2.5 rounded-xl bg-surface-container-high/50 border border-outline-variant/30 flex items-start gap-2 text-xs md:text-sm"
            >
              <span className="material-symbols-outlined text-primary text-sm mt-0.5">check_circle</span>
              <span className="text-on-surface font-medium">{term}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card 4: Exam-Ready Academic Answer */}
      <div className="p-5 rounded-2xl bg-surface-container-low border border-outline/40 shadow-md">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-300 text-lg">auto_stories</span>
            <h3 className="text-sm font-bold tracking-wide text-amber-200 uppercase">
              4. Exam-Ready Answer (English)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <NeonAudioPlayer
              textToSpeak={explanation.exam_ready_answer}
              language="en"
              label="Listen Exam Answer"
            />
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                isSaved
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-surface-container-highest hover:bg-surface-container-high text-on-surface border-outline-variant/50'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {isSaved ? 'bookmark_added' : 'bookmark'}
              </span>
              <span>{isSaved ? 'Saved to Notes' : 'Save Concept'}</span>
            </button>
          </div>
        </div>
        <p className="text-xs md:text-sm text-on-surface-variant font-mono bg-surface-container-lowest/80 p-3.5 rounded-xl border border-outline-variant/20 leading-relaxed">
          {explanation.exam_ready_answer}
        </p>
        {saveSuccessMessage && (
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">check</span>
            <span>Added to Saved Lessons library!</span>
          </div>
        )}
      </div>

      {/* Curriculum Grounding & Citations (RAG Layer) */}
      {explanation.curriculum_sources && explanation.curriculum_sources.length > 0 && (
        <div className="p-5 rounded-2xl bg-surface-container-low border border-primary/40 shadow-neon">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">verified</span>
              <h3 className="text-sm font-bold tracking-wide text-primary uppercase">
                Curriculum Grounding & Citations
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-[10px] text-primary font-mono">
              Hybrid Dense+Sparse RAG
            </span>
          </div>
          <div className="space-y-3">
            {explanation.curriculum_sources.map((src, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-surface-container-high/60 border border-outline-variant/30 space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-on-surface">
                    <span className="material-symbols-outlined text-primary text-sm">menu_book</span>
                    <span>{src.document_title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-surface-container-highest text-[10px] text-on-surface-variant">
                      {src.chapter}
                    </span>
                    {src.page_number && (
                      <span className="px-1.5 py-0.5 rounded-md bg-secondary/20 text-[10px] text-secondary font-mono">
                        p. {src.page_number}
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-[10px] text-emerald-300 font-mono">
                      {src.relevance_score > 0 ? `${src.relevance_score}% match` : 'Accredited'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant italic border-l-2 border-primary/60 pl-2.5 py-0.5 bg-surface-container-lowest/40 rounded-r-md">
                  "{src.excerpt}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card 5: Comprehension Check (Muse Spark Open) */}
      {explanation.comprehension_check && (
        <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-tint/40 shadow-neon">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-surface-tint text-lg">quiz</span>
              <h3 className="text-sm font-bold tracking-wide text-surface-tint uppercase">
                5. Comprehension Check
              </h3>
            </div>
            <div>
              <NeonAudioPlayer
                textToSpeak={explanation.comprehension_check}
                language={language}
                label="Listen Quiz"
              />
            </div>
          </div>
          <p className="text-xs md:text-sm text-on-surface leading-relaxed">
            {explanation.comprehension_check}
          </p>
        </div>
      )}

      {/* Follow-up Question Component */}
      <div className="p-4 rounded-2xl bg-surface-container-high/50 border border-primary-container/20 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface">
          <span className="material-symbols-outlined text-sm text-primary">reply</span>
          <span>Ask a Follow-up Question on this Concept</span>
        </div>
        <form onSubmit={handleFollowUpSubmit} className="flex gap-2">
          <input
            type="text"
            value={followUpText}
            onChange={(e) => setFollowUpText(e.target.value)}
            placeholder={`Ask follow-up in ${language}... (e.g. "What if the pointer is uninitialized?")`}
            className="flex-1 px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary-container"
          />
          <button
            type="submit"
            disabled={!followUpText.trim()}
            className="px-3.5 py-2 rounded-xl bg-primary-container text-on-primary-container text-xs font-bold disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
