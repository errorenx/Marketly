import React, { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { User } from '../../types';
import { Users, Radio, Check, X } from 'lucide-react';

interface GroupChannelModalProps {
  type: 'group' | 'channel';
  currentUser: User;
  onClose: () => void;
  onCreate: (name: string, description: string, options?: any) => void;
}

export const GroupChannelModal: React.FC<GroupChannelModalProps> = ({
  type,
  currentUser,
  onClose,
  onCreate,
}) => {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [onlyAdminsCanPost, setOnlyAdminsCanPost] = useState(false);
  const [onlyAdminsCanEditInfo, setOnlyAdminsCanEditInfo] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim(), {
      onlyAdminsCanPost,
      onlyAdminsCanEditInfo,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rtl:left-4 rtl:right-auto text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
            {type === 'group' ? <Users className="w-5 h-5" /> : <Radio className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-base text-white">
              {type === 'group' ? t('create_group') : t('create_channel')}
            </h3>
            <p className="text-xs text-slate-400">
              {type === 'group'
                ? 'Create a group to chat with multiple people'
                : 'Create a channel for broadcasting updates to subscribers'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {type === 'group' ? t('group_name') : t('channel_name')} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'group' ? 'e.g. Lahore Tech Enthusiasts' : 'e.g. Hafeez Centre Deals'}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t('description')}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'group' ? 'What is this group about?' : 'Broadcast topics...'}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          {type === 'group' && (
            <div className="space-y-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <p className="text-xs font-semibold text-slate-300">Group Permissions</p>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={onlyAdminsCanPost}
                  onChange={(e) => setOnlyAdminsCanPost(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-violet-600 focus:ring-0"
                />
                <span>Only admins can send messages</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={onlyAdminsCanEditInfo}
                  onChange={(e) => setOnlyAdminsCanEditInfo(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-violet-600 focus:ring-0"
                />
                <span>Only admins can edit group info</span>
              </label>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md"
            >
              {t('continue_btn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
