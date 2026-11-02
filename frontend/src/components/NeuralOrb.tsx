import React from 'react';

interface NeuralOrbProps {
  isListening: boolean;
  isSpeaking: boolean;
  onToggle: () => void;
}

export const NeuralOrb: React.FC<NeuralOrbProps> = ({ isListening, isSpeaking, onToggle }) => {
  return (
    <div className="relative flex flex-col items-center justify-center my-6">
      {/* Outer Soundwave Rings */}
      <div className={`absolute w-64 h-64 rounded-full border border-primary-container/20 transition-all duration-700 ${
        isListening || isSpeaking ? 'scale-110 opacity-80 animate-ping' : 'scale-95 opacity-30'
      }`}></div>
      <div className={`absolute w-52 h-52 rounded-full border border-secondary/30 transition-all duration-500 ${
        isListening || isSpeaking ? 'scale-105 opacity-90' : 'scale-90 opacity-20'
      }`}></div>

      {/* Main Interactive Neural Sound Orb */}
      <button
        onClick={onToggle}
        className="relative z-10 w-36 h-36 rounded-full flex items-center justify-center transition-transform active:scale-95 group focus:outline-none"
      >
        {/* Glowing Background Core */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-secondary-container via-surface-tint to-primary-container blur-md transition-opacity duration-500 ${
          isListening ? 'opacity-90 shadow-neon-strong' : isSpeaking ? 'opacity-80 shadow-purple-glow' : 'opacity-40 group-hover:opacity-75'
        }`}></div>

        {/* Inner Dark Glass Orb */}
        <div className="relative w-32 h-32 rounded-full bg-surface-container-lowest/90 backdrop-blur-md border border-primary-container/40 flex flex-col items-center justify-center overflow-hidden shadow-inner">
          {/* Animated Waveform Visualizer Inside Orb */}
          <div className="flex items-center gap-1.5 h-10 px-2">
            {[40, 75, 90, 60, 100, 70, 85, 45].map((height, i) => (
              <span
                key={i}
                style={{
                  height: (isListening || isSpeaking) ? `${height}%` : '20%',
                  transition: 'height 0.2s ease-in-out'
                }}
                className={`w-1 rounded-full ${
                  isSpeaking ? 'bg-secondary' : 'bg-primary-container'
                } shadow-[0_0_8px_#00e5ff]`}
              ></span>
            ))}
          </div>

          <span className="text-[11px] font-bold text-primary mt-1 tracking-wider uppercase">
            {isListening ? 'Listening' : isSpeaking ? 'Responding' : 'Tap to Speak'}
          </span>
        </div>
      </button>

      {/* Status Pill */}
      <div className="mt-4 px-3.5 py-1 rounded-full bg-surface-container-high/80 border border-primary-container/30 backdrop-blur-md shadow-neon flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${
          isListening ? 'bg-primary-container animate-pulse' : isSpeaking ? 'bg-secondary animate-pulse' : 'bg-outline'
        }`}></span>
        <span className="text-xs font-semibold text-on-surface">
          {isListening ? 'Gnani Prisma v2.5 Active' : isSpeaking ? 'Gnani Timbre v2.5' : 'Ready for Voice Inquiry'}
        </span>
      </div>
    </div>
  );
};
