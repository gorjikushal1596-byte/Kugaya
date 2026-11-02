import React from 'react';

interface NeuralOrbProps {
  isListening: boolean;
  isSpeaking: boolean;
  volumeLevel?: number;
  durationSeconds?: number;
  onToggle: () => void;
}

export const NeuralOrb: React.FC<NeuralOrbProps> = ({
  isListening,
  isSpeaking,
  volumeLevel = 0,
  durationSeconds = 0,
  onToggle,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative flex flex-col items-center justify-center my-6">
      {/* Outer Neon Concentric Wave Rings */}
      <div
        style={{
          transform: `scale(${1 + (volumeLevel / 100) * 0.4})`,
        }}
        className={`absolute w-64 h-64 rounded-full border border-primary-container/20 transition-transform duration-100 ${
          isListening || isSpeaking ? 'opacity-80 animate-ping' : 'scale-95 opacity-25'
        }`}
      ></div>

      <div
        style={{
          transform: `scale(${1 + (volumeLevel / 100) * 0.25})`,
        }}
        className={`absolute w-52 h-52 rounded-full border border-secondary/30 transition-transform duration-100 ${
          isListening || isSpeaking ? 'opacity-90' : 'scale-90 opacity-20'
        }`}
      ></div>

      {/* Main Interactive Neural Sound Orb */}
      <button
        onClick={onToggle}
        className="relative z-10 w-36 h-36 rounded-full flex items-center justify-center transition-transform active:scale-95 group focus:outline-none"
        title={isListening ? 'Tap to Stop Recording' : 'Tap to Start Speaking'}
      >
        {/* Glowing Background Core */}
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-tr from-secondary-container via-surface-tint to-primary-container blur-md transition-opacity duration-300 ${
            isListening
              ? 'opacity-95 shadow-neon-strong'
              : isSpeaking
              ? 'opacity-85 shadow-purple-glow'
              : 'opacity-40 group-hover:opacity-75'
          }`}
        ></div>

        {/* Inner Dark Glass Orb */}
        <div className="relative w-32 h-32 rounded-full bg-surface-container-lowest/90 backdrop-blur-md border border-primary-container/40 flex flex-col items-center justify-center overflow-hidden shadow-inner">
          {/* Animated Waveform Oscillations driven by real microphone volume */}
          <div className="flex items-center gap-1.5 h-10 px-2">
            {[40, 75, 90, 60, 100, 70, 85, 45].map((baseHeight, i) => {
              const liveHeight = isListening
                ? Math.max(15, Math.min(100, baseHeight * (volumeLevel / 40 + 0.3)))
                : isSpeaking
                ? baseHeight
                : 20;

              return (
                <span
                  key={i}
                  style={{
                    height: `${liveHeight}%`,
                    transition: 'height 0.1s ease-out',
                  }}
                  className={`w-1 rounded-full ${
                    isSpeaking ? 'bg-secondary' : 'bg-primary-container'
                  } shadow-[0_0_8px_#00e5ff]`}
                ></span>
              );
            })}
          </div>

          <span className="text-[11px] font-bold text-primary mt-1 tracking-wider uppercase">
            {isListening ? 'Recording' : isSpeaking ? 'Responding' : 'Tap to Speak'}
          </span>

          {isListening && (
            <span className="text-[10px] font-mono text-emerald-400 font-bold -mt-0.5">
              {formatTime(durationSeconds)}
            </span>
          )}
        </div>
      </button>

      {/* Status Pill */}
      <div className="mt-4 px-3.5 py-1 rounded-full bg-surface-container-high/80 border border-primary-container/30 backdrop-blur-md shadow-neon flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            isListening
              ? 'bg-red-500 animate-pulse'
              : isSpeaking
              ? 'bg-secondary animate-pulse'
              : 'bg-emerald-400'
          }`}
        ></span>
        <span className="text-xs font-semibold text-on-surface">
          {isListening
            ? `Recording... (Tap orb to finish)`
            : isSpeaking
            ? 'Gnani Timbre v2.5'
            : 'Gnani AI Prisma v2.5 Active'}
        </span>
      </div>
    </div>
  );
};
