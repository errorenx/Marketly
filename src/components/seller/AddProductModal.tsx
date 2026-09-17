import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { User, Product } from '../../types';
import { api } from '../../services/api';
import { ShoppingBag, X, Check, Upload, Tag, Truck, ShieldCheck, AlertCircle } from 'lucide-react';

interface AddProductModalProps {
  currentUser: User;
  onClose: () => void;
  onProductAdded: (prod: Product) => void;
}

const CATEGORIES = [
  'Electronics & Gadgets',
  'Mobile Phones & Tablets',
  'Computers & Laptops',
  'Fashion & Apparel',
  'Footwear & Shoes',
  'Home & Living',
  'Beauty & Personal Care',
  'Sports & Fitness',
  'Automotive & Bike Accessories',
];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  currentUser,
  onClose,
  onProductAdded,
}) => {
  const { t } = useI18n();

  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [condition, setCondition] = useState<'new' | 'used'>('new');
  const [description, setDescription] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(5);

  // Pricing
  const [originalPrice, setOriginalPrice] = useState<number>(1000);
  const [discount, setDiscount] = useState<number>(0);
  const [finalPrice, setFinalPrice] = useState<number>(1000);

  // Delivery & Policy
  const [warrantyDuration, setWarrantyDuration] = useState('7 Days Return & Replacement');
  const [deliveryCharges, setDeliveryCharges] = useState(200);
  const [freeDelivery, setFreeDelivery] = useState(false);
  const [returnPolicy, setReturnPolicy] = useState('7 Days easy return on damaged or incorrect items');
  const [refundPolicy, setRefundPolicy] = useState('Direct replacement or refund via bank/easypaisa upon parcel inspection');

  // Media
  const [mediaUrl, setMediaUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-calculate final price
  useEffect(() => {
    const orig = Number(originalPrice) || 0;
    const disc = Number(discount) || 0;
    const calculated = Math.round(orig - (orig * disc) / 100);
    setFinalPrice(Math.max(0, calculated));
  }, [originalPrice, discount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.createProduct({
        sellerId: currentUser.id,
        sellerName: `${currentUser.firstName} ${currentUser.lastName}`,
        sellerUsername: currentUser.username,
        sellerCity: currentUser.city,
        sellerAvatar: currentUser.avatar,
        name: name.trim(),
        category,
        brand,
        model,
        condition,
        description,
        specifications: specifications.split('\n').filter(Boolean),
        size,
        color,
        availableQuantity: Number(quantity),
        originalPrice: Number(originalPrice),
        discount: Number(discount),
        finalPrice: Number(finalPrice),
        warrantyDuration,
        deliveryCharges: freeDelivery ? 0 : Number(deliveryCharges),
        freeDelivery,
        returnPolicy,
        refundPolicy,
        mediaUrls: [
          mediaUrl ||
            'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80',
        ],
      });

      onProductAdded(res.product);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">{t('add_product')}</h3>
              <p className="text-xs text-slate-400">List an item for discovery & COD orders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Fields Scroll Area */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
          {/* Product Name */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">{t('product_name')} *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ultra Fast Smart Watch T800 Pro"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">{t('category')} *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">{t('condition')} *</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500"
              >
                <option value="new">Brand New (Boxed)</option>
                <option value="used">Used / Open Box</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">{t('brand')}</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Apple / Samsung / Local"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">{t('model')}</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Series 9"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">{t('quantity')} *</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Pricing with Automatic Final Calculation */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
            <h4 className="font-bold text-violet-300 text-xs flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Pricing & Auto-Calculated Final Price</span>
            </h4>
            <div className="grid grid-cols-3 gap-3 items-end">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {t('original_price')} (PKR) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {t('discount')} (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="p-2 bg-violet-950/50 border border-violet-700/50 rounded-xl text-center">
                <span className="block text-[10px] text-violet-300 font-bold uppercase">
                  {t('final_price')}
                </span>
                <span className="text-sm font-black text-white">
                  Rs. {finalPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Description & Specs */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">{t('description')}</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of features, materials, and condition..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Specifications (One per line)
            </label>
            <textarea
              rows={2}
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
              placeholder="AMOLED Display&#10;Water resistant IP68&#10;Up to 48 hours battery"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          {/* Delivery & Warranty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">{t('warranty')}</label>
              <input
                type="text"
                value={warrantyDuration}
                onChange={(e) => setWarrantyDuration(e.target.value)}
                placeholder="e.g. 7 Days Replacement / 1 Year Official"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                {t('delivery_charges')} (PKR)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  disabled={freeDelivery}
                  value={freeDelivery ? 0 : deliveryCharges}
                  onChange={(e) => setDeliveryCharges(Number(e.target.value))}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500 disabled:opacity-40"
                />
                <label className="flex items-center gap-1.5 text-slate-300 whitespace-nowrap cursor-pointer">
                  <input
                    type="checkbox"
                    checked={freeDelivery}
                    onChange={(e) => setFreeDelivery(e.target.checked)}
                    className="rounded border-slate-700 text-violet-600 focus:ring-violet-500"
                  />
                  <span>Free</span>
                </label>
              </div>
            </div>
          </div>

          {/* Media URL */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Product Photo URL</label>
            <input
              type="text"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Return & Refund */}
          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-2">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Return Policy</label>
              <input
                type="text"
                value={returnPolicy}
                onChange={(e) => setReturnPolicy(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Refund Policy</label>
              <input
                type="text"
                value={refundPolicy}
                onChange={(e) => setRefundPolicy(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md"
            >
              {loading ? t('loading') : t('save_changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
