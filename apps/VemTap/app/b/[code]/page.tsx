'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { usePublicBusiness, usePublicBranch } from '@/services/public/hooks';
import { useCatalogueItemsPublic } from '@/services/catalogue/hooks';
import { normalizeDayHours } from '@/lib/businessHours';
import { ChatConnectModal } from '@/components/visitor/ChatConnectModal';
import ClaimDealModal from '@/components/storefront/ClaimDealModal';
import QuickActionsSheet from '@/components/storefront/QuickActionsSheet';
import ShareSheet from '@/components/storefront/ShareSheet';
import PublicBottomNav from '@/components/public/PublicBottomNav';
import HamburgerMenu from '@/components/public/HamburgerMenu';

const formatLocation = (address?: string | null, city?: string | null, state?: string | null) => {
    const parts = [address, city, state].filter((part) => part && String(part).trim().length > 0);
    return parts.length > 0 ? parts.join(', ') : 'Location not provided';
};

const formatNaira = (value: number | string | null | undefined) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '₦0';
    return `₦${num.toLocaleString('en-NG')}`;
};

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

const FALLBACK_COVERS = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=400&fit=crop',
];

const SECTOR_COVERS: Record<string, string> = {
    food: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop',
    restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop',
    dining: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=400&fit=crop',
    cafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=400&fit=crop',
    bar: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&h=400&fit=crop',
    beauty: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=400&fit=crop',
    spa: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=800&h=400&fit=crop',
    salon: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=400&fit=crop',
    fashion: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop',
    clothing: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop',
    retail: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&h=400&fit=crop',
    tech: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop',
    electronics: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&h=400&fit=crop',
    fitness: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop',
    gym: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop',
    health: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=400&fit=crop',
    medical: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=400&fit=crop',
    home: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=400&fit=crop',
    furniture: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=400&fit=crop',
    automotive: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=400&fit=crop',
    education: 'https://images.unsplash.com/photo-1523050854058-8df90110c8f1?w=800&h=400&fit=crop',
    events: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=400&fit=crop',
    photography: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=400&fit=crop',
    travel: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop',
    real_estate: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=400&fit=crop',
    default: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop',
};

const FALLBACK_PRODUCTS = [
    { name: 'Signature Dish', price: 5000, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=240&fit=crop' },
    { name: 'Special Combo', price: 8500, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=240&fit=crop' },
    { name: 'Premium Platter', price: 12000, image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&h=240&fit=crop' },
];

const FALLBACK_DEALS = [
    { title: 'Special Offer', description: 'Limited time deal for our valued customers.', badge: '20% OFF', badgeColor: '#ffdad6' },
    { title: 'Combo Deal', description: 'Get a free drink with any two items.', badge: 'FREE DRINK', badgeColor: '#066cf4' },
];

export default function PublicBusinessProfilePage() {
    const params = useParams();
    const router = useRouter();
    const authUser = useAuthStore((s) => s.user);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
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

    // ─── OFFERS ───
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

    // ─── SERVICES ───
    const { data: servicesData, isLoading: servicesLoading } = useCatalogueItemsPublic(
        branchId || '',
        { itemType: 'service' as any }
    );
    const services = useMemo(() => {
        const items = (servicesData as any)?.data || (Array.isArray(servicesData) ? servicesData : []);
        return items;
    }, [servicesData]);

    // ─── PRODUCTS ───
    const { data: productsData, isLoading: productsLoading } = useCatalogueItemsPublic(
        branchId || '',
        { itemType: 'product' as any }
    );
    const products = useMemo(() => {
        const items = (productsData as any)?.data || (Array.isArray(productsData) ? productsData : []);
        return items;
    }, [productsData]);

    // ─── LOCAL STATE ───
    const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(null);
    const [showChatModal, setShowChatModal] = useState(false);
    const [isRecordingVisit, setIsRecordingVisit] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
    const [claimStep, setClaimStep] = useState<'details' | 'otp' | 'success'>('details');
    const [claimForm, setClaimForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
    const [otpCode, setOtpCode] = useState('');
    const [claimingError, setClaimingError] = useState<string | null>(null);
    const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
    const [successPayload, setSuccessPayload] = useState<any | null>(null);
    const [showShareSheet, setShowShareSheet] = useState(false);
    const [showActionsSheet, setShowActionsSheet] = useState(false);
    const [showActionSheet, setShowActionSheet] = useState(false);

    // ─── LEAFLET MAP ───
    const [leafletReady, setLeafletReady] = useState(false);
    const mapRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    useEffect(() => {
        const initMap = () => {
            if (!mapRef.current || !mapCoords || !leafletReady) return;
            const leaflet = (window as typeof window & { L?: any }).L;
            if (!leaflet) return;
            if (!mapInstanceRef.current) {
                mapInstanceRef.current = leaflet.map(mapRef.current).setView([mapCoords.lat, mapCoords.lon], 15);
                leaflet
                    .tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; OpenStreetMap contributors',
                    })
                    .addTo(mapInstanceRef.current);
                markerRef.current = leaflet.marker([mapCoords.lat, mapCoords.lon]).addTo(mapInstanceRef.current);
            } else {
                mapInstanceRef.current.setView([mapCoords.lat, mapCoords.lon], 15);
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

    // ─── GEOCODE EFFECT ───
    useEffect(() => {
        let isMounted = true;
        const rawAddress = formatLocation(
            resolvedBranch?.address || business?.address,
            resolvedBranch?.city || business?.city,
            resolvedBranch?.state || business?.state
        );
        if (!rawAddress || rawAddress === 'Location not provided') {
            // Default to Abuja center if no address
            if (isMounted) setMapCoords({ lat: 9.0579, lon: 7.4951 });
            return;
        }
        // Clean duplicate parts (e.g. "Asokoro, Asokoro, Asokoro" → "Asokoro")
        const cleanAddress = rawAddress
            .split(',')
            .map(s => s.trim())
            .filter((v, i, arr) => arr.indexOf(v) === i)
            .join(', ');

        const lookup = async (query: string) => {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=ng`,
                    { headers: { 'Accept-Language': 'en' } }
                );
                if (!response.ok) return false;
                const data = await response.json();
                if (Array.isArray(data) && data[0] && isMounted) {
                    setMapCoords({ lat: Number(data[0].lat), lon: Number(data[0].lon) });
                    return true;
                }
                return false;
            } catch {
                return false;
            }
        };

        const run = async () => {
            // Try cleaned full address first
            let found = await lookup(cleanAddress);
            // If failed, try just city + state
            if (!found) {
                const city = resolvedBranch?.city || business?.city || '';
                const state = resolvedBranch?.state || business?.state || '';
                if (city || state) {
                    found = await lookup(`${city}${city && state ? ', ' : ''}${state}, Nigeria`);
                }
            }
            // If still failed, try just state + Nigeria
            if (!found) {
                const state = resolvedBranch?.state || business?.state || '';
                if (state) {
                    found = await lookup(`${state}, Nigeria`);
                }
            }
            // Last resort: default to Abuja
            if (!found && isMounted) {
                setMapCoords({ lat: 9.0579, lon: 7.4951 });
            }
        };
        run();
        return () => { isMounted = false; };
    }, [
        business?.address, business?.city, business?.state,
        resolvedBranch?.address, resolvedBranch?.city, resolvedBranch?.state,
    ]);

    // ─── DERIVED STATE ───
    const isLoading = branchLoading || businessByCodeLoading || (businessByBranchLoading || false);

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

    const profileCover = useMemo(() => {
        const branchAny = resolvedBranch as any;
        const businessAny = business as any;
        return (
            branchAny?.coverImage ||
            businessAny?.coverImage ||
            businessAny?.photos?.[0] ||
            branchAny?.photos?.[0] ||
            ''
        );
    }, [business, resolvedBranch]);

    const profileCategory = useMemo(() => {
        const businessAny = business as any;
        const cat = businessAny?.category;
        if (typeof cat === 'string') return cat.toLowerCase();
        if (cat?.name) return cat.name.toLowerCase();
        if (cat?.slug) return cat.slug.toLowerCase();
        return '';
    }, [business]);

    const sectorCover = useMemo(() => {
        if (!profileCategory) return SECTOR_COVERS.default;
        const match = Object.keys(SECTOR_COVERS).find(
            (key) => key !== 'default' && profileCategory.includes(key)
        );
        return match ? SECTOR_COVERS[match] : SECTOR_COVERS.default;
    }, [profileCategory]);

    const profileWhatsapp = useMemo(() => {
        return resolvedBranch?.whatsappNumber || (business as any)?.whatsappNumber || null;
    }, [business, resolvedBranch]);

    const profileEmail = resolvedBranch?.officialEmail || business?.officialEmail || (business as any)?.email || (business as any)?.owner?.email;
    const profilePhone = resolvedBranch?.phone || business?.phone || (business as any)?.owner?.phone;
    const profileAbout = resolvedBranch?.about || business?.about || business?.goal || (business as any)?.description;

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

    const directionsUrl = mapCoords
        ? `https://www.google.com/maps/dir/?api=1&destination=${mapCoords.lat},${mapCoords.lon}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(resolvedLocationDisplay || '')}`;

    const activeShowRewards = resolvedBranch?.showRewards ?? business?.showRewards ?? true;
    const activeOffers = useMemo(() => (offersData || []).slice(0, 6), [offersData]);
    const activeProducts = useMemo(() => (products || []).slice(0, 8), [products]);

    // ─── HANDLERS ───
    const handleShare = () => {
        setShowActionsSheet(false);
        setShowShareSheet(true);
    };

    const handleChatClick = () => {
        if (isAuthenticated) {
            router.push(`/customer/messaging/chat?businessId=${businessId || ''}`);
        } else {
            setShowChatModal(true);
        }
    };

    const handleChatModalSuccess = async () => {
        setShowChatModal(false);
        setIsRecordingVisit(true);
        try {
            await new Promise((r) => setTimeout(r, 300));
            const branchCode = resolvedBranch?.uniqueCode;
            if (branchCode) {
                const deviceContext = await api.get(`/tap/context/${branchCode}`);
                const deviceCode = deviceContext?.device?.code;
                if (deviceCode) {
                    await api.post('/visitors/portal-visit', { deviceCode });
                }
            }
        } catch {
            // Continue even if visit recording fails
        } finally {
            setIsRecordingVisit(false);
            router.push(`/customer/messaging/chat?businessId=${businessId || ''}`);
        }
    };

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

    // ─── OFFER BADGE HELPER ───
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

    // ═══════════════════════════════════════════
    //  LOADING STATE
    // ═══════════════════════════════════════════
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#f7f9fb' }}>
                <div className="w-12 h-12 rounded-full border-[3px] border-[#c2c6d7] border-t-[#0055c4] animate-spin" />
                <span className="mt-4 text-xs font-bold text-[#727786] uppercase tracking-[0.25em] animate-pulse">
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
            <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#f7f9fb' }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: '#ffdad6' }}>
                    <span className="material-symbols-outlined text-[32px]" style={{ color: '#ba1a1a' }}>location_off</span>
                </div>
                <h1 className="text-[24px] font-bold mb-2" style={{ color: '#191c1e' }}>Business Profile Not Found</h1>
                <p className="text-[14px] max-w-sm mb-8 leading-relaxed" style={{ color: '#424655' }}>
                    We couldn&apos;t find a business or branch profile matching code{' '}
                    <span className="font-bold" style={{ color: '#191c1e' }}>{code}</span>. It may have been deactivated or the URL is invalid.
                </p>
                <a
                    href="/"
                    className="text-[14px] font-semibold px-8 py-3.5 rounded-full shadow-lg transition-all active:scale-95"
                    style={{ background: '#0055c4', color: '#ffffff' }}
                >
                    Return to Homepage
                </a>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    //  MAIN LAYOUT (Stitch pixel-perfect)
    // ═══════════════════════════════════════════
    const coverSrc = profileCover || sectorCover;

    return (
        <div className="min-h-screen" style={{ background: '#f7f9fb', color: '#191c1e', fontFamily: 'Inter, sans-serif' }}>
            {/* ─── TopAppBar ─── */}
            <header
                className="fixed top-0 w-full z-50 flex items-center justify-between"
                style={{
                    background: '#f7f9fb',
                    borderBottom: '1px solid #c2c6d7',
                    padding: '0 20px',
                    height: 56,
                }}
            >
                <button
                    onClick={() => router.back()}
                    className="flex items-center justify-center w-8 h-8 rounded-full transition-colors active:scale-95"
                    style={{ color: '#0055c4' }}
                    aria-label="Go back"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-[20px] font-bold truncate mx-4" style={{ color: '#0055c4' }}>
                    Business Profile
                </h1>
                <button
                    onClick={handleShare}
                    className="flex items-center justify-center w-8 h-8 rounded-full transition-colors active:scale-95"
                    style={{ color: '#0055c4' }}
                    aria-label="Share"
                >
                    <span className="material-symbols-outlined">share</span>
                </button>
            </header>

            {/* ─── Main Content ─── */}
            <main style={{ paddingTop: 56, paddingBottom: 80 }}>
                {/* Hero Section */}
                <div className="relative w-full" style={{ height: 240, background: '#e6e8ea' }}>
                    <img
                        alt={`${profileName} Cover`}
                        className="w-full h-full object-cover"
                        src={coverSrc}
                    />
                    {/* Logo Overlay */}
                    <div
                        className="absolute rounded-full shadow-sm"
                        style={{
                            bottom: -40,
                            left: 20,
                            width: 96,
                            height: 96,
                            background: '#ffffff',
                            padding: 4,
                            border: '1px solid #c2c6d7',
                        }}
                    >
                        {profileLogo ? (
                            <img
                                alt={`${profileName} Logo`}
                                className="w-full h-full rounded-full object-cover"
                                src={profileLogo}
                            />
                        ) : (
                            <div
                                className="w-full h-full rounded-full flex items-center justify-center"
                                style={{ background: '#eceef0' }}
                            >
                                <span className="material-symbols-outlined text-[32px]" style={{ color: '#727786' }}>
                                    store
                                </span>
                            </div>
                        )}
                    </div>
                    {/* Status Badge */}
                    <div
                        className="absolute flex items-center gap-1 rounded-full shadow-sm"
                        style={{
                            bottom: 16,
                            right: 20,
                            background: '#ffffff',
                            padding: '4px 12px',
                        }}
                    >
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ background: isOpenNow ? '#10B981' : '#ba1a1a' }}
                        />
                        <span
                            className="text-[12px] font-medium"
                            style={{ color: isOpenNow ? '#10B981' : '#ba1a1a' }}
                        >
                            {isOpenNow === null ? 'Hours N/A' : isOpenNow ? 'Open Now' : 'Closed'}
                        </span>
                    </div>
                </div>

                {/* Business Info */}
                <div style={{ padding: '52px 20px 24px', borderBottom: '1px solid #c2c6d7' }}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="min-w-0 flex-1 mr-3">
                            <h2 className="text-[24px] font-semibold leading-[32px] tracking-tight mb-1" style={{ color: '#191c1e' }}>
                                {profileName}
                            </h2>
                            <p className="text-[14px] leading-[20px] flex items-center gap-1" style={{ color: '#424655' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
                                {resolvedLocationDisplay}
                            </p>
                        </div>
                        <button
                            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-95 shrink-0"
                            style={{ border: '1px solid #c2c6d7', color: '#0055c4' }}
                            aria-label="Save business"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>favorite_border</span>
                        </button>
                    </div>

                    {profileAbout && (
                        <p className="text-[14px] leading-[20px] mb-6 line-clamp-2" style={{ color: '#191c1e' }}>
                            {profileAbout}
                        </p>
                    )}

                    {/* Quick Actions */}
                    <div className="flex gap-3">
                        <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-[14px] font-semibold rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            style={{
                                background: '#0055c4',
                                color: '#ffffff',
                                height: 48,
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>directions</span>
                            Directions
                        </a>
                        <button
                            onClick={handleChatClick}
                            className="flex-1 text-[14px] font-semibold rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            style={{
                                border: '1px solid #0055c4',
                                color: '#0055c4',
                                height: 48,
                                background: 'transparent',
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>call</span>
                            Contact
                        </button>
                    </div>
                </div>

                {/* ─── Active Deals (Horizontal Rail) ─── */}
                {activeShowRewards && (activeOffers.length > 0 || offersLoading) && (
                    <section style={{ padding: '24px 0', borderBottom: '1px solid #c2c6d7' }}>
                        <div className="flex justify-between items-center mb-4" style={{ padding: '0 20px' }}>
                            <h3 className="text-[20px] font-semibold tracking-tight" style={{ color: '#191c1e' }}>
                                Active Deals
                            </h3>
                            <Link href="/deals" className="text-[14px] font-semibold" style={{ color: '#0055c4' }}>
                                See All
                            </Link>
                        </div>
                        <div
                            className="flex overflow-x-auto gap-4 pb-2"
                            style={{ scrollbarWidth: 'none', paddingLeft: 20, paddingRight: 20 }}
                        >
                            {offersLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="shrink-0 rounded-xl p-4 animate-pulse"
                                        style={{
                                            minWidth: 280,
                                            background: '#ffffff',
                                            border: '1px solid #c2c6d7',
                                        }}
                                    >
                                        <div className="h-5 rounded w-16 mb-3" style={{ background: '#eceef0' }} />
                                        <div className="h-4 rounded w-3/4 mb-2" style={{ background: '#eceef0' }} />
                                        <div className="h-3 rounded w-full mb-4" style={{ background: '#eceef0' }} />
                                        <div className="h-4 rounded w-24" style={{ background: '#eceef0' }} />
                                    </div>
                                ))
                            ) : activeOffers.length > 0 ? (
                                activeOffers.map((offer: any) => {
                                    const badge = getOfferBadge(offer);
                                    return (
                                        <div
                                            key={offer.id}
                                            className="shrink-0 rounded-xl p-4 flex flex-col justify-between"
                                            style={{
                                                minWidth: 280,
                                                background: '#ffffff',
                                                border: '1px solid #c2c6d7',
                                            }}
                                        >
                                            <div>
                                                {badge && (
                                                    <div
                                                        className="text-[12px] font-medium px-2 py-1 rounded-md inline-block mb-2"
                                                        style={{ background: badge.bg, color: badge.bg === '#ffdad6' ? '#93000a' : badge.bg === '#d1fae5' ? '#065f46' : '#fcfaff' }}
                                                    >
                                                        {badge.label}
                                                    </div>
                                                )}
                                                <h4 className="text-[14px] font-semibold mb-1" style={{ color: '#191c1e' }}>
                                                    {offer.title || offer.name || 'Deal'}
                                                </h4>
                                                <p className="text-[14px] line-clamp-2 mb-3" style={{ color: '#424655' }}>
                                                    {offer.description || offer.shortDescription || 'Limited time offer.'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleClaimClick(offer)}
                                                className="text-[14px] font-semibold flex items-center gap-1 w-fit active:scale-95 transition-transform"
                                                style={{ color: '#0055c4' }}
                                            >
                                                Claim Deal
                                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                FALLBACK_DEALS.map((deal, i) => (
                                    <div
                                        key={i}
                                        className="shrink-0 rounded-xl p-4 flex flex-col justify-between"
                                        style={{
                                            minWidth: 280,
                                            background: '#ffffff',
                                            border: '1px solid #c2c6d7',
                                        }}
                                    >
                                        <div>
                                            <div
                                                className="text-[12px] font-medium px-2 py-1 rounded-md inline-block mb-2"
                                                style={{ background: deal.badgeColor, color: deal.badgeColor === '#ffdad6' ? '#93000a' : '#fcfaff' }}
                                            >
                                                {deal.badge}
                                            </div>
                                            <h4 className="text-[14px] font-semibold mb-1" style={{ color: '#191c1e' }}>
                                                {deal.title}
                                            </h4>
                                            <p className="text-[14px] line-clamp-2 mb-3" style={{ color: '#424655' }}>
                                                {deal.description}
                                            </p>
                                        </div>
                                        <span className="text-[14px] font-semibold flex items-center gap-1 w-fit" style={{ color: '#0055c4' }}>
                                            Claim Deal
                                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                )}

                {/* ─── Popular Products (Horizontal Rail) ─── */}
                {(productsLoading || activeProducts.length > 0) && (
                    <section style={{ padding: '24px 0', borderBottom: '1px solid #c2c6d7' }}>
                        <div className="flex justify-between items-center mb-4" style={{ padding: '0 20px' }}>
                            <h3 className="text-[20px] font-semibold tracking-tight" style={{ color: '#191c1e' }}>
                                Popular Menu Items
                            </h3>
                        </div>
                        <div
                            className="flex overflow-x-auto gap-4 pb-2"
                            style={{ scrollbarWidth: 'none', paddingLeft: 20, paddingRight: 20 }}
                        >
                            {productsLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="shrink-0 animate-pulse" style={{ minWidth: 160, maxWidth: 160 }}>
                                        <div className="w-full rounded-lg mb-2" style={{ height: 120, background: '#eceef0' }} />
                                        <div className="h-4 rounded w-3/4 mb-1" style={{ background: '#eceef0' }} />
                                        <div className="h-5 rounded w-1/2" style={{ background: '#eceef0' }} />
                                    </div>
                                ))
                            ) : activeProducts.length > 0 ? (
                                activeProducts.map((product: any, idx: number) => (
                                    <div key={product.id || idx} className="shrink-0" style={{ minWidth: 160, maxWidth: 160 }}>
                                        <div
                                            className="w-full rounded-lg overflow-hidden mb-2"
                                            style={{ height: 120, background: '#eceef0' }}
                                        >
                                            {(product.mainImage || product.image || product.galleryImages?.[0]) ? (
                                                <img
                                                    alt={product.name || 'Product'}
                                                    className="w-full h-full object-cover"
                                                    src={product.mainImage || product.image || product.galleryImages?.[0]}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[32px]" style={{ color: '#727786' }}>
                                                        image
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <h4 className="text-[14px] font-semibold truncate" style={{ color: '#191c1e' }}>
                                            {product.name || 'Product'}
                                        </h4>
                                        <p className="text-[20px] font-bold mt-1" style={{ color: '#0055c4' }}>
                                            {product.calculatedPrice != null
                                                ? formatNaira(product.calculatedPrice)
                                                : product.fixedPrice != null
                                                    ? formatNaira(product.fixedPrice)
                                                    : 'View Price'}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                FALLBACK_PRODUCTS.map((product, idx) => (
                                    <div key={idx} className="shrink-0" style={{ minWidth: 160, maxWidth: 160 }}>
                                        <div
                                            className="w-full rounded-lg overflow-hidden mb-2"
                                            style={{ height: 120, background: '#eceef0' }}
                                        >
                                            <img
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                                src={product.image}
                                            />
                                        </div>
                                        <h4 className="text-[14px] font-semibold truncate" style={{ color: '#191c1e' }}>
                                            {product.name}
                                        </h4>
                                        <p className="text-[20px] font-bold mt-1" style={{ color: '#0055c4' }}>
                                            {formatNaira(product.price)}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                )}

                {/* ─── Location Map (Leaflet) ─── */}
                <Script
                    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
                    strategy="afterInteractive"
                    onLoad={() => setLeafletReady(true)}
                />
                <section style={{ padding: '24px 20px' }}>
                    <h3 className="text-[20px] font-semibold tracking-tight mb-4" style={{ color: '#191c1e' }}>
                        Location
                    </h3>
                    <div
                        ref={mapRef}
                        className="w-full rounded-xl overflow-hidden"
                        style={{ height: 160, border: '1px solid #c2c6d7' }}
                    />
                    <p className="text-[14px] leading-[20px] mt-2" style={{ color: '#424655' }}>
                        {resolvedLocationDisplay}
                    </p>
                </section>
            </main>

            <PublicBottomNav />

            {/* ─── OTP CLAIM MODAL ─── */}
            {selectedOffer && (
                <ClaimDealModal
                    offer={selectedOffer}
                    step={claimStep}
                    form={claimForm}
                    otpCode={otpCode}
                    error={claimingError}
                    isSubmitting={isSubmittingClaim}
                    successPayload={successPayload}
                    onClose={() => setSelectedOffer(null)}
                    onFormChange={(field, value) => setClaimForm({ ...claimForm, [field]: value })}
                    onOtpChange={setOtpCode}
                    onRequestOtp={handleRequestOtpSubmit}
                    onVerifyOtp={handleVerifyOtpSubmit}
                    onBackToDetails={() => setClaimStep('details')}
                />
            )}

            {/* ─── Chat Auth Modal ─── */}
            <ChatConnectModal
                isOpen={showChatModal}
                onClose={() => setShowChatModal(false)}
                onSuccess={handleChatModalSuccess}
                storeName={profileName}
                logoUrl={profileLogo}
            />

            {/* ─── Storefront Sheets ─── */}
            <QuickActionsSheet
                isOpen={showActionsSheet}
                onClose={() => setShowActionsSheet(false)}
                businessCode={code}
                businessName={profileName}
                businessLogo={profileLogo}
                phone={profilePhone}
                whatsapp={profileWhatsapp}
                onShare={handleShare}
            />
            <ShareSheet
                isOpen={showShareSheet}
                onClose={() => setShowShareSheet(false)}
                businessName={profileName}
                businessLogo={profileLogo}
                pageUrl={typeof window !== 'undefined' ? window.location.href : ''}
            />

            {/* ─── Floating Action Button ─── */}
            <button
                onClick={() => setShowActionSheet(true)}
                className="fixed z-50 flex items-center justify-center rounded-full shadow-lg active:scale-95 transition-all"
                style={{
                    bottom: 80,
                    right: 20,
                    width: 56,
                    height: 56,
                    background: 'linear-gradient(135deg, #0055c4, #0041a8)',
                    color: '#ffffff',
                    boxShadow: '0 4px 20px rgba(0, 85, 196, 0.4)',
                }}
                aria-label="Quick actions"
            >
                <span className="material-symbols-outlined" style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}>
                    apps
                </span>
            </button>

            {/* ─── Action Sheet Overlay ─── */}
            {showActionSheet && (
                <div
                    className="fixed inset-0 z-[60] flex items-end justify-center"
                    style={{ background: 'rgba(0,0,0,0.4)' }}
                    onClick={() => setShowActionSheet(false)}
                >
                    <div
                        className="w-full max-w-lg rounded-t-2xl overflow-hidden"
                        style={{ background: '#ffffff' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 rounded-full" style={{ background: '#c2c6d7' }} />
                        </div>

                        {/* Title */}
                        <div className="px-5 pb-4">
                            <h3 className="text-[18px] font-semibold" style={{ color: '#191c1e' }}>
                                Quick Actions
                            </h3>
                            <p className="text-[13px] mt-0.5" style={{ color: '#424655' }}>
                                {profileName}
                            </p>
                        </div>

                        {/* Action Items */}
                        <div className="px-5 pb-6 grid grid-cols-2 gap-3">
                            {[
                                {
                                    icon: 'local_offer',
                                    label: 'Business Deals',
                                    desc: 'View active offers',
                                    href: `/b/${code}/deals`,
                                    bg: '#066cf4',
                                },
                                {
                                    icon: 'schedule',
                                    label: 'Opening Hours',
                                    desc: 'See when we\'re open',
                                    href: `/b/${code}/hours`,
                                    bg: '#10B981',
                                },
                                {
                                    icon: 'home_repair_service',
                                    label: 'Services',
                                    desc: 'Browse our services',
                                    href: `/b/${code}/services`,
                                    bg: '#8B5CF6',
                                },
                                {
                                    icon: 'inventory_2',
                                    label: 'Products',
                                    desc: 'Shop our products',
                                    href: `/b/${code}/products`,
                                    bg: '#F59E0B',
                                },
                            ].map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all active:scale-95"
                                    style={{
                                        background: '#f7f9fb',
                                        border: '1px solid #e6e8ea',
                                    }}
                                    onClick={() => setShowActionSheet(false)}
                                >
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center"
                                        style={{ background: `${item.bg}15` }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 24, color: item.bg }}>
                                            {item.icon}
                                        </span>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-[13px] font-semibold block" style={{ color: '#191c1e' }}>
                                            {item.label}
                                        </span>
                                        <span className="text-[11px]" style={{ color: '#727786' }}>
                                            {item.desc}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
