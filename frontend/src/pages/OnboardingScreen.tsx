import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const LANGUAGES = [
  { id: 'Telugu', native: 'తెలుగు', region: 'Andhra & Telangana' },
  { id: 'Hindi', native: 'हिन्दी', region: 'National & North' },
  { id: 'Tamil', native: 'தமிழ்', region: 'Tamil Nadu' },
  { id: 'Kannada', native: 'ಕನ್ನಡ', region: 'Karnataka' },
  { id: 'Malayalam', native: 'മലയാളം', region: 'Kerala' },
  { id: 'English', native: 'English', region: 'Standard Academic' },
];

export const OnboardingScreen: React.FC = () => {
  const { user, updateUserPreferences } = useUser();
  const navigate = useNavigate();
  const [selectedLang, setSelectedLang] = useState(user.base_language || 'Telugu');
  const [speakingMode, setSpeakingMode] = useState<'bilingual' | 'immersion'>(user.speaking_mode || 'bilingual');

  const handleFinish = async () => {
    const langObj = LANGUAGES.find((l) => l.id === selectedLang);
    await updateUserPreferences({
      base_language: selectedLang,
      dialect: langObj?.region || 'Standard',
      speaking_mode: speakingMode,
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen px-4 py-8 flex flex-col justify-between max-w-lg mx-auto bg-surface text-on-surface">
      {/* Top Ambient Glow & Headlines */}
      <div className="flex flex-col items-center text-center space-y-3 mt-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-secondary-container via-surface-tint to-primary-container p-0.5 shadow-neon-strong flex items-center justify-center mb-2">
          <div className="w-full h-full bg-surface-container-lowest rounded-[14px] flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl fill-1">neurology</span>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-primary-container/10 border border-primary-container/30 text-primary text-xs font-bold tracking-wider uppercase">
          AI Indian Language Companion
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
          Your Language. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-surface-tint to-secondary">
            Your Learning.
          </span>
        </h1>
        <p className="text-sm text-on-surface-variant max-w-xs">
          Select your mother tongue to learn complex university & technical topics effortlessly.
        </p>
      </div>

      {/* Regional Language Selection Grid */}
      <div className="my-6 space-y-3">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
          Choose Base Language
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLang === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setSelectedLang(lang.id)}
                className={`p-3.5 rounded-2xl text-left border transition-all active:scale-95 flex flex-col justify-between min-h-[90px] ${
                  isSelected
                    ? 'bg-surface-container-high border-primary-container shadow-neon text-on-surface'
                    : 'bg-surface-container-low border-surface-container-highest text-on-surface-variant hover:border-outline'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xl font-bold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                    {lang.native}
                  </span>
                  <span className={`material-symbols-outlined text-lg ${isSelected ? 'text-primary-container fill-1' : 'text-outline-variant'}`}>
                    {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-on-surface">{lang.id}</div>
                  <div className="text-[10px] text-on-surface-variant truncate">{lang.region}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Speaking Mode Toggle */}
        <div className="mt-5 p-3 rounded-2xl bg-surface-container-low border border-surface-container-highest">
          <div className="text-xs font-bold text-on-surface mb-2">Speaking Mode</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSpeakingMode('bilingual')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                speakingMode === 'bilingual'
                  ? 'bg-primary-container text-on-primary-container shadow-neon'
                  : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              Bilingual (e.g. Tenglish)
            </button>
            <button
              onClick={() => setSpeakingMode('immersion')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                speakingMode === 'immersion'
                  ? 'bg-primary-container text-on-primary-container shadow-neon'
                  : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              Full Native Tongue
            </button>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={handleFinish}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-surface-tint to-primary-container text-on-primary font-bold text-base shadow-neon-strong active:scale-98 transition-transform flex items-center justify-center gap-2"
      >
        <span>Enter Kugaya Workspace</span>
        <span className="material-symbols-outlined">arrow_forward</span>
      </button>
    </div>
  );
};
