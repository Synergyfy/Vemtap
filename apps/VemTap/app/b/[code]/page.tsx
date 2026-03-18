
'use client';

import Script from 'next/script';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import {
    MapPin,
    Phone,
    Globe,
    Mail,
    Facebook,
    Instagram,
    Share2,
    Linkedin,
    Twitter,
    Youtube,
    Music2,
    Gift,
} from 'lucide-react';

import { usePublicBusiness, usePublicBranch, usePublicRewards } from '@/services/public/hooks';
import { BusinessHours } from '@/services/public/types';
import { normalizeBaseUrl } from '@/lib/api';

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

export default function PublicBusinessProfilePage() {
    const params = useParams();
    const codeParam = params?.code;
    const code = Array.isArray(codeParam) ? codeParam[0] : codeParam || '';

    const [isBranch, setIsBranch] = useState<boolean | null>(null);

    // Use React Query hooks for data fetching
    const { data: branchData, isLoading: branchLoading, error: branchError } = usePublicBranch(code, isBranch === true);
    const businessCode =
        isBranch === true ? (branchData?.business?.uniqueCode || '') : code;
    const shouldFetchBusiness =
        isBranch === false ? !!code : isBranch === true ? !!branchData?.business?.uniqueCode : false;
    const { data: businessData, isLoading: businessLoading, error: businessError } = usePublicBusiness(businessCode, shouldFetchBusiness);
    
    // Determine if the code corresponds to a branch or a business
    useEffect(() => {
        const checkCodeType = async () => {
            try {
                const res = await fetch(normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL)+`/public/branches/code/${code}`);
                if (res.ok) {
                    setIsBranch(true);
                } else {
                    setIsBranch(false);
                }
            } catch {
                setIsBranch(false);
            }
        };
        if(code) checkCodeType();
    }, [code]);

    const branch = isBranch ? branchData : null;
    const business = businessData;
    const businessSummary = branchData?.business;

    const businessId = useMemo(
        () => business?.id || branch?.businessId || branchData?.business?.id,
        [branch?.businessId, branchData?.business?.id, business?.id]
    );

    const { data: rewards, isLoading: rewardsLoading } = usePublicRewards(businessId || '', !!businessId);

    const [logoFailed, setLogoFailed] = useState(false);
    const [logoLoaded, setLogoLoaded] = useState(false);
    const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(null);
    const [leafletReady, setLeafletReady] = useState(false);
    const mapRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    useEffect(() => {
        let isMounted = true;
        const useBusinessDetails = !branch || branch.isMainBranch;
        const address = useBusinessDetails
            ? formatLocation(business?.address || branch?.address, business?.city || branch?.city, business?.state || branch?.state)
            : formatLocation(branch?.address, branch?.city, branch?.state);
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
    }, [business?.address, business?.city, business?.state, branch?.address, branch?.city, branch?.state, branch?.isMainBranch]);

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

    const isLoading = branchLoading || businessLoading || isBranch === null;

    const useBusinessDetails = !branch || branch.isMainBranch;
    const profileSource = useBusinessDetails ? (business || branch) : branch;
    const locationAddress = useBusinessDetails
        ? formatLocation(business?.address || branch?.address, business?.city || branch?.city, business?.state || branch?.state)
        : formatLocation(branch?.address, branch?.city, branch?.state);

    const profileName = useMemo(() => {
        if (useBusinessDetails) {
            return business?.name || businessSummary?.name || 'Name not provided';
        }
        return branch?.name || 'Name not provided';
    }, [branch, business, businessSummary, useBusinessDetails]);

    const profileLogo = useMemo(() => {
        if (useBusinessDetails) {
            return business?.logoUrl || businessSummary?.logoUrl || '';
        }
        return branch?.logoUrl || '';
    }, [branch, business, businessSummary, useBusinessDetails]);

    useEffect(() => {
        setLogoFailed(false);
        setLogoLoaded(false);
    }, [profileLogo]);

    const profileEmail = profileSource?.officialEmail;
    const profilePhone = profileSource?.phone;
    const profileWebsite = profileSource?.website;
    const profileWhatsapp = profileSource?.whatsappNumber;
    const profileAbout = profileSource?.about;
    const profileWelcome = profileSource?.welcomeMessage;
    const profileHours = profileSource?.businessHours;
    const profileShowRewards = useBusinessDetails
        ? (business?.showRewards ?? branch?.showRewards ?? true)
        : (branch?.showRewards ?? true);
    const profileSocials = {
        facebookUrl: profileSource?.facebookUrl,
        instagramUrl: profileSource?.instagramUrl,
        xUrl: profileSource?.xUrl,
        linkedinUrl: profileSource?.linkedinUrl,
        tiktokUrl: profileSource?.tiktokUrl,
        youtubeUrl: profileSource?.youtubeUrl,
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
        if (!useBusinessDetails) return 'Branch Location';
        const cat = business?.category?.name;
        const sub = business?.subcategory?.name;
        return cat && sub ? `${cat} - ${sub}` : cat || sub || 'General Business';
    }, [business, useBusinessDetails]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center font-display text-primary animate-pulse bg-white">
                <span className="text-xl font-bold uppercase tracking-tighter">Vemtap</span>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-white font-body text-slate-900 antialiased">
            <Script
                src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
                strategy="afterInteractive"
                onLoad={() => setLeafletReady(true)}
            />

            <main className="min-h-screen bg-white text-slate-900 font-body">
                <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-100 rounded-full shadow-lg p-2 border border-slate-200 flex items-center justify-center overflow-hidden">
                                {profileLogo && !logoFailed ? (
                                    <img
                                        alt="Logo"
                                        className={`w-full h-full object-contain transition-opacity duration-300 ${logoLoaded ? 'opacity-100' : 'opacity-0'}`}
                                        src={profileLogo}
                                        onLoad={() => setLogoLoaded(true)}
                                        onError={() => setLogoFailed(true)}
                                    />
                                ) : (
                                    <span className="text-sm font-bold text-slate-400">No Logo</span>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-4xl font-bold text-slate-900 lowercase tracking-tight">{profileName}</h1>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-slate-500 font-medium mt-1 text-sm md:text-base">
                                    <div className="flex items-center gap-1">
                                        <MapPin size={16} />
                                        <span>{locationAddress?.split(',').slice(-2).join(', ') || "Lagos, Nigeria"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button className="bg-slate-100 text-slate-600 p-3 rounded-xl hover:bg-slate-200 transition-colors border border-slate-200">
                            <Share2 size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        
                        <div className="lg:col-span-7 flex flex-col gap-12">
                            <section>
                                <h2 className="text-2xl font-bold text-slate-900 mb-4 font-display">About Us</h2>
                                <p className="text-slate-600 leading-relaxed text-lg">
                                    {displayText(profileAbout)}
                                </p>
                                {profileWelcome && (
                                    <p className="text-slate-500 mt-4 italic">
                                        {profileWelcome}
                                    </p>
                                )}
                            </section>

                            {useBusinessDetails && profileShowRewards && (
                                <section>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-6 font-display">Active Rewards</h2>
                                    <div className="space-y-4">
                                        {rewards && rewards.length > 0 ? rewards.map((reward) => (
                                            <div key={reward.id} className="bg-slate-50 p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-500/30 transition-all cursor-pointer">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-white border flex items-center justify-center text-2xl">
                                                        <Gift className="text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-slate-800">{reward.name}</h3>
                                                        <p className="text-slate-500 text-sm">{reward.description}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="bg-blue-100 text-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                                        {reward.pointCost} pts
                                                    </span>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                                                No active rewards available.
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            <section>
                                <h2 className="text-2xl font-bold text-slate-900 mb-6 font-display">Locations</h2>
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                                <MapPin size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg text-slate-800">Main Office</h4>
                                                <p className="text-slate-500 text-sm">{locationAddress}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="lg:col-span-5 flex flex-col gap-8">
                            <div className="bg-slate-50 border border-slate-100 text-slate-800 p-8 rounded-2xl shadow-lg flex flex-col gap-8">
                                <h3 className="text-xl font-bold font-display text-slate-900">Connect with us</h3>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-blue-600">
                                            <Phone size={18} />
                                        </div>
                                        <span className="font-medium">{displayText(profilePhone)}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-blue-600">
                                            <Mail size={18} />
                                        </div>
                                        <span className="font-medium break-all">{displayText(profileEmail)}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-blue-600">
                                            <Globe size={18} />
                                        </div>
                                        <span className="font-medium">{displayText(profileWebsite)}</span>
                                    </div>
                                </div>
                                
                                <div className="pt-8 border-t border-slate-200 flex gap-4">
                                    {socialItems.map((social) => (
                                        <a key={social.key} href={social.url} className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors text-slate-600">
                                            {React.createElement(social.icon, { size: 18 })}
                                        </a>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 p-8 rounded-2xl shadow-lg">
                                <h3 className="text-sm font-black mb-8 uppercase tracking-[0.2em] text-slate-500 font-display">Business Hours</h3>
                                <div className="space-y-6">
                                    {profileHours && Object.entries(profileHours).map(([day, hours]) => {
                                        const dayHours = hours as BusinessHours | undefined;
                                        return (
                                            <div key={day} className="flex justify-between items-center">
                                                <span className="text-slate-600 font-medium capitalize">{day.slice(0,3)}</span>
                                                <div className="text-right">
                                                    <div className="font-bold text-slate-900">{formatHours(dayHours)}</div>
                                                    {dayHours && !dayHours.closed && (
                                                        <div className="text-green-500 text-[10px] font-black uppercase tracking-widest mt-1">Open</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
