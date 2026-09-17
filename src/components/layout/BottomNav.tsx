import React from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { User } from '../../types';
import { Home, MessageSquare, PlusSquare, Bell, User as UserIcon } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  currentUser?: User;
  unreadCount?: number;
  unreadNotifications?: number;
  unreadChatsCount?: number;
  unreadChats?: number;
  onOpenCreatePost?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onNavigate,
  currentUser,
  unreadCount = 0,
  unreadNotifications = 0,
  unreadChatsCount = 0,
  unreadChats = 0,
  onOpenCreatePost,
}) => {
  const { t } = useI18n();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 safe-area-pb">
      <div className="flex items-center justify-around">
        {/* 1. FEED */}
        <button
          onClick={() => onNavigate('feed')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            currentTab === 'feed'
              ? 'text-violet-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">{t('nav_feed')}</span>
        </button>

        {/* 2. CHATS */}
        <button
          onClick={() => onNavigate('chats')}
          className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            currentTab === 'chats'
              ? 'text-violet-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          {unreadChatsCount > 0 && (
            <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-violet-500" />
          )}
          <span className="text-[10px] tracking-tight">{t('nav_chats')}</span>
        </button>

        {/* 3. CREATE (Elevated & Prominent) */}
        <button
          onClick={() => onNavigate('create')}
          className="flex flex-col items-center justify-center -mt-4 group"
          title={t('nav_create')}
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/40 group-hover:scale-110 group-active:scale-95 transition-all">
            <PlusSquare className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-[10px] text-slate-300 font-semibold mt-1">{t('nav_create')}</span>
        </button>

        {/* 4. NOTIFICATIONS */}
        <button
          onClick={() => onNavigate('notifications')}
          className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            currentTab === 'notifications'
              ? 'text-violet-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
          <span className="text-[10px] tracking-tight">{t('nav_notifications')}</span>
        </button>

        {/* 5. PROFILE */}
        <button
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            currentTab === 'profile'
              ? 'text-violet-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">{t('nav_profile')}</span>
        </button>
      </div>
    </nav>
  );
};
