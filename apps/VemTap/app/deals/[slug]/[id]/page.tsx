'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Clock, Users, Share2, CheckCircle2,
    Gift, ShieldCheck, ChevronLeft, ChevronRight, Star,
    MapPin, Loader2, AlertCircle
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import JoinOfferModal from '@/components/promotions/JoinOfferModal';
import ShareDealModal from '@/components/promotions/ShareDealModal';
import { usePublicOfferDetails } from '@/services/deals/hooks';
import type { DealBusiness } from '@/services/deals/types';
import { formatDealPrice, getCategoryIcon } from '@/lib/promotions';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

function getDaysLeft(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getClaimPercent(claimed: number, max: number): number {
    return Math.round((claimed / max) * 100);
}

function formatDealDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-NG', {
        month: 'short',
        day: 'numeric',
    });
}

function getUrgencyText(endDate: string): string {
    const days = getDaysLeft(endDate);
    if (days === 0) return 'Ends today';
    if (days === 1) return 'Ends tomorrow';
    if (days <= 7) return `${days} days left`;
    return `Ends ${formatDealDate(endDate)}`;
}

interface BusinessHours {
    day: string;
    open: string;
    close: string;
    closed: boolean;
}

function getTodayHours(hours: BusinessHours[]) {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    return hours.find(h => h.day === today);
}

function normalizeHours(business: DealBusiness): BusinessHours[] {
    return business.hours || [];
}

export default function PromotionDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const { data: offer, isLoading, isError } = usePublicOfferDetails(id);

    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);

    const business = offer?.business;
    const hours = useMemo(() => business ? normalizeHours(business) : [], [business]);
    const todayHours = useMemo(() => hours.length ? getTodayHours(hours) : undefined, [hours]);
    const daysLeft = offer ? getDaysLeft(offer.endDate || '') : 0;
    const claimPct = offer ? getClaimPercent(offer.claimedCount, offer.maxClaims) : 0;
    const CategoryIcon = business ? getCategoryIcon(business.categoryId) : null;
    const photos = business?.photos || [];

    const discountPercent = offer?.pricingType === 'percentage_discount' && offer.discountValue
        ? offer.discountValue : undefined;
    const discountAmount = offer?.pricingType === 'fixed_discount_price' && offer.discountValue
        ? offer.discountValue : undefined;
    const originalPrice = useMemo(() => {
        if (!offer) return 0;
        if (discountPercent) return Math.round(offer.calculatedPrice / (1 - discountPercent / 100));
        if (discountAmount) return offer.calculatedPrice + discountAmount;
        return offer.calculatedPrice;
    }, [offer, discountPercent, discountAmount]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f4f5f6] flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 size={32} className="animate-spin text-primary" />
                        <p className="text-sm font-bold text-gray-400">Loading deal...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (isError || !offer || !business) {
        return (
            <div className="min-h-screen bg-[#f4f5f6] flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <AlertCircle size={64} className="text-gray-200 mb-4" />
                    <h1 className="text-2xl font-black text-gray-900 mb-2">Deal Not Found</h1>
                    <p className="text-gray-500 font-bold mb-8">This deal may have expired or doesn&apos;t exist.</p>
                    <Link
                        href="/deals"
                        className="px-8 h-12 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                        <ArrowLeft size={16} /> Browse Deals
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const dealUrl = `${window.location.origin}/deals/${business.slug}/${offer.id}`;

    return (
        <div className="min-h-screen bg-[#f4f5f6] font-body text-text-main">
            <Navbar />

            <main className="pt-24 pb-20">
                <div className="max-w-5xl mx-auto px-4 md:px-8 mb-6">
                    <Link
                        href="/deals"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-primary text-sm font-bold transition-colors"
                    >
                        <ArrowLeft size={16} /> All Deals
                    </Link>
                </div>

                <div className="max-w-5xl mx-auto px-4 md:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        {/* Left: Photo + Details */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Photo */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-gray-100"
                            >
                                <motion.img
                                    key={activePhotoIndex}
                                    src={photos[activePhotoIndex] || offer.mainImage}
                                    alt={business.name}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                <div className="absolute top-4 left-4 flex gap-2">
                                    {discountPercent && (
                                        <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-black shadow-lg">
                                            {discountPercent}% OFF
                                        </span>
                                    )}
                                    {discountAmount && !discountPercent && (
                                        <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-black shadow-lg">
                                            SAVE {formatDealPrice(discountAmount)}
                                        </span>
                                    )}
                                </div>

                                <button onClick={() => setShowShareModal(true)} className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-2.5 rounded-full hover:bg-white transition-colors">
                                    <Share2 size={18} className="text-gray-700" />
                                </button>

                                {photos.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setActivePhotoIndex(i => (i - 1 + photos.length) % photos.length)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md p-2 rounded-full hover:bg-white transition-colors"
                                        >
                                            <ChevronLeft size={18} className="text-gray-700" />
                                        </button>
                                        <button
                                            onClick={() => setActivePhotoIndex(i => (i + 1) % photos.length)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md p-2 rounded-full hover:bg-white transition-colors"
                                        >
                                            <ChevronRight size={18} className="text-gray-700" />
                                        </button>
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                            {photos.map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setActivePhotoIndex(i)}
                                                    className={cn(
                                                        "size-2 rounded-full transition-all",
                                                        i === activePhotoIndex ? "bg-white w-6" : "bg-white/50"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </motion.div>

                            {/* Description */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white rounded-2xl p-6 border border-gray-100"
                            >
                                <h2 className="text-lg font-headline font-bold text-gray-900 mb-3">About This Deal</h2>
                                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                    {offer.longDescription || offer.description}
                                </p>
                            </motion.div>

                            {/* Terms */}
                            {offer.terms && offer.terms.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="bg-white rounded-2xl p-6 border border-gray-100"
                                >
                                    <h2 className="text-lg font-headline font-bold text-gray-900 mb-3">Terms & Conditions</h2>
                                    <ul className="space-y-2">
                                        {offer.terms.map((term, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-500 font-medium">
                                                <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                                                {term}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                        </div>

                        {/* Right: Sidebar */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Price Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5"
                            >
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl font-black text-primary font-display tracking-tight">
                                        {offer.calculatedPrice === 0 ? 'FREE' : formatDealPrice(offer.calculatedPrice)}
                                    </span>
                                    {originalPrice > offer.calculatedPrice && (
                                        <span className="text-base text-gray-400 line-through font-bold">
                                            {formatDealPrice(originalPrice)}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <Users size={14} />
                                        <span className="text-xs font-bold">{offer.claimedCount} claimed</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <Clock size={14} />
                                        <span className="text-xs font-bold">{daysLeft > 0 ? `${daysLeft} days left` : 'Ending today'}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-gray-400">{offer.claimedCount} of {offer.maxClaims}</span>
                                        <span className="text-primary">{claimPct}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: `${Math.min(claimPct, 100)}%` }} />
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowJoinModal(true)}
                                    className="w-full h-13 bg-primary text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Gift size={18} /> Join Offer
                                </button>

                                <button
                                    onClick={() => setShowShareModal(true)}
                                    className="w-full h-11 bg-gray-50 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 border border-gray-100"
                                >
                                    <Share2 size={14} /> Share Deal
                                </button>

                                <div className="flex items-center gap-2 text-gray-500 pt-1">
                                    <ShieldCheck size={14} />
                                    <span className="text-xs font-bold">Verified by VemTap</span>
                                </div>
                            </motion.div>

                            {/* Business Info */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="size-12 rounded-xl bg-gray-50 flex items-center justify-center">
                                        {CategoryIcon && <CategoryIcon size={22} className="text-primary" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{business.name}</p>
                                        <p className="text-xs text-gray-400 font-bold">{business.categoryName}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <MapPin size={12} className="text-gray-400 shrink-0" />
                                    <span className="text-xs text-gray-500 font-bold">{business.address}</span>
                                </div>

                                {(business.rating || business.rating === 0) && (
                                    <div className="flex items-center gap-2">
                                        <Star size={14} className="text-yellow-400 fill-yellow-400 shrink-0" />
                                        <span className="text-sm font-bold text-gray-900">{business.rating}</span>
                                        <span className="text-xs text-gray-400">({business.totalReviews || 0} reviews)</span>
                                    </div>
                                )}

                                {/* Hours */}
                                {hours.length > 0 && (
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Business Hours</p>
                                        <div className="grid grid-cols-1 gap-1">
                                            {hours.map(h => (
                                                <div key={h.day} className="flex justify-between text-[11px] font-bold">
                                                    <span className={cn(h.day === todayHours?.day ? "text-primary" : "text-gray-500")}>
                                                        {h.day}
                                                    </span>
                                                    <span className={cn(h.closed ? "text-red-400" : "text-gray-500")}>
                                                        {h.closed ? 'Closed' : `${h.open} - ${h.close}`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        {todayHours && !todayHours.closed && (
                                            <p className="text-[11px] text-green-600 font-bold pt-1">
                                                Open now · Closes at {todayHours.close}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            <ShareDealModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                title={offer.name}
                description={offer.longDescription || offer.description}
                url={dealUrl}
            />

            <JoinOfferModal
                isOpen={showJoinModal}
                onClose={() => setShowJoinModal(false)}
                offerTitle={offer.name}
                businessName={business.name}
                offerId={offer.id}
            />
        </div>
    );
}
