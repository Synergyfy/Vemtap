'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { formatDealPrice } from '@/lib/promotions';
import { usePublicOfferDetails } from '@/services/deals/hooks';
import { fetchContextByUsername } from '@/lib/api/devices';
import PublicBottomNav from '@/components/public/PublicBottomNav';
import ClaimDealModal from '@/components/deals/ClaimDealModal';

export default function DealBusinessPreviewPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const slug = params.slug as string;
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [branchId, setBranchId] = useState('');

    const { data: offer, isLoading } = usePublicOfferDetails(id);

    useEffect(() => {
        let active = true;
        const resolve = async () => {
            try {
                const ctx = await fetchContextByUsername(slug);
                if (active && ctx?.business?.id) setBranchId(ctx.business.id);
            } catch {
                // slug may not be a username — claim falls back to preview mode
            }
        };
        resolve();
        return () => { active = false; };
    }, [slug]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
                <Loader2 className="size-8 text-[#0055c4] animate-spin" />
            </div>
        );
    }

    if (!offer) {
        return (
            <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-center p-6 text-center">
                <p className="text-[16px] font-semibold text-[#191c1e] mb-2">Deal not found</p>
                <p className="text-[14px] text-[#727786] mb-4">This deal may have been removed or is unavailable.</p>
                <button onClick={() => router.back()} className="text-[14px] font-semibold text-[#0055c4] hover:underline">Go back</button>
            </div>
        );
    }

    const business = offer.business;
    const businessName = business?.name || 'Business';
    const categoryName = business?.categoryName || 'Deals';
    const discountPercent = offer.discountPercent || null;
    const dealPrice = offer.calculatedPrice ?? 0;
    const originalPrice = offer.discountValue && offer.pricingType === 'percentage_discount'
        ? dealPrice / (1 - offer.discountValue / 100)
        : offer.discountValue && offer.pricingType === 'fixed_discount_price'
            ? dealPrice + offer.discountValue
            : 0;

    return (
        <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] antialiased pb-36">
            {/* Top App Bar */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex justify-center">
                <div className="flex items-center justify-between px-5 h-[44px] w-full max-w-5xl">
                    <button
                        onClick={() => router.back()}
                        aria-label="Go back"
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[#191c1e] hover:bg-[#f2f4f6] transition-colors active:scale-95 duration-100"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
                    </button>
                    <h1 className="text-[16px] font-semibold text-[#191c1e]">Deal Preview</h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="px-5 pt-4 max-w-5xl mx-auto">
                {/* Deal Hero Image */}
                {offer.mainImage && (
                    <div className="rounded-2xl overflow-hidden mb-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                        <img
                            src={offer.mainImage}
                            alt={offer.name}
                            className="w-full h-48 sm:h-56 object-cover"
                        />
                    </div>
                )}

                {/* Business Info Card */}
                <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-14 h-14 rounded-xl bg-[#eef2f7] flex items-center justify-center overflow-hidden shrink-0">
                            {business?.logo ? (
                                <img src={business.logo} alt={businessName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-[#0055c4]" style={{ fontSize: 28 }}>storefront</span>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-[18px] leading-[24px] font-semibold text-[#191c1e] truncate">{businessName}</h2>
                            <p className="text-[13px] font-medium text-[#727786]">{categoryName}</p>
                        </div>
                    </div>

                    {/* Rating + Open Now + View Business */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        {business?.rating && (
                            <div className="flex items-center gap-1 bg-[#f2f4f6] px-2.5 py-1 rounded-lg">
                                <span className="material-symbols-outlined text-[#F59E0B]" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>star</span>
                                <span className="text-[13px] font-semibold text-[#191c1e]">{business.rating}</span>
                                {business.totalReviews && (
                                    <span className="text-[11px] text-[#727786]">({business.totalReviews})</span>
                                )}
                            </div>
                        )}
                        <button
                            onClick={() => router.push(`/${slug}`)}
                            className="h-8 px-3.5 bg-[#0055c4] text-white text-[12px] font-semibold rounded-lg hover:bg-[#0055c4]/90 transition-colors active:scale-95 duration-100 flex items-center gap-1.5"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>storefront</span>
                            View Business
                        </button>
                    </div>

                    {/* Address */}
                    {business?.address && (
                        <div className="flex items-start gap-2 text-[13px] text-[#424655]">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
                            <span>{business.address}</span>
                        </div>
                    )}
                </div>

                {/* Deal Info Card */}
                <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] mt-4 p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-[18px] leading-[24px] font-semibold text-[#191c1e]">{offer.name}</h3>
                        {discountPercent && (
                            <span className="shrink-0 bg-[#ba1a1a] text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                                -{discountPercent}%
                            </span>
                        )}
                    </div>
                    <p className="text-[14px] text-[#424655] leading-relaxed mb-3">{offer.description}</p>
                    <div className="flex items-center gap-3">
                        <span className={`text-[20px] font-bold ${dealPrice === 0 ? 'text-[#137a3a]' : 'text-[#191c1e]'}`}>
                            {dealPrice === 0 ? 'FREE' : formatDealPrice(dealPrice)}
                        </span>
                        {originalPrice > dealPrice && (
                            <span className="text-[14px] text-[#727786] line-through">{formatDealPrice(originalPrice)}</span>
                        )}
                    </div>
                </div>
            </main>

            {/* Sticky Bottom Action Bar */}
            <div className="fixed bottom-[56px] left-0 w-full bg-white border-t border-[#c2c6d7]/30 z-[60] shadow-[0_-4px_16px_rgba(0,0,0,0.05)] pb-3 pt-3 flex justify-center">
                <div className="w-full max-w-5xl px-5">
                    <button
                        onClick={() => setShowClaimModal(true)}
                        className="w-full h-12 bg-[#0055c4] text-white text-[14px] font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 hover:bg-[#0055c4]/90 transition-colors active:scale-95 duration-100"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>local_activity</span>
                        CLAIM DEAL
                    </button>
                </div>
            </div>

            <PublicBottomNav />

            {/* Claim Deal Modal */}
            {showClaimModal && (
                <ClaimDealModal
                    isOpen={showClaimModal}
                    onClose={() => setShowClaimModal(false)}
                    deal={{
                        id: offer.id,
                        title: offer.name,
                        businessName,
                        image: offer.mainImage || '',
                        dealPrice,
                        originalPrice,
                        discountLabel: offer.discountPercent ? `${offer.discountPercent}% OFF` : '',
                        slug,
                    }}
                    claimConfig={branchId ? { branchId } : undefined}
                />
            )}
        </div>
    );
}
