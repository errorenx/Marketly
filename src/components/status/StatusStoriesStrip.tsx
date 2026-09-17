import React, { useState, useEffect } from 'react';
import { User, UserStatus } from '../../types';
import { api } from '../../services/api';
import { Plus, Play, Sparkles } from 'lucide-react';

interface StatusStoriesStripProps {
  currentUser: User;
  onOpenCreateStatus: () => void;
  onOpenStatusViewer: (status: UserStatus, allStatuses: UserStatus[]) => void;
  refreshTrigger?: number;
}

export const StatusStoriesStrip: React.FC<StatusStoriesStripProps> = ({
  currentUser,
  onOpenCreateStatus,
  onOpenStatusViewer,
  refreshTrigger = 0,
}) => {
  const [statuses, setStatuses] = useState<UserStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatuses = async () => {
    try {
      const res = await api.getStatuses();
      const active = (res.statuses || []).filter(
        (s) => new Date(s.expiresAt).getTime() > Date.now()
      );
      setStatuses(active);
    } catch (err) {
      console.error('Error loading statuses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, [refreshTrigger]);

  const userStatus = statuses.find((s) => s.userId === currentUser.id);
  const otherStatuses = statuses.filter((s) => s.userId !== currentUser.id);

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-3xl p-3.5 mb-5 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between px-1 mb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-300 tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>24-Hour Stories & Status</span>
        </div>
        <button
          onClick={onOpenCreateStatus}
          className="text-[11px] font-bold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          <span>Add Status</span>
        </button>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
        {/* Current User Story Circle */}
        <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
          <div
            onClick={() => {
              if (userStatus) {
                onOpenStatusViewer(userStatus, statuses);
              } else {
                onOpenCreateStatus();
              }
            }}
            className="relative"
          >
            <div
              className={`w-14 h-14 rounded-full p-0.5 transition-all group-hover:scale-105 ${
                userStatus
                  ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-violet-600 ring-2 ring-violet-500/40 ring-offset-2 ring-offset-slate-900'
                  : 'bg-slate-800'
              }`}
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.username}
                className="w-full h-full rounded-full object-cover"
              />
            </div>

            {/* Plus or Video badge */}
            {userStatus ? (
              <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow-md border-2 border-slate-900">
                {userStatus.type === 'video' ? (
                  <Play className="w-2.5 h-2.5 fill-white" />
                ) : (
                  <Sparkles className="w-2.5 h-2.5" />
                )}
              </div>
            ) : (
              <div className="absolute -bottom-1 -right-1 bg-violet-600 text-white p-1 rounded-full shadow-md border-2 border-slate-900 group-hover:bg-violet-500">
                <Plus className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            )}
          </div>
          <span className="text-[11px] font-medium text-slate-300 group-hover:text-white truncate max-w-[64px]">
            {userStatus ? 'Your Story' : 'Add Status'}
          </span>
        </div>

        {/* Other Users' Active Statuses */}
        {otherStatuses.map((st) => {
          const hasUnseen = !st.views?.some((v) => v.userId === currentUser.id);
          return (
            <div
              key={st.id}
              onClick={() => onOpenStatusViewer(st, statuses)}
              className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
            >
              <div className="relative">
                <div
                  className={`w-14 h-14 rounded-full p-0.5 transition-all group-hover:scale-105 ${
                    hasUnseen
                      ? 'bg-gradient-to-tr from-violet-600 via-pink-500 to-amber-400 ring-2 ring-pink-500/50 ring-offset-2 ring-offset-slate-900 animate-pulse'
                      : 'bg-slate-700 ring-1 ring-slate-700 ring-offset-2 ring-offset-slate-900 opacity-80'
                  }`}
                >
                  <img
                    src={st.userAvatar}
                    alt={st.userName}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>

                {st.type === 'video' && (
                  <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1 rounded-full shadow-md border-2 border-slate-900">
                    <Play className="w-2.5 h-2.5 fill-white" />
                  </div>
                )}
              </div>
              <span className="text-[11px] font-medium text-slate-300 group-hover:text-white truncate max-w-[64px]">
                {st.userName.split(' ')[0]}
              </span>
            </div>
          );
        })}

        {otherStatuses.length === 0 && !loading && (
          <div className="text-xs text-slate-500 italic pl-2 shrink-0 flex items-center gap-1.5">
            <span>Tap + to post the first 24-hour status story</span>
          </div>
        )}
      </div>
    </div>
  );
};
