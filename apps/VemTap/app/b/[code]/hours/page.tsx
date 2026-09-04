'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePublicBusiness, usePublicBranch } from '@/services/public/hooks';
import { normalizeDayHours } from '@/lib/businessHours';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatHours(dayHours: any): string {
    if (!dayHours || dayHours.isClosed) return 'Closed';
    return `${dayHours.from} – ${dayHours.to}`;
}

export default function BusinessHoursPage() {
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

    const profileName = useMemo(() => {
        return business?.name || businessSummary?.name || branch?.business?.name || branch?.name || 'Business';
    }, [branch, business, businessSummary]);

    const profileLogo = useMemo(() => {
        return business?.logoUrl || businessSummary?.logoUrl || resolvedBranch?.logoUrl || '';
    }, [business, businessSummary, resolvedBranch?.logoUrl]);

    const profileCover = useMemo(() => {
        const branchAny = resolvedBranch as any;
        const businessAny = business as any;
        return branchAny?.coverImage || businessAny?.coverImage || businessAny?.photos?.[0] || branchAny?.photos?.[0] || '';
    }, [business, resolvedBranch]);

    const profileHours = resolvedBranch?.businessHours || business?.openingHours;

    const todayIndex = new Date().getDay();
    const todayName = DAY_NAMES[todayIndex];

    const isOpenNow = useMemo(() => {
        if (!profileHours) return null;
        const todayHours = normalizeDayHours((profileHours as any)?.[todayName]);
        if (!todayHours || todayHours.isClosed) return false;
        const now = new Date();
        const [openH, openM] = todayHours.from.split(':').map(Number);
        const [closeH, closeM] = todayHours.to.split(':').map(Number);
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const openMinutes = (openH || 0) * 60 + (openM || 0);
        const closeMinutes = (closeH || 0) * 60 + (closeM || 0);
        if (isNaN(openMinutes) || isNaN(closeMinutes)) return true;
        return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    }, [profileHours, todayName]);

    const todayHours = useMemo(() => {
        if (!profileHours) return null;
        return normalizeDayHours((profileHours as any)?.[todayName]);
    }, [profileHours, todayName]);

    const isLoading = branchLoading || businessByCodeLoading;

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#f7f9fb' }}>
                <div className="w-12 h-12 rounded-full border-[3px] border-[#c2c6d7] border-t-[#0055c4] animate-spin" />
                <span className="mt-4 text-xs font-bold text-[#727786] uppercase tracking-[0.25em] animate-pulse">
                    Loading hours...
                </span>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: '#f7f9fb', color: '#191c1e', fontFamily: 'Inter, sans-serif' }}>
            {/* TopAppBar */}
            <header
                className="fixed top-0 w-full z-50 flex items-center justify-between"
                style={{ background: '#f7f9fb', borderBottom: '1px solid #c2c6d7', padding: '0 20px', height: 56 }}
            >
                <button onClick={() => router.back()} className="flex items-center justify-center w-8 h-8 rounded-full active:scale-95" style={{ color: '#0055c4' }}>
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-[20px] font-bold truncate mx-4" style={{ color: '#0055c4' }}>Business Profile</h1>
                <div className="w-8" />
            </header>

            {/* Main Content */}
            <main style={{ paddingTop: 56, paddingBottom: 80 }} className="max-w-3xl mx-auto px-5">
                {/* Header Section */}
                <section className="text-center py-6 mb-4">
                    {profileLogo ? (
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 mx-auto mb-3 shadow-sm" style={{ borderColor: '#066cf4' }}>
                            <img src={profileLogo} alt={profileName} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-24 h-24 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: '#eceef0', border: '2px solid #066cf4' }}>
                            <span className="material-symbols-outlined text-[40px]" style={{ color: '#727786' }}>storefront</span>
                        </div>
                    )}
                    <h2 className="text-[24px] font-semibold tracking-tight mb-2" style={{ color: '#191c1e' }}>Opening Hours</h2>

                    {/* Status */}
                    <div className="flex items-center justify-center gap-2" style={{ color: '#0055c4' }}>
                        {isOpenNow !== null && (
                            <>
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#0055c4' }} />
                                    <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: '#0055c4' }} />
                                </span>
                                <span className="text-[14px] font-semibold">
                                    {isOpenNow ? 'Open Now' : 'Closed'}
                                </span>
                                {todayHours && !todayHours.isClosed && (
                                    <span style={{ color: '#424655' }} className="text-[14px]">
                                        • Today: {todayHours.from} – {todayHours.to}
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                </section>

                {/* Image Banner */}
                {profileCover && (
                    <div className="w-full h-48 rounded-xl overflow-hidden mb-6 relative shadow-sm">
                        <img src={profileCover} alt={profileName} className="w-full h-full object-cover" />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
                    </div>
                )}

                {/* Hours List */}
                <section className="rounded-xl overflow-hidden shadow-sm mb-6" style={{ background: '#ffffff', border: '1px solid #c2c6d7' }}>
                    <ul>
                        {DAY_NAMES.map((day, idx) => {
                            const dayHours = profileHours ? normalizeDayHours((profileHours as any)?.[day]) : null;
                            const isToday = day === todayName;

                            return (
                                <li
                                    key={day}
                                    className="flex items-center justify-between transition-colors"
                                    style={{
                                        padding: '16px',
                                        borderBottom: idx < 6 ? '1px solid #e6e8ea' : 'none',
                                        borderLeft: isToday ? '4px solid #0055c4' : '4px solid transparent',
                                        background: isToday ? 'rgba(6, 108, 244, 0.05)' : 'transparent',
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="text-[16px]"
                                            style={{
                                                color: isToday ? '#0055c4' : '#191c1e',
                                                fontWeight: isToday ? 600 : 400,
                                            }}
                                        >
                                            {DAY_LABELS[idx]}
                                        </span>
                                        {isToday && (
                                            <span
                                                className="text-[12px] font-medium px-2 py-0.5 rounded-full"
                                                style={{ background: '#0055c4', color: '#ffffff' }}
                                            >
                                                Today
                                            </span>
                                        )}
                                    </div>
                                    <span
                                        className="text-[14px] font-semibold"
                                        style={{ color: isToday ? '#0055c4' : '#424655' }}
                                    >
                                        {formatHours(dayHours)}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            </main>
        </div>
    );
}
