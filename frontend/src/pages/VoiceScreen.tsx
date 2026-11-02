import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import type { LearningSessionResponse } from '../types';
import { NeuralOrb } from '../components/NeuralOrb';
import { transcribeAudio, sendQuery, synthesizeTTS } from '../services/api';
import { ExplanationStream } from '../components/ExplanationStream';

export const VoiceScreen: React.FC = () => {
  const { user } = useUser();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [activeSession, setActiveSession] = useState<LearningSessionResponse | null>(null);

  const handleToggleVoice = async () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      setIsListening(true);
      setLiveTranscription(`Listening for your speech in ${user.base_language}...`);

      // Mock audio blob sent to Gnani Prisma STT adapter
      const dummyBlob = new Blob(['sample-pcm-data'], { type: 'audio/wav' });
      const sttResult = await transcribeAudio(dummyBlob, user.base_language.toLowerCase().slice(0, 2));

      setLiveTranscription(sttResult.transcription);
      setIsListening(false);

      // Auto-query the AI reasoning service with transcription
      setIsSpeaking(true);
      const queryRes = await sendQuery(
        sttResult.transcription,
        user.base_language,
        user.dialect,
        'Voice Session'
      );
      setActiveSession(queryRes);

      // Synthesize response audio using Gnani Timbre TTS
      const ttsRes = await synthesizeTTS(
        queryRes.explanation.simple_explanation,
        user.base_language.toLowerCase().slice(0, 2)
      );

      if (ttsRes.audio_base64 && ttsRes.audio_base64.length > 20) {
        const audio = new Audio(`data:audio/wav;base64,${ttsRes.audio_base64}`);
        audio.play().catch(() => {});
      }
    } catch (e) {
      console.error(e);
      setLiveTranscription('Voice service connection failed. Please verify backend.');
    } finally {
      setTimeout(() => setIsSpeaking(false), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Voice Mode Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Voice Tutor Session</h2>
          <p className="text-xs text-on-surface-variant">
            Powered by Gnani AI Prisma v2.5 (STT) & Timbre v2.5 (TTS)
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high border border-primary-container/20 text-xs text-primary font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Live Audio Mode</span>
        </div>
      </div>

      {/* Futuristic Neural Sound Orb Visualizer */}
      <div className="p-6 rounded-3xl bg-surface-container-low border border-primary-container/30 shadow-neon">
        <NeuralOrb
          isListening={isListening}
          isSpeaking={isSpeaking}
          onToggle={handleToggleVoice}
        />

        {/* Live Transcription Preview Card */}
        <div className="mt-4 p-4 rounded-2xl bg-surface-container-high/60 border border-outline-variant/30 text-center">
          <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-xs text-primary">record_voice_over</span>
            <span>Real-time Transcription ({user.base_language})</span>
          </div>
          <p className="text-sm font-medium text-on-surface italic">
            {liveTranscription || `"Pointer dereferencing ante enti Kugaya? Null pointer exception eppudu vastundhi?"`}
          </p>
        </div>
      </div>

      {/* Voice Results Stream */}
      {activeSession && (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-primary px-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">neurology</span>
            <span>Synthesized 4-Card Multi-modal Explanation</span>
          </div>
          <ExplanationStream
            query={activeSession.query}
            explanation={activeSession.explanation}
            language={activeSession.language}
            onAskFollowUp={(followUp) => {
              sendQuery(followUp, user.base_language, user.dialect, 'Voice Follow-up').then(setActiveSession);
            }}
          />
        </div>
      )}
    </div>
  );
};

