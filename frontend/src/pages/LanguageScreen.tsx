import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const LANGUAGES = [
  { id: 'Telugu', native: 'తెలుగు', region: 'Andhra & Telangana' },
  { id: 'Hindi', native: 'हिन्दी', region: 'National & North' },
  { id: 'Tamil', native: 'தமிழ்', region: 'Tamil Nadu' },
  { id: 'Kannada', native: 'ಕನ್ನಡ', region: 'Karnataka' },
  { id: 'Malayalam', native: 'മലയാളം', region: 'Kerala' },
  { id: 'Bengali', native: 'বাংলা', region: 'West Bengal' },
  { id: 'Marathi', native: 'मराठी', region: 'Maharashtra' },
  { id: 'English', native: 'English', region: 'Standard Academic' },
];

export const LanguageScreen: React.FC = () => {
  const { user, updateUserPreferences } = useUser();
  const navigate = useNavigate();

  const [selectedLang, setSelectedLang] = useState(user.base_language);
  const [selectedDialect, setSelectedDialect] = useState(user.dialect);
  const [speakingMode, setSpeakingMode] = useState<'bilingual' | 'immersion'>(user.speaking_mode);
  const [codeMixingStyle, setCodeMixingStyle] = useState(user.code_mixing_style || 'balanced_50_50');
  const [complexity, setComplexity] = useState(user.explanation_complexity || 'intermediate');
  const [terminologyMode, setTerminologyMode] = useState(user.technical_terminology_mode || 'english_standard');
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectLanguage = (langId: string) => {
    setSelectedLang(langId);
    const langObj = LANGUAGES.find((l) => l.id === langId);
    if (langObj) {
      setSelectedDialect(langObj.region);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateUserPreferences({
        base_language: selectedLang,
        dialect: selectedDialect,
        speaking_mode: speakingMode,
        code_mixing_style: codeMixingStyle,
        explanation_complexity: complexity,
        technical_terminology_mode: terminologyMode,
      });
      setIsSavedNotice(true);
      setTimeout(() => {
        setIsSavedNotice(false);
        navigate('/');
      }, 1200);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Language & Vernacular Preferences</h2>
          <p className="text-xs text-on-surface-variant">
            Customize native tongue, code-mixing ratio, and reasoning depth
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-neon hover:bg-primary/90 flex items-center gap-1.5 transition-all"
        >
          <span className="material-symbols-outlined text-sm">save</span>
          <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
        </button>
      </div>

      {isSavedNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>Preferences saved successfully to backend database!</span>
        </div>
      )}

      {/* 1. Base Language Selection */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          1. Primary Base Language
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLang === lang.id;
            return (
              <div
                key={lang.id}
                onClick={() => handleSelectLanguage(lang.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-surface-container-high border-primary-container shadow-neon'
                    : 'bg-surface-container-low border-surface-container-highest hover:border-outline'
                }`}
              >
                <div>
                  <div className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                    {lang.native} ({lang.id})
                  </div>
                  <div className="text-[11px] text-on-surface-variant">{lang.region}</div>
                </div>
                <span className={`material-symbols-outlined text-sm ${isSelected ? 'text-primary' : 'text-outline-variant'}`}>
                  {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delivery Mode */}
      <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-highest space-y-2">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          Teaching Delivery Mode
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setSpeakingMode('bilingual')}
            className={`py-2 px-3 rounded-xl font-bold transition-all ${
              speakingMode === 'bilingual'
                ? 'bg-primary text-on-primary shadow-neon'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            Bilingual (Native + English)
          </button>
          <button
            type="button"
            onClick={() => setSpeakingMode('immersion')}
            className={`py-2 px-3 rounded-xl font-bold transition-all ${
              speakingMode === 'immersion'
                ? 'bg-primary text-on-primary shadow-neon'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            Native Immersion
          </button>
        </div>
      </div>

      {/* 2. Code-Mixing Balance */}
      <div className="p-5 rounded-3xl bg-surface-container-low border border-surface-container-highest space-y-3">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          2. Code-Mixing Vernacular Balance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          {[
            {
              id: 'balanced_50_50',
              title: 'Balanced 50/50 (Tenglish / Hinglish)',
              desc: 'Natural conversational code-switching common in engineering colleges.',
            },
            {
              id: 'indic_heavy',
              title: 'Vernacular Immersion',
              desc: 'Deep native language focus with English reserved only for core terms.',
            },
            {
              id: 'english_heavy',
              title: 'English-Dense Academic',
              desc: 'Standard academic lecture delivery with light vernacular cues.',
            },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setCodeMixingStyle(mode.id)}
              className={`p-3.5 rounded-2xl text-left border transition-all space-y-1 ${
                codeMixingStyle === mode.id
                  ? 'bg-primary-container/20 border-primary-container text-primary shadow-neon'
                  : 'bg-surface-container-high text-on-surface border-surface-container-highest hover:border-outline-variant'
              }`}
            >
              <div className="font-bold">{mode.title}</div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">{mode.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Explanation Complexity */}
      <div className="p-5 rounded-3xl bg-surface-container-low border border-surface-container-highest space-y-3">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          3. Explanation Depth & Target Level
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          {[
            {
              id: 'beginner',
              title: 'Foundational / Beginner',
              desc: 'Heavy real-world analogies, minimal math, simple everyday metaphors.',
            },
            {
              id: 'intermediate',
              title: 'Standard Undergraduate',
              desc: 'Standard B.Tech / University syllabus depth with practical examples.',
            },
            {
              id: 'exam_rigorous',
              title: 'GATE / University Exam Rigorous',
              desc: 'Precise definitions, mathematical properties, and time complexity.',
            },
          ].map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => setComplexity(lvl.id)}
              className={`p-3.5 rounded-2xl text-left border transition-all space-y-1 ${
                complexity === lvl.id
                  ? 'bg-secondary/20 border-secondary text-secondary shadow-purple-glow'
                  : 'bg-surface-container-high text-on-surface border-surface-container-highest hover:border-outline-variant'
              }`}
            >
              <div className="font-bold">{lvl.title}</div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">{lvl.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Technical Terminology Mode */}
      <div className="p-5 rounded-3xl bg-surface-container-low border border-surface-container-highest space-y-3">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          4. Technical Vocabulary Policy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => setTerminologyMode('english_standard')}
            className={`p-3.5 rounded-2xl text-left border transition-all space-y-1 ${
              terminologyMode === 'english_standard'
                ? 'bg-primary/20 border-primary text-primary shadow-neon'
                : 'bg-surface-container-high text-on-surface border-surface-container-highest'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">verified</span>
              <span>Preserve Standard English Terms (Recommended)</span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Terms like "Pointer", "Mutex", "Thread", "Stack" remain in English without artificial translations.
            </p>
          </button>

          <button
            onClick={() => setTerminologyMode('vernacular_glossary')}
            className={`p-3.5 rounded-2xl text-left border transition-all space-y-1 ${
              terminologyMode === 'vernacular_glossary'
                ? 'bg-primary/20 border-primary text-primary shadow-neon'
                : 'bg-surface-container-high text-on-surface border-surface-container-highest'
            }`}
          >
            <div className="font-bold">Provide Indic Synonyms where available</div>
            <p className="text-[11px] text-on-surface-variant">
              Includes formal vernacular technical definitions alongside standard terms.
            </p>
          </button>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 rounded-2xl bg-primary text-on-primary text-sm font-bold shadow-neon hover:bg-primary/90 flex items-center gap-2 transition-all"
        >
          <span className="material-symbols-outlined text-base">check</span>
          <span>Apply and Save All Preferences</span>
        </button>
      </div>
    </div>
  );
};
