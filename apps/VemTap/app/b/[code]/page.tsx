'use client';

import Script from 'next/script';
import { useEffect, useMemo, useRef, useState, use } from 'react'; // Added use
import { normalizeBaseUrl } from '@/lib/api';
import {
    MapPin,
    Phone,
    Globe,
    Mail, // Added missing Mail import
    MessageCircle,
    Facebook,
    Instagram,
    Linkedin,
    Twitter,
    Youtube,
    Music2,
    Gift,
} from 'lucide-react';

type BusinessCategory = { id?: string; name?: string };
type BusinessHours = { open: string; close: string; closed: boolean };
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
    whatsappNumber?: string;
    logoUrl?: string;
    address?: string;
    state?: string;
    city?: string;
    businessHours?: Record<string, BusinessHours>;
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
    state?: string;
    city?: string;
    phone?: string;
    logoUrl?: string;
    website?: string;
    whatsappNumber?: string;
    officialEmail?: string;
    about?: string;
    welcomeMessage?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    xUrl?: string;
    linkedinUrl?: string;
    tiktokUrl?: string;
    youtubeUrl?: string;
    businessHours?: Record<string, BusinessHours>;
    isActive?: boolean;
    isMainBranch?: boolean;
    businessId?: string;
    business?: { id?: string; uniqueCode?: string; name?: string; logoUrl?: string };
};

type PublicReward = {
    id?: string;
    name?: string;
    description?: string;
    rewardType?: string;
    pointCost?: number;
    value?: number;
    validityDays?: number;
    imageUrl?: string;
    isActive?: boolean;
};

const BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);

const displayText = (value?: string | null) => (value && value.trim().length > 0 ? value : 'Not provided');

const formatLocation = (address?: string | null, city?: string | null, state?: string | null) => {
    const parts = [address, city, state].filter((part) => part && String(part).trim().length > 0);
    return parts.length > 0 ? parts.join(', ') : 'Location not provided';
};

const formatHours = (hours?: BusinessHours) => {
    if (!hours || hours.closed) return 'Closed';
    return `${hours.open} - ${hours.close}`;
};

const formatExternalUrl = (value?: string) => {
    if (!value) return '';
    return value.startsWith('http') ? value : `https://${value}`;
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
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

async function fetchPublicRewards(businessId?: string): Promise<PublicReward[]> {
    if (!businessId) return [];
    try {
        const response = await fetch(`${BASE_URL}/loyalty/rewards?businessId=${encodeURIComponent(businessId)}`, {
            cache: 'no-store',
        });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
    } catch {
        return [];
    }
}

export default function PublicBusinessProfilePage({ params }: { params: Promise<{ code: string }> }) {
    // Unwrap the params promise using React.use()
    const unwrappedParams = use(params);
    const code = unwrappedParams.code;

    const [business, setBusiness] = useState<PublicBusinessResponse | null>(null);
    const [branch, setBranch] = useState<PublicBranchResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [logoFailed, setLogoFailed] = useState(false);
    const [logoLoaded, setLogoLoaded] = useState(false);
    const [rewards, setRewards] = useState<PublicReward[]>([]);
    const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(null);
    const [leafletReady, setLeafletReady] = useState(false);
    const mapRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

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

    useEffect(() => {
        let isMounted = true;
        const businessId = business?.id || branch?.businessId || branch?.business?.id;
        const loadRewards = async () => {
            const rewardData = await fetchPublicRewards(businessId);
            if (isMounted) setRewards(rewardData.filter((item) => item?.isActive !== false));
        };
        loadRewards();
        return () => {
            isMounted = false;
        };
    }, [business?.id, branch?.businessId, branch?.business?.id]);

    useEffect(() => {
        let isMounted = true;
        const address = formatLocation(business?.address || branch?.address, business?.city || branch?.city, business?.state || branch?.state);
        if (!address || address === 'Location not provided') {
            setMapCoords(null);
            return;
        }
        const lookup = async () => {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
                    { headers: { 'Accept-Language': 'en' } }
                );
                if (!response.ok) return;
                const data = await response.json();
                if (Array.isArray(data) && data[0] && isMounted) {
                    setMapCoords({ lat: Number(data[0].lat), lon: Number(data[0].lon) });
                }
            } catch {
                if (isMounted) setMapCoords(null);
            }
        };
        lookup();
        return () => {
            isMounted = false;
        };
    }, [business?.address, business?.city, business?.state, branch?.address, branch?.city, branch?.state]);

    useEffect(() => {
        const initMap = () => {
            if (!mapRef.current || !mapCoords || !leafletReady) return;
            const leaflet = (window as typeof window & { L?: any }).L;
            if (!leaflet) return;
            if (!mapInstanceRef.current) {
                mapInstanceRef.current = leaflet.map(mapRef.current).setView([mapCoords.lat, mapCoords.lon], 14);
                leaflet
                    .tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; OpenStreetMap contributors',
                    })
                    .addTo(mapInstanceRef.current);
                markerRef.current = leaflet.marker([mapCoords.lat, mapCoords.lon]).addTo(mapInstanceRef.current);
            } else {
                mapInstanceRef.current.setView([mapCoords.lat, mapCoords.lon], 14);
                if (markerRef.current) {
                    markerRef.current.setLatLng([mapCoords.lat, mapCoords.lon]);
                }
            }
        };
        initMap();
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
            }
        };
    }, [mapCoords, leafletReady]);

    const profileName = useMemo(() => {
        if (branch && !branch.isMainBranch) return branch.name || branch.business?.name || 'Business';
        return business?.name || branch?.business?.name || branch?.name || 'Business';
    }, [branch, business]);

    const profileLogo = branch?.logoUrl || business?.logoUrl || branch?.business?.logoUrl || '';

    useEffect(() => {
        setLogoFailed(false);
        setLogoLoaded(false);
    }, [profileLogo]);

    const profileEmail = branch?.officialEmail || business?.officialEmail;
    const profilePhone = branch?.phone || business?.phone;
    const profileWebsite = branch?.website || business?.website;
    const profileWhatsapp = branch?.whatsappNumber || business?.whatsappNumber;
    const profileAbout = branch?.about || business?.about;
    const profileWelcome = branch?.welcomeMessage || business?.welcomeMessage;
    const profileHours = branch?.businessHours || business?.businessHours;
    const profileSocials = {
        facebookUrl: branch?.facebookUrl || business?.facebookUrl,
        instagramUrl: branch?.instagramUrl || business?.instagramUrl,
        xUrl: branch?.xUrl || business?.xUrl,
        linkedinUrl: branch?.linkedinUrl || business?.linkedinUrl,
        tiktokUrl: branch?.tiktokUrl || business?.tiktokUrl,
        youtubeUrl: branch?.youtubeUrl || business?.youtubeUrl,
    };

    const socialItems = [
        { key: 'facebook', label: 'Facebook', icon: Facebook, url: profileSocials.facebookUrl },
        { key: 'instagram', label: 'Instagram', icon: Instagram, url: profileSocials.instagramUrl },
        { key: 'x', label: 'X (Twitter)', icon: Twitter, url: profileSocials.xUrl },
        { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, url: profileSocials.linkedinUrl },
        { key: 'tiktok', label: 'TikTok', icon: Music2, url: profileSocials.tiktokUrl },
        { key: 'youtube', label: 'YouTube', icon: Youtube, url: profileSocials.youtubeUrl },
    ];

    const categoryLabel = useMemo(() => {
        const cat = business?.category?.name;
        const sub = business?.subcategory?.name;
        return cat && sub ? `${cat} - ${sub}` : cat || sub || 'General Business';
    }, [business]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center font-display text-primary animate-pulse">
                <span className="text-xl font-bold uppercase tracking-tighter">Vemtap</span>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light font-body text-slate-900 antialiased">
            <Script
                src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
                strategy="afterInteractive"
                onLoad={() => setLeafletReady(true)}
            />

            <main className="flex-grow">
                <div className="relative w-full h-64 md:h-80 bg-amber-100">
                    <div className="absolute inset-0 bg-black/10" />
                </div>

                <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10 pb-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                        <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
                            <div className="size-32 md:size-40 rounded-full border-4 border-white bg-white overflow-hidden shadow-xl flex items-center justify-center relative">
                                {profileLogo && !logoFailed && (
                                    <img
                                        alt={`${profileName} logo`}
                                        className={`w-full h-full object-cover object-center rounded-full block transition-opacity duration-300 ${
                                            logoLoaded ? 'opacity-100' : 'opacity-0'
                                        }`}
                                        src={profileLogo}
                                        onLoad={() => setLogoLoaded(true)}
                                        onError={() => setLogoFailed(true)}
                                    />
                                )}
                                {(!profileLogo || logoFailed || !logoLoaded) && (
                                    <span className="text-4xl font-black text-slate-300">
                                        {profileName.slice(0, 2).toUpperCase()}
                                    </span>
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
                                    {displayText(profileAbout)}
                                </p>
                                <p className="text-slate-600 mt-4 leading-relaxed">
                                    {displayText(profileWelcome)}
                                </p>
                            </section>

                            <section className="asymmetric-card bg-white p-8 shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-display text-2xl font-bold text-slate-900">Active Rewards</h3>
                                    <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        Loyalty Program
                                    </span>
                                </div>
                                {rewards.length === 0 ? (
                                    <div className="p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 flex items-center gap-4">
                                        <div className="size-12 rounded-lg bg-primary flex items-center justify-center text-white shrink-0">
                                            <Gift size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">Not available</p>
                                            <p className="text-xs text-slate-500">No reward data</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {rewards.slice(0, 4).map((reward) => (
                                            <div
                                                key={reward.id}
                                                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                                            >
                                                <div className="h-32 w-full overflow-hidden relative bg-slate-100">
                                                    {reward.imageUrl ? (
                                                        <img
                                                            src={reward.imageUrl}
                                                            alt={reward.name || 'Reward'}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                            <Gift size={24} />
                                                        </div>
                                                    )}
                                                    {reward.rewardType && (
                                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-primary shadow-sm">
                                                            {reward.rewardType.replace('_', ' ')}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4 space-y-2">
                                                    <h4 className="font-bold text-slate-900">{displayText(reward.name)}</h4>
                                                    <p className="text-xs text-slate-500 line-clamp-2">
                                                        {displayText(reward.description)}
                                                    </p>
                                                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                                                        <span>{reward.pointCost || 0} pts</span>
                                                        {reward.validityDays ? (
                                                            <span>{reward.validityDays} days</span>
                                                        ) : (
                                                            <span>Valid anytime</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <section className="asymmetric-card bg-white p-8 shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-display text-2xl font-bold text-slate-900">Opening Hours</h3>
                                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        Weekly Schedule
                                    </span>
                                </div>
                                {profileHours ? (
                                    <div className="space-y-3">
                                        {DAYS.map((day) => (
                                            <div key={day} className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 bg-slate-50">
                                                <span className="text-sm font-bold text-slate-700 capitalize">{day}</span>
                                                <span className="text-sm font-black text-slate-900">
                                                    {formatHours(profileHours[day])}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-400 font-semibold">Hours not provided</div>
                                )}
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
                                                {formatLocation(
                                                    business?.address || branch?.address,
                                                    business?.city || branch?.city,
                                                    business?.state || branch?.state
                                                )}
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
                                    <div className="w-full h-56 rounded-xl overflow-hidden mt-4 bg-slate-100 border border-slate-200">
                                        {mapCoords && leafletReady ? (
                                            <div ref={mapRef} className="w-full h-full" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-slate-400">
                                                Map not available
                                            </div>
                                        )}
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
                                            {displayText(profileWebsite)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                                        <Mail className="text-primary" size={18} />
                                        <span className="text-slate-600 group-hover:text-primary transition-colors">
                                            {displayText(profileEmail)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                                        <Phone className="text-primary" size={18} />
                                        <span className="text-slate-600 group-hover:text-primary transition-colors">
                                            {displayText(profilePhone)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                                        <MessageCircle className="text-primary" size={18} />
                                        <span className="text-slate-600 group-hover:text-primary transition-colors">
                                            {displayText(profileWhatsapp)}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-8 pt-8 border-t border-slate-100">
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Follow Us</p>
                                    <div className="space-y-3">
                                        {socialItems.map((social) => {
                                            const Icon = social.icon;
                                            const link = formatExternalUrl(social.url);
                                            return (
                                                <div
                                                    key={social.key}
                                                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                            <Icon size={16} />
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-700">{social.label}</span>
                                                    </div>
                                                    {link ? (
                                                        <a
                                                            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                                                            href={link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            Visit
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 font-semibold">Not available</span>
                                                    )}
                                                </div>
                                            );
                                        })}
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
                                <span className="absolute -right-4 -bottom-4 text-9xl text-white/10">*</span>
                            </section>
                        </div>
                    </div>
                </div>
            </main>

        </div>
    );
}
