import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ConversationSummary, ConversationDetail } from '../types';
import { fetchConversations, fetchConversationDetail, deleteConversation } from '../services/api';
import { ExplanationStream } from '../components/ExplanationStream';

export const HistoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadConversations = async (q?: string) => {
    try {
      setLoading(true);
      const list = await fetchConversations(q);
      setConversations(list);
      if (list.length > 0) {
        // If current selection is still in list, keep it; else select first
        const exists = selectedConversation && list.some((c) => c.id === selectedConversation.id);
        if (!exists) {
          const detail = await fetchConversationDetail(list[0].id);
          setSelectedConversation(detail);
        }
      } else {
        setSelectedConversation(null);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadConversations(searchQuery);
  };

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

  const handleDeleteConversation = async (convId: string) => {
    try {
      await deleteConversation(convId);
      setToastMessage('Conversation thread deleted.');
      setConfirmDeleteId(null);
      setTimeout(() => setToastMessage(null), 3000);
      await loadConversations(searchQuery);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleContinueInTutor = () => {
    if (selectedConversation) {
      navigate('/tutor', {
        state: { continueConversationId: selectedConversation.id },
      });
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Learning History</h2>
          <p className="text-xs text-on-surface-variant">
            Persistent record of multi-turn AI reasoning sessions and curriculum queries
          </p>
        </div>
        <button
          onClick={() => navigate('/tutor')}
          className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-neon hover:bg-primary/90 flex items-center gap-1.5 transition-all"
        >
          <span className="material-symbols-outlined text-sm">add_comment</span>
          <span>Start New Inquiry</span>
        </button>
      </div>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-primary/20 border border-primary/40 text-primary text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search past lessons, concepts, or questions..."
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
          className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-xs font-semibold text-on-surface transition-colors"
        >
          Filter
        </button>
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              loadConversations('');
            }}
            className="px-3 py-2 rounded-xl bg-surface-container-high text-xs text-on-surface-variant hover:text-on-surface"
          >
            Clear
          </button>
        )}
      </form>

      {/* Main Content Area */}
      {loading && !selectedConversation ? (
        <div className="text-center py-12 text-on-surface-variant text-sm flex items-center justify-center gap-2">
          <span className="material-symbols-outlined animate-spin text-primary">sync</span>
          <span>Loading persistent history...</span>
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-14 p-6 rounded-3xl border border-dashed border-surface-container-highest text-on-surface-variant space-y-3">
          <span className="material-symbols-outlined text-4xl text-outline">history_edu</span>
          <p className="text-sm">No learning sessions found {searchQuery ? 'matching your search' : 'yet'}.</p>
          <button
            onClick={() => navigate('/tutor')}
            className="px-4 py-2 rounded-xl bg-primary-container text-on-primary-container text-xs font-bold inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">school</span>
            <span>Ask Tutor a Question</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Conversation Pill Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {conversations.map((c) => {
              const isSelected = selectedConversation?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectConversation(c.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-primary-container text-on-primary-container border-primary-container shadow-neon'
                      : 'bg-surface-container-low text-on-surface border-surface-container-highest hover:border-outline'
                  }`}
                >
                  <span className="truncate max-w-[200px]">{c.title}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    {c.message_count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Conversation Detail Header & Thread Stream */}
          {selectedConversation && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-highest flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-on-surface">{selectedConversation.title}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-[10px] text-primary font-mono">
                      {selectedConversation.language}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    {selectedConversation.topic} • Started {new Date(selectedConversation.created_at).toLocaleDateString()} • {selectedConversation.messages.length} messages
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleContinueInTutor}
                    className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 transition-all shadow-neon"
                  >
                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                    <span>Continue Thread</span>
                  </button>

                  {confirmDeleteId === selectedConversation.id ? (
                    <div className="flex items-center gap-1.5 bg-error-container/20 p-1 rounded-xl border border-error/40">
                      <span className="text-[10px] text-error px-1 font-semibold">Delete?</span>
                      <button
                        onClick={() => handleDeleteConversation(selectedConversation.id)}
                        className="px-2 py-1 rounded-lg bg-error text-on-error text-[10px] font-bold"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 rounded-lg bg-surface-container-highest text-on-surface text-[10px]"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(selectedConversation.id)}
                      className="p-1.5 rounded-xl text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
                      title="Delete Conversation Thread"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Message List */}
              <div className="space-y-4">
                {selectedConversation.messages.filter((m, idx, arr) => { if (m.role !== 'assistant' || !m.explanation) return false; const firstIdx = arr.findIndex((o) => o.role === 'assistant' && (o.id === m.id || (o.query.trim().toLowerCase() === m.query.trim().toLowerCase() && o.explanation?.simple_explanation === m.explanation?.simple_explanation))); return firstIdx === idx; }).map((m) => {
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};
