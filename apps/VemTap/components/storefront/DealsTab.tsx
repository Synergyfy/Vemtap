'use client';

import { Tag, Gift, Clock } from 'lucide-react';

interface DealsTabProps {
  offers: any[];
  isLoading: boolean;
  onClaim: (offer: any) => void;
}

function offerImage(offer: any): string {
  return offer?.mainImage || offer?.galleryImages?.[0] || offer?.image || '';
}

function discountPercent(offer: any): number | null {
  const current = Number(offer?.calculatedPrice);
  const original = Number(offer?.fixedPrice);
  if (Number.isFinite(current) && Number.isFinite(original) && original > current && current >= 0) {
    return Math.round((1 - current / original) * 100);
  }
  return null;
}

function formatCountdown(endDate?: string): string | null {
  if (!endDate) return null;
  const end = new Date(endDate).getTime();
  if (Number.isNaN(end)) return null;
  const diff = end - Date.now();
  if (diff <= 0) return 'Ended';
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Ending soon';
  if (hours < 24) return `Ends in ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ends tomorrow';
  if (days < 7) return `Ends in ${days}d`;
  return 'Today';
}

export default function DealsTab({ offers, isLoading, onClaim }: DealsTabProps) {
  return (
    <section id="offers-section" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 scroll-mt-32">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-slate-900">Active Offers &amp; Promotions</h3>
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
          {offers?.length || 0} Total
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
        </div>
      ) : offers && offers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {offers.map((offer: any) => {
            const image = offerImage(offer);
            const percent = discountPercent(offer);
            const countdown = formatCountdown(offer?.endDate);
            return (
              <div
                key={offer.id}
                className="group border border-slate-100 hover:border-blue-100 bg-white rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-md"
              >
                <div className="relative h-36 bg-gradient-to-br from-blue-100 to-blue-50 overflow-hidden shrink-0">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt={offer.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Tag size={32} className="text-[#066CF4]/30" />
                    </div>
                  )}
                  {percent !== null ? (
                    <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-lg bg-red-600 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-md">
                      <Tag size={10} />
                      {percent}% OFF
                    </span>
                  ) : (
                    <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                      Promo Deal
                    </span>
                  )}
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                      {offer.name}
                    </h4>
                    {offer.calculatedPrice !== undefined && (
                      <div className="text-right shrink-0">
                        <span className="text-xs text-slate-400 line-through block">
                          ₦{offer.fixedPrice || offer.calculatedPrice * 1.2}
                        </span>
                        <div className="text-base font-black text-[#066CF4]">
                          ₦{offer.calculatedPrice}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {offer.description || 'Limited time promotional code claimable at store branch.'}
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider inline-flex items-center gap-1">
                      <Clock size={10} />
                      {countdown || 'Code OTP Claims'}
                    </span>
                    <button
                      onClick={() => onClaim(offer)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all active:scale-95 shadow-sm shadow-blue-600/10 cursor-pointer"
                    >
                      Claim Offer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
          <Gift className="w-8 h-8 text-slate-300 mx-auto mb-2.5" />
          <p className="text-sm font-bold text-slate-600">No active promotions</p>
          <p className="text-xs text-slate-400 mt-1">Check back later for exclusive deals.</p>
        </div>
      )}
    </section>
  );
}
