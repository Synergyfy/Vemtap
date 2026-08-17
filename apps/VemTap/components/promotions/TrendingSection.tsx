'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame, Clock, ChevronRight, Zap } from 'lucide-react';
import { Promotion, formatDealPrice, getUrgencyText, getClaimPercent } from '@/lib/promotions';

interface TrendingSectionProps {
    promotions: Promotion[];
}

export default function TrendingSection({ promotions }: TrendingSectionProps) {
    if (promotions.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="size-7 rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25">
                        <Flame size={14} />
                    </span>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
                        Trending Today
                    </h3>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-100 rounded-full px-2 py-0.5">
                        <Zap size={9} className="fill-orange-500 text-orange-500" /> Flash
                    </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
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
                            transition={{ delay: Math.min(i * 0.08, 0.4) }}
                            className="shrink-0"
                        >
                            <Link
                                href={`/deals/${promo.business.slug}/${promo.id}`}
                                className="block w-[260px] md:w-[300px] bg-white rounded-2xl overflow-hidden ring-1 ring-black/[0.04] shadow-[0_1px_3px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_40px_-14px_rgba(15,23,42,0.2)] hover:-translate-y-1 hover:ring-orange-200 transition-all duration-300 group"
                            >
                                <div className="relative h-32 overflow-hidden">
                                    <img
                                        src={promo.image}
                                        alt={promo.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                                    <div className="absolute top-2 left-2 -rotate-3 flex items-center gap-1 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-2 py-1 rounded-md text-[10px] font-black shadow-md shadow-orange-500/30">
                                        <Flame size={10} /> HOT
                                    </div>
                                    {promo.discountPercent && (
                                        <div className="absolute top-2 right-2 rounded-lg bg-white/95 text-rose-500 px-2 py-1 text-[11px] font-black shadow-sm">
                                            -{promo.discountPercent}%
                                        </div>
                                    )}
                                    <div className="absolute bottom-2 left-2 right-2">
                                        <div className="w-full h-1 bg-white/25 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-amber-300 to-orange-400 rounded-full"
                                                style={{ width: `${Math.max(Math.min(claimPct, 100), 3)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 space-y-1.5">
                                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.12em] truncate">
                                        {promo.business.name}
                                    </p>
                                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">
                                        {promo.title}
                                    </h4>
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                            🔥 {promo.claimedCount} claimed
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] font-black text-orange-500">
                                            <Clock size={10} />
                                            {urgency}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                                        <span className="text-base font-black text-slate-900">
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