import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { purgeUserData } from '../services/api';

export const ProfileScreen: React.FC = () => {
  const { user, updateUserPreferences, refreshProfile } = useUser();
  const navigate = useNavigate();

  const [name, setName] = useState(user.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [speed, setSpeed] = useState(user.speech_playback_speed || 1.0);
  const [autoPlayAudio, setAutoPlayAudio] = useState(user.audio_playback_auto || false);
  const [dailyGoal, setDailyGoal] = useState(user.daily_goal_minutes || 20);

  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSaveName = async () => {
    if (name.trim()) {
      await updateUserPreferences({ name: name.trim() });
      setIsEditingName(false);
      showToast('Name updated successfully.');
    }
  };

  const handleSpeedChange = async (newSpeed: number) => {
    setSpeed(newSpeed);
    await updateUserPreferences({ speech_playback_speed: newSpeed });
    showToast(`Speech speed set to ${newSpeed}x`);
  };

  const handleAutoPlayToggle = async () => {
    const updated = !autoPlayAudio;
    setAutoPlayAudio(updated);
    await updateUserPreferences({ audio_playback_auto: updated });
    showToast(`Auto-play ${updated ? 'enabled' : 'disabled'}`);
  };

  const handleGoalChange = async (newGoal: number) => {
    setDailyGoal(newGoal);
    await updateUserPreferences({ daily_goal_minutes: newGoal });
    showToast(`Daily goal updated to ${newGoal} minutes`);
  };

  const handlePurgeData = async () => {
    try {
      setIsPurging(true);
      const res = await purgeUserData();
      setShowPurgeModal(false);
      showToast(res.message);
      await refreshProfile();
    } catch (err) {
      console.error('Failed to purge data:', err);
    } finally {
      setIsPurging(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-primary/20 border border-primary/40 text-primary text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="p-6 rounded-3xl bg-surface-container-low border border-primary-container/30 shadow-neon flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-surface-tint to-primary-container p-0.5 shadow-neon flex items-center justify-center">
          <div className="w-full h-full bg-surface-container-lowest rounded-full flex items-center justify-center text-xl font-extrabold text-primary">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-2.5 py-1.5 bg-surface-container-high rounded-xl border border-primary text-sm text-on-surface focus:outline-none"
              />
              <button
                onClick={handleSaveName}
                className="px-3 py-1.5 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-neon"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setName(user.name);
                  setIsEditingName(false);
                }}
                className="px-2 py-1 text-xs text-on-surface-variant hover:text-on-surface"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-on-surface truncate">{user.name}</h2>
              <button onClick={() => setIsEditingName(true)} className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            </div>
          )}
          <p className="text-xs text-on-surface-variant mt-0.5">
            Primary Vernacular: <span className="text-primary font-semibold">{user.base_language}</span> ({user.dialect})
          </p>
        </div>
      </div>

      {/* Learning Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-highest text-center space-y-1">
          <div className="text-2xl font-black text-amber-300 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-xl fill-1">local_fire_department</span>
            <span>{user.streak_days} Days</span>
          </div>
          <div className="text-xs text-on-surface-variant font-medium">Daily Streak</div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-highest text-center space-y-1">
          <div className="text-2xl font-black text-primary-container flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-xl fill-1">military_tech</span>
            <span>{user.points} XP</span>
          </div>
          <div className="text-xs text-on-surface-variant font-medium">Mastery Points</div>
        </div>

        <div className="col-span-2 md:col-span-1 p-4 rounded-2xl bg-surface-container-low border border-surface-container-highest text-center space-y-2">
          <div className="text-2xl font-black text-secondary flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-xl">schedule</span>
            <span>{dailyGoal} Mins</span>
          </div>
          <div className="text-xs text-on-surface-variant font-medium">Daily Target</div>
          <div className="flex justify-center gap-1 pt-1">
            {[15, 20, 30, 45].map((g) => (
              <button
                key={g}
                onClick={() => handleGoalChange(g)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                  dailyGoal === g
                    ? 'bg-secondary text-on-secondary border-secondary'
                    : 'bg-surface-container-high text-on-surface-variant border-surface-container-highest hover:text-on-surface'
                }`}
              >
                {g}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audio Playback & Voice Preferences */}
      <div className="p-5 rounded-3xl bg-surface-container-low border border-surface-container-highest space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">volume_up</span>
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
            Audio & Speech Synthesis (Gnani Timbre)
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          {/* Speed Selector */}
          <div>
            <div className="text-on-surface font-semibold mb-1.5">Voice Playback Speed</div>
            <div className="grid grid-cols-4 gap-2">
              {[0.75, 1.0, 1.25, 1.5].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`py-2 rounded-xl font-bold border transition-all ${
                    speed === s
                      ? 'bg-primary text-on-primary border-primary shadow-neon'
                      : 'bg-surface-container-high text-on-surface-variant border-surface-container-highest hover:text-on-surface'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Auto-play toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-surface-container-highest/60">
            <div>
              <div className="text-on-surface font-semibold">Auto-Play Audio Answers</div>
              <p className="text-[11px] text-on-surface-variant">Automatically speak generated explanations</p>
            </div>
            <button
              onClick={handleAutoPlayToggle}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                autoPlayAudio ? 'bg-primary' : 'bg-surface-container-highest'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  autoPlayAudio ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Settings */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Settings</h3>
        <div className="rounded-3xl bg-surface-container-low border border-surface-container-highest overflow-hidden divide-y divide-surface-container-highest/60">
          <button
            onClick={() => navigate('/languages')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">translate</span>
              <div>
                <div className="text-sm font-semibold text-on-surface">Language & Dialect</div>
                <div className="text-xs text-on-surface-variant">
                  {user.base_language} ({user.dialect}) • {user.code_mixing_style || 'Balanced 50/50'}
                </div>
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

          {/* Privacy & Data Purge */}
          <button
            onClick={() => setShowPurgeModal(true)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-error-container/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-error text-xl">delete_sweep</span>
              <div>
                <div className="text-sm font-semibold text-error">Reset Learning Data</div>
                <div className="text-xs text-on-surface-variant">Clear all saved lessons and conversation history</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-error text-base">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Data Purge */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-surface-container-low border border-error/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-error">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <h3 className="text-base font-bold text-on-surface">Clear All Learning Data?</h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              This will permanently delete all your conversation threads, AI explanation history, and bookmarked lessons. Your language preferences will be kept.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPurgeModal(false)}
                className="px-4 py-2 rounded-xl bg-surface-container-high text-xs font-bold text-on-surface hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePurgeData}
                disabled={isPurging}
                className="px-4 py-2 rounded-xl bg-error text-on-error text-xs font-bold hover:bg-error/90 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">delete_forever</span>
                <span>{isPurging ? 'Deleting...' : 'Yes, Delete Everything'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
