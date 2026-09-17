import React from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { User } from '../../types';
import { Home, MessageSquare, PlusSquare, Bell, User as UserIcon, Store, ShieldCheck, Sparkles, LogOut } from 'lucide-react';

interface DesktopSidebarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  currentUser: User;
  unreadCount?: number;
  unreadNotifications?: number;
  unreadChatsCount?: number;
  unreadChats?: number;
  onOpenCreatePost?: () => void;
  onOpenAI?: () => void;
  onLogout: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentTab,
  onNavigate,
  currentUser,
  unreadCount = 0,
  unreadNotifications = 0,
  unreadChatsCount = 0,
  unreadChats = 0,
  onOpenCreatePost,
  onOpenAI,
  onLogout,
}) => {
  const { t } = useI18n();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-slate-950 border-r border-slate-800/80 p-5 shrink-0 justify-between">
      {/* Brand Header */}
      <div className="space-y-6">
        <div
          onClick={() => onNavigate('feed')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              MARKETLY
            </h1>
            <p className="text-[11px] text-violet-400 font-medium tracking-wide">
              {t('brand_tagline')}
            </p>
          </div>
        </div>

        {/* User Card */}
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.username}
            className="w-10 h-10 rounded-xl object-cover border border-violet-500/30"
          />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-white truncate">
              {currentUser.firstName} {currentUser.lastName}
            </p>
            <p className="text-xs text-slate-400 truncate">@{currentUser.username}</p>
          </div>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
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

        {/* Primary 5 Functions Navigation */}
        <nav className="space-y-1.5 pt-2">
          {/* 1. FEED */}
          <button
            onClick={() => onNavigate('feed')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-semibold text-sm transition-all ${
              currentTab === 'feed'
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-md shadow-violet-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Home className="w-5 h-5 shrink-0" />
            <span>{t('nav_feed')}</span>
          </button>

          {/* 2. CHATS */}
          <button
            onClick={() => onNavigate('chats')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-semibold text-sm transition-all ${
              currentTab === 'chats'
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-md shadow-violet-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <MessageSquare className="w-5 h-5 shrink-0" />
              <span>{t('nav_chats')}</span>
            </div>
            {unreadChatsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-xs font-bold">
                {unreadChatsCount}
              </span>
            )}
          </button>

          {/* 3. CREATE */}
          <button
            onClick={() => onNavigate('create')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-semibold text-sm transition-all ${
              currentTab === 'create'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30'
                : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:border-violet-500/50 hover:text-white'
            }`}
          >
            <PlusSquare className="w-5 h-5 shrink-0" />
            <span>{t('nav_create')}</span>
          </button>

          {/* 4. NOTIFICATIONS */}
          <button
            onClick={() => onNavigate('notifications')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-semibold text-sm transition-all ${
              currentTab === 'notifications'
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-md shadow-violet-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Bell className="w-5 h-5 shrink-0" />
              <span>{t('nav_notifications')}</span>
            </div>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {/* 5. PROFILE */}
          <button
            onClick={() => onNavigate('profile')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-semibold text-sm transition-all ${
              currentTab === 'profile'
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-md shadow-violet-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <UserIcon className="w-5 h-5 shrink-0" />
            <span>{t('nav_profile')}</span>
          </button>

          {/* SELLER ONLY: SELLER CENTER */}
          {currentUser.role === 'SELLER' && (
            <div className="pt-3">
              <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase px-4 mb-1">
                Business
              </div>
              <button
                onClick={() => onNavigate('seller_center')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                  currentTab === 'seller_center'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                    : 'text-violet-300 bg-violet-950/30 border border-violet-800/40 hover:bg-violet-900/30'
                }`}
              >
                <Store className="w-5 h-5 shrink-0" />
                <span>{t('nav_seller_center')}</span>
              </button>
            </div>
          )}

          {/* ADMIN ONLY: ADMIN PANEL */}
          {currentUser.role === 'ADMIN' && (
            <div className="pt-3">
              <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase px-4 mb-1">
                Governance
              </div>
              <button
                onClick={() => onNavigate('admin_panel')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                  currentTab === 'admin_panel'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
                    : 'text-amber-300 bg-amber-950/30 border border-amber-800/40 hover:bg-amber-900/30'
                }`}
              >
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>{t('nav_admin_panel')}</span>
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Logout button */}
      <button
        onClick={onLogout}
        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-xs font-semibold"
      >
        <LogOut className="w-4 h-4" />
        <span>{t('logout')}</span>
      </button>
    </aside>
  );
};
