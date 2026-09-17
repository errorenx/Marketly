import React from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { Product, User } from '../../types';
import { Activity, Flame, ShieldCheck, Truck, ChevronRight } from 'lucide-react';

interface MarketlyPulseProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onSelectSeller: (sellerId: string) => void;
}

export const MarketlyPulse: React.FC<MarketlyPulseProps> = ({
  products,
  onSelectProduct,
  onSelectSeller,
}) => {
  const { t } = useI18n();

  const trendingProducts = products.slice(0, 4);

  return (
    <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-slate-800/80 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>{t('pulse_title')}</span>
              <span className="flex items-center text-[10px] text-amber-400 font-extrabold px-1.5 py-0.2 bg-amber-500/15 rounded-md border border-amber-500/30">
                <Flame className="w-2.5 h-2.5 mr-0.5" /> Hot in Pakistan
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">{t('pulse_sub')}</p>
          </div>
        </div>
      </div>

      {/* Horizontal Trending Strip */}
      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar pt-1">
        {trendingProducts.map(p => (
          <div
            key={p.id}
            onClick={() => onSelectProduct(p)}
            className="w-44 shrink-0 p-2.5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-violet-500/40 rounded-2xl cursor-pointer transition-all group"
          >
            <div className="relative w-full h-24 rounded-xl overflow-hidden mb-2 bg-slate-800">
              <img
                src={p.mediaUrls[0]}
                alt={p.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {p.discount > 0 && (
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-bold shadow">
                  -{p.discount}%
                </span>
              )}
              {p.freeDelivery && (
                <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-emerald-600/90 text-white text-[9px] font-semibold flex items-center gap-0.5 shadow">
                  <Truck className="w-2.5 h-2.5" /> Free
                </span>
              )}
            </div>

            <p className="font-bold text-xs text-white truncate">{p.name}</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xs font-black text-violet-300">
                Rs. {p.finalPrice.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">{p.sellerCity}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
