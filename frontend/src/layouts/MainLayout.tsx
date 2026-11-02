import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { Navigation } from '../components/Navigation';

export const MainLayout: React.FC = () => {
  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      {/* Persistent Top Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto pt-20 pb-24 px-4">
        <Outlet />
      </main>

      {/* Persistent Bottom Tab Bar */}
      <Navigation />
    </div>
  );
};
