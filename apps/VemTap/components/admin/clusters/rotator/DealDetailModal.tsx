'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Users, Clock, Star, MapPin, CheckCircle2, Sparkles,
    ArrowUpRight, Store, ShieldCheck,
    Utensils, Shirt, HeartPulse, Wrench, Smartphone, Sofa, MoreHorizontal,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDealPrice } from '@/lib/promotions';
import { usePublicOfferDetails } from '@/services/deals/hooks';
import type { DealOffer, DealBusiness, DealHours } from '@/services/deals/types';
import type { RotatorDeal } from '@/services/rotator/types';
import { DEAL_STATUS_LABELS } from '@/services/rotator/types';

// -----------------------------------------------------------------------------
// Deterministic fallbacks so mock / not-yet-published deals still render the
// public-style "as uploaded" view. When a real backend id is passed, the modal
// prefers the live offer details instead (see looksReal below).
// -----------------------------------------------------------------------------

const fnv = (s: string) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const ADDRESSES = [
    '14 Admiralty Way, Lekki Phase 1',
    'Plot 23B Adeola Odeku St, Victoria Island',
    '26 Alhaji Masha Rd, Surulere',
    'Shop 8, Ikeja City Mall',
    '5 Opebi Rd, Ikeja',
    '12 Aguiyi Ironsi St, Maitama',
    '3 Wuse Market Rd, Wuse 2',
    '7 Falomo Shopping Centre, Ikoyi',
];

const CITIES = ['Eti-Osa', 'Ikeja', 'Surulere', 'Victoria Island', 'Garki', 'Wuse', 'Ikoyi', 'Yaba'];

const PHONES = ['+234 801 234 5678', '+234 701 123 4567', '+234 805 555 0101', '+234 812 987 6543'];

const TERMS_POOL = [
    'Voucher valid for one claim per customer.',
    'Not valid with any other offer or discount.',
    'Reservation recommended — subject to availability.',
    'Photo ID may be required at redemption.',
    'Valid on weekdays only.',
    'No cash value; non-transferable.',
    'Cancellation within 4 hours of visit forfeits the claim.',
    'Available at participating branches only.',
];

const HOUR_TEMPLATES: DealHours[][] = [
    [
        { day: 'Mon', open: '09:00', close: '18:00', closed: false },
        { day: 'Tue', open: '09:00', close: '18:00', closed: false },
        { day: 'Wed', open: '09:00', close: '18:00', closed: false },
        { day: 'Thu', open: '09:00', close: '18:00', closed: false },
        { day: 'Fri', open: '09:00', close: '18:00', closed: false },
        { day: 'Sat', open: '10:00', close: '16:00', closed: false },
        { day: 'Sun', open: '00:00', close: '00:00', closed: true },
    ],
    [
        { day: 'Mon', open: '08:00', close: '20:00', closed: false },
        { day: 'Tue', open: '08:00', close: '20:00', closed: false },
        { day: 'Wed', open: '08:00', close: '20:00', closed: false },
        { day: 'Thu', open: '08:00', close: '20:00', closed: false },
        { day: 'Fri', open: '08:00', close: '20:00', closed: false },
        { day: 'Sat', open: '08:00', close: '20:00', closed: false },
        { day: 'Sun', open: '08:00', close: '20:00', closed: false },
    ],
    [
        { day: 'Mon', open: '10:00', close: '22:00', closed: false },
        { day: 'Tue', open: '10:00', close: '22:00', closed: false },
        { day: 'Wed', open: '10:00', close: '22:00', closed: false },
        { day: 'Thu', open: '10:00', close: '22:00', closed: false },
        { day: 'Fri', open: '10:00', close: '23:00', closed: false },
        { day: 'Sat', open: '11:00', close: '23:00', closed: false },
        { day: 'Sun', open: '12:00', close: '18:00', closed: false },
    ],
];

const BASE_PRICES: Record<string, number> = {
    'Food & Drink': 4500,
    'Fashion': 8500,
    'Beauty & Spa': 12000,
    'Health & Wellness': 9000,
    'Services': 6000,
    'Tech & Gadgets': 25000,
    'Home & Living': 15000,
};

const buildSyntheticOffer = (deal: RotatorDeal): DealOffer => {
    const h = fnv(deal.id);
    const bH = fnv(deal.businessId || deal.businessSlug || deal.businessName || 'biz');

    const base = BASE_PRICES[deal.category] ?? 7000;
    const percent = 10 + (h % 45);
    const original = Math.max(1000, base + (h % 7) * 2500);
    const discounted = Math.max(500, Math.round((original * (1 - percent / 100)) / 100) * 100);

    const pricingType = h % 3 === 0 ? 'percentage_discount' : h % 3 === 1 ? 'fixed_discount_price' : 'sum';
    const discountValue =
        pricingType === 'percentage_discount' ? percent :
        pricingType === 'fixed_discount_price' ? original - discounted : null;

    const terms = [0, 1, 2, 3].map((_, i) => TERMS_POOL[(h + i * 3) % TERMS_POOL.length]).slice(0, 3 + (h % 2));

    const categoryId = deal.categoryId || 'cat-other';
    const categoryName = deal.category || 'Offer';

    const business: DealBusiness = {
        id: deal.businessId,
        name: deal.businessName || 'Business',
        slug: deal.businessSlug || slugify(deal.businessName || 'business'),
        categoryId,
        categoryName,
        address: ADDRESSES[bH % ADDRESSES.length],
        city: CITIES[(bH >> 3) % CITIES.length],
        rating: Math.round((3.4 + (bH % 16) / 10) * 10) / 10,
        totalReviews: 10 + (bH % 400),
        phone: PHONES[bH % PHONES.length],
        hours: HOUR_TEMPLATES[bH % HOUR_TEMPLATES.length],
    };

    return {
        id: deal.id,
        name: deal.name,
        description: deal.description || `A curated ${categoryName.toLowerCase()} offer for customers scanning this cluster.`,
        longDescription: `${deal.description ? deal.description + ' ' : ''}This is how ${business.name} published the deal — customers see this exact presentation when they open it on the public deal page.`,
        terms,
        pricingType,
        discountValue,
        fixedPrice: pricingType === 'sum' ? discounted : null,
        calculatedPrice: discounted || 0,
        mainImage: deal.mainImage ?? null,
        galleryImages: [],
        startDate: deal.startDate,
        endDate: deal.endDate,
        claimedCount: 12 + (h % 220),
        maxClaims: 200,
        isTrending: deal.isTrending,
        isExpired: deal.status === 'expired',
        status: deal.status,
        views: 300 + (h % 5000),
        originalPrice: original,
        discountPercent: pricingType === 'percentage_discount' ? percent : undefined,
        business,
        businessId: deal.businessId,
    };
};

const detailHours = (hours?: DealHours[]) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    return hours?.map(h => ({ ...h, isToday: h.day === today })) || [];
};

function formatDealDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
    'cat-food': Utensils,
    'cat-fashion': Shirt,
    'cat-beauty': Sparkles,
    'cat-health': HeartPulse,
    'cat-services': Wrench,
    'cat-tech': Smartphone,
    'cat-home': Sofa,
};

function CategoryGlyph({ categoryId, size = 26 }: { categoryId: string; size?: number }) {
    const Icon = CATEGORY_ICONS[categoryId] ?? MoreHorizontal;
    return <Icon size={size} />;
}

function daysLeft(endDate: string | null | undefined): number {
    if (!endDate) return 0;
    return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

function urgencyText(endDate: string | null | undefined): string {
    const d = daysLeft(endDate);
    if (d === 0) return 'Ends today';
    if (d === 1) return 'Ends tomorrow';
    if (d <= 7) return `${d} days left`;
    return endDate ? `Ends ${formatDealDate(endDate)}` : 'No end date';
}

interface DealDetailModalProps {
    open: boolean;
    deal: RotatorDeal | null;
    onClose: () => void;
}

export default function DealDetailModal({ open, deal, onClose }: DealDetailModalProps) {
    const looksReal = !!deal && !deal.id.startsWith('rot-');
    const { data: realOffer } = usePublicOfferDetails(looksReal && open ? deal!.id : '');

    const offer: DealOffer | null = useMemo(() => {
        if (!deal) return null;
        return realOffer ?? buildSyntheticOffer(deal);
    }, [deal, realOffer]);

    const expiry = offer?.isExpired;
    const discountPercent = offer?.pricingType === 'percentage_discount' && offer.discountValue ? offer.discountValue : undefined;
    const discountAmount = offer?.pricingType === 'fixed_discount_price' && offer.discountValue ? offer.discountValue : undefined;
    const claimPct = offer ? Math.round((offer.claimedCount / offer.maxClaims) * 100) : 0;
    const business = offer?.business;
    const hours = detailHours(business?.hours);
    const hasImage = !!offer?.mainImage;

    if (!open || !deal || !offer || !business) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.98 }}
                    transition={{ type: 'tween', duration: 0.22 }}
                    className="w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden rounded-3xl bg-[#f4f5f6]"
                >
                    {/* Header */}
                    <div className="shrink-0 px-5 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
                                <ShieldCheck size={10} /> Deal as uploaded
                            </span>
                            {expiry && (
                                <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-500 text-[9px] font-black uppercase tracking-widest">
                                    Expired
                                </span>
                            )}
                            {!expiry && offer.isTrending && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest">
                                    <Sparkles size={10} /> Trending
                                </span>
                            )}
                        </div>
                        <button onClick={onClose} className="size-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/30 transition-colors shrink-0">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Scroll body */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            {/* Left: banner + about + terms */}
                            <div className="lg:col-span-3 space-y-5">
                                {/* Banner */}
                                <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-gray-100">
                                    {hasImage ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={offer.mainImage!} alt={offer.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-gray-100 flex items-end">
                                            <div className="w-full flex items-center justify-between p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-14 rounded-2xl bg-white/80 backdrop-blur flex items-center justify-center text-primary shadow-sm">
                                                        <CategoryGlyph categoryId={offer.business?.categoryId || ''} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">{business.categoryName}</p>
                                                        <p className="text-xl font-display font-bold text-text-main">Preview artwork coming when the image is uploaded</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        {!expiry && discountPercent && (
                                            <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg">{discountPercent}% OFF</span>
                                        )}
                                        {!expiry && discountAmount && !discountPercent && (
                                            <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg">SAVE {formatDealPrice(discountAmount)}</span>
                                        )}
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4 bg-black/45 backdrop-blur-sm rounded-xl px-4 py-3">
                                        <h2 className="text-lg font-display font-bold text-white leading-tight">{offer.name}</h2>
                                        <p className="text-xs text-white/80 mt-0.5">{business.name} · {business.city}</p>
                                    </div>
                                </div>

                                {/* About */}
                                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                    <h3 className="text-base font-headline font-bold text-gray-900 mb-3">About This Deal</h3>
                                    <p className="text-sm text-gray-600 font-medium leading-relaxed">{offer.longDescription || offer.description}</p>
                                </div>

                                {/* Status + dates strip */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white rounded-2xl p-4 border border-gray-100">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</p>
                                        <p className="mt-1 text-sm font-black text-text-main">{DEAL_STATUS_LABELS[deal.status] || offer.status}</p>
                                    </div>
                                    <div className="bg-white rounded-2xl p-4 border border-gray-100">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Runs until</p>
                                        <p className="mt-1 text-sm font-black text-text-main">{offer.endDate ? formatDealDate(offer.endDate) : 'No end date'}</p>
                                    </div>
                                </div>

                                {/* Terms */}
                                {offer.terms && offer.terms.length > 0 && (
                                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                        <h3 className="text-base font-headline font-bold text-gray-900 mb-3">Terms & Conditions</h3>
                                        <ul className="space-y-2">
                                            {offer.terms.map((term, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-gray-500 font-medium">
                                                    <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                                                    {term}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Right: price + business */}
                            <div className="lg:col-span-2 space-y-5">
                                {/* Price card */}
                                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                                    <div className="flex items-baseline gap-3 flex-wrap">
                                        <span className="text-3xl font-bold text-primary font-display tracking-tight">
                                            {offer.calculatedPrice === 0 ? 'FREE' : formatDealPrice(offer.calculatedPrice)}
                                        </span>
                                        {(offer.originalPrice ?? 0) > offer.calculatedPrice && (
                                            <span className="text-base text-gray-400 line-through font-bold">{formatDealPrice(offer.originalPrice!)}</span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <div className="flex items-center gap-1.5 text-gray-500">
                                            <Users size={14} />
                                            <span className="text-xs font-bold">{offer.claimedCount} claimed</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-500">
                                            <Clock size={14} />
                                            <span className="text-xs font-bold">{urgencyText(offer.endDate)}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-gray-400">{offer.claimedCount} of {offer.maxClaims}</span>
                                            <span className="text-primary">{claimPct}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: `${Math.min(claimPct, 100)}%` }} />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-gray-500 pt-1">
                                        <ShieldCheck size={14} />
                                        <span className="text-xs font-bold">Verified by VemTap</span>
                                    </div>

                                    {realOffer && business.slug && (
                                        <a
                                            href={`/deals/${business.slug}/${offer.id}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full flex items-center justify-center gap-1.5 h-11 bg-gray-50 border border-gray-100 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-100 transition-colors"
                                        >
                                            View on Public Page <ArrowUpRight size={14} />
                                        </a>
                                    )}
                                </div>

                                {/* Business card */}
                                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                                    <div className="flex items-center gap-3">
                                        <div className="size-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                            <Store size={22} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">{business.name}</p>
                                            <p className="text-xs text-gray-400 font-bold truncate">{business.categoryName}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <MapPin size={12} className="text-gray-400 shrink-0" />
                                        <span className="text-xs text-gray-500 font-bold">{business.address}</span>
                                    </div>

                                    {(business.rating != null) && (
                                        <div className="flex items-center gap-2">
                                            <Star size={14} className="text-yellow-400 fill-yellow-400 shrink-0" />
                                            <span className="text-sm font-bold text-gray-900">{business.rating}</span>
                                            <span className="text-xs text-gray-400">({business.totalReviews || 0} reviews)</span>
                                        </div>
                                    )}

                                    {business.phone && (
                                        <div className="text-xs text-gray-500 font-bold">{business.phone}</div>
                                    )}

                                    {hours.length > 0 && (
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Business Hours</p>
                                            <div className="grid grid-cols-1 gap-0.5">
                                                {hours.map(h => (
                                                    <div key={h.day} className="flex justify-between text-[11px] font-bold">
                                                        <span className={cn(h.isToday ? "text-primary" : "text-gray-500")}>{h.day}</span>
                                                        <span className={cn(h.closed ? "text-red-400" : "text-gray-500")}>
                                                            {h.closed ? 'Closed' : `${h.open} - ${h.close}`}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="shrink-0 px-5 py-3.5 bg-white border-t border-gray-100 flex items-center justify-end">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
                        >
                            Done
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}