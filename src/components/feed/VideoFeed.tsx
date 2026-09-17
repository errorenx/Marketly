import React, { useState, useEffect, useRef } from 'react';
import { Post, User } from '../../types';
import { api } from '../../services/api';
import { useI18n } from '../../i18n/I18nContext';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ShoppingBag,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Truck,
  ShieldCheck,
} from 'lucide-react';

interface VideoFeedProps {
  currentUser: User;
  onOrderNow: (productId: string) => void;
  onViewProfile: (userId: string) => void;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({
  currentUser,
  onOrderNow,
  onViewProfile,
}) => {
  const { t } = useI18n();
  const [videos, setVideos] = useState<Post[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');

  const currentVideoRef = useRef<HTMLVideoElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Fetch permitted videos via dedicated role-filtered endpoint
  const loadVideos = async () => {
    setLoading(true);
    try {
      const res = await api.getVideoFeed(currentUser.role);
      const list = res.videos || [];
      setVideos(list);
    } catch (err) {
      console.error('Error fetching video feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, [currentUser.role]);

  // Handle video change: play current, ensure previous is paused
  useEffect(() => {
    if (currentVideoRef.current) {
      currentVideoRef.current.currentTime = 0;
      currentVideoRef.current.play().catch(() => {
        // Autoplay policy fallback: mute and retry
        setIsMuted(true);
        if (currentVideoRef.current) {
          currentVideoRef.current.muted = true;
          currentVideoRef.current.play().catch(() => {});
        }
      });
      setIsPlaying(true);
    }

    // Cleanup on unmount
    return () => {
      if (currentVideoRef.current) {
        currentVideoRef.current.pause();
      }
    };
  }, [currentIndex, videos]);

  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Keyboard navigation for desktop: Up/Down arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, videos.length]);

  // Touch Swipe navigation for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const diffY = touchStartYRef.current - e.changedTouches[0].clientY;
    touchStartYRef.current = null;

    if (diffY > 50) {
      // Swiped UP -> Next video
      handleNext();
    } else if (diffY < -50) {
      // Swiped DOWN -> Previous video
      handlePrev();
    }
  };

  const togglePlayPause = () => {
    if (!currentVideoRef.current) return;
    if (isPlaying) {
      currentVideoRef.current.pause();
      setIsPlaying(false);
    } else {
      currentVideoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleLike = async (post: Post) => {
    const nextLiked = !post.isLiked;
    const nextCount = post.likesCount + (nextLiked ? 1 : -1);

    setVideos((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, isLiked: nextLiked, likesCount: Math.max(0, nextCount) } : p
      )
    );

    try {
      await api.likePost(post.id, currentUser.id);
    } catch (err) {
      console.error('Error liking video:', err);
    }
  };

  const handleSave = (postId: string) => {
    setVideos((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isSaved: !p.isSaved } : p))
    );
  };

  const handleAddComment = async (postId: string) => {
    if (!commentInput.trim()) return;
    const text = commentInput.trim();
    setCommentInput('');

    try {
      const res = await api.addComment(postId, currentUser.id, text);
      if (res.comment) {
        setVideos((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  commentsCount: p.commentsCount + 1,
                  comments: [...(p.comments || []), res.comment],
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const activeVideo = videos[currentIndex];

  if (loading) {
    return (
      <div className="w-full h-[650px] flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <p className="text-xs font-semibold">Loading vertical video feed...</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="w-full py-20 px-6 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
        <Sparkles className="w-10 h-10 text-violet-400 mx-auto" />
        <h3 className="font-bold text-base text-white">No Videos Available</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          No vertical videos matching your role permission ({currentUser.role}) found. Tap
          CREATE to publish the first video!
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto flex flex-col items-center select-none">
      {/* Video Viewport Container (TikTok-like vertical card) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full aspect-[9/16] max-h-[calc(100vh-140px)] min-h-[560px] bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 group"
      >
        {/* The single active HTML5 video */}
        <video
          ref={currentVideoRef}
          src={activeVideo.mediaUrl}
          autoPlay
          loop
          playsInline
          muted={isMuted}
          onClick={togglePlayPause}
          className="w-full h-full object-cover cursor-pointer"
        />

        {/* Play/Pause center overlay when paused */}
        {!isPlaying && (
          <div
            onClick={togglePlayPause}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-[2px] cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-black/60 text-white flex items-center justify-center border border-white/20 shadow-xl">
              <Play className="w-8 h-8 fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Top Floating Controls */}
        <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border backdrop-blur-md shadow ${
                activeVideo.contentType === 'seller'
                  ? 'bg-violet-600/80 text-white border-violet-400/40'
                  : activeVideo.contentType === 'buyer'
                  ? 'bg-indigo-600/80 text-white border-indigo-400/40'
                  : 'bg-slate-800/80 text-slate-200 border-slate-600/40'
              }`}
            >
              {activeVideo.contentType}
            </span>
            <span className="text-[11px] font-bold text-white/90 bg-black/40 px-2 py-1 rounded-full backdrop-blur-md">
              {currentIndex + 1} / {videos.length}
            </span>
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2.5 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-colors shadow-lg border border-white/10"
            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Right Floating Vertical Action Bar */}
        <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-4">
          {/* Author Profile Picture */}
          <div
            onClick={() => onViewProfile(activeVideo.authorId)}
            className="relative cursor-pointer group"
          >
            <img
              src={activeVideo.authorAvatar}
              alt={activeVideo.authorName}
              className="w-11 h-11 rounded-full object-cover border-2 border-violet-500 shadow-md group-hover:scale-105 transition-transform"
            />
          </div>

          {/* Like Button */}
          <button
            onClick={() => handleLike(activeVideo)}
            className="flex flex-col items-center gap-1 group"
          >
            <div
              className={`p-3 rounded-full backdrop-blur-md transition-all ${
                activeVideo.isLiked
                  ? 'bg-rose-600/90 text-white scale-110 shadow-lg shadow-rose-900/50'
                  : 'bg-black/50 text-white hover:bg-black/70 border border-white/10'
              }`}
            >
              <Heart
                className={`w-5 h-5 ${activeVideo.isLiked ? 'fill-white' : ''}`}
              />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow">
              {activeVideo.likesCount}
            </span>
          </button>

          {/* Comment Button */}
          <button
            onClick={() =>
              setActiveCommentsPostId(
                activeCommentsPostId === activeVideo.id ? null : activeVideo.id
              )
            }
            className="flex flex-col items-center gap-1 group"
          >
            <div className="p-3 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border border-white/10 transition-colors">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow">
              {activeVideo.commentsCount}
            </span>
          </button>

          {/* Save Button */}
          <button
            onClick={() => handleSave(activeVideo.id)}
            className="flex flex-col items-center gap-1 group"
          >
            <div
              className={`p-3 rounded-full backdrop-blur-md transition-colors ${
                activeVideo.isSaved
                  ? 'bg-amber-500 text-white'
                  : 'bg-black/50 hover:bg-black/70 text-white border border-white/10'
              }`}
            >
              <Bookmark
                className={`w-5 h-5 ${activeVideo.isSaved ? 'fill-white' : ''}`}
              />
            </div>
          </button>

          {/* Share Button */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Marketly Video',
                  text: activeVideo.caption,
                  url: window.location.href,
                }).catch(() => {});
              }
            }}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="p-3 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border border-white/10 transition-colors">
              <Share2 className="w-5 h-5" />
            </div>
          </button>
        </div>

        {/* Bottom Profile Info, Description (Strictly BELOW/within bottom overlay) & Product context */}
        <div className="absolute inset-x-0 bottom-0 z-20 p-4 pt-12 bg-gradient-to-t from-black via-black/70 to-transparent space-y-2.5">
          {/* Author Name and Handle */}
          <div
            onClick={() => onViewProfile(activeVideo.authorId)}
            className="flex items-center gap-2 cursor-pointer w-fit"
          >
            <span className="font-extrabold text-sm text-white drop-shadow hover:underline">
              {activeVideo.authorName}
            </span>
            <span className="text-xs text-slate-300">@{activeVideo.authorUsername}</span>
            <span className="text-[10px] text-slate-400">• {activeVideo.authorCity}</span>
          </div>

          {/* Description/Caption rendered underneath author info and below media */}
          <p className="text-xs text-slate-100 font-medium line-clamp-3 drop-shadow leading-relaxed">
            {activeVideo.caption}
          </p>

          {/* Product context with Cash on Delivery & ORDER NOW button */}
          {activeVideo.contentType === 'seller' && activeVideo.productContext && (
            <div className="bg-slate-900/90 border border-violet-500/40 rounded-2xl p-2.5 flex items-center justify-between gap-3 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={activeVideo.productContext.productImage}
                  alt={activeVideo.productContext.productName}
                  className="w-10 h-10 rounded-xl object-cover border border-violet-500/30 shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-bold text-xs text-white truncate">
                    {activeVideo.productContext.productName}
                  </p>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-black text-violet-300">
                      Rs. {activeVideo.productContext.finalPrice.toLocaleString()}
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                      <Truck className="w-3 h-3" /> COD
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOrderNow(activeVideo.productContext!.productId)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs shrink-0 shadow transition-all flex items-center gap-1 active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{t('order_now')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Slide-over Comments Drawer */}
        {activeCommentsPostId === activeVideo.id && (
          <div
            className="absolute inset-x-0 bottom-0 h-[60%] bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 rounded-t-3xl p-4 z-30 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-bold text-xs text-white">
                Comments ({activeVideo.comments?.length || 0})
              </h4>
              <button
                onClick={() => setActiveCommentsPostId(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {(activeVideo.comments || []).length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  No comments yet. Be the first to share your thoughts!
                </p>
              ) : (
                activeVideo.comments?.map((c) => (
                  <div key={c.id} className="text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-300">
                      <span>{c.authorName}</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        @{c.authorUsername}
                      </span>
                    </div>
                    <p className="text-slate-200">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-full px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddComment(activeVideo.id);
                }}
              />
              <button
                onClick={() => handleAddComment(activeVideo.id)}
                disabled={!commentInput.trim()}
                className="px-3 py-1.5 rounded-full bg-violet-600 text-white text-xs font-bold disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Navigation Floating Arrows */}
      <div className="hidden sm:flex items-center gap-3 mt-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-violet-500/50 disabled:opacity-40 transition-all shadow"
        >
          <ChevronUp className="w-4 h-4" />
          <span>Previous Video</span>
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === videos.length - 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-violet-500/50 disabled:opacity-40 transition-all shadow"
        >
          <span>Next Video</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
