'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Sparkles, SlidersHorizontal, MapPin, X, Loader2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CategoryDropdown from '@/components/promotions/CategoryStep';
import TrendingSection from '@/components/promotions/TrendingSection';
import PromotionCard from '@/components/promotions/PromotionCard';
import LocationModal from '@/components/promotions/LocationModal';
import {
    Promotion,
} from '@/lib/promotions';
import { useCatalogueOffersGlobal } from '@/services/catalogue/hooks';
import { cn } from '@/lib/utils';
import type { GeolocationCoordinates } from '@/lib/geolocation';

function adaptCatalogueOffer(offer: any): Promotion {
    const biz = offer.branch?.business || {};
    const br = offer.branch || {};
    
    const fallbackHours = [
        { day: 'Mon', open: '8:00 AM', close: '10:00 PM', closed: false },
        { day: 'Tue', open: '8:00 AM', close: '10:00 PM', closed: false },
        { day: 'Wed', open: '8:00 AM', close: '10:00 PM', closed: false },
        { day: 'Thu', open: '8:00 AM', close: '10:00 PM', closed: false },
        { day: 'Fri', open: '8:00 AM', close: '11:00 PM', closed: false },
        { day: 'Sat', open: '9:00 AM', close: '11:00 PM', closed: false },
        { day: 'Sun', open: '10:00 AM', close: '6:00 PM', closed: false },
    ];

    const hours = br.businessHours || biz.businessHours || fallbackHours;
    const formattedHours = Array.isArray(hours) 
        ? hours 
        : Object.entries(hours || {}).map(([day, val]: [string, any]) => ({
            day,
            open: val.open || '9:00 AM',
            close: val.close || '6:00 PM',
            closed: val.closed || false
        }));

    return {
        id: offer.id,
        title: offer.name,
        description: offer.description,
        longDescription: offer.longDescription || offer.description,
        image: offer.mainImage || 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80',
        originalPrice: Number(offer.originalPrice || offer.calculatedPrice || 0),
        dealPrice: Number(offer.dealPrice || offer.calculatedPrice || 0),
        discountPercent: offer.discountPercent || 0,
        discountAmount: Math.max(0, Number(offer.originalPrice || 0) - Number(offer.dealPrice || 0)),
        startDate: offer.startDate || new Date().toISOString(),
        endDate: offer.endDate || new Date(Date.now() + 86400000 * 30).toISOString(),
        claimedCount: offer.claimedCount || 0,
        maxClaims: offer.maxClaims || 100,
        isTrending: !!offer.isTrending,
        terms: offer.terms || ['Valid during business hours', 'Subject to availability'],
        business: {
            id: biz.id || br.businessId || 'unknown-biz',
            name: biz.name || br.name || 'Local Business',
            slug: biz.slug || 'local-business',
            logo: biz.logoUrl || br.logoUrl || '',
            photos: biz.photos || [br.logoUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'],
            categoryId: biz.categoryId || 'food-and-hospitality',
            categoryName: biz.categoryName || 'Local Shop',
            address: br.address || biz.address || 'Address not listed',
            hours: formattedHours.length > 0 ? formattedHours : fallbackHours,
            rating: Number(biz.rating || 4.5),
            totalReviews: Number(biz.totalReviews || 12),
        }
    };
}

export default function PromotionsPage() {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
    const [locationLabel, setLocationLabel] = useState('');
    const [showLocationModal, setShowLocationModal] = useState(false);

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

    // Query active promotions from API
    const { data: offersResponse, isLoading } = useCatalogueOffersGlobal({
        search: search.trim() || undefined,
        categoryId: selectedCategory || undefined,
        lat: location?.lat || undefined,
        lng: location?.lng || undefined,
        radius: location ? 10 : undefined,
    });

    const filteredPromotions = useMemo(() => {
        const offers = offersResponse?.data || [];
        return offers.map(adaptCatalogueOffer);
    }, [offersResponse]);

    const trendingPromotions = useMemo(() => {
        return filteredPromotions.filter(p => p.isTrending).slice(0, 5);
    }, [filteredPromotions]);

    return (
        <div className="min-h-screen bg-[#f4f5f6] font-body text-text-main">
            <Navbar />

            {/* Hero Section */}
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 md:px-8 pt-28 pb-10 md:pt-36 md:pb-12">
                    <div className="max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-1.5 bg-primary/5 border border-primary/10 rounded-lg px-3 py-1 mb-5"
                        >
                            <Sparkles size={12} className="text-primary" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                                Explore Deals
                            </span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="text-3xl md:text-5xl font-headline font-black text-gray-900 tracking-tight leading-tight"
                        >
                            Discover the best deals
                            <br />
                            <span className="text-primary">near you</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-gray-500 font-medium text-sm md:text-base mt-3 max-w-lg"
                        >
                            Browse exclusive promotions from top businesses. Check VemTap before you shop.
                        </motion.p>

                        {!location && (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                onClick={() => setShowLocationModal(true)}
                                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                            >
                                <MapPin size={14} />
                                Set your location for nearby deals
                            </motion.button>
                        )}
                    </div>
                </div>
            </section>

            {/* Search + Filters */}
            <section className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search deals, businesses, or location..."
                                className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 transition-all"
                            />
                        </div>

                        {/* Category dropdown */}
                        <div className="w-full sm:w-64">
                            <CategoryDropdown
                                selected={selectedCategory}
                                onSelect={setSelectedCategory}
                            />
                        </div>
                    </div>

                    {location && (
                        <div className="flex items-center gap-2 mt-3">
                            <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-full px-3 py-1.5">
                                <MapPin size={12} className="text-primary" />
                                <span className="text-[10px] font-bold text-primary">
                                    {locationLabel || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                                </span>
                                <button
                                    onClick={handleClearLocation}
                                    className="p-0.5 hover:bg-primary/10 rounded-full transition-colors"
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
                    {/* Trending */}
                    {!selectedCategory && !search && trendingPromotions.length > 0 && (
                        <TrendingSection promotions={trendingPromotions} />
                    )}

                    {/* Results header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={14} className="text-primary" />
                            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                {isLoading ? '...' : filteredPromotions.length} {filteredPromotions.length === 1 ? 'deal' : 'deals'}
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

                    {/* Grid / Loader */}
                    {isLoading ? (
                        <div className="py-24 text-center space-y-4">
                            <Loader2 className="animate-spin text-primary mx-auto" size={32} />
                            <p className="text-gray-400 font-bold text-sm">Searching for best deals near you...</p>
                        </div>
                    ) : filteredPromotions.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {filteredPromotions.map((promo, i) => (
                                <PromotionCard key={promo.id} promotion={promo} index={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-24 text-center space-y-4">
                            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                                <Search size={24} className="text-gray-300" />
                            </div>
                            <p className="text-gray-400 font-bold text-sm">No deals found</p>
                            <p className="text-xs text-gray-300 font-medium">
                                Try a different search or category
                            </p>
                            <button
                                onClick={() => { setSelectedCategory(null); setSearch(''); }}
                                className="text-xs font-black text-primary hover:underline"
                            >
                                Clear all filters
                            </button>
                        </div>
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
