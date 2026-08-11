'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, MapPin, Clock, Users, Share2, CheckCircle2,
    Loader2, Gift, ShieldCheck, Copy, X, ChevronRight, Phone,
    Navigation, MessageCircle, ExternalLink,
    Link as LinkIcon,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { MOCK_PROMOTIONS, formatPromoPrice, formatPromoDate, getPromoDaysLeft } from '@/lib/mock/promotions';
import type { MockPromotion } from '@/lib/mock/promotions';
import { usePublicOfferDetails, useRequestClaimOtp, useVerifyClaimOtp } from '@/services/deals/hooks';
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

export default function PromotionDetailPage() {
    const params = useParams();
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

    const requestClaimOtp = useRequestClaimOtp();
    const verifyClaimOtp = useVerifyClaimOtp();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <Loader2 size={40} className="animate-spin text-primary mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading deal...</h1>
                </div>
                <Footer />
            </div>
        );
    }

    if (!promotion) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <Gift size={64} className="text-gray-200 mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{isError ? 'Failed to load' : 'Promotion Not Found'}</h1>
                    <p className="text-gray-500 font-bold mb-8">
                        {isError ? 'Unable to fetch this deal. Please try again.' : 'This deal may have expired or doesn&apos;t exist.'}
                    </p>
                    <Link
href="/deals"
                        className="px-8 h-12 bg-primary text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                        <ArrowLeft size={16} /> Browse Deals
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const daysLeft = getPromoDaysLeft(promotion.endDate);
    const claimPercent = Math.round((promotion.claimedCount / promotion.maxClaims) * 100);

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

    const handleShare = () => {
        setShowShareModal(true);
    };

    const handleShareWhatsApp = () => {
        const text = `Check out this deal at ${promotion.businessName}: ${promotion.name}\n\n${promotion.longDescription.slice(0, 200)}...\n\nGet it here: ${window.location.href}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        setShowShareModal(false);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
        setShowShareModal(false);
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${promotion.name} at ${promotion.businessName}`,
                    text: promotion.longDescription.slice(0, 200),
                    url: window.location.href,
                });
            } catch { /* user cancelled */ }
            setShowShareModal(false);
        } else {
            handleCopyLink();
        }
    };

    const resetModal = () => {
        setShowClaimModal(false);
        setClaimStep('phone');
        setOtp('');
        setClaimName('');
        setClaimEmail('');
        setClaimPhone('');
    };

    return (
        <div className="min-h-screen bg-white font-body text-text-main">
            <Navbar />

            <main className="pt-24 pb-20">
                {/* Back nav */}
                <div className="max-w-4xl mx-auto px-4 md:px-8 mb-6">
                    <Link
                        href="/deals"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-primary text-sm font-bold transition-colors"
                    >
                        <ArrowLeft size={16} /> All Deals
                    </Link>
                </div>

                {/* Hero image */}
                <div className="max-w-4xl mx-auto px-4 md:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative rounded-3xl overflow-hidden aspect-[21/9] bg-gray-100"
                    >
                        <img
                            src={promotion.image}
                            alt={promotion.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                        {/* Discount badge */}
                        {promotion.discountPercent && (
                            <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                                {promotion.discountPercent}% OFF
                            </div>
                        )}
                        {promotion.discountAmount && !promotion.discountPercent && (
                            <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                                SAVE {formatPromoPrice(promotion.discountAmount)}
                            </div>
                        )}

                        {/* Share */}
                        <button
                            onClick={handleShare}
                            className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-2.5 rounded-full hover:bg-white transition-colors"
                            aria-label="Share this deal"
                        >
                            <Share2 size={18} className="text-gray-700" />
                        </button>

                        {/* Bottom overlay info */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                            <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2">
                                {promotion.businessName}
                            </p>
                            <h1 className="text-3xl md:text-4xl font-headline font-bold text-white tracking-tight">
                                {promotion.name}
                            </h1>
                        </div>
                    </motion.div>
                </div>

                {/* Content */}
                <div className="max-w-4xl mx-auto px-4 md:px-8 mt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left: Details */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Price card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
                            >
                                <div className="flex items-end gap-3 mb-4">
                                    <span className="text-4xl font-bold text-primary font-display tracking-tight">
                                        {formatPromoPrice(promotion.dealPrice)}
                                    </span>
                                    {promotion.originalPrice > promotion.dealPrice && (
                                        <span className="text-lg text-gray-400 line-through font-bold mb-1">
                                            {formatPromoPrice(promotion.originalPrice)}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <MapPin size={14} />
                                        <span className="text-xs font-bold">{promotion.location}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <Clock size={14} />
                                        <span className="text-xs font-bold">
                                            {formatPromoDate(promotion.startDate)} — {formatPromoDate(promotion.endDate)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <Users size={14} />
                                        <span className="text-xs font-bold">{promotion.claimedCount} people claimed</span>
                                    </div>
                                </div>

                                {/* Claim progress */}
                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-gray-400">{promotion.claimedCount} of {promotion.maxClaims} claimed</span>
                                        <span className="text-primary">{claimPercent}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                                            style={{ width: `${Math.min(claimPercent, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Description */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="space-y-4"
                            >
                                <h2 className="text-lg font-headline font-bold text-gray-900">About This Deal</h2>
                                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                    {promotion.longDescription}
                                </p>
                            </motion.div>

                            {/* Terms */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="space-y-4"
                            >
                                <h2 className="text-lg font-headline font-bold text-gray-900">Terms & Conditions</h2>
                                <ul className="space-y-2">
                                    {promotion.terms.map((term, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-500 font-medium">
                                            <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                                            {term}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        </div>

                        {/* Right: Sidebar */}
                        <div className="space-y-6">
                            {/* Claim CTA card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-28 space-y-6"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Clock size={14} />
                                        <span className="text-xs font-bold">
                                            {daysLeft > 0 ? `${daysLeft} days left` : 'Ending today'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <ShieldCheck size={14} />
                                        <span className="text-xs font-bold">Verified by VemTap</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowClaimModal(true)}
                                    className="w-full h-14 bg-primary text-white font-bold uppercase tracking-wider text-sm rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Gift size={18} /> Claim This Deal
                                </button>

                                <button
                                    onClick={handleShare}
                                    className="w-full h-12 bg-gray-50 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 border border-gray-100"
                                >
                                    <Share2 size={14} /> Share Deal
                                </button>

                                {/* Business info */}
                                <div className="pt-4 border-t border-gray-100 space-y-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Offered by</p>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{promotion.businessName}</p>
                                        <p className="text-xs text-gray-400 font-bold flex items-center gap-1 mt-1">
                                            <MapPin size={10} /> {promotion.location}
                                        </p>
                                        {promotion.distance && (
                                            <p className="text-xs text-gray-400 font-bold flex items-center gap-1 mt-1">
                                                <Navigation size={10} /> {promotion.distance} away
                                            </p>
                                        )}
                                        {promotion.businessHours && (
                                            <p className="text-xs text-gray-400 font-bold flex items-center gap-1 mt-1">
                                                <Clock size={10} /> {promotion.businessHours}
                                            </p>
                                        )}
                                    </div>
                                    {promotion.location && (
                                        <a
                                            href={`https://www.google.com/maps/search/${encodeURIComponent(promotion.location + ' ' + promotion.businessName)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full h-10 bg-gray-50 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 border border-gray-100"
                                        >
                                            <Navigation size={14} /> Get Directions
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            {/* Share Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowShareModal(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="relative w-full max-w-sm bg-white rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 md:p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-headline font-bold text-gray-900">Share This Deal</h2>
                                    <button
                                        onClick={() => setShowShareModal(false)}
                                        className="size-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                                    >
                                        <X size={16} className="text-gray-500" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={handleShareWhatsApp}
                                        className="w-full flex items-center gap-4 p-4 bg-green-50 border border-green-100 rounded-2xl hover:bg-green-100 transition-colors group"
                                    >
                                        <div className="size-12 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
                                            <MessageCircle size={24} className="text-white" />
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900">Share on WhatsApp</p>
                                            <p className="text-[10px] text-gray-500 font-medium line-clamp-1">
                                                {promotion.name} — {promotion.longDescription.slice(0, 80)}...
                                            </p>
                                        </div>
                                        <ExternalLink size={16} className="text-green-400 shrink-0" />
                                    </button>

                                    <button
                                        onClick={handleCopyLink}
                                        className="w-full flex items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 transition-colors group"
                                    >
                                        <div className="size-12 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
                                            <LinkIcon size={24} className="text-gray-600" />
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900">Copy Link</p>
                                            <p className="text-[10px] text-gray-500 font-medium truncate">
                                                {window.location.href}
                                            </p>
                                        </div>
                                        <Copy size={16} className="text-gray-400 shrink-0" />
                                    </button>

                                    <button
                                        onClick={handleNativeShare}
                                        className="w-full flex items-center gap-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl hover:bg-primary/10 transition-colors group"
                                    >
                                        <div className="size-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                                            <Share2 size={24} className="text-white" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="text-sm font-bold text-gray-900">More Options</p>
                                            <p className="text-[10px] text-gray-500 font-medium">Share via other apps</p>
                                        </div>
                                        <ExternalLink size={16} className="text-primary/40 shrink-0" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Claim Modal */}
            <AnimatePresence>
                {showClaimModal && (
                    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={resetModal}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="relative w-full max-w-md bg-white rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl"
                        >
                            {/* Close */}
                            <button
                                onClick={resetModal}
                                className="absolute top-4 right-4 z-10 size-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                                <X size={18} className="text-gray-500" />
                            </button>

                            <AnimatePresence mode="wait">
                                {/* Step 1: Phone */}
                                {claimStep === 'phone' && (
                                    <motion.div
                                        key="phone"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="p-6 md:p-8 space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                                                <Gift size={28} className="text-primary" />
                                            </div>
                                            <h2 className="text-xl font-headline font-bold text-gray-900">Claim Your Deal</h2>
                                            <p className="text-sm text-gray-500 font-medium">
                                                Enter your details to claim <strong>{promotion.name}</strong>.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Full Name *</label>
                                                <input
                                                    type="text"
                                                    value={claimName}
                                                    onChange={(e) => setClaimName(e.target.value)}
                                                    className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Email Address *</label>
                                                <input
                                                    type="email"
                                                    value={claimEmail}
                                                    onChange={(e) => setClaimEmail(e.target.value)}
                                                    className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                                                    placeholder="john@example.com"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Phone Number *</label>
                                                <div className="relative">
                                                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="tel"
                                                        value={claimPhone}
                                                        onChange={(e) => setClaimPhone(e.target.value)}
                                                        className="w-full h-11 pl-10 pr-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                                                        placeholder="0801 234 5678"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handlePhoneSubmit}
                                            disabled={isSubmitting}
                                            className="w-full h-13 bg-primary text-white font-bold uppercase tracking-wider text-sm rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isSubmitting ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <>Get Verification Code <ChevronRight size={16} /></>
                                            )}
                                        </button>

                                        <p className="text-[10px] text-gray-400 text-center font-bold">
                                            By claiming, you agree to VemTap&apos;s Terms of Service.
                                        </p>
                                    </motion.div>
                                )}



                                {/* Step 4: OTP */}
                                {claimStep === 'otp' && (
                                    <motion.div
                                        key="otp"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="p-6 md:p-8 space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <div className="size-14 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
                                                <ShieldCheck size={28} className="text-green-500" />
                                            </div>
                                            <h2 className="text-xl font-headline font-bold text-gray-900">Verify Your Identity</h2>
                                            <p className="text-sm text-gray-500 font-medium">
                                                We&apos;ve sent a verification code to <strong>{claimEmail}</strong>. Enter it below to confirm your claim.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">
                                                Verification Code
                                            </label>
                                            <input
                                                type="text"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-2xl font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                                                placeholder="000000"
                                                maxLength={6}
                                            />
                                        </div>

                                        <button
                                            onClick={handleOtpVerify}
                                            disabled={isSubmitting}
                                            className="w-full h-13 bg-primary text-white font-bold uppercase tracking-wider text-sm rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isSubmitting ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                'Verify & Claim'
                                            )}
                                        </button>

                                        <button
                                            onClick={() => setClaimStep('phone')}
                                            className="w-full text-xs font-bold text-gray-400 hover:text-primary transition-colors"
                                        >
                                            ← Start over
                                        </button>
                                    </motion.div>
                                )}

                                {/* Step 5: Success */}
                                {claimStep === 'success' && (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-6 md:p-8 space-y-6 text-center"
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                            className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center"
                                        >
                                            <CheckCircle2 size={40} className="text-green-500" />
                                        </motion.div>

                                        <div className="space-y-2">
                                            <h2 className="text-xl font-headline font-bold text-gray-900">Deal Claimed!</h2>
                                            <p className="text-sm text-gray-500 font-medium">
                                                Show this code at <strong>{promotion.businessName}</strong> to redeem your deal.
                                            </p>
                                        </div>

                                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                                                Your Claim Code
                                            </p>
                                            <p className="text-3xl font-bold text-primary tracking-wider font-display">
                                                {couponCode}
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(couponCode);
                                                    toast.success('Code copied!');
                                                }}
                                                className="w-full h-12 bg-gray-50 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 border border-gray-100"
                                            >
                                                <Copy size={14} /> Copy Code
                                            </button>

                                            <Link
                                                href="/deals"
                                                onClick={resetModal}
                                                className="w-full h-12 bg-primary text-white font-bold uppercase tracking-wider text-xs rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                            >
                                                Browse More Deals
                                            </Link>
                                        </div>

                                        <p className="text-[10px] text-gray-400 font-bold">
                                            This code is valid for {promotion?.endDate ? getPromoDaysLeft(promotion.endDate) : 7} days.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
