import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { Conversation, Message, User, ChannelItem } from '../../types';
import { api } from '../../services/api';
import { MarketlyAIChat } from './MarketlyAIChat';
import { GroupChannelModal } from './GroupChannelModal';
import { GroupInfoModal } from './GroupInfoModal';
import { ChannelView } from './ChannelView';
import {
  MessageSquare,
  Store,
  Users,
  Radio,
  Sparkles,
  Send,
  Check,
  CheckCheck,
  Clock,
  UserPlus,
  ShoppingBag,
  MapPin,
  Truck,
  Plus,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Info,
  Lock,
  Bell,
  BellOff,
} from 'lucide-react';

interface ChatsViewProps {
  currentUser: User;
  initialConversationId?: string | null;
  initialActiveChatId?: string | null;
  onViewProfile: (userId: string) => void;
  onOpenAIChat?: () => void;
}

export const ChatsView: React.FC<ChatsViewProps> = ({
  currentUser,
  initialConversationId,
  initialActiveChatId,
  onViewProfile,
  onOpenAIChat,
}) => {
  const { t } = useI18n();
  const effectiveInitialId = initialConversationId || initialActiveChatId || null;

  // 5 Top sub-tabs: 'seller' | 'social' | 'groups' | 'channels' | 'ai'
  const [chatType, setChatType] = useState<'seller' | 'social' | 'groups' | 'channels' | 'ai'>('seller');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  
  // Channels state
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelItem | null>(null);

  // Messages & Input state
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [modalType, setModalType] = useState<'group' | 'channel' | null>(null);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to safely extract text from lastMessage
  const renderLastMessageText = (lastMsg: any): string => {
    if (!lastMsg) return 'No messages yet';
    if (typeof lastMsg === 'string') return lastMsg;
    if (typeof lastMsg === 'object' && lastMsg.text) return String(lastMsg.text);
    return 'Message';
  };

  type Participant = Conversation['participants'][number];

  const fallbackParticipant: Participant = {
    id: 'usr_unknown',
    name: 'Marketly User',
    username: 'user',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    role: 'BUYER',
    isOnline: true,
  };

  const getOtherParticipant = (c: Conversation | null): Participant => {
    if (!c || !Array.isArray(c.participants) || c.participants.length === 0) {
      return fallbackParticipant;
    }
    const other = c.participants.find((p) => p && p.id !== currentUser.id);
    return other || c.participants[0] || fallbackParticipant;
  };

  // Fetch data safely
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (chatType === 'ai') {
        setLoading(false);
        return;
      }

      if (chatType === 'channels') {
        const res = await api.getChannels(currentUser.id);
        const list: ChannelItem[] = Array.isArray(res?.channels) ? res.channels : [];
        setChannels(list);
        if (selectedChannel) {
          const updated = list.find((ch) => ch.id === selectedChannel.id);
          if (updated) setSelectedChannel(updated);
        }
        return;
      }

      // Load conversations for 'seller', 'social', or 'groups'
      const res = await api.getChats(currentUser.id, chatType);
      const fetchedConvs: Conversation[] = Array.isArray(res?.conversations) ? res.conversations : [];
      setConversations(fetchedConvs);

      // If initial conversation passed, auto-select it
      if (effectiveInitialId) {
        const found = fetchedConvs.find((c) => c && c.id === effectiveInitialId);
        if (found) {
          setSelectedConversation(found);
        }
      }
    } catch (err: any) {
      console.error('Error fetching chats:', err);
      setError('Unable to load conversations. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveInitialId === 'ai') {
      setChatType('ai');
      setSelectedConversation(null);
      setSelectedChannel(null);
    }
    loadData();
  }, [chatType, currentUser.id, effectiveInitialId]);

  // Fetch messages when a conversation is selected
  const fetchMessagesForSelected = async (silent = false) => {
    if (!selectedConversation) return;
    try {
      const res = await api.getMessages(selectedConversation.id);
      if (Array.isArray(res?.messages)) {
        setMessages(res.messages);
      }
    } catch (err) {
      if (!silent) console.error('Error fetching messages:', err);
    }
  };

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }
    fetchMessagesForSelected(false);

    const interval = setInterval(() => {
      fetchMessagesForSelected(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if current user is blocked from posting by group admin settings
  const isPostingBlockedInGroup = Boolean(
    selectedConversation?.isGroup &&
    selectedConversation.groupMeta?.onlyAdminsCanPost &&
    !selectedConversation.groupMeta.adminIds.includes(currentUser.id)
  );

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !selectedConversation || sending || isPostingBlockedInGroup) return;

    const textToSend = messageInput.trim();
    setMessageInput('');
    setSending(true);

    try {
      const res = await api.sendMessage(selectedConversation.id, {
        senderId: currentUser.id,
        senderName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.username,
        senderAvatar: currentUser.avatar || fallbackParticipant.avatar,
        text: textToSend,
      });

      if (res?.message) {
        setMessages((prev) => [...prev, res.message]);
      }

      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation.id
            ? {
                ...c,
                lastMessage: res?.message || {
                  id: `msg_${Date.now()}`,
                  conversationId: c.id,
                  senderId: currentUser.id,
                  senderName: `${currentUser.firstName} ${currentUser.lastName}`,
                  senderAvatar: currentUser.avatar,
                  text: textToSend,
                  status: 'sent',
                  timestamp: new Date().toISOString(),
                },
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  // Social request handlers
  const handleSocialRequestAction = async (action: 'send' | 'accept' | 'reject') => {
    if (!selectedConversation) return;
    try {
      const res = await api.handleSocialRequest(selectedConversation.id, currentUser.id, action);
      setSelectedConversation((prev) =>
        prev
          ? {
              ...prev,
              socialRequestStatus: res.status,
              socialRequestedBy: action === 'send' ? currentUser.id : prev.socialRequestedBy,
            }
          : null
      );
      loadData();
    } catch (err) {
      console.error('Error with social request:', err);
    }
  };

  // Create group or channel
  const handleCreateGroupChannel = async (name: string, description: string, options?: any) => {
    if (modalType === 'group') {
      try {
        const res = await api.createGroup({
          name,
          description,
          creatorId: currentUser.id,
          onlyAdminsCanPost: options?.onlyAdminsCanPost || false,
          onlyAdminsCanEditInfo: options?.onlyAdminsCanEditInfo || false,
        });
        if (res.conversation) {
          setConversations((prev) => [res.conversation, ...prev]);
          setSelectedConversation(res.conversation);
          setChatType('groups');
        }
      } catch (err) {
        console.error('Error creating group:', err);
      }
    } else if (modalType === 'channel') {
      try {
        const res = await api.createChannel({
          name,
          description,
          ownerId: currentUser.id,
        });
        if (res.channel) {
          setChannels((prev) => [res.channel, ...prev]);
          setSelectedChannel(res.channel);
          setChatType('channels');
        }
      } catch (err) {
        console.error('Error creating channel:', err);
      }
    }
    setModalType(null);
  };

  const handleToggleChannelFollow = async (channelId: string) => {
    try {
      const res = await api.toggleFollowChannel(channelId, currentUser.id);
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channelId
            ? { ...ch, isFollowing: res.isFollowing, followersCount: res.followersCount }
            : ch
        )
      );
      if (selectedChannel?.id === channelId) {
        setSelectedChannel((prev) =>
          prev ? { ...prev, isFollowing: res.isFollowing, followersCount: res.followersCount } : null
        );
      }
    } catch (err) {
      console.error('Error toggling channel follow:', err);
    }
  };

  const formatTime = (dateStr?: string): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto h-[calc(100dvh-8rem)] md:h-[calc(100vh-5rem)] p-2 sm:p-4">
      <div className="w-full h-full bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        {/* LEFT COLUMN: CONVERSATION LIST (Responsive: Hidden on mobile when a conversation, channel, or AI is active) */}
        <div
          className={`w-full md:w-80 lg:w-96 h-full border-r border-slate-800 flex flex-col bg-slate-950/60 ${
            selectedConversation || selectedChannel || chatType === 'ai' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Sub-Tabs: 1. SOCIAL | 2. SELLER | 3. MARKETLY AI | 4. GROUPS | 5. CHANNELS */}
          <div className="p-2 sm:p-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800/80 overflow-x-auto no-scrollbar">
              {/* 1. SOCIAL CHATS */}
              <button
                type="button"
                onClick={() => {
                  setChatType('social');
                  setSelectedConversation(null);
                  setSelectedChannel(null);
                }}
                className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap shrink-0 ${
                  chatType === 'social'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Social</span>
              </button>

              {/* 2. SELLER / ORDER CHATS */}
              <button
                type="button"
                onClick={() => {
                  setChatType('seller');
                  setSelectedConversation(null);
                  setSelectedChannel(null);
                }}
                className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap shrink-0 ${
                  chatType === 'seller'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Seller / Order</span>
              </button>

              {/* 3. MARKETLY AI */}
              <button
                type="button"
                onClick={() => {
                  setChatType('ai');
                  setSelectedConversation(null);
                  setSelectedChannel(null);
                }}
                className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap shrink-0 ${
                  chatType === 'ai'
                    ? 'bg-gradient-to-r from-rose-600 to-orange-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-300" />
                <span>Marketly AI</span>
              </button>

              {/* 4. GROUPS */}
              <button
                type="button"
                onClick={() => {
                  setChatType('groups');
                  setSelectedConversation(null);
                  setSelectedChannel(null);
                }}
                className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap shrink-0 ${
                  chatType === 'groups'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Groups</span>
              </button>

              {/* 5. CHANNELS */}
              <button
                type="button"
                onClick={() => {
                  setChatType('channels');
                  setSelectedConversation(null);
                  setSelectedChannel(null);
                }}
                className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap shrink-0 ${
                  chatType === 'channels'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Channels</span>
              </button>
            </div>

            {/* Quick Action bar for Groups & Channels */}
            {chatType === 'groups' && (
              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Your Groups</span>
                <button
                  type="button"
                  onClick={() => setModalType('group')}
                  className="py-1 px-2.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Group</span>
                </button>
              </div>
            )}

            {chatType === 'channels' && (
              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Discover Channels</span>
                <button
                  type="button"
                  onClick={() => setModalType('channel')}
                  className="py-1 px-2.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Channel</span>
                </button>
              </div>
            )}
          </div>

          {/* List Content Viewport */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
            {chatType === 'ai' ? (
              <div className="p-6 text-xs text-slate-400 text-center space-y-2">
                <Sparkles className="w-8 h-8 text-violet-400 mx-auto" />
                <p className="font-bold text-white text-sm">Marketly AI Assistant</p>
                <p className="leading-relaxed">
                  24/7 intelligent shopping assistant, Cash on Delivery guidance, dispute resolution, and marketplace help.
                </p>
              </div>
            ) : loading ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 text-violet-400 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-xs text-slate-400 space-y-3">
                <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                <p className="text-rose-300 font-semibold">{error}</p>
                <button
                  type="button"
                  onClick={loadData}
                  className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            ) : chatType === 'channels' ? (
              /* CHANNELS LIST */
              channels.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <Radio className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="font-bold text-slate-300">No channels found</p>
                  <p className="text-slate-500">Tap "New Channel" above to start broadcasting!</p>
                </div>
              ) : (
                channels.map((ch) => {
                  const isSelected = selectedChannel?.id === ch.id;

                  return (
                    <div
                      key={ch.id}
                      onClick={() => setSelectedChannel(ch)}
                      className={`p-3.5 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected ? 'bg-violet-600/15 border-l-4 border-violet-500' : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={ch.photo}
                          alt={ch.name}
                          className="w-11 h-11 rounded-2xl object-cover border border-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-white truncate">{ch.name}</p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {(ch.followersCount || 0).toLocaleString()} followers
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleChannelFollow(ch.id);
                        }}
                        className={`p-2 rounded-xl text-xs transition-colors shrink-0 ${
                          ch.isFollowing
                            ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                            : 'bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30'
                        }`}
                        title={ch.isFollowing ? 'Unfollow channel' : 'Follow channel'}
                      >
                        {ch.isFollowing ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })
              )
            ) : conversations.length === 0 ? (
              /* EMPTY STATE FOR CONVERSATIONS */
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-bold text-slate-300">
                  {chatType === 'groups' ? 'No groups yet' : 'No conversations yet'}
                </p>
                <p className="text-slate-500 leading-relaxed">
                  {chatType === 'seller'
                    ? 'Click ORDER NOW on any product in the feed to start an order inquiry chat with the seller!'
                    : chatType === 'groups'
                    ? 'Create a group to start chatting with friends and community members.'
                    : 'Start a direct chat with users or accept incoming social requests.'}
                </p>
              </div>
            ) : (
              /* CONVERSATIONS LIST (Seller, Social, or Groups) */
              conversations.map((c) => {
                if (!c) return null;
                const other = getOtherParticipant(c);
                const isSelected = selectedConversation?.id === c.id;
                const displayName = c.isGroup ? c.groupName : other.name || other.username || 'User';
                const displayAvatar = c.isGroup ? c.groupAvatar : other.avatar || fallbackParticipant.avatar;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedConversation(c)}
                    className={`p-3.5 cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected ? 'bg-violet-600/15 border-l-4 border-violet-500' : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={displayAvatar}
                        alt={displayName}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shrink-0"
                      />
                      {c.type === 'seller' && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center border-2 border-slate-950 shadow">
                          <Store className="w-2.5 h-2.5" />
                        </div>
                      )}
                      {c.isGroup && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center border-2 border-slate-950 shadow">
                          <Users className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm text-white truncate">{displayName}</p>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap ml-1">
                          {formatTime(c.updatedAt)}
                        </span>
                      </div>

                      {/* Product context in Seller chats */}
                      {c.productContext && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-violet-300 font-semibold truncate">
                          <ShoppingBag className="w-3 h-3 shrink-0" />
                          <span className="truncate">{c.productContext.productName}</span>
                          <span className="text-white shrink-0">
                            • Rs. {Number(c.productContext.finalPrice || 0).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Group members count indicator */}
                      {c.isGroup && (
                        <p className="text-[11px] text-indigo-300 font-medium">
                          {c.participants?.length || 1} members
                        </p>
                      )}

                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {renderLastMessageText(c.lastMessage)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE VIEW (Conversation, Channel, or Embedded AI) */}
        <div
          className={`flex-1 h-full flex flex-col bg-slate-900/70 ${
            !selectedConversation && !selectedChannel && chatType !== 'ai' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {chatType === 'ai' ? (
            /* EMBEDDED AI CHAT */
            <MarketlyAIChat
              currentUser={currentUser}
              onBack={() => {
                setChatType('social');
                setSelectedConversation(null);
                setSelectedChannel(null);
              }}
            />
          ) : chatType === 'channels' && selectedChannel ? (
            /* CHANNEL ACTIVE VIEW */
            <ChannelView
              channel={selectedChannel}
              currentUser={currentUser}
              onBack={() => setSelectedChannel(null)}
              onFollowToggled={(isFollowing, newCount) => {
                setChannels((prev) =>
                  prev.map((ch) =>
                    ch.id === selectedChannel.id
                      ? { ...ch, isFollowing, followersCount: newCount }
                      : ch
                  )
                );
              }}
            />
          ) : selectedConversation ? (
            /* ACTIVE CONVERSATION (Seller, Social, or Group) */
            <>
              {/* CHAT HEADER */}
              <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white shrink-0"
                    title="Back to conversation list"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div
                    onClick={() => {
                      if (!selectedConversation.isGroup) {
                        const other = getOtherParticipant(selectedConversation);
                        if (other?.id) onViewProfile(other.id);
                      } else {
                        setIsGroupInfoOpen(true);
                      }
                    }}
                    className="flex items-center gap-2.5 cursor-pointer group min-w-0"
                  >
                    <img
                      src={
                        selectedConversation.isGroup
                          ? selectedConversation.groupAvatar
                          : getOtherParticipant(selectedConversation).avatar || fallbackParticipant.avatar
                      }
                      alt="Avatar"
                      className="w-10 h-10 rounded-2xl object-cover border border-slate-700 group-hover:border-violet-500 transition-colors shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-sm text-white group-hover:text-violet-300 transition-colors truncate">
                          {selectedConversation.isGroup
                            ? selectedConversation.groupName
                            : getOtherParticipant(selectedConversation).name ||
                              getOtherParticipant(selectedConversation).username || 'User'}
                        </p>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                          {selectedConversation.isGroup ? 'Group' : selectedConversation.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>
                          {selectedConversation.isGroup
                            ? `${selectedConversation.participants?.length || 1} members`
                            : 'Online'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* HEADER ACTIONS: Group Info OR Seller Social Request */}
                <div className="flex items-center gap-2 shrink-0">
                  {selectedConversation.isGroup ? (
                    <button
                      type="button"
                      onClick={() => setIsGroupInfoOpen(true)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                      title="Group Info & Settings"
                    >
                      <Info className="w-4 h-4 text-violet-400" />
                      <span className="hidden sm:inline">Group Info</span>
                    </button>
                  ) : selectedConversation.type === 'seller' ? (
                    selectedConversation.socialRequestStatus === 'accepted' ? (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Social Connected</span>
                      </span>
                    ) : selectedConversation.socialRequestStatus === 'pending' ? (
                      selectedConversation.socialRequestedBy === currentUser.id ? (
                        <span className="px-2.5 py-1 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-semibold">
                          Request Sent
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSocialRequestAction('accept')}
                            className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-colors"
                          >
                            {t('accept')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSocialRequestAction('reject')}
                            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                          >
                            {t('reject')}
                          </button>
                        </div>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSocialRequestAction('send')}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-violet-950/40 hover:border-violet-500/50 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                        title={t('send_social_request_desc')}
                      >
                        <UserPlus className="w-3.5 h-3.5 text-violet-400" />
                        <span className="hidden sm:inline">{t('send_social_request')}</span>
                      </button>
                    )
                  ) : null}
                </div>
              </div>

              {/* PINNED PRODUCT CONTEXT (For Seller/Order Chat) */}
              {selectedConversation.productContext && (
                <div className="p-3 bg-gradient-to-r from-violet-950/40 via-slate-900 to-indigo-950/40 border-b border-violet-900/30 flex items-center justify-between gap-3 shadow-inner shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    {selectedConversation.productContext.productImage && (
                      <img
                        src={selectedConversation.productContext.productImage}
                        alt={selectedConversation.productContext.productName}
                        className="w-12 h-12 rounded-xl object-cover border border-violet-500/40 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-xs sm:text-sm text-white truncate">
                          {selectedConversation.productContext.productName}
                        </p>
                        <span className="shrink-0 px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold flex items-center gap-0.5">
                          <Truck className="w-2.5 h-2.5" /> COD Verified
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <span className="font-black text-violet-300">
                          Rs. {Number(selectedConversation.productContext.finalPrice || 0).toLocaleString()}
                        </span>
                        {selectedConversation.productContext.sellerCity && (
                          <span className="text-slate-400 flex items-center gap-0.5 text-[10px]">
                            <MapPin className="w-2.5 h-2.5" /> {selectedConversation.productContext.sellerCity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block">Cash on Delivery</span>
                    <span className="text-[11px] font-bold text-emerald-400">Pay at Doorstep</span>
                  </div>
                </div>
              )}

              {/* MESSAGES AREA */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                    <p className="font-semibold text-slate-300">No messages yet.</p>
                    <p className="text-slate-500 max-w-sm mx-auto">
                      {selectedConversation.isGroup
                        ? 'Say hello to the group members and kick off the conversation!'
                        : 'Say hello and discuss product details, delivery address, and COD arrangements!'}
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    if (!m) return null;
                    const isMe = m.senderId === currentUser.id;

                    return (
                      <div
                        key={m.id}
                        className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMe && (
                          <img
                            src={m.senderAvatar || fallbackParticipant.avatar}
                            alt={m.senderName || 'Sender'}
                            className="w-7 h-7 rounded-full object-cover shrink-0 mb-1"
                          />
                        )}

                        <div
                          className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed ${
                            isMe
                              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-none shadow-md'
                              : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-bl-none shadow'
                          }`}
                        >
                          {/* Group sender name for group chats */}
                          {selectedConversation.isGroup && !isMe && (
                            <p className="text-[11px] font-bold text-violet-300 mb-0.5">
                              {m.senderName || 'Member'}
                            </p>
                          )}

                          <p className="whitespace-pre-wrap">{m.text}</p>

                          <div
                            className={`flex items-center gap-1 justify-end mt-1 text-[10px] ${
                              isMe ? 'text-violet-200' : 'text-slate-400'
                            }`}
                          >
                            <span>{formatTime(m.timestamp)}</span>
                            {isMe && (
                              <span>
                                {m.status === 'read' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                                ) : m.status === 'delivered' ? (
                                  <CheckCheck className="w-3.5 h-3.5" />
                                ) : m.status === 'sent' ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* MESSAGE INPUT BAR */}
              {isPostingBlockedInGroup ? (
                <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 text-center text-xs text-amber-400 flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Only admins can send messages in this group.</span>
                </div>
              ) : (
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={t('type_message')}
                    className="flex-1 px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || sending}
                    className="p-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-2xl shadow-md transition-all flex items-center justify-center shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </>
          ) : (
            /* EMPTY PANE WHEN NOTHING IS SELECTED */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-400">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-base text-slate-300">Select a conversation or channel</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Choose from Seller orders, Social chats, Groups, Channels, or consult Marketly AI.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Group or Channel Creation Modal */}
      {modalType && (
        <GroupChannelModal
          type={modalType}
          currentUser={currentUser}
          onClose={() => setModalType(null)}
          onCreate={handleCreateGroupChannel}
        />
      )}

      {/* Group Info / Settings Modal */}
      {isGroupInfoOpen && selectedConversation?.isGroup && (
        <GroupInfoModal
          conversation={selectedConversation}
          currentUser={currentUser}
          onClose={() => setIsGroupInfoOpen(false)}
          onGroupUpdated={(updated) => {
            setSelectedConversation(updated);
            setConversations((prev) =>
              prev.map((c) => (c.id === updated.id ? updated : c))
            );
          }}
          onLeaveGroup={() => {
            setIsGroupInfoOpen(false);
            setSelectedConversation(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};
