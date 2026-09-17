import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { AppNotification, NotificationCategory, UserStatus, User } from '../../types';
import { api } from '../../services/api';
import { StatusViewerModal } from './StatusViewerModal';
import {
  Bell,
  Plus,
  Heart,
  MessageCircle,
  UserPlus,
  ShoppingBag,
  Store,
  ShieldCheck,
  Info,
  CheckCheck,
  Check,
  X,
  Sparkles,
  Layers
} from 'lucide-react';

interface NotificationsViewProps {
  currentUser: User;
  onNavigate: (tab: string, contextId?: string) => void;
  onViewProfile: (userId: string) => void;
  onRefreshUnread: () => void;
}

const CATEGORIES: { id: NotificationCategory | 'all'; labelKey: string; label: string }[] = [
  { id: 'all', labelKey: 'notif_cat_all', label: 'All' },
  { id: 'status', labelKey: 'notif_cat_status', label: 'Status' },
  { id: 'likes', labelKey: 'notif_cat_likes', label: 'Likes' },
  { id: 'comments', labelKey: 'notif_cat_comments', label: 'Comments' },
  { id: 'followers', labelKey: 'notif_cat_followers', label: 'Followers' },
  { id: 'requests', labelKey: 'notif_cat_requests', label: 'Requests' },
  { id: 'messages', labelKey: 'notif_cat_messages', label: 'Messages' },
  { id: 'marketplace', labelKey: 'notif_cat_marketplace', label: 'Marketplace' },
  { id: 'seller', labelKey: 'notif_cat_seller', label: 'Seller' },
  { id: 'security', labelKey: 'notif_cat_security', label: 'Security' },
  { id: 'system', labelKey: 'notif_cat_system', label: 'System' },
];

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  currentUser,
  onNavigate,
  onViewProfile,
  onRefreshUnread,
}) => {
  const { t } = useI18n();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [statuses, setStatuses] = useState<UserStatus[]>([]);
  const [activeViewingStatus, setActiveViewingStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // New Status creation toggle
  const [isAddingStatus, setIsAddingStatus] = useState(false);
  const [statusCaption, setStatusCaption] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [notifRes, statusRes] = await Promise.all([
        api.getNotifications(currentUser.id, selectedCategory === 'all' ? undefined : selectedCategory),
        api.getStatuses(),
      ]);
      setNotifications(notifRes.notifications || []);
      setStatuses(statusRes.statuses || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, currentUser.id]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead(currentUser.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      onRefreshUnread();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleNotificationClick = async (n: AppNotification) => {
    if (!n.isRead) {
      await api.markNotificationRead(n.id);
      setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)));
      onRefreshUnread();
    }

    // Navigate to target
    if (n.category === 'messages' || n.category === 'marketplace' || n.targetType === 'chat') {
      onNavigate('chats', n.targetId);
    } else if (n.category === 'seller' || n.targetType === 'subscription') {
      onNavigate('seller_center');
    } else if (n.category === 'followers' || n.targetType === 'profile' || (n.targetType as string) === 'user') {
      if (n.targetId) onViewProfile(n.targetId);
    } else if (n.targetType === 'post') {
      onNavigate('feed');
    }
  };

  const handleAddQuickStatus = async () => {
    try {
      const res = await api.createStatus({
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        userAvatar: currentUser.avatar,
        mediaUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
        mediaType: 'image',
        caption: statusCaption.trim() || 'Excited for what is next on Marketly!',
      });
      setStatuses((prev) => [res.status, ...prev]);
      setIsAddingStatus(false);
      setStatusCaption('');
    } catch (err) {
      console.error('Error creating status:', err);
    }
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'likes':
        return <Heart className="w-4 h-4 text-rose-400" />;
      case 'comments':
        return <MessageCircle className="w-4 h-4 text-sky-400" />;
      case 'followers':
      case 'requests':
        return <UserPlus className="w-4 h-4 text-indigo-400" />;
      case 'marketplace':
        return <ShoppingBag className="w-4 h-4 text-emerald-400" />;
      case 'seller':
        return <Store className="w-4 h-4 text-violet-400" />;
      case 'security':
        return <ShieldCheck className="w-4 h-4 text-amber-400" />;
      default:
        return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-24 pt-2 px-3 sm:px-4">
      {/* 24-HOUR STATUSES STRIP AT THE TOP */}
      <div className="mb-5 p-3.5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider">
              {t('status_24h')}
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">Expires in 24h</span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar pt-1">
          {/* Add Status button */}
          <div
            onClick={() => setIsAddingStatus(true)}
            className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
          >
            <div className="relative w-14 h-14 rounded-2xl p-0.5 bg-slate-800 border-2 border-dashed border-slate-600 group-hover:border-violet-500 transition-colors flex items-center justify-center">
              <img
                src={currentUser.avatar}
                alt="My Status"
                className="w-full h-full rounded-xl object-cover opacity-50 group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-300 max-w-[60px] truncate text-center">
              {t('add_status')}
            </span>
          </div>

          {/* Active Statuses */}
          {statuses.map((s) => (
            <div
              key={s.id}
              onClick={() => setActiveViewingStatus(s)}
              className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
            >
              <div className="w-14 h-14 rounded-2xl p-0.5 bg-gradient-to-tr from-violet-600 via-pink-500 to-indigo-400 group-hover:scale-105 transition-transform shadow-md">
                <img
                  src={s.userAvatar}
                  alt={s.userName}
                  className="w-full h-full rounded-xl object-cover border-2 border-slate-950"
                />
              </div>
              <span className="text-[11px] font-semibold text-slate-300 max-w-[64px] truncate text-center">
                {s.userName.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Status Quick Modal */}
      {isAddingStatus && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-white">Add 24h Status</h4>
              <button onClick={() => setIsAddingStatus(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Status Caption</label>
              <input
                type="text"
                value={statusCaption}
                onChange={(e) => setStatusCaption(e.target.value)}
                placeholder="What's happening right now?"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddingStatus(false)}
                className="px-3 py-1.5 text-xs text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAddQuickStatus}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow"
              >
                Publish Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Section Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-violet-400" />
          <span>{t('notifications_title')}</span>
        </h2>
        <button
          onClick={handleMarkAllRead}
          className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 transition-colors"
        >
          <CheckCheck className="w-4 h-4" />
          <span>{t('mark_all_read')}</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              {t(cat.labelKey as any) || cat.label}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800/60 text-xs text-slate-400 space-y-2">
            <Bell className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-bold text-slate-300">No notifications in this category</p>
            <p>You are all caught up!</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                n.isRead
                  ? 'bg-slate-900/60 border-slate-800/60 hover:bg-slate-850'
                  : 'bg-violet-950/20 border-violet-800/40 hover:bg-violet-950/30 ring-1 ring-violet-500/20'
              }`}
            >
              {/* Category Icon */}
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shrink-0 mt-0.5">
                {getCategoryIcon(n.category)}
              </div>

              {/* Body */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-xs text-white truncate">{n.title}</p>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{n.body}</p>

                {/* Request Actions (Accept / Reject) */}
                {n.category === 'requests' && !n.isRead && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationClick(n);
                      }}
                      className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold shadow"
                    >
                      {t('accept')}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        api.markNotificationRead(n.id);
                        setNotifications((prev) => prev.filter((item) => item.id !== n.id));
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                    >
                      {t('reject')}
                    </button>
                  </div>
                )}
              </div>

              {/* Unread dot */}
              {!n.isRead && (
                <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>

      {/* 24-hour Status Viewer Modal */}
      {activeViewingStatus && (
        <StatusViewerModal
          status={activeViewingStatus}
          currentUser={currentUser}
          onClose={() => setActiveViewingStatus(null)}
        />
      )}
    </div>
  );
};
