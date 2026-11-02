import React from 'react';
import type { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile;
  onOpenLanguageModal?: () => void;
  onNavigateProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onOpenLanguageModal, onNavigateProfile }) => {
  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-surface/85 backdrop-blur-xl border-b border-surface-container-high/60 shadow-[0_1px_12px_rgba(0,0,0,0.4)]">
      <div className="h-16 px-4 md:px-8 max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Kugaya Brand Logo & Identity */}
        <div className="flex items-center gap-2.5 min-w-0 cursor-pointer" onClick={() => window.location.hash = '#'}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-secondary-container via-surface-tint to-primary-container p-0.5 shadow-neon flex items-center justify-center">
            <div className="w-full h-full bg-surface-container-lowest rounded-[10px] flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[22px] fill-1">neurology</span>
            </div>
          </div>
          <div className="flex flex-col truncate">
            <span className="text-base font-extrabold tracking-wider text-primary truncate drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
              KUGAYA
            </span>
            <span className="text-[10px] font-semibold text-on-surface-variant -mt-0.5 tracking-normal truncate">
              AI Indian Language Tutor
            </span>
          </div>
        </div>

        {/* Header Right Status Bar & Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Active Language Switcher Pill */}
          <button
            onClick={onOpenLanguageModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high/90 hover:bg-surface-container-highest border border-primary-container/20 shadow-[0_0_10px_rgba(0,229,255,0.1)] transition-all active:scale-95 text-on-surface"
          >
            <span className="w-2 h-2 rounded-full bg-primary-container shadow-[0_0_6px_#00e5ff] animate-pulse"></span>
            <span className="text-xs font-bold text-primary tracking-wide">
              {user.base_language} + Eng
            </span>
            <span className="material-symbols-outlined text-sm text-on-surface-variant">expand_more</span>
          </button>

          {/* User Profile Avatar with Streak */}
          <button
            onClick={onNavigateProfile}
            className="flex items-center justify-center p-0.5 rounded-full ring-2 ring-primary-fixed-dim/40 shadow-neon min-w-[38px] min-h-[38px] transition-transform active:scale-95 bg-surface-container"
            title="Profile & Preferences"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-container/30 to-secondary-container/50 flex items-center justify-center text-xs font-bold text-primary">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
