'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Users } from 'lucide-react';
import { MockPromotion, formatPromoPrice, getPromoDaysLeft } from '@/lib/mock/promotions';
import { cn } from '@/lib/utils';

interface PromotionCardProps {
    promotion: MockPromotion;
    index: number;
}

export default function PromotionCard({ promotion, index }: PromotionCardProps) {
    const daysLeft = getPromoDaysLeft(promotion.endDate);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.06 }}
        >
            <Link href={`/promotions/${promotion.id}`} className="block group">
                <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg border border-gray-100 hover:border-gray-200 transition-all duration-300">
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                        <img
                            src={promotion.image}
                            alt={promotion.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Deal badge */}
                        {(promotion.discountPercent || promotion.discountAmount) && (
                            <div className="absolute top-3 left-3 bg-orange-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
                                Deal
                            </div>
                        )}

                        {/* Ends soon badge */}
                        {daysLeft <= 2 && daysLeft >= 0 && (
                            <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm">
                                {daysLeft === 0 ? 'Ends today' : `${daysLeft}d left`}
                            </div>
                        )}

                        {/* Floating action button */}
                        <div className="absolute bottom-3 right-3 size-9 bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                            <ArrowRight size={16} className="text-gray-900" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-3.5 space-y-1.5">
                        {/* Business name */}
                        <p className="text-[10px] font-semibold text-gray-400 truncate">
                            {promotion.businessName}
                        </p>

                        {/* Title */}
                        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                            {promotion.name}
                        </h3>

                        {/* Price */}
                        <div className="flex items-baseline gap-2 pt-0.5">
                            <span className="text-base font-black text-gray-900 tracking-tight">
                                {formatPromoPrice(promotion.dealPrice)}
                            </span>
                            {promotion.originalPrice > promotion.dealPrice && (
                                <span className="text-[11px] text-gray-400 line-through font-medium">
                                    {formatPromoPrice(promotion.originalPrice)}
                                </span>
                            )}
                        </div>

                        {/* Claimed count */}
                        {promotion.claimedCount > 0 && (
                            <div className="flex items-center gap-1 pt-0.5">
                                <Users size={10} className="text-gray-400" />
                                <span className="text-[10px] font-medium text-gray-400">
                                    {promotion.claimedCount} claimed
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
