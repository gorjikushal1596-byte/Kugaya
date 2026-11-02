import { useState, useEffect } from 'react';
import type { UserProfile, LearningSessionResponse } from './types';
import { fetchProfile, updateProfile } from './services/api';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import type { ScreenType } from './components/Navigation';

import { HomeScreen } from './screens/HomeScreen';
import { TutorScreen } from './screens/TutorScreen';
import { VoiceScreen } from './screens/VoiceScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SavedScreen } from './screens/SavedScreen';
import { LanguageScreen } from './screens/LanguageScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [activeSession, setActiveSession] = useState<LearningSessionResponse | null>(null);
  const [user, setUser] = useState<UserProfile>({
    id: 'user_default',
    name: 'Priya',
    base_language: 'Telugu',
    dialect: 'Andhra & Telangana',
    speaking_mode: 'bilingual',
    streak_days: 4,
    points: 1250,
  });

  useEffect(() => {
    fetchProfile()
      .then(setUser)
      .catch((err) => {
        console.warn('Backend unavailable, using default profile state:', err);
      });
  }, []);

  const handleUpdateProfile = async (partial: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...partial }));
    try {
      const updated = await updateProfile(partial);
      setUser(updated);
    } catch (e) {
      console.warn('Could not persist profile update to backend:', e);
    }
  };

  const handleQuickQuery = (q: string) => {
    setCurrentScreen('tutor');
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.value = q;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 100);
  };

  // If on onboarding screen, hide standard headers
  if (currentScreen === 'onboarding') {
    return (
      <div className="bg-surface text-on-surface min-h-screen">
        <OnboardingScreen
          user={user}
          onComplete={(upd) => {
            handleUpdateProfile(upd);
            setCurrentScreen('home');
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      {/* Persistent Stitch Neon Header */}
      <Header
        user={user}
        onOpenLanguageModal={() => setCurrentScreen('languages')}
        onNavigateProfile={() => setCurrentScreen('profile')}
      />

      {/* Main Screen Container */}
      <main className="flex-1 w-full max-w-lg mx-auto pt-20 pb-24 px-4">
        {currentScreen === 'home' && (
          <HomeScreen
            user={user}
            onNavigate={setCurrentScreen}
            onQuickQuery={handleQuickQuery}
          />
        )}
        {currentScreen === 'tutor' && (
          <TutorScreen
            user={user}
            activeSession={activeSession}
            setActiveSession={setActiveSession}
          />
        )}
        {currentScreen === 'voice' && <VoiceScreen user={user} />}
        {currentScreen === 'history' && <HistoryScreen />}
        {currentScreen === 'saved' && <SavedScreen />}
        {currentScreen === 'languages' && (
          <LanguageScreen
            user={user}
            onUpdate={(upd) => {
              handleUpdateProfile(upd);
              setCurrentScreen('home');
            }}
          />
        )}
        {currentScreen === 'profile' && (
          <ProfileScreen
            user={user}
            onUpdate={handleUpdateProfile}
            onNavigate={setCurrentScreen}
          />
        )}
      </main>

      {/* Persistent Bottom Tab Navigation Bar */}
      <Navigation currentScreen={currentScreen} onNavigate={setCurrentScreen} />
    </div>
  );
}

export default App;
