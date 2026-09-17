import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { User, Post, Product } from '../../types';
import { api } from '../../services/api';
import { StatusStoriesStrip } from '../status/StatusStoriesStrip';
import { StatusViewerModal } from '../status/StatusViewerModal';
import { MarketlyPulse } from './MarketlyPulse';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  ShoppingBag,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Film,
  Image as ImageIcon,
  Sparkles,
  Store,
  Users,
  Layers,
  Send,
  X,
  Clock,
  ShieldCheck,
  CheckCircle2
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
  const { t, language } = useI18n();

  // Role audience filter: All, Seller, Social (NO BUYER!)
  const [activeTab, setActiveTab] = useState<'all' | 'seller' | 'social'>('all');

  // Media filter: All in one, Photos only, or Videos only!
  const [mediaFilter, setMediaFilter] = useState<'all' | 'photo' | 'video'>('all');

  const [posts, setPosts] = useState<Post[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Status Story Viewer state
  const [activeViewerStatus, setActiveViewerStatus] = useState<any | null>(null);
  const [allStoryStatuses, setAllStoryStatuses] = useState<any[]>([]);

  // Active commenting post
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Audio mute state across feed videos
  const [isMuted, setIsMuted] = useState(true);

  // Fetch feed posts
  const loadFeed = async () => {
    setLoading(true);
    try {
      const [feedRes, prodRes] = await Promise.all([
        api.getFeed(currentUser.role, activeTab === 'all' ? undefined : activeTab),
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
            savesCount: Math.max(0, p.savesCount + (nextSaved ? 1 : -1)),
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

  // Filter posts by media type
  const filteredPosts = posts.filter((post) => {
    if (mediaFilter === 'photo') return post.mediaType === 'photo';
    if (mediaFilter === 'video') return post.mediaType === 'video';
    return true; // 'all' displays both photo and video together!
  });

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

      {/* Unified Feed Navigation & Filter Bar */}
      <div className="mb-4 pb-2 border-b border-slate-800/80 sticky top-14 bg-slate-950/90 backdrop-blur-md z-20 py-2 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Channel Tabs: ALL, SELLER, SOCIAL (No BUYER!) */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'تمام پوسٹس' : 'All'}</span>
            </button>

            <button
              onClick={() => setActiveTab('seller')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'seller'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'سیلر اسٹورز' : 'Sellers'}</span>
            </button>

            <button
              onClick={() => setActiveTab('social')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'social'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'سوشل' : 'Social'}</span>
            </button>
          </div>

          {/* Media Type Chooser: All in one, Photos, or Videos */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setMediaFilter('all')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                mediaFilter === 'all'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="All Media (Photos & Videos)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'سبھی' : 'All Media'}</span>
            </button>
            <button
              onClick={() => setMediaFilter('photo')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                mediaFilter === 'photo'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Photos only"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'فوٹوز' : 'Photos'}</span>
            </button>
            <button
              onClick={() => setMediaFilter('video')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                mediaFilter === 'video'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Videos only"
            >
              <Film className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'ویڈیوز' : 'Videos'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* FEED CONTENT STREAM */}
      {loading && (
        <div className="py-20 text-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p>{t('loading') || 'Loading feed...'}</p>
        </div>
      )}

      {!loading && filteredPosts.length === 0 && (
        <div className="py-16 text-center bg-slate-900/40 rounded-3xl border border-slate-800/60 p-8 space-y-3">
          <Sparkles className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="font-bold text-slate-300">No posts found in this section</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Be the first to share a photo, video, or product in this stream!
          </p>
          {onOpenCreatePost && (
            <button
              onClick={onOpenCreatePost}
              className="mt-2 px-4 py-2 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg"
            >
              Create Post
            </button>
          )}
        </div>
      )}

      {!loading && filteredPosts.length > 0 && (
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted((prev) => !prev)}
              onLike={() => handleLike(post.id)}
              onSave={() => handleSave(post.id)}
              onOpenComments={() => setCommentPostId(post.id)}
              onOrderNow={onOrderNow}
              onViewProfile={onViewProfile}
            />
          ))}
        </div>
      )}

      {/* Comments Drawer / Modal */}
      {commentPostId && activeCommentPost && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-violet-400" />
                <h3 className="font-bold text-sm text-white">
                  Comments ({activeCommentPost.commentsCount || 0})
                </h3>
              </div>
              <button
                onClick={() => setCommentPostId(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comment List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 min-h-[160px]">
              {(!activeCommentPost.comments || activeCommentPost.comments.length === 0) && (
                <p className="text-center text-slate-500 text-xs py-8">
                  No comments yet. Start the conversation!
                </p>
              )}
              {activeCommentPost.comments?.map((c) => (
                <div key={c.id} className="flex gap-2.5 items-start">
                  <img
                    src={c.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={c.authorName}
                    className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                  />
                  <div className="bg-slate-800/80 rounded-2xl px-3.5 py-2 flex-1">
                    <p className="font-bold text-xs text-white">{c.authorName}</p>
                    <p className="text-xs text-slate-200 mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment Input */}
            <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment(activeCommentPost.id)}
                placeholder="Write a comment..."
                className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500"
              />
              <button
                onClick={() => handleAddComment(activeCommentPost.id)}
                disabled={!commentText.trim()}
                className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Story Viewer */}
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

// ==========================================
// UNIFIED POST CARD (Supports Photo & Video seamlessly!)
// ==========================================
interface PostCardProps {
  post: Post;
  currentUser: User;
  isMuted: boolean;
  onToggleMute: () => void;
  onLike: () => void;
  onSave: () => void;
  onOpenComments: () => void;
  onOrderNow: (productId: string) => void;
  onViewProfile: (userId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  isMuted,
  onToggleMute,
  onLike,
  onSave,
  onOpenComments,
  onOrderNow,
  onViewProfile,
}) => {
  const isVideo = post.mediaType === 'video';
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  return (
    <article className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:border-slate-700/80 transition-all">
      {/* Post Author Header */}
      <div className="p-4 flex items-center justify-between">
        <div
          onClick={() => onViewProfile(post.authorId)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative">
            <img
              src={post.authorAvatar}
              alt={post.authorName}
              className="w-10 h-10 rounded-2xl object-cover border border-slate-700 group-hover:border-violet-500 transition-colors"
            />
            {post.authorRole === 'SELLER' && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-violet-600 text-white flex items-center justify-center text-[9px] font-bold">
                ✓
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-sm text-white group-hover:text-violet-400 transition-colors">
                {post.authorName}
              </h4>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                {post.contentType}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              @{post.authorUsername} • {post.authorCity}
            </p>
          </div>
        </div>

        {/* Media indicator badge */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-400 text-[11px] font-semibold border border-slate-700/60">
          {isVideo ? (
            <>
              <Film className="w-3 h-3 text-violet-400" />
              <span>Video</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-3 h-3 text-sky-400" />
              <span>Photo</span>
            </>
          )}
        </div>
      </div>

      {/* Media Player Area (Unified Photo or Video) */}
      <div className="relative bg-black w-full aspect-[4/3] sm:aspect-[16/10] overflow-hidden flex items-center justify-center">
        {isVideo ? (
          <div className="relative w-full h-full group" onClick={togglePlay}>
            <video
              ref={videoRef}
              src={post.mediaUrl}
              loop
              playsInline
              muted={isMuted}
              className="w-full h-full object-contain cursor-pointer"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* Play/Pause Overlay Button */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-violet-600/90 text-white flex items-center justify-center shadow-xl backdrop-blur-sm">
                  <Play className="w-6 h-6 fill-current translate-x-0.5" />
                </div>
              </div>
            )}

            {/* Audio Mute/Unmute Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
              }}
              className="absolute bottom-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-colors z-10"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          <img
            src={post.mediaUrl}
            alt={post.caption || 'Post image'}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Post Actions & Metrics */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onLike}
              className={`flex items-center gap-1.5 text-xs font-bold transition-all ${
                post.isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
              <span>{post.likesCount || 0}</span>
            </button>

            <button
              onClick={onOpenComments}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{post.commentsCount || 0}</span>
            </button>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: post.caption, url: window.location.href });
                }
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-all"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onSave}
            className={`p-1.5 rounded-lg transition-colors ${
              post.isSaved ? 'text-violet-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${post.isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-xs text-slate-200 leading-relaxed">
            <span className="font-bold text-white mr-1.5">@{post.authorUsername}</span>
            {post.caption}
          </p>
        )}

        {/* Product Context Card (If attached to a seller product) */}
        {post.productContext && (
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 mt-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={post.productContext.productImage}
                alt={post.productContext.productName}
                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-700"
              />
              <div className="min-w-0">
                <p className="font-bold text-xs text-white truncate">
                  {post.productContext.productName}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-extrabold text-violet-400">
                    Rs. {post.productContext.finalPrice?.toLocaleString()}
                  </span>
                  {post.productContext.freeDelivery && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Free Delivery
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => onOrderNow(post.productContext!.productId)}
              className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold shadow-md shrink-0 flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>ORDER NOW</span>
            </button>
          </div>
        )}
      </div>
    </article>
  );
};
