import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { UserStatus, User } from '../../types';
import { api } from '../../services/api';
import { X, Heart, Eye, Sparkles, Send } from 'lucide-react';

interface StatusViewerModalProps {
  status: UserStatus;
  currentUser: User;
  onClose: () => void;
}

const REACTIONS = ['❤️', '🔥', '👏', '😍', '🎉', '💯'];

export const StatusViewerModal: React.FC<StatusViewerModalProps> = ({
  status,
  currentUser,
  onClose,
}) => {
  const { t } = useI18n();
  const [progress, setProgress] = useState(0);
  const [reactions, setReactions] = useState(status.reactions || []);
  const [reactionSent, setReactionSent] = useState(false);

  // Auto-record view
  useEffect(() => {
    api.viewStatus(status.id, currentUser.id);
  }, [status.id, currentUser.id]);

  // Status timer (5 seconds progress)
  useEffect(() => {
    const duration = 6000;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          onClose();
          return 100;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onClose]);

  const handleReact = async (emoji: string) => {
    try {
      await api.reactStatus(status.id, currentUser.id, emoji);
      setReactions((prev) => [...prev, { userId: currentUser.id, userName: currentUser.username, emoji }]);
      setReactionSent(true);
      setTimeout(() => setReactionSent(false), 2000);
    } catch (err) {
      console.error('Error reacting:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-0 sm:p-4">
      <div className="relative w-full max-w-sm h-full sm:h-[650px] bg-slate-950 sm:rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl">
        {/* Top Progress Bar */}
        <div className="absolute top-3 left-3 right-3 z-30">
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Top Header */}
        <div className="absolute top-6 left-4 right-4 z-30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={status.userAvatar}
              alt={status.userName}
              className="w-9 h-9 rounded-full object-cover border border-white/50"
            />
            <div>
              <p className="font-bold text-xs text-white">{status.userName}</p>
              <p className="text-[10px] text-white/70">
                24h Status • {new Date(status.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Media Content */}
        <div className="relative flex-1 flex items-center justify-center bg-black">
          {status.mediaType === 'video' ? (
            <video
              src={status.mediaUrl}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={status.mediaUrl}
              alt={status.caption || 'Status'}
              className="w-full h-full object-contain"
            />
          )}

          {/* Caption Overlay */}
          {status.caption && (
            <div className="absolute bottom-20 left-4 right-4 p-3 bg-black/60 backdrop-blur-md rounded-2xl text-xs text-white text-center">
              {status.caption}
            </div>
          )}
        </div>

        {/* Bottom Reaction Bar */}
        <div className="p-3 bg-gradient-to-t from-black via-black/80 to-transparent z-30">
          {reactionSent && (
            <div className="text-center text-xs text-emerald-400 font-bold mb-2">
              Reaction sent to {status.userName}!
            </div>
          )}
          <div className="flex items-center justify-around">
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="text-2xl hover:scale-125 active:scale-95 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Views count */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/60 mt-2">
            <Eye className="w-3.5 h-3.5" />
            <span>{status.viewCount || status.views?.length || 1} views</span>
          </div>
        </div>
      </div>
    </div>
  );
};
