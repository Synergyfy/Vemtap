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
    MessageCircle,
    Tag,
    Briefcase,
    Clock,
    Zap,
    ArrowLeft,
    Check,
    X,
    ExternalLink,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

import { usePublicBusiness, usePublicBranch } from '@/services/public/hooks';
import { useCatalogueItemsPublic } from '@/services/catalogue/hooks';
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

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export default function PublicBusinessProfilePage() {
    const params = useParams();
    const codeParam = params?.code;
    const code = Array.isArray(codeParam) ? codeParam[0] : codeParam || '';

    // ─── DATA FETCHING ───
    const { data: branchData, isLoading: branchLoading, isError: branchError } = usePublicBranch(code, !!code);
    const { data: businessByCode, isLoading: businessByCodeLoading, isError: businessByCodeError } = usePublicBusiness(code, !!code);

    const rawBranchData = (branchData as any)?.data || branchData;
    const rawBusinessByCode = (businessByCode as any)?.data || businessByCode;

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

    const branchId = resolvedBranch?.id;
    const businessId = useMemo(
        () => business?.id || branch?.businessId || branchData?.business?.id,
        [branch?.businessId, branchData?.business?.id, business?.id]
    );

    // ─── NEW: INTEGRATED LIVE OFFERS ENDPOINT ───
    const { data: offersData, isLoading: offersLoading } = useQuery<any[]>({
        queryKey: ['public', 'offers', branchId],
        queryFn: async () => {
            if (!branchId) return [];
            const res = await api.get(`/catalogue/offers/public/${branchId}`);
            return Array.isArray(res) ? res : (res as any)?.data || [];
        },
        enabled: !!branchId,
    });

    // ─── NEW: INTEGRATED LIVE SERVICES ENDPOINT ───
    const { data: servicesData, isLoading: servicesLoading } = useCatalogueItemsPublic(
        branchId || '',
        { itemType: 'service' as any }
    );
    const services = useMemo(() => {
        const items = (servicesData as any)?.data || (Array.isArray(servicesData) ? servicesData : []);
        return items;
    }, [servicesData]);

    // ─── LOCAL STATE ───
    const [logoFailed, setLogoFailed] = useState(false);
    const [logoLoaded, setLogoLoaded] = useState(false);
    const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(null);
    const [leafletReady, setLeafletReady] = useState(false);
    const mapRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    // OTP Claiming Modal States
    const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
    const [claimStep, setClaimStep] = useState<'details' | 'otp' | 'success'>('details');
    const [claimForm, setClaimForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
    const [otpCode, setOtpCode] = useState('');
    const [claimingError, setClaimingError] = useState<string | null>(null);
    const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
    const [successPayload, setSuccessPayload] = useState<any | null>(null);

    // ─── GEOCODE EFFECT ───
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
        return () => { isMounted = false; };
    }, [
        business?.address, business?.city, business?.state,
        resolvedBranch?.address, resolvedBranch?.city, resolvedBranch?.state,
    ]);

    // ─── LEAFLET MAP EFFECT ───
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

    // ─── LEAFLET CSS ───
    useEffect(() => {
        const id = 'leaflet-css';
        if (!document.getElementById(id)) {
            const link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }
    }, []);

    // ─── DERIVED STATE ───
    const isLoading = branchLoading || businessByCodeLoading || (businessByBranchLoading || false);
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

    const todayIndex = new Date().getDay();
    const todayName = DAY_NAMES[todayIndex];

    const isOpenNow = useMemo(() => {
        if (!profileHours) return null;
        const todayHours = (profileHours as any)?.[todayName];
        if (!todayHours || todayHours.closed) return false;
        return true;
    }, [profileHours, todayName]);

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try { await navigator.share({ title: profileName, url }); } catch { /* cancelled */ }
        } else {
            try { await navigator.clipboard.writeText(url); } catch { /* fallback */ }
        }
    };

    const directionsUrl = mapCoords
        ? `https://www.google.com/maps/dir/?api=1&destination=${mapCoords.lat},${mapCoords.lon}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(resolvedLocationDisplay || '')}`;

    // ─── HANDLERS FOR CLAIMING PROMOTIONS ───
    const handleClaimClick = (offer: any) => {
        setSelectedOffer(offer);
        setClaimStep('details');
        setClaimForm({ firstName: '', lastName: '', email: '', phone: '' });
        setOtpCode('');
        setClaimingError(null);
    };

    const handleRequestOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOffer) return;
        setIsSubmittingClaim(true);
        setClaimingError(null);
        try {
            await api.post('/catalogue/offers/claim/request', {
                offerId: selectedOffer.id,
                firstName: claimForm.firstName,
                lastName: claimForm.lastName,
                email: claimForm.email,
                phone: claimForm.phone,
            });
            setClaimStep('otp');
        } catch (err: any) {
            setClaimingError(err?.message || 'Failed to request OTP. Please try again.');
        } finally {
            setIsSubmittingClaim(false);
        }
    };

    const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOffer) return;
        setIsSubmittingClaim(true);
        setClaimingError(null);
        try {
            const res = await api.post('/catalogue/offers/claim/verify', {
                email: claimForm.email,
                offerId: selectedOffer.id,
                code: otpCode,
            });
            setSuccessPayload(res);
            setClaimStep('success');
        } catch (err: any) {
            setClaimingError(err?.message || 'Invalid or expired code. Please verify and try again.');
        } finally {
            setIsSubmittingClaim(false);
        }
    };

    // ═══════════════════════════════════════════
    //  LOADING STATE
    // ═══════════════════════════════════════════
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <div className="w-12 h-12 rounded-full border-[3px] border-slate-200 border-t-blue-600 animate-spin" />
                <span className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-[0.25em] animate-pulse">
                    Loading Business Profile...
                </span>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    //  ERROR STATE
    // ═══════════════════════════════════════════
    if (!business && !branch && !isLoading && (branchError || businessByCodeError || businessByBranchError)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-5">
                    <MapPin className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Business Profile Not Found</h1>
                <p className="text-sm text-slate-500 max-w-sm mb-8 leading-relaxed">
                    We couldn&apos;t find a business or branch profile matching code{' '}
                    <span className="font-bold text-slate-800">{code}</span>. It may have been deactivated or the URL is invalid.
                </p>
                <a
                    href="/"
                    className="bg-blue-600 text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all"
                >
                    Return to Homepage
                </a>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    //  MAIN RESPONSIVE LAYOUT
    // ═══════════════════════════════════════════
    return (
        <div className="min-h-screen bg-slate-50/50 font-sans antialiased text-slate-800 pb-16">
            <Script
                src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
                strategy="afterInteractive"
                onLoad={() => setLeafletReady(true)}
            />

            {/* Sticky Navigation */}
            <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100/80 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto flex items-center justify-between py-3.5">
                    <a href="/" className="flex items-center gap-2.5 text-slate-900 hover:text-blue-600 transition-colors">
                        <ArrowLeft size={18} strokeWidth={2.5} />
                        <span className="text-lg font-bold tracking-tight font-display">Vemtap</span>
                    </a>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleShare}
                            className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100/80 active:scale-90 flex items-center justify-center text-slate-600 transition-all border border-slate-100"
                            aria-label="Share business profile"
                        >
                            <Share2 size={16} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero / Cover Banner */}
            <div className="w-full h-48 sm:h-64 md:h-80 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                        backgroundSize: '24px 24px',
                    }}
                />
                <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2" />
                <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
            </div>

            {/* Profile Info Header Container */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-20 sm:-mt-24">
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 sm:gap-6">
                        {/* Logo */}
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
                            {profileLogo && !logoFailed ? (
                                <img
                                    alt={profileName}
                                    className={`w-full h-full object-contain p-2.5 transition-opacity duration-300 ${logoLoaded ? 'opacity-100' : 'opacity-0'}`}
                                    src={profileLogo}
                                    onLoad={() => setLogoLoaded(true)}
                                    onError={() => setLogoFailed(true)}
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-5xl font-black italic">
                                    {profileName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Title & Reviews */}
                        <div className="flex-1 min-w-0 pt-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                                    {profileName}
                                </h1>
                                <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold w-fit mx-auto sm:mx-0">
                                    <CheckCircle2 size={13} strokeWidth={2.5} />
                                    <span>Verified</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 mt-2.5 text-sm">
                                <div className="flex items-center gap-1 font-bold text-slate-800">
                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    <span>4.9</span>
                                    <span className="text-slate-400 font-medium">(1,240 Reviews)</span>
                                </div>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-200 hidden sm:inline-block" />
                                <div className="flex items-center gap-1 text-slate-500">
                                    <MapPin size={14} className="shrink-0" />
                                    <span className="truncate">{resolvedLocationDisplay}</span>
                                </div>
                            </div>

                            {isOpenNow !== null && (
                                <div className="mt-3.5">
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold ${
                                            isOpenNow
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                : 'bg-red-50 text-red-500 border border-red-100'
                                        }`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${isOpenNow ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                        {isOpenNow ? 'Open Now' : 'Closed'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Directions Action */}
                        <div className="shrink-0 mt-2 sm:mt-0 w-full sm:w-auto">
                            <a
                                href={directionsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md shadow-blue-600/10 transition-all w-full sm:w-auto"
                            >
                                <MapPin size={16} strokeWidth={2.5} />
                                Get Directions
                            </a>
                        </div>
                    </div>

                    {/* Quick Button Controls */}
                    <div className="grid grid-cols-4 sm:flex sm:justify-start gap-4 sm:gap-8 border-t border-slate-100 mt-6 pt-5 bg-slate-50/20 rounded-2xl p-4">
                        {[
                            { icon: MessageCircle, label: 'Chat', href: profileEmail ? `mailto:${profileEmail}` : undefined },
                            { icon: Tag, label: 'Offers', href: '#offers-section' },
                            { icon: Briefcase, label: 'Services', href: '#services-section' },
                            { icon: Phone, label: 'Call', href: profilePhone ? `tel:${profilePhone}` : undefined },
                        ].map((action) => (
                            <a
                                key={action.label}
                                href={action.href || '#'}
                                className="flex flex-col items-center gap-1.5 group sm:min-w-[64px]"
                            >
                                <div className="w-11 h-11 rounded-xl bg-slate-50 group-hover:bg-blue-50 group-hover:text-blue-600 active:scale-90 flex items-center justify-center text-slate-600 transition-all border border-slate-100/50">
                                    <action.icon size={18} strokeWidth={2} />
                                </div>
                                <span className="text-[11px] font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">
                                    {action.label}
                                </span>
                            </a>
                        ))}
                    </div>
                </div>

                {/* ─── TWO-COLUMN RESPONSIVE LAYOUT ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 items-start">

                    {/* LEFT COLUMN: ABOUT, OFFERS, SERVICES */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* WHY VISIT US */}
                        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                                WHY VISIT US
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { icon: Star, value: '4.9 Rating', label: 'Top-tier score', cls: 'text-amber-500 fill-amber-500' },
                                    { icon: Gift, value: `${offersData?.length || 0} Deals`, label: 'Active promotions', cls: 'text-blue-600' },
                                    { icon: Zap, value: `${branches.length || 1} Location`, label: branches.length === 1 ? 'Central office' : 'Multi-branch setup', cls: 'text-violet-600' },
                                    { icon: Clock, value: 'Replies Fast', label: 'Under 2 min response', cls: 'text-emerald-600' },
                                ].map((stat, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-1.5"
                                    >
                                        <stat.icon className={`w-5 h-5 ${stat.cls}`} />
                                        <div className="font-extrabold text-[15px] text-slate-900 mt-1">{stat.value}</div>
                                        <div className="text-[11px] text-slate-400 font-semibold">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* ACTIVE OFFERS & PROMOTIONS */}
                        {activeShowRewards && (
                            <section id="offers-section" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-lg font-bold text-slate-900">Active Offers &amp; Promotions</h3>
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                                        {offersData?.length || 0} Total
                                    </span>
                                </div>

                                {offersLoading ? (
                                    <div className="flex justify-center py-6">
                                        <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
                                    </div>
                                ) : offersData && offersData.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {offersData.map((offer: any) => (
                                            <div
                                                key={offer.id}
                                                className="group border border-slate-100 hover:border-blue-100 bg-slate-50/50 hover:bg-white rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-sm"
                                            >
                                                <div>
                                                    <div className="flex items-start justify-between gap-3">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                                            Promo Deal
                                                        </span>
                                                        {offer.calculatedPrice !== undefined && (
                                                            <div className="text-right">
                                                                <span className="text-xs text-slate-400 line-through">
                                                                    ₦{offer.fixedPrice || offer.calculatedPrice * 1.2}
                                                                </span>
                                                                <div className="text-sm font-extrabold text-blue-600">
                                                                    ₦{offer.calculatedPrice}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <h4 className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors mt-3">
                                                        {offer.name}
                                                    </h4>
                                                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                                        {offer.description || 'Limited time promotional code claimable at store branch.'}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-3">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        Code OTP Claims
                                                    </span>
                                                    <button
                                                        onClick={() => handleClaimClick(offer)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all active:scale-95 shadow-sm shadow-blue-600/10"
                                                    >
                                                        Claim Offer
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
                                        <Gift className="w-8 h-8 text-slate-300 mx-auto mb-2.5" />
                                        <p className="text-sm font-bold text-slate-600">No active promotions</p>
                                        <p className="text-xs text-slate-400 mt-1">Check back later for exclusive deals.</p>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* OUR SERVICES */}
                        <section id="services-section" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-bold text-slate-900 font-display">Our Services</h3>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                                    {services?.length || 0} Services
                                </span>
                            </div>

                            {servicesLoading ? (
                                <div className="flex justify-center py-6">
                                    <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
                                </div>
                            ) : services && services.length > 0 ? (
                                <div className="space-y-3.5">
                                    {services.map((item: any) => (
                                        <div
                                            key={item.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-100 transition-all gap-4"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-100/30 flex items-center justify-center text-blue-600 shrink-0 text-2xl font-semibold">
                                                    ✂️
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-[15px]">
                                                        {item.name}
                                                    </h4>
                                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-md">
                                                        {item.shortDescription || item.description || 'Full professional standard service execution.'}
                                                    </p>
                                                    {item.price !== undefined && (
                                                        <div className="text-xs font-bold text-slate-800 mt-1">
                                                            Price: ₦{item.price}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                                                <a
                                                    href={profilePhone ? `tel:${profilePhone}` : `mailto:${profileEmail || ''}`}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                                                >
                                                    Book Now
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
                                    <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2.5" />
                                    <p className="text-sm font-bold text-slate-600">No listed services yet</p>
                                    <p className="text-xs text-slate-400 mt-1">Contact business to enquire about specific work.</p>
                                </div>
                            )}
                        </section>

                        {/* ABOUT US */}
                        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 mb-3.5">About Us</h3>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                {profileAbout ||
                                    `Welcome to ${profileName}! We are dedicated to providing the best experience to our customers through innovation and quality service. Join our loyalty program to earn points on every visit.`}
                            </p>
                            {profileWelcome && (
                                <div className="mt-5 p-4.5 bg-blue-50/40 rounded-2xl border border-blue-100/30 italic text-slate-600 text-sm">
                                    &ldquo;{profileWelcome}&rdquo;
                                </div>
                            )}
                        </section>

                        {/* REVIEWS SECTION */}
                        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-bold text-slate-900">Reviews &amp; Feedback</h3>
                                <button className="text-xs font-bold text-blue-600 hover:underline">Write a Review</button>
                            </div>
                            <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                        EN
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-sm text-slate-900">Emeka Nwosu</h4>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className="flex text-amber-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className="w-3 h-3 fill-amber-400" />
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-bold">2 days ago</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-3 italic leading-relaxed">
                                    &ldquo;The best service experience I&apos;ve had in Abuja. The fit for my wear was absolutely perfect and the staff are incredibly professional. Highly recommended!&rdquo;
                                </p>
                                <div className="mt-4 p-3.5 bg-blue-50/60 rounded-xl border border-blue-100/20 text-xs">
                                    <span className="font-bold text-slate-900">{profileName} (Owner):</span>
                                    <p className="text-slate-500 mt-1">
                                        Thank you so much for the kind words, Emeka! It was an absolute pleasure serving you. Looking forward to seeing you again soon.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* RIGHT COLUMN: SIDEBAR */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* OPENING HOURS */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                                OPENING HOURS
                            </h3>
                            <div className="space-y-2.5">
                                {DAY_ORDER.map((day, idx) => {
                                    const dayHours = (profileHours as any)?.[day] as BusinessHours | undefined;
                                    const isToday = day === todayName;
                                    const isClosed = !dayHours || dayHours.closed;
                                    return (
                                        <div
                                            key={day}
                                            className={`flex items-center justify-between text-xs py-2 px-2.5 rounded-xl ${
                                                isToday ? 'bg-blue-50/60' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span className={`font-bold ${isToday ? 'text-slate-900' : 'text-slate-600'}`}>
                                                    {day}
                                                </span>
                                                {isToday && (
                                                    <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-100">
                                                        Today
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`font-semibold ${isClosed ? 'text-slate-400' : 'text-slate-800'}`}>
                                                {formatHours(dayHours)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* CONTACT INFO */}
                        {(profilePhone || profileEmail || profileWebsite) && (
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                                    CONTACT DETAILS
                                </h3>
                                <div className="space-y-3.5">
                                    {profilePhone && (
                                        <a href={`tel:${profilePhone}`} className="flex items-center gap-3 group text-xs">
                                            <div className="w-8.5 h-8.5 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                <Phone size={15} />
                                            </div>
                                            <span className="font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">
                                                {profilePhone}
                                            </span>
                                        </a>
                                    )}
                                    {profileEmail && (
                                        <a href={`mailto:${profileEmail}`} className="flex items-center gap-3 group text-xs">
                                            <div className="w-8.5 h-8.5 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                <Mail size={15} />
                                            </div>
                                            <span className="font-semibold text-slate-600 group-hover:text-blue-600 transition-colors break-all">
                                                {profileEmail}
                                            </span>
                                        </a>
                                    )}
                                    {profileWebsite && (
                                        <a
                                            href={profileWebsite.startsWith('http') ? profileWebsite : `https://${profileWebsite}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 group text-xs"
                                        >
                                            <div className="w-8.5 h-8.5 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                <Globe size={15} />
                                            </div>
                                            <span className="font-semibold text-slate-600 group-hover:text-blue-600 transition-colors inline-flex items-center gap-1">
                                                {profileWebsite}
                                                <ExternalLink size={11} className="text-slate-400" />
                                            </span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* MAP & ADDRESS */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                                LOCATION FINDER
                            </h3>
                            {mapCoords && (
                                <div
                                    ref={mapRef}
                                    className="w-full h-40 rounded-2xl overflow-hidden border border-slate-150 mb-3.5"
                                />
                            )}
                            <div className="flex items-start gap-2.5 mb-4 text-xs leading-relaxed text-slate-500">
                                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                <p>{resolvedLocationDisplay}</p>
                            </div>
                            <a
                                href={directionsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-blue-600/10"
                            >
                                <MapPin size={14} strokeWidth={2.5} />
                                Get Navigation Path
                            </a>
                        </div>

                        {/* OTHER BRANCHES */}
                        {branches.length > 1 && (
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                                    OTHER BRANCHES
                                </h3>
                                <div className="space-y-2">
                                    {branches.filter((b: any) => b.id !== branchId).map((b: any) => (
                                        <div
                                            key={b.id}
                                            className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group cursor-pointer hover:bg-slate-100/55 transition-colors"
                                        >
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-bold text-slate-900 truncate">
                                                    {b.name || 'Secondary Branch'}
                                                </h4>
                                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                                    {formatLocation(b.address, b.city, b.state)}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SOCIAL FOOTER INSIDE SIDEBAR OR CONTENT */}
                        {socialItems.some((s) => s.url) && (
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3.5">
                                    FOLLOW SOCIALS
                                </h3>
                                <div className="flex justify-center gap-2.5">
                                    {socialItems
                                        .filter((s) => s.url)
                                        .map((social) => (
                                            <a
                                                key={social.key}
                                                href={social.url || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
                                                title={social.label}
                                            >
                                                {React.createElement(social.icon, { size: 16 })}
                                            </a>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Branding */}
                <div className="text-center mt-12 pt-6 border-t border-slate-200/50">
                    <p className="text-[11px] text-slate-300 font-bold uppercase tracking-[0.2em]">
                        Powered by VemTap Commerce Core
                    </p>
                </div>
            </div>

            {/* ─── NEW: OTP PROMOTION CLAIM MODAL ─── */}
            {selectedOffer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col relative">

                        {/* Close button */}
                        <button
                            onClick={() => setSelectedOffer(null)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all border border-slate-100"
                        >
                            <X size={15} />
                        </button>

                        <div className="p-6">
                            {/* Modal Header */}
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl font-bold shrink-0">
                                    🎁
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-extrabold text-slate-900 text-sm truncate">
                                        Claim: {selectedOffer.name}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                        OTP Verification Promotion Claim
                                    </p>
                                </div>
                            </div>

                            {claimingError && (
                                <div className="bg-red-50 text-red-600 text-xs px-3.5 py-2.5 rounded-xl border border-red-100 mb-4 font-semibold">
                                    {claimingError}
                                </div>
                            )}

                            {/* STEP 1: Enter details */}
                            {claimStep === 'details' && (
                                <form onSubmit={handleRequestOtpSubmit} className="space-y-3.5">
                                    <div className="grid grid-cols-2 gap-3.5">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">First Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                                                value={claimForm.firstName}
                                                onChange={(e) => setClaimForm({ ...claimForm, firstName: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Last Name</label>
                                            <input
                                                type="text"
                                                className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                                                value={claimForm.lastName}
                                                onChange={(e) => setClaimForm({ ...claimForm, lastName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                                            value={claimForm.email}
                                            onChange={(e) => setClaimForm({ ...claimForm, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                                        <input
                                            type="tel"
                                            required
                                            className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                                            value={claimForm.phone}
                                            onChange={(e) => setClaimForm({ ...claimForm, phone: e.target.value })}
                                            placeholder="+234..."
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingClaim}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-blue-600/10 mt-2"
                                    >
                                        {isSubmittingClaim ? 'Sending code...' : 'Send Verification OTP'}
                                    </button>
                                </form>
                            )}

                            {/* STEP 2: Verify OTP */}
                            {claimStep === 'otp' && (
                                <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                                    <p className="text-xs text-slate-500 leading-relaxed text-center">
                                        We sent a verification code to <span className="font-semibold text-slate-700">{claimForm.email}</span>.
                                        Please enter the code below to complete the claim.
                                    </p>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase text-center">OTP Code</label>
                                        <input
                                            type="text"
                                            required
                                            className="border border-slate-200 rounded-xl px-3 py-2.5 text-center text-sm font-bold tracking-widest focus:outline-none focus:border-blue-600 max-w-[160px] mx-auto w-full"
                                            maxLength={6}
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value)}
                                            placeholder="------"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingClaim}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-blue-600/10"
                                    >
                                        {isSubmittingClaim ? 'Verifying OTP...' : 'Verify & Claim Offer'}
                                    </button>
                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={() => setClaimStep('details')}
                                            className="text-xs text-slate-400 hover:text-slate-600 underline font-semibold"
                                        >
                                            Go Back / Edit Details
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* STEP 3: Success Screen */}
                            {claimStep === 'success' && (
                                <div className="text-center py-4 space-y-4">
                                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
                                        <Check size={28} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-slate-900 text-base">Claim Successful!</h4>
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed px-4">
                                            Your promotional offer has been secured. Save your unique verification details below to redeem this at the counter.
                                        </p>
                                    </div>

                                    {successPayload && (
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 max-w-xs mx-auto text-center space-y-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                                Claim Code
                                            </span>
                                            <div className="text-lg font-black text-slate-800 tracking-wider">
                                                {successPayload.code || successPayload.data?.code || 'CLAIMED'}
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setSelectedOffer(null)}
                                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all"
                                    >
                                        Close Window
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Leaflet Refined CSS overrides */}
            <style jsx global>{`
                .leaflet-container {
                    font-family: inherit;
                    cursor: default !important;
                    filter: contrast(1.05);
                }
                .leaflet-bar {
                    border: none !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
                    margin: 12px !important;
                }
                .leaflet-bar a {
                    background-color: white !important;
                    color: #0f172a !important;
                    border: 1px solid #f1f5f9 !important;
                    border-radius: 8px !important;
                    margin-bottom: 4px;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.96); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
}
