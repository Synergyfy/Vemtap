'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    Loader2,
    X,
    ShieldCheck,
    ChevronRight,
    CheckCircle2,
    Gift,
    Copy,
} from 'lucide-react';
import { MOCK_PROMOTIONS, formatPromoPrice, formatPromoDate, getPromoDaysLeft } from '@/lib/mock/promotions';
import type { MockPromotion } from '@/lib/mock/promotions';
import { usePublicOfferDetails, useRequestClaimOtp, useVerifyClaimOtp } from '@/services/deals/hooks';
import { useEngagement } from '@/services/deals/engagement-hooks';
import DealEngagementBar from '@/components/deals/DealEngagementBar';
import ReviewSection from '@/components/deals/ReviewSection';
import WriteReviewModal from '@/components/deals/WriteReviewModal';
import ShareDealModal from '@/components/promotions/ShareDealModal';
import { toast } from 'react-hot-toast';

type ClaimStep = 'phone' | 'otp' | 'success';

function offerToPromotion(offer: any): MockPromotion | null {
    if (!offer || !offer.id) return null;
    const branch = offer.branch || {};
    return {
        id: offer.id,
        name: offer.name || '',
        description: offer.description || '',
        longDescription: offer.longDescription || offer.description || '',
        terms: offer.terms || [],
        businessName: branch.name || '',
        businessSlug: branch.username || branch.uniqueCode || '',
        businessLogo: branch.logoUrl || undefined,
        category: 'Services' as any,
        discountPercent: offer.discountPercent || (offer.pricingType === 'percentage_discount' ? Number(offer.discountValue) : undefined),
        discountAmount: offer.pricingType === 'fixed_discount_price' ? Number(offer.discountValue) : undefined,
        originalPrice: Number(offer.originalPrice || offer.calculatedPrice || 0),
        dealPrice: Number(offer.dealPrice || offer.calculatedPrice || 0),
        image: offer.mainImage || '',
        startDate: offer.startDate || '',
        endDate: offer.endDate || '',
        audience: offer.audience || '',
        location: branch.address || '',
        claimedCount: offer.claimedCount || 0,
        maxClaims: offer.maxClaims || 0,
    };
}

function formatDateLong(dateStr?: string): string {
    if (!dateStr) return 'No expiry date';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'No expiry date';
    return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PromotionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const mockPromotion = MOCK_PROMOTIONS.find(p => p.id === id);
    const { data: offerData, isLoading, isError } = usePublicOfferDetails(id);
    const promotion = useMemo(() => mockPromotion || offerToPromotion(offerData), [mockPromotion, offerData]);

    const [showClaimModal, setShowClaimModal] = useState(false);
    const [claimStep, setClaimStep] = useState<ClaimStep>('phone');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [claimName, setClaimName] = useState('');
    const [claimEmail, setClaimEmail] = useState('');
    const [claimPhone, setClaimPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [showShareModal, setShowShareModal] = useState(false);
    const [showWriteReview, setShowWriteReview] = useState(false);
    const [topBarBg, setTopBarBg] = useState(false);

    const { data: engagement } = useEngagement(id);

    const requestClaimOtp = useRequestClaimOtp();
    const verifyClaimOtp = useVerifyClaimOtp();

    const handleScroll = useCallback(() => {
        setTopBarBg(window.scrollY > 50);
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // ─── Derived data ───
    const branch = offerData?.branch || {};
    const businessName = promotion?.businessName || branch.name || '';
    const businessSlug = promotion?.businessSlug || branch.username || branch.uniqueCode || '';
    const discountPercent = promotion?.discountPercent || null;
    const discountAmount = promotion?.discountAmount || null;
    const dealPrice = promotion?.dealPrice ?? 0;
    const originalPrice = promotion?.originalPrice ?? 0;
    const savings = originalPrice - dealPrice;
    const dealUrl = typeof window !== 'undefined' ? window.location.href : '';

    const daysLeft = promotion ? getPromoDaysLeft(promotion.endDate) : -1;
    const isExpired = promotion?.endDate ? new Date(promotion.endDate) < new Date() : false;
    const claimPercent = promotion && promotion.maxClaims > 0
        ? Math.round((promotion.claimedCount / promotion.maxClaims) * 100)
        : 0;

    // ─── Loading ───
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

    if (!promotion) {
        return (
            <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-center p-6 text-center pb-32">
                <Gift size={64} className="text-[#c2c6d7] mb-4" />
                <h1 className="text-2xl font-bold text-[#191c1e] mb-2">{isError ? 'Failed to load' : 'Deal Not Found'}</h1>
                <p className="text-[#727786] font-bold mb-8">
                    {isError ? 'Unable to fetch this deal. Please try again.' : 'This deal may have expired or doesn\'t exist.'}
                </p>
                <Link
                    href="/deals"
                    className="px-8 h-12 bg-[#0055c4] text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-lg flex items-center gap-2"
                >
                    ← Browse Deals
                </Link>
            </div>
        );
    }

    // ─── Handlers ───
    const handlePhoneSubmit = async () => {
        if (!claimName.trim()) { toast.error('Please enter your name'); return; }
        if (!claimEmail.trim() || !claimEmail.includes('@')) { toast.error('Please enter a valid email'); return; }
        if (!claimPhone || claimPhone.length < 10) { toast.error('Please enter a valid phone number'); return; }
        setIsSubmitting(true);
        try {
            await requestClaimOtp.mutateAsync({ phone: claimPhone, offerId: id, firstName: claimName.trim(), email: claimEmail.trim() });
            setClaimStep('otp');
        } catch (err: any) {
            toast.error(err?.message || 'Failed to request OTP');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOtpVerify = async () => {
        if (otp.length < 4) {
            toast.error('Please enter the verification code');
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await verifyClaimOtp.mutateAsync({ email: claimEmail, offerId: id, code: otp });
            setCouponCode(result.claim?.claimCode || '');
            setClaimStep('success');
        } catch (err: any) {
            toast.error(err?.message || 'Invalid verification code');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleShareWhatsApp = () => {
        const text = `Check out this deal at ${businessName}: ${promotion.name}\n\n${promotion.longDescription.slice(0, 200)}...\n\nGet it here: ${dealUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        setShowShareModal(false);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(dealUrl);
        toast.success('Link copied to clipboard!');
        setShowShareModal(false);
    };

    const resetModal = () => {
        setShowClaimModal(false);
        setClaimStep('phone');
        setOtp('');
        setClaimName('');
        setClaimEmail('');
        setClaimPhone('');
    };

    // ─── Render ───
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
                    </div>
                </div>
            </header>

            {/* ─── Hero Image ─── */}
            <div className="relative w-full h-[397px] min-h-[300px]">
                <img
                    className="w-full h-full object-cover"
                    src={promotion.image || '/placeholder.png'}
                    alt={promotion.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#191c1e]/80 via-transparent to-transparent" />
                {/* Badge */}
                {(discountPercent || discountAmount) && (
                    <div className="absolute top-5 left-5 bg-[#ba1a1a] text-white px-3 py-1 rounded-full text-[12px] font-semibold shadow-md mt-12 z-40 flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>local_offer</span>
                        {discountPercent
                            ? `${discountPercent}% OFF`
                            : discountAmount
                                ? `SAVE ${formatPromoPrice(discountAmount)}`
                                : 'DEAL'}
                    </div>
                )}
            </div>

            {/* ─── Main Content ─── */}
            <main className="relative z-10 -mt-6 bg-white rounded-t-xl px-5 pt-6 pb-6 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] max-w-5xl mx-auto">
                {/* Header Info */}
                <div className="mb-6">
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-[24px] leading-[32px] font-semibold tracking-tight text-[#191c1e] max-w-[75%]">
                            {promotion.name}
                        </h1>
                        {engagement?.averageRating != null && (
                            <div className="flex items-center gap-1 bg-[#f2f4f6] px-2 py-1 rounded-lg">
                                <span className="material-symbols-outlined text-[#0055c4]" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>star</span>
                                <span className="text-[14px] font-semibold text-[#191c1e]">{engagement.averageRating}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-[#424655] text-[14px]">
                        {businessName && (
                            <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>storefront</span>
                                {businessName}
                            </div>
                        )}
                        {promotion.location && (
                            <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
                                {promotion.location}
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
                                {dealPrice === 0 ? 'FREE' : formatPromoPrice(dealPrice)}
                            </span>
                            {originalPrice > dealPrice && (
                                <span className="text-[14px] text-[#727786] line-through mb-0.5">
                                    {formatPromoPrice(originalPrice)}
                                </span>
                            )}
                        </div>
                    </div>
                    {savings > 0 && (
                        <div className="bg-[#0055c4] text-white text-[14px] font-semibold px-3 py-1.5 rounded-lg shadow-sm">
                            SAVE {formatPromoPrice(savings)}
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
                            {promotion.longDescription || promotion.description || 'No description available.'}
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
                                    {formatDateLong(promotion.endDate)}
                                </p>
                            </div>
                        </div>

                        {/* Location */}
                        {promotion.location && (
                            <div className="bg-[#f2f4f6] p-4 rounded-xl border border-[#c2c6d7]/30 flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#e0e3e5] flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[#191c1e]">map</span>
                                </div>
                                <div className="flex-grow">
                                    <h3 className="text-[12px] font-medium text-[#424655] uppercase tracking-wider mb-0.5">Location</h3>
                                    <p className="text-[16px] text-[#191c1e]">{businessName}</p>
                                    <p className="text-[14px] text-[#424655]">{promotion.location}</p>
                                </div>
                                <a
                                    href={`https://www.google.com/maps/search/${encodeURIComponent(promotion.location + ' ' + businessName)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#0055c4] hover:bg-[#0055c4]/10 p-2 rounded-full transition-colors active:scale-95"
                                >
                                    <span className="material-symbols-outlined">directions</span>
                                </a>
                            </div>
                        )}

                        {/* Claim Progress */}
                        {promotion.maxClaims > 0 && (
                            <div className="bg-[#f2f4f6] p-4 rounded-xl border border-[#c2c6d7]/30 flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#e0e3e5] flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[#191c1e]">group</span>
                                </div>
                                <div className="flex-grow">
                                    <h3 className="text-[12px] font-medium text-[#424655] uppercase tracking-wider mb-0.5">Claimed</h3>
                                    <p className="text-[16px] text-[#191c1e]">{promotion.claimedCount} of {promotion.maxClaims}</p>
                                    <div className="mt-2 w-full h-1.5 bg-[#e0e3e5] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#0055c4] rounded-full"
                                            style={{ width: `${Math.min(claimPercent, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Terms & Conditions */}
                {promotion.terms && promotion.terms.length > 0 && (
                    <section className="border-t border-[#c2c6d7]/40 pt-4 mb-6">
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
                                {promotion.terms.map((term: string, i: number) => (
                                    <p key={i}>• {term}</p>
                                ))}
                            </div>
                        </details>
                    </section>
                )}

                {/* Reviews */}
                <section className="border-t border-[#c2c6d7]/40 pt-4 mb-2">
                    <ReviewSection offerId={id} />
                </section>
            </main>

            {/* ─── Sticky Bottom Action Bar ─── */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-[#c2c6d7]/30 z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] pb-6 pt-3 flex justify-center">
                <div className="w-full max-w-5xl px-5 flex gap-3">
                    <button
                        onClick={() => setShowClaimModal(true)}
                        disabled={isExpired}
                        className="flex-1 h-12 bg-[#0055c4] text-white text-[14px] font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 hover:bg-[#0055c4]/90 transition-colors active:scale-95 duration-100 disabled:bg-[#c2c6d7] disabled:text-[#727786] disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined">local_activity</span>
                        {isExpired ? 'Deal Ended' : 'CLAIM DEAL'}
                    </button>
                </div>
            </div>

            {/* ─── Share Modal (new design) ─── */}
            <ShareDealModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                title={promotion.name}
                description={promotion.longDescription || promotion.description}
                url={dealUrl}
            />

            {/* ─── Claim Modal (OTP flow, new design) ─── */}
            <AnimatePresence>
                {showClaimModal && (
                    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={resetModal}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 flex items-center justify-between px-5 h-14 border-b border-gray-100 rounded-t-3xl sm:rounded-t-3xl">
                                <button onClick={resetModal} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                                    <X size={20} className="text-gray-500" />
                                </button>
                                <h2 className="text-[15px] font-semibold text-gray-900">
                                    {claimStep === 'phone' && 'Claim Deal'}
                                    {claimStep === 'otp' && 'Verify Identity'}
                                    {claimStep === 'success' && 'Deal Claimed!'}
                                </h2>
                                <div className="w-10" />
                            </div>

                            <div className="p-5">
                                {/* Step 1: Info Form */}
                                {claimStep === 'phone' && (
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex gap-3 mb-1">
                                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                                                <img src={promotion.image} alt={promotion.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="inline-flex items-center gap-1 text-[#0055c4] bg-[#066cf4]/10 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase mb-1">
                                                    {discountPercent ? `${discountPercent}% OFF` : 'DEAL'}
                                                </div>
                                                <h3 className="text-[14px] font-semibold text-gray-900 line-clamp-1">{promotion.name}</h3>
                                                <p className="text-[12px] text-gray-500 mt-0.5">{businessName}</p>
                                            </div>
                                        </div>

                                        <h3 className="text-[16px] font-semibold text-gray-900">Your Information</h3>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[11px] font-medium text-gray-500 block mb-1">Full Name *</label>
                                                <input
                                                    type="text"
                                                    value={claimName}
                                                    onChange={(e) => setClaimName(e.target.value)}
                                                    placeholder="Enter your full name"
                                                    className="w-full h-11 px-4 rounded-lg border border-gray-200 bg-white text-[14px] focus:border-[#0055c4] focus:ring-1 focus:ring-[#0055c4] outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-medium text-gray-500 block mb-1">Email Address *</label>
                                                <input
                                                    type="email"
                                                    value={claimEmail}
                                                    onChange={(e) => setClaimEmail(e.target.value)}
                                                    placeholder="Enter your email"
                                                    className="w-full h-11 px-4 rounded-lg border border-gray-200 bg-white text-[14px] focus:border-[#0055c4] focus:ring-1 focus:ring-[#0055c4] outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-medium text-gray-500 block mb-1">Phone Number *</label>
                                                <div className="flex gap-2">
                                                    <select className="h-11 px-3 rounded-lg border border-gray-200 bg-white text-[14px] focus:border-[#0055c4] focus:ring-1 focus:ring-[#0055c4] outline-none transition-all w-24">
                                                        <option>+234</option>
                                                        <option>+1</option>
                                                        <option>+44</option>
                                                    </select>
                                                    <input
                                                        type="tel"
                                                        value={claimPhone}
                                                        onChange={(e) => setClaimPhone(e.target.value)}
                                                        placeholder="Enter phone number"
                                                        className="flex-grow h-11 px-4 rounded-lg border border-gray-200 bg-white text-[14px] focus:border-[#0055c4] focus:ring-1 focus:ring-[#0055c4] outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handlePhoneSubmit}
                                            disabled={isSubmitting || !claimName.trim() || !claimEmail.trim()}
                                            className="w-full h-12 bg-[#0055c4] text-white font-semibold text-[14px] rounded-lg flex items-center justify-center gap-2 hover:bg-[#0055c4]/90 transition-colors active:scale-[0.98] disabled:opacity-50"
                                        >
                                            {isSubmitting ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>Get Verification Code <ChevronRight size={16} /></>
                                            )}
                                        </button>

                                        <p className="text-[11px] text-gray-400 text-center">
                                            By claiming, you agree to VemTap&apos;s Terms of Service.
                                        </p>
                                    </div>
                                )}

                                {/* Step 2: OTP */}
                                {claimStep === 'otp' && (
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex gap-3 mb-1">
                                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                                                <img src={promotion.image} alt={promotion.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-[14px] font-semibold text-gray-900 line-clamp-1">{promotion.name}</h3>
                                                <p className="text-[12px] text-gray-500 mt-0.5">{businessName}</p>
                                            </div>
                                        </div>

                                        <div className="bg-green-50 rounded-lg p-3 flex items-start gap-2">
                                            <ShieldCheck size={16} className="text-green-600 mt-0.5 shrink-0" />
                                            <p className="text-[12px] text-green-700">
                                                A verification code has been sent to <strong>{claimEmail}</strong>
                                            </p>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-medium text-gray-500 block mb-1">Verification Code</label>
                                            <input
                                                type="text"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                className="w-full h-14 px-4 rounded-lg border border-gray-200 bg-white text-center text-2xl font-bold tracking-widest focus:border-[#0055c4] focus:ring-1 focus:ring-[#0055c4] outline-none transition-all"
                                                placeholder="000000"
                                                maxLength={6}
                                            />
                                        </div>

                                        <button
                                            onClick={handleOtpVerify}
                                            disabled={isSubmitting || otp.length < 4}
                                            className="w-full h-12 bg-[#0055c4] text-white font-semibold text-[14px] rounded-lg flex items-center justify-center gap-2 hover:bg-[#0055c4]/90 transition-colors active:scale-[0.98] disabled:opacity-50"
                                        >
                                            {isSubmitting ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                'Verify & Claim'
                                            )}
                                        </button>

                                        <button
                                            onClick={() => setClaimStep('phone')}
                                            className="w-full text-[12px] font-semibold text-gray-400 hover:text-[#0055c4] transition-colors"
                                        >
                                            ← Start over
                                        </button>
                                    </div>
                                )}

                                {/* Step 3: Success */}
                                {claimStep === 'success' && (
                                    <div className="space-y-4 text-center">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                            className="w-20 h-20 mx-auto bg-[#066cf4] rounded-full flex items-center justify-center mb-2 shadow-[0_0_40px_rgba(6,108,244,0.2)]"
                                        >
                                            <CheckCircle2 size={40} className="text-white" />
                                        </motion.div>

                                        <h2 className="text-[22px] font-bold text-gray-900">Deal Claimed!</h2>
                                        <p className="text-[14px] text-gray-500">
                                            Show this code at <strong>{businessName}</strong> to redeem your deal.
                                        </p>

                                        <div className="bg-white rounded-xl border border-gray-200 p-4 text-left">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Your Claim Code</p>
                                            <div className="bg-gray-50 px-4 py-3 rounded-lg text-center">
                                                <span className="text-[22px] font-mono tracking-widest text-[#0055c4] font-bold">{couponCode}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2.5">
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(couponCode);
                                                    toast.success('Code copied!');
                                                }}
                                                className="w-full h-12 bg-gray-50 border border-gray-200 text-gray-600 font-semibold text-[14px] rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 active:scale-[0.98] transition-all"
                                            >
                                                <Copy size={16} /> Copy Code
                                            </button>
                                            <Link
                                                href="/deals"
                                                onClick={resetModal}
                                                className="w-full h-12 bg-[#0055c4] text-white font-semibold text-[14px] rounded-lg flex items-center justify-center gap-2 hover:bg-[#0055c4]/90 active:scale-[0.98] transition-all"
                                            >
                                                Browse More Deals
                                            </Link>
                                        </div>

                                        <p className="text-[11px] text-gray-400">
                                            Valid for {(() => {
                                                const d = promotion?.endDate ? getPromoDaysLeft(promotion.endDate) : 7;
                                                return d === -1 ? 'unlimited time' : `${d} days`;
                                            })()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ─── Write Review Modal ─── */}
            <WriteReviewModal
                isOpen={showWriteReview}
                onClose={() => setShowWriteReview(false)}
                offerId={id}
                businessName={businessName || 'Business'}
            />
        </div>
    );
}