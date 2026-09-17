import React, { useState, useEffect } from 'react';
import { useI18n } from './i18n/I18nContext';
import { User, Product } from './types';
import { api } from './services/api';

// Components
import { StartupFlow } from './components/startup/StartupFlow';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { DesktopSidebar } from './components/layout/DesktopSidebar';
import { FeedView } from './components/feed/FeedView';
import { ChatsView } from './components/chats/ChatsView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { ProfileView } from './components/profile/ProfileView';
import { SellerCenterView } from './components/seller/SellerCenterView';
import { AdminPanelView } from './components/admin/AdminPanelView';
import { CreatePostModal } from './components/create/CreatePostModal';
import { CreateScreen } from './components/create/CreateScreen';
import { SearchView } from './components/search/SearchView';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export default function App() {
  const { t } = useI18n();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('marketly_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('feed');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  // Modals
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleOpenAIChat = () => {
    setActiveChatId('ai');
    setCurrentTab('chats');
  };

  // Badges
  const [unreadNotifications, setUnreadNotifications] = useState(2);
  const [unreadChats, setUnreadChats] = useState(1);

  // Sync user changes to localStorage
  const handleUserUpdate = (updated: User) => {
    setCurrentUser(updated);
    localStorage.setItem('marketly_current_user', JSON.stringify(updated));
  };

  const handleLogout = () => {
    localStorage.removeItem('marketly_current_user');
    setCurrentUser(null);
    setCurrentTab('feed');
  };

  const refreshUnreadCounts = async () => {
    if (!currentUser) return;
    try {
      const [notifRes, chatsRes] = await Promise.all([
        api.getNotifications(currentUser.id),
        api.getConversations(currentUser.id),
      ]);
      const unreadN = (notifRes.notifications || []).filter((n: any) => !n.isRead).length;
      const unreadC = (chatsRes.conversations || []).reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0);
      setUnreadNotifications(unreadN);
      setUnreadChats(unreadC);
    } catch (err) {
      console.error('Error fetching unread counts:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshUnreadCounts();
    }
  }, [currentUser]);

  // Order Now handler:
  // When user clicks "Order Now" on a product:
  // 1. Fetch the product details
  // 2. Open or create a chat with the seller
  // 3. Navigate to chat tab with active conversation and attached product order inquiry!
  const handleOrderNow = async (productId: string) => {
    if (!currentUser) return;
    try {
      const prodRes = await api.getProduct(productId);
      const product: Product = prodRes.product;

      // Start or get chat with seller
      const chatRes = await api.createOrGetDirectChat(
        currentUser.id,
        product.sellerId,
        product
      );

      // Navigate to chat
      setActiveChatId(chatRes.conversation.id);
      setCurrentTab('chats');
    } catch (err) {
      console.error('Failed to initiate order now chat:', err);
    }
  };

  const handleStartChatWithUser = async (targetUser: User) => {
    if (!currentUser) return;
    try {
      const chatRes = await api.createOrGetDirectChat(currentUser.id, targetUser.id);
      setActiveChatId(chatRes.conversation.id);
      setCurrentTab('chats');
    } catch (err) {
      console.error('Failed to initiate chat:', err);
    }
  };

  // If user is not authenticated, display the Startup Flow
  if (!currentUser) {
    return <StartupFlow onComplete={handleUserUpdate} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-violet-600 selection:text-white">
      {/* TOP NAVBAR */}
      <Navbar
        currentUser={currentUser}
        unreadNotifications={unreadNotifications}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAI={handleOpenAIChat}
        onNavigate={(tab) => {
          if (tab === 'profile') setViewingProfileId(null);
          setCurrentTab(tab);
        }}
      />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* DESKTOP SIDEBAR */}
        <DesktopSidebar
          currentUser={currentUser}
          currentTab={currentTab}
          unreadNotifications={unreadNotifications}
          unreadChats={unreadChats}
          onNavigate={(tab) => {
            if (tab === 'profile') setViewingProfileId(null);
            setCurrentTab(tab);
          }}
          onOpenCreatePost={() => setIsCreatePostOpen(true)}
          onOpenAI={handleOpenAIChat}
          onLogout={handleLogout}
        />

        {/* CONTENT VIEWPORT */}
        <main className="flex-1 min-w-0 px-2 sm:px-4 pt-3 overflow-x-hidden">
          {currentTab === 'feed' && (
            <ErrorBoundary sectionName="Feed">
              <FeedView
                currentUser={currentUser}
                onOrderNow={handleOrderNow}
                onViewProfile={(userId) => {
                  setViewingProfileId(userId);
                  setCurrentTab('profile');
                }}
                onOpenCreatePost={() => setIsCreatePostOpen(true)}
                onOpenCreateStatus={() => setIsCreatePostOpen(true)}
                onNavigate={(tab) => setCurrentTab(tab)}
              />
            </ErrorBoundary>
          )}

          {currentTab === 'create' && (
            <ErrorBoundary sectionName="Create">
              <CreateScreen
                currentUser={currentUser}
                onContentCreated={(type) => {
                  setCurrentTab('feed');
                }}
              />
            </ErrorBoundary>
          )}

          {currentTab === 'chats' && (
            <ErrorBoundary sectionName="Chats">
              <ChatsView
                currentUser={currentUser}
                initialActiveChatId={activeChatId}
                initialConversationId={activeChatId}
                onViewProfile={(userId) => {
                  setViewingProfileId(userId);
                  setCurrentTab('profile');
                }}
                onOpenAIChat={handleOpenAIChat}
              />
            </ErrorBoundary>
          )}

          {currentTab === 'notifications' && (
            <ErrorBoundary sectionName="Notifications">
              <NotificationsView
                currentUser={currentUser}
                onNavigate={(tab, contextId) => {
                  if (contextId) setActiveChatId(contextId);
                  setCurrentTab(tab);
                }}
                onViewProfile={(userId) => {
                  setViewingProfileId(userId);
                  setCurrentTab('profile');
                }}
                onRefreshUnread={refreshUnreadCounts}
              />
            </ErrorBoundary>
          )}

          {currentTab === 'profile' && (
            <ErrorBoundary sectionName="Profile">
              <ProfileView
                currentUser={currentUser}
                viewingUserId={viewingProfileId}
                onOrderNow={handleOrderNow}
                onStartChatWithUser={handleStartChatWithUser}
                onUserUpdated={handleUserUpdate}
                onLogout={handleLogout}
                onNavigate={(tab) => setCurrentTab(tab)}
              />
            </ErrorBoundary>
          )}

          {currentTab === 'seller_center' && (
            <ErrorBoundary sectionName="Seller Center">
              <SellerCenterView
                currentUser={currentUser}
                onNavigate={(tab, contextId) => {
                  if (contextId) setActiveChatId(contextId);
                  setCurrentTab(tab);
                }}
              />
            </ErrorBoundary>
          )}

          {currentTab === 'admin_panel' && (
            <ErrorBoundary sectionName="Admin Panel">
              <AdminPanelView
                currentUser={currentUser}
                onNavigate={(tab) => setCurrentTab(tab)}
              />
            </ErrorBoundary>
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <BottomNav
        currentTab={currentTab}
        currentUser={currentUser}
        unreadNotifications={unreadNotifications}
        unreadChats={unreadChats}
        onNavigate={(tab) => {
          if (tab === 'profile') setViewingProfileId(null);
          setCurrentTab(tab);
        }}
        onOpenCreatePost={() => setIsCreatePostOpen(true)}
      />

      {/* MODALS */}
      {/* 1. Create Post Modal */}
      {isCreatePostOpen && (
        <ErrorBoundary sectionName="Create Post">
          <CreatePostModal
            currentUser={currentUser}
            onClose={() => setIsCreatePostOpen(false)}
            onPostCreated={() => {
              // refresh feed or state
              setCurrentTab('feed');
            }}
          />
        </ErrorBoundary>
      )}

      {/* 2. Search View Modal */}
      {isSearchOpen && (
        <ErrorBoundary sectionName="Search">
          <SearchView
            currentUser={currentUser}
            onClose={() => setIsSearchOpen(false)}
            onOrderNow={handleOrderNow}
            onViewProfile={(userId) => {
              setViewingProfileId(userId);
              setCurrentTab('profile');
            }}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
