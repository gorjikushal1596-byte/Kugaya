import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SavedLessonItem } from '../types';
import { fetchSavedLessons, deleteSavedLesson } from '../services/api';
import { NeonAudioPlayer } from '../components/NeonAudioPlayer';
import { useUser } from '../contexts/UserContext';

const CATEGORIES = [
  'All',
  'Computer Science',
  'Algorithms',
  'Operating Systems',
  'Networking',
  'DBMS',
  'C++ Systems',
];

export const SavedScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [lessons, setLessons] = useState<SavedLessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLessonModal, setSelectedLessonModal] = useState<SavedLessonItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadLessons = async (q?: string, cat?: string) => {
    try {
      setLoading(true);
      const data = await fetchSavedLessons(q, cat);
      setLessons(data);
    } catch (err) {
      console.error('Failed to load saved lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLessons(searchQuery, selectedCategory);
  }, [selectedCategory, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLessons(searchQuery, selectedCategory);
  };

  const handleDelete = async (lessonId: string) => {
    try {
      await deleteSavedLesson(lessonId);
      setToastMessage('Lesson removed from saved notes.');
      setTimeout(() => setToastMessage(null), 3000);
      if (selectedLessonModal?.id === lessonId) {
        setSelectedLessonModal(null);
      }
      await loadLessons(searchQuery, selectedCategory);
    } catch (err) {
      console.error('Failed to delete saved lesson:', err);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Saved Lessons & Concepts</h2>
          <p className="text-xs text-on-surface-variant">
            Persistent student notebook with textbook citations and vernacular audio review
          </p>
        </div>
        <button
          onClick={() => navigate('/tutor')}
          className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-neon hover:bg-primary/90 flex items-center gap-1.5 transition-all"
        >
          <span className="material-symbols-outlined text-sm">explore</span>
          <span>Explore More Concepts</span>
        </button>
      </div>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Search Bar & Category Chips */}
      <div className="space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search saved definitions, algorithms, or analogies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-container-low border border-surface-container-highest text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-on-surface-variant text-base">
              search
            </span>
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-xs font-semibold text-on-surface"
          >
            Filter
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                loadLessons('', selectedCategory);
              }}
              className="px-3 py-2 rounded-xl bg-surface-container-high text-xs text-on-surface-variant"
            >
              Clear
            </button>
          )}
        </form>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? 'bg-primary-container text-on-primary-container border-primary-container shadow-neon'
                  : 'bg-surface-container-low text-on-surface-variant border-surface-container-highest hover:text-on-surface'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lesson List */}
      {loading ? (
        <div className="text-center py-12 text-on-surface-variant text-sm flex items-center justify-center gap-2">
          <span className="material-symbols-outlined animate-spin text-primary">sync</span>
          <span>Loading notebook...</span>
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-14 p-6 rounded-3xl border border-dashed border-surface-container-highest text-on-surface-variant space-y-3">
          <span className="material-symbols-outlined text-4xl text-outline">bookmark_border</span>
          <p className="text-sm">No saved concepts found {selectedCategory !== 'All' ? `in '${selectedCategory}'` : ''}.</p>
          <p className="text-xs text-on-surface-variant/80">
            Bookmark high-yield explanation cards in the AI Tutor workspace to save them here for offline exam review.
          </p>
          <button
            onClick={() => navigate('/tutor')}
            className="px-4 py-2 rounded-xl bg-primary-container text-on-primary-container text-xs font-bold inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">school</span>
            <span>Go to AI Tutor</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="p-5 rounded-3xl bg-surface-container-low border border-surface-container-highest shadow-md hover:border-primary-container/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary-container/15 border border-primary-container/30">
                    {lesson.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-on-surface-variant">
                      {new Date(lesson.saved_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDelete(lesson.id)}
                      className="p-1 text-on-surface-variant hover:text-error transition-colors"
                      title="Remove from saved lessons"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-on-surface line-clamp-2">{lesson.title}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                  {lesson.key_points}
                </p>

                {lesson.tags && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {lesson.tags.split(',').map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-surface-container-highest text-[10px] text-on-surface-variant font-mono"
                      >
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-surface-container-highest/60 text-xs">
                <span className="text-primary font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span>Exam Verified</span>
                </span>
                <button
                  onClick={() => setSelectedLessonModal(lesson)}
                  className="px-3 py-1 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-primary/30 text-xs text-primary font-bold transition-colors flex items-center gap-1"
                >
                  <span>Review Concept</span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lesson Review Modal */}
      {selectedLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-surface-container-low border border-primary/40 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-surface-container-highest pb-3">
              <div>
                <span className="text-[10px] font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary-container/20 border border-primary/30">
                  {selectedLessonModal.category}
                </span>
                <h3 className="text-lg font-bold text-on-surface mt-1">{selectedLessonModal.title}</h3>
              </div>
              <button
                onClick={() => setSelectedLessonModal(null)}
                className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Audio Voice Player for this Concept */}
            <div className="p-4 rounded-2xl bg-surface-container-high/60 border border-primary/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">record_voice_over</span>
                  <span>Gnani Timbre Voice Review ({user.base_language})</span>
                </span>
              </div>
              <NeonAudioPlayer
                textToSpeak={
                  selectedLessonModal.full_explanation?.simple_explanation ||
                  selectedLessonModal.key_points
                }
                language={user.base_language}
                label="Listen to Vernacular Audio Summary"
              />
            </div>

            {/* 5-Tier Breakdown Cards if available */}
            {selectedLessonModal.full_explanation ? (
              <div className="space-y-3">
                {/* 1. Simple Vernacular Explanation */}
                <div className="p-4 rounded-2xl bg-surface-container-high/40 border border-primary/30 space-y-1">
                  <div className="text-xs font-bold text-primary uppercase">
                    1. Vernacular Explanation
                  </div>
                  <p className="text-xs md:text-sm text-on-surface leading-relaxed whitespace-pre-line">
                    {selectedLessonModal.full_explanation.simple_explanation}
                  </p>
                </div>

                {/* 2. Real-life Analogy */}
                <div className="p-4 rounded-2xl bg-surface-container-high/40 border border-secondary/30 space-y-1">
                  <div className="text-xs font-bold text-secondary uppercase">
                    2. Real-Life Analogy
                  </div>
                  <p className="text-xs md:text-sm text-on-surface/90 italic leading-relaxed">
                    "{selectedLessonModal.full_explanation.real_life_analogy}"
                  </p>
                </div>

                {/* 3. Academic Exam Answer */}
                <div className="p-4 rounded-2xl bg-surface-container-high/40 border border-outline/40 space-y-1">
                  <div className="text-xs font-bold text-amber-200 uppercase">
                    3. Exam-Ready Answer (English)
                  </div>
                  <p className="text-xs md:text-sm text-on-surface-variant font-mono bg-surface-container-lowest/80 p-3 rounded-xl border border-outline-variant/20 leading-relaxed">
                    {selectedLessonModal.full_explanation.exam_ready_answer}
                  </p>
                </div>

                {/* 4. Curriculum Citations if present */}
                {selectedLessonModal.curriculum_sources && selectedLessonModal.curriculum_sources.length > 0 && (
                  <div className="p-4 rounded-2xl bg-surface-container-high/40 border border-primary/30 space-y-2">
                    <div className="text-xs font-bold text-primary uppercase flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">verified</span>
                      <span>Verified Curriculum Grounding</span>
                    </div>
                    {selectedLessonModal.curriculum_sources.map((src, i) => (
                      <div key={i} className="text-xs text-on-surface-variant border-l-2 border-primary/60 pl-2.5 py-0.5">
                        <div className="font-semibold text-on-surface">
                          {src.document_title} • {src.chapter} {src.page_number ? `(p. ${src.page_number})` : ''}
                        </div>
                        <p className="italic text-[11px] mt-0.5">"{src.excerpt}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-surface-container-high/40 border border-outline-variant/30 space-y-2">
                <div className="text-xs font-bold text-primary uppercase">Core Concept Notes</div>
                <p className="text-sm text-on-surface leading-relaxed">{selectedLessonModal.key_points}</p>
              </div>
            )}

            <div className="pt-2 border-t border-surface-container-highest flex items-center justify-between">
              <button
                onClick={() => handleDelete(selectedLessonModal.id)}
                className="px-3.5 py-2 rounded-xl text-error hover:bg-error-container/20 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                <span>Unsave Lesson</span>
              </button>
              <button
                onClick={() => setSelectedLessonModal(null)}
                className="px-4 py-2 rounded-xl bg-surface-container-highest hover:bg-surface-container-high text-xs font-bold text-on-surface transition-colors"
              >
                Close Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
