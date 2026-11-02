import React, { useState } from 'react';
import type { UserProfile } from '../types';
import type { ScreenType } from '../components/Navigation';

interface HomeScreenProps {
  user: UserProfile;
  onNavigate: (screen: ScreenType) => void;
  onQuickQuery: (q: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ user, onNavigate, onQuickQuery }) => {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onQuickQuery(searchInput.trim());
    }
  };

  const sampleTopics = [
    { title: 'Pointers vs References', lang: 'Tenglish', tag: 'C++ Systems', progress: 80, icon: 'code' },
    { title: 'OS Process vs Thread', lang: 'Hinglish', tag: 'Operating Systems', progress: 45, icon: 'memory' },
    { title: 'Database Indexing (B-Tree)', lang: 'Tanglish', tag: 'DBMS', progress: 60, icon: 'database' },
  ];

  const examTopics = [
    { title: 'Deadlock Necessary Conditions (Coffman)', badge: '10 Marks', desc: 'Mutual exclusion, Hold & wait, No preemption, Circular wait.' },
    { title: 'TCP Three-Way Handshake (SYN, SYN-ACK, ACK)', badge: '8 Marks', desc: 'Step-by-step state transition breakdown with sequence numbers.' },
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Greeting Banner */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-bold text-on-surface">Namaste, {user.name}</h1>
            <span className="text-xl">🙏</span>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Learning becomes easier in your language ({user.base_language}).
          </p>
        </div>

        {/* Streak Pill */}
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container-high border border-amber-500/30 text-amber-300 shadow-md">
          <span className="material-symbols-outlined text-base text-amber-400 fill-1">local_fire_department</span>
          <span className="text-xs font-bold">{user.streak_days} Day Streak</span>
        </div>
      </div>

      {/* Hero Voice / AI Interactive Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-surface-container-high/90 via-surface-container to-surface-container-low border border-primary-container/30 shadow-neon relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary-container/20 text-primary text-[10px] font-bold tracking-wider uppercase border border-primary-container/30">
              Interactive Voice AI
            </span>
          </div>
          <h2 className="text-lg font-bold text-on-surface">
            Ask any question in <span className="text-primary">{user.base_language} + English</span>
          </h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Instant 4-tier conceptual breakdown: Simple vernacular, real-life analogy, key terms & exam-ready notes.
          </p>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => onNavigate('voice')}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-surface-tint to-primary-container text-on-primary font-bold text-xs shadow-neon flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-lg fill-1">mic</span>
              <span>Start Voice Session</span>
            </button>
            <button
              onClick={() => onNavigate('tutor')}
              className="px-4 py-3 rounded-2xl bg-surface-container-highest hover:bg-surface-container-high border border-outline-variant/40 text-on-surface font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              <span>Type</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Ask Search Pill */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <span className="material-symbols-outlined absolute left-4 top-3.5 text-primary-container text-xl pointer-events-none">
          search
        </span>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={`Ask Kugaya: "What is recursion?" in ${user.base_language}...`}
          className="w-full pl-12 pr-24 py-3.5 rounded-2xl bg-surface-container-high border border-surface-container-highest text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
        />
        <button
          type="submit"
          className="absolute right-2 top-2 px-3.5 py-1.5 rounded-xl bg-primary-container text-on-primary-container text-xs font-bold active:scale-95 transition-all"
        >
          Ask
        </button>
      </form>

      {/* Continue Learning Topics Carousel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-on-surface">Continue Learning</h3>
          <button onClick={() => onNavigate('history')} className="text-xs text-primary font-semibold hover:underline">
            View All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sampleTopics.map((topic, i) => (
            <div
              key={i}
              onClick={() => onQuickQuery(`Explain ${topic.title}`)}
              className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-highest hover:border-primary-container/40 transition-all cursor-pointer group active:scale-98"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-md bg-primary-container/10 border border-primary-container/20">
                  {topic.tag}
                </span>
                <span className="text-[10px] text-on-surface-variant">{topic.lang}</span>
              </div>
              <h4 className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                {topic.title}
              </h4>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-container rounded-full"
                    style={{ width: `${topic.progress}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-semibold text-on-surface-variant">
                  {topic.progress}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* High-Yield Exam Topics */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-amber-400 text-lg">local_fire_department</span>
          High-Yield Exam Topics
        </h3>
        <div className="space-y-2.5">
          {examTopics.map((ex, i) => (
            <div
              key={i}
              onClick={() => onQuickQuery(`Explain ${ex.title} for exam`)}
              className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-start justify-between gap-3 hover:border-primary-container/40 transition-all cursor-pointer active:scale-98"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-on-surface">{ex.title}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    {ex.badge}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant line-clamp-1">{ex.desc}</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-base mt-1">
                chevron_right
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
