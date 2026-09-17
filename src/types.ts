export type UserRole = 'SELLER' | 'SOCIAL' | 'ADMIN';
export type Language = 'en' | 'ur';

export interface PrivacySettings {
  profilePrivacy: 'public' | 'private';
  whoCanMessageMe: 'everyone' | 'connections' | 'none';
  whoCanFollowMe: 'everyone' | 'requested';
  whoCanSendRequests: 'everyone' | 'mutual' | 'none';
  commentsEnabled: boolean;
  showLastSeen: boolean;
  showOnlineStatus: boolean;
}

export interface SellerSettings {
  welcomeMessage: string;
  businessName: string;
  completeAddress: string; // Private - stored securely, never shown publicly
  returnPolicyText?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string; // Private
  phone?: string;
  role: UserRole;
  avatar: string;
  bio: string;
  description: string;
  country: string; // Default: Pakistan
  city: string; // Public
  followersCount: number;
  followingCount: number;
  likesCount: number;
  isBlocked?: boolean;
  isDeactivated?: boolean;
  deactivationReason?: string;
  privacy?: any;
  privacySettings?: PrivacySettings;
  sellerSettings?: SellerSettings;
  createdAt: string;
}

export interface ProductContext {
  productId: string;
  productName: string;
  productPrice: number;
  productDiscount?: number;
  finalPrice: number;
  productImage: string;
  sellerId: string;
  sellerName: string;
  sellerCity: string;
  freeDelivery: boolean;
  warranty: boolean;
  warrantyDuration?: string;
}

export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerUsername: string;
  sellerAvatar: string;
  sellerCity: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  condition: 'New' | 'Used';
  whatItIs: string;
  whatItIsUsedFor: string;
  description: string;
  features: string[];
  specifications: Record<string, string>;
  size?: string;
  color?: string;
  quantity: number;
  availableQuantity?: number;
  originalPrice: number;
  discount: number; // percentage
  finalPrice: number;
  guarantee: boolean;
  warranty: boolean;
  warrantyDuration: string;
  deliveryAvailable: boolean;
  deliveryCharges: number;
  freeDelivery: boolean;
  estimatedDeliveryTime: string;
  returnPolicy: string;
  refundPolicy: string;
  otherDetails?: string;
  mediaUrls: string[];
  status: 'active' | 'pending' | 'flagged' | 'paused';
  views: number;
  likes: number;
  saves: number;
  shares: number;
  orderNowClicks: number;
  customerInquiries: number;
  createdAt: string;
}

export type ContentType = 'seller' | 'social';

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
  replies?: Comment[];
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  authorRole: UserRole;
  authorCity: string;
  contentType: ContentType;
  mediaType: 'photo' | 'video';
  mediaUrl: string;
  storagePath?: string;
  caption: string;
  tags?: string[];
  productContext?: ProductContext;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  sharesCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  comments?: Comment[];
  createdAt: string;
}

export interface StatusView {
  userId: string;
  userName: string;
  userAvatar: string;
  viewedAt: string;
}

export interface StatusReaction {
  userId: string;
  emoji: string;
}

export interface UserStatus {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'text' | 'photo' | 'video';
  mediaType?: 'text' | 'photo' | 'video';
  content: string; // text caption or status text
  caption?: string;
  mediaUrl?: string;
  storagePath?: string;
  bgGradient?: string;
  views: StatusView[];
  viewCount?: number;
  reactions: StatusReaction[];
  createdAt: string;
  expiresAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  productContext?: ProductContext;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  timestamp: string;
}

export interface GroupMeta {
  id?: string;
  name: string;
  description: string;
  photo?: string;
  creatorId?: string;
  adminIds: string[];
  memberIds: string[];
  onlyAdminsCanPost: boolean;
  onlyAdminsCanEditInfo: boolean;
}

export interface ChannelMeta {
  id?: string;
  name: string;
  description: string;
  photo: string;
  ownerId: string;
  adminIds: string[];
  followerIds: string[];
}

export interface ChannelPost {
  id: string;
  channelId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  productId?: string;
  productName?: string;
  productPrice?: number;
  productImage?: string;
  reactions: Record<string, number>;
  userReactions?: Record<string, string>;
  sharesCount: number;
  createdAt: string;
}

export interface ChannelItem {
  id: string;
  name: string;
  description: string;
  photo: string;
  ownerId: string;
  ownerName?: string;
  adminIds: string[];
  followerIds: string[];
  isFollowing?: boolean;
  followersCount?: number;
  createdAt: string;
}

export interface Conversation {
  id: string;
  type: 'social' | 'seller' | 'group' | 'channel';
  participantIds: string[];
  participants: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    role: UserRole;
    isOnline?: boolean;
    lastSeen?: string;
  }[];
  productContext?: ProductContext;
  lastMessage?: Message;
  unreadCount: number;
  socialRequestStatus?: 'none' | 'pending' | 'accepted' | 'rejected';
  socialRequestSenderId?: string;
  socialRequestedBy?: string;
  isGroup?: boolean;
  groupName?: string;
  groupAvatar?: string;
  groupMeta?: GroupMeta;
  isChannel?: boolean;
  channelMeta?: ChannelMeta;
  updatedAt: string;
}

export type NotificationCategory = 
  | 'status'
  | 'likes'
  | 'comments'
  | 'followers'
  | 'requests'
  | 'messages'
  | 'marketplace'
  | 'seller'
  | 'security'
  | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  message: string;
  body?: string;
  targetType?: 'post' | 'product' | 'chat' | 'profile' | 'subscription' | 'status' | 'user';
  targetId?: string;
  avatar?: string;
  isRead: boolean;
  createdAt: string;
  actionData?: {
    requestId?: string;
    senderId?: string;
    senderName?: string;
    status?: 'pending' | 'accepted' | 'rejected';
  };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  months: number;
  price: number;
  currency: string;
  discountPercent: number;
}

export type SubscriptionStatus = 'trial_active' | 'active' | 'payment_pending' | 'payment_failed' | 'expired';

export interface SellerSubscription {
  userId: string;
  status: SubscriptionStatus;
  planId?: string;
  planName?: string;
  trialStartDate: string;
  trialEndDate: string;
  subscriptionStartDate?: string;
  expiryDate: string;
  expiresAt?: string;
  paymentMethod?: 'easypaisa' | 'jazzcash' | 'bank' | 'card';
  transactionId?: string;
  lastPaymentDate?: string;
}

export interface SellerAnalytics {
  timeRange: 'today' | '7days' | '30days' | 'all';
  totalViews: number;
  productViews: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  followers: number;
  following: number;
  orderNowClicks: number; // NOTE: Explicitly NOT confirmed sales
  customerInquiries: number;
  productBreakdown: {
    productId: string;
    productName: string;
    views: number;
    likes: number;
    saves: number;
    orderNowClicks: number;
    inquiries: number;
  }[];
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  userId: string;
  title: string;
  messages: AIMessage[];
  updatedAt: string;
}

export interface ReportItem {
  id: string;
  reporterId: string;
  reporterUsername: string;
  targetType: 'user' | 'product' | 'post' | 'comment' | 'group' | 'channel';
  targetId: string;
  targetTitle: string;
  reason: string;
  details?: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  target: string;
  reason: string;
  timestamp: string;
}
