'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, BadgeCheck, Clock } from 'lucide-react';
import { MockPromotion, formatPromoPrice, getPromoDaysLeft } from '@/lib/mock/promotions';

interface PromotionCardProps {
    promotion: MockPromotion;
    index: number;
}

function DaysLeftLabel({ daysLeft }: { daysLeft: number }) {
    if (daysLeft <= 0) {
        return <span className="text-primary font-black">Last day</span>;
    }
    if (daysLeft === 1) {
        return <span className="text-primary font-black">1 day left</span>;
    }
    return <span className="text-primary font-black">{daysLeft} days left</span>;
}

function StarRating() {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={10} className="fill-amber-400 text-amber-400" />
            ))}
        </div>
    );
}

export default function PromotionCard({ promotion, index }: PromotionCardProps) {
    const daysLeft = getPromoDaysLeft(promotion.endDate);
    const isStarSeller = promotion.claimedCount >= 5;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
        >
            <Link href={`/promotions/${promotion.id}`} className="block group">
                <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                        {promotion.image ? (
                            <img
                                src={promotion.image}
                                alt={promotion.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                                <span className="text-3xl font-headline font-bold text-gray-200">
                                    {promotion.name.charAt(0)}
                                </span>
                            </div>
                        )}

                        {/* Deal badge — top left */}
                        {(promotion.discountPercent || promotion.discountAmount) && (
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                                <span className="inline-flex items-center gap-1 bg-primary text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm">
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                                    Deal
                                </span>
                            </div>
                        )}

                        {/* Cart button — bottom right on image */}
                        <div className="absolute bottom-2.5 right-2.5">
                            <div className="size-8 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                                <ShoppingCart size={13} className="text-gray-500 group-hover:text-white transition-colors" />
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 space-y-2">
                        {/* Title */}
                        <h3 className="font-semibold text-gray-800 text-[13px] leading-snug line-clamp-2 min-h-[2.5rem]">
                            {promotion.name}
                        </h3>

                        {/* Price row */}
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-[15px] font-black text-primary tracking-tight">
                                {formatPromoPrice(promotion.dealPrice)}
                            </span>
                            {promotion.originalPrice > promotion.dealPrice && (
                                <span className="text-[11px] text-gray-400 line-through font-medium">
                                    {formatPromoPrice(promotion.originalPrice)}
                                </span>
                            )}
                        </div>

                        {/* "Last day X days left" label */}
                        {(promotion.endDate || daysLeft >= 0) && (
                            <div className="flex items-center gap-1">
                                <Clock size={10} className="text-primary/60" />
                                <span className="text-[10px] font-bold">
                                    <DaysLeftLabel daysLeft={daysLeft} />
                                </span>
                            </div>
                        )}

                        {/* Ratings + sold */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <StarRating />
                            {promotion.claimedCount > 0 && (
                                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-0.5">
                                    <span className="text-orange-400">🔥</span>
                                    {promotion.claimedCount >= 1000
                                        ? `${(promotion.claimedCount / 1000).toFixed(0)}K+`
                                        : `${promotion.claimedCount}+`}{' '}
                                    claimed
                                </span>
                            )}
                        </div>

                        {/* Star seller badge */}
                        {isStarSeller && (
                            <div className="flex items-center gap-1 pt-0.5">
                                <BadgeCheck size={12} className="text-primary fill-primary/10" />
                                <span className="text-[10px] font-bold text-primary">Star seller</span>
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
