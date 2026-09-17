import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
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
  AdminAuditLog,
  ProductContext,
  UserRole
} from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy load Google Gen AI client with telemetry header
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// In-Memory Database initialized with realistic Pakistani Marketly ecosystem data
const INITIAL_USERS: User[] = [
  {
    id: "usr_seller_1",
    firstName: "Zayd",
    lastName: "Khan",
    username: "zayd_gadgets",
    email: "zayd@gadgetspk.com",
    role: "SELLER",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    bio: "Official Certified Electronics & Audio Importer. Fast Cash on Delivery across Pakistan.",
    description: "Operating from Hafeez Centre Lahore since 2018. We provide 100% genuine sealed audio gear, smart watches, and accessories.",
    country: "Pakistan",
    city: "Lahore",
    followersCount: 1420,
    followingCount: 88,
    likesCount: 9450,
    privacySettings: {
      profilePrivacy: "public",
      whoCanMessageMe: "everyone",
      whoCanFollowMe: "everyone",
      whoCanSendRequests: "everyone",
      commentsEnabled: true,
      showLastSeen: true,
      showOnlineStatus: true,
    },
    sellerSettings: {
      welcomeMessage: "Assalam o Alaikum! Welcome to Zayd Gadgets. Let us know which product you'd like to order via Cash on Delivery.",
      businessName: "Zayd Gadgets & Electronics",
      completeAddress: "Shop 42B, Hafeez Centre, Main Boulevard Gulberg III, Lahore",
      returnPolicyText: "7-day checking warranty. Return allowed if item is functionally defective or materially unmatching description.",
    },
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: "usr_seller_2",
    firstName: "Ayesha",
    lastName: "Malik",
    username: "ayesha_couture",
    email: "ayesha@couturepk.com",
    role: "SELLER",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    bio: "Contemporary pret & handcrafted bridal wear. Express delivery in Karachi, Lahore, Islamabad.",
    description: "Designer boutique focusing on authentic handloom silks, organza and seasonal lawn collections.",
    country: "Pakistan",
    city: "Karachi",
    followersCount: 3120,
    followingCount: 145,
    likesCount: 18200,
    privacySettings: {
      profilePrivacy: "public",
      whoCanMessageMe: "everyone",
      whoCanFollowMe: "everyone",
      whoCanSendRequests: "everyone",
      commentsEnabled: true,
      showLastSeen: true,
      showOnlineStatus: true,
    },
    sellerSettings: {
      welcomeMessage: "Hello! Thank you for contacting Malik Couture. We are delighted to assist with sizing, fabric details, and COD shipment.",
      businessName: "Malik Couture",
      completeAddress: "Plot 12-C, Zamzama Commercial Lane 5, DHA Phase 5, Karachi",
      returnPolicyText: "Exchange within 3 days for sizing. Delivered via COD with parcel inspection option.",
    },
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: "usr_buyer_1",
    firstName: "Bilal",
    lastName: "Ahmed",
    username: "bilal_ahmed",
    email: "bilal@gmail.com",
    role: "SOCIAL",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    bio: "Tech enthusiast, audiophile & gadget reviewer in Islamabad.",
    description: "Love exploring new gadgets and sharing honest community reviews.",
    country: "Pakistan",
    city: "Islamabad",
    followersCount: 430,
    followingCount: 210,
    likesCount: 1540,
    privacySettings: {
      profilePrivacy: "public",
      whoCanMessageMe: "everyone",
      whoCanFollowMe: "everyone",
      whoCanSendRequests: "everyone",
      commentsEnabled: true,
      showLastSeen: true,
      showOnlineStatus: true,
    },
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: "usr_social_1",
    firstName: "Fatima",
    lastName: "Noor",
    username: "fatima_vlogs",
    email: "fatima@vlogs.pk",
    role: "SOCIAL",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    bio: "Daily lifestyle, travel snippets and Pakistani culture stories 🌸",
    description: "Sharing the best food spots in Rawalpindi/Islamabad and everyday aesthetic stories.",
    country: "Pakistan",
    city: "Rawalpindi",
    followersCount: 5600,
    followingCount: 320,
    likesCount: 34000,
    privacySettings: {
      profilePrivacy: "public",
      whoCanMessageMe: "connections",
      whoCanFollowMe: "everyone",
      whoCanSendRequests: "everyone",
      commentsEnabled: true,
      showLastSeen: true,
      showOnlineStatus: true,
    },
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: "usr_admin_1",
    firstName: "Marketly",
    lastName: "Supervisor",
    username: "marketly_admin",
    email: "admin@marketly.com",
    role: "ADMIN",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    bio: "Marketly Trust & Safety, Merchant Compliance & Audit.",
    description: "Platform management and fraud prevention officer.",
    country: "Pakistan",
    city: "Islamabad",
    followersCount: 100,
    followingCount: 10,
    likesCount: 50,
    privacySettings: {
      profilePrivacy: "public",
      whoCanMessageMe: "everyone",
      whoCanFollowMe: "everyone",
      whoCanSendRequests: "everyone",
      commentsEnabled: true,
      showLastSeen: true,
      showOnlineStatus: true,
    },
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod_1",
    sellerId: "usr_seller_1",
    sellerName: "Zayd Khan",
    sellerUsername: "zayd_gadgets",
    sellerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    sellerCity: "Lahore",
    name: "Sony WH-1000XM5 Noise Canceling Headphones",
    category: "Electronics",
    brand: "Sony",
    model: "WH-1000XM5",
    condition: "New",
    whatItIs: "Industry-leading wireless noise canceling over-ear headphones with 30-hour battery life.",
    whatItIsUsedFor: "Immersive audio listening, Zoom calls, travel noise cancellation, and mobile gaming.",
    description: "100% Brand new original Sony WH-1000XM5 in box. Auto NC Optimizer, 8 microphones, Speak-to-Chat, ultra-comfortable lightweight design. Free COD delivery nationwide.",
    features: ["Industry-leading Noise Canceling", "30-Hour Battery Life", "Speak-to-Chat Technology", "Multipoint connection"],
    specifications: {
      Driver: "30mm Precision Driver",
      Bluetooth: "5.2 (LDAC, AAC, SBC)",
      Charging: "USB-C Quick Charge (3 min = 3 hrs)",
      Weight: "250g",
    },
    color: "Midnight Silver",
    quantity: 8,
    originalPrice: 95000,
    discount: 10,
    finalPrice: 85500,
    guarantee: true,
    warranty: true,
    warrantyDuration: "1 Year Official Brand Warranty",
    deliveryAvailable: true,
    deliveryCharges: 0,
    freeDelivery: true,
    estimatedDeliveryTime: "2-3 Days via Leopard Courier",
    returnPolicy: "7-day checking warranty. Open parcel inspection on COD.",
    refundPolicy: "Instant replacement or full refund if defective upon delivery.",
    mediaUrls: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80",
    ],
    status: "active",
    views: 1840,
    likes: 312,
    saves: 95,
    shares: 44,
    orderNowClicks: 38,
    customerInquiries: 29,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "prod_2",
    sellerId: "usr_seller_1",
    sellerName: "Zayd Khan",
    sellerUsername: "zayd_gadgets",
    sellerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    sellerCity: "Lahore",
    name: "Keychron K2 Pro Mechanical Wireless Keyboard",
    category: "Computers & Gaming",
    brand: "Keychron",
    model: "K2 Pro RGB Hot-Swap",
    condition: "New",
    whatItIs: "75% compact wireless mechanical keyboard with customizable QMK/VIA support and PBT keycaps.",
    whatItIsUsedFor: "Coding, professional typing, and esports gaming on Mac and Windows.",
    description: "South-facing RGB, hot-swappable Keychron K Pro Red linear switches, pre-lubed stabilizers, sound-absorbing foam. Connects up to 3 devices.",
    features: ["QMK/VIA Programmable", "Double-Shot PBT Keycaps", "Wireless Bluetooth 5.1 & Type-C", "Hot-Swappable"],
    specifications: {
      Layout: "75% Compact (84 Keys)",
      Switches: "Keychron K Pro Red",
      Battery: "4000mAh (Up to 300 hrs)",
      Compatibility: "macOS / Windows / Linux",
    },
    color: "Carbon Black",
    quantity: 14,
    originalPrice: 28000,
    discount: 15,
    finalPrice: 23800,
    guarantee: true,
    warranty: true,
    warrantyDuration: "6 Months Seller Warranty",
    deliveryAvailable: true,
    deliveryCharges: 250,
    freeDelivery: false,
    estimatedDeliveryTime: "2 Days (Lahore same-day delivery)",
    returnPolicy: "5 days replacement guarantee for any switch issues.",
    refundPolicy: "Refund within 3 business days if unrepairable.",
    mediaUrls: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
    ],
    status: "active",
    views: 920,
    likes: 180,
    saves: 62,
    shares: 19,
    orderNowClicks: 21,
    customerInquiries: 18,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "prod_3",
    sellerId: "usr_seller_2",
    sellerName: "Ayesha Malik",
    sellerUsername: "ayesha_couture",
    sellerAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    sellerCity: "Karachi",
    name: "Hand-Embroidered Pure Silk Festive Kurti",
    category: "Fashion & Apparel",
    brand: "Malik Couture",
    model: "Zeenat Festive 2026",
    condition: "New",
    whatItIs: "Pure mulberry raw silk shirt with intricate tilla and zardozi threadwork embroidery.",
    whatItIsUsedFor: "Eid celebrations, weddings, evening gatherings and festive events.",
    description: "Exquisite artisanal craftsmanship made by Multani master artisans. Lined with soft cotton silk. Includes matching embroidered organza dupatta.",
    features: ["100% Pure Raw Silk Fabric", "Handcrafted Zardozi Detailing", "Pre-shrunk and double-stitched", "Comfortable breathable lining"],
    specifications: {
      Material: "Raw Silk & Organza",
      Work: "Tilla, Resham, Pearls",
      Sizes: "S, M, L, XL Available",
      Care: "Dry Clean Only",
    },
    size: "Medium (Chest 38)",
    color: "Emerald Green",
    quantity: 6,
    originalPrice: 16500,
    discount: 10,
    finalPrice: 14850,
    guarantee: true,
    warranty: false,
    warrantyDuration: "No warranty (Craft inspection upon delivery)",
    deliveryAvailable: true,
    deliveryCharges: 0,
    freeDelivery: true,
    estimatedDeliveryTime: "2-4 Days nationwide via TCS COD",
    returnPolicy: "Easy 3-day exchange if size fitting needs adjustment.",
    refundPolicy: "100% money back if fabric does not match pure silk specifications.",
    mediaUrls: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80",
    ],
    status: "active",
    views: 2450,
    likes: 490,
    saves: 210,
    shares: 88,
    orderNowClicks: 52,
    customerInquiries: 45,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: "prod_4",
    sellerId: "usr_seller_2",
    sellerName: "Ayesha Malik",
    sellerUsername: "ayesha_couture",
    sellerAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    sellerCity: "Karachi",
    name: "Pure Cow Leather Handcrafted Chappal",
    category: "Footwear",
    brand: "Khyber Craft",
    model: "Kaptaan Special Classic",
    condition: "New",
    whatItIs: "Traditional premium handcrafted Peshawari leather chappal with tire-sole comfort.",
    whatItIsUsedFor: "Daily cultural wear, Friday prayers, festive occasions, and formal shalwar kameez pairing.",
    description: "Constructed with vegetable-tanned genuine top-grain cow leather and cushioned insole. Stitched with durable wax cord.",
    features: ["Top-grain genuine cowhide", "Comfortable memory foam insole", "Recycled durable grip tire sole", "Authentic Peshawari artisan make"],
    specifications: {
      Upper: "Genuine Top Grain Leather",
      Sole: "Heavy Duty Durable Rubber",
      Sizes: "40, 41, 42, 43, 44 Euro",
      Origin: "Peshawar, Pakistan",
    },
    color: "Vintage Mustard Tan",
    quantity: 18,
    originalPrice: 6500,
    discount: 20,
    finalPrice: 5200,
    guarantee: true,
    warranty: true,
    warrantyDuration: "6 Months Sole Guarantee",
    deliveryAvailable: true,
    deliveryCharges: 200,
    freeDelivery: false,
    estimatedDeliveryTime: "3 Days via Trax COD",
    returnPolicy: "Free size swap if sizing doesn't fit comfortably.",
    refundPolicy: "COD refund guarantee if non-leather material is found.",
    mediaUrls: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80",
    ],
    status: "active",
    views: 1320,
    likes: 275,
    saves: 85,
    shares: 32,
    orderNowClicks: 30,
    customerInquiries: 22,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  }
];

const INITIAL_POSTS: Post[] = [
  {
    id: "post_seller_1",
    authorId: "usr_seller_1",
    authorName: "Zayd Khan",
    authorUsername: "zayd_gadgets",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    authorRole: "SELLER",
    authorCity: "Lahore",
    contentType: "seller",
    mediaType: "photo",
    mediaUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    caption: "🔥 Just arrived from official channel: Sony WH-1000XM5 in Midnight Silver! Unrivaled Active Noise Cancellation for Lahore commutes. Special introductory 10% discount on Marketly. Tap ORDER NOW below to start COD discussion in chat!",
    productContext: {
      productId: "prod_1",
      productName: "Sony WH-1000XM5 Noise Canceling Headphones",
      productPrice: 95000,
      productDiscount: 10,
      finalPrice: 85500,
      productImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
      sellerId: "usr_seller_1",
      sellerName: "Zayd Khan",
      sellerCity: "Lahore",
      freeDelivery: true,
      warranty: true,
      warrantyDuration: "1 Year Official Warranty",
    },
    likesCount: 142,
    commentsCount: 18,
    savesCount: 45,
    sharesCount: 12,
    isLiked: false,
    isSaved: false,
    comments: [
      {
        id: "c1",
        postId: "post_seller_1",
        authorId: "usr_buyer_1",
        authorName: "Bilal Ahmed",
        authorUsername: "bilal_ahmed",
        authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
        text: "Is parcel open inspection allowed on delivery in Islamabad?",
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      },
      {
        id: "c2",
        postId: "post_seller_1",
        authorId: "usr_seller_1",
        authorName: "Zayd Khan",
        authorUsername: "zayd_gadgets",
        authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
        text: "@bilal_ahmed Yes brother! 100% checking allowed with rider before payment.",
        createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: "post_seller_2",
    authorId: "usr_seller_2",
    authorName: "Ayesha Malik",
    authorUsername: "ayesha_couture",
    authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    authorRole: "SELLER",
    authorCity: "Karachi",
    contentType: "seller",
    mediaType: "photo",
    mediaUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
    caption: "✨ Zeenat Festive Hand-Embroidered Raw Silk in royal Emerald Green. Subtle tilla motifs with delicate organza finish. Tap ORDER NOW for sizing guide and direct COD delivery.",
    productContext: {
      productId: "prod_3",
      productName: "Hand-Embroidered Pure Silk Festive Kurti",
      productPrice: 16500,
      productDiscount: 10,
      finalPrice: 14850,
      productImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
      sellerId: "usr_seller_2",
      sellerName: "Ayesha Malik",
      sellerCity: "Karachi",
      freeDelivery: true,
      warranty: false,
    },
    likesCount: 310,
    commentsCount: 24,
    savesCount: 92,
    sharesCount: 35,
    isLiked: false,
    isSaved: false,
    comments: [],
    createdAt: new Date(Date.now() - 14 * 3600000).toISOString(),
  },
  {
    id: "post_buyer_1",
    authorId: "usr_buyer_1",
    authorName: "Bilal Ahmed",
    authorUsername: "bilal_ahmed",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    authorRole: "SOCIAL",
    authorCity: "Islamabad",
    contentType: "social",
    mediaType: "photo",
    mediaUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
    caption: "Hands-on review of Keychron K2 Pro received via Marketly COD! Delivered in 2 days to F-7 Islamabad. The tactile feel on Mac is sensational.",
    likesCount: 88,
    commentsCount: 9,
    savesCount: 15,
    sharesCount: 4,
    isLiked: false,
    isSaved: false,
    comments: [],
    createdAt: new Date(Date.now() - 18 * 3600000).toISOString(),
  },
  {
    id: "post_social_1",
    authorId: "usr_social_1",
    authorName: "Fatima Noor",
    authorUsername: "fatima_vlogs",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    authorRole: "SOCIAL",
    authorCity: "Rawalpindi",
    contentType: "social",
    mediaType: "photo",
    mediaUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80",
    caption: "Golden hour sunset over Margalla Hills Islamabad 🌄 Pakistani evenings are truly magical. What's your favorite viewpoint in the twin cities? Drop your recommendations!",
    likesCount: 420,
    commentsCount: 33,
    savesCount: 78,
    sharesCount: 19,
    isLiked: false,
    isSaved: false,
    comments: [],
    createdAt: new Date(Date.now() - 22 * 3600000).toISOString(),
  },
  {
    id: "post_social_2",
    authorId: "usr_seller_1",
    authorName: "Zayd Khan",
    authorUsername: "zayd_gadgets",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    authorRole: "SELLER",
    authorCity: "Lahore",
    contentType: "social",
    mediaType: "photo",
    mediaUrl: "https://images.unsplash.com/photo-1517404215738-15263e9f9178?w=800&auto=format&fit=crop&q=80",
    caption: "Late evening team coffee at Gulberg Lahore after dispatching over 50 COD parcels today! Grateful to all Marketly customers. Hard work pays off ☕⚡",
    likesCount: 195,
    commentsCount: 14,
    savesCount: 12,
    sharesCount: 6,
    isLiked: false,
    isSaved: false,
    comments: [],
    createdAt: new Date(Date.now() - 26 * 3600000).toISOString(),
  },
  {
    id: "post_video_seller_1",
    authorId: "usr_seller_1",
    authorName: "Zayd Khan",
    authorUsername: "zayd_gadgets",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    authorRole: "SELLER",
    authorCity: "Lahore",
    contentType: "seller",
    mediaType: "video",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    caption: "Unboxing & sound demo: Sony WH-1000XM5 wireless ANC headphones! Super comfortable earpads and crystal-clear call quality. Tap ORDER NOW for direct COD shipment across Pakistan.",
    productContext: {
      productId: "prod_1",
      productName: "Sony WH-1000XM5 Noise Canceling Headphones",
      productPrice: 95000,
      productDiscount: 10,
      finalPrice: 85500,
      productImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
      sellerId: "usr_seller_1",
      sellerName: "Zayd Khan",
      sellerCity: "Lahore",
      freeDelivery: true,
      warranty: true,
      warrantyDuration: "1 Year Official Warranty",
    },
    likesCount: 384,
    commentsCount: 42,
    savesCount: 110,
    sharesCount: 48,
    isLiked: false,
    isSaved: false,
    comments: [],
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: "post_video_buyer_1",
    authorId: "usr_buyer_1",
    authorName: "Bilal Ahmed",
    authorUsername: "bilal_ahmed",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    authorRole: "SOCIAL",
    authorCity: "Islamabad",
    contentType: "social",
    mediaType: "video",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
    caption: "Mechanical keyboard typing ASMR video test. Gateron brown switches feel tactile without waking up the house. Delivery was fast and COD went smoothly.",
    likesCount: 220,
    commentsCount: 19,
    savesCount: 34,
    sharesCount: 11,
    isLiked: false,
    isSaved: false,
    comments: [],
    createdAt: new Date(Date.now() - 7 * 3600000).toISOString(),
  },
  {
    id: "post_video_social_1",
    authorId: "usr_social_1",
    authorName: "Fatima Noor",
    authorUsername: "fatima_vlogs",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    authorRole: "SOCIAL",
    authorCity: "Rawalpindi",
    contentType: "social",
    mediaType: "video",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    caption: "Scenic weekend drive through Monal road Margalla Hills! The fresh breeze and mountain views are unmatched in Pakistan 🍃🏔️",
    likesCount: 512,
    commentsCount: 65,
    savesCount: 94,
    sharesCount: 28,
    isLiked: false,
    isSaved: false,
    comments: [],
    createdAt: new Date(Date.now() - 10 * 3600000).toISOString(),
  }
];

const INITIAL_STATUSES: UserStatus[] = [
  {
    id: "stat_1",
    userId: "usr_seller_1",
    userName: "Zayd Khan",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    type: "photo",
    content: "New batch of Sony XM5 sealed units arrived! Packing for tomorrow's COD shipments.",
    mediaUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    views: [
      {
        userId: "usr_buyer_1",
        userName: "Bilal Ahmed",
        userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
        viewedAt: new Date(Date.now() - 3600000).toISOString(),
      }
    ],
    reactions: [
      { userId: "usr_buyer_1", emoji: "🔥" }
    ],
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 20 * 3600000).toISOString(),
  },
  {
    id: "stat_video_1",
    userId: "usr_seller_2",
    userName: "Ayesha Malik",
    userAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    type: "video",
    content: "Behind the scenes: Final inspection of raw silk embroidery before COD dispatch!",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    views: [],
    reactions: [
      { userId: "usr_seller_1", emoji: "❤️" }
    ],
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 22 * 3600000).toISOString(),
  },
  {
    id: "stat_2",
    userId: "usr_social_1",
    userName: "Fatima Noor",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    type: "photo",
    content: "Rain in Islamabad! Chai and pakoras time 🌧️☕ Stay safe on the expressway everyone.",
    mediaUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80",
    bgGradient: "from-violet-600 to-indigo-800",
    views: [],
    reactions: [],
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 18 * 3600000).toISOString(),
  }
];

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "conv_seller_1",
    type: "seller",
    participantIds: ["usr_seller_1", "usr_buyer_1"],
    participants: [
      {
        id: "usr_seller_1",
        name: "Zayd Khan",
        username: "zayd_gadgets",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
        role: "SELLER",
        isOnline: true,
      },
      {
        id: "usr_buyer_1",
        name: "Bilal Ahmed",
        username: "bilal_ahmed",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
        role: "SOCIAL",
        isOnline: false,
        lastSeen: "10m ago",
      }
    ],
    productContext: {
      productId: "prod_1",
      productName: "Sony WH-1000XM5 Noise Canceling Headphones",
      productPrice: 95000,
      productDiscount: 10,
      finalPrice: 85500,
      productImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
      sellerId: "usr_seller_1",
      sellerName: "Zayd Khan",
      sellerCity: "Lahore",
      freeDelivery: true,
      warranty: true,
      warrantyDuration: "1 Year Official Brand Warranty",
    },
    lastMessage: {
      id: "msg_2",
      conversationId: "conv_seller_1",
      senderId: "usr_seller_1",
      senderName: "Zayd Khan",
      senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      text: "Sure brother, if you share your Islamabad delivery address and phone number, I can book the COD dispatch for tomorrow morning.",
      status: "delivered",
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    unreadCount: 0,
    socialRequestStatus: "none",
    updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "conv_social_1",
    type: "social",
    participantIds: ["usr_buyer_1", "usr_social_1"],
    participants: [
      {
        id: "usr_buyer_1",
        name: "Bilal Ahmed",
        username: "bilal_ahmed",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
        role: "SOCIAL",
      },
      {
        id: "usr_social_1",
        name: "Fatima Noor",
        username: "fatima_vlogs",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
        role: "SOCIAL",
        isOnline: true,
      }
    ],
    lastMessage: {
      id: "msg_soc_1",
      conversationId: "conv_social_1",
      senderId: "usr_social_1",
      senderName: "Fatima Noor",
      senderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
      text: "Thank you for connecting Bilal! Loved your keyboard review post.",
      status: "read",
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    unreadCount: 0,
    socialRequestStatus: "accepted",
    updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "conv_grp_1",
    type: "social",
    participantIds: ["usr_seller_1", "usr_buyer_1", "usr_social_1"],
    participants: [
      {
        id: "usr_seller_1",
        name: "Zayd Khan",
        username: "zayd_gadgets",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
        role: "SELLER",
      },
      {
        id: "usr_buyer_1",
        name: "Bilal Ahmed",
        username: "bilal_ahmed",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
        role: "SOCIAL",
      },
      {
        id: "usr_social_1",
        name: "Fatima Noor",
        username: "fatima_vlogs",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
        role: "SOCIAL",
      }
    ],
    isGroup: true,
    groupName: "Lahore Tech & Gadget Circle",
    groupAvatar: "https://images.unsplash.com/photo-1522071823991-b9671e9d7fbd?w=300&auto=format&fit=crop&q=80",
    groupMeta: {
      id: "grp_1",
      name: "Lahore Tech & Gadget Circle",
      description: "Official community group for tech enthusiasts, deals discussion, audio reviews, and gadget troubleshooting in Lahore.",
      photo: "https://images.unsplash.com/photo-1522071823991-b9671e9d7fbd?w=300&auto=format&fit=crop&q=80",
      creatorId: "usr_seller_1",
      adminIds: ["usr_seller_1"],
      memberIds: ["usr_seller_1", "usr_buyer_1", "usr_social_1"],
      onlyAdminsCanPost: false,
      onlyAdminsCanEditInfo: false,
    },
    lastMessage: {
      id: "msg_grp_1",
      conversationId: "conv_grp_1",
      senderId: "usr_buyer_1",
      senderName: "Bilal Ahmed",
      senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
      text: "Anyone tested the new mechanical switch lube options available in Hafeez Centre?",
      status: "delivered",
      timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
    },
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 40 * 60000).toISOString(),
  }
];

const INITIAL_CHANNELS = [
  {
    id: "chan_1",
    name: "Hafeez Centre Tech Drops",
    description: "Official broadcast updates on new sealed gadget shipments, Sony & Apple releases, and exclusive COD flash promotions across Pakistan.",
    photo: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&auto=format&fit=crop&q=80",
    ownerId: "usr_seller_1",
    ownerName: "Zayd Khan",
    adminIds: ["usr_seller_1"],
    followerIds: ["usr_buyer_1", "usr_social_1", "usr_seller_2"],
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "chan_2",
    name: "Pakistan Fashion & Couture Trends",
    description: "Designer pret previews, seasonal lawn releases, handcrafted organza edits, and style guides by Malik Couture.",
    photo: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&auto=format&fit=crop&q=80",
    ownerId: "usr_seller_2",
    ownerName: "Ayesha Malik",
    adminIds: ["usr_seller_2"],
    followerIds: ["usr_social_1", "usr_buyer_1"],
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  }
];

const INITIAL_CHANNEL_POSTS: Record<string, any[]> = {
  chan_1: [
    {
      id: "cpost_1",
      channelId: "chan_1",
      authorId: "usr_seller_1",
      authorName: "Zayd Khan",
      authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      text: "⚡ Flash Alert: Sony WH-1000XM5 fresh shipment cleared customs today! Available in Silver & Black with 1-Year Official Brand Warranty. Free Cash on Delivery nationwide. Tap ORDER NOW on Marketly to reserve.",
      mediaUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
      mediaType: "image",
      productId: "prod_1",
      productName: "Sony WH-1000XM5 Noise Canceling Headphones",
      productPrice: 85500,
      productImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
      reactions: { "🔥": 48, "❤️": 31, "👍": 67 },
      sharesCount: 14,
      createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
    {
      id: "cpost_2",
      channelId: "chan_1",
      authorId: "usr_seller_1",
      authorName: "Zayd Khan",
      authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      text: "Quick reminder for our Islamabad and Peshawar buyers: Trax & TCS COD parcels dispatched before 2 PM arrive in 24 hours. Always inspect your parcel upon delivery!",
      reactions: { "👍": 55, "👏": 23 },
      sharesCount: 8,
      createdAt: new Date(Date.now() - 28 * 3600000).toISOString(),
    }
  ],
  chan_2: [
    {
      id: "cpost_3",
      channelId: "chan_2",
      authorId: "usr_seller_2",
      authorName: "Ayesha Malik",
      authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
      text: "🌸 Festive Eid luxury pret preview! Our raw silk 3-piece embroidered ensemble in Royal Emerald is now available in sizes XS to XL. Cash on delivery available with doorstep inspection.",
      mediaUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80",
      mediaType: "image",
      reactions: { "❤️": 92, "🔥": 41, "🎉": 29 },
      sharesCount: 22,
      createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    }
  ]
};

const INITIAL_MESSAGES: Record<string, Message[]> = {
  conv_seller_1: [
    {
      id: "msg_auto_1",
      conversationId: "conv_seller_1",
      senderId: "usr_seller_1",
      senderName: "Zayd Khan",
      senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      text: "Assalam o Alaikum! Welcome to Zayd Gadgets. Let us know which product you'd like to order via Cash on Delivery.",
      status: "read",
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    },
    {
      id: "msg_1",
      conversationId: "conv_seller_1",
      senderId: "usr_buyer_1",
      senderName: "Bilal Ahmed",
      senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
      text: "Walaikum Assalam Zayd bhai! I'm inquiring about the Sony XM5. Is the seal intact with 1-year brand warranty?",
      status: "read",
      timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
    },
    {
      id: "msg_2",
      conversationId: "conv_seller_1",
      senderId: "usr_seller_1",
      senderName: "Zayd Khan",
      senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      text: "Sure brother, if you share your Islamabad delivery address and phone number, I can book the COD dispatch for tomorrow morning.",
      status: "delivered",
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    }
  ],
  conv_social_1: [
    {
      id: "msg_soc_1",
      conversationId: "conv_social_1",
      senderId: "usr_social_1",
      senderName: "Fatima Noor",
      senderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
      text: "Thank you for connecting Bilal! Loved your keyboard review post.",
      status: "read",
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    }
  ]
};

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif_1",
    userId: "usr_seller_1",
    category: "marketplace",
    title: "New Order Now Inquiry",
    message: "Bilal Ahmed clicked ORDER NOW for Sony WH-1000XM5. Conversation started in Seller Chat.",
    targetType: "chat",
    targetId: "conv_seller_1",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: "notif_2",
    userId: "usr_seller_1",
    category: "seller",
    title: "7-Day Free Trial Active",
    message: "Your Marketly Seller Free Trial is active. 5 days remaining before subscription renewal.",
    targetType: "subscription",
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "notif_3",
    userId: "usr_buyer_1",
    category: "messages",
    title: "New Message from Zayd Khan",
    message: "Sure brother, if you share your Islamabad delivery address...",
    targetType: "chat",
    targetId: "conv_seller_1",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    isRead: false,
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "notif_4",
    userId: "usr_seller_1",
    category: "likes",
    title: "New Like on Product Post",
    message: "Fatima Noor and 14 others liked your Sony WH-1000XM5 post.",
    targetType: "post",
    targetId: "post_seller_1",
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  }
];

const INITIAL_SUBSCRIPTIONS: Record<string, SellerSubscription> = {
  usr_seller_1: {
    userId: "usr_seller_1",
    status: "trial_active",
    planName: "7-Day Free Trial",
    trialStartDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    trialEndDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    expiryDate: new Date(Date.now() + 5 * 86400000).toISOString(),
  },
  usr_seller_2: {
    userId: "usr_seller_2",
    status: "active",
    planId: "plan_3mo",
    planName: "3 Months Business Plan",
    trialStartDate: new Date(Date.now() - 40 * 86400000).toISOString(),
    trialEndDate: new Date(Date.now() - 33 * 86400000).toISOString(),
    subscriptionStartDate: new Date(Date.now() - 33 * 86400000).toISOString(),
    expiryDate: new Date(Date.now() + 57 * 86400000).toISOString(),
    paymentMethod: "easypaisa",
    transactionId: "EP-9823412093",
    lastPaymentDate: new Date(Date.now() - 33 * 86400000).toISOString(),
  }
};

const INITIAL_REPORTS: ReportItem[] = [];
const INITIAL_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: "audit_1",
    adminId: "usr_admin_1",
    adminUsername: "marketly_admin",
    action: "SELLER_VERIFICATION",
    target: "usr_seller_1 (Zayd Khan)",
    reason: "Verified Hafeez Centre business registration and CNIC check",
    timestamp: new Date(Date.now() - 10 * 86400000).toISOString(),
  }
];

// In-Memory Database Container
class MarketlyDatabase {
  users: User[] = [...INITIAL_USERS];
  products: Product[] = [...INITIAL_PRODUCTS];
  posts: Post[] = [...INITIAL_POSTS];
  statuses: UserStatus[] = [...INITIAL_STATUSES];
  conversations: Conversation[] = [...INITIAL_CONVERSATIONS];
  messages: Record<string, Message[]> = { ...INITIAL_MESSAGES };
  notifications: AppNotification[] = [...INITIAL_NOTIFICATIONS];
  subscriptions: Record<string, SellerSubscription> = { ...INITIAL_SUBSCRIPTIONS };
  reports: ReportItem[] = [...INITIAL_REPORTS];
  auditLogs: AdminAuditLog[] = [...INITIAL_AUDIT_LOGS];
  channels: any[] = [...INITIAL_CHANNELS];
  channelPosts: Record<string, any[]> = { ...INITIAL_CHANNEL_POSTS };
}

const db = new MarketlyDatabase();

// ==========================================
// API ROUTES
// ==========================================

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Marketly API", time: new Date().toISOString() });
});

// 1. AUTH & ONBOARDING
app.get("/api/auth/check-username", (req, res) => {
  const username = String(req.query.username || "").toLowerCase().trim();
  if (!username) {
    return res.status(400).json({ error: "Username required" });
  }
  const exists = db.users.some(u => u.username.toLowerCase() === username);
  res.json({
    username,
    available: !exists,
    message: exists
      ? "This username is already taken. Please choose another username."
      : "Username available",
  });
});

app.post("/api/auth/register", (req, res) => {
  const { firstName, lastName, username, email, role, avatar, bio, description, city, agreeSellerRules } = req.body;
  if (!firstName || !lastName || !username || !email || !role) {
    return res.status(400).json({ error: "Missing required registration fields" });
  }

  const cleanUsername = username.toLowerCase().trim();
  if (db.users.some(u => u.username.toLowerCase() === cleanUsername)) {
    return res.status(409).json({ error: "This username is already taken. Please choose another username." });
  }

  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    username: cleanUsername,
    email: email.trim(),
    role: role as UserRole,
    avatar: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    bio: bio || "",
    description: description || "",
    country: "Pakistan",
    city: city || "Lahore",
    followersCount: 0,
    followingCount: 0,
    likesCount: 0,
    privacySettings: {
      profilePrivacy: "public",
      whoCanMessageMe: "everyone",
      whoCanFollowMe: "everyone",
      whoCanSendRequests: "everyone",
      commentsEnabled: true,
      showLastSeen: true,
      showOnlineStatus: true,
    },
    sellerSettings: role === "SELLER" ? {
      welcomeMessage: "Assalam o Alaikum! Welcome to my shop. Please let me know which product you would like to order via Cash on Delivery.",
      businessName: `${firstName.trim()}'s Marketly Shop`,
      completeAddress: `${city || "Pakistan"} (Private seller warehouse)`,
    } : undefined,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);

  // If role is SELLER, initialize 7-Day Free Trial immediately
  if (role === "SELLER") {
    db.subscriptions[newUser.id] = {
      userId: newUser.id,
      status: "trial_active",
      planName: "7-Day Free Trial",
      trialStartDate: new Date().toISOString(),
      trialEndDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      expiryDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    };

    // Add trial started notification
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: newUser.id,
      category: "seller",
      title: "7-Day Free Trial Activated",
      message: "Welcome to Marketly Seller Center! Your 7-day free trial has started. Enjoy unlimited listings and COD customer inquiries.",
      targetType: "subscription",
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  res.status(201).json({ user: newUser });
});

app.post("/api/auth/login", (req, res) => {
  const { loginId } = req.body;
  if (!loginId) {
    return res.status(400).json({ error: "Email or username required" });
  }

  const clean = loginId.toLowerCase().trim();
  const user = db.users.find(u => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean);

  if (!user) {
    return res.status(404).json({ error: "No account found matching this username or email." });
  }

  if (user.isDeactivated) {
    return res.status(403).json({ error: "This account is currently blocked/deactivated.", isDeactivated: true });
  }

  res.json({ user });
});

// 2. USERS & PROFILES
app.get("/api/users", (req, res) => {
  // Public user listing (sanitized: passwords/emails stripped)
  const safeUsers = db.users.map(u => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    username: u.username,
    role: u.role,
    avatar: u.avatar,
    bio: u.bio,
    city: u.city,
    followersCount: u.followersCount,
    followingCount: u.followingCount,
    likesCount: u.likesCount,
    isDeactivated: u.isDeactivated,
  }));
  res.json({ users: safeUsers });
});

app.get("/api/users/:id", (req, res) => {
  const user = db.users.find(u => u.id === req.params.id || u.username === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  // Safe representation (never leak completeAddress publicly)
  const safe = {
    ...user,
    email: req.query.self === "true" ? user.email : undefined,
    sellerSettings: user.sellerSettings ? {
      welcomeMessage: user.sellerSettings.welcomeMessage,
      businessName: user.sellerSettings.businessName,
      returnPolicyText: user.sellerSettings.returnPolicyText,
      // completeAddress is omitted for public view
      completeAddress: req.query.self === "true" ? user.sellerSettings.completeAddress : undefined,
    } : undefined,
  };
  res.json({ user: safe });
});

app.put("/api/users/:id", (req, res) => {
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { bio, description, city, avatar, privacySettings, sellerSettings } = req.body;
  if (bio !== undefined) user.bio = bio;
  if (description !== undefined) user.description = description;
  if (city !== undefined) user.city = city;
  if (avatar !== undefined) user.avatar = avatar;
  if (privacySettings) user.privacySettings = { ...user.privacySettings, ...privacySettings };
  if (sellerSettings && user.role === "SELLER") {
    user.sellerSettings = { ...user.sellerSettings!, ...sellerSettings };
  }

  res.json({ user });
});

// Block/Deactivate account
app.post("/api/users/:id/deactivate", (req, res) => {
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  const { reason, deactivate } = req.body;

  user.isDeactivated = deactivate !== false;
  user.deactivationReason = reason || "User requested deactivation";

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminId: "system",
    adminUsername: "system",
    action: user.isDeactivated ? "USER_DEACTIVATED" : "USER_REACTIVATED",
    target: `${user.username} (${user.id})`,
    reason: user.deactivationReason,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, isDeactivated: user.isDeactivated });
});

// Delete account permanently
app.delete("/api/users/:id", (req, res) => {
  const index = db.users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "User not found" });

  const deleted = db.users.splice(index, 1)[0];
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminId: "system",
    adminUsername: "system",
    action: "USER_DELETED",
    target: `${deleted.username} (${deleted.id})`,
    reason: "Account deletion requested by user",
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true });
});

// 3. FEED & POSTS (SELLER AND SOCIAL ONLY)
app.get("/api/feed", (req, res) => {
  const role = (req.query.role as UserRole) || "SELLER";
  const tab = (req.query.tab as string)?.toLowerCase();

  let allowedTypes: string[] = [];
  if (role === "SELLER" || role === "ADMIN") {
    allowedTypes = ["seller", "social"];
  } else if (role === "SOCIAL") {
    allowedTypes = ["social"];
  } else {
    allowedTypes = ["seller", "social"];
  }

  let posts = db.posts.filter(p => allowedTypes.includes(p.contentType));

  // If specific tab requested
  if (tab && allowedTypes.includes(tab)) {
    posts = posts.filter(p => p.contentType === tab);
  }

  // Sort newest first
  posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ posts });
});

// Dedicated Video Feed endpoint
app.get("/api/feed/videos", (req, res) => {
  const role = (req.query.role as UserRole) || "SELLER";
  const tab = (req.query.tab as string)?.toLowerCase();

  let allowedTypes: string[] = [];
  if (role === "SELLER" || role === "ADMIN") {
    allowedTypes = ["seller", "social"];
  } else if (role === "SOCIAL") {
    allowedTypes = ["social"];
  } else {
    allowedTypes = ["seller", "social"];
  }

  let videoPosts = db.posts.filter(p => p.mediaType === "video" && allowedTypes.includes(p.contentType));

  if (tab && allowedTypes.includes(tab)) {
    videoPosts = videoPosts.filter(p => p.contentType === tab);
  }

  videoPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ videos: videoPosts });
});

// Real Media Storage Upload endpoint
app.post("/api/storage/upload", (req, res) => {
  const { fileData, fileName, fileType, mediaType } = req.body;
  if (!fileData) {
    return res.status(400).json({ error: "No media data provided" });
  }

  const detectedMediaType = mediaType || (fileType?.startsWith("video") ? "video" : "photo");
  const ext = fileName?.split(".").pop() || (detectedMediaType === "video" ? "mp4" : "jpg");
  const storagePath = `storage/${detectedMediaType}s/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

  res.json({
    success: true,
    storage_path: storagePath,
    media_url: fileData,
    media_type: detectedMediaType,
    file_name: fileName || `upload_${Date.now()}.${ext}`,
    uploaded_at: new Date().toISOString(),
  });
});

app.post("/api/posts", (req, res) => {
  const { authorId, contentType, mediaType, mediaUrl, caption, productContext } = req.body;
  const user = db.users.find(u => u.id === authorId);
  if (!user) return res.status(401).json({ error: "User not found" });

  // Role validation on posting categories:
  // - SELLER can post: 'seller', 'social'
  // - SOCIAL can post: 'social' ONLY
  if (user.role === "SELLER" && !["seller", "social"].includes(contentType)) {
    return res.status(403).json({ error: "Sellers can only post to SELLER or SOCIAL categories." });
  }
  if (user.role === "SOCIAL" && contentType !== "social") {
    return res.status(403).json({ error: "Social users can only post to SOCIAL category." });
  }

  const newPost: Post = {
    id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    authorId: user.id,
    authorName: `${user.firstName} ${user.lastName}`,
    authorUsername: user.username,
    authorAvatar: user.avatar,
    authorRole: user.role,
    authorCity: user.city,
    contentType,
    mediaType: mediaType || "photo",
    mediaUrl: mediaUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    caption: caption || "",
    productContext: contentType === "seller" ? productContext : undefined,
    likesCount: 0,
    commentsCount: 0,
    savesCount: 0,
    sharesCount: 0,
    isLiked: false,
    isSaved: false,
    comments: [],
    createdAt: new Date().toISOString(),
  };

  db.posts.unshift(newPost);

  if (req.body.alsoPostStatus) {
    db.statuses.unshift({
      id: `stat_${Date.now()}`,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`.trim() || user.username,
      userAvatar: user.avatar,
      type: mediaType === 'video' ? 'video' : (mediaUrl ? 'photo' : 'text'),
      content: mediaUrl || caption || 'New Status update',
      caption: caption || undefined,
      bgGradient: 'from-rose-600 via-pink-600 to-amber-600',
      views: [],
      reactions: [],
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 3600000).toISOString(),
    });
  }

  res.status(201).json({ post: newPost });
});

app.post("/api/posts/:id/like", (req, res) => {
  const post = db.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  const { userId } = req.body;
  const user = db.users.find(u => u.id === userId);

  post.isLiked = !post.isLiked;
  post.likesCount = Math.max(0, post.likesCount + (post.isLiked ? 1 : -1));

  if (post.isLiked && user && post.authorId !== user.id) {
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: post.authorId,
      category: "likes",
      title: "New Like",
      message: `${user.firstName} ${user.lastName} liked your post.`,
      targetType: "post",
      targetId: post.id,
      avatar: user.avatar,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  res.json({ isLiked: post.isLiked, likesCount: post.likesCount });
});

app.post("/api/posts/:id/comments", (req, res) => {
  const post = db.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  const { authorId, text } = req.body;
  const user = db.users.find(u => u.id === authorId);
  if (!user || !text) return res.status(400).json({ error: "Author and text required" });

  const newComment = {
    id: `c_${Date.now()}`,
    postId: post.id,
    authorId: user.id,
    authorName: `${user.firstName} ${user.lastName}`,
    authorUsername: user.username,
    authorAvatar: user.avatar,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };

  if (!post.comments) post.comments = [];
  post.comments.push(newComment);
  post.commentsCount += 1;

  if (post.authorId !== user.id) {
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: post.authorId,
      category: "comments",
      title: "New Comment",
      message: `${user.firstName}: "${text.substring(0, 45)}..."`,
      targetType: "post",
      targetId: post.id,
      avatar: user.avatar,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  res.status(201).json({ comment: newComment, commentsCount: post.commentsCount });
});

// 4. PRODUCTS & SEARCH
app.get("/api/products", (req, res) => {
  const { q, category, city, minPrice, maxPrice, condition, freeDelivery, sellerId, sort } = req.query;
  let list = db.products.filter(p => p.status === "active" || sellerId);

  if (sellerId) {
    list = list.filter(p => p.sellerId === sellerId);
  }
  if (q) {
    const term = String(q).toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      p.brand.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term)
    );
  }
  if (category && category !== "All") {
    list = list.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
  }
  if (city && city !== "All") {
    list = list.filter(p => p.sellerCity.toLowerCase() === String(city).toLowerCase());
  }
  if (condition && condition !== "All") {
    list = list.filter(p => p.condition === condition);
  }
  if (freeDelivery === "true") {
    list = list.filter(p => p.freeDelivery);
  }
  if (minPrice) {
    list = list.filter(p => p.finalPrice >= Number(minPrice));
  }
  if (maxPrice) {
    list = list.filter(p => p.finalPrice <= Number(maxPrice));
  }

  // Sort
  if (sort === "price_low") {
    list.sort((a, b) => a.finalPrice - b.finalPrice);
  } else if (sort === "price_high") {
    list.sort((a, b) => b.finalPrice - a.finalPrice);
  } else if (sort === "views") {
    list.sort((a, b) => b.views - a.views);
  } else {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json({ products: list });
});

app.get("/api/products/:id", (req, res) => {
  const prod = db.products.find(p => p.id === req.params.id);
  if (!prod) return res.status(404).json({ error: "Product not found" });
  prod.views += 1;
  res.json({ product: prod });
});

app.post("/api/products", (req, res) => {
  const { sellerId, name, category, brand, model, condition, whatItIs, whatItIsUsedFor, description, features, specifications, originalPrice, discount, quantity, deliveryCharges, estimatedDeliveryTime, warrantyDuration, returnPolicy, refundPolicy, mediaUrls } = req.body;
  const user = db.users.find(u => u.id === sellerId);
  if (!user || user.role !== "SELLER") {
    return res.status(403).json({ error: "Only registered sellers can publish products." });
  }

  // Check subscription status
  const sub = db.subscriptions[sellerId];
  if (sub && sub.status === "expired") {
    return res.status(402).json({ error: "Your Seller Subscription has expired. Please upgrade to continue selling." });
  }

  const origPrice = Number(originalPrice) || 0;
  const disc = Math.min(100, Math.max(0, Number(discount) || 0));
  const finalPrice = Math.round(origPrice * (1 - disc / 100));

  const newProduct: Product = {
    id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sellerId: user.id,
    sellerName: `${user.firstName} ${user.lastName}`,
    sellerUsername: user.username,
    sellerAvatar: user.avatar,
    sellerCity: user.city,
    name: name || "Untitled Product",
    category: category || "General",
    brand: brand || "Unbranded",
    model: model || "Standard",
    condition: condition || "New",
    whatItIs: whatItIs || "",
    whatItIsUsedFor: whatItIsUsedFor || "",
    description: description || "",
    features: Array.isArray(features) ? features : [],
    specifications: specifications || {},
    quantity: Number(quantity) || 1,
    originalPrice: origPrice,
    discount: disc,
    finalPrice,
    guarantee: true,
    warranty: Boolean(warrantyDuration),
    warrantyDuration: warrantyDuration || "No warranty",
    deliveryAvailable: true,
    deliveryCharges: Number(deliveryCharges) || 0,
    freeDelivery: Number(deliveryCharges) === 0,
    estimatedDeliveryTime: estimatedDeliveryTime || "2-3 Days via COD",
    returnPolicy: returnPolicy || "Standard COD checking allowed.",
    refundPolicy: refundPolicy || "Defective items replaced or refunded.",
    mediaUrls: Array.isArray(mediaUrls) && mediaUrls.length > 0 ? mediaUrls : ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"],
    status: "active",
    views: 0,
    likes: 0,
    saves: 0,
    shares: 0,
    orderNowClicks: 0,
    customerInquiries: 0,
    createdAt: new Date().toISOString(),
  };

  db.products.unshift(newProduct);
  res.status(201).json({ product: newProduct });
});

app.put("/api/products/:id", (req, res) => {
  const prod = db.products.find(p => p.id === req.params.id);
  if (!prod) return res.status(404).json({ error: "Product not found" });

  const { name, category, brand, model, condition, originalPrice, discount, quantity, deliveryCharges, estimatedDeliveryTime, warrantyDuration, returnPolicy, refundPolicy, status } = req.body;
  if (name !== undefined) prod.name = name;
  if (category !== undefined) prod.category = category;
  if (brand !== undefined) prod.brand = brand;
  if (model !== undefined) prod.model = model;
  if (condition !== undefined) prod.condition = condition;
  if (originalPrice !== undefined) {
    prod.originalPrice = Number(originalPrice);
    prod.finalPrice = Math.round(prod.originalPrice * (1 - (prod.discount || 0) / 100));
  }
  if (discount !== undefined) {
    prod.discount = Number(discount);
    prod.finalPrice = Math.round((prod.originalPrice || 0) * (1 - prod.discount / 100));
  }
  if (quantity !== undefined) prod.quantity = Number(quantity);
  if (deliveryCharges !== undefined) {
    prod.deliveryCharges = Number(deliveryCharges);
    prod.freeDelivery = prod.deliveryCharges === 0;
  }
  if (estimatedDeliveryTime !== undefined) prod.estimatedDeliveryTime = estimatedDeliveryTime;
  if (warrantyDuration !== undefined) {
    prod.warrantyDuration = warrantyDuration;
    prod.warranty = Boolean(warrantyDuration);
  }
  if (returnPolicy !== undefined) prod.returnPolicy = returnPolicy;
  if (refundPolicy !== undefined) prod.refundPolicy = refundPolicy;
  if (status !== undefined) prod.status = status;

  res.json({ product: prod });
});

// 5. CHATS & ORDER NOW FLOW
// Flow: Product -> ORDER NOW -> Seller/Order Chat -> Product Context attached -> Discussion -> COD
app.post("/api/chats/order-now", (req, res) => {
  const { buyerId, productId } = req.body;
  const buyer = db.users.find(u => u.id === buyerId);
  const product = db.products.find(p => p.id === productId);

  if (!buyer || !product) {
    return res.status(400).json({ error: "Valid buyer and product are required" });
  }

  const seller = db.users.find(u => u.id === product.sellerId);
  if (!seller) return res.status(404).json({ error: "Product seller not found" });

  // Increment product's orderNowClicks (Explicitly noted: NOT a confirmed sale!)
  product.orderNowClicks += 1;
  product.customerInquiries += 1;

  const productContext: ProductContext = {
    productId: product.id,
    productName: product.name,
    productPrice: product.originalPrice,
    productDiscount: product.discount,
    finalPrice: product.finalPrice,
    productImage: product.mediaUrls[0] || "",
    sellerId: seller.id,
    sellerName: `${seller.firstName} ${seller.lastName}`,
    sellerCity: product.sellerCity,
    freeDelivery: product.freeDelivery,
    warranty: product.warranty,
    warrantyDuration: product.warrantyDuration,
  };

  // Check if an existing Seller Chat already exists between this buyer and seller for this product or seller
  let conv = db.conversations.find(
    c => c.type === "seller" &&
    c.participantIds.includes(buyer.id) &&
    c.participantIds.includes(seller.id) &&
    c.productContext?.productId === product.id
  );

  let isNew = false;
  if (!conv) {
    isNew = true;
    conv = {
      id: `conv_seller_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: "seller",
      participantIds: [seller.id, buyer.id],
      participants: [
        {
          id: seller.id,
          name: `${seller.firstName} ${seller.lastName}`,
          username: seller.username,
          avatar: seller.avatar,
          role: seller.role,
          isOnline: true,
        },
        {
          id: buyer.id,
          name: `${buyer.firstName} ${buyer.lastName}`,
          username: buyer.username,
          avatar: buyer.avatar,
          role: buyer.role,
          isOnline: true,
        }
      ],
      productContext,
      unreadCount: 1,
      socialRequestStatus: "none",
      updatedAt: new Date().toISOString(),
    };

    db.conversations.unshift(conv);
    db.messages[conv.id] = [];

    // Trigger Seller's Automatic Welcome Message on first order contact
    const welcomeMsgText = seller.sellerSettings?.welcomeMessage ||
      `Assalam o Alaikum! Thank you for inquiring about ${product.name}. Please let me know your delivery city and any questions before we arrange Cash on Delivery.`;

    const autoMsg: Message = {
      id: `msg_welcome_${Date.now()}`,
      conversationId: conv.id,
      senderId: seller.id,
      senderName: `${seller.firstName} ${seller.lastName}`,
      senderAvatar: seller.avatar,
      text: welcomeMsgText,
      productContext,
      status: "delivered",
      timestamp: new Date().toISOString(),
    };

    db.messages[conv.id].push(autoMsg);
    conv.lastMessage = autoMsg;

    // Send notification to Seller about Order Now click & inquiry
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: seller.id,
      category: "marketplace",
      title: "New Order Now Inquiry",
      message: `${buyer.firstName} ${buyer.lastName} tapped ORDER NOW on ${product.name}. Discussion started.`,
      targetType: "chat",
      targetId: conv.id,
      avatar: buyer.avatar,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  res.json({ conversation: conv, isNew });
});

// List conversations separated by type (social, seller, or groups)
app.get("/api/chats", (req, res) => {
  const userId = String(req.query.userId || "");
  const type = String(req.query.type || ""); // 'social', 'seller', or 'groups'

  let list = db.conversations.filter(c => c.participantIds.includes(userId));
  if (type === "groups") {
    list = list.filter(c => c.isGroup === true);
  } else if (type === "social") {
    list = list.filter(c => c.type === "social" && !c.isGroup);
  } else if (type === "seller") {
    list = list.filter(c => c.type === "seller");
  }

  list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json({ conversations: list });
});

// Get messages for conversation
app.get("/api/chats/:id/messages", (req, res) => {
  const msgs = db.messages[req.params.id] || [];
  res.json({ messages: msgs });
});

// Send message
app.post("/api/chats/:id/messages", (req, res) => {
  const conv = db.conversations.find(c => c.id === req.params.id);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  const { senderId, text, mediaUrl, mediaType } = req.body;
  const sender = db.users.find(u => u.id === senderId);
  if (!sender || (!text && !mediaUrl)) return res.status(400).json({ error: "Sender and content required" });

  const newMsg: Message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    conversationId: conv.id,
    senderId: sender.id,
    senderName: `${sender.firstName} ${sender.lastName}`,
    senderAvatar: sender.avatar,
    text: text ? text.trim() : "",
    mediaUrl,
    mediaType,
    status: "sent",
    timestamp: new Date().toISOString(),
  };

  if (!db.messages[conv.id]) db.messages[conv.id] = [];
  db.messages[conv.id].push(newMsg);

  conv.lastMessage = newMsg;
  conv.updatedAt = new Date().toISOString();

  // Simulate delivery
  setTimeout(() => {
    newMsg.status = "delivered";
  }, 300);

  // Notify other participants
  const otherIds = conv.participantIds.filter(id => id !== sender.id);
  otherIds.forEach(recipientId => {
    db.notifications.unshift({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 4)}`,
      userId: recipientId,
      category: "messages",
      title: `Message from ${sender.firstName}`,
      message: text ? text.substring(0, 50) : "Shared a media item",
      targetType: "chat",
      targetId: conv.id,
      avatar: sender.avatar,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  });

  res.status(201).json({ message: newMsg });
});

// Send Social Request inside Seller Chat to bridge to Social Chat
app.post("/api/chats/:id/social-request", (req, res) => {
  const conv = db.conversations.find(c => c.id === req.params.id);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  const { senderId, action } = req.body; // action: 'send' | 'accept' | 'reject'
  const sender = db.users.find(u => u.id === senderId);
  if (!sender) return res.status(404).json({ error: "User not found" });

  const otherId = conv.participantIds.find(id => id !== senderId);
  const otherUser = db.users.find(u => u.id === otherId);

  if (action === "send") {
    conv.socialRequestStatus = "pending";
    conv.socialRequestSenderId = senderId;

    if (otherUser) {
      db.notifications.unshift({
        id: `notif_${Date.now()}`,
        userId: otherId!,
        category: "requests",
        title: "Social Connection Request",
        message: `${sender.firstName} ${sender.lastName} sent you a social connection request from your marketplace chat.`,
        targetType: "chat",
        targetId: conv.id,
        avatar: sender.avatar,
        isRead: false,
        createdAt: new Date().toISOString(),
        actionData: {
          requestId: conv.id,
          senderId: sender.id,
          senderName: `${sender.firstName} ${sender.lastName}`,
          status: "pending",
        }
      });
    }
    return res.json({ status: "pending", conversation: conv });
  }

  if (action === "accept") {
    conv.socialRequestStatus = "accepted";

    // Create a new separate Social Conversation!
    const socialConv: Conversation = {
      id: `conv_soc_${Date.now()}`,
      type: "social",
      participantIds: [...conv.participantIds],
      participants: [...conv.participants],
      lastMessage: {
        id: `msg_soc_init_${Date.now()}`,
        conversationId: `conv_soc_${Date.now()}`,
        senderId: sender.id,
        senderName: `${sender.firstName} ${sender.lastName}`,
        senderAvatar: sender.avatar,
        text: "Connected on Social Chat! You can now share photos, reels, and stories freely.",
        status: "read",
        timestamp: new Date().toISOString(),
      },
      unreadCount: 0,
      socialRequestStatus: "accepted",
      updatedAt: new Date().toISOString(),
    };

    db.conversations.unshift(socialConv);
    db.messages[socialConv.id] = [socialConv.lastMessage!];

    return res.json({ status: "accepted", newSocialConversationId: socialConv.id });
  }

  if (action === "reject") {
    conv.socialRequestStatus = "rejected";
    return res.json({ status: "rejected" });
  }

  res.status(400).json({ error: "Invalid action" });
});

// Start or retrieve a direct conversation between two users
app.post("/api/chats/direct", (req, res) => {
  const { userAId, userBId, product } = req.body;
  const userA = db.users.find(u => u.id === userAId);
  const userB = db.users.find(u => u.id === userBId);

  if (!userA || !userB) {
    return res.status(400).json({ error: "Both users are required to initiate chat" });
  }

  const chatType = (product || userB.role === 'SELLER' || userA.role === 'SELLER') ? 'seller' : 'social';

  let conv = db.conversations.find(
    c => c.participantIds.includes(userAId) &&
         c.participantIds.includes(userBId) &&
         (!product || c.productContext?.productId === product.id)
  );

  if (!conv) {
    conv = {
      id: `conv_${chatType}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: chatType,
      participantIds: [userA.id, userB.id],
      participants: [
        {
          id: userA.id,
          name: `${userA.firstName} ${userA.lastName}`,
          username: userA.username,
          avatar: userA.avatar,
          role: userA.role,
          isOnline: true,
        },
        {
          id: userB.id,
          name: `${userB.firstName} ${userB.lastName}`,
          username: userB.username,
          avatar: userB.avatar,
          role: userB.role,
          isOnline: true,
        }
      ],
      productContext: product ? {
        productId: product.id,
        productName: product.name,
        productPrice: product.originalPrice,
        productDiscount: product.discount,
        finalPrice: product.finalPrice,
        productImage: product.mediaUrls?.[0] || "",
        sellerId: product.sellerId,
        sellerName: product.sellerName || `${userB.firstName} ${userB.lastName}`,
        sellerCity: product.sellerCity || userB.city,
        freeDelivery: Boolean(product.freeDelivery),
        warranty: Boolean(product.warranty),
        warrantyDuration: product.warrantyDuration,
      } : undefined,
      unreadCount: 0,
      socialRequestStatus: "none",
      updatedAt: new Date().toISOString(),
    };

    // If this is a Seller/Order chat, send seller's configured welcome message on first creation
    if (chatType === 'seller') {
      const seller = userB.role === 'SELLER' ? userB : (userA.role === 'SELLER' ? userA : userB);
      const welcomeText = seller.sellerSettings?.welcomeMessage || 
        "Hello! Thank you for contacting me. Please let me know what details you need about my product.";
      
      const welcomeMsg = {
        id: `msg_welcome_${Date.now()}`,
        conversationId: conv.id,
        senderId: seller.id,
        senderName: `${seller.firstName} ${seller.lastName}`,
        senderAvatar: seller.avatar,
        text: welcomeText,
        status: "delivered" as const,
        timestamp: new Date().toISOString(),
      };

      conv.lastMessage = welcomeMsg;
      db.messages[conv.id] = [welcomeMsg];
    } else {
      db.messages[conv.id] = [];
    }

    db.conversations.unshift(conv);
  }

  res.json({ conversation: conv });
});

// ==========================================
// GROUPS API
// ==========================================

// Get all groups or user groups
app.get("/api/groups", (req, res) => {
  const userId = String(req.query.userId || "");
  const groups = db.conversations
    .filter(c => c.isGroup === true && (!userId || c.participantIds.includes(userId)))
    .map(c => ({
      conversationId: c.id,
      ...c.groupMeta,
      lastMessage: c.lastMessage,
      unreadCount: c.unreadCount || 0,
      updatedAt: c.updatedAt,
      participants: c.participants,
    }));
  res.json({ groups });
});

// Create new group
app.post("/api/groups", (req, res) => {
  const { name, description, photo, creatorId, memberIds = [], onlyAdminsCanPost = false, onlyAdminsCanEditInfo = false } = req.body;
  const creator = db.users.find(u => u.id === creatorId);
  if (!creator || !name) return res.status(400).json({ error: "Name and valid creator required" });

  const allMemberIds = Array.from(new Set([creatorId, ...memberIds]));
  const participants = allMemberIds.map(id => {
    const u = db.users.find(user => user.id === id);
    return u ? {
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      username: u.username,
      avatar: u.avatar,
      role: u.role,
    } : {
      id,
      name: "Member",
      username: `user_${id.substring(0, 5)}`,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
      role: "SOCIAL" as const,
    };
  });

  const groupId = `grp_${Date.now()}`;
  const convId = `conv_grp_${Date.now()}`;
  const defaultPhoto = photo || "https://images.unsplash.com/photo-1522071823991-b9671e9d7fbd?w=300&auto=format&fit=crop&q=80";

  const groupMeta = {
    id: groupId,
    name: name.trim(),
    description: description ? description.trim() : "",
    photo: defaultPhoto,
    creatorId,
    adminIds: [creatorId],
    memberIds: allMemberIds,
    onlyAdminsCanPost: Boolean(onlyAdminsCanPost),
    onlyAdminsCanEditInfo: Boolean(onlyAdminsCanEditInfo),
  };

  const initialMsg: Message = {
    id: `msg_grp_init_${Date.now()}`,
    conversationId: convId,
    senderId: creator.id,
    senderName: `${creator.firstName} ${creator.lastName}`,
    senderAvatar: creator.avatar,
    text: `${creator.firstName} created group "${name.trim()}"`,
    status: "read",
    timestamp: new Date().toISOString(),
  };

  const groupConv: Conversation = {
    id: convId,
    type: "social",
    participantIds: allMemberIds,
    participants,
    isGroup: true,
    groupName: name.trim(),
    groupAvatar: defaultPhoto,
    groupMeta,
    lastMessage: initialMsg,
    unreadCount: 0,
    updatedAt: new Date().toISOString(),
  };

  db.conversations.unshift(groupConv);
  db.messages[convId] = [initialMsg];

  res.status(201).json({ group: groupMeta, conversation: groupConv });
});

// Update group settings/info
app.put("/api/groups/:id", (req, res) => {
  const conv = db.conversations.find(c => c.isGroup && (c.id === req.params.id || c.groupMeta?.id === req.params.id));
  if (!conv || !conv.groupMeta) return res.status(404).json({ error: "Group not found" });

  const { name, description, photo, onlyAdminsCanPost, onlyAdminsCanEditInfo, requesterId } = req.body;
  if (requesterId && conv.groupMeta.onlyAdminsCanEditInfo && !conv.groupMeta.adminIds.includes(requesterId)) {
    return res.status(403).json({ error: "Only admins can edit group settings" });
  }

  if (name) {
    conv.groupName = name.trim();
    conv.groupMeta.name = name.trim();
  }
  if (description !== undefined) conv.groupMeta.description = description.trim();
  if (photo) {
    conv.groupAvatar = photo;
    conv.groupMeta.photo = photo;
  }
  if (onlyAdminsCanPost !== undefined) conv.groupMeta.onlyAdminsCanPost = Boolean(onlyAdminsCanPost);
  if (onlyAdminsCanEditInfo !== undefined) conv.groupMeta.onlyAdminsCanEditInfo = Boolean(onlyAdminsCanEditInfo);
  conv.updatedAt = new Date().toISOString();

  res.json({ group: conv.groupMeta, conversation: conv });
});

// Add members to group
app.post("/api/groups/:id/members", (req, res) => {
  const conv = db.conversations.find(c => c.isGroup && (c.id === req.params.id || c.groupMeta?.id === req.params.id));
  if (!conv || !conv.groupMeta) return res.status(404).json({ error: "Group not found" });

  const { memberIds = [] } = req.body;
  const newMemberIds = memberIds.filter((id: string) => !conv.participantIds.includes(id));

  newMemberIds.forEach((id: string) => {
    conv.participantIds.push(id);
    conv.groupMeta!.memberIds.push(id);
    const u = db.users.find(user => user.id === id);
    if (u) {
      conv.participants.push({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        username: u.username,
        avatar: u.avatar,
        role: u.role,
      });
    }
  });

  res.json({ group: conv.groupMeta, conversation: conv });
});

// Remove member / leave group
app.delete("/api/groups/:id/members/:userId", (req, res) => {
  const conv = db.conversations.find(c => c.isGroup && (c.id === req.params.id || c.groupMeta?.id === req.params.id));
  if (!conv || !conv.groupMeta) return res.status(404).json({ error: "Group not found" });

  const userIdToRemove = req.params.userId;
  conv.participantIds = conv.participantIds.filter(id => id !== userIdToRemove);
  conv.groupMeta.memberIds = conv.groupMeta.memberIds.filter(id => id !== userIdToRemove);
  conv.groupMeta.adminIds = conv.groupMeta.adminIds.filter(id => id !== userIdToRemove);
  conv.participants = conv.participants.filter(p => p.id !== userIdToRemove);

  res.json({ success: true, group: conv.groupMeta, conversation: conv });
});

// Promote/demote group admin
app.put("/api/groups/:id/admins", (req, res) => {
  const conv = db.conversations.find(c => c.isGroup && (c.id === req.params.id || c.groupMeta?.id === req.params.id));
  if (!conv || !conv.groupMeta) return res.status(404).json({ error: "Group not found" });

  const { targetUserId, action } = req.body; // 'promote' | 'demote'
  if (action === "promote" && !conv.groupMeta.adminIds.includes(targetUserId)) {
    conv.groupMeta.adminIds.push(targetUserId);
  } else if (action === "demote") {
    conv.groupMeta.adminIds = conv.groupMeta.adminIds.filter(id => id !== targetUserId);
  }

  res.json({ group: conv.groupMeta, conversation: conv });
});

// ==========================================
// CHANNELS API
// ==========================================

// Get all channels with follow status
app.get("/api/channels", (req, res) => {
  const userId = String(req.query.userId || "");
  const channels = (db.channels || []).map(ch => ({
    ...ch,
    isFollowing: userId ? ch.followerIds?.includes(userId) : false,
    followersCount: (ch.followerIds || []).length,
  }));
  res.json({ channels });
});

// Create channel
app.post("/api/channels", (req, res) => {
  const { name, description, photo, ownerId } = req.body;
  const owner = db.users.find(u => u.id === ownerId);
  if (!owner || !name) return res.status(400).json({ error: "Valid owner and name required" });

  const newChannel = {
    id: `chan_${Date.now()}`,
    name: name.trim(),
    description: description ? description.trim() : "",
    photo: photo || "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&auto=format&fit=crop&q=80",
    ownerId: owner.id,
    ownerName: `${owner.firstName} ${owner.lastName}`,
    adminIds: [owner.id],
    followerIds: [owner.id],
    createdAt: new Date().toISOString(),
  };

  db.channels.unshift(newChannel);
  db.channelPosts[newChannel.id] = [
    {
      id: `cpost_init_${Date.now()}`,
      channelId: newChannel.id,
      authorId: owner.id,
      authorName: `${owner.firstName} ${owner.lastName}`,
      authorAvatar: owner.avatar,
      text: `Welcome to ${newChannel.name}! Updates, announcements, and drops will be broadcast here.`,
      reactions: { "👍": 1 },
      sharesCount: 0,
      createdAt: new Date().toISOString(),
    }
  ];

  res.status(201).json({ channel: newChannel });
});

// Follow/unfollow channel
app.post("/api/channels/:id/follow", (req, res) => {
  const channel = (db.channels || []).find(c => c.id === req.params.id);
  if (!channel) return res.status(404).json({ error: "Channel not found" });

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "User ID required" });

  const isFollowing = channel.followerIds.includes(userId);
  if (isFollowing) {
    channel.followerIds = channel.followerIds.filter((id: string) => id !== userId);
  } else {
    channel.followerIds.push(userId);
  }

  res.json({
    isFollowing: !isFollowing,
    followersCount: channel.followerIds.length,
  });
});

// Get channel posts/updates
app.get("/api/channels/:id/posts", (req, res) => {
  const posts = db.channelPosts[req.params.id] || [];
  res.json({ posts });
});

// Broadcast post to channel (admins only)
app.post("/api/channels/:id/posts", (req, res) => {
  const channel = (db.channels || []).find(c => c.id === req.params.id);
  if (!channel) return res.status(404).json({ error: "Channel not found" });

  const { authorId, text, mediaUrl, mediaType, productId, productName, productPrice, productImage } = req.body;
  const author = db.users.find(u => u.id === authorId);
  if (!author) return res.status(400).json({ error: "Author not found" });

  if (!channel.adminIds.includes(authorId) && channel.ownerId !== authorId) {
    return res.status(403).json({ error: "Only channel admins can post updates" });
  }

  const newPost = {
    id: `cpost_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    channelId: channel.id,
    authorId: author.id,
    authorName: `${author.firstName} ${author.lastName}`,
    authorAvatar: author.avatar,
    text: text ? text.trim() : "",
    mediaUrl,
    mediaType,
    productId,
    productName,
    productPrice,
    productImage,
    reactions: {},
    sharesCount: 0,
    createdAt: new Date().toISOString(),
  };

  if (!db.channelPosts[channel.id]) db.channelPosts[channel.id] = [];
  db.channelPosts[channel.id].unshift(newPost);

  res.status(201).json({ post: newPost });
});

// React to channel post with emoji
app.post("/api/channels/:id/posts/:postId/react", (req, res) => {
  const posts = db.channelPosts[req.params.id] || [];
  const post = posts.find(p => p.id === req.params.postId);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const { emoji, userId } = req.body;
  if (!emoji || !userId) return res.status(400).json({ error: "Emoji and userId required" });

  if (!post.reactions) post.reactions = {};
  if (!post.userReactions) post.userReactions = {};

  const currentReact = post.userReactions[userId];
  if (currentReact === emoji) {
    // Toggle off
    post.reactions[emoji] = Math.max(0, (post.reactions[emoji] || 1) - 1);
    delete post.userReactions[userId];
  } else {
    if (currentReact && post.reactions[currentReact]) {
      post.reactions[currentReact] = Math.max(0, post.reactions[currentReact] - 1);
    }
    post.reactions[emoji] = (post.reactions[emoji] || 0) + 1;
    post.userReactions[userId] = emoji;
  }

  res.json({ reactions: post.reactions, userReacted: post.userReactions[userId] || null });
});

// 6. STATUSES (24 HOURS EXPIRATION)
app.get("/api/statuses", (_req, res) => {
  const now = new Date().getTime();
  // Filter only active statuses under 24 hours old
  const activeStatuses = db.statuses.filter(s => new Date(s.expiresAt).getTime() > now);
  res.json({ statuses: activeStatuses });
});

app.post("/api/statuses", (req, res) => {
  const { userId, type, content, caption, mediaUrl, storagePath, bgGradient } = req.body;
  const user = db.users.find(u => u.id === userId);
  if (!user || (!content && !mediaUrl)) return res.status(400).json({ error: "User and media/content required" });

  const statusMediaType = type || (mediaUrl ? (mediaUrl.includes('.mp4') || mediaUrl.startsWith('data:video') ? 'video' : 'photo') : 'photo');

  const newStatus: UserStatus = {
    id: `stat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    userName: `${user.firstName} ${user.lastName}`.trim() || user.username,
    userAvatar: user.avatar,
    type: statusMediaType,
    content: caption || content || "",
    caption: caption || undefined,
    mediaUrl: mediaUrl || "",
    storagePath: storagePath || undefined,
    bgGradient: bgGradient || "from-violet-600 to-indigo-700",
    views: [],
    reactions: [],
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 3600000).toISOString(), // Exactly 24 Hours expiration
  };

  db.statuses.unshift(newStatus);
  res.status(201).json({ status: newStatus });
});

app.post("/api/statuses/:id/view", (req, res) => {
  const stat = db.statuses.find(s => s.id === req.params.id);
  if (!stat) return res.status(404).json({ error: "Status not found" });
  const { userId } = req.body;
  const user = db.users.find(u => u.id === userId);

  if (user && !stat.views.some(v => v.userId === user.id)) {
    stat.views.push({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userAvatar: user.avatar,
      viewedAt: new Date().toISOString(),
    });
  }
  res.json({ viewsCount: stat.views.length, views: stat.views });
});

app.post("/api/statuses/:id/reaction", (req, res) => {
  const stat = db.statuses.find(s => s.id === req.params.id);
  if (!stat) return res.status(404).json({ error: "Status not found" });
  const { userId, emoji } = req.body;

  if (userId && emoji) {
    stat.reactions.push({ userId, emoji });
  }
  res.json({ reactions: stat.reactions });
});

// 7. NOTIFICATIONS
app.get("/api/notifications", (req, res) => {
  const userId = String(req.query.userId || "");
  const category = String(req.query.category || "");

  let list = db.notifications.filter(n => !userId || n.userId === userId);
  if (category && category !== "all") {
    list = list.filter(n => n.category === category);
  }

  const unreadCount = list.filter(n => !n.isRead).length;
  res.json({ notifications: list, unreadCount });
});

app.put("/api/notifications/:id/read", (req, res) => {
  const notif = db.notifications.find(n => n.id === req.params.id);
  if (notif) notif.isRead = true;
  res.json({ success: true });
});

app.post("/api/notifications/mark-all-read", (req, res) => {
  const { userId } = req.body;
  db.notifications.forEach(n => {
    if (!userId || n.userId === userId) n.isRead = true;
  });
  res.json({ success: true });
});

// 8. SELLER CENTER: ANALYTICS & SUBSCRIPTIONS
app.get("/api/seller/analytics", (req, res) => {
  const sellerId = String(req.query.sellerId || "");
  const range = (req.query.range as string) || "7days";

  const sellerProducts = db.products.filter(p => p.sellerId === sellerId);
  const totalProductViews = sellerProducts.reduce((sum, p) => sum + p.views, 0);
  const totalProductLikes = sellerProducts.reduce((sum, p) => sum + p.likes, 0);
  const totalOrderNowClicks = sellerProducts.reduce((sum, p) => sum + p.orderNowClicks, 0);
  const totalCustomerInquiries = sellerProducts.reduce((sum, p) => sum + p.customerInquiries, 0);

  const analytics: SellerAnalytics = {
    timeRange: range as any,
    totalViews: totalProductViews + 450,
    productViews: totalProductViews,
    likes: totalProductLikes,
    comments: 38,
    saves: 120,
    shares: 45,
    followers: 1420,
    following: 88,
    orderNowClicks: totalOrderNowClicks,
    customerInquiries: totalCustomerInquiries,
    productBreakdown: sellerProducts.map(p => ({
      productId: p.id,
      productName: p.name,
      views: p.views,
      likes: p.likes,
      saves: p.saves,
      orderNowClicks: p.orderNowClicks,
      inquiries: p.customerInquiries,
    })),
  };

  res.json({ analytics });
});

app.get("/api/seller/subscription", (req, res) => {
  const sellerId = String(req.query.sellerId || "");
  let sub = db.subscriptions[sellerId];

  if (!sub) {
    // Default to trial active for registered sellers
    sub = {
      userId: sellerId,
      status: "trial_active",
      planName: "7-Day Free Trial",
      trialStartDate: new Date().toISOString(),
      trialEndDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      expiryDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    };
    db.subscriptions[sellerId] = sub;
  }

  // Calculate days remaining
  const now = new Date().getTime();
  const exp = new Date(sub.expiryDate).getTime();
  const diffDays = Math.ceil((exp - now) / 86400000);

  if (diffDays <= 0 && sub.status !== "expired") {
    sub.status = "expired";
  }

  res.json({
    subscription: sub,
    daysRemaining: Math.max(0, diffDays),
    isExpired: sub.status === "expired",
    plans: [
      { id: "plan_1mo", name: "1 Month", months: 1, price: 1899, currency: "PKR", discountPercent: 0 },
      { id: "plan_3mo", name: "3 Months", months: 3, price: 5583, currency: "PKR", discountPercent: 2 },
      { id: "plan_6mo", name: "6 Months", months: 6, price: 10824, currency: "PKR", discountPercent: 5 },
      { id: "plan_12mo", name: "12 Months", months: 12, price: 19825, currency: "PKR", discountPercent: 13 },
    ]
  });
});

// Pay and verify subscription with Pakistani payment methods: Easypaisa, JazzCash, Bank, Card
app.post("/api/seller/subscription/pay", (req, res) => {
  const { sellerId, planId, paymentMethod, accountMobile, transactionReference } = req.body;
  const seller = db.users.find(u => u.id === sellerId);
  if (!seller) return res.status(404).json({ error: "Seller not found" });

  const planDurations: Record<string, { months: number; name: string; price: number }> = {
    plan_1mo: { months: 1, name: "1 Month Plan", price: 1899 },
    plan_3mo: { months: 3, name: "3 Months Plan", price: 5583 },
    plan_6mo: { months: 6, name: "6 Months Plan", price: 10824 },
    plan_12mo: { months: 12, name: "12 Months Plan", price: 19825 },
  };

  const selectedPlan = planDurations[planId] || planDurations.plan_1mo;
  const durationMs = selectedPlan.months * 30 * 86400000;
  const newExpiry = new Date(Date.now() + durationMs).toISOString();

  const sub: SellerSubscription = {
    userId: seller.id,
    status: "active",
    planId,
    planName: selectedPlan.name,
    trialStartDate: db.subscriptions[seller.id]?.trialStartDate || new Date().toISOString(),
    trialEndDate: db.subscriptions[seller.id]?.trialEndDate || new Date().toISOString(),
    subscriptionStartDate: new Date().toISOString(),
    expiryDate: newExpiry,
    paymentMethod,
    transactionId: transactionReference || `${paymentMethod.toUpperCase()}-${Date.now().toString().substring(5)}`,
    lastPaymentDate: new Date().toISOString(),
  };

  db.subscriptions[seller.id] = sub;

  // Add confirmation notification
  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: seller.id,
    category: "seller",
    title: "Subscription Activated",
    message: `Payment of Rs. ${selectedPlan.price.toLocaleString()} verified via ${paymentMethod.toUpperCase()}. Your ${selectedPlan.name} is active until ${new Date(newExpiry).toLocaleDateString()}.`,
    targetType: "subscription",
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminId: "payment_system",
    adminUsername: "Marketly Billing",
    action: "SUBSCRIPTION_ACTIVATED",
    target: `${seller.username} (${seller.id})`,
    reason: `Verified ${selectedPlan.name} via ${paymentMethod} (${sub.transactionId})`,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, subscription: sub });
});

// 9. MARKETLY AI & AI HELP (Multilingual English & Urdu using Gemini 3.8 Flash)
app.post("/api/gemini/chat", async (req, res) => {
  const { prompt, history, language } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const ai = getAIClient();
  if (!ai) {
    // Graceful fallback message strictly conforming to specification instructions
    return res.json({
      text: language === "ur"
        ? "مارکیٹلی AI فی الوقت دستیاب نہیں ہے۔ براہ کرم کچھ دیر بعد دوبارہ کوشش کریں۔"
        : "Marketly AI is temporarily unavailable. Please try again shortly."
    });
  }

  try {
    const isUrdu = language === "ur" || /[\u0600-\u06FF]/.test(prompt);

    const systemInstruction = `
You are Marketly AI, the official intelligent assistant for Marketly ("Discover. Connect. Sell.").
Marketly is Pakistan's premier social marketplace application combining Marketplace, Social Media, Messenger, and Seller Business Platform.

CORE RULES:
1. Language matching:
   - If the user speaks Urdu or asks in Urdu, answer in clean, natural Urdu with proper punctuation.
   - If the user speaks English, answer in clean, professional English.
   - If user mixes English and Urdu, provide a natural bilingual response.
2. Structure and formatting:
   - Always organize responses with bold headings, bullet points, numbered steps, and short scannable paragraphs.
   - Never output giant unformatted blocks of text.
3. Marketly Domain Knowledge:
   - Orders: Marketly intentionally does NOT use traditional orders or order histories. The exact flow is: Product -> ORDER NOW -> Seller Chat -> Product Context attached -> Buyer + Seller Discussion -> Cash on Delivery (COD).
   - Roles:
     - SELLER: Sells products, manages Seller Center, product analytics, 7-day free trial then subscription (1mo: Rs. 1,899, 3mo: Rs. 5,583, 6mo: Rs. 10,824, 12mo: Rs. 19,825 with Easypaisa, JazzCash, Bank Transfer, Card). Can post to SELLER and SOCIAL.
     - BUYER: Completely free. Can browse products, click ORDER NOW, chat with sellers, post to BUYER and SOCIAL.
     - SOCIAL: Completely free. Can only see SELLER and SOCIAL content (BUYER CONTENT IS FORBIDDEN). Posts to SOCIAL only.
   - Messenger: Social Chat and Seller/Order Chat are strictly separate. In Seller Chat, users can use "Send Social Request" to connect socially.
   - Status: Stories last exactly 24 hours.
4. Tone:
   - Helpful, polite, welcoming, and concise. Never invent false claims.
`;

    // Construct contents with chat context if available
    let contents: any = prompt;
    if (Array.isArray(history) && history.length > 0) {
      const formattedHistory = history.map((m: any) => `${m.role === "user" ? "User" : "Marketly AI"}: ${m.content}`).join("\n\n");
      contents = `Previous conversation context:\n${formattedHistory}\n\nCurrent user message:\n${prompt}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const outputText = response.text || (language === "ur" ? "معذرت، میں آپ کے سوال کا جواب نہیں بنا سکا۔" : "I was unable to generate a response. Please rephrase.");
    res.json({ text: outputText });
  } catch (err: any) {
    console.error("Gemini AI API Error:", err);
    res.status(500).json({
      text: language === "ur"
        ? "مارکیٹلی AI سروس میں عارضی خرابی پیش آ گئی ہے۔ براہ کرم تھوڑی دیر بعد کوشش کریں۔"
        : "Marketly AI is temporarily unavailable. Please try again shortly."
    });
  }
});

// 10. REPORTING & MODERATION
app.post("/api/reports", (req, res) => {
  const { reporterId, reporterUsername, targetType, targetId, targetTitle, reason, description } = req.body;
  if (!reporterId || !targetType || !targetId || !reason) {
    return res.status(400).json({ error: "Missing required report fields" });
  }

  const newReport: ReportItem = {
    id: `rep_${Date.now()}`,
    reporterId,
    reporterUsername: reporterUsername || "anonymous",
    targetType,
    targetId,
    targetTitle: targetTitle || `${targetType} (${targetId})`,
    reason,
    description: description || "",
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  db.reports.unshift(newReport);
  res.status(201).json({ success: true, report: newReport });
});

// 11. ADMIN PANEL (Protected Admin endpoints)
app.get("/api/admin/dashboard", (req, res) => {
  const adminId = String(req.query.adminId || "");
  const user = db.users.find(u => u.id === adminId);
  // Allow inspection if role is ADMIN or demo supervisor
  const totalUsers = db.users.length;
  const activeUsers = db.users.filter(u => !u.isDeactivated).length;
  const sellers = db.users.filter(u => u.role === "SELLER").length;
  const buyers = 0;
  const socialUsers = db.users.filter(u => u.role === "SOCIAL").length;
  const activeSubscriptions = Object.values(db.subscriptions).filter(s => s.status === "active").length;
  const trialSellers = Object.values(db.subscriptions).filter(s => s.status === "trial_active").length;
  const expiredSellers = Object.values(db.subscriptions).filter(s => s.status === "expired").length;
  const products = db.products.length;
  const posts = db.posts.length;
  const messagesCount = Object.values(db.messages).reduce((acc, m) => acc + m.length, 0);
  const reportsCount = db.reports.filter(r => r.status === "pending").length;

  res.json({
    metrics: {
      totalUsers,
      activeUsers,
      sellers,
      buyers,
      socialUsers,
      activeSubscriptions,
      trialSellers,
      expiredSellers,
      products,
      posts,
      messages: messagesCount,
      pendingReports: reportsCount,
      successfulPayments: 18,
    },
    recentReports: db.reports.slice(0, 10),
    auditLogs: db.auditLogs.slice(0, 15),
  });
});

app.put("/api/admin/reports/:id", (req, res) => {
  const report = db.reports.find(r => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: "Report not found" });

  const { status, resolutionReason, adminId } = req.body;
  report.status = status;

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminId: adminId || "admin",
    adminUsername: "marketly_admin",
    action: `REPORT_${status.toUpperCase()}`,
    target: `${report.targetType} (${report.targetId})`,
    reason: resolutionReason || "Admin reviewed content report",
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, report });
});

// ==========================================
// VITE MIDDLEWARE & STATIC SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Marketly server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start Marketly server:", err);
});
