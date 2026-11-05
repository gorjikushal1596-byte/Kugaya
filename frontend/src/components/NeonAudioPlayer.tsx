import React, { useState, useRef, useEffect } from 'react';
import { synthesizeTTS } from '../services/api';
import { registerActivePlayer, unregisterActivePlayer } from '../utils/audioCoordinator';

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
    .replace(/[_~>|]/g, ' ')
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
  const cachedAudioBlobUrlRef = useRef<string | null>(null);
  const playerId = useRef(`player_${Math.random().toString(36).slice(2, 9)}`).current;

  // Ensure HTML5 Audio instance is initialized and listeners bound
  const getOrCreateAudioElement = (): HTMLAudioElement => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = 'auto';

      audio.onplay = () => {
        setIsPlaying(true);
        onPlaybackStateChange?.(true);
      };

      audio.onpause = () => {
        setIsPlaying(false);
        onPlaybackStateChange?.(false);
      };

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
        unregisterActivePlayer(playerId);
        onPlaybackStateChange?.(false);
      };

      audio.onerror = () => {
        console.warn('Audio element error or source reset.');
        setIsPlaying(false);
        onPlaybackStateChange?.(false);
      };

      audioRef.current = audio;
    }
    return audioRef.current;
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (isUsingNativeSpeech && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    setIsPlaying(false);
    onPlaybackStateChange?.(false);
  };

  const handleResume = () => {
    registerActivePlayer(playerId, handlePause, handleStop);
    if (isUsingNativeSpeech && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      onPlaybackStateChange?.(true);
      return;
    }

    const audio = getOrCreateAudioElement();
    const sourceUrl = audioUrl || cachedAudioBlobUrlRef.current;

    if (sourceUrl) {
      if (!audio.src || audio.src !== sourceUrl) {
        audio.src = sourceUrl;
      }
      audio.playbackRate = playbackSpeed;
      audio.play().then(() => {
        setIsPlaying(true);
        onPlaybackStateChange?.(true);
      }).catch((err) => {
        console.warn('Playback resume notice:', err);
        setIsPlaying(false);
        onPlaybackStateChange?.(false);
      });
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    unregisterActivePlayer(playerId);
    setIsLoading(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setIsUsingNativeSpeech(false);
    // Setting audioUrl to null cleanly restores the card's original button (e.g. "Listen Analogy")
    // while cachedAudioBlobUrlRef keeps the synthesized audio for instant restart on next tap
    setAudioUrl(null);
    onPlaybackStateChange?.(false);
  };

  // Reset audio cache when text or language changes
  useEffect(() => {
    handleStop();
    if (cachedAudioBlobUrlRef.current) {
      URL.revokeObjectURL(cachedAudioBlobUrlRef.current);
      cachedAudioBlobUrlRef.current = null;
    }
  }, [textToSpeak, language]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      unregisterActivePlayer(playerId);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      if (cachedAudioBlobUrlRef.current) {
        URL.revokeObjectURL(cachedAudioBlobUrlRef.current);
        cachedAudioBlobUrlRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [playerId]);

  const loadAndPlayAudio = async () => {
    setError(null);

    // If native speech synthesis was in progress, toggle play/resume
    if (isUsingNativeSpeech && 'speechSynthesis' in window) {
      if (isPlaying) {
        handlePause();
      } else {
        handleResume();
      }
      return;
    }

    const audio = getOrCreateAudioElement();

    // Fast-path: if audio was already synthesized and cached for this card, play immediately
    if (cachedAudioBlobUrlRef.current) {
      registerActivePlayer(playerId, handlePause, handleStop);
      setAudioUrl(cachedAudioBlobUrlRef.current);
      if (audio.src !== cachedAudioBlobUrlRef.current) {
        audio.src = cachedAudioBlobUrlRef.current;
      }
      audio.playbackRate = playbackSpeed;
      audio.currentTime = 0;
      try {
        await audio.play();
        setIsPlaying(true);
        onPlaybackStateChange?.(true);
      } catch (e) {
        console.warn('Cached audio playback notice:', e);
      }
      return;
    }

    // Register active player so other playing cards pause immediately
    registerActivePlayer(playerId, handlePause, handleStop);

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
        throw new Error('No audio returned from Timbre model.');
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

      cachedAudioBlobUrlRef.current = url;
      setAudioUrl(url);

      audio.src = url;
      audio.playbackRate = playbackSpeed;

      // Set initial duration from backend estimate immediately
      if (res.duration_seconds && res.duration_seconds > 0) {
        setDuration(res.duration_seconds);
      }

      try {
        await audio.play();
        setIsPlaying(true);
        onPlaybackStateChange?.(true);
      } catch (playErr) {
        console.warn('Autoplay restricted by browser policy; audio is loaded and ready:', playErr);
        setIsPlaying(false);
        onPlaybackStateChange?.(false);
      }
    } catch (err: unknown) {
      console.warn('Gnani Timbre network synthesis fallback triggering native speech:', err);
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
            setCurrentTime(0);
            unregisterActivePlayer(playerId);
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
    registerActivePlayer(playerId, handlePause, handleStop);
    const audio = getOrCreateAudioElement();
    const sourceUrl = audioUrl || cachedAudioBlobUrlRef.current;
    if (sourceUrl) {
      if (audio.src !== sourceUrl) {
        audio.src = sourceUrl;
      }
      setAudioUrl(sourceUrl);
      audio.currentTime = 0;
      audio.playbackRate = playbackSpeed;
      audio.play().then(() => {
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
      <div className="flex items-center gap-2 flex-wrap">
        {/* State 1: When Playing -> PAUSE Button */}
        {isPlaying && (
          <button
            type="button"
            onClick={handlePause}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold transition-all active:scale-95 border border-amber-500/40 shadow-sm"
            title="Pause Voice Over"
          >
            <span className="material-symbols-outlined text-[16px]">pause</span>
            <span>Pause</span>
          </button>
        )}

        {/* State 2: When Paused (audio loaded, stopped mid-way) -> RESUME Button */}
        {!isPlaying && audioUrl && (
          <button
            type="button"
            onClick={handleResume}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all active:scale-95 border border-emerald-500/40 shadow-sm"
            title="Resume Voice Over"
          >
            <span className="material-symbols-outlined text-[16px] fill-1">play_arrow</span>
            <span>Resume</span>
          </button>
        )}

        {/* State 3: When Initial / Stopped -> LISTEN Card Button */}
        {!isPlaying && !audioUrl && (
          <button
            type="button"
            onClick={loadAndPlayAudio}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/15 hover:bg-primary-container/30 text-primary text-xs font-semibold transition-all active:scale-95 border border-primary-container/40"
            title="Play Audio with Gnani Timbre"
          >
            {isLoading ? (
              <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
            ) : (
              <span className="material-symbols-outlined text-[16px] fill-1">volume_up</span>
            )}
            <span>{isLoading ? 'Synthesizing...' : label}</span>
          </button>
        )}

        {/* STOP Button: Always accessible when playing, paused, or synthesizing to immediately halt voice */}
        {(isPlaying || audioUrl || isLoading) && (
          <button
            type="button"
            onClick={handleStop}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/40 transition-all active:scale-95 shadow-sm"
            title="Stop voice playback"
          >
            <span className="material-symbols-outlined text-[15px] fill-1">stop</span>
            <span>Stop</span>
          </button>
        )}

        {/* Replay Button (Available once audio has been loaded) */}
        {audioUrl && (
          <button
            type="button"
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
            type="button"
            onClick={handleSpeedToggle}
            className="px-2 py-0.5 rounded-md bg-surface-container-high border border-outline-variant/30 text-[10px] font-mono font-bold text-primary hover:bg-surface-container-highest transition-colors"
            title="Toggle playback speed"
          >
            {playbackSpeed}x
          </button>
        )}

        {/* Subtle Waveform Animation when playing */}
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
