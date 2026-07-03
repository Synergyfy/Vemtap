'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame, Users, Clock, ChevronRight } from 'lucide-react';
import { Promotion, formatDealPrice, getUrgencyText, getClaimPercent } from '@/lib/promotions';

interface TrendingSectionProps {
    promotions: Promotion[];
}

export default function TrendingSection({ promotions }: TrendingSectionProps) {
    if (promotions.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Flame size={18} className="text-orange-500" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">
                        Trending Today
                    </h3>
                </div>
                <span className="text-[10px] font-bold text-gray-400">
                    {promotions.length} hot {promotions.length === 1 ? 'deal' : 'deals'}
                </span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {promotions.map((promo, i) => {
                    const urgency = getUrgencyText(promo.endDate);
                    const claimPct = getClaimPercent(promo);

                    return (
                        <motion.div
                            key={promo.id}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Link
                                href={`/deals/${promo.business.slug}/${promo.id}`}
                                className="block w-[260px] md:w-[300px] bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all group shrink-0"
                            >
                                <div className="relative h-32 overflow-hidden">
                                    <img
                                        src={promo.image}
                                        alt={promo.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-orange-500 text-white px-2 py-0.5 rounded-md text-[10px] font-black">
                                        <Flame size={10} /> HOT
                                    </div>
                                    {promo.discountPercent && (
                                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded-md text-[10px] font-black">
                                            {promo.discountPercent}% OFF
                                        </div>
                                    )}
                                </div>

                                <div className="p-3 space-y-2">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-wider">
                                        {promo.business.name}
                                    </p>
                                    <h4 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                                        {promo.title}
                                    </h4>
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                                            <Users size={10} />
                                            {promo.claimedCount} claimed
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500">
                                            <Clock size={10} />
                                            {urgency}
                                        </span>
                                    </div>
                                    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full"
                                            style={{ width: `${Math.min(claimPct, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-xs font-black text-primary">
                                            {promo.dealPrice === 0 ? 'FREE' : formatDealPrice(promo.dealPrice)}
                                        </span>
                                        <span className="flex items-center gap-0.5 text-[10px] font-black text-primary group-hover:gap-1.5 transition-all">
                                            View Deal <ChevronRight size={10} />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
