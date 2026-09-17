import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { User, Product, Post } from '../../types';
import { api } from '../../services/api';
import { SettingsModal } from './SettingsModal';
import {
  MapPin,
  Settings,
  Share2,
  UserPlus,
  MessageSquare,
  ShoppingBag,
  Store,
  Grid,
  ShieldCheck,
  Truck,
  Heart,
  Eye,
  Check,
  Sparkles
} from 'lucide-react';

interface ProfileViewProps {
  currentUser: User;
  viewingUserId?: string | null;
  onOrderNow: (productId: string) => void;
  onStartChatWithUser: (user: User) => void;
  onUserUpdated: (user: User) => void;
  onLogout: () => void;
  onNavigate: (tab: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  viewingUserId,
  onOrderNow,
  onStartChatWithUser,
  onUserUpdated,
  onLogout,
  onNavigate,
}) => {
  const { t } = useI18n();

  const isSelf = !viewingUserId || viewingUserId === currentUser.id;
  const targetId = isSelf ? currentUser.id : viewingUserId!;

  const [profileUser, setProfileUser] = useState<User>(isSelf ? currentUser : currentUser);
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Role-based profile tabs:
  // - Seller: SELLER and SOCIAL
  // - Buyer: BUYER and SOCIAL
  // - Social: SOCIAL only
  const getProfileTabs = (role: string) => {
    if (role === 'SELLER') return ['seller', 'social'];
    if (role === 'BUYER') return ['buyer', 'social'];
    return ['social'];
  };

  const availableTabs = getProfileTabs(profileUser.role);
  const [activeTab, setActiveTab] = useState<string>(availableTabs[0]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const userRes = await api.getUser(targetId, isSelf);
      setProfileUser(userRes.user);
      setFollowersCount(userRes.user.followersCount || 0);

      // Load products if seller
      if (userRes.user.role === 'SELLER') {
        const prodRes = await api.getProducts({ sellerId: targetId });
        setProducts(prodRes.products || []);
      }

      // Load posts
      const feedRes = await api.getFeed(userRes.user.role);
      const userPosts = (feedRes.posts || []).filter((p) => p.authorId === targetId);
      setPosts(userPosts);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [targetId, isSelf]);

  const handleFollowToggle = () => {
    setIsFollowing((prev) => !prev);
    setFollowersCount((prev) => prev + (isFollowing ? -1 : 1));
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-24 pt-2 px-3 sm:px-4">
      {/* PROFILE HEADER CARD */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden mb-6">
        {/* Subtle accent glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left rtl:sm:text-right">
          {/* Avatar with role ring */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 bg-gradient-to-tr from-violet-600 via-indigo-600 to-sky-400 shadow-xl">
              <img
                src={profileUser.avatar}
                alt={profileUser.username}
                className="w-full h-full rounded-[22px] object-cover border-2 border-slate-950"
              />
            </div>
            <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider border shadow-md ${
              profileUser.role === 'SELLER'
                ? 'bg-violet-600 text-white border-violet-400'
                : 'bg-sky-600 text-white border-sky-400'
            }`}>
              {profileUser.role}
            </span>
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    {profileUser.firstName} {profileUser.lastName}
                  </h1>
                  {profileUser.role === 'SELLER' && (
                    <span className="p-1 rounded-full bg-violet-500/20 text-violet-400" title="Verified Seller">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-medium">@{profileUser.username}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center sm:justify-end gap-2 pt-1 sm:pt-0">
                {isSelf ? (
                  <>
                    <button
                      onClick={() => setIsSettingsOpen(true)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <Settings className="w-4 h-4" />
                      <span>{t('edit_profile')}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: `${profileUser.firstName} on Marketly`,
                            url: window.location.href,
                          });
                        }
                      }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
                      title="Share Profile"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleFollowToggle}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isFollowing
                          ? 'bg-slate-800 text-slate-300 border border-slate-700'
                          : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow'
                      }`}
                    >
                      {isFollowing ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <UserPlus className="w-3.5 h-3.5" />}
                      <span>{isFollowing ? t('following') : t('follow')}</span>
                    </button>
                    <button
                      onClick={() => onStartChatWithUser(profileUser)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{t('message')}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Location */}
            <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-violet-400" />
              <span>{profileUser.city}, Pakistan</span>
            </p>

            {/* Bio & Description */}
            {profileUser.bio && (
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl">
                {profileUser.bio}
              </p>
            )}

            {/* Counters: Followers, Following, Likes */}
            <div className="flex items-center justify-center sm:justify-start gap-6 pt-3 border-t border-slate-800/80 text-xs">
              <div className="text-center sm:text-left rtl:sm:text-right">
                <span className="font-extrabold text-white text-sm block">
                  {followersCount.toLocaleString()}
                </span>
                <span className="text-slate-400 text-[11px]">{t('followers')}</span>
              </div>
              <div className="text-center sm:text-left rtl:sm:text-right">
                <span className="font-extrabold text-white text-sm block">
                  {(profileUser.followingCount || 0).toLocaleString()}
                </span>
                <span className="text-slate-400 text-[11px]">{t('following')}</span>
              </div>
              <div className="text-center sm:text-left rtl:sm:text-right">
                <span className="font-extrabold text-white text-sm block">
                  {(profileUser.likesCount || 0).toLocaleString()}
                </span>
                <span className="text-slate-400 text-[11px]">{t('likes')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROLE-BASED PROFILE TABS */}
      <div className="flex items-center justify-center gap-2 mb-6 border-b border-slate-800 pb-3">
        {availableTabs.map((tab) => {
          const isActive = activeTab === tab;
          const label = tab === 'seller' ? t('tab_seller') : tab === 'buyer' ? t('tab_buyer') : t('tab_social');
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              {tab === 'seller' ? <Store className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* CONTENT: SELLER PRODUCTS & LISTINGS */}
      {activeTab === 'seller' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-violet-400" />
              <span>Products & Inventory ({products.length})</span>
            </h3>
            {isSelf && (
              <button
                onClick={() => onNavigate('seller_center')}
                className="text-xs text-violet-400 hover:text-violet-300 font-bold"
              >
                Open Seller Center →
              </button>
            )}
          </div>

          {products.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800/60 text-xs text-slate-400 space-y-2">
              <Store className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-bold text-slate-300">No products listed</p>
              <p>Products will appear here once published in Seller Center.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden hover:border-violet-500/50 transition-all group flex flex-col justify-between shadow-lg"
                >
                  <div className="relative aspect-video bg-slate-800 overflow-hidden">
                    <img
                      src={p.mediaUrls[0]}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {p.discount > 0 && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-bold shadow">
                        -{p.discount}%
                      </span>
                    )}
                    {p.freeDelivery && (
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-emerald-600/90 text-white text-[10px] font-bold flex items-center gap-1 shadow">
                        <Truck className="w-3 h-3" /> Free Delivery
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-2.5">
                    <div>
                      <p className="font-bold text-sm text-white truncate">{p.name}</p>
                      <p className="text-xs text-slate-400 line-clamp-1">{p.description}</p>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-base font-black text-violet-300">
                          Rs. {p.finalPrice.toLocaleString()}
                        </span>
                        {p.discount > 0 && (
                          <span className="text-xs text-slate-400 line-through ml-2">
                            Rs. {p.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{p.sellerCity}</span>
                    </div>

                    <button
                      onClick={() => onOrderNow(p.id)}
                      className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{t('order_now')} (COD)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTENT: SOCIAL POSTS */}
      {activeTab === 'social' && (
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-white">Social Posts ({posts.length})</h3>
          {posts.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800/60 text-xs text-slate-400 space-y-2">
              <Grid className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-bold text-slate-300">No social posts published</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-slate-800 group cursor-pointer border border-slate-800"
                >
                  <img
                    src={post.mediaUrl}
                    alt={post.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-xs font-bold">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 fill-white" /> {post.likesCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          currentUser={currentUser}
          onClose={() => setIsSettingsOpen(false)}
          onUserUpdated={(updated) => {
            onUserUpdated(updated);
            setProfileUser(updated);
          }}
          onLogout={onLogout}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};
