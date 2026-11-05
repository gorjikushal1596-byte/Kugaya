import React, { useMemo } from 'react';

interface NeuralOrbProps {
  isListening: boolean;
  isSpeaking: boolean;
  volumeLevel?: number;
  durationSeconds?: number;
  onToggle: () => void;
  onSelectFeature?: (featureId: string) => void;
  showHeaderBanner?: boolean;
}

export const NeuralOrb: React.FC<NeuralOrbProps> = ({
  isListening,
  isSpeaking,
  volumeLevel = 0,
  durationSeconds = 0,
  onToggle,
  onSelectFeature,
  showHeaderBanner = true,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Generate 3D spherical dot-matrix latitude lattice inside the globe
  const sphereDots = useMemo(() => {
    const dots: Array<{ cx: number; cy: number; r: number; opacity: number; color: string }> = [];
    const R = 64; // Sphere radius inside 150px coordinate box
    const centerX = 75;
    const centerY = 75;
    const tilt = 0.22; // ~13 degrees forward perspective tilt

    const latitudes = [-55, -40, -25, -10, 5, 20, 35, 50];
    latitudes.forEach((latDeg) => {
      const latRad = (latDeg * Math.PI) / 180;
      const rAtLat = R * Math.cos(latRad);
      const yCenter = centerY - R * Math.sin(latRad) * Math.cos(tilt);

      const numPoints = Math.round(18 * Math.cos(latRad));
      for (let i = 0; i <= numPoints; i++) {
        const lonDeg = -78 + (156 * i) / Math.max(1, numPoints);
        const lonRad = (lonDeg * Math.PI) / 180;
        const x = centerX + rAtLat * Math.sin(lonRad);
        const y = yCenter + rAtLat * Math.sin(tilt) * Math.cos(lonRad);

        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= R - 1) {
          const edgeDist = dist / R;
          // Translucent near center where bars dance, luminous on outer sphere rim
          const opacity = Math.min(0.95, Math.max(0.12, 0.15 + edgeDist * 0.75));
          const color = x < centerX ? '#00e5ff' : '#d8b4fe';
          const radius = 0.75 + edgeDist * 0.5;

          dots.push({
            cx: Math.round(x * 10) / 10,
            cy: Math.round(y * 10) / 10,
            r: Math.round(radius * 10) / 10,
            opacity: Math.round(opacity * 100) / 100,
            color,
          });
        }
      }
    });
    return dots;
  }, []);

  // Center equalizer base bar heights
  const equalizerBars = [
    { baseHeight: 18, bounceAnim: 'barBounceA', delay: '0.05s' },
    { baseHeight: 30, bounceAnim: 'barBounceB', delay: '0.2s' },
    { baseHeight: 46, bounceAnim: 'barBounceC', delay: '0.12s' },
    { baseHeight: 60, bounceAnim: 'barBounceD', delay: '0s' },
    { baseHeight: 46, bounceAnim: 'barBounceC', delay: '0.16s' },
    { baseHeight: 30, bounceAnim: 'barBounceB', delay: '0.25s' },
    { baseHeight: 18, bounceAnim: 'barBounceA', delay: '0.08s' },
  ];

  const isActive = isListening || isSpeaking;

  return (
    <div className="relative w-full flex flex-col items-center justify-center py-4 overflow-hidden select-none">
      {/* Top Pedagogical Guidance Banner from Reference Mockup */}
      {showHeaderBanner && (
        <p className="text-center text-xs md:text-sm text-slate-300/90 max-w-xl mx-auto leading-relaxed px-4 mb-6">
          Ask me anything from your studies. I'll explain it in your preferred language, with simple examples, real-life analogies and exam-ready answers.
        </p>
      )}

      {/* Main Floating Orb & Silk Soundwave Ribbon Canvas */}
      <div className="relative w-full max-w-3xl flex items-center justify-center min-h-[260px] my-2">
        {/* ============================================================
            BACKGROUND EFFECT: COSMIC SILK SOUNDWAVE RIBBONS (SVG)
           ============================================================ */}
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-700 ${
            isActive ? 'opacity-100' : 'opacity-85'
          }`}
        >
          <svg
            viewBox="0 0 1000 280"
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Left Ribbon Gradients (Purple / Violet) */}
              <linearGradient id="purpleRibbonGrad" x1="100%" y1="50%" x2="0%" y2="50%">
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
                <stop offset="40%" stopColor="#a855f7" stopOpacity="0.5" />
                <stop offset="85%" stopColor="#7e22ce" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#581c87" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="purpleRibbonFill" x1="100%" y1="50%" x2="0%" y2="50%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={isActive ? "0.22" : "0.14"} />
                <stop offset="60%" stopColor="#7e22ce" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#3b0764" stopOpacity="0" />
              </linearGradient>

              {/* Right Ribbon Gradients (Cyan / Electric Blue) */}
              <linearGradient id="cyanRibbonGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.8" />
                <stop offset="40%" stopColor="#00b4d8" stopOpacity="0.5" />
                <stop offset="85%" stopColor="#0284c7" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="cyanRibbonFill" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity={isActive ? "0.22" : "0.14"} />
                <stop offset="60%" stopColor="#0284c7" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#082f49" stopOpacity="0" />
              </linearGradient>

              {/* Soft Center Glow Mask */}
              <radialGradient id="centerVignette" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#000000" stopOpacity="0" />
                <stop offset="65%" stopColor="#000000" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.9" />
              </radialGradient>
            </defs>

            {/* Left Flowing Purple Silk Ribbon Waves */}
            <g className="animate-ribbon-left">
              {/* Shimmer fill band */}
              <path
                d="M 480 140 C 370 180, 220 110, 0 170 L 0 225 C 220 160, 360 210, 480 140 Z"
                fill="url(#purpleRibbonFill)"
              />
              {/* Fine Silk Harmonic Strands */}
              <path
                d="M 485 140 C 370 175, 230 115, 0 165"
                stroke="url(#purpleRibbonGrad)"
                strokeWidth={isActive ? "2" : "1.5"}
                fill="none"
              />
              <path
                d="M 480 142 C 365 190, 220 100, 0 185"
                stroke="url(#purpleRibbonGrad)"
                strokeWidth="1.2"
                strokeOpacity="0.8"
                fill="none"
              />
              <path
                d="M 475 138 C 360 165, 240 130, 0 150"
                stroke="url(#purpleRibbonGrad)"
                strokeWidth="1.0"
                strokeOpacity="0.6"
                fill="none"
              />
              <path
                d="M 470 144 C 350 205, 210 85, 0 205"
                stroke="url(#purpleRibbonGrad)"
                strokeWidth="0.9"
                strokeOpacity="0.5"
                fill="none"
              />
              <path
                d="M 465 140 C 340 220, 195 70, 0 225"
                stroke="url(#purpleRibbonGrad)"
                strokeWidth="0.8"
                strokeOpacity="0.35"
                fill="none"
              />
            </g>

            {/* Right Flowing Cyan Silk Ribbon Waves */}
            <g className="animate-ribbon-right">
              {/* Shimmer fill band */}
              <path
                d="M 520 140 C 630 110, 780 180, 1000 120 L 1000 65 C 780 125, 640 75, 520 140 Z"
                fill="url(#cyanRibbonFill)"
              />
              {/* Fine Silk Harmonic Strands */}
              <path
                d="M 515 140 C 630 115, 770 175, 1000 125"
                stroke="url(#cyanRibbonGrad)"
                strokeWidth={isActive ? "2" : "1.5"}
                fill="none"
              />
              <path
                d="M 520 138 C 635 100, 780 190, 1000 105"
                stroke="url(#cyanRibbonGrad)"
                strokeWidth="1.2"
                strokeOpacity="0.8"
                fill="none"
              />
              <path
                d="M 525 142 C 640 125, 760 160, 1000 140"
                stroke="url(#cyanRibbonGrad)"
                strokeWidth="1.0"
                strokeOpacity="0.6"
                fill="none"
              />
              <path
                d="M 530 136 C 650 85, 790 205, 1000 85"
                stroke="url(#cyanRibbonGrad)"
                strokeWidth="0.9"
                strokeOpacity="0.5"
                fill="none"
              />
              <path
                d="M 535 140 C 660 70, 805 220, 1000 65"
                stroke="url(#cyanRibbonGrad)"
                strokeWidth="0.8"
                strokeOpacity="0.35"
                fill="none"
              />
            </g>
          </svg>
        </div>

        {/* ============================================================
            MAIN INTERACTIVE FLOATING NEURAL ORB
           ============================================================ */}
        <div
          className={`relative z-10 flex items-center justify-center transition-all ${
            isActive ? 'animate-orb-float-active' : 'animate-orb-float'
          }`}
        >
          {/* Outer Cyan + Purple Neon Glow Halos */}
          <div
            className={`absolute -left-6 -top-4 w-44 h-44 rounded-full bg-[#00e5ff] blur-3xl pointer-events-none transition-opacity duration-300 ${
              isActive ? 'opacity-40 scale-110' : 'opacity-25'
            }`}
          />
          <div
            className={`absolute -right-6 -bottom-4 w-44 h-44 rounded-full bg-[#d946ef] blur-3xl pointer-events-none transition-opacity duration-300 ${
              isActive ? 'opacity-40 scale-110' : 'opacity-25'
            }`}
          />

          {/* Undulating Audio-Reactive Plasma Ring Wrapping the Sphere */}
          <div
            className={`absolute w-44 h-44 pointer-events-none ${
              isActive ? 'animate-plasma-spin-fast' : 'animate-plasma-spin'
            }`}
            style={{
              transform: isListening ? `scale(${1 + (volumeLevel / 100) * 0.15})` : undefined,
              transition: 'transform 0.1s ease-out',
            }}
          >
            <svg viewBox="0 0 180 180" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="plasmaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f0ff" />
                  <stop offset="45%" stopColor="#38bdf8" />
                  <stop offset="75%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#e879f9" />
                </linearGradient>
                <filter id="plasmaGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3.5" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                d="M 90 12 C 122 10, 158 35, 166 70 C 174 105, 148 146, 116 162 C 84 178, 38 164, 20 132 C 2 100, 16 54, 48 26 C 62 14, 76 13, 90 12 Z"
                stroke="url(#plasmaGrad)"
                strokeWidth={isActive ? "2.6" : "1.8"}
                fill="none"
                filter="url(#plasmaGlow)"
                className="opacity-90"
              />
            </svg>
          </div>

          {/* The Sphere Button (Interactive Tap to Speak / Finish) */}
          <button
            type="button"
            onClick={onToggle}
            className="relative z-20 w-36 h-36 md:w-40 md:h-40 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200 active:scale-95 group focus:outline-none"
            title={isListening ? 'Tap to Stop Recording' : 'Tap to Start Speaking'}
          >
            {/* Spherical Glowing Dual-Gradient Rim */}
            <div
              className={`absolute inset-0 rounded-full p-[2px] bg-gradient-to-tr from-[#e879f9] via-[#818cf8] to-[#00f0ff] shadow-[0_0_25px_rgba(0,229,255,0.4),0_0_35px_rgba(232,121,249,0.35)] transition-all duration-300 ${
                isActive ? 'scale-105' : 'group-hover:scale-102'
              }`}
            >
              {/* Deep Space Dark Glass Core */}
              <div
                className="w-full h-full rounded-full relative overflow-hidden flex items-center justify-center"
                style={{
                  background:
                    'radial-gradient(circle at 35% 30%, #17203d 0%, #0a0f24 60%, #030511 100%)',
                  boxShadow:
                    'inset 0 0 25px rgba(0, 229, 255, 0.2), inset -8px -8px 25px rgba(217, 70, 239, 0.25)',
                }}
              >
                {/* 3D Spherical Dot-Matrix Hologram Mesh (SVG) */}
                <svg
                  viewBox="0 0 150 150"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                >
                  <g className="transition-opacity duration-300">
                    {sphereDots.map((dot, idx) => (
                      <circle
                        key={idx}
                        cx={dot.cx}
                        cy={dot.cy}
                        r={dot.r}
                        fill={dot.color}
                        opacity={dot.opacity}
                      />
                    ))}
                  </g>
                </svg>

                {/* Center 7-Bar Equalizer Soundwave */}
                <div className="relative z-10 flex items-center justify-center gap-1.5 h-16 px-3">
                  {equalizerBars.map((bar, i) => {
                    let barStyle: React.CSSProperties = {};

                    if (isSpeaking) {
                      // Dynamic bouncing cadences when Gnani Timbre is speaking
                      barStyle = {
                        height: `${bar.baseHeight}px`,
                        animation: `${bar.bounceAnim} 0.8s ease-in-out infinite`,
                        animationDelay: bar.delay,
                      };
                    } else if (isListening) {
                      // Live reactive heights scaled by real microphone volume
                      const livePx = Math.max(
                        10,
                        Math.min(62, bar.baseHeight * (volumeLevel / 35 + 0.35))
                      );
                      barStyle = {
                        height: `${livePx}px`,
                        transition: 'height 0.08s ease-out',
                      };
                    } else {
                      // Idle ambient breathing waveform
                      barStyle = {
                        height: `${Math.round(bar.baseHeight * 0.75)}px`,
                        transition: 'height 0.3s ease-out',
                      };
                    }

                    return (
                      <span
                        key={i}
                        style={barStyle}
                        className="w-[4.5px] rounded-full bg-gradient-to-b from-[#00f0ff] via-[#818cf8] to-[#e879f9] shadow-[0_0_8px_rgba(0,229,255,0.8),0_0_12px_rgba(217,70,239,0.5)]"
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ============================================================
          TYPOGRAPHY: "Kugaya" + "Your AI Tutor"
         ============================================================ */}
      <div className="flex flex-col items-center justify-center mt-3 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[#00f0ff] via-[#a5b4fc] to-[#e879f9] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,229,255,0.3)]">
          Kugaya
        </h1>
        <p className="text-xs md:text-sm font-semibold tracking-[0.25em] uppercase text-slate-300 mt-1">
          Your AI Tutor
        </p>

        {/* Live Audio Status / Recording Timer Pill */}
        <div className="mt-3 px-3.5 py-1 rounded-full bg-[#0a0f24]/90 border border-primary-container/30 backdrop-blur-md shadow-neon flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isListening
                ? 'bg-rose-500 animate-pulse'
                : isSpeaking
                ? 'bg-purple-400 animate-pulse'
                : 'bg-emerald-400'
            }`}
          />
          <span className="text-[11px] font-semibold text-on-surface">
            {isListening
              ? `Listening... ${formatTime(durationSeconds)} (Tap orb to finish)`
              : isSpeaking
              ? 'Gnani Timbre v2.5 Speaking...'
              : 'Tap Orb to Speak'}
          </span>
        </div>
      </div>

      {/* ============================================================
          ACTION PILLS: Explain Concepts | Solve Doubts | Curriculum | Speak & Listen
         ============================================================ */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5 px-3 max-w-2xl">
        <button
          type="button"
          onClick={() => onSelectFeature?.('concepts')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0d1527]/80 hover:bg-[#13203c] border border-[#00e5ff]/40 text-[#c8f5ff] text-xs font-semibold backdrop-blur-md shadow-[0_0_12px_rgba(0,229,255,0.15)] transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-sm text-[#00e5ff]">school</span>
          <span>Explain Concepts</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectFeature?.('doubts')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0d1527]/80 hover:bg-[#13203c] border border-amber-400/40 text-amber-100 text-xs font-semibold backdrop-blur-md shadow-[0_0_12px_rgba(251,191,36,0.15)] transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-sm text-amber-400 fill-1">bolt</span>
          <span>Solve Doubts</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectFeature?.('curriculum')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0d1527]/80 hover:bg-[#13203c] border border-teal-400/40 text-teal-100 text-xs font-semibold backdrop-blur-md shadow-[0_0_12px_rgba(45,212,191,0.15)] transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-sm text-teal-400">menu_book</span>
          <span>Use Your Curriculum</span>
        </button>

        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0d1527]/80 hover:bg-[#13203c] border border-purple-400/40 text-purple-100 text-xs font-semibold backdrop-blur-md shadow-[0_0_12px_rgba(192,132,252,0.15)] transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-sm text-purple-400">volume_up</span>
          <span>Speak & Listen</span>
        </button>
      </div>
    </div>
  );
};
