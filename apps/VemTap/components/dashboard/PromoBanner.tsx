'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight, Gift, Megaphone, Sparkles, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type PromoBannerVariant = 'promo' | 'announcement' | 'campaign' | 'notice';

export interface PromoBannerData {
    id?: string;
    title: string;
    description?: string;
    image?: string;
    ctaText?: string;
    actionUrl?: string;
    onAction?: () => void;
    badge?: string;
    variant?: PromoBannerVariant;
    gradient?: string;
}

interface PromoBannerVariantStyle {
    gradient: string;
    icon: LucideIcon;
    text: string;
    badge: string;
    artwork: string;
    cta: string;
    description: string;
    ring: string;
}

const variantStyles: Record<PromoBannerVariant, PromoBannerVariantStyle> = {
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

interface PromoBannerProps {
    data: PromoBannerData;
    className?: string;
}

export default function PromoBanner({ data, className }: PromoBannerProps) {
    const { title, description, image, ctaText, actionUrl, onAction, badge, variant = 'promo', gradient } = data;
    const style = variantStyles[variant];
    const Icon = style.icon;
    const bg = gradient || style.gradient;

    const content = (
        <>
            <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-12 left-1/3 w-40 h-40 bg-black/10 rounded-full blur-2xl" />

            <div className="relative z-10 flex items-center justify-between gap-4 md:gap-6">
                <div className="min-w-0 flex-1">
                    {badge && (
                        <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full border text-[8px] md:text-[9px] font-black uppercase tracking-widest', style.badge)}>
                            {badge}
                        </span>
                    )}
                    <h3 className={cn('mt-2 text-lg md:text-2xl font-bold leading-tight tracking-tight', style.text)}>
                        {title}
                    </h3>
                    {description && (
                        <p className={cn('mt-1 text-[11px] md:text-[13px] font-medium leading-snug truncate', style.description)}>
                            {description}
                        </p>
                    )}
                    {ctaText && (
                        <span className={cn('inline-flex items-center gap-1.5 mt-3 md:mt-4 px-3 md:px-4 py-2 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-md', style.cta)}>
                            {ctaText}
                            <ArrowRight size={13} className="md:w-[14px] md:h-[14px]" />
                        </span>
                    )}
                </div>

                {image ? (
                    <div className="shrink-0 w-14 h-14 md:w-24 md:h-24 rounded-2xl md:rounded-3xl overflow-hidden ring-1 ring-white/20 shadow-lg bg-white/10">
                        <img src={image} alt="" aria-hidden="true" className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className={cn('shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-2xl border flex items-center justify-center shadow-inner', style.artwork)}>
                        <Icon size={22} className="md:w-7 md:h-7" />
                    </div>
                )}
            </div>
        </>
    );

    const baseClasses = cn(
        'group relative w-full overflow-hidden rounded-2xl md:rounded-3xl p-4 md:p-6 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
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