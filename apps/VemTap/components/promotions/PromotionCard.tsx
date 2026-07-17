'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, ArrowRight } from 'lucide-react';
import { formatPromoPrice, formatPromoDate, getPromoDaysLeft } from '@/lib/mock/promotions';
import type { Promotion } from '@/lib/promotions';
import { cn } from '@/lib/utils';

interface PromotionCardProps {
    promotion: Promotion;
    index: number;
}

const CATEGORY_COLORS: Record<string, string> = {
    'Food & Drinks': 'bg-orange-500',
    'Fashion': 'bg-pink-500',
    'Electronics': 'bg-blue-500',
    'Health & Beauty': 'bg-purple-500',
    'Services': 'bg-emerald-500',
};

export default function PromotionCard({ promotion, index }: PromotionCardProps) {
    const daysLeft = getPromoDaysLeft(promotion.endDate);
    const claimPercent = Math.round((promotion.claimedCount / promotion.maxClaims) * 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
        >
            <Link href={`/promotions/${promotion.id}`} className="block group">
                <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                            src={promotion.image}
                            alt={promotion.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Discount badge */}
                        {promotion.discountPercent && (
                            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-black tracking-wide shadow-lg">
                                {promotion.discountPercent}% OFF
                            </div>
                        )}
                        {promotion.discountAmount && !promotion.discountPercent && (
                            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-black tracking-wide shadow-lg">
                                SAVE {formatPromoPrice(promotion.discountAmount)}
                            </div>
                        )}

                        {/* Ends Today badge */}
                        {daysLeft === 0 && (
                            <div className="absolute top-3 right-3 bg-orange-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
                                Ends Today
                            </div>
                        )}

                        {/* Days left */}
                        {daysLeft <= 7 && daysLeft > 0 && (
                            <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold">
                                <Clock size={10} />
                                {daysLeft}d left
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                        {/* Business name */}
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                            {promotion.business.name}
                        </p>

                        {/* Title */}
                        <h3 className="font-headline font-bold text-gray-900 text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                            {promotion.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
                            {promotion.description}
                        </p>

                        {/* Price */}
                        <div className="flex items-baseline gap-2 pt-1">
                            <span className="text-lg font-black text-primary font-display tracking-tight">
                                {formatPromoPrice(promotion.dealPrice)}
                            </span>
                            {promotion.originalPrice > promotion.dealPrice && (
                                <span className="text-xs text-gray-400 line-through font-bold">
                                    {formatPromoPrice(promotion.originalPrice)}
                                </span>
                            )}
                        </div>

                        {/* Footer with location */}
                        <div className="flex items-center gap-1 text-gray-400 pt-2 border-t border-gray-50">
                            <MapPin size={10} />
                            <span className="text-[10px] font-bold truncate max-w-[100px]">{promotion.business.address}</span>
                        </div>

                        {/* Trending / Social proof */}
                        <div className="flex items-center gap-1">
                            <Users size={10} className="text-primary" />
                            <span className="text-[10px] font-bold text-primary">
                                {promotion.claimedCount} {promotion.claimedCount === 1 ? 'person' : 'people'} claimed this
                            </span>
                        </div>

                        {/* Claim progress bar */}
                        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(claimPercent, 100)}%` }}
                            />
                        </div>

                        {/* CTA */}
                        <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-gray-400 font-bold">
                                {formatPromoDate(promotion.startDate)} — {formatPromoDate(promotion.endDate)}
                            </span>
                            <span className="flex items-center gap-1 text-xs font-black text-primary group-hover:gap-2 transition-all">
                                View Offer <ArrowRight size={12} />
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
