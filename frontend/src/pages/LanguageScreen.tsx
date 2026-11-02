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

export const LanguageScreen: React.FC = () => {
  const { user, updateUserPreferences } = useUser();
  const navigate = useNavigate();
  const [selectedLang, setSelectedLang] = useState(user.base_language);
  const [speakingMode, setSpeakingMode] = useState<'bilingual' | 'immersion'>(user.speaking_mode);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const handleSave = async () => {
    const langObj = LANGUAGES.find((l) => l.id === selectedLang);
    await updateUserPreferences({
      base_language: selectedLang,
      dialect: langObj?.region || 'Standard',
      speaking_mode: speakingMode,
    });
    setIsSavedNotice(true);
    setTimeout(() => {
      setIsSavedNotice(false);
      navigate('/');
    }, 1000);
  };

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-xl font-bold text-on-surface">Language Preferences</h2>
        <p className="text-xs text-on-surface-variant">
          Configure your native tongue and code-mixing vernacular
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          Primary Base Language
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLang === lang.id;
            return (
              <div
                key={lang.id}
                onClick={() => setSelectedLang(lang.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-surface-container-high border-primary-container shadow-neon'
                    : 'bg-surface-container-low border-surface-container-highest hover:border-outline'
                }`}
              >
                <div>
                  <div className={`text-base font-bold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                    {lang.native} ({lang.id})
                  </div>
                  <div className="text-xs text-on-surface-variant">{lang.region}</div>
                </div>
                <span className={`material-symbols-outlined ${isSelected ? 'text-primary-container fill-1' : 'text-outline-variant'}`}>
                  {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-highest space-y-3">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          Teaching Delivery Mode
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSpeakingMode('bilingual')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              speakingMode === 'bilingual'
                ? 'bg-primary-container text-on-primary-container shadow-neon'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            Bilingual (Native + English)
          </button>
          <button
            onClick={() => setSpeakingMode('immersion')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              speakingMode === 'immersion'
                ? 'bg-primary-container text-on-primary-container shadow-neon'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            Native Immersion
          </button>
        </div>
      </div>

      {isSavedNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center font-bold">
          Preferences saved successfully!
        </div>
      )}

      <button
        onClick={handleSave}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-surface-tint to-primary-container text-on-primary font-bold text-sm shadow-neon active:scale-98 transition-all"
      >
        Save Language Preferences
      </button>
    </div>
  );
};
