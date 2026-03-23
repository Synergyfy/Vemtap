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
    Star,
    CheckCircle2,
    Building2,
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
    const { data: branchData, isLoading: branchLoading, isError: branchError } = usePublicBranch(code, !!code);
    const { data: businessByCode, isLoading: businessByCodeLoading, isError: businessByCodeError } = usePublicBusiness(code, !!code);
    
    const rawBranchData = (branchData as any)?.data || branchData;
    const rawBusinessByCode = (businessByCode as any)?.data || businessByCode;

    // If the code is a branch code, we might need to fetch the business it belongs to
    const branchBusinessCode = rawBranchData?.business?.uniqueCode;
    const { data: businessByBranch, isLoading: businessByBranchLoading, isError: businessByBranchError } = usePublicBusiness(
        branchBusinessCode || '',
        !!branchBusinessCode && branchBusinessCode !== code
    );
    
    const rawBusinessByBranch = (businessByBranch as any)?.data || businessByBranch;

    const business = rawBusinessByCode?.id ? rawBusinessByCode : rawBusinessByBranch;
    const branch = rawBusinessByCode?.id ? null : rawBranchData || null;
    const businessSummary = rawBranchData?.business;
    
    const branches = useMemo(() => business?.branches || [], [business?.branches]);
    const mainBranch = useMemo(
        () => branches.find((item: any) => item.isMainBranch) || branches[0] || null,
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

    const isLoading = branchLoading || businessByCodeLoading || (businessByBranchLoading || false);

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
        const name = business?.name || businessSummary?.name || branch?.business?.name || branch?.name;
        return name || 'VemTap Business';
    }, [branch, business, businessSummary]);

    const profileLogo = useMemo(() => {
        return business?.logoUrl || businessSummary?.logoUrl || resolvedBranch?.logoUrl || '';
    }, [business, businessSummary, resolvedBranch?.logoUrl]);
    const fallbackLogo = '/VEMTAP_PNG.png';

    useEffect(() => {
        setLogoFailed(false);
        setLogoLoaded(false);
    }, [profileLogo]);

    const profileEmail = resolvedBranch?.officialEmail || business?.officialEmail || (business as any)?.email || (business as any)?.owner?.email;
    const profilePhone = resolvedBranch?.phone || business?.phone || (business as any)?.owner?.phone;
    const profileWebsite = resolvedBranch?.website || business?.website;
    const profileAbout = resolvedBranch?.about || business?.about || business?.goal || (business as any)?.description;
    const profileWelcome = resolvedBranch?.welcomeMessage || business?.welcomeMessage || business?.welcomeTitle;
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

    if (!business && !branch && !isLoading && (branchError || businessByCodeError || businessByBranchError)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
                <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <MapPin size={48} />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Business Not Found</h1>
                <p className="text-slate-500 font-medium max-w-md mb-8">
                    We couldn't find a business or branch with the code <span className="text-slate-900 font-bold">{code}</span>. It may have been moved, deleted, or the link might be incorrect.
                </p>
                <a 
                    href="/" 
                    className="px-8 py-3 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all text-sm uppercase tracking-widest"
                >
                    Back to Home
                </a>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#F8FAFC] font-sans text-slate-900 antialiased">
            <Script
                src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
                strategy="afterInteractive"
                onLoad={() => setLeafletReady(true)}
            />

            {/* Header Background */}
            <div className="h-44 bg-[#4238DA] rounded-b-[3.5rem] relative" />

            <div className="max-w-6xl mx-auto px-4 -mt-24 pb-20 relative z-10">
                {/* Header Card */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm flex flex-col md:flex-row items-end justify-between gap-6 mb-12 border border-slate-50">
                    <div className="flex flex-col md:flex-row items-start gap-6 w-full md:w-auto">
                        <div className="w-32 h-32 bg-[#2563EB] rounded-[1.8rem] flex items-center justify-center text-white text-7xl font-black italic shadow-2xl -mt-20 border-[6px] border-white shrink-0 overflow-hidden">
                            {profileLogo && !logoFailed ? (
                                <img
                                    alt="Logo"
                                    className={`w-full h-full object-contain p-2 transition-opacity duration-300 ${logoLoaded ? 'opacity-100' : 'opacity-0'}`}
                                    src={profileLogo}
                                    onLoad={() => setLogoLoaded(true)}
                                    onError={() => setLogoFailed(true)}
                                />
                            ) : (
                                <span className="pt-2">{profileName.charAt(0).toLowerCase()}</span>
                            )}
                        </div>
                        <div className="pt-2">
                            <div className="flex items-center gap-2">
                                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight lowercase">
                                    {profileName}
                                </h1>
                                <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center text-white shadow-sm border-2 border-white">
                                    <CheckCircle2 size={12} strokeWidth={4} />
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                <div className="flex items-center gap-1.5 grayscale-0">
                                    <Star className="text-[#F59E0B] fill-[#F59E0B] w-4 h-4" />
                                    <span className="font-bold text-slate-900 text-sm">4.9</span>
                                    <span className="text-[#94A3B8] font-semibold text-xs">(1,240 Reviews)</span>
                                </div>
                                <div className="w-1 h-1 rounded-full bg-slate-200 hidden sm:block" />
                                <div className="flex items-center gap-1.5 text-[#94A3B8]">
                                    <MapPin size={16} />
                                    <span className="font-semibold text-xs tracking-tight">{resolvedLocationDisplay || "VemTap HQ, Victoria Island, Lagos"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button className="bg-[#2563EB] text-white px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] hover:scale-[1.02] active:scale-95 transition-all w-full md:w-auto whitespace-nowrap">
                        FOLLOW BUSINESS
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* Left Column */}
                    <div className="lg:col-span-8 flex flex-col gap-12">
                        {/* About Us Section */}
                        <section>
                            <h2 className="text-2xl font-black text-slate-900 mb-6 font-display">About Us</h2>
                            <p className="text-[#64748B] leading-relaxed text-lg font-medium">
                                {profileAbout || `Welcome to ${profileName.toLowerCase()}! We are dedicated to providing the best experience to our customers through innovation and quality service. Join our loyalty program to earn points on every visit and unlock exclusive rewards.`}
                            </p>
                            {profileWelcome && (
                                <div className="mt-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50 italic text-slate-700">
                                    "{profileWelcome}"
                                </div>
                            )}
                        </section>

                        {/* Active Rewards Section */}
                        {activeShowRewards && (
                            <section>
                                <h2 className="text-2xl font-black text-slate-900 mb-6 font-display">Active Rewards</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {rewards && rewards.length > 0 ? (
                                        rewards.slice(0, 2).map((reward, idx) => (
                                            <div 
                                                key={reward.id} 
                                                className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative group cursor-pointer overflow-hidden transition-all hover:shadow-md h-full flex flex-col"
                                            >
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="w-14 h-14 bg-white shadow-inner border border-slate-50 flex items-center justify-center rounded-2xl text-3xl">
                                                        {idx === 0 ? "☕" : "🏷️"}
                                                    </div>
                                                    <div className="bg-[#E0E7FF] text-[#2563EB] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                        {reward.pointCost} POINTS
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-xl text-slate-900 mb-1">{reward.name}</h3>
                                                    <p className="text-[#94A3B8] text-sm font-semibold">Tap to see details</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <>
                                            {/* Fallback items to match design image looks if no rewards */}
                                            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="w-14 h-14 bg-white shadow-inner border border-slate-50 flex items-center justify-center rounded-2xl text-3xl">☕</div>
                                                    <div className="bg-[#E0E7FF] text-[#2563EB] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">100 POINTS</div>
                                                </div>
                                                <h3 className="font-black text-xl text-slate-900 mb-1 text-nowrap">Free Coffee</h3>
                                                <p className="text-[#94A3B8] text-sm font-semibold">Tap to see details</p>
                                            </div>
                                            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="w-14 h-14 bg-white shadow-inner border border-slate-50 flex items-center justify-center rounded-2xl text-3xl">🏷️</div>
                                                    <div className="bg-[#E0E7FF] text-[#2563EB] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">250 POINTS</div>
                                                </div>
                                                <h3 className="font-black text-xl text-slate-900 mb-1 text-nowrap">15% Discount</h3>
                                                <p className="text-[#94A3B8] text-sm font-semibold">Tap to see details</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Locations & Branches Section */}
                        <section>
                            <h2 className="text-2xl font-black text-slate-900 mb-6 font-display">Locations & Branches</h2>
                            <div className="flex flex-col gap-5">
                                {branches.length > 0 ? (
                                    branches.map((b: any) => (
                                        <div 
                                            key={b.id} 
                                            className="bg-white p-5 pr-8 rounded-[1.8rem] border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer transition-all hover:border-slate-300"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="w-16 h-16 bg-[#F0F4FF] rounded-2xl flex items-center justify-center text-[#2563EB]">
                                                   <Building2 size={24} strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-lg text-slate-900 leading-tight">
                                                        {b.name || (b.isMainBranch ? "Head Office" : "Branch Location")}
                                                    </h4>
                                                    <p className="text-[#94A3B8] text-sm font-semibold mt-0.5">
                                                        {formatLocation(b.address, b.city, b.state)}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-slate-300 transition-transform group-hover:translate-x-1" size={24} />
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white p-5 pr-8 rounded-[1.8rem] border border-slate-100 shadow-sm flex items-center justify-between group transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 bg-[#F0F4FF] rounded-2xl flex items-center justify-center text-[#2563EB]">
                                               <Building2 size={24} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-lg text-slate-900">Head Office</h4>
                                                <p className="text-[#94A3B8] text-sm font-semibold mt-0.5">{resolvedLocationDisplay}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-slate-300" size={24} />
                                    </div>
                                )}
                            </div>
                        </section>
                        
                        {/* Map Preview (Optional matching of design though figma didn't show it as main, but good to keep) */}
                        {mapCoords && (
                            <section className="mt-4">
                                <div className="relative group">
                                    <div 
                                        ref={mapRef} 
                                        className="w-full h-80 rounded-[2.5rem] border-4 border-white shadow-lg overflow-hidden"
                                    />
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Column (Sidebar) */}
                    <div className="lg:col-span-4 flex flex-col gap-10">
                        {/* Connect With Us Card */}
                        <div className="bg-[#0F172A] text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col h-full">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            
                            <h3 className="text-2xl font-black italic text-white mb-10 tracking-tight">Connect with us</h3>
                            
                            <div className="space-y-8 flex-grow">
                                <div className="flex items-center gap-5 group">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 group-hover:bg-blue-600 transition-all">
                                        <Phone size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white/80 text-lg font-bold tracking-tight">{profilePhone ? (profilePhone.length > 13 ? profilePhone.slice(0, 13) : profilePhone) : "+234 800"}</span>
                                        <span className="text-white/80 text-lg font-bold tracking-widest uppercase italic -mt-1">{profileName.slice(0, 6).toUpperCase() || "VEMTAP"}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5 group">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 group-hover:bg-blue-600 transition-all">
                                        <Mail size={20} />
                                    </div>
                                    <span className="text-white/80 text-lg font-bold tracking-tight lowercase break-all">
                                        {profileEmail || `hello@${profileName.toLowerCase()}.com`}
                                    </span>
                                </div>
                                <div className="flex items-center gap-5 group">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 group-hover:bg-blue-600 transition-all">
                                        <Globe size={20} />
                                    </div>
                                    <span className="text-white/80 text-lg font-bold tracking-tight">
                                        {profileWebsite || `www.${profileName.toLowerCase()}.com`}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="w-full h-px bg-white/10 my-10" />
                            
                            <div className="flex justify-between items-center px-1">
                                {socialItems.filter(s => s.url || true).slice(0, 3).map((social, idx) => (
                                    <a 
                                        key={social.key} 
                                        href={social.url || "#"} 
                                        className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-600 hover:border-blue-600 transition-all text-white/60 hover:text-white"
                                    >
                                        {React.createElement(social.icon, { size: 20 })}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Business Hours Card */}
                        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                            <h3 className="text-lg font-black uppercase tracking-[0.2em] text-slate-800 mb-10 text-center">BUSINESS HOURS</h3>
                            
                            <div className="space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 text-lg">Mon -</span>
                                        <span className="font-bold text-slate-900 text-lg -mt-1">Fri</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-lg text-slate-900">
                                            {profileHours?.Monday && !profileHours.Monday.closed ? formatHours(profileHours.Monday) : "9:00 AM - 9:00 PM"}
                                        </div>
                                        <div className="text-[#10B981] font-black text-[10px] uppercase tracking-widest mt-0.5">OPEN</div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-slate-900 text-lg">Saturday</span>
                                    <div className="text-right">
                                        <div className="font-black text-lg text-slate-900">
                                            {profileHours?.Saturday && !profileHours.Saturday.closed ? formatHours(profileHours.Saturday) : "10:00 AM - 11:00 PM"}
                                        </div>
                                        <div className="text-[#10B981] font-black text-[10px] uppercase tracking-widest mt-0.5">OPEN</div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-slate-900 text-lg">Sunday</span>
                                    <div className="text-right">
                                        <div className="font-black text-lg text-slate-400">
                                            {profileHours?.Sunday && !profileHours.Sunday.closed ? formatHours(profileHours.Sunday) : "Closed"}
                                        </div>
                                        <div className="text-red-500 font-black text-[10px] uppercase tracking-widest mt-0.5">CLOSED</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Styles for Leaflet Refined to match clean look */}
            <style jsx global>{`
                .leaflet-container {
                    font-family: inherit;
                    cursor: default !important;
                    filter: grayscale(0.2) contrast(1.1);
                }
                .leaflet-bar {
                    border: none !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
                    margin: 20px !important;
                }
                .leaflet-bar a {
                    background-color: white !important;
                    color: #0f172a !important;
                    border: 1px solid #f1f5f9 !important;
                    border-radius: 8px !important;
                    margin-bottom: 4px;
                }
            `}</style>
        </div>
    );
}
