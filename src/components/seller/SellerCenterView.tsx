import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { User, Product, SellerSubscription, SellerAnalytics } from '../../types';
import { api } from '../../services/api';
import { AddProductModal } from './AddProductModal';
import {
  Store,
  Package,
  BarChart3,
  CreditCard,
  Plus,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Users,
  ShoppingBag,
  Info,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp
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

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'analytics' | 'subscription'>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [analyticsRange, setAnalyticsRange] = useState('7days');
  const [subscription, setSubscription] = useState<SellerSubscription | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [daysRemaining, setDaysRemaining] = useState(7);
  const [isExpired, setIsExpired] = useState(false);

  // Add Product modal
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Payment checkout modal
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'jazzcash' | 'bank_transfer' | 'card'>('easypaisa');
  const [paymentPhone, setPaymentPhone] = useState('03001234567');
  const [transactionRef, setTransactionRef] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [loading, setLoading] = useState(true);

  const loadSellerData = async () => {
    setLoading(true);
    try {
      const [prodRes, subRes, analRes] = await Promise.all([
        api.getProducts({ sellerId: currentUser.id }),
        api.getSellerSubscription(currentUser.id),
        api.getSellerAnalytics(currentUser.id, analyticsRange),
      ]);
      setProducts(prodRes.products || []);
      setSubscription(subRes.subscription);
      setPlans(subRes.plans || []);
      setDaysRemaining(subRes.daysRemaining);
      setIsExpired(subRes.isExpired);
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

  const handlePaySubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setPaying(true);
    try {
      const res = await api.paySellerSubscription({
        sellerId: currentUser.id,
        planId: selectedPlan.id,
        paymentMethod,
        transactionRef: transactionRef || `PK-${Date.now().toString().slice(-6)}`,
      });
      setSubscription(res.subscription);
      setDaysRemaining(res.daysRemaining);
      setIsExpired(false);
      setPaymentSuccess(true);
      setTimeout(() => {
        setPaymentSuccess(false);
        setSelectedPlan(null);
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Payment failed');
    } finally {
      setPaying(false);
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
                <h1 className="text-xl sm:text-2xl font-black text-white">{t('seller_center')}</h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> COD Certified
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Manage your catalog, analyze buyer interest, and monitor trial status
              </p>
            </div>
          </div>

          {/* Trial / Plan pill */}
          <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-700/60 shrink-0">
            <div className="text-right rtl:text-left">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {subscription?.planName || '7-Day Free Trial'}
              </p>
              <p className={`text-xs font-black ${isExpired ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isExpired ? 'Subscription Expired' : `${daysRemaining} Days Remaining`}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('subscription')}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow transition-colors"
            >
              Plans
            </button>
          </div>
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
          <span>{t('seller_overview')}</span>
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
          <span>{t('seller_products')} ({products.length})</span>
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
          <span>{t('seller_analytics')}</span>
        </button>

        <button
          onClick={() => setActiveTab('subscription')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'subscription'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>{t('seller_subscription')}</span>
        </button>
      </div>

      {/* 1. TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">Catalog Products</span>
              <p className="text-2xl font-black text-white">{products.length}</p>
            </div>
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">Order Now Clicks</span>
              <p className="text-2xl font-black text-violet-300">
                {analytics?.orderNowClicks || 12}
              </p>
            </div>
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">Total Inquiries</span>
              <p className="text-2xl font-black text-indigo-300">
                {analytics?.customerInquiries || 8}
              </p>
            </div>
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">Product Views</span>
              <p className="text-2xl font-black text-emerald-300">
                {(analytics?.productViews || 840).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Explicit Clarification Notice on Order Now */}
          <div className="p-4 bg-violet-950/30 border border-violet-700/40 rounded-2xl flex items-start gap-3">
            <Info className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-bold text-white">Marketly Cash on Delivery (COD) Mechanism</p>
              <p className="leading-relaxed">
                {t('order_now_clarification')} An "Order Now" click is an expression of high buyer purchase intent. It immediately opens your Seller Chat with the product attached so you can confirm the customer's delivery address, phone number, and COD dispatch.
              </p>
            </div>
          </div>

          {/* Quick Actions & Recent Inventory */}
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white">Your Products</h3>
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('add_product')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3.5 shadow"
              >
                <img
                  src={p.mediaUrls[0]}
                  alt={p.name}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-white truncate">{p.name}</p>
                  <p className="text-[11px] text-slate-400">{p.category}</p>
                  <p className="text-xs font-black text-violet-300 mt-1">
                    Rs. {p.finalPrice.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. TAB: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-white">Catalog & Inventory</h3>
              <p className="text-xs text-slate-400">All products available for buyer discovery</p>
            </div>
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('add_product')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-lg p-4 space-y-3"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-800">
                  <img src={p.mediaUrls[0]} alt={p.name} className="w-full h-full object-cover" />
                  {p.discount > 0 && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-bold">
                      -{p.discount}%
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">
                      {p.category}
                    </span>
                    <span className="text-[11px] text-slate-400">Qty: {p.availableQuantity}</span>
                  </div>
                  <p className="font-bold text-sm text-white truncate mt-0.5">{p.name}</p>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{p.description}</p>
                </div>

                <div className="flex items-baseline justify-between pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-base font-black text-violet-300">
                      Rs. {p.finalPrice.toLocaleString()}
                    </span>
                    {p.discount > 0 && (
                      <span className="text-xs text-slate-400 line-through ml-2">
                        Rs. {p.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-emerald-400 font-bold">
                    {p.freeDelivery ? 'Free Delivery' : `+Rs. ${p.deliveryCharges}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. TAB: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Time Range selector */}
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet-400" />
              <span>Seller Performance Analytics</span>
            </h3>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
              {['today', '7days', '30days', 'all'].map((range) => (
                <button
                  key={range}
                  onClick={() => setAnalyticsRange(range)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    analyticsRange === range
                      ? 'bg-violet-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {range === 'today' ? 'Today' : range === '7days' ? '7 Days' : range === '30days' ? '30 Days' : 'All Time'}
                </button>
              ))}
            </div>
          </div>

          {/* CRITICAL CLARIFICATION BANNER */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300">
              <p className="font-bold text-amber-300">Analytics Notice</p>
              <p className="leading-relaxed mt-0.5">
                {t('order_now_clarification')} Order Now clicks reflect customer interest and lead generation. Cash on Delivery deals are verified and closed directly in your Seller Chat!
              </p>
            </div>
          </div>

          {/* Comprehensive Analytics Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Eye className="w-4 h-4" />
                <span>{t('total_views')}</span>
              </div>
              <p className="text-2xl font-black text-white">{analytics?.totalViews.toLocaleString()}</p>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Package className="w-4 h-4" />
                <span>{t('product_views')}</span>
              </div>
              <p className="text-2xl font-black text-violet-300">{analytics?.productViews.toLocaleString()}</p>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>{t('order_now_clicks')}</span>
              </div>
              <p className="text-2xl font-black text-emerald-400">{analytics?.orderNowClicks.toLocaleString()}</p>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <MessageCircle className="w-4 h-4 text-indigo-400" />
                <span>{t('customer_inquiries')}</span>
              </div>
              <p className="text-2xl font-black text-indigo-300">{analytics?.customerInquiries.toLocaleString()}</p>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>{t('likes')}</span>
              </div>
              <p className="text-2xl font-black text-white">{analytics?.likes.toLocaleString()}</p>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span>{t('saves')}</span>
              </div>
              <p className="text-2xl font-black text-white">{analytics?.saves.toLocaleString()}</p>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Share2 className="w-4 h-4 text-sky-400" />
                <span>{t('shares')}</span>
              </div>
              <p className="text-2xl font-black text-white">{analytics?.shares.toLocaleString()}</p>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Users className="w-4 h-4 text-violet-400" />
                <span>{t('followers')}</span>
              </div>
              <p className="text-2xl font-black text-white">{analytics?.followers.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB: SUBSCRIPTION & BILLING */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          {/* Trial / Active Status Card */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-violet-400">
                  Current Status
                </span>
                <h3 className="text-lg font-black text-white">
                  {subscription?.planName || '7-Day Free Trial'}
                </h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isExpired
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {isExpired ? 'Expired' : 'Active'}
              </span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-violet-400" />
                <span>Expires on: {new Date(subscription?.expiresAt || Date.now()).toLocaleDateString()}</span>
              </div>
              <span className="font-bold text-violet-300">{daysRemaining} Days Remaining</span>
            </div>
          </div>

          {/* Pricing Plans */}
          <div>
            <div className="text-center space-y-1 mb-6">
              <h3 className="text-xl font-extrabold text-white">{t('subscription_plans')}</h3>
              <p className="text-xs text-slate-400">
                Choose a plan to continue selling and receiving COD inquiries across Pakistan
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between transition-all hover:border-violet-500/60 ${
                    plan.discountPercent > 10
                      ? 'border-violet-500/60 ring-2 ring-violet-500/20 shadow-xl'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-white">{plan.name}</h4>
                      {plan.discountPercent > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                          {plan.discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-2xl font-black text-white">
                        Rs. {plan.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        {plan.durationMonths} month{plan.durationMonths > 1 ? 's' : ''} access
                      </span>
                    </div>

                    <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Unlimited product listings</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ORDER NOW customer chat</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Full seller analytics & badge</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => setSelectedPlan(plan)}
                    className="w-full mt-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Subscribe</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {isAddProductOpen && (
        <AddProductModal
          currentUser={currentUser}
          onClose={() => setIsAddProductOpen(false)}
          onProductAdded={(p) => setProducts((prev) => [p, ...prev])}
        />
      )}

      {/* CHECKOUT / PAYMENT MODAL */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedPlan(null)}
              className="absolute top-4 right-4 rtl:left-4 rtl:right-auto text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>

            <div className="mb-4">
              <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">
                Subscription Checkout
              </span>
              <h3 className="text-lg font-black text-white">{selectedPlan.name}</h3>
              <p className="text-xs text-slate-400">Total amount: Rs. {selectedPlan.price.toLocaleString()}</p>
            </div>

            {paymentSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <p className="text-sm font-bold text-white">Payment Verified & Activated!</p>
                <p className="text-xs text-slate-400">Your seller subscription has been updated.</p>
              </div>
            ) : (
              <form onSubmit={handlePaySubscription} className="space-y-4 text-xs">
                {/* Method selector */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-2">
                    Pakistan Payment Method *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('easypaisa')}
                      className={`p-3 rounded-2xl border text-left rtl:text-right transition-all ${
                        paymentMethod === 'easypaisa'
                          ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold ring-1 ring-emerald-500'
                          : 'border-slate-800 bg-slate-850 text-slate-400'
                      }`}
                    >
                      <p className="text-emerald-400 font-extrabold text-sm">Easypaisa</p>
                      <p className="text-[10px] text-slate-400">Direct mobile wallet</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('jazzcash')}
                      className={`p-3 rounded-2xl border text-left rtl:text-right transition-all ${
                        paymentMethod === 'jazzcash'
                          ? 'border-rose-500 bg-rose-500/10 text-white font-bold ring-1 ring-rose-500'
                          : 'border-slate-800 bg-slate-850 text-slate-400'
                      }`}
                    >
                      <p className="text-rose-400 font-extrabold text-sm">JazzCash</p>
                      <p className="text-[10px] text-slate-400">Direct mobile wallet</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`p-3 rounded-2xl border text-left rtl:text-right transition-all ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-violet-500 bg-violet-500/10 text-white font-bold ring-1 ring-violet-500'
                          : 'border-slate-800 bg-slate-850 text-slate-400'
                      }`}
                    >
                      <p className="text-violet-400 font-extrabold text-sm">Bank Transfer</p>
                      <p className="text-[10px] text-slate-400">1Link IBFT</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-2xl border text-left rtl:text-right transition-all ${
                        paymentMethod === 'card'
                          ? 'border-indigo-500 bg-indigo-500/10 text-white font-bold ring-1 ring-indigo-500'
                          : 'border-slate-800 bg-slate-850 text-slate-400'
                      }`}
                    >
                      <p className="text-indigo-400 font-extrabold text-sm">Debit / Credit</p>
                      <p className="text-[10px] text-slate-400">PayPak / Visa / MC</p>
                    </button>
                  </div>
                </div>

                {/* Account / Mobile input */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    {paymentMethod === 'bank_transfer'
                      ? 'IBAN / Account Number'
                      : paymentMethod === 'card'
                      ? 'Card Number'
                      : 'Registered Phone Number'}{' '}
                    *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Transaction ID / Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. TID-982144"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={paying}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all"
                  >
                    {paying ? 'Verifying...' : `Pay Rs. ${selectedPlan.price.toLocaleString()}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
