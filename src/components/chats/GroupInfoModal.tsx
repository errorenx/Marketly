import React, { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { Conversation, User } from '../../types';
import { api } from '../../services/api';
import {
  Users,
  Shield,
  ShieldAlert,
  UserPlus,
  LogOut,
  X,
  Settings,
  Check,
  UserMinus,
  Lock,
  Unlock,
} from 'lucide-react';

interface GroupInfoModalProps {
  conversation: Conversation;
  currentUser: User;
  onClose: () => void;
  onGroupUpdated: (updatedConv: Conversation) => void;
  onLeaveGroup: () => void;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  conversation,
  currentUser,
  onClose,
  onGroupUpdated,
  onLeaveGroup,
}) => {
  const { t } = useI18n();
  const groupMeta = conversation.groupMeta;
  const adminIds = groupMeta?.adminIds || [groupMeta?.creatorId || ''];
  const isCurrentUserAdmin = adminIds.includes(currentUser.id);

  const [onlyAdminsCanPost, setOnlyAdminsCanPost] = useState<boolean>(
    groupMeta?.onlyAdminsCanPost || false
  );
  const [onlyAdminsCanEditInfo, setOnlyAdminsCanEditInfo] = useState<boolean>(
    groupMeta?.onlyAdminsCanEditInfo || false
  );
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const participants = conversation.participants || [];

  const handleToggleAdminOnlyPost = async () => {
    if (!isCurrentUserAdmin) return;
    const newVal = !onlyAdminsCanPost;
    setOnlyAdminsCanPost(newVal);
    try {
      const res = await api.updateGroup(conversation.id, {
        onlyAdminsCanPost: newVal,
        requesterId: currentUser.id,
      });
      if (res.conversation) {
        onGroupUpdated(res.conversation);
      }
    } catch (err) {
      console.error('Failed to update group permissions:', err);
      setOnlyAdminsCanPost(!newVal);
    }
  };

  const handlePromoteDemote = async (targetUserId: string, isPromote: boolean) => {
    if (!isCurrentUserAdmin) return;
    setLoadingAction(true);
    try {
      const res = await api.updateGroupAdmin(conversation.id, targetUserId, isPromote ? 'promote' : 'demote');
      if (res.conversation) {
        onGroupUpdated(res.conversation);
      }
    } catch (err) {
      console.error('Error updating admin:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!isCurrentUserAdmin && targetUserId !== currentUser.id) return;
    setLoadingAction(true);
    try {
      await api.removeGroupMember(conversation.id, targetUserId);
      if (targetUserId === currentUser.id) {
        onLeaveGroup();
      } else {
        const updatedParticipants = participants.filter((p) => p.id !== targetUserId);
        const updatedMemberIds = (groupMeta?.memberIds || []).filter((id) => id !== targetUserId);
        const updatedAdminIds = adminIds.filter((id) => id !== targetUserId);
        const updatedConv: Conversation = {
          ...conversation,
          participantIds: conversation.participantIds.filter((id) => id !== targetUserId),
          participants: updatedParticipants,
          groupMeta: groupMeta
            ? {
                ...groupMeta,
                memberIds: updatedMemberIds,
                adminIds: updatedAdminIds,
              }
            : undefined,
        };
        onGroupUpdated(updatedConv);
      }
    } catch (err) {
      console.error('Error removing member:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rtl:left-4 rtl:right-auto text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Group Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
          <img
            src={conversation.groupAvatar || 'https://images.unsplash.com/photo-1522071823991-b9671e9d7fbd?w=100'}
            alt={conversation.groupName || 'Group'}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-violet-500/40"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-white truncate">
              {conversation.groupName || 'Group Details'}
            </h3>
            <p className="text-xs text-slate-400">
              {participants.length} {participants.length === 1 ? 'member' : 'members'} • Created on Marketly
            </p>
            {groupMeta?.description && (
              <p className="text-xs text-slate-300 mt-1 line-clamp-2 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800">
                {groupMeta.description}
              </p>
            )}
          </div>
        </div>

        {/* Group Settings / Admin Controls */}
        <div className="py-3 border-b border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-violet-400" />
              <span>Group Permissions</span>
            </span>
            {isCurrentUserAdmin ? (
              <span className="text-[10px] text-violet-300 font-bold px-2 py-0.5 rounded-full bg-violet-600/20 border border-violet-500/30">
                You are Group Admin
              </span>
            ) : (
              <span className="text-[10px] text-slate-500">View only</span>
            )}
          </div>

          {/* Only admins can post */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="min-w-0 pr-3">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                {onlyAdminsCanPost ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
                <span>Send Messages: {onlyAdminsCanPost ? 'Admins Only' : 'All Members'}</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {onlyAdminsCanPost
                  ? 'Only group admins can send messages in this group.'
                  : 'All group members can freely discuss and send messages.'}
              </p>
            </div>
            {isCurrentUserAdmin && (
              <button
                type="button"
                onClick={handleToggleAdminOnlyPost}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  onlyAdminsCanPost
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {onlyAdminsCanPost ? 'Admins Only' : 'All Members'}
              </button>
            )}
          </div>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2">
          <p className="text-xs font-bold text-slate-400 px-1">
            MEMBERS ({participants.length})
          </p>

          <div className="divide-y divide-slate-800/60">
            {participants.map((p) => {
              const isAdmin = adminIds.includes(p.id);
              const isMe = p.id === currentUser.id;

              return (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs text-white truncate">
                          {p.name} {isMe && '(You)'}
                        </p>
                        {isAdmin && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-violet-600/20 text-violet-300 border border-violet-500/30 flex items-center gap-1 shrink-0">
                            <Shield className="w-2.5 h-2.5" />
                            <span>Admin</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">@{p.username}</p>
                    </div>
                  </div>

                  {/* Admin actions on members */}
                  {isCurrentUserAdmin && !isMe && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePromoteDemote(p.id, !isAdmin)}
                        disabled={loadingAction}
                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                          isAdmin
                            ? 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
                            : 'text-violet-400 hover:text-violet-300 hover:bg-violet-950/40'
                        }`}
                        title={isAdmin ? 'Dismiss as Admin' : 'Make Group Admin'}
                      >
                        {isAdmin ? <ShieldAlert className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(p.id)}
                        disabled={loadingAction}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
                        title="Remove from group"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions: Leave group */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleRemoveMember(currentUser.id)}
            className="px-3.5 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Group</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
