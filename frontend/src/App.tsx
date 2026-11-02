import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { MainLayout } from './layouts/MainLayout';

import { HomeScreen } from './pages/HomeScreen';
import { TutorScreen } from './pages/TutorScreen';
import { VoiceScreen } from './pages/VoiceScreen';
import { HistoryScreen } from './pages/HistoryScreen';
import { SavedScreen } from './pages/SavedScreen';
import { LanguageScreen } from './pages/LanguageScreen';
import { ProfileScreen } from './pages/ProfileScreen';
import { OnboardingScreen } from './pages/OnboardingScreen';

export const App: React.FC = () => {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          {/* Standalone Onboarding Route (No Header / Bottom Tabs) */}
          <Route path="/onboarding" element={<OnboardingScreen />} />

          {/* Standard Persistent Layout for All Other 7 Screens */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/tutor" element={<TutorScreen />} />
            <Route path="/voice" element={<VoiceScreen />} />
            <Route path="/history" element={<HistoryScreen />} />
            <Route path="/saved" element={<SavedScreen />} />
            <Route path="/languages" element={<LanguageScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
};

export default App;
