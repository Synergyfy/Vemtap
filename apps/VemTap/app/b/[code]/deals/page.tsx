'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePublicBusiness, usePublicBranch } from '@/services/public/hooks';
import { formatNaira } from '@/components/home/mappers';

const formatLocation = (address?: string | null, city?: string | null, state?: string | null) => {
    const parts = [address, city, state].filter((part) => part && String(part).trim().length > 0);
    return parts.length > 0 ? parts.join(', ') : 'Location not provided';
};

function getOfferBadge(offer: any): { label: string; bg: string } | null {
    const pct = offer?.discountPercent ||
        (offer?.calculatedPrice && offer?.fixedPrice
            ? Math.round((1 - Number(offer.calculatedPrice) / Number(offer.fixedPrice)) * 100)
            : null);
    if (pct && pct >= 40) return { label: `${pct}% OFF`, bg: '#ffdad6' };
    if (pct && pct >= 20) return { label: `${pct}% OFF`, bg: '#ffdad6' };
    if (offer?.discountLabel === 'FREE') return { label: 'FREE', bg: '#d1fae5' };
    if (offer?.discountLabel) return { label: offer.discountLabel, bg: '#066cf4' };
    if (pct) return { label: `${pct}% OFF`, bg: '#ffdad6' };
    return { label: 'DEAL', bg: '#066cf4' };
}

function formatCountdown(endDate?: string): string | null {
    if (!endDate) return null;
    const end = new Date(endDate).getTime();
    if (Number.isNaN(end)) return null;
    const diff = end - Date.now();
    if (diff <= 0) return 'Ended';
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Ending soon';
    if (hours < 24) return `Ends in ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Ends tomorrow';
    if (days < 7) return `Ends in ${days}d`;
    return 'Today';
}

const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=600&h=400&fit=crop',
];

export default function BusinessDealsPage() {
    const params = useParams();
    const router = useRouter();
    const code = Array.isArray(params?.code) ? params.code[0] : params?.code || '';

    const { data: branchData, isLoading: branchLoading } = usePublicBranch(code, !!code);
    const { data: businessByCode, isLoading: businessByCodeLoading } = usePublicBusiness(code, !!code);

    const rawBranchData = (branchData as any)?.data || branchData;
    const rawBusinessByCode = (businessByCode as any)?.data || businessByCode;

    const branchBusinessCode = rawBranchData?.business?.uniqueCode;
    const { data: businessByBranch } = usePublicBusiness(
        branchBusinessCode || '',
        !!branchBusinessCode && branchBusinessCode !== code
    );

    const rawBusinessByBranch = (businessByBranch as any)?.data || businessByBranch;
    const business = rawBusinessByCode?.id ? rawBusinessByCode : rawBusinessByBranch;
    const branch = rawBusinessByCode?.id ? null : rawBranchData || null;
    const businessSummary = rawBranchData?.business;
    const branches = useMemo(() => business?.branches || [], [business?.branches]);
    const mainBranch = useMemo(() => branches.find((item: any) => item.isMainBranch) || branches[0] || null, [branches]);
    const resolvedBranch = branch || mainBranch;
    const branchId = resolvedBranch?.id;

    const profileName = useMemo(() => {
        return business?.name || businessSummary?.name || branch?.business?.name || branch?.name || 'Business';
    }, [branch, business, businessSummary]);

    const { data: offersData, isLoading: offersLoading } = useQuery<any[]>({
        queryKey: ['public', 'offers', branchId],
        queryFn: async () => {
            if (!branchId) return [];
            const res = await api.get(`/catalogue/offers/public/${branchId}`);
            const items = Array.isArray(res) ? res : (res as any)?.data || [];
            const now = new Date();
            return items.filter((offer: any) => {
                if (offer.endDate) {
                    const end = new Date(offer.endDate);
                    if (end < now) return false;
                }
                return true;
            });
        },
        enabled: !!branchId,
    });

    const offers = offersData || [];
    const isLoading = branchLoading || businessByCodeLoading || offersLoading;

    const activeOffers = useMemo(() => offers.slice(0, 10), [offers]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#f7f9fb' }}>
                <div className="w-12 h-12 rounded-full border-[3px] border-[#c2c6d7] border-t-[#0055c4] animate-spin" />
                <span className="mt-4 text-xs font-bold text-[#727786] uppercase tracking-[0.25em] animate-pulse">
                    Loading deals...
                </span>
            </div>
        );
    }

    const STORE_NAV_ITEMS = [
        { icon: 'storefront', label: 'Overview', href: `/b/${code}` },
        { icon: 'local_offer', label: 'Deals', href: `/b/${code}/deals` },
        { icon: 'schedule', label: 'Hours', href: `/b/${code}/hours` },
        { icon: 'home_repair_service', label: 'Services', href: `/b/${code}/services` },
        { icon: 'inventory_2', label: 'Products', href: `/b/${code}/products` },
    ];

    return (
        <div className="min-h-screen" style={{ background: '#f7f9fb', color: '#191c1e', fontFamily: 'Inter, sans-serif' }}>
            {/* Desktop Header */}
            <header className="hidden md:flex fixed top-0 w-full z-50 flex-col" style={{ background: '#ffffff', borderBottom: '1px solid #e6e8ea' }}>
                <div className="flex items-center justify-between px-6 h-[60px] max-w-[1200px] mx-auto w-full">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: '#0055c4' }}>
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <Link href="/" className="flex items-center gap-2"><img src="/VEMTAP_PNG.png" alt="VemTap" className="h-8 w-auto" /></Link>
                        <div className="h-6 w-px bg-gray-200" />
                        <span className="text-[15px] font-bold text-gray-900">{profileName}</span>
                    </div>
                </div>
                <div className="border-t border-gray-100">
                    <nav className="max-w-[1200px] mx-auto px-6 flex items-center gap-1 h-[44px] overflow-x-auto no-scrollbar">
                        {STORE_NAV_ITEMS.map((item) => {
                            const isActive = item.href.includes('/deals');
                            return (
                                <Link key={item.label} href={item.href}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all ${isActive ? 'bg-[#0055c4]/10 text-[#0055c4]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </header>

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 w-full z-50 flex items-center justify-between" style={{ background: '#f7f9fb', borderBottom: '1px solid #c2c6d7', padding: '0 20px', height: 56 }}>
                <button onClick={() => router.back()} className="flex items-center justify-center w-8 h-8 rounded-full active:scale-95" style={{ color: '#0055c4' }}>
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-[20px] font-bold truncate mx-4" style={{ color: '#0055c4' }}>Business Profile</h1>
                <div className="w-8" />
            </header>

            {/* Main Content */}
            <main className="md:pt-[104px]" style={{ paddingTop: 56, paddingBottom: 80 }}>
                <div className="max-w-[1200px] mx-auto md:px-6">
                    {/* Header Info */}
                    <section className="text-center py-6 px-5 md:text-left md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-100 md:p-6 md:mt-4">
                        <h2 className="text-[24px] md:text-[28px] font-semibold tracking-tight mb-1" style={{ color: '#191c1e' }}>Active Deals</h2>
                        <p className="text-[14px]" style={{ color: '#424655' }}>{profileName}</p>
                    </section>

                    {/* Deals Grid */}
                    <section className="px-5 md:px-0 grid grid-cols-1 md:grid-cols-3 gap-4 md:mt-6">
                    {activeOffers.length > 0 ? (
                        activeOffers.map((offer: any, idx: number) => {
                            const badge = getOfferBadge(offer);
                            const dealPrice = offer?.calculatedPrice != null ? Number(offer.calculatedPrice) : null;
                            const originalPrice = offer?.fixedPrice != null ? Number(offer.fixedPrice) : null;
                            const image = offer?.mainImage || offer?.galleryImages?.[0] || offer?.image || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];

                            return (
                                <article
                                    key={offer.id || idx}
                                    className="rounded-xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform"
                                    style={{ background: '#ffffff', border: '1px solid #c2c6d7' }}
                                >
                                    <div className="w-full h-48 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />
                                    <div className="p-4 flex flex-col gap-2">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-[20px] font-semibold line-clamp-2 pr-2" style={{ color: '#191c1e' }}>
                                                {offer.title || offer.name || 'Deal'}
                                            </h3>
                                            {badge && (
                                                <span
                                                    className="text-[12px] font-medium px-2 py-1 rounded-full whitespace-nowrap"
                                                    style={{ background: badge.bg, color: badge.bg === '#ffdad6' ? '#93000a' : badge.bg === '#d1fae5' ? '#065f46' : '#fcfaff' }}
                                                >
                                                    {badge.label}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-end gap-2">
                                            {dealPrice != null && (
                                                <span className="text-[20px] font-bold" style={{ color: '#0055c4' }}>
                                                    {dealPrice === 0 ? 'Free' : formatNaira(dealPrice)}
                                                </span>
                                            )}
                                            {originalPrice != null && dealPrice != null && originalPrice > dealPrice && (
                                                <span className="text-[14px] line-through" style={{ color: '#727786' }}>
                                                    {formatNaira(originalPrice)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center pt-2" style={{ borderTop: '1px solid #e6e8ea', color: '#424655' }}>
                                            <span className="material-symbols-outlined mr-1" style={{ fontSize: 16 }}>schedule</span>
                                            <span className="text-[12px] font-medium">
                                                {formatCountdown(offer.endDate) || 'Limited Time'}
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-16 text-center">
                            <span className="material-symbols-outlined text-[48px] mb-3 block" style={{ color: '#c2c6d7' }}>local_offer</span>
                            <p className="text-[14px] font-semibold" style={{ color: '#191c1e' }}>No active deals</p>
                            <p className="text-[13px] mt-1" style={{ color: '#727786' }}>Check back later for new offers.</p>
                        </div>
                    )}
                </section>
                </div>
            </main>
        </div>
    );
}
