import React from 'react';

export type ScreenType = 'home' | 'tutor' | 'voice' | 'saved' | 'history' | 'languages' | 'profile' | 'onboarding';

interface NavigationProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentScreen, onNavigate }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'tutor', label: 'AI Tutor', icon: 'auto_awesome' },
    { id: 'voice', label: 'Voice', icon: 'mic', highlight: true },
    { id: 'saved', label: 'Saved', icon: 'bookmark' },
    { id: 'profile', label: 'Profile', icon: 'account_circle' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest/95 backdrop-blur-2xl border-t border-surface-container-high/60 shadow-[0_-4px_20px_rgba(0,0,0,0.6)]">
      <div className="max-w-md mx-auto h-16 px-4 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          
          if (item.highlight) {
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as ScreenType)}
                className="relative -top-4 flex flex-col items-center group transition-transform active:scale-90"
              >
                <div className={`w-13 h-13 p-3 rounded-full bg-gradient-to-tr from-surface-tint to-primary-container text-on-primary-container shadow-[0_0_20px_rgba(0,229,255,0.6)] group-hover:shadow-[0_0_30px_rgba(0,229,255,0.85)] flex items-center justify-center transition-all ${isActive ? 'ring-2 ring-primary' : ''}`}>
                  <span className="material-symbols-outlined text-[26px] fill-1 text-on-primary font-bold">
                    {item.icon}
                  </span>
                </div>
                <span className={`text-[11px] font-bold mt-1 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as ScreenType)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all active:scale-95 ${
                isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className={`material-symbols-outlined text-2xl transition-transform ${isActive ? 'fill-1 scale-110 drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]' : ''}`}>
                {item.icon}
              </span>
              <span className={`text-[11px] tracking-tight mt-0.5 ${isActive ? 'font-bold text-primary' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
