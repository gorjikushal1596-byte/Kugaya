import React, { useState, useRef, useEffect } from 'react';
import { synthesizeTTS } from '../services/api';

interface NeonAudioPlayerProps {
  textToSpeak: string;
  language: string;
  label?: string;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
}

function cleanTextForSpeech(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveLangCode(lang: string): string {
  const l = (lang || '').toLowerCase();
  if (l.includes('telugu') || l.startsWith('te')) return 'te';
  if (l.includes('kannada') || l.startsWith('kn') || l.startsWith('ka')) return 'kn';
  if (l.includes('tamil') || l.startsWith('ta')) return 'ta';
  if (l.includes('hindi') || l.startsWith('hi')) return 'hi';
  if (l.includes('malayalam') || l.startsWith('ml')) return 'ml';
  if (l.includes('bengali') || l.startsWith('bn')) return 'bn';
  if (l.includes('english') || l.startsWith('en')) return 'en';
  return 'te';
}

export const NeonAudioPlayer: React.FC<NeonAudioPlayerProps> = ({
  textToSpeak,
  language,
  label = 'Listen',
  onPlaybackStateChange,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [error, setError] = useState<string | null>(null);
  const [isUsingNativeSpeech, setIsUsingNativeSpeech] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [audioUrl]);

  const loadAndPlayAudio = async () => {
    setError(null);

    // If native speech synthesis was used and is playing, toggle pause
    if (isUsingNativeSpeech && 'speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        onPlaybackStateChange?.(false);
      }
      return;
    }

    // If audio element is already primed with audioUrl, toggle play/pause immediately
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        onPlaybackStateChange?.(false);
      } else {
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          onPlaybackStateChange?.(true);
        }).catch((err) => {
          console.warn('Playback resume notice:', err);
          setIsPlaying(false);
          onPlaybackStateChange?.(false);
        });
      }
      return;
    }

    // Synchronously create or reuse audio instance on user gesture to satisfy mobile autoplay policies
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    const cleanedText = cleanTextForSpeech(textToSpeak);
    if (!cleanedText) {
      setError('No text to speak.');
      return;
    }

    try {
      setIsLoading(true);
      const langCode = resolveLangCode(language);
      const res = await synthesizeTTS(cleanedText, langCode, playbackSpeed);

      if (!res.audio_base64) {
        throw new Error('No audio returned from Timbre.');
      }

      // Convert base64 into WAV Blob
      const cleanB64 = res.audio_base64.replace(/\s/g, '');
      const byteCharacters = atob(cleanB64);
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteNumbers], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      audio.src = url;
      audio.playbackRate = playbackSpeed;

      // Set initial duration from backend estimate immediately
      if (res.duration_seconds && res.duration_seconds > 0) {
        setDuration(res.duration_seconds);
      }

      audio.onloadedmetadata = () => {
        if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
          setDuration(audio.duration);
        }
      };

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        onPlaybackStateChange?.(false);
      };

      audio.onerror = () => {
        console.warn('Audio element decode event.');
        setIsPlaying(false);
        onPlaybackStateChange?.(false);
      };

      try {
        await audio.play();
        setIsPlaying(true);
        onPlaybackStateChange?.(true);
      } catch (playErr) {
        // Mobile browsers may restrict unprimed async play; audio is ready so next user tap plays instantly
        console.warn('Autoplay restricted by mobile policy; audio is loaded and ready for tap:', playErr);
        setIsPlaying(false);
        onPlaybackStateChange?.(false);
      }
    } catch (err: unknown) {
      console.warn('Timbre network synthesis fallback triggering native speech:', err);
      // Fallback gracefully to Web Speech API so student experience is uninterrupted
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(cleanedText);
          const langCode = resolveLangCode(language);
          utterance.lang = langCode === 'te' ? 'te-IN' : 'en-IN';
          utterance.rate = playbackSpeed;
          utterance.onstart = () => {
            setIsUsingNativeSpeech(true);
            setIsPlaying(true);
            onPlaybackStateChange?.(true);
          };
          utterance.onend = () => {
            setIsPlaying(false);
            setIsUsingNativeSpeech(false);
            onPlaybackStateChange?.(false);
          };
          utterance.onerror = () => {
            setIsPlaying(false);
            setIsUsingNativeSpeech(false);
            onPlaybackStateChange?.(false);
          };
          window.speechSynthesis.speak(utterance);
          return;
        } catch {
          // Ignore
        }
      }
      setError('Speech synthesis failed. Please retry.');
      setIsPlaying(false);
      onPlaybackStateChange?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplay = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        onPlaybackStateChange?.(true);
      }).catch(console.error);
    } else {
      loadAndPlayAudio();
    }
  };

  const handleSpeedToggle = () => {
    const speeds = [0.75, 1.0, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const formatSecs = (s: number) => {
    if (!s || !isFinite(s) || isNaN(s)) return '0:00';
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col space-y-1.5 w-full">
      <div className="flex items-center gap-2">
        {/* Main Play / Pause Button */}
        <button
          onClick={loadAndPlayAudio}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/15 hover:bg-primary-container/30 text-primary text-xs font-semibold transition-all active:scale-95 border border-primary-container/40"
          title={isPlaying ? 'Pause' : 'Play Audio with Gnani Timbre'}
        >
          {isLoading ? (
            <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
          ) : (
            <span className="material-symbols-outlined text-[16px] fill-1">
              {isPlaying ? 'pause' : 'volume_up'}
            </span>
          )}
          <span>
            {isLoading
              ? 'Synthesizing...'
              : isPlaying
              ? 'Pause'
              : audioUrl && !isPlaying
              ? 'Tap to Play'
              : label}
          </span>
        </button>

        {/* Replay Button */}
        {audioUrl && (
          <button
            onClick={handleReplay}
            className="p-1 rounded-full text-on-surface-variant hover:text-primary transition-colors text-xs"
            title="Replay from start"
          >
            <span className="material-symbols-outlined text-base">replay</span>
          </button>
        )}

        {/* Playback Speed Controller */}
        {audioUrl && (
          <button
            onClick={handleSpeedToggle}
            className="px-2 py-0.5 rounded-md bg-surface-container-high border border-outline-variant/30 text-[10px] font-mono font-bold text-primary hover:bg-surface-container-highest transition-colors"
            title="Toggle playback speed"
          >
            {playbackSpeed}x
          </button>
        )}

        {/* Subtle Waveform Animation when active */}
        {isPlaying && (
          <div className="flex items-center gap-0.5 h-3 px-1">
            <span className="w-0.5 h-full bg-primary-container animate-pulse"></span>
            <span className="w-0.5 h-2/3 bg-primary-container animate-pulse delay-75"></span>
            <span className="w-0.5 h-full bg-primary-container animate-pulse delay-150"></span>
            <span className="w-0.5 h-1/2 bg-primary-container animate-pulse delay-100"></span>
          </div>
        )}
      </div>

      {/* Scrubber Progress Bar (Visible once audio is loaded) */}
      {audioUrl && duration > 0 && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[10px] font-mono text-on-surface-variant">
            {formatSecs(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary-container"
          />
          <span className="text-[10px] font-mono text-on-surface-variant">
            {formatSecs(duration)}
          </span>
        </div>
      )}

      {error && (
        <div className="text-[11px] text-error flex items-center gap-1 mt-0.5">
          <span className="material-symbols-outlined text-xs">error</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
