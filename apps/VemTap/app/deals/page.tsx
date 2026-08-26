'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, X, SlidersHorizontal, ArrowUpDown, Flame, Clock, TrendingUp, Star, Sparkles, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CategoryDropdown from '@/components/promotions/CategoryStep';
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

export default function PromotionsPage() {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
    const [locationLabel, setLocationLabel] = useState('');
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [freeOnly, setFreeOnly] = useState(false);
    const [priceFrom, setPriceFrom] = useState('');
    const [priceTo, setPriceTo] = useState('');
    const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'trending' | 'featured' | 'price-low' | 'price-high'>('popular');
    const [locationRange, setLocationRange] = useState<number>(50);

    // Hero carousel
    const [heroSlide, setHeroSlide] = useState(0);
    const [heroPaused, setHeroPaused] = useState(false);

    // Hero carousel auto-advance
    useEffect(() => {
        if (heroPaused) return;
        const t = setTimeout(() => setHeroSlide(s => (s + 1) % 3), 5000);
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

        // Text search
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.business.name.toLowerCase().includes(q) ||
                p.business.address.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q)
            );
        }

        // Free only
        if (freeOnly) {
            result = result.filter(p => Number(p.dealPrice) === 0);
        }

        // Price range
        const minPrice = priceFrom ? Number(priceFrom) : undefined;
        const maxPrice = priceTo ? Number(priceTo) : undefined;
        if (minPrice !== undefined) {
            result = result.filter(p => Number(p.dealPrice) >= minPrice);
        }
        if (maxPrice !== undefined) {
            result = result.filter(p => Number(p.dealPrice) <= maxPrice);
        }

        // Sort
        switch (sortBy) {
            case 'newest':
                result = [...result].sort((a, b) => {
                    const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
                    const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
                    return dateB - dateA;
                });
                break;
            case 'trending':
                result = [...result].sort((a, b) => b.claimedCount - a.claimedCount);
                break;
            case 'featured':
                result = [...result].sort((a, b) => (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0));
                break;
            case 'price-low':
                result = [...result].sort((a, b) => Number(a.dealPrice) - Number(b.dealPrice));
                break;
            case 'price-high':
                result = [...result].sort((a, b) => Number(b.dealPrice) - Number(a.dealPrice));
                break;
            case 'popular':
            default:
                result = [...result].sort((a, b) => b.claimedCount - a.claimedCount);
                break;
        }

        return result;
    }, [promotions, search, freeOnly, priceFrom, priceTo, sortBy]);

    return (
        <div className="min-h-screen bg-[#f4f5f6] font-body text-text-main">
            <Navbar />

            {/* Hero Banner — Jumia-style carousel */}
            <section
                className="relative bg-white pt-20 sm:pt-24 md:pt-28"
                onMouseEnter={() => setHeroPaused(true)}
                onMouseLeave={() => setHeroPaused(false)}
            >
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="relative rounded-2xl overflow-hidden min-h-[220px] sm:min-h-[280px] md:min-h-[340px]">
                        {/* Slide 1 — Daily Deals */}
                        <div className={cn(
                            "absolute inset-0 transition-all duration-700 ease-in-out",
                            heroSlide === 0 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8 pointer-events-none"
                        )}>
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50" />
                            <div className="relative h-full flex items-center">
                                <div className="flex-1 px-6 sm:px-10 md:px-14 py-8 sm:py-12">
                                    <div className="inline-block bg-amber-400 text-white text-[10px] sm:text-xs font-black px-3 py-1 rounded-full mb-3 sm:mb-4 uppercase tracking-wider">
                                        Daily Deals
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 leading-[1.1] mb-2 sm:mb-3">
                                        Fresh Deals<br />
                                        <span className="text-primary">Every Day</span>
                                    </h2>
                                    <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 max-w-xs">
                                        Up to 70% off from businesses near you. Grab before they&apos;re gone.
                                    </p>
                                    <button className="bg-primary text-white text-xs sm:text-sm font-bold px-5 sm:px-7 py-2.5 sm:py-3 rounded-full hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20">
                                        Shop Now →
                                    </button>
                                </div>
                                <div className="hidden sm:flex flex-1 items-center justify-center gap-3 pr-6 md:pr-10">
                                    {[
                                        { bg: 'from-rose-400 to-pink-500', discount: '50%', rotate: '-rotate-3' },
                                        { bg: 'from-blue-400 to-cyan-500', discount: '30%', rotate: 'rotate-2' },
                                        { bg: 'from-emerald-400 to-green-500', discount: 'FREE', rotate: '-rotate-1' },
                                    ].map((card, i) => (
                                        <div key={i} className={cn("w-[100px] lg:w-[120px] bg-white rounded-2xl shadow-xl overflow-hidden", card.rotate)}>
                                            <div className={cn("h-24 lg:h-32 bg-gradient-to-br", card.bg)} />
                                            <div className="p-2.5">
                                                <div className="h-1.5 bg-gray-100 rounded w-full mb-1" />
                                                <div className="h-1.5 bg-gray-100 rounded w-2/3 mb-1.5" />
                                                <span className="inline-block bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded">
                                                    {card.discount} OFF
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Slide 2 — Flash Sale */}
                        <div className={cn(
                            "absolute inset-0 transition-all duration-700 ease-in-out",
                            heroSlide === 1 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"
                        )}>
                            <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50" />
                            <div className="relative h-full flex items-center">
                                <div className="flex-1 px-6 sm:px-10 md:px-14 py-8 sm:py-12">
                                    <div className="inline-block bg-rose-500 text-white text-[10px] sm:text-xs font-black px-3 py-1 rounded-full mb-3 sm:mb-4 uppercase tracking-wider animate-pulse">
                                        ⚡ Flash Sale
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 leading-[1.1] mb-2 sm:mb-3">
                                        Up to<br />
                                        <span className="bg-gradient-to-r from-rose-500 to-fuchsia-500 bg-clip-text text-transparent">80% OFF</span>
                                    </h2>
                                    <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 max-w-xs">
                                        Limited time only. Electronics, fashion, home & more.
                                    </p>
                                    <button className="bg-rose-500 text-white text-xs sm:text-sm font-bold px-5 sm:px-7 py-2.5 sm:py-3 rounded-full hover:bg-rose-600 active:scale-95 transition-all shadow-lg shadow-rose-500/20">
                                        Claim Deals →
                                    </button>
                                </div>
                                <div className="hidden sm:flex flex-1 items-center justify-center gap-3 pr-6 md:pr-10">
                                    <div className="relative">
                                        <div className="bg-white rounded-3xl shadow-2xl px-8 py-6 text-center">
                                            <div className="text-5xl lg:text-6xl font-black text-rose-500 leading-none">80%</div>
                                            <div className="text-sm font-black text-gray-900 mt-1">OFF</div>
                                        </div>
                                        <div className="absolute -top-3 -right-3 bg-amber-400 text-white text-[9px] font-black px-2 py-1 rounded-lg rotate-6 shadow">
                                            LIMITED
                                        </div>
                                        <div className="absolute -bottom-2 -left-4 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-lg -rotate-6 shadow">
                                            ₦2,500
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Slide 3 — New Arrivals */}
                        <div className={cn(
                            "absolute inset-0 transition-all duration-700 ease-in-out",
                            heroSlide === 2 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"
                        )}>
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50" />
                            <div className="relative h-full flex items-center">
                                <div className="flex-1 px-6 sm:px-10 md:px-14 py-8 sm:py-12">
                                    <div className="inline-block bg-emerald-500 text-white text-[10px] sm:text-xs font-black px-3 py-1 rounded-full mb-3 sm:mb-4 uppercase tracking-wider">
                                        🆕 New Arrivals
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 leading-[1.1] mb-2 sm:mb-3">
                                        Just Dropped<br />
                                        <span className="text-emerald-600">Check Them Out</span>
                                    </h2>
                                    <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 max-w-xs">
                                        Be the first to discover new businesses and exclusive launch deals.
                                    </p>
                                    <button className="bg-emerald-500 text-white text-xs sm:text-sm font-bold px-5 sm:px-7 py-2.5 sm:py-3 rounded-full hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">
                                        Explore Now →
                                    </button>
                                </div>
                                <div className="hidden sm:flex flex-1 items-center justify-center gap-3 pr-6 md:pr-10">
                                    {[
                                        { bg: 'from-violet-400 to-purple-500', tag: 'NEW', rotate: 'rotate-2' },
                                        { bg: 'from-sky-400 to-blue-500', tag: 'HOT', rotate: '-rotate-2' },
                                        { bg: 'from-amber-400 to-orange-500', tag: 'TRENDING', rotate: 'rotate-1' },
                                    ].map((card, i) => (
                                        <div key={i} className={cn("w-[100px] lg:w-[120px] bg-white rounded-2xl shadow-xl overflow-hidden", card.rotate)}>
                                            <div className={cn("h-24 lg:h-32 bg-gradient-to-br", card.bg)} />
                                            <div className="p-2.5">
                                                <div className="h-1.5 bg-gray-100 rounded w-full mb-1" />
                                                <div className="h-1.5 bg-gray-100 rounded w-2/3 mb-1.5" />
                                                <span className="inline-block bg-emerald-50 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded">
                                                    {card.tag}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pagination dots */}
                    <div className="flex justify-center gap-2 py-3">
                        {[0, 1, 2].map((i) => (
                            <button
                                key={i}
                                onClick={() => setHeroSlide(i)}
                                className={cn(
                                    "rounded-full transition-all duration-300",
                                    heroSlide === i
                                        ? "w-6 h-2 bg-primary"
                                        : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Category Quick Links — Jumia-style */}
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1">
                        {[
                            { label: 'Nearby Deals', emoji: '📍', bg: 'from-rose-50 to-pink-50', border: 'border-rose-100' },
                            { label: 'Flash Sales', emoji: '⚡', bg: 'from-amber-50 to-yellow-50', border: 'border-amber-100' },
                            { label: 'New Arrivals', emoji: '🆕', bg: 'from-emerald-50 to-green-50', border: 'border-emerald-100' },
                            { label: 'Free Deals', emoji: '🎁', bg: 'from-violet-50 to-purple-50', border: 'border-violet-100' },
                            { label: 'Top Rated', emoji: '⭐', bg: 'from-blue-50 to-sky-50', border: 'border-blue-100' },
                            { label: 'Food & Drinks', emoji: '🍔', bg: 'from-orange-50 to-amber-50', border: 'border-orange-100' },
                            { label: 'Fashion', emoji: '👗', bg: 'from-fuchsia-50 to-pink-50', border: 'border-fuchsia-100' },
                            { label: 'Electronics', emoji: '📱', bg: 'from-cyan-50 to-blue-50', border: 'border-cyan-100' },
                        ].map((item) => (
                            <button
                                key={item.label}
                                className={cn(
                                    "shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border bg-gradient-to-br transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95",
                                    item.bg, item.border
                                )}
                            >
                                <span className="text-lg">{item.emoji}</span>
                                <span className="text-xs font-bold text-gray-700 whitespace-nowrap">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Search Bar — filter button + search */}
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
                    <div className="flex items-center gap-2">
                        {/* Filter toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "h-10 sm:h-11 px-3 sm:px-4 rounded-full border text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shrink-0",
                                showFilters
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white text-gray-700 border-gray-200 hover:border-primary/30"
                            )}
                        >
                            <SlidersHorizontal size={13} />
                            <span className="hidden sm:inline">Filters</span>
                        </button>

                        {/* Mobile: search icon */}
                        <button
                            onClick={() => setSearchOpen(!searchOpen)}
                            className="sm:hidden w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-primary/30 transition-all shrink-0"
                        >
                            <Search size={16} />
                        </button>

                        {/* Desktop: search input */}
                        <div className="hidden sm:block relative flex-1">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search deals..."
                                className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 shadow-sm transition-all"
                            />
                        </div>

                        {/* Mobile: expanded search overlay */}
                        <AnimatePresence>
                            {searchOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                    className="sm:hidden fixed inset-x-0 top-0 z-50 p-4 bg-white/95 backdrop-blur-xl border-b border-gray-100"
                                >
                                    <div className="relative bg-white rounded-full border border-gray-200 shadow-lg flex items-center">
                                        <Search size={14} className="absolute left-3.5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Search deals..."
                                            autoFocus
                                            className="w-full h-10 pl-10 pr-9 bg-transparent rounded-full text-xs font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none"
                                        />
                                        <button
                                            onClick={() => { setSearchOpen(false); setSearch(''); }}
                                            className="absolute right-2 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </section>

            {/* Main Content — sidebar filters + deals grid */}
            <section className="max-w-7xl mx-auto px-4 md:px-8 py-6 pb-20">
                <div className="flex gap-6">

                    {/* Desktop Sidebar Filters — collapsible */}
                    {showFilters && (
                    <aside className="hidden lg:block w-72 shrink-0">
                        <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-black text-gray-900">Filters</h3>
                                    {(freeOnly || sortBy !== 'popular' || priceFrom || priceTo || locationRange < 50 || selectedCategory) && (
                                        <span className="size-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                                            {[freeOnly, sortBy !== 'popular', priceFrom, priceTo, locationRange < 50, selectedCategory].filter(Boolean).length}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {(freeOnly || sortBy !== 'popular' || priceFrom || priceTo || locationRange < 50 || selectedCategory) && (
                                        <button
                                            onClick={() => {
                                                setFreeOnly(false);
                                                setSortBy('popular');
                                                setPriceFrom('');
                                                setPriceTo('');
                                                setLocationRange(50);
                                                setSelectedCategory(null);
                                            }}
                                            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                                        >
                                            Clear all
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowFilters(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Active filter chips */}
                            {(freeOnly || sortBy !== 'popular' || priceFrom || priceTo || locationRange < 50 || selectedCategory) && (
                                <div className="px-5 py-3 flex flex-wrap gap-2 border-b border-gray-100">
                                    {selectedCategory && (
                                        <span className="inline-flex items-center gap-1 bg-primary/5 text-primary border border-primary/10 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                                            {selectedCategory}
                                            <button onClick={() => setSelectedCategory(null)} className="hover:text-primary/70"><X size={10} /></button>
                                        </span>
                                    )}
                                    {freeOnly && (
                                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                                            Free only
                                            <button onClick={() => setFreeOnly(false)} className="hover:text-emerald-700"><X size={10} /></button>
                                        </span>
                                    )}
                                    {sortBy !== 'popular' && (
                                        <span className="inline-flex items-center gap-1 bg-primary/5 text-primary border border-primary/10 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                                            {sortBy === 'newest' ? 'Newest' : sortBy === 'trending' ? 'Trending' : sortBy === 'featured' ? 'Featured' : sortBy === 'price-low' ? 'Price ↑' : 'Price ↓'}
                                            <button onClick={() => setSortBy('popular')} className="hover:text-primary/70"><X size={10} /></button>
                                        </span>
                                    )}
                                    {priceFrom && (
                                        <span className="inline-flex items-center gap-1 bg-primary/5 text-primary border border-primary/10 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                                            From ₦{Number(priceFrom).toLocaleString()}
                                            <button onClick={() => setPriceFrom('')} className="hover:text-primary/70"><X size={10} /></button>
                                        </span>
                                    )}
                                    {priceTo && (
                                        <span className="inline-flex items-center gap-1 bg-primary/5 text-primary border border-primary/10 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                                            To ₦{Number(priceTo).toLocaleString()}
                                            <button onClick={() => setPriceTo('')} className="hover:text-primary/70"><X size={10} /></button>
                                        </span>
                                    )}
                                    {locationRange < 50 && (
                                        <span className="inline-flex items-center gap-1 bg-primary/5 text-primary border border-primary/10 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                                            Within {locationRange} km
                                            <button onClick={() => setLocationRange(50)} className="hover:text-primary/70"><X size={10} /></button>
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="divide-y divide-gray-100">
                                {/* Categories */}
                                <div className="px-5 py-4">
                                    <h4 className="text-xs font-black text-gray-900 mb-3">Category</h4>
                                    <CategoryDropdown
                                        selected={selectedCategory}
                                        onSelect={setSelectedCategory}
                                    />
                                </div>

                                {/* Price Range + Free toggle */}
                                <div className="px-5 py-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-xs font-black text-gray-900">Price Range</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-gray-400">Free only</span>
                                            <button
                                                onClick={() => setFreeOnly(!freeOnly)}
                                                className={cn(
                                                    "relative w-9 h-5 rounded-full transition-all",
                                                    freeOnly ? "bg-emerald-500" : "bg-gray-200"
                                                )}
                                            >
                                                <span className={cn(
                                                    "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                                                    freeOnly && "translate-x-4"
                                                )} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2.5">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">From</label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <select
                                                        value={priceFrom}
                                                        onChange={(e) => setPriceFrom(e.target.value)}
                                                        className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/10 appearance-none cursor-pointer"
                                                    >
                                                        <option value="">Any</option>
                                                        <option value="0">₦0</option>
                                                        <option value="1000">₦1,000</option>
                                                        <option value="5000">₦5,000</option>
                                                        <option value="10000">₦10,000</option>
                                                        <option value="20000">₦20,000</option>
                                                        <option value="50000">₦50,000</option>
                                                        <option value="100000">₦100,000</option>
                                                    </select>
                                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                </div>
                                                <input
                                                    type="number"
                                                    value={priceFrom}
                                                    onChange={(e) => setPriceFrom(e.target.value)}
                                                    placeholder="₦ Min"
                                                    className="w-24 h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/30"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">To</label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <select
                                                        value={priceTo}
                                                        onChange={(e) => setPriceTo(e.target.value)}
                                                        className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/10 appearance-none cursor-pointer"
                                                    >
                                                        <option value="">Any</option>
                                                        <option value="5000">₦5,000</option>
                                                        <option value="10000">₦10,000</option>
                                                        <option value="20000">₦20,000</option>
                                                        <option value="50000">₦50,000</option>
                                                        <option value="100000">₦100,000</option>
                                                        <option value="200000">₦200,000</option>
                                                        <option value="500000">₦500,000+</option>
                                                    </select>
                                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                </div>
                                                <input
                                                    type="number"
                                                    value={priceTo}
                                                    onChange={(e) => setPriceTo(e.target.value)}
                                                    placeholder="₦ Max"
                                                    className="w-24 h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/30"
                                                />
                                            </div>
                                        </div>
                                        {/* Price sort */}
                                        <div className="flex gap-2 pt-1">
                                            <button
                                                onClick={() => setSortBy(sortBy === 'price-low' ? 'popular' : 'price-low')}
                                                className={cn(
                                                    "flex-1 h-9 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1",
                                                    sortBy === 'price-low'
                                                        ? "bg-primary/10 text-primary border-primary/20"
                                                        : "bg-white text-gray-500 border-gray-200 hover:border-primary/20"
                                                )}
                                            >
                                                <ArrowUpDown size={11} /> Low → High
                                            </button>
                                            <button
                                                onClick={() => setSortBy(sortBy === 'price-high' ? 'popular' : 'price-high')}
                                                className={cn(
                                                    "flex-1 h-9 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1",
                                                    sortBy === 'price-high'
                                                        ? "bg-primary/10 text-primary border-primary/20"
                                                        : "bg-white text-gray-500 border-gray-200 hover:border-primary/20"
                                                )}
                                            >
                                                <ArrowUpDown size={11} /> High → Low
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Distance */}
                                <div className="px-5 py-4">
                                    <h4 className="text-xs font-black text-gray-900 mb-3">Distance</h4>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-[10px] text-gray-400 font-bold">0 km</span>
                                        <input
                                            type="range"
                                            min={0}
                                            max={50}
                                            step={1}
                                            value={locationRange}
                                            onChange={(e) => setLocationRange(Number(e.target.value))}
                                            className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
                                        />
                                        <span className="text-[10px] text-gray-400 font-bold">50 km</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-500 text-center">
                                        {locationRange < 50 ? `Within ${locationRange} km` : 'Any distance'}
                                    </p>
                                </div>

                                {/* Sort By */}
                                <div className="px-5 py-4">
                                    <h4 className="text-xs font-black text-gray-900 mb-3">Sort by</h4>
                                    <div className="space-y-1">
                                        {[
                                            { key: 'popular' as const, label: 'Popular', icon: Flame },
                                            { key: 'newest' as const, label: 'Newest', icon: Clock },
                                            { key: 'trending' as const, label: 'Trending', icon: TrendingUp },
                                            { key: 'featured' as const, label: 'Featured', icon: Star },
                                        ].map(({ key, label, icon: Icon }) => (
                                            <button
                                                key={key}
                                                onClick={() => setSortBy(key)}
                                                className={cn(
                                                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all",
                                                    sortBy === key
                                                        ? "bg-primary/5 text-primary"
                                                        : "text-gray-500 hover:bg-gray-50"
                                                )}
                                            >
                                                <Icon size={13} />
                                                {label}
                                                {sortBy === key && <Check size={13} className="ml-auto" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                    )}

                    {/* Deals Content */}
                    <div className="flex-1 min-w-0">
                        {/* Mobile filter panel */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="lg:hidden overflow-hidden mb-4"
                                >
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-black text-gray-900">Filters</h3>
                                            <div className="flex items-center gap-3">
                                                {(freeOnly || sortBy !== 'popular' || priceFrom || priceTo || locationRange < 50 || selectedCategory) && (
                                                    <button
                                                        onClick={() => {
                                                            setFreeOnly(false);
                                                            setSortBy('popular');
                                                            setPriceFrom('');
                                                            setPriceTo('');
                                                            setLocationRange(50);
                                                            setSelectedCategory(null);
                                                        }}
                                                        className="text-xs font-bold text-primary"
                                                    >
                                                        Clear all
                                                    </button>
                                                )}
                                                <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Categories */}
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Category</label>
                                            <CategoryDropdown
                                                selected={selectedCategory}
                                                onSelect={setSelectedCategory}
                                            />
                                        </div>

                                        {/* Price Range + Free toggle */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Price Range</label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-gray-400">Free only</span>
                                                    <button
                                                        onClick={() => setFreeOnly(!freeOnly)}
                                                        className={cn(
                                                            "relative w-9 h-5 rounded-full transition-all",
                                                            freeOnly ? "bg-emerald-500" : "bg-gray-200"
                                                        )}
                                                    >
                                                        <span className={cn(
                                                            "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                                                            freeOnly && "translate-x-4"
                                                        )} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <select
                                                            value={priceFrom}
                                                            onChange={(e) => setPriceFrom(e.target.value)}
                                                            className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/10 appearance-none cursor-pointer"
                                                        >
                                                            <option value="">Any</option>
                                                            <option value="0">₦0</option>
                                                            <option value="1000">₦1,000</option>
                                                            <option value="5000">₦5,000</option>
                                                            <option value="10000">₦10,000</option>
                                                            <option value="20000">₦20,000</option>
                                                            <option value="50000">₦50,000</option>
                                                            <option value="100000">₦100,000</option>
                                                        </select>
                                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={priceFrom}
                                                        onChange={(e) => setPriceFrom(e.target.value)}
                                                        placeholder="₦ Min"
                                                        className="w-24 h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/10"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <select
                                                            value={priceTo}
                                                            onChange={(e) => setPriceTo(e.target.value)}
                                                            className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/10 appearance-none cursor-pointer"
                                                        >
                                                            <option value="">Any</option>
                                                            <option value="5000">₦5,000</option>
                                                            <option value="10000">₦10,000</option>
                                                            <option value="20000">₦20,000</option>
                                                            <option value="50000">₦50,000</option>
                                                            <option value="100000">₦100,000</option>
                                                            <option value="200000">₦200,000</option>
                                                            <option value="500000">₦500,000+</option>
                                                        </select>
                                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={priceTo}
                                                        onChange={(e) => setPriceTo(e.target.value)}
                                                        placeholder="₦ Max"
                                                        className="w-24 h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/10"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setSortBy(sortBy === 'price-low' ? 'popular' : 'price-low')}
                                                        className={cn(
                                                            "flex-1 h-9 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1",
                                                            sortBy === 'price-low'
                                                                ? "bg-primary/10 text-primary border-primary/20"
                                                                : "bg-white text-gray-500 border-gray-200"
                                                        )}
                                                    >
                                                        <ArrowUpDown size={11} /> Low → High
                                                    </button>
                                                    <button
                                                        onClick={() => setSortBy(sortBy === 'price-high' ? 'popular' : 'price-high')}
                                                        className={cn(
                                                            "flex-1 h-9 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1",
                                                            sortBy === 'price-high'
                                                                ? "bg-primary/10 text-primary border-primary/20"
                                                                : "bg-white text-gray-500 border-gray-200"
                                                        )}
                                                    >
                                                        <ArrowUpDown size={11} /> High → Low
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Distance */}
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                                Distance: {locationRange < 50 ? `Within ${locationRange} km` : 'Any'}
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] text-gray-400 font-bold">0</span>
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={50}
                                                    step={1}
                                                    value={locationRange}
                                                    onChange={(e) => setLocationRange(Number(e.target.value))}
                                                    className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md"
                                                />
                                                <span className="text-[10px] text-gray-400 font-bold">50km</span>
                                            </div>
                                        </div>

                                        {/* Sort */}
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Sort by</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {[
                                                    { key: 'popular' as const, label: 'Popular' },
                                                    { key: 'newest' as const, label: 'Newest' },
                                                    { key: 'trending' as const, label: 'Trending' },
                                                    { key: 'featured' as const, label: 'Featured' },
                                                ].map(({ key, label }) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => setSortBy(key)}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all",
                                                            sortBy === key
                                                                ? "bg-primary/10 text-primary border-primary/20"
                                                                : "bg-white text-gray-500 border-gray-200"
                                                        )}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Reset */}
                                        {(freeOnly || sortBy !== 'popular' || priceFrom || priceTo || locationRange < 50 || selectedCategory || search) && (
                                            <button
                                                onClick={() => {
                                                    setFreeOnly(false);
                                                    setSortBy('popular');
                                                    setPriceFrom('');
                                                    setPriceTo('');
                                                    setLocationRange(50);
                                                    setSelectedCategory(null);
                                                    setSearch('');
                                                }}
                                                className="w-full text-center text-xs font-bold text-primary py-2 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors"
                                            >
                                                Reset all filters
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Location chip */}
                        {location && (
                            <div className="flex items-center gap-2 mb-4">
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

                        {/* Loading */}
                        {isLoading && (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
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
                                {/* Results header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="size-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                                            <Sparkles size={13} />
                                        </span>
                                        <span className="text-xs font-black text-gray-700 uppercase tracking-wider">
                                            {filteredPromotions.length} {filteredPromotions.length === 1 ? 'deal' : 'deals'}
                                        </span>
                                    </div>
                                    {sortBy !== 'popular' && (
                                        <span className="text-[10px] font-bold text-gray-400">
                                            Sorted by {sortBy === 'newest' ? 'newest' : sortBy === 'trending' ? 'trending' : sortBy === 'featured' ? 'featured' : sortBy === 'price-low' ? 'price: low to high' : 'price: high to low'}
                                        </span>
                                    )}
                                </div>

                                {/* Grid */}
                                {filteredPromotions.length > 0 ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
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
                                            onClick={() => {
                                                setSelectedCategory(null);
                                                setSearch('');
                                                setFreeOnly(false);
                                                setSortBy('popular');
                                                setPriceFrom('');
                                                setPriceTo('');
                                                setLocationRange(50);
                                            }}
                                            className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-gradient-to-r from-primary to-blue-500 rounded-full px-5 py-2.5 shadow-md shadow-primary/25 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                                        >
                                            <Sparkles size={12} /> Clear all filters
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
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
