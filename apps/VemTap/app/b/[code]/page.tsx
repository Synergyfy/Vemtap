'use client';

import { useEffect, useMemo, useState, use } from 'react'; // Added use
import { normalizeBaseUrl } from '@/lib/api';
import {
    MapPin,
    Phone,
    Globe,
    Mail, // Added missing Mail import
} from 'lucide-react';

type BusinessCategory = { id?: string; name?: string };
type BusinessBranchSummary = {
    id?: string;
    uniqueCode?: string;
    name?: string;
    isActive?: boolean;
    isMainBranch?: boolean;
    address?: string;
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
    about?: string;
    welcomeMessage?: string;
    website?: string;
    instagramUrl?: string;
    facebookUrl?: string;
    xUrl?: string;
    linkedinUrl?: string;
    tiktokUrl?: string;
    youtubeUrl?: string;
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
    business?: { id?: string; uniqueCode?: string; name?: string; logoUrl?: string };
};

const BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);
const WARM_GRADIENTS = [
    'from-orange-400 via-rose-400 to-primary',
    'from-amber-400 via-orange-400 to-primary-dark',
    'from-rose-400 via-orange-300 to-primary-light',
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
    return parts.length > 0 ? parts.join(', ') : 'Location not provided';
};

async function fetchPublicBranch(code: string): Promise<PublicBranchResponse | null> {
    try {
        const response = await fetch(`${BASE_URL}/public/branches/code/${encodeURIComponent(code)}`, { cache: 'no-store' });
        return response.ok ? response.json() : null;
    } catch {
        return null;
    }
}

async function fetchPublicBusiness(code: string): Promise<PublicBusinessResponse | null> {
    try {
        const response = await fetch(`${BASE_URL}/public/businesses/code/${encodeURIComponent(code)}`, { cache: 'no-store' });
        return response.ok ? response.json() : null;
    } catch {
        return null;
    }
}

export default function PublicBusinessProfilePage({ params }: { params: Promise<{ code: string }> }) {
    // Unwrap the params promise using React.use()
    const unwrappedParams = use(params);
    const code = unwrappedParams.code;

    const [business, setBusiness] = useState<PublicBusinessResponse | null>(null);
    const [branch, setBranch] = useState<PublicBranchResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setIsLoading(true);
            const branchData = await fetchPublicBranch(code);
            if (!isMounted) return;

            if (branchData) {
                setBranch(branchData);
                if (branchData.isMainBranch && branchData.business?.uniqueCode) {
                    const businessData = await fetchPublicBusiness(branchData.business.uniqueCode);
                    if (isMounted) setBusiness(businessData);
                }
            } else {
                const businessData = await fetchPublicBusiness(code);
                if (isMounted) setBusiness(businessData);
            }
            setIsLoading(false);
        };
        load();
        return () => {
            isMounted = false;
        };
    }, [code]); // Dependency updated to code

    const profileName = useMemo(() => {
        if (branch && !branch.isMainBranch) return branch.name || branch.business?.name || 'Business';
        return business?.name || branch?.business?.name || branch?.name || 'Business';
    }, [branch, business]);

    const profileLogo = business?.logoUrl || branch?.business?.logoUrl || '';

    const categoryLabel = useMemo(() => {
        const cat = business?.category?.name;
        const sub = business?.subcategory?.name;
        return cat && sub ? `${cat} • ${sub}` : cat || sub || 'General Business';
    }, [business]);

    const gradientClass = useMemo(() => {
        const seed = business?.uniqueCode || branch?.uniqueCode || code || 'default';
        return WARM_GRADIENTS[hashString(seed) % WARM_GRADIENTS.length];
    }, [business?.uniqueCode, branch?.uniqueCode, code]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center font-display text-primary animate-pulse">
                <span className="text-xl font-bold uppercase tracking-tighter">Vemtap</span>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light font-body text-slate-900 antialiased">
            
            <main className="flex-grow">
                <div className={`relative w-full h-64 md:h-80 bg-gradient-to-br ${gradientClass}`}>
                    <div className="absolute inset-0 bg-black/10" />
                </div>

                <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10 pb-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                        <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
                            <div className="size-32 md:size-40 rounded-full border-4 border-white bg-white overflow-hidden shadow-xl flex items-center justify-center">
                                {profileLogo ? (
                                    <img alt={`${profileName} logo`} className="w-full h-full object-cover" src={profileLogo} />
                                ) : (
                                    <span className="text-4xl font-black text-slate-300">{profileName.slice(0, 2).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="mb-2">
                                <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900">{profileName}</h2>
                                <p className="text-slate-600 font-medium">{categoryLabel}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex-1 md:flex-none px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25">
                                Follow
                            </button>
                            <button className="px-4 py-3 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">
                                Message
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8">
                            <section className="asymmetric-card bg-white p-8 shadow-sm border border-slate-100">
                                <h3 className="font-display text-2xl font-bold mb-4 text-slate-900">About Us</h3>
                                <p className="text-slate-600 leading-relaxed text-lg">
                                    {displayText(business?.about)}
                                </p>
                                <p className="text-slate-600 mt-4 leading-relaxed">
                                    {displayText(business?.welcomeMessage)}
                                </p>
                            </section>

                            <section className="asymmetric-card bg-white p-8 shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-display text-2xl font-bold text-slate-900">Active Rewards</h3>
                                    <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        Loyalty Program
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 flex items-center gap-4">
                                        <div className="size-12 rounded-lg bg-primary flex items-center justify-center text-white shrink-0">
                                            <span className="text-sm font-black">%</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">Not available</p>
                                            <p className="text-xs text-slate-500">No reward data</p>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl border-2 border-dashed border-orange-200 bg-orange-50 flex items-center gap-4">
                                        <div className="size-12 rounded-lg bg-orange-500 flex items-center justify-center text-white shrink-0">
                                            <span className="text-sm font-black">★</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">Not available</p>
                                            <p className="text-xs text-slate-500">No reward data</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="asymmetric-card bg-white p-8 shadow-sm border border-slate-100">
                                <h3 className="font-display text-2xl font-bold mb-6 text-slate-900">Locations & Branches</h3>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                            <MapPin className="text-primary" size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">Main Headquarters</p>
                                            <p className="text-slate-500">
                                                {formatLocation(business?.address || branch?.address, business?.city, business?.state)}
                                            </p>
                                        </div>
                                    </div>
                                    {(business?.branches || [])
                                        .filter((item) => !item.isMainBranch)
                                        .map((item) => (
                                            <div key={item.id} className="flex gap-4">
                                                <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                                    <MapPin className="text-primary" size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{displayText(item.name)}</p>
                                                    <p className="text-slate-500">{displayText(item.address)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    <div className="w-full h-48 rounded-xl overflow-hidden mt-4 grayscale opacity-80 contrast-125 bg-slate-100 flex items-center justify-center">
                                        <span className="text-sm font-semibold text-slate-400">Map not available</span>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="space-y-8">
                            <section className="asymmetric-card bg-white p-8 shadow-sm border border-slate-100">
                                <h3 className="font-display text-xl font-bold mb-6 text-slate-900">Connect</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                                        <Globe className="text-primary" size={18} />
                                        <span className="text-slate-600 group-hover:text-primary transition-colors">
                                            {displayText(business?.website)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                                        <Mail className="text-primary" size={18} />
                                        <span className="text-slate-600 group-hover:text-primary transition-colors">
                                            {displayText(business?.officialEmail)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                                        <Phone className="text-primary" size={18} />
                                        <span className="text-slate-600 group-hover:text-primary transition-colors">
                                            {displayText(business?.phone || branch?.phone)}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-8 pt-8 border-t border-slate-100">
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Follow Us</p>
                                    <div className="flex gap-4">
                                        {business?.facebookUrl || business?.instagramUrl || business?.xUrl || business?.linkedinUrl || business?.tiktokUrl || business?.youtubeUrl ? (
                                            <>
                                                {business?.facebookUrl && (
                                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary cursor-pointer hover:bg-primary hover:text-white transition-all">
                                                        F
                                                    </div>
                                                )}
                                                {business?.xUrl && (
                                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary cursor-pointer hover:bg-primary hover:text-white transition-all">
                                                        X
                                                    </div>
                                                )}
                                                {business?.instagramUrl && (
                                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary cursor-pointer hover:bg-primary hover:text-white transition-all">
                                                        IG
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-sm text-slate-400 font-semibold">Not available</div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="asymmetric-card bg-primary p-8 shadow-sm text-white overflow-hidden relative">
                                <div className="relative z-10">
                                    <h3 className="font-display text-xl font-bold mb-2">Subscribe</h3>
                                    <p className="text-white/80 text-sm mb-6">Get the latest updates delivered weekly to your inbox.</p>
                                    <div className="flex flex-col gap-2">
                                        <input
                                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/30 focus:outline-none"
                                            placeholder="Email address"
                                            type="email"
                                        />
                                        <button className="w-full bg-white text-primary font-bold py-2 rounded-lg hover:bg-opacity-90 transition-colors">
                                            Sign Up
                                        </button>
                                    </div>
                                </div>
                                <span className="absolute -right-4 -bottom-4 text-9xl text-white/10">✦</span>
                            </section>
                        </div>
                    </div>
                </div>
            </main>

        </div>
    );
}