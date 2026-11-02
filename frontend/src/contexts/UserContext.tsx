import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { fetchProfile, updateProfile } from '../services/api';

interface UserContextType {
  user: UserProfile;
  isLoading: boolean;
  error: string | null;
  updateUserPreferences: (partial: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const defaultProfile: UserProfile = {
  id: 'user_default',
  name: 'Priya',
  base_language: 'Telugu',
  dialect: 'Andhra & Telangana',
  speaking_mode: 'bilingual',
  code_mixing_style: 'balanced_50_50',
  explanation_complexity: 'intermediate',
  technical_terminology_mode: 'english_standard',
  audio_playback_auto: false,
  speech_playback_speed: 1.0,
  streak_days: 4,
  points: 1250,
  daily_goal_minutes: 20,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const cached = localStorage.getItem('kugaya_user_profile');
      if (cached) {
        return { ...defaultProfile, ...JSON.parse(cached) };
      }
    } catch {
      // fallback
    }
    return defaultProfile;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchProfile();
      setUser(data);
      localStorage.setItem('kugaya_user_profile', JSON.stringify(data));
    } catch (err: unknown) {
      console.warn('Backend unavailable, operating with cached profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to backend profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const updateUserPreferences = async (partial: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = { ...prev, ...partial };
      localStorage.setItem('kugaya_user_profile', JSON.stringify(updated));
      return updated;
    });
    try {
      const updated = await updateProfile(partial);
      setUser(updated);
      localStorage.setItem('kugaya_user_profile', JSON.stringify(updated));
    } catch (err: unknown) {
      console.warn('Failed to persist profile update to backend:', err);
    }
  };

  return (
    <UserContext.Provider value={{ user, isLoading, error, updateUserPreferences, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
