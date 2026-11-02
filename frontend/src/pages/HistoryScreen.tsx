import React, { useEffect, useState } from 'react';
import type { ConversationSummary, ConversationDetail } from '../types';
import { fetchConversations, fetchConversationDetail } from '../services/api';
import { ExplanationStream } from '../components/ExplanationStream';

export const HistoryScreen: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations()
      .then(async (list) => {
        setConversations(list);
        if (list.length > 0) {
          const detail = await fetchConversationDetail(list[0].id);
          setSelectedConversation(detail);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSelectConversation = async (convId: string) => {
    try {
      setLoading(true);
      const detail = await fetchConversationDetail(convId);
      setSelectedConversation(detail);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-xl font-bold text-on-surface">Learning History</h2>
        <p className="text-xs text-on-surface-variant">Review previous concept breakdowns and Q&A sessions</p>
      </div>

      {loading && !selectedConversation ? (
        <div className="text-center py-10 text-on-surface-variant text-sm">Loading history...</div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-12 p-4 rounded-3xl border border-dashed border-surface-container-highest text-on-surface-variant text-sm">
          No learning sessions recorded yet. Start by asking a question!
        </div>
      ) : (
        <div className="space-y-4">
          {/* Conversation Pill Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectConversation(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                  selectedConversation?.id === c.id
                    ? 'bg-primary-container text-on-primary-container border-primary-container shadow-neon'
                    : 'bg-surface-container-low text-on-surface border-surface-container-highest hover:border-outline'
                }`}
              >
                {c.title.length > 25 ? c.title.slice(0, 25) + '...' : c.title}
              </button>
            ))}
          </div>

          {/* Render selected conversation stream */}
          {selectedConversation && (
            <div className="space-y-4">
              {selectedConversation.messages.map((m) => {
                if (m.role === 'assistant' && m.explanation) {
                  return (
                    <ExplanationStream
                      key={m.id}
                      query={m.query}
                      explanation={m.explanation}
                      language={selectedConversation.language}
                    />
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
