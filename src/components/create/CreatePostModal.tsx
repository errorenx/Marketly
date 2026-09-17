import React from 'react';
import { User } from '../../types';
import { CreateScreen } from './CreateScreen';

interface CreatePostModalProps {
  currentUser: User;
  onClose: () => void;
  onPostCreated: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  currentUser,
  onClose,
  onPostCreated,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto">
        <CreateScreen
          currentUser={currentUser}
          onClose={onClose}
          onContentCreated={(type) => {
            onPostCreated();
            onClose();
          }}
        />
      </div>
    </div>
  );
};
