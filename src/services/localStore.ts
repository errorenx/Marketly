import { User, Product, Post, UserStatus, Conversation, Message, AppNotification, SellerSubscription, SellerAnalytics } from '../types';

export const AUTHENTIC_SEED_USERS: User[] = [
  {
    id: 'usr_seller_1',
    firstName: 'Zayd',
    lastName: 'Khan',
    username: 'zayd_gadgets',
    email: 'zayd@gadgetspk.com',
    phone: '0300-4521890',
    role: 'SELLER',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    bio: 'Official Electronics & Audio Store in Lahore. Cash on Delivery across Pakistan.',
    description: 'Specializing in verified authentic wireless earbuds, headphones, mechanical keyboards, and phone accessories.',
    country: 'Pakistan',
    city: 'Lahore',
    followersCount: 28,
    followingCount: 14,
    likesCount: 54,
    privacySettings: {
      profilePrivacy: 'public',
      whoCanMessageMe: 'everyone',
      whoCanFollowMe: 'everyone',
      whoCanSendRequests: 'everyone',
      commentsEnabled: true,
      showLastSeen: true,
      showOnlineStatus: true,
    },
    sellerSettings: {
      welcomeMessage: 'Assalam o Alaikum! Welcome to Zayd Gadgets. Free checking warranty on all COD orders.',
      businessName: 'Zayd Gadgets & Electronics',
      completeAddress: 'Hafeez Centre, Main Boulevard Gulberg, Lahore',
      returnPolicyText: '7-day checking warranty on all products. Parcel inspection allowed with rider.',
    },
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'usr_seller_2',
    firstName: 'Ayesha',
    lastName: 'Malik',
    username: 'ayesha_couture',
    email: 'ayesha@couturepk.com',
    phone: '0321-9876543',
    role: 'SELLER',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    bio: 'Contemporary pret & handcrafted fabrics. Fast COD delivery nationwide.',
    description: 'Designer boutique focusing on authentic handloom silks, organza and seasonal lawn collections.',
    country: 'Pakistan',
    city: 'Karachi',
    followersCount: 42,
    followingCount: 19,
    likesCount: 89,
    privacySettings: {
      profilePrivacy: 'public',
      whoCanMessageMe: 'everyone',
      whoCanFollowMe: 'everyone',
      whoCanSendRequests: 'everyone',
      commentsEnabled: true,
      showLastSeen: true,
      showOnlineStatus: true,
    },
    sellerSettings: {
      welcomeMessage: 'Hello! Thank you for contacting Malik Couture. We are delighted to assist with sizing and COD shipment.',
      businessName: 'Malik Couture',
      completeAddress: 'Zamzama Commercial Lane 5, DHA Phase 5, Karachi',
      returnPolicyText: 'Exchange within 3 days for sizing. Delivered via COD with parcel inspection option.',
    },
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'usr_social_1',
    firstName: 'Sara',
    lastName: 'Noor',
    username: 'sara_social',
    email: 'sara@social.pk',
    phone: '0333-1122334',
    role: 'SOCIAL',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    bio: 'Lifestyle, city aesthetics, tech unboxing & food discoveries 🌸',
    description: 'Sharing daily reels, honest shopping recommendations, and local travel stories across Pakistan.',
    country: 'Pakistan',
    city: 'Islamabad',
    followersCount: 35,
    followingCount: 22,
    likesCount: 76,
    privacySettings: {
      profilePrivacy: 'public',
      whoCanMessageMe: 'everyone',
      whoCanFollowMe: 'everyone',
      whoCanSendRequests: 'everyone',
      commentsEnabled: true,
      showLastSeen: true,
      showOnlineStatus: true,
    },
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  }
];

export const AUTHENTIC_SEED_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    sellerId: 'usr_seller_1',
    sellerName: 'Zayd Khan',
    sellerUsername: 'zayd_gadgets',
    sellerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    sellerCity: 'Lahore',
    name: 'Sony WH-1000XM5 Wireless Headphones',
    category: 'Electronics',
    brand: 'Sony',
    model: 'WH-1000XM5',
    condition: 'New',
    whatItIs: 'Industry-leading wireless noise canceling over-ear headphones.',
    whatItIsUsedFor: 'Audiophile listening, Zoom conference calls, travel, and mobile gaming.',
    description: '100% Brand new original Sony WH-1000XM5 in box. Auto NC Optimizer, 8 microphones, ultra-comfortable lightweight design. Cash on Delivery across Pakistan.',
    features: ['Noise Canceling', '30-Hour Battery Life', 'Speak-to-Chat Technology', 'Multipoint connection'],
    specifications: {
      Driver: '30mm Precision Driver',
      Bluetooth: '5.2 (LDAC, AAC)',
      Charging: 'USB-C Quick Charge',
      Weight: '250g',
    },
    color: 'Midnight Silver',
    quantity: 6,
    originalPrice: 95000,
    discount: 10,
    finalPrice: 85500,
    guarantee: true,
    warranty: true,
    warrantyDuration: '1 Year Official Warranty',
    deliveryAvailable: true,
    deliveryCharges: 0,
    freeDelivery: true,
    estimatedDeliveryTime: '2-3 Days via Leopard Courier',
    returnPolicy: '7-day checking warranty. Open parcel inspection on COD.',
    refundPolicy: 'Instant replacement or full refund if defective upon delivery.',
    mediaUrls: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
    ],
    status: 'active',
    views: 24,
    likes: 12,
    saves: 5,
    shares: 2,
    orderNowClicks: 3,
    customerInquiries: 2,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'prod_2',
    sellerId: 'usr_seller_1',
    sellerName: 'Zayd Khan',
    sellerUsername: 'zayd_gadgets',
    sellerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    sellerCity: 'Lahore',
    name: 'Keychron K2 Pro Mechanical Wireless Keyboard',
    category: 'Computers & Gaming',
    brand: 'Keychron',
    model: 'K2 Pro RGB Hot-Swap',
    condition: 'New',
    whatItIs: '75% compact wireless mechanical keyboard with QMK/VIA support and PBT keycaps.',
    whatItIsUsedFor: 'Coding, professional typing, and esports gaming on Mac and Windows.',
    description: 'South-facing RGB, hot-swappable Keychron K Pro Red linear switches, pre-lubed stabilizers. Connects up to 3 devices wirelessly.',
    features: ['QMK/VIA Programmable', 'Double-Shot PBT Keycaps', 'Bluetooth 5.1 & Type-C', 'Hot-Swappable'],
    specifications: {
      Layout: '75% Compact (84 Keys)',
      Switches: 'Keychron K Pro Red',
      Battery: '4000mAh',
    },
    color: 'Carbon Black',
    quantity: 10,
    originalPrice: 28000,
    discount: 15,
    finalPrice: 23800,
    guarantee: true,
    warranty: true,
    warrantyDuration: '6 Months Seller Warranty',
    deliveryAvailable: true,
    deliveryCharges: 250,
    freeDelivery: false,
    estimatedDeliveryTime: '2 Days across Pakistan',
    returnPolicy: '5 days replacement guarantee for any switch issues.',
    refundPolicy: 'Refund within 3 business days if unrepairable.',
    mediaUrls: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    ],
    status: 'active',
    views: 18,
    likes: 8,
    saves: 4,
    shares: 1,
    orderNowClicks: 2,
    customerInquiries: 1,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'prod_3',
    sellerId: 'usr_seller_2',
    sellerName: 'Ayesha Malik',
    sellerUsername: 'ayesha_couture',
    sellerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    sellerCity: 'Karachi',
    name: 'Hand-Embroidered Pure Silk Festive Kurti',
    category: 'Fashion & Apparel',
    brand: 'Malik Couture',
    model: 'Zeenat Festive Edition',
    condition: 'New',
    whatItIs: 'Hand-crafted luxury raw silk kurti with intricate tilla work and organza border.',
    whatItIsUsedFor: 'Festive occasions, weddings, dinner parties, and Eid gatherings.',
    description: 'Finely stitched pure mulberry raw silk with detailed threadwork. Comes with matching embroidered dupatta.',
    features: ['100% Pure Raw Silk', 'Handloom Embroidered', 'Colorfast Guarantee'],
    specifications: {
      Fabric: 'Pure Raw Silk 80g',
      Sizes: 'S, M, L, XL',
      Includes: 'Kurti + Silk Dupatta',
    },
    color: 'Emerald Green',
    quantity: 12,
    originalPrice: 16500,
    discount: 10,
    finalPrice: 14850,
    guarantee: true,
    warranty: false,
    warrantyDuration: 'Checking warranty upon delivery',
    deliveryAvailable: true,
    deliveryCharges: 0,
    freeDelivery: true,
    estimatedDeliveryTime: '2-3 Days via TCS COD',
    returnPolicy: '3-day size exchange guarantee.',
    refundPolicy: 'Replacement provided if damaged in transit.',
    mediaUrls: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
    ],
    status: 'active',
    views: 31,
    likes: 19,
    saves: 7,
    shares: 3,
    orderNowClicks: 4,
    customerInquiries: 3,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  }
];

export const AUTHENTIC_SEED_POSTS: Post[] = [
  {
    id: 'post_seller_1',
    authorId: 'usr_seller_1',
    authorName: 'Zayd Khan',
    authorUsername: 'zayd_gadgets',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    authorRole: 'SELLER',
    authorCity: 'Lahore',
    contentType: 'seller',
    mediaType: 'photo',
    mediaUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    caption: 'Official stock arrived: Sony WH-1000XM5 in Midnight Silver! Authentic sealed unit with 1-year brand warranty. Tap ORDER NOW to initiate direct COD inquiry.',
    productContext: {
      productId: 'prod_1',
      productName: 'Sony WH-1000XM5 Wireless Headphones',
      productPrice: 95000,
      productDiscount: 10,
      finalPrice: 85500,
      productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      sellerId: 'usr_seller_1',
      sellerName: 'Zayd Khan',
      sellerCity: 'Lahore',
      freeDelivery: true,
      warranty: true,
      warrantyDuration: '1 Year Official Warranty',
    },
    likesCount: 14,
    commentsCount: 2,
    savesCount: 5,
    sharesCount: 2,
    isLiked: false,
    isSaved: false,
    comments: [
      {
        id: 'c1',
        postId: 'post_seller_1',
        authorId: 'usr_social_1',
        authorName: 'Sara Noor',
        authorUsername: 'sara_social',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
        text: 'Does it come with parcel open checking on delivery in Islamabad?',
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      },
      {
        id: 'c2',
        postId: 'post_seller_1',
        authorId: 'usr_seller_1',
        authorName: 'Zayd Khan',
        authorUsername: 'zayd_gadgets',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        text: '@sara_social Yes! You can inspect the package with courier rider before paying cash.',
        createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: 'post_video_1',
    authorId: 'usr_seller_1',
    authorName: 'Zayd Khan',
    authorUsername: 'zayd_gadgets',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    authorRole: 'SELLER',
    authorCity: 'Lahore',
    contentType: 'seller',
    mediaType: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-working-on-a-laptop-in-a-coffee-shop-40030-large.mp4',
    caption: '🎥 Live unboxing and quick sound test! Experience pure ANC clarity. Click ORDER NOW below to get your unit dispatched with free COD shipping.',
    productContext: {
      productId: 'prod_2',
      productName: 'Keychron K2 Pro Mechanical Wireless Keyboard',
      productPrice: 28000,
      productDiscount: 15,
      finalPrice: 23800,
      productImage: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
      sellerId: 'usr_seller_1',
      sellerName: 'Zayd Khan',
      sellerCity: 'Lahore',
      freeDelivery: false,
      warranty: true,
      warrantyDuration: '6 Months Warranty',
    },
    likesCount: 22,
    commentsCount: 3,
    savesCount: 8,
    sharesCount: 4,
    isLiked: false,
    isSaved: false,
    comments: [],
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: 'post_seller_2',
    authorId: 'usr_seller_2',
    authorName: 'Ayesha Malik',
    authorUsername: 'ayesha_couture',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    authorRole: 'SELLER',
    authorCity: 'Karachi',
    contentType: 'seller',
    mediaType: 'photo',
    mediaUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
    caption: '✨ Zeenat Festive Silk Kurti in Emerald Green. Hand-embroidered with tilla motifs. Tap ORDER NOW for sizing guide & Cash on Delivery.',
    productContext: {
      productId: 'prod_3',
      productName: 'Hand-Embroidered Pure Silk Festive Kurti',
      productPrice: 16500,
      productDiscount: 10,
      finalPrice: 14850,
      productImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
      sellerId: 'usr_seller_2',
      sellerName: 'Ayesha Malik',
      sellerCity: 'Karachi',
      freeDelivery: true,
      warranty: false,
    },
    likesCount: 31,
    commentsCount: 4,
    savesCount: 9,
    sharesCount: 3,
    isLiked: false,
    isSaved: false,
    comments: [],
    createdAt: new Date(Date.now() - 14 * 3600000).toISOString(),
  },
  {
    id: 'post_social_1',
    authorId: 'usr_social_1',
    authorName: 'Sara Noor',
    authorUsername: 'sara_social',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    authorRole: 'SOCIAL',
    authorCity: 'Islamabad',
    contentType: 'social',
    mediaType: 'photo',
    mediaUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    caption: 'Working from this serene spot in Islamabad today ☕ Exploring new mechanical keyboards and creative tools on Marketly.',
    likesCount: 18,
    commentsCount: 2,
    savesCount: 3,
    sharesCount: 1,
    isLiked: false,
    isSaved: false,
    comments: [],
    createdAt: new Date(Date.now() - 18 * 3600000).toISOString(),
  },
  {
    id: 'post_social_2',
    authorId: 'usr_social_1',
    authorName: 'Sara Noor',
    authorUsername: 'sara_social',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    authorRole: 'SOCIAL',
    authorCity: 'Islamabad',
    contentType: 'social',
    mediaType: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-a-computer-keyboard-41315-large.mp4',
    caption: '🎥 Typing test on mechanical switch keys! The sound and tactile feedback are super satisfying.',
    likesCount: 25,
    commentsCount: 5,
    savesCount: 6,
    sharesCount: 2,
    isLiked: false,
    isSaved: false,
    comments: [],
    createdAt: new Date(Date.now() - 22 * 3600000).toISOString(),
  }
];

export const AUTHENTIC_SEED_STATUSES: UserStatus[] = [
  {
    id: 'stat_1',
    userId: 'usr_seller_1',
    userName: 'Zayd Khan',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    type: 'photo',
    mediaUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    content: 'All orders dispatched via courier for today!',
    caption: 'All orders dispatched via courier for today!',
    views: [
      {
        userId: 'usr_social_1',
        userName: 'Sara Noor',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
        viewedAt: new Date(Date.now() - 60000).toISOString(),
      }
    ],
    reactions: [{ userId: 'usr_social_1', emoji: '🔥' }],
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 22 * 3600000).toISOString(),
  },
  {
    id: 'stat_2',
    userId: 'usr_social_1',
    userName: 'Sara Noor',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    type: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-a-computer-keyboard-41315-large.mp4',
    content: 'Morning desk vibe 🌸',
    caption: 'Morning desk vibe 🌸',
    views: [],
    reactions: [],
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 20 * 3600000).toISOString(),
  }
];

class LocalStore {
  private get<T>(key: string, fallback: T): T {
    try {
      const stored = localStorage.getItem(`marketly_${key}`);
      if (!stored) return fallback;
      return JSON.parse(stored);
    } catch {
      return fallback;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`marketly_${key}`, JSON.stringify(value));
    } catch {
      // Storage might be full or blocked
    }
  }

  getUsers(): User[] {
    return this.get<User[]>('users', AUTHENTIC_SEED_USERS);
  }

  saveUsers(users: User[]): void {
    this.set('users', users);
  }

  getProducts(): Product[] {
    return this.get<Product[]>('products', AUTHENTIC_SEED_PRODUCTS);
  }

  saveProducts(products: Product[]): void {
    this.set('products', products);
  }

  getPosts(): Post[] {
    return this.get<Post[]>('posts', AUTHENTIC_SEED_POSTS);
  }

  savePosts(posts: Post[]): void {
    this.set('posts', posts);
  }

  getStatuses(): UserStatus[] {
    const all = this.get<UserStatus[]>('statuses', AUTHENTIC_SEED_STATUSES);
    const now = Date.now();
    return all.filter(s => new Date(s.expiresAt).getTime() > now);
  }

  saveStatuses(statuses: UserStatus[]): void {
    this.set('statuses', statuses);
  }
}

export const localStore = new LocalStore();
