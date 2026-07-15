'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Crosshair, TrendingUp, Flame, Sparkles } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PromotionCard from '@/components/promotions/PromotionCard';
import { MOCK_PROMOTIONS, PROMOTION_CATEGORIES, getPromoDaysLeft } from '@/lib/mock/promotions';
import { getCategoryIcon } from '@/lib/category-icons';
import { cn } from '@/lib/utils';
import type { PromotionCategory } from '@/lib/mock/promotions';

export default function PromotionsPage() {
    const [selectedLocation, setSelectedLocation] = useState('');
    const [searchLocation, setSearchLocation] = useState('');
    const [showLocationPicker, setShowLocationPicker] = useState(true);
    const [activeCategory, setActiveCategory] = useState<PromotionCategory>('All');
    const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'discount'>('popular');
    const handleSelectLocation = (loc: string) => {
        setSelectedLocation(loc);
        setSearchLocation(loc);
        setShowLocationPicker(false);
    };

    const handleUseCurrentLocation = () => {
        setSelectedLocation('Current Location');
        setShowLocationPicker(false);
    };

    const trendingPromotions = useMemo(() => {
        return [...MOCK_PROMOTIONS]
            .sort((a, b) => b.claimedCount - a.claimedCount)
            .slice(0, 3);
    }, []);

    const popularCategories = useMemo(() => {
        const catMap = new Map<string, number>();
        MOCK_PROMOTIONS.forEach(p => {
            catMap.set(p.category, (catMap.get(p.category) || 0) + p.claimedCount);
        });
        return [...catMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name]) => name);
    }, []);

    const filteredPromotions = useMemo(() => {
        let promos = [...MOCK_PROMOTIONS];

        if (activeCategory !== 'All') {
            promos = promos.filter(p => p.category === activeCategory);
        }

        switch (sortBy) {
            case 'popular':
                promos.sort((a, b) => b.claimedCount - a.claimedCount);
                break;
            case 'discount':
                promos.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
                break;
            case 'newest':
            default:
                promos.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
                break;
        }

        return promos;
    }, [activeCategory, sortBy]);

    return (
        <div className="min-h-screen bg-white font-body text-text-main">
            <Navbar />

            {/* Location-first Landing */}
            {showLocationPicker ? (
                <section className="min-h-screen pt-24 md:pt-28 pb-8 px-4 md:px-8 flex items-start justify-center">
                    <div className="max-w-xl mx-auto text-center space-y-6 w-full">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3"
                        >
                            <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-full px-4 py-1.5">
                                <Sparkles size={14} className="text-primary" />
                                <span className="text-xs font-black text-primary uppercase tracking-widest">
                                    Offers Near You
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-headline font-black text-gray-900 tracking-tight leading-tight">
                                Explore Deals
                                <br />
                                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Near You</span>
                            </h1>
                            <p className="text-gray-500 font-bold text-sm md:text-base max-w-md mx-auto px-4">
                                Find the best promotions, discounts, and offers from businesses around you.
                            </p>
                        </motion.div>

                        {/* Location Search */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="space-y-3 px-4 md:px-0"
                        >
                            <div className="relative max-w-md mx-auto">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchLocation}
                                    onChange={(e) => setSearchLocation(e.target.value)}
                                    placeholder="Search location..."
                                    className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                                />
                            </div>

                            <button
                                onClick={handleUseCurrentLocation}
                                className="w-full max-w-md mx-auto flex items-center justify-center gap-2 h-12 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                            >
                                <Crosshair size={16} />
                                Use My Current Location
                            </button>
                        </motion.div>

                        {/* Popular Categories — data-driven */}
                        {popularCategories.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="space-y-4 pt-2 px-4 md:px-0"
                            >
                                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Popular Categories</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-md mx-auto">
                                    {popularCategories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => {
                                                setActiveCategory(cat as PromotionCategory);
                                                setShowLocationPicker(false);
                                            }}
                                            className="flex flex-col items-center gap-1.5 p-4 bg-gray-50 border border-gray-200 rounded-2xl hover:border-primary/30 hover:bg-primary/5 transition-all group"
                                        >
                                            <span className="text-2xl md:text-3xl">{getCategoryIcon(cat)}</span>
                                            <span className="text-[10px] font-bold text-gray-700 group-hover:text-primary transition-colors leading-tight">{cat}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </section>
            ) : (
                <>
                    {/* Trending Today Section */}
                    <section className="pt-24 md:pt-28 pb-6 px-4 md:px-8">
                        <div className="max-w-6xl mx-auto space-y-6">
                            {/* Header with location */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-primary shrink-0" />
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                            {selectedLocation || 'Near You'}
                                        </span>
                                        <button
                                            onClick={() => setShowLocationPicker(true)}
                                            className="text-[10px] font-black text-primary hover:underline ml-1"
                                        >
                                            Change
                                        </button>
                                    </div>
                                    <h1 className="text-2xl md:text-4xl font-headline font-black text-gray-900 tracking-tight">
                                        {activeCategory !== 'All' ? (
                                          <>{getCategoryIcon(activeCategory)} {activeCategory}s with Offers</>
                                        ) : (
                                          'Explore Deals Near You'
                                        )}
                                    </h1>
                                </div>

                                {/* Sort */}
                                <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-1 py-1 self-start overflow-x-auto">
                                    {[
                                        { value: 'popular' as const, label: 'Popular' },
                                        { value: 'newest' as const, label: 'Newest' },
                                        { value: 'discount' as const, label: 'Biggest Save' },
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setSortBy(opt.value)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all",
                                                sortBy === opt.value
                                                    ? "bg-white text-primary shadow-sm"
                                                    : "text-gray-400 hover:text-gray-600"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Trending Today */}
                            {trendingPromotions.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Flame size={16} className="text-orange-500 shrink-0" />
                                        <span className="text-xs font-black text-gray-800 uppercase tracking-wider">Trending Today</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {trendingPromotions.map((promo, i) => (
                                            <div key={promo.id} className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100 rounded-2xl p-4 flex items-start gap-3">
                                                <div className="size-10 md:size-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-lg md:text-xl shrink-0">
                                                    {getCategoryIcon(promo.category)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-gray-800 line-clamp-1">{promo.businessName}</p>
                                                    <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest mt-0.5">
                                                        {promo.discountPercent ? `${promo.discountPercent}% Off` : promo.discountAmount ? `Save ₦${promo.discountAmount.toLocaleString()}` : ''}
                                                    </p>
                                                    <div className="flex items-center gap-1 mt-1 text-orange-500">
                                                        <Flame size={10} />
                                                        <span className="text-[9px] font-bold">{promo.claimedCount} {promo.claimedCount === 1 ? 'person' : 'people'} claimed this</span>
                                                    </div>
                                                    {getPromoDaysLeft(promo.endDate) <= 1 && (
                                                        <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-0.5">
                                                            Ends {getPromoDaysLeft(promo.endDate) === 0 ? 'Today' : 'Tomorrow'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Category pills */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide md:mx-0 md:px-0">
                                {PROMOTION_CATEGORIES.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all duration-200 shrink-0",
                                            activeCategory === cat
                                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                        )}
                                    >
                                        {cat !== 'All' && <span className="text-sm">{getCategoryIcon(cat)}</span>}
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {/* Results count */}
                            <div className="flex items-center gap-2">
                                <TrendingUp size={14} className="text-primary shrink-0" />
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                    {filteredPromotions.length} {filteredPromotions.length === 1 ? 'deal' : 'deals'} found
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Deals Grid */}
                    <section className="px-4 md:px-8 pb-20">
                        <div className="max-w-6xl mx-auto">
                            {filteredPromotions.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                    {filteredPromotions.map((promo, i) => (
                                        <PromotionCard key={promo.id} promotion={promo} index={i} />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 md:py-24 text-center space-y-4">
                                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                                        <Search size={24} className="text-gray-300" />
                                    </div>
                                    <p className="text-gray-400 font-bold text-sm">No promotions match your category.</p>
                                    <button
                                        onClick={() => setActiveCategory('All')}
                                        className="text-xs font-black text-primary hover:underline"
                                    >
                                        View all deals
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                </>
            )}

            <Footer />
        </div>
    );
}
