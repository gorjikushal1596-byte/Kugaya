import React, { useState, useRef, useEffect } from 'react';
import { synthesizeTTS } from '../services/api';

interface NeonAudioPlayerProps {
  textToSpeak: string;
  language: string;
  label?: string;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
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
    };
  }, [audioUrl]);

  const loadAndPlayAudio = async () => {
    setError(null);

    // If audio already generated, simply resume/play
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        onPlaybackStateChange?.(false);
      } else {
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
        onPlaybackStateChange?.(true);
      }
      return;
    }

    try {
      setIsLoading(true);
      const res = await synthesizeTTS(textToSpeak, language.toLowerCase().slice(0, 2), playbackSpeed);

      if (!res.audio_base64) {
        throw new Error('No audio content returned from Timbre.');
      }

      // Convert base64 to binary blob URL
      const byteCharacters = atob(res.audio_base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      const audio = new Audio(url);
      audio.playbackRate = playbackSpeed;
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        setDuration(audio.duration || res.duration_seconds || 0);
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
        setError('Audio playback error.');
        setIsPlaying(false);
        onPlaybackStateChange?.(false);
      };

      await audio.play();
      setIsPlaying(true);
      onPlaybackStateChange?.(true);
    } catch (err: unknown) {
      console.error('Timbre speech synthesis failed:', err);
      setError('Speech synthesis failed. Please retry.');
      setIsPlaying(false);
      onPlaybackStateChange?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
      onPlaybackStateChange?.(true);
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
          <span>{isLoading ? 'Synthesizing...' : isPlaying ? 'Pause' : label}</span>
        </button>

        {/* Replay 10s Button */}
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

