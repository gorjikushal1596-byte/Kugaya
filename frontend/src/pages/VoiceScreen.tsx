import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import type { TutorInquiryResponse } from '../types';
import { NeuralOrb } from '../components/NeuralOrb';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { transcribeAudio, sendTutorQuery, synthesizeTTS } from '../services/api';
import { ExplanationStream } from '../components/ExplanationStream';

export const VoiceScreen: React.FC = () => {
  const { user } = useUser();
  const audioRecorder = useAudioRecorder();

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isReasoning, setIsReasoning] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [recognizedText, setRecognizedText] = useState('');
  const [isEditingText, setIsEditingText] = useState(false);
  const [activeSession, setActiveSession] = useState<TutorInquiryResponse | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);

  const handleToggleVoice = async () => {
    setServiceError(null);

    // If currently recording, STOP recording and send to Gnani Prisma STT
    if (audioRecorder.isRecording) {
      const blob = await audioRecorder.stopRecording();
      if (!blob || blob.size < 64) {
        setServiceError('Audio was too short or empty. Please try speaking again.');
        return;
      }

      try {
        setIsTranscribing(true);
        const sttResult = await transcribeAudio(
          blob,
          user.base_language.toLowerCase().slice(0, 2)
        );

        if (!sttResult.transcription || !sttResult.transcription.trim()) {
          setServiceError('No clear speech was recognized. Please speak clearly into your mic.');
          return;
        }

        setRecognizedText(sttResult.transcription);
        // Automatically query reasoning engine if user does not edit
        await processRecognizedQuestion(sttResult.transcription);
      } catch (err: unknown) {
        console.error('Gnani Prisma transcription failed:', err);
        setServiceError('Gnani Prisma speech recognition error. Check microphone and network.');
      } finally {
        setIsTranscribing(false);
      }
    } else {
      // START live recording
      audioRecorder.resetRecording();
      setRecognizedText('');
      await audioRecorder.startRecording();
    }
  };

  const processRecognizedQuestion = async (questionText: string) => {
    if (!questionText.trim()) return;

    try {
      setIsReasoning(true);
      const queryRes = await sendTutorQuery(
        questionText.trim(),
        user.base_language,
        user.dialect,
        activeSession?.conversation_id,
        'Voice Session'
      );
      setActiveSession(queryRes);

      // Synthesize response audio using Gnani Timbre TTS
      setIsSpeaking(true);
      const ttsRes = await synthesizeTTS(
        queryRes.explanation.simple_explanation,
        user.base_language.toLowerCase().slice(0, 2)
      );

      if (ttsRes.audio_base64 && ttsRes.audio_base64.length > 20) {
        const audio = new Audio(`data:audio/wav;base64,${ttsRes.audio_base64}`);
        audio.play().catch(() => {});
      }
    } catch (err) {
      console.error(err);
      setServiceError('Failed to generate Kugaya reasoning response.');
    } finally {
      setIsReasoning(false);
      setTimeout(() => setIsSpeaking(false), 3000);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingText(false);
    processRecognizedQuestion(recognizedText);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Voice Mode Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Voice Tutor Session</h2>
          <p className="text-xs text-on-surface-variant">
            Live Gnani AI Prisma v2.5 (STT) & Timbre v2.5 (TTS)
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high border border-primary-container/20 text-xs text-primary font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{user.base_language} + Eng</span>
        </div>
      </div>

      {/* Futuristic Neural Sound Orb Visualizer */}
      <div className="p-6 rounded-3xl bg-surface-container-low border border-primary-container/30 shadow-neon">
        <NeuralOrb
          isListening={audioRecorder.isRecording}
          isSpeaking={isSpeaking}
          volumeLevel={audioRecorder.volumeLevel}
          durationSeconds={audioRecorder.recordingDuration}
          onToggle={handleToggleVoice}
        />

        {/* Live Audio Status / Loading States */}
        {audioRecorder.error && (
          <div className="mt-3 p-3 rounded-xl bg-error-container/20 border border-error/40 text-error text-xs text-center">
            {audioRecorder.error}
          </div>
        )}

        {serviceError && (
          <div className="mt-3 p-3 rounded-xl bg-error-container/20 border border-error/40 text-error text-xs text-center">
            {serviceError}
          </div>
        )}

        {isTranscribing && (
          <div className="mt-3 p-3 rounded-xl bg-surface-container-high border border-primary-container/40 text-primary text-xs text-center flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm animate-spin">sync</span>
            <span>Transcribing audio with Gnani AI Prisma v2.5...</span>
          </div>
        )}

        {isReasoning && (
          <div className="mt-3 p-3 rounded-xl bg-surface-container-high border border-secondary/40 text-secondary text-xs text-center flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm animate-spin">psychology</span>
            <span>Synthesizing pedagogical breakdown with Meta Muse Spark Open...</span>
          </div>
        )}

        {/* Recognized Text Preview Card with Inline Edit Option */}
        {recognizedText && (
          <div className="mt-4 p-4 rounded-2xl bg-surface-container-high/60 border border-outline-variant/30 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              <span className="flex items-center gap-1 text-primary">
                <span className="material-symbols-outlined text-xs">record_voice_over</span>
                <span>Recognized Speech ({user.base_language})</span>
              </span>
              <button
                onClick={() => setIsEditingText(!isEditingText)}
                className="text-primary hover:underline flex items-center gap-0.5 lowercase"
              >
                <span className="material-symbols-outlined text-xs">edit</span>
                <span>{isEditingText ? 'cancel' : 'edit transcription'}</span>
              </button>
            </div>

            {isEditingText ? (
              <form onSubmit={handleEditSubmit} className="space-y-2">
                <input
                  type="text"
                  value={recognizedText}
                  onChange={(e) => setRecognizedText(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-primary-container text-xs text-on-surface focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container text-xs font-bold"
                  >
                    Resubmit Question
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm font-medium text-on-surface italic">
                "{recognizedText}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* Voice Results Stream */}
      {activeSession && (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-primary px-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">neurology</span>
            <span>Synthesized 5-Card Multi-modal Explanation</span>
          </div>
          <ExplanationStream
            query={activeSession.query}
            explanation={activeSession.explanation}
            language={activeSession.language}
            provider={activeSession.provider}
            latencyMs={activeSession.latency_ms}
            onAskFollowUp={(followUp) => {
              processRecognizedQuestion(followUp);
            }}
          />
        </div>
      )}
    </div>
  );
};
