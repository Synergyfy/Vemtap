'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Store, Sparkles, MapPin, Loader2, QrCode, ArrowLeft, ArrowDownWideNarrow } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CategoryDropdown from '@/components/promotions/CategoryStep';
import PromotionCard from '@/components/promotions/PromotionCard';
import { useClusterContext } from '@/services/clusters/hooks';
import { useClusterDeals } from '@/services/clusters/hooks';
import type { ClusterDealsSortBy, ClusterDeal } from '@/lib/api/clusters';
import type { Promotion, PromotionBusiness } from '@/lib/promotions';
import type { MockPromotion } from '@/lib/mock/promotions';

function toPromotionBusiness(offer: ClusterDeal): PromotionBusiness {
    const branch = offer.branch;
    if (!branch) {
        return {
            id: '', name: 'Unknown Business', slug: '', logo: '', photos: [],
            categoryId: '', categoryName: '', address: '', hours: [], rating: 0, totalReviews: 0,
        };
    }
    return {
        id: branch.id,
        name: branch.name,
        slug: branch.slug,
        logo: branch.logoUrl || '',
        photos: [],
        categoryId: '',
        categoryName: '',
        address: branch.address || '',
        hours: [],
        rating: 0,
        totalReviews: 0,
    };
}

function toPromotion(offer: ClusterDeal): Promotion {
    const discountPercent = offer.pricingType === 'percentage_discount' && offer.discountValue
        ? Number(offer.discountValue) : undefined;
    const discountAmount = offer.pricingType === 'fixed_discount_price' && offer.discountValue
        ? Number(offer.discountValue) : undefined;
    const calcPrice = Number(offer.calculatedPrice);
    const originalPrice = discountPercent
        ? Math.round(calcPrice / (1 - discountPercent / 100))
        : discountAmount
            ? calcPrice + discountAmount
            : calcPrice;

    return {
        id: offer.id,
        business: toPromotionBusiness(offer),
        title: offer.name,
        description: offer.description,
        longDescription: offer.longDescription || offer.description,
        terms: offer.terms || [],
        discountPercent: discountPercent || offer.discountPercent || undefined,
        discountAmount,
        originalPrice: offer.originalPrice || originalPrice,
        dealPrice: Number(offer.dealPrice || offer.calculatedPrice),
        image: offer.mainImage || '',
        galleryImages: offer.galleryImages || [],
        startDate: offer.startDate || '',
        endDate: offer.endDate || '',
        claimedCount: offer.claimedCount,
        maxClaims: offer.maxClaims,
        isTrending: offer.isTrending || false,
        audience: offer.audience || undefined,
        maxClaimsPerCustomer: offer.maxClaimsPerCustomer ?? undefined,
        claimCodePrefix: offer.claimCodePrefix || undefined,
    };
}

function toMockPromotion(p: Promotion): MockPromotion {
    return {
        id: p.id,
        name: p.title,
        description: p.description,
        longDescription: p.longDescription,
        terms: p.terms,
        businessName: p.business.name,
        businessSlug: p.business.slug,
        businessLogo: p.business.logo,
        category: p.business.categoryName as MockPromotion['category'],
        discountPercent: p.discountPercent,
        discountAmount: p.discountAmount,
        originalPrice: p.originalPrice,
        dealPrice: p.dealPrice,
        image: p.image,
        galleryImages: p.galleryImages || [],
        startDate: p.startDate,
        endDate: p.endDate,
        audience: p.audience || '',
        location: p.business.address,
        claimedCount: p.claimedCount,
        maxClaims: p.maxClaims,
        maxClaimsPerCustomer: p.maxClaimsPerCustomer,
        claimCodePrefix: p.claimCodePrefix,
    };
}

const SORTS: { value: ClusterDealsSortBy; label: string }[] = [
    { value: 'fair', label: 'Fair (rotating)' },
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price ↑' },
    { value: 'price_desc', label: 'Price ↓' },
    { value: 'distance_asc', label: 'Distance ↑' },
    { value: 'distance_desc', label: 'Distance ↓' },
];

export default function ClusterDiscoveryPage() {
    const params = useParams<{ uniqueCode: string }>();
    const router = useRouter();
    const uniqueCode = params?.uniqueCode || '';

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<ClusterDealsSortBy>('fair');
    const [customerLocation] = useState<{ lat: number; lng: number } | null>(() => {
        if (typeof window === 'undefined') return null;
        const saved = localStorage.getItem('vemtap_user_location');
        if (!saved) return null;
        try {
            const loc = JSON.parse(saved);
            return (loc?.lat != null && loc?.lng != null) ? { lat: loc.lat, lng: loc.lng } : null;
        } catch {
            return null;
        }
    });

    const contextQ = useClusterContext(uniqueCode);
    const context = contextQ.data;
    const contextLoading = contextQ.isLoading;
    const contextError = contextQ.isError;
    const contextIs404 = contextError;

    const isDistanceSort = sortBy === 'distance_asc' || sortBy === 'distance_desc';
    const dealsParams = useMemo(() => ({
        page: 1,
        limit: 20,
        search: search.trim() || undefined,
        categoryId: selectedCategory || undefined,
        sortBy,
        lat: isDistanceSort ? customerLocation?.lat : undefined,
        lng: isDistanceSort ? customerLocation?.lng : undefined,
    }), [search, selectedCategory, sortBy, isDistanceSort, customerLocation]);

    const contextActive = !!context?.qrActive;
    const dealsQ = useClusterDeals(uniqueCode, dealsParams, contextActive && !contextLoading);
    const dealsData = dealsQ.data;

    const promotions = useMemo(() => {
        if (!dealsData?.data) return [];
        const now = new Date();
        return dealsData.data
            .filter((offer) => {
                if (!offer || !offer.id || !offer.branch) return false;
                if (offer.endDate && new Date(offer.endDate) < now) return false;
                if (offer.startDate && new Date(offer.startDate) > now) return false;
                return true;
            })
            .map(toPromotion);
    }, [dealsData]);

    const trendingPromotions = useMemo(() => {
        return promotions
            .filter(p => p.isTrending)
            .sort((a, b) => b.claimedCount - a.claimedCount)
            .slice(0, 5);
    }, [promotions]);

    if (contextLoading) {
        return (
            <div className="min-h-screen bg-[#f4f5f6] font-body text-text-main">
                <Navbar />
                <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
                    <Loader2 size={32} className="animate-spin text-primary" />
                    <p className="text-sm font-bold text-gray-400">Loading market…</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (contextIs404 || !context) {
        return (
            <div className="min-h-screen bg-[#f4f5f6] font-body text-text-main">
                <Navbar />
                <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
                    <div className="size-20 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-400 mb-6">
                        <QrCode size={40} />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-headline font-black text-gray-900">QR code not found</h1>
                    <p className="text-sm text-gray-500 font-medium mt-2 max-w-sm">
                        This code doesn&apos;t match any market. Check the code and try again.
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all"
                    >
                        <ArrowLeft size={14} /> Go Home
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    if (!contextActive) {
        return (
            <div className="min-h-screen bg-[#f4f5f6] font-body text-text-main">
                <Navbar />
                <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
                    <div className="size-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-400 mb-6">
                        <QrCode size={40} />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-headline font-black text-gray-900">This QR code has been deactivated</h1>
                    <p className="text-sm text-gray-500 font-medium mt-2 max-w-sm">
                        This market&apos;s entry point is currently paused. Check back soon for its live deals.
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                        <ArrowLeft size={14} /> Go Home
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    const header = context.cluster;

    return (
        <div className="min-h-screen bg-[#f4f5f6] font-body text-text-main">
            <Navbar />

            {/* Header */}
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 md:px-8 pt-28 pb-8 md:pt-32 md:pb-10">
                    <button
                        onClick={() => router.push('/')}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 mb-5 transition-colors"
                    >
                        <ArrowLeft size={13} /> All deals
                    </button>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-1.5 bg-primary/5 border border-primary/10 rounded-lg px-3 py-1 mb-4"
                    >
                        <QrCode size={12} className="text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                            Market · {header.uniqueCode}
                        </span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="text-3xl md:text-5xl font-headline font-black text-gray-900 tracking-tight leading-tight"
                    >
                        {header.name}
                    </motion.h1>
                    {header.description && (
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-gray-500 font-medium text-sm md:text-base mt-3 max-w-lg"
                        >
                            {header.description}
                        </motion.p>
                    )}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="flex items-center gap-2 mt-4 flex-wrap"
                    >
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest">
                            <Store size={11} /> {context.branches.length} businesses
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                            <Sparkles size={11} /> {dealsData ? dealsData.data.length : '…'} live deals
                        </span>
                    </motion.div>
                </div>
            </section>

            {/* Filters bar */}
            <section className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search deals or businesses…"
                                className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 transition-all"
                            />
                        </div>
                        <div className="w-full sm:w-56">
                            <CategoryDropdown
                                selected={selectedCategory}
                                onSelect={setSelectedCategory}
                            />
                        </div>
                        <div className="w-full sm:w-48 relative">
                            <ArrowDownWideNarrow size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as ClusterDealsSortBy)}
                                className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/15 appearance-none cursor-pointer"
                            >
                                {SORTS.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {isDistanceSort && !customerLocation && (
                        <div className="flex items-center gap-2 mt-3">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-3 py-1.5">
                                <MapPin size={11} />
                                Set your location on the Deals page to enable distance sorting.
                            </span>
                        </div>
                    )}

                    {isDistanceSort && customerLocation && (
                        <div className="flex items-center gap-2 mt-3">
                            <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-full px-3 py-1.5">
                                <MapPin size={11} className="text-primary" />
                                <span className="text-[10px] font-bold text-primary">
                                    Sorting by distance from your saved location
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Results */}
            <section className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-20">
                {dealsQ.isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="rounded-2xl bg-white border border-gray-100 overflow-hidden animate-pulse">
                                <div className="aspect-[4/3] bg-gray-100" />
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                                    <div className="h-8 bg-gray-100 rounded w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : promotions.length > 0 ? (
                    <>
                        {!selectedCategory && !search && sortBy === 'fair' && trendingPromotions.length > 0 && (
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles size={14} className="text-primary" />
                                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Trending in this market</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {trendingPromotions.map((p, i) => (
                                        <PromotionCard key={p.id} promotion={toMockPromotion(p)} index={i} />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                {dealsData?.total ?? promotions.length} {dealsData?.total === 1 ? 'deal' : 'deals'}
                                {selectedCategory && <> in <span className="text-primary">this category</span></>}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">Fair rotation refreshes every 15 min</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {promotions.map((p, i) => (
                                <PromotionCard key={p.id} promotion={toMockPromotion(p)} index={i} />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="py-24 text-center space-y-4">
                        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                            <Search size={24} className="text-gray-300" />
                        </div>
                        <p className="text-gray-400 font-bold text-sm">No deals in this area right now</p>
                        <p className="text-xs text-gray-300 font-medium">
                            Check back soon — or try a different search or category
                        </p>
                        <button
                            onClick={() => { setSelectedCategory(null); setSearch(''); }}
                            className="text-xs font-black text-primary hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </section>

            <Footer />
        </div>
    );
}