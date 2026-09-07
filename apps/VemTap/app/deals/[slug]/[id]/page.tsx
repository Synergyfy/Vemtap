'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle } from 'lucide-react';
import ShareDealModal from '@/components/promotions/ShareDealModal';
import { usePublicOfferDetails } from '@/services/deals/hooks';
import { useToggleSave } from '@/services/deals/engagement-hooks';
import { formatDealPrice } from '@/lib/promotions';
import { useAuthStore } from '@/store/useAuthStore';

function formatDateLong(dateStr: string): string {
    if (!dateStr) return 'Ongoing';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Ongoing';
    return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function DealDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { data: offer, isLoading } = usePublicOfferDetails(id);
    const { isAuthenticated } = useAuthStore();
    const toggleSave = useToggleSave(id);

    const [showShareModal, setShowShareModal] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [topBarBg, setTopBarBg] = useState(false);

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
            business: offer.business,
        };
    }, [offer]);

    const business = normalizedOffer?.business;
    const photos = useMemo(() => {
        const result = [...(business?.photos || [])];
        if (normalizedOffer?.mainImage && !result.includes(normalizedOffer.mainImage)) result.unshift(normalizedOffer.mainImage);
        if (normalizedOffer?.galleryImages?.length) {
            normalizedOffer.galleryImages.forEach((img: string) => { if (!result.includes(img)) result.push(img); });
        }
        return result;
    }, [business, normalizedOffer]);

    const discountPercent = normalizedOffer?.pricingType === 'percentage_discount' && normalizedOffer.discountValue
        ? normalizedOffer.discountValue : undefined;
    const discountAmount = normalizedOffer?.pricingType === 'fixed_discount_price' && normalizedOffer.discountValue
        ? normalizedOffer.discountValue : undefined;

    const originalPrice = useMemo(() => {
        if (!normalizedOffer) return 0;
        if (discountPercent) return Math.round(normalizedOffer.calculatedPrice / (1 - discountPercent / 100));
        if (discountAmount) return normalizedOffer.calculatedPrice + discountAmount;
        return normalizedOffer.calculatedPrice;
    }, [normalizedOffer, discountPercent, discountAmount]);

    const savings = originalPrice - (normalizedOffer?.calculatedPrice || 0);

    const dealUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/deals/${business?.slug || ''}/${normalizedOffer?.id || id}`
        : '';

    const handleScroll = useCallback(() => {
        setTopBarBg(window.scrollY > 50);
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const handleSave = async () => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        setIsSaved(!isSaved);
        try {
            await toggleSave.mutateAsync();
        } catch {
            setIsSaved(isSaved);
        }
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

    if (!normalizedOffer || !business) {
        return (
            <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-center p-6 text-center pb-32">
                <AlertCircle size={64} className="text-[#c2c6d7] mb-4" />
                <h1 className="text-2xl font-bold text-[#191c1e] mb-2">Deal Not Found</h1>
                <p className="text-[#727786] font-bold mb-8">This deal may have expired or doesn&apos;t exist.</p>
                <Link
                    href="/deals"
                    className="px-8 h-12 bg-[#0055c4] text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-lg flex items-center gap-2"
                >
                    ← Browse Deals
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] antialiased pb-32">
            {/* ─── Top App Bar ─── */}
            <header
                className="fixed top-0 w-full z-50 transition-colors duration-300 flex justify-center"
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

            {/* ─── Hero Image ─── */}
            <div className="relative w-full h-[397px] min-h-[300px]">
                <img
                    className="w-full h-full object-cover"
                    src={photos[0] || normalizedOffer.mainImage || ''}
                    alt={normalizedOffer.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#191c1e]/80 via-transparent to-transparent" />
                {/* Badge */}
                {(discountPercent || discountAmount || normalizedOffer.discountLabel) && !normalizedOffer.isExpired && (
                    <div className="absolute top-5 left-5 bg-[#ba1a1a] text-white px-3 py-1 rounded-full text-[12px] font-semibold shadow-md mt-12 z-40 flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>local_offer</span>
                        {discountPercent
                            ? `${discountPercent}% OFF`
                            : discountAmount
                                ? `SAVE ${formatDealPrice(discountAmount)}`
                                : normalizedOffer.discountLabel || 'DEAL'}
                    </div>
                )}
                {normalizedOffer.isExpired && (
                    <div className="absolute top-5 left-5 bg-gray-800/80 text-white px-3 py-1 rounded-full text-[12px] font-semibold shadow-md mt-12 z-40">
                        Expired
                    </div>
                )}
            </div>

            {/* ─── Main Content ─── */}
            <main className="relative z-10 -mt-6 bg-white rounded-t-xl px-5 pt-6 pb-6 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] max-w-5xl mx-auto">
                {/* Header Info */}
                <div className="mb-6">
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-[24px] leading-[32px] font-semibold tracking-tight text-[#191c1e] max-w-[75%]">
                            {normalizedOffer.name}
                        </h1>
                        {business.rating != null && (
                            <div className="flex items-center gap-1 bg-[#f2f4f6] px-2 py-1 rounded-lg">
                                <span
                                    className="material-symbols-outlined text-[#0055c4]"
                                    style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}
                                >
                                    star
                                </span>
                                <span className="text-[14px] font-semibold text-[#191c1e]">{business.rating}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-[#424655] text-[14px]">
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
                            {business.address || 'Location unavailable'}
                        </div>
                        {business.isVerified && (
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
                                {normalizedOffer.calculatedPrice === 0 ? 'FREE' : formatDealPrice(normalizedOffer.calculatedPrice)}
                            </span>
                            {originalPrice > normalizedOffer.calculatedPrice && (
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

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Description */}
                    <section>
                        <h2 className="text-[20px] font-semibold text-[#191c1e] mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#0055c4]" style={{ fontSize: 20 }}>info</span>
                            Deal Description
                        </h2>
                        <p className="text-[16px] text-[#424655] leading-relaxed">
                            {normalizedOffer.longDescription || normalizedOffer.description || 'No description available.'}
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
                                    {normalizedOffer.endDate ? formatDateLong(normalizedOffer.endDate) : 'No expiry date'}
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
                                <p className="text-[16px] text-[#191c1e]">{business.name}</p>
                                <p className="text-[14px] text-[#424655]">{business.address || ''}</p>
                            </div>
                            {business.latitude && business.longitude && (
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#0055c4] hover:bg-[#0055c4]/10 p-2 rounded-full transition-colors active:scale-95"
                                >
                                    <span className="material-symbols-outlined">directions</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Terms & Conditions (Expandable) */}
                {normalizedOffer.terms && normalizedOffer.terms.length > 0 && (
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
                                {normalizedOffer.terms.map((term: string, i: number) => (
                                    <p key={i}>• {term}</p>
                                ))}
                            </div>
                        </details>
                    </section>
                )}
            </main>

            {/* ─── Sticky Bottom Action Bar ─── */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-[#c2c6d7]/30 z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] pb-6 pt-3 flex justify-center">
                <div className="w-full max-w-5xl px-5">
                    <button
                        onClick={() => router.push(`/deals/${business?.slug || ''}/${normalizedOffer.id}/preview`)}
                        disabled={!!normalizedOffer.isExpired}
                        className="w-full h-12 bg-[#0055c4] text-white text-[14px] font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 hover:bg-[#0055c4]/90 transition-colors active:scale-95 duration-100 disabled:bg-[#c2c6d7] disabled:text-[#727786] disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined">local_activity</span>
                        {normalizedOffer.isExpired ? 'Deal Ended' : 'CLAIM DEAL'}
                    </button>
                </div>
            </div>

            {/* Share modal */}
            <ShareDealModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                title={normalizedOffer.name}
                description={normalizedOffer.longDescription || normalizedOffer.description}
                url={dealUrl}
            />
        </div>
    );
}
