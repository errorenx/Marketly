import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { ChannelItem, ChannelPost, User } from '../../types';
import { api } from '../../services/api';
import {
  Radio,
  Bell,
  BellOff,
  Send,
  Sparkles,
  ShoppingBag,
  ArrowLeft,
  RefreshCw,
  Plus,
  Share2,
} from 'lucide-react';

interface ChannelViewProps {
  channel: ChannelItem;
  currentUser: User;
  onBack: () => void;
  onFollowToggled?: (isFollowing: boolean, newCount: number) => void;
}

const EMOJI_LIST = ['👍', '❤️', '🔥', '🚀', '👏', '🎉'];

export const ChannelView: React.FC<ChannelViewProps> = ({
  channel,
  currentUser,
  onBack,
  onFollowToggled,
}) => {
  const { t } = useI18n();
  const [posts, setPosts] = useState<ChannelPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(channel.isFollowing || false);
  const [followersCount, setFollowersCount] = useState(channel.followersCount || 0);

  // Broadcast post state (for channel owner/admins)
  const isChannelAdmin =
    channel.ownerId === currentUser.id || (channel.adminIds && channel.adminIds.includes(currentUser.id));
  const [broadcastText, setBroadcastText] = useState('');
  const [publishing, setPublishing] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await api.getChannelPosts(channel.id);
      if (Array.isArray(res?.posts)) {
        setPosts(res.posts);
      }
    } catch (err) {
      console.error('Error fetching channel posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [channel.id]);

  const handleToggleFollow = async () => {
    try {
      const res = await api.toggleFollowChannel(channel.id, currentUser.id);
      setIsFollowing(res.isFollowing);
      setFollowersCount(res.followersCount);
      if (onFollowToggled) {
        onFollowToggled(res.isFollowing, res.followersCount);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim() || publishing) return;
    setPublishing(true);
    try {
      const res = await api.broadcastChannelPost(channel.id, {
        authorId: currentUser.id,
        text: broadcastText.trim(),
      });
      if (res?.post) {
        setPosts((prev) => [res.post, ...prev]);
        setBroadcastText('');
      }
    } catch (err) {
      console.error('Error broadcasting to channel:', err);
    } finally {
      setPublishing(false);
    }
  };

  const handleReact = async (postId: string, emoji: string) => {
    try {
      const res = await api.reactChannelPost(channel.id, postId, emoji, currentUser.id);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              reactions: res.reactions,
              userReactions: {
                ...(p.userReactions || {}),
                [currentUser.id]: res.userReacted,
              },
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Error reacting to post:', err);
    }
  };

  const formatPostTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-900 overflow-hidden">
      {/* CHANNEL HEADER */}
      <div className="p-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white shrink-0"
            title="Back to channels"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <img
            src={channel.photo || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=100'}
            alt={channel.name}
            className="w-11 h-11 rounded-2xl object-cover border border-violet-500/30 shrink-0"
          />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-white truncate">{channel.name}</h3>
              <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-violet-600/20 text-violet-300 border border-violet-500/30 shrink-0">
                Channel
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {followersCount.toLocaleString()} {followersCount === 1 ? 'follower' : 'followers'} • By {channel.ownerName || 'Admin'}
            </p>
          </div>
        </div>

        {/* Follow / Following Button */}
        <button
          type="button"
          onClick={handleToggleFollow}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-md ${
            isFollowing
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-900/40'
          }`}
        >
          {isFollowing ? (
            <>
              <BellOff className="w-3.5 h-3.5" />
              <span>Following</span>
            </>
          ) : (
            <>
              <Bell className="w-3.5 h-3.5" />
              <span>Follow</span>
            </>
          )}
        </button>
      </div>

      {/* CHANNEL POSTS FEED */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 text-violet-400 animate-spin" />
            <span>Loading channel updates...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <Radio className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-bold text-slate-300">No broadcasts yet</p>
            <p className="text-slate-500 max-w-sm mx-auto">
              {isChannelAdmin
                ? 'Send your first broadcast update to all channel followers using the box below!'
                : 'Follow this channel to receive new announcements and deals right away.'}
            </p>
          </div>
        ) : (
          posts.map((post) => {
            const userReaction = post.userReactions?.[currentUser.id];

            return (
              <div
                key={post.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-md"
              >
                {/* Post Author Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={post.authorAvatar || channel.photo}
                      alt={post.authorName}
                      className="w-8 h-8 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <p className="font-bold text-xs text-white flex items-center gap-1">
                        <span>{post.authorName}</span>
                        <span className="text-[10px] text-violet-300 font-normal">• Channel Broadcast</span>
                      </p>
                      <p className="text-[10px] text-slate-400">{formatPostTime(post.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Text Content */}
                {post.text && (
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {post.text}
                  </p>
                )}

                {/* Attached Product Link if present */}
                {post.productName && (
                  <div className="p-3 bg-violet-950/30 border border-violet-800/40 rounded-xl flex items-center gap-3">
                    {post.productImage && (
                      <img
                        src={post.productImage}
                        alt={post.productName}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-white truncate">{post.productName}</p>
                      {post.productPrice && (
                        <p className="text-xs text-violet-300 font-bold">
                          Rs. {Number(post.productPrice).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Interactive Emoji Reactions Bar */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {EMOJI_LIST.map((emoji) => {
                      const count = post.reactions?.[emoji] || 0;
                      const hasReacted = userReaction === emoji;

                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleReact(post.id, emoji)}
                          className={`px-2 py-1 rounded-xl text-xs transition-all flex items-center gap-1 ${
                            hasReacted
                              ? 'bg-violet-600/30 border border-violet-500 text-white scale-105 shadow'
                              : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800'
                          }`}
                        >
                          <span>{emoji}</span>
                          {count > 0 && <span className="font-bold text-[11px]">{count}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* BROADCAST COMPOSER (Admins only) or FOLLOWER NOTICE */}
      {isChannelAdmin ? (
        <form
          onSubmit={handlePublishPost}
          className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={broadcastText}
            onChange={(e) => setBroadcastText(e.target.value)}
            placeholder="Broadcast an update or drop to followers..."
            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!broadcastText.trim() || publishing}
            className="p-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-2xl shadow-md transition-all flex items-center justify-center shrink-0"
            title="Broadcast"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-center text-[11px] text-slate-400">
          Only channel admins can post broadcasts. Followers can interact via emoji reactions.
        </div>
      )}
    </div>
  );
};
