import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

export const ProfileScreen: React.FC = () => {
  const { user, updateUserPreferences } = useUser();
  const navigate = useNavigate();
  const [name, setName] = useState(user.name);
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveName = async () => {
    await updateUserPreferences({ name });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Profile Card */}
      <div className="p-6 rounded-3xl bg-surface-container-low border border-primary-container/30 shadow-neon flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-surface-tint to-primary-container p-0.5 shadow-neon flex items-center justify-center">
          <div className="w-full h-full bg-surface-container-lowest rounded-full flex items-center justify-center text-xl font-extrabold text-primary">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-2 py-1 bg-surface-container-high rounded border border-primary-container text-sm text-on-surface"
              />
              <button
                onClick={handleSaveName}
                className="px-2 py-1 bg-primary-container text-on-primary-container text-xs font-bold rounded"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-on-surface truncate">{user.name}</h2>
              <button onClick={() => setIsEditing(true)} className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            </div>
          )}
          <p className="text-xs text-on-surface-variant mt-0.5">
            Active in {user.base_language} ({user.dialect})
          </p>
        </div>
      </div>

      {/* Learning Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-highest text-center space-y-1">
          <div className="text-2xl font-black text-amber-300 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-xl fill-1">local_fire_department</span>
            <span>{user.streak_days} Days</span>
          </div>
          <div className="text-xs text-on-surface-variant font-medium">Daily Learning Streak</div>
        </div>
        <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-highest text-center space-y-1">
          <div className="text-2xl font-black text-primary-container flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-xl fill-1">military_tech</span>
            <span>{user.points} XP</span>
          </div>
          <div className="text-xs text-on-surface-variant font-medium">Mastery Points</div>
        </div>
      </div>

      {/* Navigation Settings */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Settings</h3>
        <div className="rounded-2xl bg-surface-container-low border border-surface-container-highest overflow-hidden divide-y divide-surface-container-highest/60">
          <button
            onClick={() => navigate('/languages')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">translate</span>
              <div>
                <div className="text-sm font-semibold text-on-surface">Language & Dialect</div>
                <div className="text-xs text-on-surface-variant">{user.base_language} + English</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-base">chevron_right</span>
          </button>

          <button
            onClick={() => navigate('/onboarding')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-xl">restart_alt</span>
              <div>
                <div className="text-sm font-semibold text-on-surface">Relaunch Onboarding</div>
                <div className="text-xs text-on-surface-variant">Reconfigure initial tutor preferences</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-base">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Backend & AI Diagnostic Info */}
      <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface-variant space-y-1 font-mono">
        <div className="font-bold text-primary">Integration Architecture Status:</div>
        <div>STT: Gnani AI Prisma v2.5 (Ready)</div>
        <div>TTS: Gnani AI Timbre v2.5 (Ready)</div>
        <div>Reasoning: Multilingual 4-Card Adapter (Active)</div>
        <div>Curriculum RAG: BAAI/bge-m3 Semantic Embeddings (Configured)</div>
        <div>Persistence: SQLite (Async SQLAlchemy)</div>
      </div>
    </div>
  );
};

