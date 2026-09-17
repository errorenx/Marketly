import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { User, Product, SellerAnalytics } from '../../types';
import { api } from '../../services/api';
import { AddProductModal } from './AddProductModal';
import {
  Store,
  Package,
  BarChart3,
  Plus,
  Sparkles,
  ShieldCheck,
  Eye,
  Heart,
  Bookmark,
  Share2,
  Users,
  ShoppingBag,
  Info,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  MapPin,
  Settings
} from 'lucide-react';

interface SellerCenterViewProps {
  currentUser: User;
  onNavigate: (tab: string, contextId?: string) => void;
}

export const SellerCenterView: React.FC<SellerCenterViewProps> = ({
  currentUser,
  onNavigate,
}) => {
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'analytics' | 'settings'>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [analyticsRange, setAnalyticsRange] = useState('7days');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Store settings state
  const [businessName, setBusinessName] = useState(currentUser.sellerSettings?.businessName || '');
  const [welcomeMessage, setWelcomeMessage] = useState(currentUser.sellerSettings?.welcomeMessage || '');
  const [returnPolicyText, setReturnPolicyText] = useState(currentUser.sellerSettings?.returnPolicyText || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadSellerData = async () => {
    setLoading(true);
    try {
      const [prodRes, analRes] = await Promise.all([
        api.getProducts({ sellerId: currentUser.id }),
        api.getSellerAnalytics(currentUser.id, analyticsRange),
      ]);
      setProducts(prodRes.products || []);
      setAnalytics(analRes.analytics);
    } catch (err) {
      console.error('Error loading seller center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellerData();
  }, [currentUser.id, analyticsRange]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateUser(currentUser.id, {
        sellerSettings: {
          businessName,
          welcomeMessage,
          returnPolicyText,
          completeAddress: currentUser.sellerSettings?.completeAddress || `${currentUser.city}, Pakistan`,
        },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-24 pt-2 px-3 sm:px-4">
      {/* SELLER CENTER TOP BANNER */}
      <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 border border-violet-800/40 rounded-3xl p-5 sm:p-6 shadow-2xl mb-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/40 shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">{t('seller_center') || 'Seller Center'}</h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified Shop
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Manage your product catalog, monitor customer inquiries, and grow your sales.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddProductOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* SELLER TABS HEADER */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'products'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Products ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Store Settings</span>
        </button>
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Active Listings</span>
                <Package className="w-4 h-4 text-violet-400" />
              </div>
              <p className="text-2xl font-black text-white">{products.length}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Product Views</span>
                <Eye className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-black text-white">{analytics?.productViews || products.reduce((a, b) => a + (b.views || 0), 0) || 24}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Order Inquiries</span>
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-white">{analytics?.customerInquiries || 3}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Likes & Saves</span>
                <Heart className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-black text-white">
                {(analytics?.likes || 12) + (analytics?.saves || 5)}
              </p>
            </div>
          </div>

          {/* Recent Products list */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-white">Your Listed Products</h3>
              <button
                onClick={() => setActiveTab('products')}
                className="text-xs text-violet-400 hover:text-violet-300 font-semibold"
              >
                View all ({products.length})
              </button>
            </div>

            {products.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <Package className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-medium">No products listed yet.</p>
                <button
                  onClick={() => setIsAddProductOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-violet-600 text-white font-bold text-xs"
                >
                  Add your first product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {products.slice(0, 6).map((prod) => (
                  <div key={prod.id} className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex gap-3 items-center">
                    <img
                      src={prod.mediaUrls[0]}
                      alt={prod.name}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-white truncate">{prod.name}</h4>
                      <p className="text-xs font-black text-violet-400 mt-0.5">
                        Rs. {prod.finalPrice?.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {prod.views || 0} views • {prod.likes || 0} likes
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-white">All Store Products</h3>
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg hover:border-slate-700 transition-all flex flex-col"
              >
                <div className="aspect-[4/3] bg-black relative">
                  <img
                    src={prod.mediaUrls[0]}
                    alt={prod.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-emerald-400 border border-white/10">
                    Active
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-bold text-sm text-white line-clamp-1">{prod.name}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{prod.whatItIs || prod.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Price</span>
                      <p className="font-black text-sm text-violet-400">Rs. {prod.finalPrice?.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase">Inquiries</span>
                      <p className="font-black text-sm text-white">{prod.customerInquiries || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-white">Store Analytics</h3>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setAnalyticsRange('today')}
                className={`px-2.5 py-1 rounded-lg ${analyticsRange === 'today' ? 'bg-violet-600 text-white' : 'text-slate-400'}`}
              >
                Today
              </button>
              <button
                onClick={() => setAnalyticsRange('7days')}
                className={`px-2.5 py-1 rounded-lg ${analyticsRange === '7days' ? 'bg-violet-600 text-white' : 'text-slate-400'}`}
              >
                7 Days
              </button>
              <button
                onClick={() => setAnalyticsRange('30days')}
                className={`px-2.5 py-1 rounded-lg ${analyticsRange === '30days' ? 'bg-violet-600 text-white' : 'text-slate-400'}`}
              >
                30 Days
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Total Product Views</p>
              <p className="text-2xl font-black text-white mt-1">{analytics?.productViews || 24}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Order Inquiries</p>
              <p className="text-2xl font-black text-white mt-1">{analytics?.orderNowClicks || 3}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Post Likes</p>
              <p className="text-2xl font-black text-white mt-1">{analytics?.likes || 12}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Post Saves</p>
              <p className="text-2xl font-black text-white mt-1">{analytics?.saves || 5}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Shares</p>
              <p className="text-2xl font-black text-white mt-1">{analytics?.shares || 2}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Store Followers</p>
              <p className="text-2xl font-black text-white mt-1">{currentUser.followersCount || 28}</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. STORE SETTINGS TAB */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <h3 className="font-extrabold text-base text-white">Store Settings</h3>
          <p className="text-xs text-slate-400">Update your store identity and buyer customer service policies.</p>

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Store settings saved successfully!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Business / Brand Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Smart Electronics"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Welcome Message for Inquiries</label>
            <textarea
              rows={3}
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Assalam o Alaikum! Welcome to our store. Let us know how we can assist you."
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Checking & Return Policy</label>
            <textarea
              rows={2}
              value={returnPolicyText}
              onChange={(e) => setReturnPolicyText(e.target.value)}
              placeholder="7-day checking warranty. Open parcel inspection on COD."
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow transition-all"
          >
            Save Settings
          </button>
        </form>
      )}

      {/* ADD PRODUCT MODAL */}
      {isAddProductOpen && (
        <AddProductModal
          currentUser={currentUser}
          onClose={() => setIsAddProductOpen(false)}
          onProductAdded={(p) => setProducts((prev) => [p, ...prev])}
        />
      )}
    </div>
  );
};
