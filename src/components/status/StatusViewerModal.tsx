import React, { useState, useEffect, useRef } from 'react';
import { User, UserStatus } from '../../types';
import { api } from '../../services/api';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Volume2,
  VolumeX,
  Send,
  Clock,
  Heart,
  Flame,
  ThumbsUp,
  Smile,
} from 'lucide-react';

interface StatusViewerModalProps {
  initialStatus: UserStatus;
  allStatuses: UserStatus[];
  currentUser: User;
  onClose: () => void;
  onReplySent?: (recipientId: string, message: string) => void;
}

export const StatusViewerModal: React.FC<StatusViewerModalProps> = ({
  initialStatus,
  allStatuses,
  currentUser,
  onClose,
  onReplySent,
}) => {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = allStatuses.findIndex((s) => s.id === initialStatus.id);
    return idx !== -1 ? idx : 0;
  });

  const currentStatus = allStatuses[currentIndex] || initialStatus;
  const isOwner = currentStatus.userId === currentUser.id;

  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [reactionsList, setReactionsList] = useState(currentStatus.reactions || []);
  const [viewersList, setViewersList] = useState(currentStatus.views || []);
  const [floatingReaction, setFloatingReaction] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const DURATION_MS = 6000; // 6 seconds for photo status auto-advance

  // Mark viewed on load
  useEffect(() => {
    if (!currentStatus) return;
    api.viewStatus(currentStatus.id, currentUser.id).then((res) => {
      if (res.views) setViewersList(res.views);
    }).catch(console.error);

    setProgress(0);
  }, [currentIndex, currentStatus?.id]);

  // Progress timer for auto-advancing
  useEffect(() => {
    if (isPaused) return;

    if (currentStatus.type === 'video') {
      // Handled via onTimeUpdate in video element
      return;
    }

    const interval = 50;
    const step = (interval / DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, currentStatus.type]);

  const handleNext = () => {
    if (currentIndex < allStatuses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  const handleSendReaction = async (emoji: string) => {
    setFloatingReaction(emoji);
    setTimeout(() => setFloatingReaction(null), 1200);

    try {
      const res = await api.reactStatus(currentStatus.id, currentUser.id, emoji);
      if (res.reactions) {
        setReactionsList(res.reactions);
      }
    } catch (err) {
      console.error('Error sending reaction:', err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const text = replyText.trim();
    setReplyText('');

    if (onReplySent) {
      onReplySent(currentStatus.userId, `[Replied to Status story] ${text}`);
    } else {
      // Send message directly to author
      try {
        const convId = `conv_${currentStatus.userId}_${currentUser.id}`;
        await api.sendMessage(convId, {
          senderId: currentUser.id,
          recipientId: currentStatus.userId,
          text: `[Story Reply] ${text}`,
        });
      } catch (err) {
        console.error('Error replying to status:', err);
      }
    }
    setFloatingReaction('💬 Sent');
    setTimeout(() => setFloatingReaction(null), 1500);
  };

  // Calculate hours remaining until expiration
  const expiresAt = new Date(currentStatus.expiresAt).getTime();
  const hoursLeft = Math.max(0, Math.round((expiresAt - Date.now()) / (1000 * 60 * 60)));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center select-none"
      onClick={() => setIsPaused(!isPaused)}
    >
      {/* Floating Reaction Animation */}
      {floatingReaction && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-5xl font-black text-white animate-bounce pointer-events-none drop-shadow-2xl bg-black/60 px-6 py-3 rounded-full border border-violet-500/40">
          {floatingReaction}
        </div>
      )}

      {/* Main Story Container (9:16 mobile aspect ratio max width) */}
      <div
        className="relative w-full max-w-md h-full sm:h-[90vh] sm:rounded-3xl overflow-hidden bg-slate-950 flex flex-col justify-between shadow-2xl border border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Segmented Progress Bars */}
        <div className="absolute top-3 inset-x-3 z-30 flex items-center gap-1.5">
          {allStatuses.map((st, idx) => (
            <div
              key={st.id}
              className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden backdrop-blur-sm"
            >
              <div
                className="h-full bg-white transition-all duration-75 ease-linear"
                style={{
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Top Header Information */}
        <div className="absolute top-7 inset-x-4 z-30 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2.5">
            <img
              src={currentStatus.userAvatar}
              alt={currentStatus.userName}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-violet-500 shadow-md"
            />
            <div>
              <p className="font-black text-sm text-white drop-shadow-md">
                {currentStatus.userName}
              </p>
              <p className="text-[11px] text-white/80 drop-shadow flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Expires in {hoursLeft}h</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentStatus.type === 'video' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Touch zones & Side Buttons */}
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-all disabled:opacity-0"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-all"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Media Display Area */}
        <div
          className="w-full h-full flex items-center justify-center bg-black relative"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {currentStatus.type === 'video' ? (
            <video
              ref={videoRef}
              src={currentStatus.mediaUrl}
              autoPlay
              playsInline
              muted={isMuted}
              className="w-full h-full object-contain"
              onTimeUpdate={(e) => {
                const target = e.currentTarget;
                if (target.duration) {
                  setProgress((target.currentTime / target.duration) * 100);
                }
              }}
              onEnded={handleNext}
            />
          ) : currentStatus.mediaUrl ? (
            <img
              src={currentStatus.mediaUrl}
              alt="Status Story"
              className="w-full h-full object-contain"
            />
          ) : (
            <div
              className={`w-full h-full p-8 flex items-center justify-center text-center text-xl font-bold text-white bg-gradient-to-tr ${
                currentStatus.bgGradient || 'from-violet-600 to-indigo-800'
              }`}
            >
              <p className="max-w-xs">{currentStatus.content}</p>
            </div>
          )}

          {/* Optional Caption Overlay */}
          {currentStatus.caption && (
            <div className="absolute bottom-20 inset-x-4 z-20 text-center">
              <div className="inline-block px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md text-white font-semibold text-sm max-w-sm shadow-lg border border-white/10">
                {currentStatus.caption}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="absolute bottom-3 inset-x-4 z-30">
          {isOwner ? (
            /* Author's View: Viewers list button */
            <div className="flex items-center justify-between bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowViewersSheet(!showViewersSheet);
                }}
                className="flex items-center gap-2 text-white text-xs font-bold hover:text-violet-300"
              >
                <Eye className="w-4 h-4 text-violet-400" />
                <span>Seen by {viewersList.length} people</span>
              </button>

              <div className="flex items-center gap-1">
                {reactionsList.slice(-4).map((r, i) => (
                  <span key={i} className="text-sm">
                    {r.emoji}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            /* Viewer's View: Emoji reactions & Direct reply */
            <div className="space-y-2">
              <div className="flex items-center justify-around bg-black/40 backdrop-blur-md py-1.5 px-3 rounded-full border border-white/10">
                {['🔥', '❤️', '👏', '😂', '💯', '😮'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendReaction(emoji);
                    }}
                    className="text-xl hover:scale-125 active:scale-95 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendReply} className="flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => setIsPaused(true)}
                  onBlur={() => setIsPaused(false)}
                  placeholder={`Reply to ${currentStatus.userName.split(' ')[0]}...`}
                  className="flex-1 bg-black/60 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-violet-400"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="p-2 rounded-full bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Viewers Sheet for Status Author */}
        {showViewersSheet && isOwner && (
          <div
            className="absolute inset-x-0 bottom-0 max-h-[60%] bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 rounded-t-3xl p-5 z-40 overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-violet-400" />
                <span>Story Viewers ({viewersList.length})</span>
              </h4>
              <button
                onClick={() => setShowViewersSheet(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Close
              </button>
            </div>

            {viewersList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No one has viewed this status yet.
              </p>
            ) : (
              <div className="space-y-3">
                {viewersList.map((v, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={v.userAvatar}
                        alt={v.userName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="font-bold text-white">{v.userName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(v.viewedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
