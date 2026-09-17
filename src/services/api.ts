import { User, Product, Post, UserStatus, Conversation, Message, AppNotification, SellerSubscription, SellerAnalytics, ReportItem, UserRole } from '../types';

export const api = {
  // Auth
  async checkUsername(username: string): Promise<{ available: boolean; message: string }> {
    const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
    return res.json();
  },

  async register(data: any): Promise<{ user: User }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  async login(loginId: string): Promise<{ user: User }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  // Users
  async getUsers(): Promise<{ users: User[] }> {
    const res = await fetch('/api/users');
    return res.json();
  },

  async getUser(id: string, isSelf = false): Promise<{ user: User }> {
    const res = await fetch(`/api/users/${id}${isSelf ? '?self=true' : ''}`);
    return res.json();
  },

  async updateUser(id: string, updates: Partial<User>): Promise<{ user: User }> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async deactivateUser(id: string, reason?: string, deactivate = true): Promise<{ success: boolean; isDeactivated: boolean }> {
    const res = await fetch(`/api/users/${id}/deactivate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, deactivate }),
    });
    return res.json();
  },

  async deleteUser(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Feed & Posts
  async getFeed(role: UserRole, tab?: string): Promise<{ posts: Post[] }> {
    const url = `/api/feed?role=${role}${tab ? `&tab=${tab}` : ''}`;
    const res = await fetch(url);
    return res.json();
  },

  async getVideoFeed(role: UserRole, tab?: string): Promise<{ videos: Post[] }> {
    const url = `/api/feed/videos?role=${role}${tab ? `&tab=${tab}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to load video feed');
    }
    return res.json();
  },

  async uploadMedia(data: { fileData: string; fileName?: string; fileType?: string; mediaType?: 'photo' | 'video' }): Promise<{
    success: boolean;
    storage_path: string;
    media_url: string;
    media_type: 'photo' | 'video';
    file_name: string;
    uploaded_at: string;
  }> {
    const res = await fetch('/api/storage/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload media to storage');
    }
    return res.json();
  },

  async createPost(postData: any): Promise<{ post: Post }> {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create post');
    }
    return res.json();
  },

  async likePost(postId: string, userId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    const res = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  async addComment(postId: string, authorId: string, text: string): Promise<any> {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorId, text }),
    });
    return res.json();
  },

  // Products
  async getProducts(params: Record<string, any> = {}): Promise<{ products: Product[] }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    });
    const res = await fetch(`/api/products?${query.toString()}`);
    return res.json();
  },

  async getProduct(id: string): Promise<{ product: Product }> {
    const res = await fetch(`/api/products/${id}`);
    return res.json();
  },

  async createProduct(productData: any): Promise<{ product: Product }> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create product');
    }
    return res.json();
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<{ product: Product }> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  // Chats & Order Now Flow
  async orderNow(buyerId: string, productId: string): Promise<{ conversation: Conversation; isNew: boolean }> {
    const res = await fetch('/api/chats/order-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buyerId, productId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to initiate order chat');
    }
    return res.json();
  },

  async getChats(userId: string, type?: 'social' | 'seller' | 'groups'): Promise<{ conversations: Conversation[] }> {
    const url = `/api/chats?userId=${userId}${type ? `&type=${type}` : ''}`;
    const res = await fetch(url);
    return res.json();
  },

  async getConversations(userId: string, type?: 'social' | 'seller' | 'groups'): Promise<{ conversations: Conversation[] }> {
    return this.getChats(userId, type);
  },

  async createOrGetDirectChat(userAId: string, userBId: string, product?: any): Promise<{ conversation: Conversation }> {
    const res = await fetch('/api/chats/direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userAId, userBId, product }),
    });
    return res.json();
  },

  async getMessages(conversationId: string): Promise<{ messages: Message[] }> {
    const res = await fetch(`/api/chats/${conversationId}/messages`);
    return res.json();
  },

  async sendMessage(conversationId: string, data: any): Promise<{ message: Message }> {
    const res = await fetch(`/api/chats/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async handleSocialRequest(conversationId: string, senderId: string, action: 'send' | 'accept' | 'reject'): Promise<any> {
    const res = await fetch(`/api/chats/${conversationId}/social-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId, action }),
    });
    return res.json();
  },

  // Statuses (24 hours)
  async getStatuses(): Promise<{ statuses: UserStatus[] }> {
    const res = await fetch('/api/statuses');
    return res.json();
  },

  async createStatus(statusData: any): Promise<{ status: UserStatus }> {
    const res = await fetch('/api/statuses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(statusData),
    });
    return res.json();
  },

  async viewStatus(statusId: string, userId: string): Promise<any> {
    const res = await fetch(`/api/statuses/${statusId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  async reactStatus(statusId: string, userId: string, emoji: string): Promise<any> {
    const res = await fetch(`/api/statuses/${statusId}/reaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, emoji }),
    });
    return res.json();
  },

  // Notifications
  async getNotifications(userId: string, category?: string): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
    const url = `/api/notifications?userId=${userId}${category ? `&category=${category}` : ''}`;
    const res = await fetch(url);
    return res.json();
  },

  async markNotificationRead(id: string): Promise<any> {
    const res = await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    return res.json();
  },

  async markAllNotificationsRead(userId: string): Promise<any> {
    const res = await fetch('/api/notifications/mark-all-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  // Seller Center: Analytics & Subscriptions
  async getSellerAnalytics(sellerId: string, range = '7days'): Promise<{ analytics: SellerAnalytics }> {
    const res = await fetch(`/api/seller/analytics?sellerId=${sellerId}&range=${range}`);
    return res.json();
  },

  async getSellerSubscription(sellerId: string): Promise<{ subscription: SellerSubscription; daysRemaining: number; isExpired: boolean; plans: any[] }> {
    const res = await fetch(`/api/seller/subscription?sellerId=${sellerId}`);
    return res.json();
  },

  async paySellerSubscription(data: any): Promise<any> {
    const res = await fetch('/api/seller/subscription/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Marketly AI
  async askAI(prompt: string, history: any[] = [], language: 'en' | 'ur' = 'en'): Promise<{ text: string }> {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, history, language }),
    });
    return res.json();
  },

  // Reports
  async submitReport(reportData: any): Promise<any> {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });
    return res.json();
  },

  // Admin
  async getAdminDashboard(adminId: string): Promise<any> {
    const res = await fetch(`/api/admin/dashboard?adminId=${adminId}`);
    return res.json();
  },

  async resolveReport(reportId: string, status: string, resolutionReason: string, adminId: string): Promise<any> {
    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, resolutionReason, adminId }),
    });
    return res.json();
  },

  // Groups
  async getGroups(userId?: string): Promise<{ groups: any[] }> {
    const url = `/api/groups${userId ? `?userId=${userId}` : ''}`;
    const res = await fetch(url);
    return res.json();
  },

  async createGroup(data: any): Promise<{ group: any; conversation: Conversation }> {
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateGroup(id: string, data: any): Promise<{ group: any; conversation: Conversation }> {
    const res = await fetch(`/api/groups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async addGroupMembers(id: string, memberIds: string[]): Promise<any> {
    const res = await fetch(`/api/groups/${id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberIds }),
    });
    return res.json();
  },

  async removeGroupMember(id: string, userId: string): Promise<any> {
    const res = await fetch(`/api/groups/${id}/members/${userId}`, { method: 'DELETE' });
    return res.json();
  },

  async updateGroupAdmin(id: string, targetUserId: string, action: 'promote' | 'demote'): Promise<any> {
    const res = await fetch(`/api/groups/${id}/admins`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId, action }),
    });
    return res.json();
  },

  // Channels
  async getChannels(userId?: string): Promise<{ channels: any[] }> {
    const url = `/api/channels${userId ? `?userId=${userId}` : ''}`;
    const res = await fetch(url);
    return res.json();
  },

  async createChannel(data: any): Promise<{ channel: any }> {
    const res = await fetch('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async toggleFollowChannel(channelId: string, userId: string): Promise<{ isFollowing: boolean; followersCount: number }> {
    const res = await fetch(`/api/channels/${channelId}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  async getChannelPosts(channelId: string): Promise<{ posts: any[] }> {
    const res = await fetch(`/api/channels/${channelId}/posts`);
    return res.json();
  },

  async broadcastChannelPost(channelId: string, data: any): Promise<{ post: any }> {
    const res = await fetch(`/api/channels/${channelId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async reactChannelPost(channelId: string, postId: string, emoji: string, userId: string): Promise<any> {
    const res = await fetch(`/api/channels/${channelId}/posts/${postId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji, userId }),
    });
    return res.json();
  },
};
