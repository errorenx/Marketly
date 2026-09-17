import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { Product, User, UserRole } from '../../types';
import { api } from '../../services/api';
import {
  Search,
  Filter,
  ShoppingBag,
  MapPin,
  Truck,
  ShieldCheck,
  X,
  Sparkles,
  User as UserIcon,
  Tag
} from 'lucide-react';

interface SearchViewProps {
  currentUser: User;
  onClose: () => void;
  onOrderNow: (productId: string) => void;
  onViewProfile: (userId: string) => void;
}

const CITIES = ['All Cities', 'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad'];
const CATEGORIES = [
  'All Categories',
  'Electronics & Gadgets',
  'Mobile Phones & Tablets',
  'Computers & Laptops',
  'Fashion & Apparel',
  'Footwear & Shoes',
  'Home & Living',
];

export const SearchView: React.FC<SearchViewProps> = ({
  currentUser,
  onClose,
  onOrderNow,
  onViewProfile,
}) => {
  const { t } = useI18n();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'people'>('products');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedCondition, setSelectedCondition] = useState<'all' | 'new' | 'used'>('all');
  const [freeDeliveryOnly, setFreeDeliveryOnly] = useState(false);
  const [discountOnly, setDiscountOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc'>('relevance');

  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const executeSearch = async () => {
    setLoading(true);
    try {
      const [prodRes, userRes] = await Promise.all([
        api.getProducts({
          search: query || undefined,
          city: selectedCity === 'All Cities' ? undefined : selectedCity,
          category: selectedCategory === 'All Categories' ? undefined : selectedCategory,
          condition: selectedCondition === 'all' ? undefined : selectedCondition,
          freeDelivery: freeDeliveryOnly ? 'true' : undefined,
          discountOnly: discountOnly ? 'true' : undefined,
          sortBy,
        }),
        api.getUsers(),
      ]);

      setProducts(prodRes.products || []);

      // ROLE FILTER FOR PEOPLE:
      // If currentUser is SOCIAL: can NEVER see Buyer content!
      const filteredUsers = (userRes.users || []).filter((u) => {
        if (currentUser.role === 'SOCIAL' && u.role === 'BUYER') {
          return false;
        }
        if (query) {
          const q = query.toLowerCase();
          const matchName = `${u.firstName} ${u.lastName}`.toLowerCase().includes(q);
          const matchUser = u.username.toLowerCase().includes(q);
          const matchCity = u.city?.toLowerCase().includes(q);
          return matchName || matchUser || matchCity;
        }
        return true;
      });

      setUsers(filteredUsers);
    } catch (err) {
      console.error('Error during search:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [query, selectedCity, selectedCategory, selectedCondition, freeDeliveryOnly, discountOnly, sortBy]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col space-y-4">
        {/* Search Bar Header */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-2 sm:p-3 shadow-xl">
          <Search className="w-5 h-5 text-violet-400 shrink-0 ml-2" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            className="flex-1 bg-transparent text-sm sm:text-base text-white focus:outline-none placeholder-slate-500"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-white">
              ✕
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>

        {/* Tab switch (Products vs People) */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'products'
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              Products ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('people')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'people'
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              People ({users.length})
            </button>
          </div>

          {/* Sort selector for products */}
          {activeTab === 'products' && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
            >
              <option value="relevance">Most Relevant</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          )}
        </div>

        {/* Filters Bar for Products */}
        {activeTab === 'products' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            {/* City */}
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300 shrink-0"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300 shrink-0"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Condition */}
            <button
              onClick={() =>
                setSelectedCondition(
                  selectedCondition === 'all' ? 'new' : selectedCondition === 'new' ? 'used' : 'all'
                )
              }
              className={`px-3 py-1.5 rounded-xl border shrink-0 transition-colors ${
                selectedCondition !== 'all'
                  ? 'bg-violet-600/20 text-violet-300 border-violet-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              {selectedCondition === 'all'
                ? 'Condition: All'
                : selectedCondition === 'new'
                ? 'Brand New'
                : 'Used'}
            </button>

            {/* Free Delivery */}
            <button
              onClick={() => setFreeDeliveryOnly((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl border shrink-0 transition-colors flex items-center gap-1 ${
                freeDeliveryOnly
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Free Delivery</span>
            </button>

            {/* Discount Only */}
            <button
              onClick={() => setDiscountOnly((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl border shrink-0 transition-colors flex items-center gap-1 ${
                discountOnly
                  ? 'bg-rose-600/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>On Sale</span>
            </button>
          </div>
        )}

        {/* RESULTS AREA */}
        <div className="flex-1 overflow-y-auto pt-2">
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400">Searching Marketly...</div>
          ) : activeTab === 'products' ? (
            products.length === 0 ? (
              <div className="py-20 text-center text-xs text-slate-400 space-y-2">
                <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-bold text-slate-300">No products match your criteria</p>
                <p>Try broadening your query or removing filter constraints.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-lg p-4 space-y-3 hover:border-violet-500/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-800 mb-2.5">
                        <img src={p.mediaUrls[0]} alt={p.name} className="w-full h-full object-cover" />
                        {p.discount > 0 && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-bold">
                            -{p.discount}%
                          </span>
                        )}
                        {p.freeDelivery && (
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-emerald-600/90 text-white text-[10px] font-bold flex items-center gap-1">
                            <Truck className="w-3 h-3" /> Free Delivery
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-violet-400 uppercase">{p.category}</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" /> {p.sellerCity}
                        </span>
                      </div>

                      <p className="font-bold text-sm text-white truncate mt-1">{p.name}</p>
                      <p className="text-xs text-slate-400 line-clamp-1">{p.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-base font-black text-violet-300">
                          Rs. {p.finalPrice.toLocaleString()}
                        </span>
                        {p.discount > 0 && (
                          <span className="text-xs text-slate-400 line-through ml-1.5">
                            Rs. {p.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          onClose();
                          onOrderNow(p.id);
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1 active:scale-95"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{t('order_now')}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* PEOPLE RESULTS */
            users.length === 0 ? (
              <div className="py-20 text-center text-xs text-slate-400 space-y-2">
                <UserIcon className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-bold text-slate-300">No users found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      onClose();
                      onViewProfile(u.id);
                    }}
                    className="p-3.5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-violet-500/50 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={u.avatar}
                        alt={u.username}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs text-white truncate">
                            {u.firstName} {u.lastName}
                          </p>
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${
                            u.role === 'SELLER'
                              ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                              : u.role === 'BUYER'
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                              : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                          }`}>
                            {u.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate">@{u.username}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-violet-400" />
                          <span>{u.city}, Pakistan</span>
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-violet-400">View →</span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
