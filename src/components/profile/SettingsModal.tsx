import React, { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { useTheme, Theme } from '../../context/ThemeContext';
import { User, PrivacySettings } from '../../types';
import { api } from '../../services/api';
import {
  Settings,
  X,
  User as UserIcon,
  Shield,
  Bell,
  Palette,
  Store,
  LogOut,
  AlertTriangle,
  Lock,
  Check,
  ChevronRight,
  ArrowLeft,
  Moon,
  Sun,
  Laptop,
  CheckCircle2,
  Trash2,
  UserX,
  MessageSquare,
  RefreshCw,
  ShoppingBag,
  Sparkles
} from 'lucide-react';

interface SettingsModalProps {
  currentUser: User;
  onClose: () => void;
  onUserUpdated: (user: User) => void;
  onLogout: () => void;
  onNavigate?: (tab: string) => void;
}

type SettingsSection = 'account' | 'edit_profile' | 'privacy' | 'notifications' | 'appearance' | 'seller';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentUser,
  onClose,
  onUserUpdated,
  onLogout,
  onNavigate,
}) => {
  const { t } = useI18n();
  const { theme, palette, resolvedTheme, setTheme, setPalette } = useTheme();

  // Active section (Account, Edit Profile, Privacy, Notifications, Appearance, Seller)
  const [activeSection, setActiveSection] = useState<SettingsSection>('edit_profile');
  // For mobile navigation: whether viewing a specific section or category menu
  const [mobileViewingSection, setMobileViewingSection] = useState<boolean>(false);

  // Edit Profile form state
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [description, setDescription] = useState(currentUser.description || '');
  const [city, setCity] = useState(currentUser.city || '');

  // Privacy form state
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profilePrivacy: currentUser.privacySettings?.profilePrivacy || 'public',
    whoCanMessageMe: currentUser.privacySettings?.whoCanMessageMe || 'everyone',
    whoCanFollowMe: currentUser.privacySettings?.whoCanFollowMe || 'everyone',
    whoCanSendRequests: currentUser.privacySettings?.whoCanSendRequests || 'everyone',
    commentsEnabled: currentUser.privacySettings?.commentsEnabled !== false,
    showLastSeen: currentUser.privacySettings?.showLastSeen !== false,
    showOnlineStatus: currentUser.privacySettings?.showOnlineStatus !== false,
  });

  // Notification toggles state (persisted locally)
  const [notifSettings, setNotifSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('marketly_notif_settings');
      return saved ? JSON.parse(saved) : {
        messages: true,
        social: true,
        marketplace: true,
        seller: true,
        system: true,
      };
    } catch {
      return {
        messages: true,
        social: true,
        marketplace: true,
        seller: true,
        system: true,
      };
    }
  });

  // Seller Welcome Message state
  const [welcomeMessage, setWelcomeMessage] = useState(
    currentUser.sellerSettings?.welcomeMessage ||
      'Hello! Thank you for contacting me. Please let me know what details you need about my product.'
  );

  // Deactivation and deletion state
  const [deactivateReason, setDeactivateReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    setSaveSuccess(null);
    try {
      const res = await api.updateUser(currentUser.id, {
        avatar,
        bio,
        description,
        city,
      });
      onUserUpdated(res.user);
      setSaveSuccess('Profile updated successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    setSaving(true);
    setError(null);
    setSaveSuccess(null);
    try {
      const res = await api.updateUser(currentUser.id, {
        privacySettings: privacy,
      });
      onUserUpdated(res.user);
      setSaveSuccess('Privacy settings saved to backend!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSellerWelcome = async () => {
    setSaving(true);
    setError(null);
    setSaveSuccess(null);
    try {
      const res = await api.updateUser(currentUser.id, {
        sellerSettings: {
          ...currentUser.sellerSettings,
          welcomeMessage: welcomeMessage.trim(),
        },
      });
      onUserUpdated(res.user);
      setSaveSuccess('Order Chat Welcome Message updated!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update welcome message');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotif = (key: string) => {
    const updated = { ...notifSettings, [key]: !notifSettings[key] };
    setNotifSettings(updated);
    localStorage.setItem('marketly_notif_settings', JSON.stringify(updated));
    setSaveSuccess('Notification preferences updated');
    setTimeout(() => setSaveSuccess(null), 2000);
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Are you sure you want to temporarily block/deactivate your account? You can unblock it by logging back in.')) return;
    try {
      await api.deactivateUser(currentUser.id, deactivateReason, true);
      alert('Your account has been temporarily deactivated. You can unblock it anytime by signing in again.');
      onLogout();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate account');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    if (!window.confirm('PERMANENT ACTION: Are you absolutely certain you want to permanently delete your account and all data?')) return;
    try {
      await api.deleteUser(currentUser.id);
      alert('Your account and all associated data have been permanently deleted.');
      onLogout();
    } catch (err: any) {
      alert(err.message || 'Failed to delete account');
    }
  };

  const SECTIONS: { id: SettingsSection; label: string; icon: React.FC<any>; description: string; sellerOnly?: boolean }[] = [
    { id: 'edit_profile', label: 'Edit Profile', icon: UserIcon, description: 'Photo, bio, and public info' },
    { id: 'account', label: 'Account', icon: Shield, description: 'Account info, security & deactivation' },
    { id: 'privacy', label: 'Privacy', icon: Lock, description: 'Messages, follows & visibility' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Push, chat & marketplace alerts' },
    { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Dark & light themes' },
    ...(currentUser.role === 'SELLER'
      ? [{ id: 'seller' as SettingsSection, label: 'Seller Settings', icon: Store, description: 'Subscription & Order Chat Welcome', sellerOnly: true }]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full h-full sm:h-auto sm:max-h-[92vh] max-w-4xl bg-slate-900 border-0 sm:border border-slate-800 rounded-none sm:rounded-3xl shadow-2xl relative my-auto flex flex-col overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            {mobileViewingSection && (
              <button
                type="button"
                onClick={() => setMobileViewingSection(false)}
                className="md:hidden p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-9 h-9 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">Settings</h2>
              <p className="text-xs text-slate-400">Manage your profile, security, and preferences</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FEEDBACK BANNERS */}
        {saveSuccess && (
          <div className="mx-4 mt-3 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-semibold flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}
        {error && (
          <div className="mx-4 mt-3 p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-semibold flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* RESPONSIVE 2-COLUMN BODY */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT COLUMN: CATEGORIES (Hidden on mobile if viewing section) */}
          <div className={`w-full md:w-64 lg:w-72 border-r border-slate-800 bg-slate-950/40 p-3 overflow-y-auto space-y-1.5 shrink-0 ${
            mobileViewingSection ? 'hidden md:block' : 'block'
          }`}>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1">Categories</p>
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isSelected = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(sec.id);
                    setMobileViewingSection(true);
                    setError(null);
                    setSaveSuccess(null);
                  }}
                  className={`w-full p-3 rounded-2xl text-left transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-950/40'
                      : 'hover:bg-slate-850 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-white'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate">{sec.label}</p>
                      <p className={`text-[10px] truncate ${isSelected ? 'text-violet-200' : 'text-slate-500'}`}>
                        {sec.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 md:hidden ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                </button>
              );
            })}

            {/* Logout Shortcut */}
            <div className="pt-4 mt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={onLogout}
                className="w-full p-3 rounded-2xl text-left text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 text-xs font-bold transition-colors flex items-center gap-2.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: SELECTED SETTING CONTENT (Hidden on mobile if NOT viewing section) */}
          <div className={`flex-1 p-4 sm:p-6 overflow-y-auto ${
            !mobileViewingSection ? 'hidden md:block' : 'block'
          }`}>
            
            {/* 1. EDIT PROFILE SECTION */}
            {activeSection === 'edit_profile' && (
              <div className="space-y-5 max-w-xl">
                <div>
                  <h3 className="text-base font-black text-white">Edit Profile</h3>
                  <p className="text-xs text-slate-400">Update your public avatar, bio, and city</p>
                </div>

                {/* Avatar Preview & URL */}
                <div className="p-4 bg-slate-850/60 rounded-2xl border border-slate-800 flex items-center gap-4">
                  <img
                    src={avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                    alt="Avatar Preview"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-violet-500/40 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-bold text-slate-300 mb-1">Avatar Image URL</label>
                    <input
                      type="url"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Bio</label>
                  <input
                    type="text"
                    value={bio}
                    maxLength={140}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Short summary about yourself..."
                    className="w-full px-3.5 py-2.5 bg-slate-850/60 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500"
                  />
                  <span className="text-[10px] text-slate-500 block text-right mt-1">{bio.length}/140</span>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">About / Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    maxLength={500}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed introduction..."
                    className="w-full px-3.5 py-2.5 bg-slate-850/60 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500 resize-none"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lahore, Karachi, Islamabad"
                    className="w-full px-3.5 py-2.5 bg-slate-850/60 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                {/* Protected Account Information (Read-Only) */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Protected Account Details (Read-Only)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Username</span>
                      <span className="font-mono font-bold text-slate-300">@{currentUser.username}</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Email</span>
                      <span className="font-mono font-bold text-slate-300">{currentUser.email || 'Protected'}</span>
                    </div>
                  </div>
                </div>

                {currentUser.role === 'SELLER' && (
                  <div className="p-3 bg-violet-950/30 border border-violet-800/30 rounded-2xl text-xs text-violet-300 flex items-center justify-between">
                    <span>Manage business name, address, and products in Seller Center.</span>
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigate('seller');
                        }}
                        className="font-bold underline ml-2 shrink-0"
                      >
                        Go to Seller Center →
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Profile</span>
                </button>
              </div>
            )}

            {/* 2. ACCOUNT SECTION */}
            {activeSection === 'account' && (
              <div className="space-y-6 max-w-xl text-xs">
                <div>
                  <h3 className="text-base font-black text-white">Account Information & Security</h3>
                  <p className="text-slate-400">Account status, security, and permanent actions</p>
                </div>

                {/* Account Details Card */}
                <div className="p-4 bg-slate-850/60 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-white text-xs">Identity Summary</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Full Name</span>
                      <span className="font-bold text-slate-200">{currentUser.firstName} {currentUser.lastName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Account Role</span>
                      <span className="font-bold text-violet-400 capitalize">{currentUser.role} Account</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Country</span>
                      <span className="font-bold text-slate-200">{currentUser.country}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Member Since</span>
                      <span className="font-bold text-slate-200">
                        {new Date(currentUser.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Block / Deactivate My Account */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <UserX className="w-4 h-4" />
                    <span>Block / Deactivate My Account</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Temporarily hide your profile and products from other users. You can reactivate and unblock your account at any time by signing back in.
                  </p>
                  <input
                    type="text"
                    value={deactivateReason}
                    onChange={(e) => setDeactivateReason(e.target.value)}
                    placeholder="Reason for deactivation (optional)..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleDeactivate}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    Temporarily Deactivate Account
                  </button>
                </div>

                {/* Delete Account */}
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-rose-400 font-bold">
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Account Permanently</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Permanently delete your profile, posts, products, order chats, and associated data. This action cannot be undone.
                  </p>
                  <label className="flex items-center gap-2 text-rose-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.checked)}
                      className="rounded border-rose-500 text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-[11px]">I confirm I want to permanently delete my account</span>
                  </label>
                  <button
                    type="button"
                    disabled={!confirmDelete}
                    onClick={handleDelete}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    Permanently Delete My Account
                  </button>
                </div>
              </div>
            )}

            {/* 3. PRIVACY SECTION */}
            {activeSection === 'privacy' && (
              <div className="space-y-4 max-w-xl text-xs">
                <div>
                  <h3 className="text-base font-black text-white">Privacy & Permissions</h3>
                  <p className="text-slate-400">Control who can discover, message, and interact with you</p>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 bg-slate-850/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">Profile Privacy</p>
                      <p className="text-slate-400 text-[11px]">When private, only approved followers view your profile</p>
                    </div>
                    <select
                      value={privacy.profilePrivacy}
                      onChange={(e) => setPrivacy({ ...privacy, profilePrivacy: e.target.value as any })}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-white text-xs"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  <div className="p-3 bg-slate-850/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">Who Can Message Me</p>
                      <p className="text-slate-400 text-[11px]">Control incoming direct message requests</p>
                    </div>
                    <select
                      value={privacy.whoCanMessageMe}
                      onChange={(e) => setPrivacy({ ...privacy, whoCanMessageMe: e.target.value as any })}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-white text-xs"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="followers">Followers Only</option>
                      <option value="none">Nobody</option>
                    </select>
                  </div>

                  <div className="p-3 bg-slate-850/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">Who Can Follow Me</p>
                      <p className="text-slate-400 text-[11px]">Allow instant follows or require confirmation</p>
                    </div>
                    <select
                      value={privacy.whoCanFollowMe}
                      onChange={(e) => setPrivacy({ ...privacy, whoCanFollowMe: e.target.value as any })}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-white text-xs"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="request_only">Request Only</option>
                    </select>
                  </div>

                  <div className="p-3 bg-slate-850/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">Who Can Send Social Requests</p>
                      <p className="text-slate-400 text-[11px]">Allow bridging from Seller Chat to Social Chat</p>
                    </div>
                    <select
                      value={privacy.whoCanSendRequests}
                      onChange={(e) => setPrivacy({ ...privacy, whoCanSendRequests: e.target.value as any })}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-white text-xs"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="none">Nobody</option>
                    </select>
                  </div>

                  <div className="p-3 bg-slate-850/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">Comments on Posts</p>
                      <p className="text-slate-400 text-[11px]">Allow discussion under your feed posts</p>
                    </div>
                    <select
                      value={privacy.commentsEnabled ? 'enabled' : 'disabled'}
                      onChange={(e) => setPrivacy({ ...privacy, commentsEnabled: e.target.value === 'enabled' })}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-white text-xs"
                    >
                      <option value="enabled">Enabled</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>

                  <div className="p-3 bg-slate-850/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">Online Status</p>
                      <p className="text-slate-400 text-[11px]">Show green active indicator in chat</p>
                    </div>
                    <select
                      value={privacy.showOnlineStatus ? 'everyone' : 'nobody'}
                      onChange={(e) => setPrivacy({ ...privacy, showOnlineStatus: e.target.value === 'everyone' })}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-white text-xs"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSavePrivacy}
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Privacy Settings</span>
                </button>
              </div>
            )}

            {/* 4. NOTIFICATION SETTINGS */}
            {activeSection === 'notifications' && (
              <div className="space-y-4 max-w-xl text-xs">
                <div>
                  <h3 className="text-base font-black text-white">Notification Preferences</h3>
                  <p className="text-slate-400">Manage real-time push alerts and sound notifications</p>
                </div>

                <div className="space-y-2.5">
                  {[
                    { key: 'messages', label: 'Direct Messages & Order Chats', desc: 'Inquiries from buyers, sellers, and contacts' },
                    { key: 'social', label: 'Social Interactions', desc: 'Likes, comments, mentions, and follows' },
                    { key: 'marketplace', label: 'Marketplace & Price Updates', desc: 'Price drops, discounts, and restock alerts' },
                    { key: 'seller', label: 'Seller & Order Now Alerts', desc: 'New customer COD inquiries and product clicks' },
                    { key: 'system', label: 'System Announcements', desc: 'Security updates and marketplace announcements' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      onClick={() => handleToggleNotif(item.key)}
                      className="p-3 bg-slate-850/60 rounded-2xl border border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-white">{item.label}</p>
                        <p className="text-slate-400 text-[11px]">{item.desc}</p>
                      </div>
                      <div className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                        notifSettings[item.key] ? 'bg-violet-600 justify-end' : 'bg-slate-700 justify-start'
                      }`}>
                        <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. APPEARANCE / THEME SETTINGS */}
            {activeSection === 'appearance' && (
              <div className="space-y-5 max-w-xl">
                <div>
                  <h3 className="text-base font-black text-white">Appearance & Theme</h3>
                  <p className="text-xs text-slate-400">
                    Switch between Dark and Light mode. Changes update the entire application immediately and persist.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Dark Mode */}
                  <div
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-2.5 ${
                      theme === 'dark'
                        ? 'border-violet-500 bg-violet-600/15 ring-1 ring-violet-500'
                        : 'border-slate-800 bg-slate-850/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-950 text-slate-200 flex items-center justify-center border border-slate-800">
                      <Moon className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">Dark Mode</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Classic Marketly Dark</p>
                    </div>
                    {theme === 'dark' && (
                      <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Light Mode */}
                  <div
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-2.5 ${
                      theme === 'light'
                        ? 'border-violet-500 bg-violet-600/15 ring-1 ring-violet-500'
                        : 'border-slate-800 bg-slate-850/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-300">
                      <Sun className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">Light Mode</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Clean crisp day mode</p>
                    </div>
                    {theme === 'light' && (
                      <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold">
                        Active
                      </span>
                    )}
                  </div>

                  {/* System Mode */}
                  <div
                    onClick={() => setTheme('system')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-2.5 ${
                      theme === 'system'
                        ? 'border-violet-500 bg-violet-600/15 ring-1 ring-violet-500'
                        : 'border-slate-800 bg-slate-850/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-slate-300 flex items-center justify-center border border-slate-700">
                      <Laptop className="w-5 h-5 text-sky-400" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">System Sync</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Match OS theme ({resolvedTheme})</p>
                    </div>
                    {theme === 'system' && (
                      <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold">
                        Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-bold text-white mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-rose-400" />
                    <span>Theme Color Palette (Design Styles)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Selected: <strong className="text-rose-400">{palette === 'obsidian_coral' ? 'Option 3: Midnight Obsidian & Sunset Coral (Warm Luxury)' : palette}</strong>
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Option 3: Midnight Obsidian & Sunset Coral */}
                    <div
                      onClick={() => setPalette('obsidian_coral')}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        palette === 'obsidian_coral'
                          ? 'border-rose-500 bg-rose-950/20 ring-1 ring-rose-500 shadow-md'
                          : 'border-slate-800 bg-slate-850/60 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 flex items-center justify-center text-white shadow">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-white">3. Obsidian & Sunset Coral</p>
                          <p className="text-[10px] text-slate-400">Warm luxury, creator & commerce</p>
                        </div>
                      </div>
                      {palette === 'obsidian_coral' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Option 1: Cyber Violet & Dark Indigo */}
                    <div
                      onClick={() => setPalette('cyber_violet')}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        palette === 'cyber_violet'
                          ? 'border-violet-500 bg-violet-950/20 ring-1 ring-violet-500 shadow-md'
                          : 'border-slate-800 bg-slate-850/60 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-white">1. Cyber Violet & Indigo</p>
                          <p className="text-[10px] text-slate-400">Tech & digital gadgets</p>
                        </div>
                      </div>
                      {palette === 'cyber_violet' && (
                        <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Option 2: Emerald Oasis & Royal Gold */}
                    <div
                      onClick={() => setPalette('emerald_oasis')}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        palette === 'emerald_oasis'
                          ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500 shadow-md'
                          : 'border-slate-800 bg-slate-850/60 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-amber-500 flex items-center justify-center text-white shadow">
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-white">2. Emerald & Royal Gold</p>
                          <p className="text-[10px] text-slate-400">Traditional trust & clothing</p>
                        </div>
                      </div>
                      {palette === 'emerald_oasis' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Option 4: Royal Sapphire & Cyan */}
                    <div
                      onClick={() => setPalette('royal_sapphire')}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        palette === 'royal_sapphire'
                          ? 'border-sky-500 bg-sky-950/20 ring-1 ring-sky-500 shadow-md'
                          : 'border-slate-800 bg-slate-850/60 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow">
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-white">4. Royal Sapphire & Cyan</p>
                          <p className="text-[10px] text-slate-400">Daraz pro & electronics</p>
                        </div>
                      </div>
                      {palette === 'royal_sapphire' && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-850/40 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1">
                  <p className="font-bold text-slate-200">Full Website Application</p>
                  <p>
                    Theme mode applies across the entire Marketly application including Feed reels, Chats, Create flows, Notifications, Profile, Seller Center, Modals, and Navigation bars.
                  </p>
                </div>
              </div>
            )}

            {/* 6. SELLER SETTINGS (Seller role only) */}
            {activeSection === 'seller' && currentUser.role === 'SELLER' && (
              <div className="space-y-6 max-w-xl text-xs">
                <div>
                  <h3 className="text-base font-black text-white">Seller Settings</h3>
                  <p className="text-slate-400">Subscription status, plan management, and Order Chat automations</p>
                </div>

                {/* Seller Subscription Box */}
                <div className="p-4 bg-gradient-to-tr from-violet-950/40 to-slate-900 rounded-2xl border border-violet-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-violet-400" />
                      <span className="font-bold text-white text-xs">Seller Subscription</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">
                      Active Plan
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Current Tier</span>
                      <span className="font-bold text-slate-200">Marketly Seller Gold Tier</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Payment Status</span>
                      <span className="font-bold text-emerald-400">Active - Verified</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Time Remaining</span>
                      <span className="font-bold text-slate-200">24 Days (Auto-Renews)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Active Products</span>
                      <span className="font-bold text-violet-300">Unlimited Publishing</span>
                    </div>
                  </div>

                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigate('seller');
                      }}
                      className="w-full py-2 bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-200 hover:text-white font-bold rounded-xl text-xs transition-colors"
                    >
                      Manage Subscription in Seller Center →
                    </button>
                  )}
                </div>

                {/* ORDER CHAT WELCOME MESSAGE SETTING */}
                <div className="p-4 bg-slate-850/60 rounded-2xl border border-slate-800 space-y-3">
                  <div>
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                      <span>Order Chat Welcome Message</span>
                    </h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      This message is automatically sent to buyers when they click "ORDER NOW" on any of your products for the first time.
                    </p>
                  </div>

                  <textarea
                    rows={3}
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Enter greeting for new buyer order inquiries..."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 resize-none"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Only the latest saved message is used for new Order chats.</span>
                    <button
                      type="button"
                      onClick={handleSaveSellerWelcome}
                      disabled={saving}
                      className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow transition-all flex items-center gap-1.5"
                    >
                      {saving && <RefreshCw className="w-3 h-3 animate-spin" />}
                      <span>Save Message</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 sm:p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
