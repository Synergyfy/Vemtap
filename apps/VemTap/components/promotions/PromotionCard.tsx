'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, BadgeCheck, Zap, Tag, Store } from 'lucide-react';
import { MockPromotion, formatPromoPrice, getPromoDaysLeft } from '@/lib/mock/promotions';

interface PromotionCardProps {
    promotion: MockPromotion;
    index: number;
    /** Optional analytics/rotation hook fired when the customer opens the deal. */
    onOpenDeal?: (id: string) => void;
}

function compactCount(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return String(n);
}

function DaysLeftLabel({ daysLeft }: { daysLeft: number }) {
    if (daysLeft === -1) return <span>No end date</span>;
    if (daysLeft <= 0) return <span>Last day</span>;
    if (daysLeft === 1) return <span>1 day left</span>;
    return <span>{daysLeft} days left</span>;
}

export default function PromotionCard({ promotion, index, onOpenDeal }: PromotionCardProps) {
    const daysLeft = getPromoDaysLeft(promotion.endDate);
    const isFree = promotion.dealPrice === 0;
    const hasDiscount = (promotion.discountPercent ?? 0) > 0;
    const isStarSeller = promotion.claimedCount >= 5;
    const claimPct = promotion.maxClaims > 0
        ? Math.min(Math.round((promotion.claimedCount / promotion.maxClaims) * 100), 100)
        : 0;
    const flashHot = claimPct >= 70 && promotion.claimedCount > 10;

    const discountLabel = promotion.discountPercent
        ? `-${promotion.discountPercent}%`
        : promotion.discountAmount
            ? `-${formatPromoPrice(promotion.discountAmount)}`
            : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4) }}
            className="h-[340px]"
        >
            <Link
                href={`/promotions/${promotion.id}`}
                className="block h-full group"
                onClick={() => onOpenDeal?.(promotion.id)}
            >
                <div className="relative h-full flex flex-col bg-white rounded-[1.15rem] overflow-hidden ring-1 ring-black/[0.04] shadow-[0_1px_3px_rgba(15,23,42,0.06)] hover:shadow-[0_24px_48px_-16px_rgba(15,23,42,0.22)] hover:-translate-y-1 hover:ring-black/[0.07] transition-all duration-300">

                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-100 to-blue-50">
                        {promotion.image ? (
                            <img
                                src={promotion.image}
                                alt={promotion.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Store size={36} className="text-[#066CF4]/30" />
                            </div>
                        )}

                        {/* Discount badge */}
                        {discountLabel && (
                            <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-lg bg-red-600 text-white px-2 py-1 shadow-md leading-none">
                                <Tag size={10} />
                                <span className="text-[11px] font-black tracking-tight">
                                    {discountLabel}
                                    {hasDiscount ? ' OFF' : ''}
                                </span>
                            </div>
                        )}

                        {/* Flash chip when nearly gone */}
                        {flashHot && (
                            <div className="absolute top-2 right-2 rounded-full bg-black/35 backdrop-blur-sm text-white px-2 py-1 text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1 shadow-sm">
                                <Zap size={10} className="text-amber-300 fill-amber-300" />
                                Only {compactCount(promotion.maxClaims - promotion.claimedCount)} left
                            </div>
                        )}

                        {/* Bottom gradient + claim meter */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent px-2.5 pt-9 pb-2">
                            <div className="w-full h-1.5 bg-white/25 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-300 to-orange-400 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.max(claimPct, 3)}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-[9px] font-black text-white drop-shadow">
                                    🔥 {compactCount(promotion.claimedCount)} claimed
                                </span>
                                {promotion.maxClaims > 0 && (
                                    <span className="text-[9px] font-black text-white/90 drop-shadow">
                                        {claimPct}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-2.5 space-y-1.5 flex-1 flex flex-col">
                        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400 truncate">
                            {promotion.businessName}
                        </p>

                        <h3 className="font-semibold text-slate-800 text-[13px] leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
                            {promotion.name}
                        </h3>

                        {/* Price row */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[17px] font-black text-[#066CF4] tracking-tight">
                                {isFree ? 'FREE' : formatPromoPrice(promotion.dealPrice)}
                            </span>
                            {promotion.originalPrice > promotion.dealPrice && (
                                <span className="text-[11px] text-slate-400 line-through font-semibold">
                                    {formatPromoPrice(promotion.originalPrice)}
                                </span>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="mt-auto pt-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <span
                                    className={
                                        daysLeft <= 3
                                            ? 'inline-flex items-center gap-1 text-[10px] font-black text-orange-600'
                                            : 'inline-flex items-center gap-1 text-[10px] font-bold text-slate-400'
                                    }
                                >
                                    <Clock size={10} className={daysLeft <= 3 ? 'text-orange-500' : ''} />
                                    <DaysLeftLabel daysLeft={daysLeft} />
                                </span>
                                {isStarSeller && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-primary">
                                        <BadgeCheck size={12} className="text-primary fill-primary/10" />
                                        Star seller
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}