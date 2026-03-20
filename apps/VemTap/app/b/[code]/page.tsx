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
    ChevronRight,
} from 'lucide-react';

import { usePublicBusiness, usePublicBranch, usePublicRewards } from '@/services/public/hooks';
import { BusinessHours } from '@/services/public/types';


const displayText = (value?: string | null) => (value && value.trim().length > 0 ? value : 'Not provided');

const formatLocation = (address?: string | null, city?: string | null, state?: string | null) => {
    const parts = [address, city, state].filter((part) => part && String(part).trim().length > 0);
    return parts.length > 0 ? parts.join(', ') : 'Location not provided';
};

const formatHours = (hours?: BusinessHours) => {
    if (!hours || hours.closed) return 'Closed';
    return `${hours.open} - ${hours.close}`;
};


export default function PublicBusinessProfilePage() {
    const params = useParams();
    const codeParam = params?.code;
    const code = Array.isArray(codeParam) ? codeParam[0] : codeParam || '';

    // Use React Query hooks for data fetching
    const { data: branchData, isLoading: branchLoading } = usePublicBranch(code, !!code);
    const { data: businessByCode, isLoading: businessByCodeLoading } = usePublicBusiness(code, !!code);
    
    // If the code is a branch code, we might need to fetch the business it belongs to
    const branchBusinessCode = branchData?.business?.uniqueCode;
    const { data: businessByBranch, isLoading: businessByBranchLoading } = usePublicBusiness(
        branchBusinessCode || '',
        !!branchBusinessCode && branchBusinessCode !== code
    );

    const business = businessByCode?.id ? businessByCode : businessByBranch;
    const branch = businessByCode?.id ? null : branchData || null;
    const businessSummary = branchData?.business;
    
    const branches = useMemo(() => business?.branches || [], [business?.branches]);
    const mainBranch = useMemo(
        () => branches.find((item) => item.isMainBranch) || branches[0] || null,
        [branches]
    );
    
    const resolvedBranch = branch || mainBranch;

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

    // Effect to geocode the resolved branch location and show on map
    useEffect(() => {
        let isMounted = true;
        const address = formatLocation(
            resolvedBranch?.address || business?.address,
            resolvedBranch?.city || business?.city,
            resolvedBranch?.state || business?.state
        );
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
    }, [
        business?.address,
        business?.city,
        business?.state,
        resolvedBranch?.address,
        resolvedBranch?.city,
        resolvedBranch?.state,
    ]);

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

    const isLoading = branchLoading || businessByCodeLoading || businessByBranchLoading;

    // Determine the active display settings
    const activeShowRewards = resolvedBranch?.showRewards ?? business?.showRewards ?? true;
    
    const locationAddress = formatLocation(
        resolvedBranch?.address || business?.address,
        resolvedBranch?.city || business?.city,
        resolvedBranch?.state || business?.state
    );
    const businessLocation = formatLocation(business?.address, business?.city, business?.state);
    const resolvedLocationDisplay = locationAddress === 'Location not provided' ? businessLocation : locationAddress;

    const profileName = useMemo(() => {
        const businessName = business?.name || businessSummary?.name || branch?.business?.name;
        return businessName || branch?.name || 'Business';
    }, [branch, business, businessSummary]);

    const profileLogo = useMemo(() => {
        return business?.logoUrl || businessSummary?.logoUrl || resolvedBranch?.logoUrl || '';
    }, [business, businessSummary, resolvedBranch?.logoUrl]);
    const fallbackLogo = '/VEMTAP_PNG.png';

    useEffect(() => {
        setLogoFailed(false);
        setLogoLoaded(false);
    }, [profileLogo]);

    const profileEmail = resolvedBranch?.officialEmail || business?.officialEmail;
    const profilePhone = resolvedBranch?.phone || business?.phone;
    const profileWebsite = resolvedBranch?.website || business?.website;
    const profileAbout = resolvedBranch?.about || business?.about;
    const profileWelcome = resolvedBranch?.welcomeMessage || business?.welcomeMessage;
    const profileHours = resolvedBranch?.businessHours || business?.businessHours;
    
    const profileSocials = {
        facebookUrl: resolvedBranch?.facebookUrl || business?.facebookUrl,
        instagramUrl: resolvedBranch?.instagramUrl || business?.instagramUrl,
        xUrl: resolvedBranch?.xUrl || business?.xUrl,
        linkedinUrl: resolvedBranch?.linkedinUrl || business?.linkedinUrl,
        tiktokUrl: resolvedBranch?.tiktokUrl || business?.tiktokUrl,
        youtubeUrl: resolvedBranch?.youtubeUrl || business?.youtubeUrl,
    };

    const socialItems = [
        { key: 'facebook', label: 'Facebook', icon: Facebook, url: profileSocials.facebookUrl },
        { key: 'instagram', label: 'Instagram', icon: Instagram, url: profileSocials.instagramUrl },
        { key: 'x', label: 'X (Twitter)', icon: Twitter, url: profileSocials.xUrl },
        { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, url: profileSocials.linkedinUrl },
        { key: 'tiktok', label: 'TikTok', icon: Music2, url: profileSocials.tiktokUrl },
        { key: 'youtube', label: 'YouTube', icon: Youtube, url: profileSocials.youtubeUrl },
    ];

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
                    {/* Hero Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-100 rounded-full shadow-lg p-2 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                {profileLogo && !logoFailed ? (
                                    <img
                                        alt="Logo"
                                        className={`w-full h-full object-contain transition-opacity duration-300 ${logoLoaded ? 'opacity-100' : 'opacity-0'}`}
                                        src={profileLogo}
                                        onLoad={() => setLogoLoaded(true)}
                                        onError={() => setLogoFailed(true)}
                                    />
                                ) : (
                                    <img
                                        alt="VemTap"
                                        className="w-full h-full object-contain opacity-80"
                                        src={fallbackLogo}
                                    />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight lowercase">
                                        {profileName}
                                    </h1>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-slate-500 font-medium mt-2 text-sm md:text-base">
                                    <div className="flex items-center gap-1.5 grayscale opacity-70">
                                        <MapPin size={16} />
                                        <span>{resolvedLocationDisplay || "Lagos, Nigeria"}</span>
                                    </div>
                                    {(business?.category?.name || business?.subcategory?.name) && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600">
                                            <span>{business?.category?.name}</span>
                                            {business?.subcategory?.name && (
                                                <>
                                                    <span className="opacity-30">•</span>
                                                    <span>{business?.subcategory?.name}</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button className="bg-slate-100 text-slate-600 p-3 rounded-2xl hover:bg-slate-200 transition-all border border-slate-200 active:scale-95 shadow-sm">
                                <Share2 size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        {/* Left Column */}
                        <div className="lg:col-span-7 flex flex-col gap-12">
                            {/* About Section */}
                            <section>
                                <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight font-display">About the Business</h2>
                                <p className="text-slate-600 leading-relaxed text-lg font-medium">
                                    {displayText(profileAbout)}
                                </p>
                                {profileWelcome && (
                                    <div className="mt-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50 italic text-slate-700">
                                        "{profileWelcome}"
                                    </div>
                                )}
                            </section>

                            {/* Rewards Section */}
                            {activeShowRewards && (
                                <section>
                                    <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight font-display flex items-center gap-3">
                                        Active Rewards
                                        {rewards && rewards.length > 0 && (
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{rewards.length}</span>
                                        )}
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {rewards && rewards.length > 0 ? (
                                            rewards.map((reward) => (
                                                <div 
                                                    key={reward.id} 
                                                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group cursor-pointer relative overflow-hidden"
                                                >
                                                    <div className="absolute top-4 right-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ChevronRight size={20} />
                                                    </div>
                                                    <div className="flex flex-col gap-4">
                                                        <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                            <Gift size={28} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-black text-lg text-slate-900 leading-tight mb-1 lowercase">{reward.name}</h3>
                                                            <p className="text-slate-500 text-sm font-medium line-clamp-2">{reward.description}</p>
                                                        </div>
                                                        <div className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 self-start px-3 py-1.5 rounded-full">
                                                            {reward.pointCost} points requirement
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-400 font-medium">
                                                No specific rewards are listed for this location yet.
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Branches/Locations Section */}
                            <section>
                                <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight font-display">Our Locations</h2>
                                <div className="space-y-4">
                                    {branches.length > 0 ? (
                                        branches.map((b) => (
                                            <div 
                                                key={b.id} 
                                                className={`p-6 rounded-3xl border transition-all flex items-center justify-between group ${
                                                    b.id === resolvedBranch?.id 
                                                        ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/10' 
                                                        : 'bg-slate-50 border-slate-100 hover:border-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                                                        b.id === resolvedBranch?.id ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'
                                                    }`}>
                                                        <MapPin size={24} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-black text-lg text-slate-900 lowercase">{b.name || "Branch Location"}</h4>
                                                            {b.isMainBranch && (
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">Main</span>
                                                            )}
                                                        </div>
                                                        <p className="text-slate-500 font-medium text-sm mt-0.5">
                                                            {formatLocation(b.address, b.city, b.state)}
                                                        </p>
                                                    </div>
                                                </div>
                                                {b.uniqueCode && b.uniqueCode !== code && (
                                                    <a 
                                                        href={`/b/${b.uniqueCode}`}
                                                        className="p-3 rounded-full bg-white border border-slate-100 text-slate-400 hover:text-primary hover:border-primary transition-all shadow-sm active:scale-90"
                                                    >
                                                        <ChevronRight size={20} />
                                                    </a>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-300">
                                                <MapPin size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-lg text-slate-900 lowercase">Main Office</h4>
                                                <p className="text-slate-500 font-medium text-sm mt-0.5">{resolvedLocationDisplay}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Map Section */}
                            {mapCoords && (
                                <section>
                                    <div className="relative group">
                                        <div 
                                            ref={mapRef} 
                                            className="w-full h-[450px] rounded-[3rem] border-8 border-white shadow-2xl z-0 overflow-hidden"
                                        />
                                        <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                                            <p className="text-xs font-black uppercase tracking-widest text-primary mb-1">Interactive Map</p>
                                            <p className="text-sm font-bold text-slate-800">{resolvedLocationDisplay}</p>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Right Column (Sidebar) */}
                        <div className="lg:col-span-5 flex flex-col gap-8">
                            {/* Contact Info Card */}
                            <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl flex flex-col gap-10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                
                                <h3 className="text-xl font-black uppercase tracking-tight text-white/50 font-display">Contact Info</h3>
                                
                                <div className="space-y-8">
                                    <div className="flex items-center gap-6 group">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                            <Phone size={20} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Phone Number</span>
                                            <span className="text-lg font-bold">{displayText(profilePhone)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 group">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                            <Mail size={20} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Email Address</span>
                                            <span className="text-lg font-bold break-all lowercase">{displayText(profileEmail)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 group">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                            <Globe size={20} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Website</span>
                                            <span className="text-lg font-bold">{displayText(profileWebsite)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="pt-10 border-t border-white/10 flex flex-wrap gap-4">
                                    {socialItems.filter(s => s.url).map((social) => (
                                        <a 
                                            key={social.key} 
                                            href={social.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all text-white/60 hover:text-white active:scale-90"
                                            title={social.label}
                                        >
                                            {React.createElement(social.icon, { size: 20 })}
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Business Hours Card */}
                            <div className="bg-slate-50 border border-slate-100 p-10 rounded-[3rem] shadow-sm relative group overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                                
                                <h3 className="text-[10px] font-black mb-10 uppercase tracking-[0.3em] text-slate-400 font-display">Opening Hours</h3>
                                
                                <div className="space-y-6">
                                    {profileHours && Object.entries(profileHours).map(([day, hours]) => {
                                        const dayHours = hours as BusinessHours | undefined;
                                        const isClosed = !dayHours || dayHours.closed;
                                        return (
                                            <div key={day} className="flex justify-between items-center group/row">
                                                <span className="text-slate-500 font-black uppercase text-[11px] tracking-widest group-hover/row:text-primary transition-colors">{day.slice(0,3)}</span>
                                                <div className="text-right">
                                                    <div className={`font-black text-sm tracking-tight ${isClosed ? 'text-slate-400' : 'text-slate-900'} lowercase`}>
                                                        {formatHours(dayHours)}
                                                    </div>
                                                    {!isClosed && (
                                                        <div className="text-primary text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Currently Open</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-10 pt-10 border-t border-slate-200/60 flex items-center justify-center gap-3 grayscale opacity-30">
                                    <span className="text-[10px] font-black tracking-widest uppercase">Verified Business</span>
                                    <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                                    <span className="text-[10px] font-black tracking-widest uppercase tracking-widest">Premium Partner</span>
                                </div>
                            </div>
                            
                            {/* Brand Footer */}
                            <div className="flex flex-col items-center gap-4 py-8">
                                <div className="flex items-center gap-2 grayscale opacity-20">
                                    <span className="text-xs font-black tracking-tighter uppercase">VemTap</span>
                                    <div className="w-1 h-1 rounded-full bg-slate-900"></div>
                                    <span className="text-[10px] font-bold">2026</span>
                                </div>
                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">Sustainable Customer Experience</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            
            {/* Global Styles for Leaflet */}
            <style jsx global>{`
                .leaflet-container {
                    font-family: inherit;
                    cursor: default !important;
                }
                .leaflet-bar {
                    border: none !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
                }
                .leaflet-bar a {
                    background-color: white !important;
                    color: #0f172a !important;
                    border: 1px solid #f1f5f9 !important;
                }
                .leaflet-bar a:hover {
                    background-color: #f8fafc !important;
                    color: #2563eb !important;
                }
            `}</style>
        </div>
    );
}
