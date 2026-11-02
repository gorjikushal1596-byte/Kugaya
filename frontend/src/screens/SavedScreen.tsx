import React, { useEffect, useState } from 'react';
import type { SavedLessonItem } from '../types';
import { fetchSavedLessons } from '../services/api';

export const SavedScreen: React.FC = () => {
  const [lessons, setLessons] = useState<SavedLessonItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedLessons()
      .then(setLessons)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-xl font-bold text-on-surface">Saved Lessons & Concepts</h2>
        <p className="text-xs text-on-surface-variant">Bookmarked topics and exam summaries</p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-on-surface-variant text-sm">Loading saved lessons...</div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-12 p-4 rounded-3xl border border-dashed border-surface-container-highest text-on-surface-variant text-sm">
          No saved concepts yet. Bookmark cards in the AI Tutor workspace!
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="p-5 rounded-2xl bg-surface-container-low border border-surface-container-highest shadow-md hover:border-primary-container/40 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary-container/15 border border-primary-container/30">
                  {lesson.category}
                </span>
                <span className="text-[10px] text-on-surface-variant">
                  {new Date(lesson.saved_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-base font-bold text-on-surface">{lesson.title}</h3>
              <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">
                {lesson.key_points}
              </p>
              <div className="pt-2 flex items-center justify-between border-t border-surface-container-highest/60 text-xs">
                <span className="text-primary font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  Exam Verified
                </span>
                <button className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1">
                  <span>Open Cards</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
