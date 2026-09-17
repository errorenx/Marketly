import {
  User,
  Product,
  Post,
  UserStatus,
  Conversation,
  Message,
  AppNotification,
  SellerSubscription,
  SellerAnalytics,
  ReportItem,
  UserRole,
  ContentType,
  ChannelItem,
  ChannelPost,
} from '../types';
import { localStore } from './localStore';
import { saveUserToSupabase } from './supabase';

async function safeFetch<T>(url: string, options?: RequestInit, fallback?: () => T): Promise<T> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      if (fallback) return fallback();
      throw new Error(`Request failed with status ${res.status}`);
    }
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Returned HTML (e.g. 404 page on GitHub Pages)
      if (fallback) return fallback();
      throw new Error('Invalid JSON response');
    }
    return await res.json();
  } catch (err) {
    if (fallback) {
      return fallback();
    }
    throw err;
  }
}

export const api = {
  // Auth
  async checkUsername(username: string): Promise<{ available: boolean; message: string }> {
    return safeFetch(
      `/api/auth/check-username?username=${encodeURIComponent(username)}`,
      undefined,
      () => {
        const users = localStore.getUsers();
        const exists = users.some((u) => u.username.toLowerCase() === username.toLowerCase());
        return {
          available: !exists,
          message: exists ? 'Username already taken' : 'Username available',
        };
      }
    );
  },

  async register(data: any): Promise<{ user: User }> {
    return safeFetch(
      '/api/auth/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        // Fallback for static GitHub Pages / offline:
        const users = localStore.getUsers();
        const existing = users.find(
          (u) => u.username.toLowerCase() === data.username?.toLowerCase() || u.email.toLowerCase() === data.email?.toLowerCase()
        );
        if (existing) {
          return { user: existing };
        }

        const newUser: User = {
          id: `usr_${Date.now()}`,
          firstName: data.firstName || 'User',
          lastName: data.lastName || '',
          username: data.username.toLowerCase(),
          email: data.email,
          phone: data.phone || '',
          role: data.role === 'SELLER' ? 'SELLER' : 'SOCIAL',
          avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
          bio: data.bio || '',
          description: data.description || '',
          country: 'Pakistan',
          city: data.city || 'Lahore',
          followersCount: 0,
          followingCount: 0,
          likesCount: 0,
          sellerSettings: data.role === 'SELLER' ? {
            businessName: data.sellerSettings?.businessName || `${data.firstName}'s Store`,
            welcomeMessage: 'Welcome! COD available across Pakistan.',
            completeAddress: `${data.city || 'Lahore'}, Pakistan`,
          } : undefined,
          privacySettings: {
            profilePrivacy: 'public',
            whoCanMessageMe: 'everyone',
            whoCanFollowMe: 'everyone',
            whoCanSendRequests: 'everyone',
            commentsEnabled: true,
            showLastSeen: true,
            showOnlineStatus: true,
          },
          createdAt: new Date().toISOString(),
        };

        users.push(newUser);
        localStore.saveUsers(users);

        // Also save to Supabase if credentials exist
        saveUserToSupabase(newUser).catch(() => {});

        return { user: newUser };
      }
    );
  },

  async login(loginId: string): Promise<{ user: User }> {
    return safeFetch(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId }),
      },
      () => {
        const users = localStore.getUsers();
        const clean = loginId.trim().toLowerCase();
        const user = users.find(
          (u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
        );
        if (!user) {
          // If demo quick login or matching first user
          if (users.length > 0) return { user: users[0] };
          throw new Error('No user found');
        }
        return { user };
      }
    );
  },

  // Users
  async getUsers(): Promise<{ users: User[] }> {
    return safeFetch('/api/users', undefined, () => ({ users: localStore.getUsers() }));
  },

  async getUser(id: string, isSelf = false): Promise<{ user: User }> {
    return safeFetch(`/api/users/${id}${isSelf ? '?self=true' : ''}`, undefined, () => {
      const users = localStore.getUsers();
      const user = users.find((u) => u.id === id || u.username === id) || users[0];
      return { user };
    });
  },

  async updateUser(id: string, updates: Partial<User>): Promise<{ user: User }> {
    return safeFetch(
      `/api/users/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      },
      () => {
        const users = localStore.getUsers();
        const idx = users.findIndex((u) => u.id === id);
        if (idx !== -1) {
          users[idx] = { ...users[idx], ...updates };
          localStore.saveUsers(users);
          return { user: users[idx] };
        }
        throw new Error('User not found');
      }
    );
  },

  // Feed & Posts (All in one: photos and videos unified!)
  async getFeed(role: UserRole, tab?: string): Promise<{ posts: Post[] }> {
    const queryTab = tab && tab !== 'all' ? `&tab=${tab}` : '';
    const url = `/api/feed?role=${role}${queryTab}`;
    return safeFetch(url, undefined, () => {
      let posts = localStore.getPosts();
      if (tab && tab !== 'all') {
        posts = posts.filter((p) => p.contentType === tab);
      }
      // Sort newest first
      posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { posts };
    });
  },

  async getVideoFeed(role: UserRole, tab?: string): Promise<{ videos: Post[] }> {
    const url = `/api/feed/videos?role=${role}${tab ? `&tab=${tab}` : ''}`;
    return safeFetch(url, undefined, () => {
      const posts = localStore.getPosts();
      const videos = posts.filter((p) => p.mediaType === 'video');
      return { videos };
    });
  },

  async createPost(data: any): Promise<{ post: Post }> {
    return safeFetch(
      '/api/feed/posts',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const posts = localStore.getPosts();
        const newPost: Post = {
          id: `post_${Date.now()}`,
          authorId: data.authorId,
          authorName: data.authorName,
          authorUsername: data.authorUsername,
          authorAvatar: data.authorAvatar,
          authorRole: data.authorRole || 'SELLER',
          authorCity: data.authorCity || 'Pakistan',
          contentType: data.contentType === 'seller' ? 'seller' : 'social',
          mediaType: data.mediaType || 'photo',
          mediaUrl: data.mediaUrl,
          storagePath: data.storagePath,
          caption: data.caption || '',
          productContext: data.productContext,
          likesCount: 0,
          commentsCount: 0,
          savesCount: 0,
          sharesCount: 0,
          isLiked: false,
          isSaved: false,
          comments: [],
          createdAt: new Date().toISOString(),
        };
        posts.unshift(newPost);
        localStore.savePosts(posts);
        return { post: newPost };
      }
    );
  },

  async likePost(postId: string, userId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    return safeFetch(
      `/api/feed/posts/${postId}/like`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      },
      () => {
        const posts = localStore.getPosts();
        const p = posts.find((item) => item.id === postId);
        if (p) {
          p.isLiked = !p.isLiked;
          p.likesCount = Math.max(0, p.likesCount + (p.isLiked ? 1 : -1));
          localStore.savePosts(posts);
          return { isLiked: p.isLiked, likesCount: p.likesCount };
        }
        return { isLiked: true, likesCount: 1 };
      }
    );
  },

  async addComment(postId: string, authorId: string, text: string): Promise<{ comment: any; commentsCount: number }> {
    return safeFetch(
      `/api/feed/posts/${postId}/comments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorId, text }),
      },
      () => {
        const posts = localStore.getPosts();
        const users = localStore.getUsers();
        const author = users.find((u) => u.id === authorId) || users[0];
        const p = posts.find((item) => item.id === postId);
        const comment = {
          id: `c_${Date.now()}`,
          postId,
          authorId,
          authorName: `${author.firstName} ${author.lastName}`,
          authorUsername: author.username,
          authorAvatar: author.avatar,
          text,
          createdAt: new Date().toISOString(),
        };
        if (p) {
          p.comments = p.comments || [];
          p.comments.push(comment);
          p.commentsCount = p.comments.length;
          localStore.savePosts(posts);
          return { comment, commentsCount: p.commentsCount };
        }
        return { comment, commentsCount: 1 };
      }
    );
  },

  // Products
  async getProducts(filter?: {
    category?: string;
    city?: string;
    sellerId?: string;
    search?: string;
    condition?: string;
    freeDelivery?: string;
    discountOnly?: string;
    sortBy?: string;
  }): Promise<{ products: Product[] }> {
    let url = '/api/products';
    const params = new URLSearchParams();
    if (filter?.category) params.append('category', filter.category);
    if (filter?.city) params.append('city', filter.city);
    if (filter?.sellerId) params.append('sellerId', filter.sellerId);
    if (filter?.search) params.append('search', filter.search);
    if (filter?.condition) params.append('condition', filter.condition);
    if (filter?.freeDelivery) params.append('freeDelivery', filter.freeDelivery);
    if (filter?.discountOnly) params.append('discountOnly', filter.discountOnly);
    if (filter?.sortBy) params.append('sortBy', filter.sortBy);
    if (params.toString()) url += `?${params.toString()}`;

    return safeFetch(url, undefined, () => {
      let products = localStore.getProducts();
      if (filter?.sellerId) {
        products = products.filter((p) => p.sellerId === filter.sellerId);
      }
      if (filter?.city) {
        products = products.filter((p) => p.sellerCity.toLowerCase() === filter.city?.toLowerCase());
      }
      if (filter?.category && filter.category !== 'All Categories') {
        products = products.filter((p) => p.category.toLowerCase() === filter.category?.toLowerCase());
      }
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        products = products.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
      }
      return { products };
    });
  },

  async getProduct(id: string): Promise<{ product: Product }> {
    return safeFetch(`/api/products/${id}`, undefined, () => {
      const products = localStore.getProducts();
      const product = products.find((p) => p.id === id) || products[0];
      return { product };
    });
  },

  async createProduct(productData: any): Promise<{ product: Product }> {
    return safeFetch(
      '/api/products',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      },
      () => {
        const products = localStore.getProducts();
        const newProduct: Product = {
          ...productData,
          id: `prod_${Date.now()}`,
          status: 'active',
          views: 1,
          likes: 0,
          saves: 0,
          shares: 0,
          orderNowClicks: 0,
          customerInquiries: 0,
          createdAt: new Date().toISOString(),
        };
        products.unshift(newProduct);
        localStore.saveProducts(products);
        return { product: newProduct };
      }
    );
  },

  // Status Stories (24-Hour)
  async getStatuses(userId?: string): Promise<{ statuses: UserStatus[] }> {
    const url = `/api/statuses${userId ? `?userId=${userId}` : ''}`;
    return safeFetch(url, undefined, () => ({
      statuses: localStore.getStatuses(),
    }));
  },

  async createStatus(data: any): Promise<{ status: UserStatus }> {
    return safeFetch(
      '/api/statuses',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const statuses = localStore.getStatuses();
        const users = localStore.getUsers();
        const author = users.find((u) => u.id === data.userId) || users[0];
        const newStatus: UserStatus = {
          id: `stat_${Date.now()}`,
          userId: author.id,
          userName: `${author.firstName} ${author.lastName}`,
          userAvatar: author.avatar,
          type: data.type || 'photo',
          mediaUrl: data.mediaUrl,
          storagePath: data.storagePath,
          content: data.caption || '',
          caption: data.caption,
          views: [],
          reactions: [],
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 3600000).toISOString(),
        };
        statuses.unshift(newStatus);
        localStore.saveStatuses(statuses);
        return { status: newStatus };
      }
    );
  },

  async viewStatus(statusId: string, viewerId: string): Promise<{ success: boolean; views?: any[] }> {
    return safeFetch(
      `/api/statuses/${statusId}/view`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewerId }),
      },
      () => {
        const statuses = localStore.getStatuses();
        const s = statuses.find((item) => item.id === statusId);
        if (s) {
          s.views = s.views || [];
          if (!s.views.some((v) => v.userId === viewerId)) {
            const users = localStore.getUsers();
            const viewer = users.find((u) => u.id === viewerId);
            if (viewer) {
              s.views.push({
                userId: viewer.id,
                userName: `${viewer.firstName} ${viewer.lastName}`,
                userAvatar: viewer.avatar,
                viewedAt: new Date().toISOString(),
              });
              localStore.saveStatuses(statuses);
            }
          }
          return { success: true, views: s.views };
        }
        return { success: true, views: [] };
      }
    );
  },

  async reactStatus(statusId: string, userId: string, emoji: string): Promise<{ success: boolean; reactions?: any[] }> {
    return safeFetch(
      `/api/statuses/${statusId}/react`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, emoji }),
      },
      () => {
        const statuses = localStore.getStatuses();
        const s = statuses.find((item) => item.id === statusId);
        if (s) {
          s.reactions = s.reactions || [];
          s.reactions.push({ userId, emoji });
          localStore.saveStatuses(statuses);
          return { success: true, reactions: s.reactions };
        }
        return { success: true, reactions: [{ userId, emoji }] };
      }
    );
  },

  // Chats & Conversations
  async getConversations(userId: string): Promise<{ conversations: Conversation[] }> {
    return safeFetch(`/api/conversations?userId=${userId}`, undefined, () => ({
      conversations: [],
    }));
  },

  async getChats(userId: string, chatType?: string): Promise<{ conversations: Conversation[] }> {
    return safeFetch(`/api/conversations?userId=${userId}${chatType ? `&type=${chatType}` : ''}`, undefined, () => ({
      conversations: [],
    }));
  },

  async getMessages(conversationId: string): Promise<{ messages: Message[] }> {
    return safeFetch(`/api/conversations/${conversationId}/messages`, undefined, () => ({
      messages: [],
    }));
  },

  async sendMessage(arg1: string | any, arg2?: any): Promise<{ message: Message }> {
    const conversationId = typeof arg1 === 'string' ? arg1 : arg1?.conversationId;
    const payload = typeof arg1 === 'string' ? { ...arg2, conversationId } : arg1;

    return safeFetch(
      `/api/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      () => ({
        message: {
          id: `msg_${Date.now()}`,
          conversationId,
          senderId: payload.senderId,
          senderName: payload.senderName || 'User',
          senderAvatar: payload.senderAvatar || '',
          text: payload.text || '',
          status: 'sent',
          timestamp: new Date().toISOString(),
        },
      })
    );
  },

  async handleSocialRequest(conversationId: string, userId: string, action: string): Promise<{ status: string }> {
    return safeFetch(
      `/api/conversations/${conversationId}/social-request`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      },
      () => ({
        status: action === 'send' ? 'pending' : action === 'accept' ? 'accepted' : 'none',
      })
    );
  },

  async createGroup(data: any): Promise<{ conversation: Conversation }> {
    return safeFetch(
      '/api/conversations/group',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const conv: Conversation = {
          id: `grp_${Date.now()}`,
          type: 'group',
          participantIds: [data.creatorId],
          participants: [],
          groupMeta: {
            name: data.name,
            description: data.description,
            creatorId: data.creatorId,
            adminIds: [data.creatorId],
            memberIds: [data.creatorId],
            onlyAdminsCanPost: data.onlyAdminsCanPost || false,
            onlyAdminsCanEditInfo: data.onlyAdminsCanEditInfo || false,
          },
          unreadCount: 0,
          updatedAt: new Date().toISOString(),
        };
        return { conversation: conv };
      }
    );
  },

  async createChannel(data: any): Promise<{ channel: any }> {
    return safeFetch(
      '/api/channels',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => ({
        channel: {
          id: `chn_${Date.now()}`,
          name: data.name,
          description: data.description,
          ownerId: data.ownerId,
          followersCount: 1,
          isFollowing: true,
          createdAt: new Date().toISOString(),
        },
      })
    );
  },

  async getChannels(userId?: string): Promise<{ channels: ChannelItem[] }> {
    return safeFetch(`/api/channels${userId ? `?userId=${userId}` : ''}`, undefined, () => ({
      channels: [],
    }));
  },

  async getChannelPosts(channelId: string): Promise<{ posts: ChannelPost[] }> {
    return safeFetch(`/api/channels/${channelId}/posts`, undefined, () => ({
      posts: [],
    }));
  },

  async broadcastChannelPost(channelId: string, data: any): Promise<{ post: ChannelPost }> {
    return safeFetch(
      `/api/channels/${channelId}/posts`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => ({
        post: {
          id: `chp_${Date.now()}`,
          channelId,
          authorId: data.authorId,
          authorName: 'Channel Admin',
          authorAvatar: '',
          text: data.text,
          reactions: { '👍': 1, '❤️': 1 },
          sharesCount: 0,
          createdAt: new Date().toISOString(),
        },
      })
    );
  },

  async reactChannelPost(
    channelId: string,
    postId: string,
    emoji: string,
    userId: string
  ): Promise<{ reactions: Record<string, number>; userReacted: string }> {
    return safeFetch(
      `/api/channels/${channelId}/posts/${postId}/react`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, userId }),
      },
      () => ({
        reactions: { [emoji]: 1 },
        userReacted: emoji,
      })
    );
  },

  async toggleFollowChannel(channelId: string, userId: string): Promise<{ isFollowing: boolean; followersCount: number }> {
    return safeFetch(
      `/api/channels/${channelId}/follow`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      },
      () => ({
        isFollowing: true,
        followersCount: 12,
      })
    );
  },

  async updateGroup(groupId: string, updates: any): Promise<{ conversation: Conversation }> {
    return safeFetch(
      `/api/conversations/${groupId}/update`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      },
      () => ({
        conversation: {
          id: groupId,
          type: 'group',
          participantIds: [],
          participants: [],
          groupMeta: {
            name: updates.name || 'Group',
            description: updates.description || '',
            adminIds: [],
            memberIds: [],
            onlyAdminsCanPost: updates.onlyAdminsCanPost ?? false,
            onlyAdminsCanEditInfo: updates.onlyAdminsCanEditInfo ?? false,
          },
          unreadCount: 0,
          updatedAt: new Date().toISOString(),
        },
      })
    );
  },

  async updateGroupAdmin(groupId: string, targetUserId: string, role: string): Promise<{ conversation: Conversation }> {
    return safeFetch(
      `/api/conversations/${groupId}/admins`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, role }),
      },
      () => ({
        conversation: {
          id: groupId,
          type: 'group',
          participantIds: [],
          participants: [],
          unreadCount: 0,
          updatedAt: new Date().toISOString(),
        },
      })
    );
  },

  async removeGroupMember(groupId: string, targetUserId: string): Promise<{ success: boolean }> {
    return safeFetch(
      `/api/conversations/${groupId}/members/${targetUserId}`,
      { method: 'DELETE' },
      () => ({ success: true })
    );
  },

  async askAI(query: string, history?: any[], language = 'en'): Promise<{ text: string }> {
    return safeFetch(
      '/api/ai/chat',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, history, language }),
      },
      () => ({
        text: `Marketly AI Assistant: I'm here to help you navigate Pakistani products, sellers, and Cash on Delivery order assistance. What would you like to explore?`,
      })
    );
  },

  async deactivateUser(id: string, reason?: string, deactivate = true): Promise<{ success: boolean; isDeactivated: boolean }> {
    return safeFetch(
      `/api/users/${id}/deactivate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, deactivate }),
      },
      () => ({ success: true, isDeactivated: deactivate })
    );
  },

  async deleteUser(id: string): Promise<{ success: boolean }> {
    return safeFetch(
      `/api/users/${id}`,
      { method: 'DELETE' },
      () => {
        const users = localStore.getUsers().filter((u) => u.id !== id);
        localStore.saveUsers(users);
        return { success: true };
      }
    );
  },

  async createOrGetDirectChat(
    userId: string,
    targetUserId: string,
    productContext?: any
  ): Promise<{ conversation: Conversation }> {
    return safeFetch(
      '/api/conversations/direct',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, targetUserId, productContext }),
      },
      () => {
        const users = localStore.getUsers();
        const me = users.find((u) => u.id === userId) || users[0];
        const them = users.find((u) => u.id === targetUserId) || users[1] || users[0];

        const conv: Conversation = {
          id: `conv_${userId}_${targetUserId}`,
          type: productContext ? 'seller' : 'social',
          participantIds: [userId, targetUserId],
          participants: [
            {
              id: me.id,
              name: `${me.firstName} ${me.lastName}`,
              username: me.username,
              avatar: me.avatar,
              role: me.role,
            },
            {
              id: them.id,
              name: `${them.firstName} ${them.lastName}`,
              username: them.username,
              avatar: them.avatar,
              role: them.role,
            },
          ],
          productContext: productContext
            ? {
                productId: productContext.id,
                productName: productContext.name,
                productPrice: productContext.originalPrice,
                productDiscount: productContext.discount,
                finalPrice: productContext.finalPrice,
                productImage: productContext.mediaUrls?.[0] || '',
                sellerId: productContext.sellerId,
                sellerName: productContext.sellerName || them.firstName,
                sellerCity: productContext.sellerCity || 'Pakistan',
                freeDelivery: productContext.freeDelivery,
                warranty: productContext.warranty,
                warrantyDuration: productContext.warrantyDuration,
              }
            : undefined,
          unreadCount: 0,
          updatedAt: new Date().toISOString(),
        };
        return { conversation: conv };
      }
    );
  },

  async startOrderInquiry(buyerId: string, productId: string): Promise<{ conversation: Conversation }> {
    return safeFetch(
      '/api/conversations/order-inquiry',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId, productId }),
      },
      () => {
        const users = localStore.getUsers();
        const products = localStore.getProducts();
        const prod = products.find((p) => p.id === productId) || products[0];
        const buyer = users.find((u) => u.id === buyerId) || users[0];
        const seller = users.find((u) => u.id === prod.sellerId) || users[0];

        const conv: Conversation = {
          id: `conv_${Date.now()}`,
          type: 'seller',
          participantIds: [buyer.id, seller.id],
          participants: [
            {
              id: buyer.id,
              name: `${buyer.firstName} ${buyer.lastName}`,
              username: buyer.username,
              avatar: buyer.avatar,
              role: buyer.role,
            },
            {
              id: seller.id,
              name: `${seller.firstName} ${seller.lastName}`,
              username: seller.username,
              avatar: seller.avatar,
              role: seller.role,
            },
          ],
          productContext: {
            productId: prod.id,
            productName: prod.name,
            productPrice: prod.originalPrice,
            productDiscount: prod.discount,
            finalPrice: prod.finalPrice,
            productImage: prod.mediaUrls[0],
            sellerId: seller.id,
            sellerName: `${seller.firstName} ${seller.lastName}`,
            sellerCity: seller.city,
            freeDelivery: prod.freeDelivery,
            warranty: prod.warranty,
            warrantyDuration: prod.warrantyDuration,
          },
          unreadCount: 0,
          updatedAt: new Date().toISOString(),
        };
        return { conversation: conv };
      }
    );
  },

  // Notifications
  async getNotifications(userId: string, category?: string): Promise<{ notifications: AppNotification[] }> {
    const url = `/api/notifications?userId=${userId}${category ? `&category=${category}` : ''}`;
    return safeFetch(url, undefined, () => ({
      notifications: [],
    }));
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return safeFetch(`/api/notifications/${id}/read`, { method: 'POST' }, () => ({ success: true }));
  },

  async markAllNotificationsRead(userId: string): Promise<{ success: boolean }> {
    return safeFetch(`/api/notifications/read-all`, { method: 'POST', body: JSON.stringify({ userId }) }, () => ({ success: true }));
  },

  // Seller Center: Free access without payment blockers
  async getSellerSubscription(sellerId: string): Promise<{ subscription: SellerSubscription; plans: any[]; daysRemaining: number; isExpired: boolean }> {
    return safeFetch(`/api/seller/subscription?sellerId=${sellerId}`, undefined, () => ({
      subscription: {
        userId: sellerId,
        status: 'active',
        planName: 'Marketly Verified Seller',
        trialStartDate: new Date().toISOString(),
        trialEndDate: new Date(Date.now() + 365 * 86400000).toISOString(),
        expiryDate: new Date(Date.now() + 365 * 86400000).toISOString(),
      },
      plans: [],
      daysRemaining: 365,
      isExpired: false,
    }));
  },

  async getSellerAnalytics(sellerId: string, range = '7days'): Promise<{ analytics: SellerAnalytics }> {
    return safeFetch(`/api/seller/analytics?sellerId=${sellerId}&range=${range}`, undefined, () => {
      const products = localStore.getProducts().filter((p) => p.sellerId === sellerId);
      const totalViews = products.reduce((acc, p) => acc + (p.views || 0), 0);
      const totalLikes = products.reduce((acc, p) => acc + (p.likes || 0), 0);
      const totalSaves = products.reduce((acc, p) => acc + (p.saves || 0), 0);
      const totalShares = products.reduce((acc, p) => acc + (p.shares || 0), 0);
      const totalOrderClicks = products.reduce((acc, p) => acc + (p.orderNowClicks || 0), 0);

      return {
        analytics: {
          timeRange: '7days',
          totalViews: totalViews || 24,
          productViews: totalViews || 24,
          likes: totalLikes || 12,
          comments: 3,
          saves: totalSaves || 5,
          shares: totalShares || 2,
          followers: 28,
          following: 14,
          orderNowClicks: totalOrderClicks || 3,
          customerInquiries: 2,
          productBreakdown: products.map((p) => ({
            productId: p.id,
            productName: p.name,
            views: p.views || 1,
            likes: p.likes || 0,
            saves: p.saves || 0,
            orderNowClicks: p.orderNowClicks || 0,
            inquiries: p.customerInquiries || 0,
          })),
        },
      };
    });
  },

  async getAdminDashboard(userId?: string): Promise<any> {
    return safeFetch(`/api/admin/dashboard${userId ? `?adminId=${userId}` : ''}`, undefined, () => ({
      totalUsers: 2,
      activeUsers: 2,
      sellers: 1,
      buyers: 0,
      socialUsers: 1,
      activeSubscriptions: 1,
      trialSellers: 0,
      expiredSellers: 0,
      products: 1,
      posts: 1,
      messagesCount: 0,
      reportsCount: 0,
      reports: [],
      auditLogs: [],
    }));
  },

  async resolveReport(reportId: string, status: string, reason?: string, adminId?: string): Promise<{ success: boolean }> {
    return safeFetch(
      `/api/admin/reports/${reportId}/resolve`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason, adminId }),
      },
      () => ({ success: true })
    );
  },

  // Media upload - supports both File object or direct Base64 object
  async uploadMedia(
    fileOrData: File | { fileData: string; fileName?: string; fileType?: string; mediaType?: 'photo' | 'video' }
  ): Promise<{ url: string; storagePath: string; media_url: string; storage_path: string; mediaType: 'photo' | 'video' }> {
    if ('fileData' in fileOrData) {
      const isVideo = fileOrData.mediaType === 'video' || fileOrData.fileType?.startsWith('video');
      const mockPath = `uploads/${Date.now()}_${fileOrData.fileName || 'media'}`;
      return {
        url: fileOrData.fileData,
        storagePath: mockPath,
        media_url: fileOrData.fileData,
        storage_path: mockPath,
        mediaType: isVideo ? 'video' : 'photo',
      };
    }

    const file = fileOrData as File;
    return new Promise((resolve) => {
      const reader = new FileReader();
      const isVideo = file.type.startsWith('video');
      reader.onloadend = () => {
        const resUrl = reader.result as string;
        const mockPath = `uploads/${Date.now()}_${file.name}`;
        resolve({
          url: resUrl,
          storagePath: mockPath,
          media_url: resUrl,
          storage_path: mockPath,
          mediaType: isVideo ? 'video' : 'photo',
        });
      };
      reader.readAsDataURL(file);
    });
  },
};
