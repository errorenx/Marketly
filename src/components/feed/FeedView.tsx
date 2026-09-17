import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { Post, User, Product, UserRole, UserStatus } from '../../types';
import { api } from '../../services/api';
import { MarketlyPulse } from './MarketlyPulse';
import { StatusStoriesStrip } from '../status/StatusStoriesStrip';
import { StatusViewerModal } from '../status/StatusViewerModal';
import { VideoFeed } from './VideoFeed';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  ShoppingBag,
  ShieldCheck,
  Truck,
  MapPin,
  Eye,
  Film,
  LayoutGrid,
  Sparkles,
  Send,
  Plus,
} from 'lucide-react';

interface FeedViewProps {
  currentUser: User;
  onOrderNow: (productId: string) => void;
  onViewProfile: (userId: string) => void;
  onOpenCreatePost?: () => void;
  onOpenCreateStatus?: () => void;
  onNavigate?: (tab: string) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  currentUser,
  onOrderNow,
  onViewProfile,
  onOpenCreatePost,
  onOpenCreateStatus,
  onNavigate,
}) => {
  const { t } = useI18n();

  // Role tab configuration:
  // - Seller sees: BUYER, SELLER, SOCIAL
  // - Buyer sees: SELLER, BUYER, SOCIAL
  // - Social sees: SELLER, SOCIAL (BUYER forbidden!)
  const getTabsForRole = (role: UserRole) => {
    if (role === 'SELLER') return ['buyer', 'seller', 'social'];
    if (role === 'BUYER') return ['seller', 'buyer', 'social'];
    return ['seller', 'social']; // Social user
  };

  const availableTabs = getTabsForRole(currentUser.role);
  const [activeTab, setActiveTab] = useState<string>(availableTabs[0]);
  const [viewMode, setViewMode] = useState<'cards' | 'reels'>('cards');
  const [posts, setPosts] = useState<Post[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Status Story Viewer state
  const [activeViewerStatus, setActiveViewerStatus] = useState<UserStatus | null>(null);
  const [allStoryStatuses, setAllStoryStatuses] = useState<UserStatus[]>([]);

  // Active commenting post
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Fetch feed posts
  const loadFeed = async () => {
    setLoading(true);
    try {
      const [feedRes, prodRes] = await Promise.all([
        api.getFeed(currentUser.role, activeTab),
        api.getProducts(),
      ]);
      setPosts(feedRes.posts || []);
      setProducts(prodRes.products || []);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [activeTab, currentUser.role]);

  const handleLike = async (postId: string) => {
    try {
      const res = await api.likePost(postId, currentUser.id);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return { ...p, isLiked: res.isLiked, likesCount: res.likesCount };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleSave = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextSaved = !p.isSaved;
          return {
            ...p,
            isSaved: nextSaved,
            savesCount: p.savesCount + (nextSaved ? 1 : -1),
          };
        }
        return p;
      })
    );
  };

  const handleAddComment = async (postId: string) => {
    if (!commentText.trim()) return;
    try {
      const res = await api.addComment(postId, currentUser.id, commentText);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              commentsCount: res.commentsCount,
              comments: [...(p.comments || []), res.comment],
            };
          }
          return p;
        })
      );
      setCommentText('');
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const activeCommentPost = posts.find((p) => p.id === commentPostId);

  return (
    <div className="w-full max-w-3xl mx-auto pb-24 pt-2 px-3 sm:px-4">
      {/* 24-Hour Stories & Status Strip */}
      <StatusStoriesStrip
        currentUser={currentUser}
        onOpenCreateStatus={() => {
          if (onOpenCreateStatus) onOpenCreateStatus();
          else if (onOpenCreatePost) onOpenCreatePost();
        }}
        onOpenStatusViewer={(status, all) => {
          setActiveViewerStatus(status);
          setAllStoryStatuses(all);
        }}
      />

      {/* Marketly Pulse Section */}
      <MarketlyPulse
        products={products}
        onSelectProduct={(p) => onOrderNow(p.id)}
        onSelectSeller={(sId) => onViewProfile(sId)}
      />

      {/* Tabs & View Mode Switcher Header */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-800/80 sticky top-14 bg-slate-950/90 backdrop-blur-md z-20 py-2">
        {/* Role Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
          {availableTabs.map((tab) => {
            const labelKey =
              tab === 'seller' ? 'tab_seller' : tab === 'buyer' ? 'tab_buyer' : 'tab_social';
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-900/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t(labelKey as any)}
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle: Cards vs Vertical Video Feed */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-xl transition-colors ${
              viewMode === 'cards'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Card Feed"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('reels')}
            className={`p-1.5 rounded-xl transition-colors ${
              viewMode === 'reels'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Vertical Video Feed (TikTok-like)"
          >
            <Film className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* VIEW MODE: VERTICAL VIDEO FEED (ONE VIDEO AT A TIME) */}
      {viewMode === 'reels' && (
        <VideoFeed
          currentUser={currentUser}
          onOrderNow={onOrderNow}
          onViewProfile={onViewProfile}
        />
      )}

      {/* VIEW MODE: CARDS */}
      {viewMode === 'cards' && (
        <>
          {loading && (
            <div className="py-20 text-center text-slate-400 text-sm">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p>{t('loading')}</p>
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="py-20 text-center bg-slate-900/40 rounded-3xl border border-slate-800/60 p-8">
              <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-300">No posts in this feed yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Be the first to publish or check another tab!
              </p>
            </div>
          )}

          {!loading && (
            <div className="space-y-6">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-slate-900/80 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl hover:border-slate-700/80 transition-all"
                >
                  {/* 1. [ User / Profile Information ] */}
                  <div className="p-4 flex items-center justify-between border-b border-slate-800/40">
                    <div
                      onClick={() => onViewProfile(post.authorId)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <img
                        src={post.authorAvatar}
                        alt={post.authorUsername}
                        className="w-10 h-10 rounded-full object-cover border border-slate-700 group-hover:border-violet-500 transition-colors"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-sm text-white group-hover:text-violet-300 transition-colors">
                            {post.authorName}
                          </p>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {post.contentType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <span>@{post.authorUsername}</span>
                          <span>•</span>
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{post.authorCity}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. [ PHOTO or VIDEO ] */}
                  <div className="relative w-full max-h-[500px] overflow-hidden bg-black flex items-center justify-center">
                    {post.mediaType === 'video' ? (
                      <video
                        src={post.mediaUrl}
                        controls
                        playsInline
                        className="w-full max-h-[500px] object-contain"
                        poster={post.productContext?.productImage}
                      />
                    ) : (
                      <img
                        src={post.mediaUrl}
                        alt={post.caption}
                        className="w-full max-h-[500px] object-cover"
                        loading="lazy"
                      />
                    )}

                    {/* Integrated Product COD Badge overlay on media if seller post */}
                    {post.productContext && (
                      <div className="absolute bottom-3 left-3 right-3 p-3 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-violet-500/40 shadow-2xl flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-xs text-white truncate">
                              {post.productContext.productName}
                            </p>
                            {post.productContext.freeDelivery && (
                              <span className="shrink-0 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">
                                {t('free_delivery')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs">
                            <span className="font-black text-violet-300">
                              Rs. {post.productContext.finalPrice.toLocaleString()}
                            </span>
                            {post.productContext.productDiscount && (
                              <span className="text-[10px] text-slate-400 line-through">
                                Rs. {post.productContext.productPrice.toLocaleString()}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              {post.productContext.sellerCity}
                            </span>
                          </div>
                        </div>

                        {/* ORDER NOW button */}
                        <button
                          type="button"
                          onClick={() => onOrderNow(post.productContext!.productId)}
                          className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-violet-600/40 transition-all flex items-center gap-1.5 active:scale-95"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{t('order_now')}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 3. [ User's description/caption ] — STRICTLY RENDERED BELOW MEDIA */}
                  <div className="p-4 space-y-2.5 border-b border-slate-800/40">
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      <span
                        onClick={() => onViewProfile(post.authorId)}
                        className="font-bold text-white mr-1.5 cursor-pointer hover:underline"
                      >
                        @{post.authorUsername}
                      </span>
                      {post.caption}
                    </p>

                    {post.contentType === 'seller' && (
                      <p className="text-[11px] text-emerald-400/90 flex items-center gap-1 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>All orders verified via Cash on Delivery (COD) in chat.</span>
                      </p>
                    )}
                  </div>

                  {/* 4. [ Like ] [ Comment ] [ Save ] [ Share ] */}
                  <div className="px-4 py-3 bg-slate-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                          post.isLiked ? 'text-rose-500' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-rose-500' : ''}`} />
                        <span>{post.likesCount}</span>
                      </button>

                      <button
                        onClick={() => setCommentPostId(post.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span>{post.commentsCount}</span>
                      </button>

                      <button
                        onClick={() => handleSave(post.id)}
                        className={`text-xs font-semibold transition-colors ${
                          post.isSaved ? 'text-violet-400' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <Bookmark
                          className={`w-5 h-5 ${post.isSaved ? 'fill-violet-400' : ''}`}
                        />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: post.authorName,
                            text: post.caption,
                            url: window.location.href,
                          }).catch(() => {});
                        }
                      }}
                      className="text-slate-300 hover:text-white transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Comment input expander */}
                  {commentPostId === post.id && (
                    <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-3">
                      {/* Existing comments */}
                      {(post.comments || []).length > 0 && (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {post.comments?.map((c) => (
                            <div key={c.id} className="text-xs">
                              <span className="font-bold text-white mr-1.5">
                                {c.authorUsername}:
                              </span>
                              <span className="text-slate-300">{c.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Write a comment..."
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-full px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddComment(post.id);
                          }}
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          disabled={!commentText.trim()}
                          className="p-1.5 rounded-full bg-violet-600 text-white disabled:opacity-40"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* Story Viewer Modal if open */}
      {activeViewerStatus && (
        <StatusViewerModal
          initialStatus={activeViewerStatus}
          allStatuses={allStoryStatuses}
          currentUser={currentUser}
          onClose={() => setActiveViewerStatus(null)}
        />
      )}
    </div>
  );
};
