import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import type { TutorInquiryResponse, MessageItem, CurriculumDocumentSummary } from '../types';
import {
  sendTutorQuery,
  transcribeAudio,
  fetchCurriculumDocuments,
  uploadCurriculumDocument,
  deleteCurriculumDocument,
  fetchConversationDetail,
} from '../services/api';
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

  // Curriculum RAG state
  const [useCurriculumRag, setUseCurriculumRag] = useState(true);
  const [showCurriculumModal, setShowCurriculumModal] = useState(false);
  const [curriculumDocs, setCurriculumDocs] = useState<CurriculumDocumentSummary[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docUploadSuccess, setDocUploadSuccess] = useState<string | null>(null);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Computer Science');

  // Microphone recording simulation & speech-to-text preview
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptionPreview, setTranscriptionPreview] = useState<string | null>(null);

  const loadCurriculumDocs = async () => {
    try {
      const docs = await fetchCurriculumDocuments();
      setCurriculumDocs(docs);
    } catch (e) {
      console.error('Failed to load curriculum documents:', e);
    }
  };

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

      // Call FastAPI Baseten reasoning engine with RAG parameter
      const res = await sendTutorQuery(
        queryString.trim(),
        user.base_language,
        user.dialect,
        convId || undefined,
        selectedSubject,
        useCurriculumRag
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

  useEffect(() => {
    loadCurriculumDocs();
  }, []);

  useEffect(() => {
    if (location.state) {
      const stateObj = location.state as { initialQuery?: string; continueConversationId?: string };
      if (stateObj.initialQuery) {
        setQueryInput(stateObj.initialQuery);
        executeExplanation(stateObj.initialQuery, null);
      } else if (stateObj.continueConversationId) {
        setConversationId(stateObj.continueConversationId);
        fetchConversationDetail(stateObj.continueConversationId)
          .then((detail) => {
            if (detail && detail.messages) {
              setMessages(detail.messages);
            }
          })
          .catch(console.error);
      }
    }
  }, [location.state]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingDoc(true);
      setDocUploadError(null);
      setDocUploadSuccess(null);

      const resp = await uploadCurriculumDocument(file, customTitle || undefined, selectedSubject);
      setDocUploadSuccess(resp.message);
      setCustomTitle('');
      await loadCurriculumDocs();
    } catch (err: unknown) {
      setDocUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploadingDoc(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleUploadSampleSyllabus = async () => {
    try {
      setIsUploadingDoc(true);
      setDocUploadError(null);
      setDocUploadSuccess(null);

      const sampleContent = `Chapter 4: Memory Management and Virtual Addressing
Page 84
In modern computer architecture, virtual memory decouples the programmer's logical view of memory from physical RAM.
The Memory Management Unit (MMU) is the hardware component responsible for translating virtual addresses into physical addresses using page tables.
A Translation Lookaside Buffer (TLB) is an on-chip associative cache that stores recently accessed virtual-to-physical address mappings.

Chapter 5: Virtual Memory and Paging Algorithms
Page 96
When a process references a virtual page not present in physical RAM, the hardware raises a page fault exception.
The operating system traps the fault, reads the required page frame from backing secondary storage (swap/disk), updates the page table entry, and restarts the instruction.
Standard page replacement policies include: Least Recently Used (LRU), First-In First-Out (FIFO), and Clock / Second Chance algorithm.`;

      const blob = new Blob([sampleContent], { type: 'text/plain' });
      const file = new File([blob], 'university_os_curriculum.txt', { type: 'text/plain' });

      const resp = await uploadCurriculumDocument(file, 'University OS & Architecture Curriculum', 'Computer Science');
      setDocUploadSuccess(resp.message);
      await loadCurriculumDocs();
    } catch (err: unknown) {
      setDocUploadError(err instanceof Error ? err.message : 'Sample ingestion failed');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      await deleteCurriculumDocument(docId);
      await loadCurriculumDocs();
    } catch (err) {
      console.error('Failed to delete document:', err);
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
    'How does Least Recently Used (LRU) paging work?',
    'Recursion vs Iteration stack limits',
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Active Workspace Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-on-surface">AI Tutor Workspace</h2>
          <p className="text-xs text-on-surface-variant">
            Powered by Meta Muse Spark Open via Baseten in {user.base_language} + English
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* RAG Toggle */}
          <button
            onClick={() => setUseCurriculumRag(!useCurriculumRag)}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              useCurriculumRag
                ? 'bg-primary/20 text-primary border-primary/40 shadow-neon'
                : 'bg-surface-container-high text-on-surface-variant border-outline-variant/40'
            }`}
            title="Toggle Curriculum Grounding"
          >
            <span className="material-symbols-outlined text-sm">
              {useCurriculumRag ? 'verified' : 'menu_book'}
            </span>
            <span>RAG Grounding: {useCurriculumRag ? 'ON' : 'OFF'}</span>
          </button>

          {/* Curriculum Documents Manager Button */}
          <button
            onClick={() => setShowCurriculumModal(true)}
            className="px-3 py-1 rounded-full bg-surface-container-high hover:bg-surface-container-highest border border-surface-container-highest text-xs text-on-surface hover:text-primary transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">library_books</span>
            <span>Curriculum ({curriculumDocs.length})</span>
          </button>

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
              placeholder={`Ask any university or technical question in ${user.base_language} or English... (e.g. "Explain LRU page replacement algorithm")`}
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

          {/* Speech Transcription Live Preview */}
          {transcriptionPreview && (
            <div className="p-2.5 rounded-xl bg-surface-container-high/80 border border-primary-container/30 flex items-center justify-between text-xs text-on-surface">
              <span className="truncate italic">STT: "{transcriptionPreview}"</span>
              <span className="text-[10px] text-primary shrink-0 ml-2 font-semibold">
                Preview / Editable
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-[11px] text-on-surface-variant flex items-center gap-2">
              <span>
                Tutor Delivery:{' '}
                <span className="text-primary font-semibold">
                  {user.base_language} + English Code-mixed
                </span>
              </span>
              {useCurriculumRag && (
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-[10px] text-primary font-medium">
                  Curriculum Grounded
                </span>
              )}
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

      {/* Curriculum Documents Modal */}
      {showCurriculumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-surface-container-low border border-primary/40 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-surface-container-highest pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">auto_stories</span>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Curriculum Knowledge Base</h3>
                  <p className="text-xs text-on-surface-variant">
                    Accredited textbooks and lecture notes indexed for Hybrid RAG grounding
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCurriculumModal(false)}
                className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Ingestion Area */}
            <div className="p-4 rounded-2xl bg-surface-container-high/60 border border-outline-variant/30 space-y-3">
              <div className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">upload_file</span>
                <span>Upload Textbook or Notes (.pdf, .txt, .md)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Document Title (Optional)"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary"
                />
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                  <option value="Operating Systems">Operating Systems</option>
                  <option value="Computer Networks">Computer Networks</option>
                  <option value="DBMS">Database Systems</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold cursor-pointer hover:bg-primary/90 transition-all">
                  <span className="material-symbols-outlined text-sm">attach_file</span>
                  <span>{isUploadingDoc ? 'Indexing...' : 'Choose File to Index'}</span>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md"
                    onChange={handleFileUpload}
                    disabled={isUploadingDoc}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleUploadSampleSyllabus}
                  disabled={isUploadingDoc}
                  className="px-3 py-2 rounded-xl bg-surface-container-highest hover:bg-surface-container-high text-xs text-on-surface font-semibold border border-outline-variant/40 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm text-secondary">bolt</span>
                  <span>Load Sample OS Syllabus</span>
                </button>
              </div>

              {docUploadSuccess && (
                <div className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  <span>{docUploadSuccess}</span>
                </div>
              )}
              {docUploadError && (
                <div className="text-xs text-error flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">error</span>
                  <span>{docUploadError}</span>
                </div>
              )}
            </div>

            {/* Active Documents List */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Indexed Textbooks & Notes ({curriculumDocs.length})
              </div>
              {curriculumDocs.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-outline-variant/30 text-center text-xs text-on-surface-variant">
                  No custom textbooks uploaded yet. Standard AICTE Engineering Syllabus grounding is active as accredited fallback.
                </div>
              ) : (
                <div className="space-y-2">
                  {curriculumDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl bg-surface-container-high/40 border border-outline-variant/30 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-on-surface flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-sm">description</span>
                          <span>{doc.title}</span>
                          <span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-[10px] text-on-surface-variant font-mono uppercase">
                            {doc.file_type}
                          </span>
                        </div>
                        <div className="text-[10px] text-on-surface-variant flex items-center gap-2">
                          <span>{doc.subject}</span>
                          <span>•</span>
                          <span>{doc.chunk_count} vector chunks</span>
                          <span>•</span>
                          <span>{Math.round(doc.file_size_bytes / 1024)} KB</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="p-1.5 rounded-lg text-error hover:bg-error-container/20 transition-colors"
                        title="Delete Document"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-surface-container-highest flex justify-end">
              <button
                onClick={() => setShowCurriculumModal(false)}
                className="px-4 py-2 rounded-xl bg-surface-container-highest hover:bg-surface-container-high text-xs font-bold text-on-surface transition-colors"
              >
                Close Library
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};