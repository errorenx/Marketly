import React from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { User } from '../../types';
import { Sparkles, Search, Bell, Activity, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onOpenSearch: () => void;
  onOpenPulse?: () => void;
  onOpenAI?: () => void;
  onNavigate: (tab: string) => void;
  unreadCount?: number;
  unreadNotifications?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenSearch,
  onOpenPulse,
  onNavigate,
  unreadCount,
}) => {
  const { t, language, setLanguage } = useI18n();

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div
          onClick={() => onNavigate('feed')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                MARKETLY
              </span>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md border ${
                currentUser.role === 'SELLER'
                  ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                  : currentUser.role === 'BUYER'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  : currentUser.role === 'ADMIN'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
              }`}>
                {currentUser.role}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide hidden sm:block">
              {t('brand_tagline')}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Marketly Pulse trigger */}
          <button
            onClick={onOpenPulse}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-violet-300 border border-slate-700/60 text-xs font-semibold transition-colors"
            title="Marketly Pulse"
          >
            <Activity className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
            <span className="hidden sm:inline">Pulse</span>
          </button>

          {/* Search trigger */}
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60 transition-colors"
            title={t('nav_search')}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notifications button */}
          <button
            onClick={() => onNavigate('notifications')}
            className="relative p-2 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60 transition-colors"
            title={t('nav_notifications')}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center shadow">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
            className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60 text-xs font-bold transition-colors"
          >
            {language === 'en' ? 'اردو' : 'EN'}
          </button>

          {/* User profile avatar click */}
          <button
            onClick={() => onNavigate('profile')}
            className="w-8 h-8 rounded-full overflow-hidden border border-violet-500/50 hover:ring-2 hover:ring-violet-500 transition-all"
            title="My Profile"
          >
            <img src={currentUser.avatar} alt={currentUser.username} className="w-full h-full object-cover" />
          </button>
        </div>
      </div>
    </header>
  );
};
