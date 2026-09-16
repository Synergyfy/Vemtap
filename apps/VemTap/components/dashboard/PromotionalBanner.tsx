'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight, Gift, Megaphone, Sparkles, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type PromotionalBannerVariant = 'promo' | 'announcement' | 'campaign' | 'notice';

export interface PromotionalBannerData {
    id?: string;
    title: string;
    description?: string;
    image?: string;
    ctaText?: string;
    actionUrl?: string;
    onAction?: () => void;
    badge?: string;
    variant?: PromotionalBannerVariant;
    gradient?: string;
    isActive?: boolean;
    startAt?: string | Date;
    endAt?: string | Date;
}

export function isPromotionalBannerActive(data: PromotionalBannerData, now: Date = new Date()): boolean {
    if (data.isActive === false) return false;
    if (data.startAt) {
        const start = new Date(data.startAt).getTime();
        if (!Number.isNaN(start) && now.getTime() < start) return false;
    }
    if (data.endAt) {
        const end = new Date(data.endAt).getTime();
        if (!Number.isNaN(end) && now.getTime() > end) return false;
    }
    return true;
}

interface PromotionalBannerVariantStyle {
    gradient: string;
    icon: LucideIcon;
    text: string;
    badge: string;
    artwork: string;
    cta: string;
    description: string;
    ring: string;
}

const variantStyles: Record<PromotionalBannerVariant, PromotionalBannerVariantStyle> = {
    promo: {
        gradient: 'bg-gradient-to-br from-primary via-blue-600 to-indigo-700',
        icon: Sparkles,
        text: 'text-white',
        badge: 'bg-white/20 text-white border-white/15',
        artwork: 'bg-white/15 text-white border-white/20',
        cta: 'bg-white text-primary',
        description: 'text-white/80',
        ring: 'focus-visible:ring-white',
    },
    announcement: {
        gradient: 'bg-gradient-to-br from-slate-800 via-slate-900 to-black',
        icon: Megaphone,
        text: 'text-white',
        badge: 'bg-white/15 text-white border-white/10',
        artwork: 'bg-white/10 text-white border-white/15',
        cta: 'bg-white text-slate-900',
        description: 'text-white/70',
        ring: 'focus-visible:ring-white',
    },
    campaign: {
        gradient: 'bg-gradient-to-br from-rose-600 via-pink-600 to-orange-500',
        icon: Zap,
        text: 'text-white',
        badge: 'bg-white/20 text-white border-white/15',
        artwork: 'bg-white/15 text-white border-white/20',
        cta: 'bg-white text-rose-600',
        description: 'text-white/80',
        ring: 'focus-visible:ring-white',
    },
    notice: {
        gradient: 'bg-white border border-gray-200',
        icon: Gift,
        text: 'text-gray-900',
        badge: 'bg-primary/10 text-primary border-primary/10',
        artwork: 'bg-primary/10 text-primary border-primary/10',
        cta: 'bg-primary text-white',
        description: 'text-gray-500',
        ring: 'focus-visible:ring-primary',
    },
};

interface PromotionalBannerProps {
    data: PromotionalBannerData;
    className?: string;
}

export default function PromotionalBanner({ data, className }: PromotionalBannerProps) {
    const { title, description, image, ctaText, actionUrl, onAction, badge, variant = 'promo', gradient } = data;
    const style = variantStyles[variant];
    const Icon = style.icon;
    const bg = gradient || style.gradient;

    if (!isPromotionalBannerActive(data)) return null;

    const content = (
        <>
            <div aria-hidden="true" className="pointer-events-none absolute -top-12 -right-10 w-36 h-36 bg-white/10 rounded-full blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-10 left-1/3 w-32 h-32 bg-black/10 rounded-full blur-2xl" />

            <div className="relative z-10 flex items-center gap-2.5 md:gap-4">
                <div className="min-w-0 flex-1">
                    {badge && (
                        <span className={cn('inline-flex items-center px-1.5 py-px md:px-2 md:py-0.5 rounded-full border text-[7px] md:text-[8px] font-black uppercase tracking-widest', style.badge)}>
                            {badge}
                        </span>
                    )}
                    <h3 className={cn('mt-1 text-[13px] md:text-base font-bold leading-tight tracking-tight truncate', style.text)}>
                        {title}
                    </h3>
                    {description && (
                        <p className={cn('mt-0.5 md:mt-1 text-[10px] md:text-xs font-medium leading-snug line-clamp-1 md:line-clamp-2', style.description)}>
                            {description}
                        </p>
                    )}
                    {ctaText && (
                        <span className={cn('inline-flex items-center gap-1 mt-1.5 md:mt-2 px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl font-black text-[8px] md:text-[9px] uppercase tracking-widest shadow-md', style.cta)}>
                            {ctaText}
                            <ArrowRight size={10} className="md:h-[11px] md:w-[11px]" />
                        </span>
                    )}
                </div>

                {image ? (
                    <div className="shrink-0 w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl overflow-hidden ring-1 ring-white/20 shadow-lg bg-white/10">
                        <img src={image} alt="" aria-hidden="true" className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className={cn('shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-xl border flex items-center justify-center shadow-inner', style.artwork)}>
                        <Icon size={16} className="md:w-[18px] md:h-[18px]" />
                    </div>
                )}
            </div>
        </>
    );

    const baseClasses = cn(
        'group relative w-full overflow-hidden rounded-xl md:rounded-2xl p-2.5 md:p-3 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        bg,
        style.ring,
        className
    );

    if (actionUrl) {
        const isExternal = /^https?:\/\//i.test(actionUrl);
        return (
            <Link
                href={actionUrl}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className={cn(baseClasses, 'hover:shadow-lg active:scale-[0.99]')}
            >
                {content}
            </Link>
        );
    }

    if (onAction) {
        return (
            <button type="button" onClick={onAction} className={cn(baseClasses, 'text-left hover:shadow-lg active:scale-[0.99]')}>
                {content}
            </button>
        );
    }

    return <div className={baseClasses}>{content}</div>;
}