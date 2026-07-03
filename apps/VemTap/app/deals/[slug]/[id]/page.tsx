'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Clock, Users, Share2, CheckCircle2,
    Gift, ShieldCheck, ChevronLeft, ChevronRight, Star,
    MapPin, Loader2
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import JoinOfferModal from '@/components/promotions/JoinOfferModal';
import ShareDealModal from '@/components/promotions/ShareDealModal';
import {
    Promotion,
    formatDealPrice,
    getDaysLeft,
    getClaimPercent,
    getCategoryIcon,
} from '@/lib/promotions';
import { useCatalogueOfferDetails } from '@/services/catalogue/hooks';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

function adaptCatalogueOffer(offer: any): Promotion {
    const biz = offer.branch?.business || {};
    const br = offer.branch || {};
    
    const fallbackHours = [
        { day: 'Mon', open: '8:00 AM', close: '10:00 PM', closed: false },
        { day: 'Tue', open: '8:00 AM', close: '10:00 PM', closed: false },
        { day: 'Wed', open: '8:00 AM', close: '10:00 PM', closed: false },
        { day: 'Thu', open: '8:00 AM', close: '10:00 PM', closed: false },
        { day: 'Fri', open: '8:00 AM', close: '11:00 PM', closed: false },
        { day: 'Sat', open: '9:00 AM', close: '11:00 PM', closed: false },
        { day: 'Sun', open: '10:00 AM', close: '6:00 PM', closed: false },
    ];

    const hours = br.businessHours || biz.businessHours || fallbackHours;
    const formattedHours = Array.isArray(hours) 
        ? hours 
        : Object.entries(hours || {}).map(([day, val]: [string, any]) => ({
            day,
            open: val.open || '9:00 AM',
            close: val.close || '6:00 PM',
            closed: val.closed || false
        }));

    return {
        id: offer.id,
        title: offer.name,
        description: offer.description,
        longDescription: offer.longDescription || offer.description,
        image: offer.mainImage || 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80',
        originalPrice: Number(offer.originalPrice || offer.calculatedPrice || 0),
        dealPrice: Number(offer.dealPrice || offer.calculatedPrice || 0),
        discountPercent: offer.discountPercent || 0,
        discountAmount: Math.max(0, Number(offer.originalPrice || 0) - Number(offer.dealPrice || 0)),
        startDate: offer.startDate || new Date().toISOString(),
        endDate: offer.endDate || new Date(Date.now() + 86400000 * 30).toISOString(),
        claimedCount: offer.claimedCount || 0,
        maxClaims: offer.maxClaims || 100,
        isTrending: !!offer.isTrending,
        terms: offer.terms || ['Valid during business hours', 'Subject to availability'],
        business: {
            id: biz.id || br.businessId || 'unknown-biz',
            name: biz.name || br.name || 'Local Business',
            slug: biz.slug || 'local-business',
            logo: biz.logoUrl || br.logoUrl || '',
            photos: biz.photos || [br.logoUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'],
            categoryId: biz.categoryId || 'food-and-hospitality',
            categoryName: biz.categoryName || 'Local Shop',
            address: br.address || biz.address || 'Address not listed',
            hours: formattedHours.length > 0 ? formattedHours : fallbackHours,
            rating: Number(biz.rating || 4.5),
            totalReviews: Number(biz.totalReviews || 12),
        }
    };
}

export default function PromotionDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const slug = params.slug as string;

    const { data: rawOffer, isLoading } = useCatalogueOfferDetails(id);

    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);

    const promotion = useMemo(() => {
        if (!rawOffer) return null;
        return adaptCatalogueOffer(rawOffer);
    }, [rawOffer]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f4f5f6] flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <Loader2 size={48} className="text-primary animate-spin mb-4" />
                    <p className="text-gray-500 font-bold">Loading deal details...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (!promotion) {
        return (
            <div className="min-h-screen bg-[#f4f5f6] flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <Gift size={64} className="text-gray-200 mb-4" />
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

    const { business } = promotion;
    const daysLeft = getDaysLeft(promotion.endDate);
    const claimPct = getClaimPercent(promotion);
    const CategoryIcon = getCategoryIcon(business.categoryId);

    const getTodayHours = () => {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
        return business.hours.find((h: any) => h.day === today);
    };
    const todayHours = getTodayHours();

    const dealUrl = `${window.location.origin}/deals/${business.slug}/${promotion.id}`;

    const handleShare = () => {
        setShowShareModal(true);
    };

    return (
        <div className="min-h-screen bg-[#f4f5f6] font-body text-text-main">
            <Navbar />

            <main className="pt-24 pb-20">
                {/* Back nav */}
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
                                    src={business.photos[activePhotoIndex]}
                                    alt={business.name}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                {/* Badges */}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    {promotion.discountPercent && (
                                        <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-black shadow-lg">
                                            {promotion.discountPercent}% OFF
                                        </span>
                                    )}
                                    {promotion.discountAmount && !promotion.discountPercent && (
                                        <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-black shadow-lg">
                                            SAVE {formatDealPrice(promotion.discountAmount)}
                                        </span>
                                    )}
                                </div>

                                <button onClick={handleShare} className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-2.5 rounded-full hover:bg-white transition-colors">
                                    <Share2 size={18} className="text-gray-700" />
                                </button>

                                {/* Photo nav */}
                                {business.photos.length > 1 && (
                                    <>
                                        <button onClick={() => setActivePhotoIndex(i => (i - 1 + business.photos.length) % business.photos.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md p-2 rounded-full hover:bg-white transition-colors">
                                            <ChevronLeft size={18} className="text-gray-700" />
                                        </button>
                                        <button onClick={() => setActivePhotoIndex(i => (i + 1) % business.photos.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md p-2 rounded-full hover:bg-white transition-colors">
                                            <ChevronRight size={18} className="text-gray-700" />
                                        </button>
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                            {business.photos.map((_: any, i: number) => (
                                                <button key={i} onClick={() => setActivePhotoIndex(i)} className={cn("size-2 rounded-full transition-all", i === activePhotoIndex ? "bg-white w-6" : "bg-white/50")} />
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
                                    {promotion.longDescription}
                                </p>
                            </motion.div>

                            {/* Terms */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="bg-white rounded-2xl p-6 border border-gray-100"
                            >
                                <h2 className="text-lg font-headline font-bold text-gray-900 mb-3">Terms & Conditions</h2>
                                <ul className="space-y-2">
                                    {promotion.terms.map((term: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-500 font-medium">
                                            <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                                            {term}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
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
                                        {promotion.dealPrice === 0 ? 'FREE' : formatDealPrice(promotion.dealPrice)}
                                    </span>
                                    {promotion.originalPrice > promotion.dealPrice && (
                                        <span className="text-base text-gray-400 line-through font-bold">
                                            {formatDealPrice(promotion.originalPrice)}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <Users size={14} />
                                        <span className="text-xs font-bold">{promotion.claimedCount} claimed</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <span className="text-xs font-bold">{daysLeft > 0 ? `${daysLeft} days left` : 'Ending today'}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-gray-400">{promotion.claimedCount} of {promotion.maxClaims}</span>
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

                                <button onClick={handleShare} className="w-full h-11 bg-gray-50 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 border border-gray-100">
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
                                        <CategoryIcon size={22} className="text-primary" />
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

                                <div className="flex items-center gap-2">
                                    <Star size={14} className="text-yellow-400 fill-yellow-400 shrink-0" />
                                    <span className="text-sm font-bold text-gray-900">{business.rating}</span>
                                    <span className="text-xs text-gray-400">({business.totalReviews} reviews)</span>
                                </div>

                                {/* Hours */}
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Business Hours</p>
                                    <div className="grid grid-cols-1 gap-1">
                                        {business.hours.map((h: any) => (
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
                            </motion.div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            <ShareDealModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                title={promotion.title}
                description={promotion.longDescription}
                url={dealUrl}
            />

            <JoinOfferModal
                isOpen={showJoinModal}
                onClose={() => setShowJoinModal(false)}
                offerTitle={promotion.title}
                businessName={business.name}
                offerId={promotion.id}
            />
        </div>
    );
}
