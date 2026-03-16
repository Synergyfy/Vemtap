'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    MapPin,
    Phone,
    Mail,
    Globe,
    Instagram,
    Twitter,
    Facebook,
    ChevronRight,
    Loader2,
    Star,
    ShieldCheck,
    Building2,
    Coffee,
    Tag,
    Clock
} from 'lucide-react';
import { useMyBusiness } from '@/services/businesses/hooks';

export default function BusinessProfilePage() {
    const { slug } = useParams();
    const router = useRouter();
    const { data: business, isLoading } = useMyBusiness();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f3f6fb] flex items-center justify-center">
                <Loader2 className="size-10 text-primary animate-spin" />
            </div>
        );
    }

    const requestedSlug = typeof slug === 'string' ? slug.toLowerCase() : '';
    const businessSlug = (business?.name || '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-');
    const isSlugMismatch = !!requestedSlug && !!businessSlug && requestedSlug !== businessSlug;

    if (!business || isSlugMismatch) {
        return (
            <div className="min-h-screen bg-[#f3f6fb] flex flex-col items-center justify-center p-6 text-center">
                <Building2 size={64} className="text-slate-300 mb-4" />
                <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Business Not Found</h1>
                <p className="text-slate-500 font-bold mb-8">We couldn't find your business profile.</p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="px-8 h-12 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-primary/20"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const businessName = business.name || 'VemTap Business';
    const logoUrl = business.logoUrl;
    const locationText = business.address || [business.city, business.state].filter(Boolean).join(', ') || 'Location not provided';
    const ratingValue = business.showReview ? 4.9 : null;
    const reviewCount = business.showReview ? 1240 : null;
    const rewardsVisible = business.showRewards ?? true;
    const showRewards = business.showRewards ?? true;

    const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

    const formatHours = (day: string) => {
        const hours = business.businessHours?.[day as keyof typeof business.businessHours];
        if (!hours || hours.closed) return 'Closed';
        return `${hours.open} - ${hours.close}`;
    };

    const isOpenNow = () => {
        const now = new Date();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const todayName = dayNames[now.getDay()];
        const hours = business.businessHours?.[todayName as keyof typeof business.businessHours];
        if (!hours || hours.closed) return false;
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        return currentTime >= hours.open && currentTime <= hours.close;
    };

    const weekdayHours = DAYS.slice(0, 5).map((day) => formatHours(day));
    const weekdayLabel = weekdayHours.every((value) => value === weekdayHours[0]) ? weekdayHours[0] : 'Varies';
    const saturdayLabel = formatHours('saturday');
    const sundayLabel = formatHours('sunday');

    const activeRewards = showRewards && business.rewardEnabled
        ? [
            { title: business.rewardMessage || 'Free Coffee', points: '100 points', icon: Coffee, accent: 'bg-amber-50 text-amber-600' },
            { title: '15% Discount', points: '250 points', icon: Tag, accent: 'bg-indigo-50 text-indigo-600' }
        ]
        : [];

    const branches = (business.branches && business.branches.length > 0)
        ? [...business.branches].sort((a, b) => Number(b.isMainBranch) - Number(a.isMainBranch))
        : [{
            id: 'head-office',
            name: 'Head Office',
            address: locationText,
            isMainBranch: true
        }];

    const hasSocialLinks = business.showSocial && (
        business.instagramUrl || business.xUrl || business.facebookUrl
    );

    return (
        <div className="min-h-screen bg-[#f3f6fb] text-slate-900">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
                <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)]">
                    <div className="absolute -left-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
                    <div className="absolute -right-24 top-0 size-72 rounded-full bg-indigo-100/70 blur-3xl" />
                    <div className="relative flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-5">
                            <div className="size-20 sm:size-24 rounded-2xl bg-primary/10 p-1.5 shadow-lg">
                                {logoUrl ? (
                                    <img
                                        src={logoUrl}
                                        alt={businessName}
                                        className="w-full h-full rounded-xl object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-xl bg-white flex items-center justify-center text-primary text-3xl font-black italic">
                                        {businessName.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold tracking-tight capitalize">
                                        {businessName}
                                    </h1>
                                    <ShieldCheck size={18} className="text-emerald-500" />
                                </div>
                                {ratingValue && reviewCount && (
                                    <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-500">
                                        <Star size={14} className="text-amber-500" fill="currentColor" />
                                        <span className="text-slate-800 font-bold">{ratingValue.toFixed(1)}</span>
                                        <span className="text-slate-400">({reviewCount.toLocaleString()} Reviews)</span>
                                    </div>
                                )}
                                <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 font-medium">
                                    <MapPin size={14} className="text-slate-400" />
                                    <span>{locationText}</span>
                                </div>
                                {business.businessHours && (
                                    <div className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-700">
                                        <span className={`size-2 rounded-full ${isOpenNow() ? 'bg-emerald-500' : 'bg-red-400'}`} />
                                        {isOpenNow() ? 'Open Now' : 'Closed'}
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            className="h-12 px-6 rounded-full bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/30 hover:scale-[1.02] transition-transform"
                        >
                            Follow Business
                        </button>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 space-y-6">
                        <section className="rounded-[2.5rem] bg-white p-6 sm:p-8 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)] border border-slate-100">
                            <h2 className="text-lg font-display font-bold mb-4">About Us</h2>
                            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
                                {business.about || 'Welcome to our business. We are dedicated to providing the best experience to our customers through innovation and quality service. Join our loyalty program to earn points on every visit and unlock exclusive rewards.'}
                            </p>
                        </section>

                        {showRewards && rewardsVisible && (
                            <section className="rounded-[2.5rem] bg-white p-6 sm:p-8 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)] border border-slate-100">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-display font-bold">Active Rewards</h2>
                                    <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${business.rewardEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                        {business.rewardEnabled ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                    {activeRewards.length > 0 ? (
                                        activeRewards.map((reward, index) => {
                                            const Icon = reward.icon;
                                            return (
                                                <div key={index} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                                                    <div className={`size-12 rounded-2xl flex items-center justify-center ${reward.accent}`}>
                                                        <Icon size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{reward.title}</p>
                                                        <p className="text-xs text-slate-500">Tap to see details</p>
                                                    </div>
                                                    <div className="ml-auto text-[11px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                                                        {reward.points}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
                                            Rewards are not active yet.
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        <section className="rounded-[2.5rem] bg-white p-6 sm:p-8 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)] border border-slate-100">
                            <h2 className="text-lg font-display font-bold">Locations & Branches</h2>
                            <div className="mt-5 space-y-3">
                                {branches.map((branch) => (
                                    <div
                                        key={branch.id}
                                        className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                                    >
                                        <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                            <Building2 size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-900">{branch.name || 'Business Branch'}</p>
                                            <p className="text-sm text-slate-500">{branch.address || locationText}</p>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-300" />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <section className="rounded-[2.5rem] bg-slate-900 p-6 sm:p-7 text-white shadow-[0_22px_40px_-30px_rgba(15,23,42,0.7)]">
                            <h3 className="text-lg font-display font-bold">Connect with us</h3>
                            <div className="mt-6 space-y-4">
                                {business.whatsappNumber && (
                                    <button
                                        className="w-full flex items-center gap-4 rounded-2xl bg-white/10 p-3 text-left"
                                        onClick={() => window.open(`https://wa.me/${business.whatsappNumber}`, '_blank')}
                                    >
                                        <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center">
                                            <Phone size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-slate-300">Phone</p>
                                            <p className="text-sm font-bold">{business.whatsappNumber}</p>
                                        </div>
                                    </button>
                                )}
                                {business.officialEmail && (
                                    <button
                                        className="w-full flex items-center gap-4 rounded-2xl bg-white/10 p-3 text-left"
                                        onClick={() => window.open(`mailto:${business.officialEmail}`, '_blank')}
                                    >
                                        <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center">
                                            <Mail size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-slate-300">Email</p>
                                            <p className="text-sm font-bold truncate">{business.officialEmail}</p>
                                        </div>
                                    </button>
                                )}
                                {business.website && (
                                    <button
                                        className="w-full flex items-center gap-4 rounded-2xl bg-white/10 p-3 text-left"
                                        onClick={() => {
                                            const website = business.website;
                                            if (website) {
                                                const url = website.startsWith('http') ? website : `https://${website}`;
                                                window.open(url, '_blank');
                                            }
                                        }}
                                    >
                                        <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center">
                                            <Globe size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-slate-300">Website</p>
                                            <p className="text-sm font-bold truncate">{business.website}</p>
                                        </div>
                                    </button>
                                )}
                                {!business.whatsappNumber && !business.officialEmail && !business.website && (
                                    <div className="rounded-2xl bg-white/10 p-4 text-sm text-slate-300">
                                        Contact details are not available yet.
                                    </div>
                                )}
                            </div>

                            {hasSocialLinks && (
                                <div className="mt-6 pt-4 border-t border-white/10">
                                    <div className="flex items-center gap-3">
                                        {business.instagramUrl && (
                                            <button
                                                className="size-10 rounded-full bg-white/10 flex items-center justify-center"
                                                onClick={() => window.open(business.instagramUrl, '_blank')}
                                            >
                                                <Instagram size={18} />
                                            </button>
                                        )}
                                        {business.xUrl && (
                                            <button
                                                className="size-10 rounded-full bg-white/10 flex items-center justify-center"
                                                onClick={() => window.open(business.xUrl, '_blank')}
                                            >
                                                <Twitter size={18} />
                                            </button>
                                        )}
                                        {business.facebookUrl && (
                                            <button
                                                className="size-10 rounded-full bg-white/10 flex items-center justify-center"
                                                onClick={() => window.open(business.facebookUrl, '_blank')}
                                            >
                                                <Facebook size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>

                        <section className="rounded-[2.5rem] bg-white p-6 sm:p-7 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)] border border-slate-100">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-primary" />
                                <h3 className="text-lg font-display font-bold">Business Hours</h3>
                            </div>
                            <div className="mt-5 space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 font-semibold">Mon - Fri</span>
                                    <span className={`font-bold ${weekdayLabel === 'Closed' ? 'text-red-500' : 'text-slate-900'}`}>{weekdayLabel}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 font-semibold">Saturday</span>
                                    <span className={`font-bold ${saturdayLabel === 'Closed' ? 'text-red-500' : 'text-slate-900'}`}>{saturdayLabel}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 font-semibold">Sunday</span>
                                    <span className={`font-bold ${sundayLabel === 'Closed' ? 'text-red-500' : 'text-slate-900'}`}>{sundayLabel}</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
