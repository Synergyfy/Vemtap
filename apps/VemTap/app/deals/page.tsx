'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, MapPin, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CategoryDropdown from '@/components/promotions/CategoryStep';
import TrendingSection from '@/components/promotions/TrendingSection';
import PromotionCard from '@/components/promotions/PromotionCard';
import LocationModal from '@/components/promotions/LocationModal';
import { usePublicOffers } from '@/services/deals/hooks';
import type { DealOffer } from '@/services/deals/types';
import type { Promotion, PromotionBusiness } from '@/lib/promotions';
import type { MockPromotion } from '@/lib/mock/promotions';
import { reverseGeocode, type GeolocationCoordinates } from '@/lib/geolocation';

function toPromotionBusiness(offer: DealOffer): PromotionBusiness {
    const branch = offer.branch;
    if (branch) {
        return {
            id: branch.id,
            name: branch.name,
            slug: branch.username || branch.uniqueCode || '',
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
    return {
        id: offer.branchId || '',
        name: offer.branchName || offer.business?.name || 'Unknown Business',
        slug: '',
        logo: offer.business?.logo || '',
        photos: [],
        categoryId: '',
        categoryName: '',
        address: offer.business?.address || '',
        hours: [],
        rating: 0,
        totalReviews: 0,
    };
}

function toPromotion(offer: DealOffer): Promotion {
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

    // Fallback: use first item's image if mainImage is missing
    const image = offer.mainImage || offer.items?.[0]?.mainImage || '';
    const galleryImages = offer.galleryImages || offer.items?.flatMap(i => i.galleryImages || []) || [];

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
        image,
        galleryImages,
        startDate: offer.startDate || '',
        endDate: offer.endDate || '',
        claimedCount: offer.claimedCount,
        maxClaims: offer.maxClaims,
        isTrending: offer.isTrending || false,
        audience: offer.audience,
        maxClaimsPerCustomer: offer.maxClaimsPerCustomer,
        claimCodePrefix: offer.claimCodePrefix,
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

const HERO_SLIDES = [
    {
        emoji: '✨',
        badge: 'Deal Fest · Fresh drops daily',
        title: (
            <>
                Deals so good,
                <br />
                <span className="bg-gradient-to-r from-primary via-blue-500 to-fuchsia-500 bg-clip-text text-transparent">
                    they feel like gifts
                </span>
            </>
        ),
        body: 'Browse exclusive promotions from the best businesses around you. Check VemTap before you shop.',
    },
    {
        emoji: '📍',
        badge: 'Nearby & ready to claim',
        title: (
            <>
                Fresh deals,
                <br />
                <span className="bg-gradient-to-r from-sky-500 via-blue-500 to-emerald-500 bg-clip-text text-transparent">
                    right outside your door
                </span>
            </>
        ),
        body: 'From cafés to salons to electronics — set your location and we’ll surface the hottest promotions closest to you.',
    },
    {
        emoji: '🔥',
        badge: 'Limited time only',
        title: (
            <>
                Grab them
                <br />
                <span className="bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                    before they’re gone
                </span>
            </>
        ),
        body: 'Featured deals rotate every 60 seconds and claim limits are tight. Find something you love and don’t let it slip away.',
    },
];

export default function PromotionsPage() {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
    const [locationLabel, setLocationLabel] = useState('');
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [heroSlide, setHeroSlide] = useState(0);
    const [heroPaused, setHeroPaused] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q') || params.get('search') || '';
        if (q) setSearch(q);
    }, []);

    useEffect(() => {
        if (heroPaused) return;
        const t = setTimeout(
            () => setHeroSlide(s => (s + 1) % HERO_SLIDES.length),
            6000,
        );
        return () => clearTimeout(t);
    }, [heroSlide, heroPaused]);
    const queryParams = useMemo(() => ({
        search: search || undefined,
        categoryId: selectedCategory || undefined,
        lat: location?.lat,
        lng: location?.lng,
    }), [search, selectedCategory, location]);

    const { data: offersData, isLoading, isError, refetch } = usePublicOffers(queryParams);

    useEffect(() => {
        const saved = localStorage.getItem('vemtap_user_location');
        const savedLabel = localStorage.getItem('vemtap_user_location_label');
        if (saved) {
            try {
                setLocation(JSON.parse(saved));
                setLocationLabel(savedLabel || '');
            } catch {
                setShowLocationModal(true);
            }
        } else {
            setShowLocationModal(true);
        }
    }, []);

    useEffect(() => {
        if (!location || locationLabel) return;
        let cancelled = false;
        reverseGeocode(location)
            .then((label) => {
                if (cancelled) return;
                setLocationLabel(label);
                localStorage.setItem('vemtap_user_location_label', label);
            })
            .catch((err) => {
                if (cancelled) return;
                console.warn('Reverse geocoding failed:', err);
            });
        return () => { cancelled = true; };
    }, [location, locationLabel]);

    const handleLocationSet = (coords: GeolocationCoordinates, label?: string) => {
        setLocation(coords);
        setLocationLabel(label || '');
        localStorage.setItem('vemtap_user_location', JSON.stringify(coords));
        if (label) localStorage.setItem('vemtap_user_location_label', label);
    };

    const handleClearLocation = () => {
        setLocation(null);
        setLocationLabel('');
        localStorage.removeItem('vemtap_user_location');
        localStorage.removeItem('vemtap_user_location_label');
    };

    const promotions = useMemo(() => {
        if (!offersData?.data) return [];
        const now = new Date();
        return offersData.data
            .filter((offer): offer is DealOffer => {
                if (!offer || !offer.id || (!offer.branch && !offer.branchId)) return false;
                if (offer.endDate && new Date(offer.endDate) < now) return false;
                if (offer.startDate && new Date(offer.startDate) > now) return false;
                return true;
            })
            .map(toPromotion);
    }, [offersData]);

    const filteredPromotions = useMemo(() => {
        if (!promotions.length) return [];
        let result = promotions;
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.business.name.toLowerCase().includes(q) ||
                p.business.address.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q)
            );
        }
        return result;
    }, [promotions, search]);

    const trendingPromotions = useMemo(() => {
        return promotions
            .filter(p => p.isTrending)
            .sort((a, b) => b.claimedCount - a.claimedCount)
            .slice(0, 5);
    }, [promotions]);

    return (
        <div className="min-h-screen bg-[#f4f5f6] font-body text-text-main">
            <Navbar />

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/80 via-white to-white border-b border-black/[0.03]">
                {/* Decorative drifting light flares */}
                <motion.div
                    animate={{ x: [0, 60, -40, 24, 0], y: [0, -40, 34, -22, 0] }}
                    transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-24 -left-24 size-80 bg-primary/10 rounded-full blur-3xl pointer-events-none"
                />
                <motion.div
                    animate={{ x: [0, -52, 34, -14, 0], y: [0, 32, -44, 22, 0] }}
                    transition={{ duration: 33, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-20 right-6 size-72 bg-rose-400/10 rounded-full blur-3xl pointer-events-none"
                />
                <motion.div
                    animate={{ x: [0, 44, -36, 18, 0], y: [0, -28, 38, -16, 0] }}
                    transition={{ duration: 39, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute bottom-0 left-1/3 size-64 bg-orange-300/10 rounded-full blur-3xl pointer-events-none"
                />

                {/* Floating deal stickers (desktop) */}
                <div className="hidden lg:flex absolute right-28 top-28 rotate-6 rounded-xl bg-white shadow-xl shadow-black/5 ring-1 ring-black/5 px-3 py-2 text-[11px] font-black text-rose-500">
                    -50% OFF
                </div>
                <div className="hidden lg:flex absolute right-72 top-16 -rotate-6 rounded-xl bg-gradient-to-br from-primary to-blue-500 text-white shadow-xl shadow-primary/20 px-3 py-2 text-[11px] font-black items-center gap-1">
                    <span className="text-[13px]">🔥</span> HOT DEALS
                </div>
                <div className="hidden lg:flex absolute right-16 bottom-24 -rotate-12 rounded-xl bg-white shadow-xl shadow-black/5 ring-1 ring-black/5 px-3 py-2 text-[11px] font-black text-emerald-500">
                    FREE ₦2,500
                </div>

                <div className="max-w-7xl mx-auto px-4 md:px-8 pt-28 pb-12 md:pt-36 md:pb-16">
                    <div
                        className="max-w-2xl"
                        onMouseEnter={() => setHeroPaused(true)}
                        onMouseLeave={() => setHeroPaused(false)}
                    >
                        {/* Slideshow */}
                        <div className="relative min-h-[14rem] sm:min-h-[13.5rem] lg:min-h-[16.5rem]">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={heroSlide}
                                    initial={{ opacity: 0, y: 26 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -26 }}
                                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <div className="inline-flex items-center gap-1.5 bg-white/70 backdrop-blur border border-amber-200/70 rounded-full px-3 py-1 mb-5 shadow-sm">
                                        <span className="text-[12px]">{HERO_SLIDES[heroSlide].emoji}</span>
                                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">
                                            {HERO_SLIDES[heroSlide].badge}
                                        </span>
                                    </div>

                                    <h1 className="text-[32px] sm:text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-gray-900 tracking-tight leading-[1.12]">
                                        {HERO_SLIDES[heroSlide].title}
                                    </h1>

                                    <p className="text-gray-500 font-normal text-sm md:text-base mt-3 max-w-lg">
                                        {HERO_SLIDES[heroSlide].body}
                                    </p>
                                </motion.div>
                            </AnimatePresence>

                            {/* Slide dots */}
                            <div className="flex items-center gap-1.5 mt-6">
                                {HERO_SLIDES.map((_, i) => {
                                    const active = i === heroSlide;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setHeroSlide(i)}
                                            aria-label={`Hero slide ${i + 1}`}
                                            className={cn(
                                                'h-1.5 rounded-full transition-all duration-500',
                                                active
                                                    ? 'w-8 bg-gradient-to-r from-primary to-blue-500'
                                                    : 'w-1.5 bg-gray-300 hover:bg-gray-400',
                                            )}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {!location && (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                onClick={() => setShowLocationModal(true)}
                                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                            >
                                <MapPin size={14} />
                                Set your location for nearby deals
                            </motion.button>
                        )}
                    </div>
                </div>
            </section>

            {/* Search + Filters */}
            <section className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-black/[0.04]">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
                    <div className="flex flex-col sm:flex-row gap-2.5">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search deals, businesses, or location..."
                                className="w-full h-12 pl-11 pr-4 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 shadow-sm transition-all"
                            />
                        </div>

                        <div className="w-full sm:w-64">
                            <CategoryDropdown
                                selected={selectedCategory}
                                onSelect={setSelectedCategory}
                            />
                        </div>
                    </div>

                    {location && (
                        <div className="flex items-center gap-2 mt-2">
                            <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-full pl-3 pr-1 py-1.5 max-w-xs sm:max-w-md">
                                <MapPin size={12} className="text-primary shrink-0" />
                                <span
                                    className="text-[10px] font-bold text-primary truncate"
                                    title={locationLabel || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                                >
                                    {locationLabel || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                                </span>
                                <button
                                    onClick={handleClearLocation}
                                    className="p-1 hover:bg-primary/10 rounded-full transition-colors shrink-0"
                                    aria-label="Clear location"
                                >
                                    <X size={10} className="text-primary" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Main Content */}
            <section className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-20">
                <div className="space-y-8">
                    {/* Loading */}
                    {isLoading && (
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="rounded-[1.15rem] bg-white ring-1 ring-black/[0.04] overflow-hidden animate-pulse">
                                    <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100" />
                                    <div className="p-3 space-y-2.5">
                                        <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                                        <div className="h-3.5 bg-slate-100 rounded w-3/4" />
                                        <div className="h-5 bg-slate-100 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {isError && (
                        <div className="flex flex-col items-center justify-center py-24 space-y-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-amber-400/10 rounded-3xl rotate-6" />
                                <div className="relative size-16 bg-white rounded-3xl shadow-xl shadow-black/5 ring-1 ring-black/5 flex items-center justify-center text-3xl">
                                    🫥
                                </div>
                            </div>
                            <p className="text-sm font-black text-gray-600">Deals took a break</p>
                            <p className="text-xs text-gray-400 font-medium">Couldn&apos;t reach the deal shelf. Give it another shot.</p>
                            <button
                                onClick={() => refetch()}
                                className="text-xs font-black text-primary hover:underline"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {/* Data loaded */}
                    {!isLoading && !isError && (
                        <>
                            {/* Trending */}
                            {!selectedCategory && !search && trendingPromotions.length > 0 && (
                                <TrendingSection promotions={trendingPromotions} />
                            )}

                            {/* Results header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="size-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                                        <Sparkles size={13} />
                                    </span>
                                    <span className="text-xs font-black text-gray-700 uppercase tracking-wider">
                                        {filteredPromotions.length} {filteredPromotions.length === 1 ? 'deal' : 'deals'}
                                        {selectedCategory && (
                                            <> in <span className="text-primary">this category</span></>
                                        )}
                                    </span>
                                </div>
                                {filteredPromotions.length > 0 && (
                                    <span className="text-[10px] font-bold text-gray-400">
                                        Sorted by popularity
                                    </span>
                                )}
                            </div>

                            {/* Grid */}
                            {filteredPromotions.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                                    {filteredPromotions.map((promo, i) => (
                                        <PromotionCard key={promo.id} promotion={toMockPromotion(promo)} index={i} />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center space-y-4">
                                    <div className="relative mx-auto size-20">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-rose-500/10 rounded-3xl -rotate-6" />
                                        <div className="relative size-20 bg-white rounded-3xl shadow-xl shadow-black/5 ring-1 ring-black/5 flex items-center justify-center text-3xl">
                                            🛍️
                                        </div>
                                    </div>
                                    <p className="text-gray-600 font-black text-sm">No deals found</p>
                                    <p className="text-xs text-gray-400 font-medium">
                                        Try a different search or category — new deals drop daily.
                                    </p>
                                    <button
                                        onClick={() => { setSelectedCategory(null); setSearch(''); }}
                                        className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-gradient-to-r from-primary to-blue-500 rounded-full px-5 py-2.5 shadow-md shadow-primary/25 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                                    >
                                        <Sparkles size={12} /> Clear all filters
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            <LocationModal
                isOpen={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                onLocationSet={handleLocationSet}
            />

            <Footer />
        </div>
    );
}
