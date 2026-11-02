import React, { useEffect, useState } from 'react';
import type { LearningSessionResponse } from '../types';
import { fetchHistory } from '../services/api';
import { ExplanationStream } from '../components/ExplanationStream';

export const HistoryScreen: React.FC = () => {
  const [history, setHistory] = useState<LearningSessionResponse[]>([]);
  const [selectedSession, setSelectedSession] = useState<LearningSessionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory()
      .then((data) => {
        setHistory(data);
        if (data.length > 0) setSelectedSession(data[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-xl font-bold text-on-surface">Learning History</h2>
        <p className="text-xs text-on-surface-variant">Review previous concept breakdowns and Q&A sessions</p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-on-surface-variant text-sm">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 p-4 rounded-3xl border border-dashed border-surface-container-highest text-on-surface-variant text-sm">
          No learning sessions recorded yet. Start by asking a question!
        </div>
      ) : (
        <div className="space-y-4">
          {/* History Pill Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {history.map((s) => (
              <button
                key={s.session_id}
                onClick={() => setSelectedSession(s)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                  selectedSession?.session_id === s.session_id
                    ? 'bg-primary-container text-on-primary-container border-primary-container shadow-neon'
                    : 'bg-surface-container-low text-on-surface border-surface-container-highest hover:border-outline'
                }`}
              >
                {s.query.length > 25 ? s.query.slice(0, 25) + '...' : s.query}
              </button>
            ))}
          </div>

          {selectedSession && (
            <ExplanationStream
              query={selectedSession.query}
              explanation={selectedSession.explanation}
              language={selectedSession.language}
            />
          )}
        </div>
      )}
    </div>
  );
};

