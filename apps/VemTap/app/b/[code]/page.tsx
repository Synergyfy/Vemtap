'use client';

import  { useEffect, useMemo, useState } from 'react';
import { normalizeBaseUrl } from '@/lib/api';

type BusinessCategory = {
    id?: string;
    name?: string;
};

type BusinessBranchSummary = {
    id?: string;
    uniqueCode?: string;
    name?: string;
    isActive?: boolean;
    isMainBranch?: boolean;
};

type PublicBusinessResponse = {
    id?: string;
    uniqueCode?: string;
    name?: string;
    officialEmail?: string;
    phone?: string;
    logoUrl?: string;
    address?: string;
    state?: string;
    city?: string;
    status?: string;
    category?: BusinessCategory;
    subcategory?: BusinessCategory;
    branches?: BusinessBranchSummary[];
};

type PublicBranchResponse = {
    id?: string;
    uniqueCode?: string;
    name?: string;
    address?: string;
    phone?: string;
    isActive?: boolean;
    isMainBranch?: boolean;
    businessId?: string;
    business?: {
        id?: string;
        uniqueCode?: string;
        name?: string;
        logoUrl?: string;
    };
};

const BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);

const WARM_GRADIENTS = [
    'from-orange-400 via-rose-400 to-amber-500',
    'from-amber-400 via-orange-400 to-rose-500',
    'from-rose-400 via-orange-300 to-yellow-400',
    'from-amber-300 via-rose-400 to-orange-500',
    'from-orange-500 via-amber-400 to-rose-400',
    'from-yellow-400 via-orange-400 to-rose-500',
    'from-rose-500 via-amber-400 to-orange-400',
];

const hashString = (value: string) => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
};

const displayText = (value?: string | null) => (value && value.trim().length > 0 ? value : 'Not provided');

const formatLocation = (address?: string | null, city?: string | null, state?: string | null) => {
    const parts = [address, city, state].filter((part) => part && String(part).trim().length > 0);
    return parts.length > 0 ? parts.join(', ') : 'Not provided';
};

async function fetchPublicBranch(code: string): Promise<PublicBranchResponse | null> {
    try {
        const response = await fetch(`${BASE_URL}/public/branches/code/${encodeURIComponent(code)}`, {
            cache: 'no-store',
        });
        if (!response.ok) return null;
        return response.json();
    } catch {
        return null;
    }
}

async function fetchPublicBusiness(code: string): Promise<PublicBusinessResponse | null> {
    try {
        const response = await fetch(`${BASE_URL}/public/businesses/code/${encodeURIComponent(code)}`, {
            cache: 'no-store',
        });
        if (!response.ok) return null;
        return response.json();
    } catch {
        return null;
    }
}

export default function PublicBusinessProfilePage({ params }: { params: { code: string } }) {
    const [business, setBusiness] = useState<PublicBusinessResponse | null>(null);
    const [branch, setBranch] = useState<PublicBranchResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setIsLoading(true);
            const branchData = await fetchPublicBranch(params.code);
            if (!isMounted) return;

            if (branchData) {
                setBranch(branchData);
                if (branchData.isMainBranch && branchData.business?.uniqueCode) {
                    const businessData = await fetchPublicBusiness(branchData.business.uniqueCode);
                    if (!isMounted) return;
                    setBusiness(businessData);
                }
            } else {
                const businessData = await fetchPublicBusiness(params.code);
                if (!isMounted) return;
                setBusiness(businessData);
            }

            setIsLoading(false);
        };

        load();
        return () => {
            isMounted = false;
        };
    }, [params.code]);

    const profileName = useMemo(() => {
        if (branch && !branch.isMainBranch) return branch.name || branch.business?.name || 'Business';
        return business?.name || branch?.business?.name || branch?.name || 'Business';
    }, [branch, business]);

    const profileLogo = business?.logoUrl || branch?.business?.logoUrl || '';
    const categoryLabel = useMemo(() => {
        const category = business?.category?.name;
        const subcategory = business?.subcategory?.name;
        if (category && subcategory) return `${category} • ${subcategory}`;
        if (category) return category;
        if (subcategory) return subcategory;
        return 'Not provided';
    }, [business]);

    const locationLabel = formatLocation(
        business?.address || branch?.address,
        business?.city,
        business?.state
    );

    const contactEmail = displayText(business?.officialEmail);
    const contactPhone = displayText(business?.phone || branch?.phone);

    const branches = business?.branches || (branch ? [branch] : []);

    const gradientClass = useMemo(() => {
        const seed = business?.uniqueCode || branch?.uniqueCode || params.code || 'default';
        const idx = hashString(seed) % WARM_GRADIENTS.length;
        return WARM_GRADIENTS[idx] || WARM_GRADIENTS[0];
    }, [business?.uniqueCode, branch?.uniqueCode, params.code]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-primary text-2xl font-black">EC</span>
                        <h1 className="font-bold text-xl tracking-tight">EntryConnect</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2 rounded-full hover:bg-slate-100 transition-colors" type="button">
                            <span className="text-sm font-semibold">Share</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-grow">
                <div className={`relative w-full h-64 md:h-80 bg-gradient-to-br ${gradientClass}`}>
                    <div className="absolute inset-0 bg-black/10" />
                </div>

                <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10 pb-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                        <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
                            <div className="size-32 md:size-40 rounded-full border-4 border-white bg-white overflow-hidden shadow-xl flex items-center justify-center">
                                {profileLogo ? (
                                    <img
                                        alt={`${profileName} logo`}
                                        className="w-full h-full object-cover"
                                        src={profileLogo}
                                    />
                                ) : (
                                    <span className="text-3xl font-black text-slate-300">
                                        {profileName?.slice(0, 2).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="mb-2">
                                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                                    {isLoading ? 'Loading...' : profileName}
                                </h2>
                                <p className="text-slate-600 font-medium">{categoryLabel}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex-1 md:flex-none px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25" type="button">
                                Follow
                            </button>
                            <button className="px-4 py-3 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all" type="button">
                                Message
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8">
                            <section className="bg-white p-8 shadow-sm border border-slate-100 rounded-2xl">
                                <h3 className="text-2xl font-bold mb-4 text-slate-900">About Us</h3>
                                <p className="text-slate-600 leading-relaxed text-lg">
                                    {displayText('')}
                                </p>
                                <p className="text-slate-600 mt-4 leading-relaxed">
                                    {displayText('')}
                                </p>
                            </section>

                            <section className="bg-white p-8 shadow-sm border border-slate-100 rounded-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-bold text-slate-900">Active Rewards</h3>
                                    <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        Loyalty Program
                                    </span>
                                </div>
                                <div className="p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5">
                                    <p className="font-bold text-slate-900">Information not provided</p>
                                    <p className="text-xs text-slate-500">Rewards will appear here once configured.</p>
                                </div>
                            </section>

                            <section className="bg-white p-8 shadow-sm border border-slate-100 rounded-2xl">
                                <h3 className="text-2xl font-bold mb-6 text-slate-900">Locations &amp; Branches</h3>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                            <span className="text-primary text-xs font-black">LOC</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">Primary Location</p>
                                            <p className="text-slate-500">{locationLabel}</p>
                                        </div>
                                    </div>

                                    {branches.map((item) => {
                                        const branchAddress = 'address' in item ? (item as { address?: string }).address : '';
                                        return (
                                            <div key={item.uniqueCode || item.id} className="flex gap-4">
                                                <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                                    <span className="text-primary text-xs font-black">BR</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">
                                                        {displayText(item.name)}
                                                        {item.isMainBranch ? ' (Main Branch)' : ''}
                                                    </p>
                                                    <p className="text-slate-500">{displayText(branchAddress)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>

                        <div className="space-y-8">
                            <section className="bg-white p-8 shadow-sm border border-slate-100 rounded-2xl">
                                <h3 className="text-xl font-bold mb-6 text-slate-900">Connect</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                                        <span className="text-primary text-xs font-black">WEB</span>
                                        <span className="text-slate-600">Not provided</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                                        <span className="text-primary text-xs font-black">MAIL</span>
                                        <span className="text-slate-600">{contactEmail}</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                                        <span className="text-primary text-xs font-black">PHONE</span>
                                        <span className="text-slate-600">{contactPhone}</span>
                                    </div>
                                </div>
                                <div className="mt-8 pt-8 border-t border-slate-100">
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Follow Us</p>
                                    <div className="flex gap-4">
                                        {['FB', 'X', 'IG'].map((label) => (
                                            <div
                                                key={label}
                                                className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-black"
                                            >
                                                {label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <section className="bg-primary p-8 shadow-sm text-white overflow-hidden relative rounded-2xl">
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold mb-2">Subscribe</h3>
                                    <p className="text-white/80 text-sm mb-6">Get the latest updates delivered weekly to your inbox.</p>
                                    <div className="flex flex-col gap-2">
                                        <input
                                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/30 focus:outline-none"
                                            placeholder="Email address"
                                            type="email"
                                        />
                                        <button className="w-full bg-white text-primary font-bold py-2 rounded-lg hover:bg-opacity-90 transition-colors" type="button">
                                            Sign Up
                                        </button>
                                    </div>
                                </div>
                                <span className="absolute -right-4 -bottom-4 text-8xl text-white/10">LA</span>
                            </section>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-white border-t border-slate-200 py-12">
                <div className="max-w-5xl mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-6 opacity-60">
                        <span className="text-primary text-2xl font-black">EC</span>
                        <h1 className="font-bold text-lg tracking-tight">EntryConnect</h1>
                    </div>
                    <p className="text-slate-500 text-sm">© 2024 EntryConnect. All rights reserved.</p>
                    <div className="flex justify-center gap-6 mt-6">
                        <a className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-primary transition-colors" href="#">
                            Privacy Policy
                        </a>
                        <a className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-primary transition-colors" href="#">
                            Terms of Service
                        </a>
                        <a className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-primary transition-colors" href="#">
                            Help Center
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
