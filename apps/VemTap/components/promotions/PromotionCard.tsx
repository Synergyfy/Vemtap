'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, Flame, Star, Zap } from 'lucide-react';
import { Promotion, formatDealPrice, getUrgencyText, getClaimPercent } from '@/lib/promotions';
import { cn } from '@/lib/utils';

interface PromotionCardProps {
    promotion: Promotion;
    index: number;
}

export default function PromotionCard({ promotion, index }: PromotionCardProps) {
    const urgency = getUrgencyText(promotion.endDate);
    const claimPct = getClaimPercent(promotion);
    const isUrgent = urgency.includes('today') || urgency.includes('tomorrow');

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
        >
            <Link href={`/deals/${promotion.business.slug}/${promotion.id}`} className="block group">
                <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5">
                    {/* Image */}
                    <div className="relative h-44 overflow-hidden bg-gray-50">
                        <img
                            src={promotion.image}
                            alt={promotion.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                        {/* Badge row */}
                        <div className="absolute top-3 left-3 flex gap-2">
                            {promotion.discountPercent && (
                                <span className="bg-red-500 text-white px-2.5 py-0.5 rounded-md text-[10px] font-black shadow-lg">
                                    -{promotion.discountPercent}%
                                </span>
                            )}
                            {promotion.discountAmount && !promotion.discountPercent && promotion.discountAmount > 0 && (
                                <span className="bg-red-500 text-white px-2.5 py-0.5 rounded-md text-[10px] font-black shadow-lg">
                                    -{formatDealPrice(promotion.discountAmount)}
                                </span>
                            )}
                            {promotion.isTrending && (
                                <span className="bg-orange-500 text-white px-2.5 py-0.5 rounded-md text-[10px] font-black shadow-lg flex items-center gap-1">
                                    <Flame size={10} /> Trending
                                </span>
                            )}
                        </div>

                        {/* Price */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                            <div>
                                <p className="text-2xl font-black text-white font-display tracking-tight drop-shadow-lg">
                                    {promotion.dealPrice === 0 ? 'FREE' : formatDealPrice(promotion.dealPrice)}
                                </p>
                                {promotion.originalPrice > promotion.dealPrice && (
                                    <p className="text-xs text-white/70 line-through font-bold drop-shadow">
                                        {formatDealPrice(promotion.originalPrice)}
                                    </p>
                                )}
                            </div>
                            {isUrgent && (
                                <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
                                    <Clock size={10} /> {urgency}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2.5">
                        {/* Business name + rating */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="size-6 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Zap size={10} className="text-gray-400" />
                                </div>
                                <span className="text-[11px] font-bold text-gray-600">
                                    {promotion.business.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                <span className="text-[11px] font-bold text-gray-500">{promotion.business.rating}</span>
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="font-headline font-bold text-gray-900 text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                            {promotion.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
                            {promotion.description}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <span className="text-[11px] font-bold">{promotion.claimedCount} claimed</span>
                                <span className="text-[10px]">·</span>
                                <span className="text-[11px] font-bold">{claimPct}%</span>
                            </div>
                            <span className="flex items-center gap-1 text-xs font-black text-primary group-hover:gap-2 transition-all">
                                View Deal <ArrowRight size={12} />
                            </span>
                        </div>

                        {/* Progress */}
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(claimPct, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
