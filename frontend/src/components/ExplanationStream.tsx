import React, { useState } from 'react';
import type { ExplanationCards } from '../types';
import { synthesizeTTS, saveLesson } from '../services/api';

interface ExplanationStreamProps {
  query: string;
  explanation: ExplanationCards;
  language: string;
  onAskFollowUp?: (followUpQuery: string) => void;
}

export const ExplanationStream: React.FC<ExplanationStreamProps> = ({
  query,
  explanation,
  language,
  onAskFollowUp,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);
  const [followUpText, setFollowUpText] = useState('');

  const handlePlayVoice = async () => {
    try {
      setIsPlayingAudio(true);
      const res = await synthesizeTTS(explanation.simple_explanation, language.toLowerCase().slice(0, 2));
      if (res.audio_base64 && res.audio_base64.length > 20) {
        const audio = new Audio(`data:audio/wav;base64,${res.audio_base64}`);
        audio.play().catch(() => {});
      }
    } catch (e) {
      console.error('Audio synthesis failed:', e);
    } finally {
      setTimeout(() => setIsPlayingAudio(false), 2500);
    }
  };

  const handleSave = async () => {
    try {
      await saveLesson({
        title: query,
        category: 'Computer Science',
        key_points: explanation.exam_ready_answer.slice(0, 160) + '...',
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
      {/* Student Question Card */}
      <div className="p-4 rounded-2xl bg-surface-container-high/60 border border-primary-container/20 backdrop-blur-md shadow-md">
        <div className="flex items-center justify-between text-xs text-on-surface-variant mb-2">
          <span className="flex items-center gap-1.5 text-primary font-semibold">
            <span className="material-symbols-outlined text-sm">school</span>
            Student Inquiry
          </span>
          <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-[10px] text-primary">
            {language} + English
          </span>
        </div>
        <p className="text-base font-semibold text-on-surface">{query}</p>
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
          <button
            onClick={handlePlayVoice}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/15 hover:bg-primary-container/30 text-primary text-xs font-semibold transition-all active:scale-95 border border-primary-container/40"
          >
            <span className="material-symbols-outlined text-[16px] fill-1">
              {isPlayingAudio ? 'graphic_eq' : 'volume_up'}
            </span>
            <span>{isPlayingAudio ? 'Playing...' : 'Voice Playback'}</span>
          </button>
        </div>
        <p className="text-sm md:text-base text-on-surface leading-relaxed whitespace-pre-line">
          {explanation.simple_explanation}
        </p>
      </div>

      {/* Card 2: Cultural / Real-life Analogy */}
      <div className="p-5 rounded-2xl bg-surface-container-low border border-secondary/30 shadow-purple-glow relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-secondary text-lg">lightbulb</span>
          <h3 className="text-sm font-bold tracking-wide text-secondary uppercase">
            2. Real-Life Analogy
          </h3>
        </div>
        <p className="text-sm md:text-base text-on-surface/90 leading-relaxed italic">
          "{explanation.real_life_analogy}"
        </p>
      </div>

      {/* Card 3: Key Technical Terms */}
      <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container-highest shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-surface-tint text-lg">code</span>
          <h3 className="text-sm font-bold tracking-wide text-on-surface uppercase">
            3. English Technical Vocabulary
          </h3>
        </div>
        <div className="space-y-2">
          {explanation.technical_terms.map((term, i) => (
            <div key={i} className="p-2.5 rounded-xl bg-surface-container-high/50 border border-outline-variant/30 flex items-start gap-2 text-xs md:text-sm">
              <span className="material-symbols-outlined text-primary text-sm mt-0.5">check_circle</span>
              <span className="text-on-surface font-medium">{term}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card 4: Exam-Ready Academic Answer */}
      <div className="p-5 rounded-2xl bg-surface-container-low border border-outline/40 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-300 text-lg">auto_stories</span>
            <h3 className="text-sm font-bold tracking-wide text-amber-200 uppercase">
              4. Exam-Ready Answer (English)
            </h3>
          </div>
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

      {/* RAG Curriculum Grounding Reference Citation (if available) */}
      {explanation.curriculum_sources && explanation.curriculum_sources.length > 0 && (
        <div className="p-4 rounded-2xl bg-surface-container-high/40 border border-surface-tint/30 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-surface-tint uppercase">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            <span>Curriculum Grounded Source (RAG)</span>
          </div>
          {explanation.curriculum_sources.map((src, idx) => (
            <div key={idx} className="text-xs text-on-surface-variant bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/20">
              <span className="font-semibold text-on-surface">{src.document_title}</span> — Chapter: {src.chapter}
              {src.page_number && ` (p. ${src.page_number})`}
              <p className="mt-1 text-[11px] italic text-on-surface-variant/80">"{src.excerpt}"</p>
            </div>
          ))}
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
