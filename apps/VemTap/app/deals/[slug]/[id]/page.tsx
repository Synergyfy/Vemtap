'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle, MapPin, Gift } from 'lucide-react';
import ImageGallery from '@/components/ui/ImageGallery';
import ShareDealModal from '@/components/promotions/ShareDealModal';
import DealEngagementBar from '@/components/deals/DealEngagementBar';
import ReviewSection from '@/components/deals/ReviewSection';
import WriteReviewModal from '@/components/deals/WriteReviewModal';
import ClaimDealModal from '@/components/deals/ClaimDealModal';
import { usePublicOfferDetails } from '@/services/deals/hooks';
import { useEngagement, useToggleSave } from '@/services/deals/engagement-hooks';
import { formatDealPrice } from '@/lib/promotions';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchContextByUsername } from '@/lib/api/devices';
import { useLocation } from '@/hooks/useLocation';
import DealsToolbar from '@/components/deals/DealsToolbar';
import { haversineDistance, formatDistance, getDirectionsUrl } from '@/lib/distance';

function formatDateLong(dateStr: string): string {
    if (!dateStr) return 'Ongoing';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Ongoing';
    return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function DealDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const slug = params.slug as string;
    const id = params.id as string;

    const isGiftRef = searchParams?.get('ref') === 'gift';
    const giftEmail = searchParams?.get('email') || '';
    const giftSender = searchParams?.get('sender') || 'A friend';

    const { data: offer, isLoading } = usePublicOfferDetails(id);
    const { isAuthenticated, user } = useAuthStore();
    const toggleSave = useToggleSave(id);
    const { data: engagement } = useEngagement(id);
    const { lat: userLat, lng: userLng, hasLocation, label: userLocationLabel } = useLocation();
    const userRole = user?.role?.toLowerCase();
    const dashboardHref = userRole === 'admin' ? '/admin/dashboard' : userRole === 'agent' ? '/agent/dashboard' : userRole === 'customer' ? '/customer/dashboard' : '/dashboard';

    const [showShareModal, setShowShareModal] = useState(false);
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [showWriteReviewModal, setShowWriteReviewModal] = useState(false);
    const [branchId, setBranchId] = useState<string | null>(null);
    const [topBarBg, setTopBarBg] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const isSaved = engagement?.isSaved ?? false;

    const resolvedBusiness = useMemo(() => {
        if (!offer) return null;
        const b = offer.business;
        const br = offer.branch;
        const brBiz = offer.branch?.business;

        const name = b?.name || brBiz?.name || br?.name || 'Business';
        const address =
            b?.address ||
            br?.address ||
            brBiz?.address ||
            [br?.address, br?.city, br?.state].filter(Boolean).join(', ') ||
            '';
        const latitude = b?.latitude ?? br?.latitude ?? brBiz?.latitude;
        const longitude = b?.longitude ?? br?.longitude ?? brBiz?.longitude;
        const categoryName = b?.categoryName || brBiz?.category?.name || 'Deal';
        const isVerified = b?.isVerified ?? brBiz?.isVerified ?? false;
        const phone = b?.phone || br?.phone || brBiz?.phone;
        const rating = b?.rating ?? (offer as any).averageRating;
        const totalReviews = b?.totalReviews ?? (offer as any).reviewsCount;
        const logo = b?.logo || brBiz?.logoUrl;
        const photos = b?.photos || offer.galleryImages || [];

        return {
            id: b?.id || brBiz?.id || br?.id || id,
            name,
            slug: slug || b?.slug || br?.uniqueCode || '',
            address,
            city: b?.city || br?.city || brBiz?.city,
            state: br?.state || brBiz?.state,
            photos,
            categoryName,
            rating,
            totalReviews,
            isVerified,
            latitude,
            longitude,
            phone,
            logo,
        };
    }, [offer, slug, id]);

    const business = resolvedBusiness;
    const effectiveBusiness = business || {
        id,
        name: 'Business',
        slug: slug || '',
        address: '',
        photos: [],
        categoryName: 'Deal',
        rating: undefined,
        totalReviews: undefined,
        isVerified: false,
        latitude: undefined,
        longitude: undefined,
        phone: undefined,
    };

    const distance =
        hasLocation && userLat != null && userLng != null && effectiveBusiness.latitude != null && effectiveBusiness.longitude != null
            ? formatDistance(haversineDistance(userLat, userLng, effectiveBusiness.latitude, effectiveBusiness.longitude))
            : null;

    const directionsHref =
        hasLocation && userLat != null && userLng != null && effectiveBusiness.latitude != null && effectiveBusiness.longitude != null
            ? getDirectionsUrl(userLat, userLng, effectiveBusiness.latitude, effectiveBusiness.longitude)
            : null;

    const normalizedOffer = useMemo(() => {
        if (!offer) return null;
        return {
            id: offer.id,
            name: offer.name,
            mainImage: offer.mainImage,
            galleryImages: offer.galleryImages || [],
            longDescription: offer.longDescription || offer.description,
            description: offer.description,
            calculatedPrice: offer.calculatedPrice,
            pricingType: offer.pricingType,
            discountValue: offer.discountValue,
            discountPercent: offer.discountPercent,
            discountLabel: offer.discountPercent
              ? `${offer.discountPercent}% OFF`
              : offer.discountValue && offer.pricingType === 'percentage_discount'
                ? `${offer.discountValue}% OFF`
                : offer.discountValue && offer.pricingType === 'fixed_discount_price'
                  ? `${formatDealPrice(offer.discountValue)} OFF`
                  : null,
            endDate: offer.endDate,
            isExpired: offer.isExpired,
            claimedCount: offer.claimedCount,
            maxClaims: offer.maxClaims,
            terms: offer.terms || [],
            business: effectiveBusiness,
            branchId: offer.branchId,
            branch: offer.branch,
        };
    }, [offer, effectiveBusiness]);
    const effectiveNormalizedOffer = normalizedOffer || {
        id,
        name: 'Deal',
        mainImage: '',
        galleryImages: [],
        longDescription: '',
        description: '',
        calculatedPrice: 0,
        pricingType: 'percentage_discount' as const,
        discountValue: null,
        discountPercent: undefined,
        discountLabel: null,
        endDate: undefined,
        isExpired: false,
        claimedCount: 0,
        maxClaims: 0,
        terms: [],
        business: effectiveBusiness,
        branchId: undefined,
        branch: undefined,
    };
    const photos = useMemo(() => {
        const result = [...(business?.photos || [])];
        if (effectiveNormalizedOffer?.mainImage && !result.includes(effectiveNormalizedOffer.mainImage)) result.unshift(effectiveNormalizedOffer.mainImage);
        if (effectiveNormalizedOffer?.galleryImages?.length) {
            effectiveNormalizedOffer.galleryImages.forEach((img: string) => { if (!result.includes(img)) result.push(img); });
        }
        return result;
    }, [business, effectiveNormalizedOffer]);

    const discountPercent = effectiveNormalizedOffer?.pricingType === 'percentage_discount' && effectiveNormalizedOffer.discountValue
        ? effectiveNormalizedOffer.discountValue : undefined;
    const discountAmount = effectiveNormalizedOffer?.pricingType === 'fixed_discount_price' && effectiveNormalizedOffer.discountValue
        ? effectiveNormalizedOffer.discountValue : undefined;

    const originalPrice = useMemo(() => {
        if (!effectiveNormalizedOffer) return 0;
        if (discountPercent) return Math.round(effectiveNormalizedOffer.calculatedPrice / (1 - discountPercent / 100));
        if (discountAmount) return effectiveNormalizedOffer.calculatedPrice + discountAmount;
        return effectiveNormalizedOffer.calculatedPrice;
    }, [effectiveNormalizedOffer, discountPercent, discountAmount]);

    const savings = originalPrice - (effectiveNormalizedOffer?.calculatedPrice || 0);

    const dealUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/deals/${business?.slug || ''}/${effectiveNormalizedOffer?.id || id}`
        : '';

    const handleScroll = useCallback(() => {
        setTopBarBg(window.scrollY > 50);
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // Fetch branchId for claim flow
    useEffect(() => {
        if (!slug) return;
        fetchContextByUsername(slug)
            .then((ctx) => setBranchId(ctx.branch?.id || ctx.business?.id))
            .catch(() => {});
    }, [slug]);

    const handleSave = async () => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        try {
            await toggleSave.mutateAsync();
        } catch {}
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (!q) return;
        router.push(`/deals?q=${encodeURIComponent(q)}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center pb-32">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={32} className="animate-spin text-[#0055c4]" />
                    <p className="text-sm font-bold text-[#727786]">Loading deal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] antialiased pb-32">
            {/* ─── Deals Top Bar ─── */}
            <DealsToolbar
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                onSearchSubmit={handleSearchSubmit}
                activeLocation={userLocationLabel || ''}
                onOpenLocation={() => {}}
                isAuthenticated={isAuthenticated}
                dashboardHref={dashboardHref}
            />

            {/* ─── Top App Bar ─── */}
            <header
                className="fixed top-[64px] w-full z-50 transition-colors duration-300 hidden md:flex justify-center"
                style={{
                    background: topBarBg ? 'rgba(255,255,255,0.9)' : 'transparent',
                    backdropFilter: topBarBg ? 'blur(12px)' : undefined,
                    boxShadow: topBarBg ? '0 1px 4px rgba(0,0,0,0.06)' : undefined,
                }}
            >
                <div className="flex items-center justify-between px-5 h-[44px] w-full max-w-5xl">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[#191c1e] hover:bg-[#f2f4f6] transition-colors active:scale-95 duration-100 shadow-sm border border-[#c2c6d7]/30"
                        style={{ background: 'rgba(255,255,255,0.8)' }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowShareModal(true)}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-[#191c1e] hover:bg-[#f2f4f6] transition-colors active:scale-95 duration-100 shadow-sm border border-[#c2c6d7]/30"
                            style={{ background: 'rgba(255,255,255,0.8)' }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>share</span>
                        </button>
                        <button
                            onClick={handleSave}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-[#191c1e] hover:bg-[#f2f4f6] transition-colors active:scale-95 duration-100 shadow-sm border border-[#c2c6d7]/30"
                            style={{ background: 'rgba(255,255,255,0.8)' }}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    fontSize: 22,
                                    fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0",
                                    color: isSaved ? '#0055c4' : undefined,
                                }}
                            >
                                bookmark
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ─── Hero Image Gallery ─── */}
            <div className="relative w-full bg-[#f7f9fb]">
                <div className="max-w-5xl mx-auto px-4 pt-4 md:pt-[60px]">
                    {isGiftRef && (
                        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-inner">
                                    <Gift size={22} className="text-yellow-300" />
                                </div>
                                <div>
                                    <p className="text-[14px] font-bold flex items-center gap-1.5">
                                        Special Gift from {giftSender}!
                                    </p>
                                    <p className="text-[12px] text-purple-100">
                                        You&apos;ve been gifted this deal. Tap &quot;Claim Deal Now&quot; to get your discount code.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowClaimModal(true)}
                                className="px-4 py-2 rounded-xl bg-white text-purple-900 font-bold text-[13px] hover:bg-white/90 shadow-sm shrink-0 active:scale-95 transition-all text-center cursor-pointer"
                            >
                                Claim Deal Now
                            </button>
                        </div>
                    )}
                    {photos.length > 0 ? (
                        <ImageGallery
                            images={photos}
                            alt={effectiveNormalizedOffer.name}
                            layout="product"
                            className="w-full"
                            showDots={true}
                            showArrows={true}
                        />
                    ) : (
                        <div className="aspect-square w-full bg-gray-200 rounded-xl" />
                    )}
                </div>
                {/* Badge */}
                {(discountPercent || discountAmount || effectiveNormalizedOffer.discountLabel) && !effectiveNormalizedOffer.isExpired && (
                    <div className="absolute top-[120px] md:top-[152px] left-6 bg-[#ba1a1a] text-white px-3 py-1 rounded-full text-[12px] font-semibold shadow-md z-40 flex items-center gap-1 pointer-events-none">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>local_offer</span>
                        {discountPercent
                            ? `${discountPercent}% OFF`
                            : discountAmount
                                ? `SAVE ${formatDealPrice(discountAmount)}`
                                : effectiveNormalizedOffer.discountLabel || 'DEAL'}
                    </div>
                )}
                {effectiveNormalizedOffer.isExpired && (
                    <div className="absolute top-[120px] md:top-[152px] left-6 bg-gray-800/80 text-white px-3 py-1 rounded-full text-[12px] font-semibold shadow-md z-40 pointer-events-none">
                        Expired
                    </div>
                )}
            </div>

            {/* ─── Main Content ─── */}
            <main className="relative z-10 -mt-6 bg-white rounded-t-xl px-5 pt-6 pb-6 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] max-w-5xl mx-auto">
                {/* Header Info */}
                <div className="mb-6">
                    {effectiveBusiness.name && (
                        <div className="mb-2">
                            <Link
                                href={`/b/${effectiveBusiness.slug || slug}`}
                                className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#0055c4] hover:underline group"
                            >
                                <span className="material-symbols-outlined text-[18px] text-[#0055c4] group-hover:scale-110 transition-transform">
                                    storefront
                                </span>
                                <span>{effectiveBusiness.name}</span>
                                <span className="material-symbols-outlined text-[15px] text-[#0055c4] opacity-70 group-hover:opacity-100 transition-opacity">
                                    arrow_forward
                                </span>
                            </Link>
                        </div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-[24px] leading-[32px] font-semibold tracking-tight text-[#191c1e] max-w-[75%]">
                            {effectiveNormalizedOffer.name}
                        </h1>
                        {effectiveBusiness.rating != null && (
                            <div className="flex items-center gap-1 bg-[#f2f4f6] px-2 py-1 rounded-lg">
                                <span
                                    className="material-symbols-outlined text-[#0055c4]"
                                    style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}
                                >
                                    star
                                </span>
                                <span className="text-[14px] font-semibold text-[#191c1e]">{effectiveBusiness.rating}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[#424655] text-[14px]">
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined shrink-0" style={{ fontSize: 16 }}>location_on</span>
                            <span>{effectiveBusiness.address || 'Location unavailable'}</span>
                        </div>
                        {distance && directionsHref && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[#727786]">·</span>
                                <span className="text-[#727786] text-[13px] font-medium">{distance} away</span>
                                <a
                                    href={directionsHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[#0055c4] font-semibold text-[13px] hover:underline bg-[#0055c4]/5 px-2 py-0.5 rounded-md"
                                    title="Get directions"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="3 11 22 2 13 21 11 13 3 11" />
                                    </svg>
                                    Directions
                                </a>
                            </div>
                        )}
                        {effectiveBusiness.isVerified && (
                            <div className="flex items-center gap-1 text-[#0055c4]">
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified</span>
                                Verified
                            </div>
                        )}
                    </div>
                </div>

                {/* Price Bento Card */}
                <div className="bg-[#0055c4]/5 border border-[#0055c4]/10 rounded-xl p-4 mb-6 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#0055c4]/10 rounded-full blur-xl" />
                    <div>
                        <p className="text-[12px] font-medium text-[#424655] uppercase tracking-wider mb-1">Deal Price</p>
                        <div className="flex items-end gap-2">
                            <span className="text-[20px] font-bold text-[#0055c4]">
                                {effectiveNormalizedOffer.calculatedPrice === 0 ? 'FREE' : formatDealPrice(effectiveNormalizedOffer.calculatedPrice)}
                            </span>
                            {originalPrice > effectiveNormalizedOffer.calculatedPrice && (
                                <span className="text-[14px] text-[#727786] line-through mb-0.5">
                                    {formatDealPrice(originalPrice)}
                                </span>
                            )}
                        </div>
                    </div>
                    {savings > 0 && (
                        <div className="bg-[#0055c4] text-white text-[14px] font-semibold px-3 py-1.5 rounded-lg shadow-sm">
                            SAVE {formatDealPrice(savings)}
                        </div>
                    )}
                </div>

                {/* Engagement Bar */}
                <DealEngagementBar
                    offerId={id}
                    offerTitle={effectiveNormalizedOffer.name}
                    offerDescription={effectiveNormalizedOffer.description || ''}
                    dealUrl={dealUrl}
                    businessName={effectiveBusiness.name}
                />

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-6">
                    {/* Description */}
                    <section>
                        <h2 className="text-[20px] font-semibold text-[#191c1e] mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#0055c4]" style={{ fontSize: 20 }}>info</span>
                            Deal Description
                        </h2>
                        <p className="text-[16px] text-[#424655] leading-relaxed">
                            {effectiveNormalizedOffer.longDescription || effectiveNormalizedOffer.description || 'No description available.'}
                        </p>
                    </section>

                    {/* Metadata Cards */}
                    <div className="flex flex-col gap-4">
                        {/* Validity */}
                        <div className="bg-[#f2f4f6] p-4 rounded-xl border border-[#c2c6d7]/30 flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#e0e3e5] flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[#191c1e]">event</span>
                            </div>
                            <div>
                                <h3 className="text-[12px] font-medium text-[#424655] uppercase tracking-wider mb-0.5">Valid Until</h3>
                                <p className="text-[16px] text-[#191c1e]">
                                    {effectiveNormalizedOffer.endDate ? formatDateLong(effectiveNormalizedOffer.endDate) : 'No expiry date'}
                                </p>
                            </div>
                        </div>

                        {/* Location Preview */}
                        <div className="bg-[#f2f4f6] p-4 rounded-xl border border-[#c2c6d7]/30 flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#e0e3e5] flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[#191c1e]">map</span>
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-[12px] font-medium text-[#424655] uppercase tracking-wider mb-0.5">Location</h3>
                                <Link
                                    href={`/b/${effectiveBusiness.slug || slug}`}
                                    className="text-[16px] font-semibold text-[#191c1e] hover:text-[#0055c4] hover:underline inline-flex items-center gap-1 group"
                                >
                                    <span>{effectiveBusiness.name}</span>
                                    <span className="material-symbols-outlined text-[15px] text-[#0055c4] opacity-0 group-hover:opacity-100 transition-opacity">
                                        arrow_forward
                                    </span>
                                </Link>
                                <p className="text-[14px] text-[#424655]">{effectiveBusiness.address || ''}</p>
                                {distance && directionsHref && (
                                    <div className="flex items-center gap-1 mt-1">
                                        <MapPin size={12} className="text-[#0055c4]" />
                                        <span className="text-[12px] text-[#0055c4] font-medium">{distance} away</span>
                                        <a
                                            href={directionsHref}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[12px] text-[#0055c4] font-medium underline flex items-center gap-0.5"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polygon points="3 11 22 2 13 21 11 13 3 11" />
                                            </svg>
                                            Get Directions
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Terms & Conditions (Expandable) */}
                {effectiveNormalizedOffer.terms && effectiveNormalizedOffer.terms.length > 0 && (
                    <section className="border-t border-[#c2c6d7]/40 pt-4">
                        <details className="group cursor-pointer [&_summary::-webkit-details-marker]:hidden">
                            <summary className="flex items-center justify-between text-[14px] font-semibold text-[#191c1e] py-2 select-none">
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#424655]" style={{ fontSize: 20 }}>gavel</span>
                                    Terms &amp; Conditions
                                </span>
                                <span className="material-symbols-outlined transition-transform duration-200 group-open:rotate-180">
                                    expand_more
                                </span>
                            </summary>
                            <div className="mt-3 pb-3 text-[14px] text-[#424655] space-y-2">
                                {effectiveNormalizedOffer.terms.map((term: string, i: number) => (
                                    <p key={i}>• {term}</p>
                                ))}
                            </div>
                        </details>
                    </section>
                )}

                {/* Reviews Section */}
                <section className="border-t border-[#c2c6d7]/40 pt-4 mt-4">
                    <ReviewSection
                        offerId={id}
                        dealUrl={dealUrl}
                        businessSlug={slug}
                        businessName={effectiveBusiness.name}
                        onWriteReview={() => setShowWriteReviewModal(true)}
                    />
                </section>
            </main>

            {/* ─── Sticky Bottom Action Bar ─── */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-[#c2c6d7]/30 z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] pb-6 pt-3 flex justify-center">
                <div className="w-full max-w-5xl px-5">
                    <button
                        onClick={() => {
                            if (!isAuthenticated) {
                                setShowClaimModal(true);
                                return;
                            }
                            setShowClaimModal(true);
                        }}
                        disabled={!!effectiveNormalizedOffer.isExpired}
                        className="w-full h-12 bg-[#0055c4] text-white text-[14px] font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 hover:bg-[#0055c4]/90 transition-colors active:scale-95 duration-100 disabled:bg-[#c2c6d7] disabled:text-[#727786] disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined">local_activity</span>
                        {effectiveNormalizedOffer.isExpired ? 'Deal Ended' : 'CLAIM DEAL'}
                    </button>
                </div>
            </div>

            {/* Write Review Modal */}
            {showWriteReviewModal && (
                <WriteReviewModal
                    isOpen={showWriteReviewModal}
                    onClose={() => setShowWriteReviewModal(false)}
                    offerId={id}
                    businessName={effectiveBusiness.name}
                />
            )}

            {/* Share modal */}
            <ShareDealModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                title={effectiveNormalizedOffer.name}
                description={effectiveNormalizedOffer.longDescription || effectiveNormalizedOffer.description}
                url={dealUrl}
            />

            {/* Claim Deal Modal */}
            {showClaimModal && (() => {
                const effectiveBranchId = branchId || effectiveNormalizedOffer?.branchId || (effectiveNormalizedOffer?.branch as any)?.id || null;
                return (
                    <ClaimDealModal
                        isOpen={showClaimModal}
                        onClose={() => setShowClaimModal(false)}
                        deal={{
                            id: effectiveNormalizedOffer.id,
                            title: effectiveNormalizedOffer.name,
                            businessName: effectiveBusiness.name,
                            image: photos[0] || effectiveNormalizedOffer.mainImage || '',
                            dealPrice: effectiveNormalizedOffer.calculatedPrice,
                            originalPrice,
                            discountLabel: effectiveNormalizedOffer.discountLabel || '',
                            slug: effectiveBusiness.slug || slug,
                            businessPhone: effectiveBusiness.phone || '',
                        }}
                        claimConfig={effectiveBranchId ? {
                            branchId: effectiveBranchId,
                            successPath: `/deals/${effectiveBusiness.slug || slug}/${effectiveNormalizedOffer.id}`,
                        } : undefined}
                        initialEmail={giftEmail || undefined}
                    />
                );
            })()}
        </div>
    );
}
