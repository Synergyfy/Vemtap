'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, Sparkles, TrendingUp, MapPin } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PromotionCard from '@/components/promotions/PromotionCard';
import { MOCK_PROMOTIONS, PROMOTION_CATEGORIES, PromotionCategory } from '@/lib/mock/promotions';
import { cn } from '@/lib/utils';

export default function PromotionsPage() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<PromotionCategory>('All');
    const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'discount'>('newest');

    const filteredPromotions = useMemo(() => {
        let promos = [...MOCK_PROMOTIONS];

        if (activeCategory !== 'All') {
            promos = promos.filter(p => p.category === activeCategory);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            promos = promos.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.businessName.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q)
            );
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
    }, [search, activeCategory, sortBy]);

    return (
        <div className="min-h-screen bg-white font-body text-text-main">
            <Navbar />

            {/* Hero */}
            <section className="pt-28 pb-12 md:pt-36 md:pb-16 px-4 md:px-8">
                <div className="max-w-6xl mx-auto text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-full px-4 py-1.5"
                    >
                        <Sparkles size={14} className="text-primary" />
                        <span className="text-xs font-black text-primary uppercase tracking-widest">
                            {MOCK_PROMOTIONS.length} Active Deals
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-headline font-black text-gray-900 tracking-tight leading-tight"
                    >
                        Discover <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Amazing Deals</span>
                        <br />Near You
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-500 font-bold text-base md:text-lg max-w-xl mx-auto"
                    >
                        Browse exclusive promotions from top businesses in your area. Save big on food, fashion, electronics, and more.
                    </motion.p>

                    {/* Search bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="relative">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search deals, businesses, or categories..."
                                className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Filters + Grid */}
            <section className="px-4 md:px-8 pb-20">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Category pills + sort */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            {PROMOTION_CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all duration-200",
                                        activeCategory === cat
                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-1 py-1">
                                {[
                                    { value: 'newest' as const, label: 'Newest' },
                                    { value: 'popular' as const, label: 'Popular' },
                                    { value: 'discount' as const, label: 'Biggest Save' },
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setSortBy(opt.value)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
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
                    </div>

                    {/* Results count */}
                    <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-primary" />
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            {filteredPromotions.length} {filteredPromotions.length === 1 ? 'deal' : 'deals'} found
                        </span>
                    </div>

                    {/* Grid */}
                    {filteredPromotions.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPromotions.map((promo, i) => (
                                <PromotionCard key={promo.id} promotion={promo} index={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-24 text-center space-y-4">
                            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                                <Search size={32} className="text-gray-300" />
                            </div>
                            <p className="text-gray-400 font-bold text-sm">No promotions match your search.</p>
                            <button
                                onClick={() => { setSearch(''); setActiveCategory('All'); }}
                                className="text-xs font-black text-primary hover:underline"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}

                    {/* Location hint */}
                    <div className="flex items-center justify-center gap-2 text-gray-400 pt-8">
                        <MapPin size={14} />
                        <span className="text-xs font-bold">
                            Showing promotions available in Lagos, Nigeria
                        </span>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
