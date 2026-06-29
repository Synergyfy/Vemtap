'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, MapPin, Clock, Users, Share2, CheckCircle2,
    Loader2, Gift, ShieldCheck, Copy, X, ChevronRight, Phone, Mail
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { MOCK_PROMOTIONS, formatPromoPrice, formatPromoDate, getPromoDaysLeft } from '@/lib/mock/promotions';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

type ClaimStep = 'form' | 'otp' | 'success';

export default function PromotionDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const promotion = MOCK_PROMOTIONS.find(p => p.id === id);

    const [showClaimModal, setShowClaimModal] = useState(false);
    const [claimStep, setClaimStep] = useState<ClaimStep>('form');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [claimForm, setClaimForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
    });
    const [otp, setOtp] = useState('');
    const [claimCode, setClaimCode] = useState('');

    if (!promotion) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <Gift size={64} className="text-gray-200 mb-4" />
                    <h1 className="text-2xl font-black text-gray-900 mb-2">Promotion Not Found</h1>
                    <p className="text-gray-500 font-bold mb-8">This deal may have expired or doesn&apos;t exist.</p>
                    <Link
                        href="/promotions"
                        className="px-8 h-12 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2"
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

    const handleClaimSubmit = () => {
        if (!claimForm.firstName || !claimForm.email || !claimForm.phone) {
            toast.error('Please fill in all required fields');
            return;
        }
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setClaimStep('otp');
        }, 1500);
    };

    const handleOtpVerify = () => {
        if (otp.length < 4) {
            toast.error('Please enter the verification code');
            return;
        }
        setIsSubmitting(true);
        setTimeout(() => {
            const code = `VEM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            setClaimCode(code);
            setIsSubmitting(false);
            setClaimStep('success');
        }, 1500);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
    };

    const resetModal = () => {
        setShowClaimModal(false);
        setClaimStep('form');
        setOtp('');
        setClaimForm({ firstName: '', lastName: '', email: '', phone: '' });
    };

    return (
        <div className="min-h-screen bg-white font-body text-text-main">
            <Navbar />

            <main className="pt-24 pb-20">
                {/* Back nav */}
                <div className="max-w-4xl mx-auto px-4 md:px-8 mb-6">
                    <Link
                        href="/promotions"
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
                            <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-black shadow-lg">
                                {promotion.discountPercent}% OFF
                            </div>
                        )}
                        {promotion.discountAmount && !promotion.discountPercent && (
                            <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-black shadow-lg">
                                SAVE {formatPromoPrice(promotion.discountAmount)}
                            </div>
                        )}

                        {/* Share */}
                        <button
                            onClick={handleShare}
                            className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-2.5 rounded-full hover:bg-white transition-colors"
                        >
                            <Share2 size={18} className="text-gray-700" />
                        </button>

                        {/* Bottom overlay info */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">
                                {promotion.businessName}
                            </p>
                            <h1 className="text-3xl md:text-4xl font-headline font-black text-white tracking-tight">
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
                                    <span className="text-4xl font-black text-primary font-display tracking-tight">
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
                                    className="w-full h-14 bg-primary text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
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
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Offered by</p>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{promotion.businessName}</p>
                                        <p className="text-xs text-gray-400 font-bold flex items-center gap-1 mt-1">
                                            <MapPin size={10} /> {promotion.location}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

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
                                {/* Step 1: Form */}
                                {claimStep === 'form' && (
                                    <motion.div
                                        key="form"
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
                                                Fill in your details to claim <strong>{promotion.name}</strong> from {promotion.businessName}.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                                                        First Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={claimForm.firstName}
                                                        onChange={(e) => setClaimForm(f => ({ ...f, firstName: e.target.value }))}
                                                        className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                                                        placeholder="Chidi"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                                                        Last Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={claimForm.lastName}
                                                        onChange={(e) => setClaimForm(f => ({ ...f, lastName: e.target.value }))}
                                                        className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                                                        placeholder="Okonkwo"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                                                    Phone Number *
                                                </label>
                                                <div className="relative">
                                                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="tel"
                                                        value={claimForm.phone}
                                                        onChange={(e) => setClaimForm(f => ({ ...f, phone: e.target.value }))}
                                                        className="w-full h-11 pl-10 pr-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                                                        placeholder="0801 234 5678"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                                                    Email Address *
                                                </label>
                                                <div className="relative">
                                                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="email"
                                                        value={claimForm.email}
                                                        onChange={(e) => setClaimForm(f => ({ ...f, email: e.target.value }))}
                                                        className="w-full h-11 pl-10 pr-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                                                        placeholder="chidi@example.com"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleClaimSubmit}
                                            disabled={isSubmitting}
                                            className="w-full h-13 bg-primary text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isSubmitting ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <>Continue <ChevronRight size={16} /></>
                                            )}
                                        </button>

                                        <p className="text-[10px] text-gray-400 text-center font-bold">
                                            By claiming, you agree to VemTap&apos;s Terms of Service.
                                        </p>
                                    </motion.div>
                                )}

                                {/* Step 2: OTP */}
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
                                                We&apos;ve sent a verification code to <strong>{claimForm.phone}</strong>. Enter it below to confirm your claim.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                                                Verification Code
                                            </label>
                                            <input
                                                type="text"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                                                placeholder="000000"
                                                maxLength={6}
                                            />
                                        </div>

                                        <button
                                            onClick={handleOtpVerify}
                                            disabled={isSubmitting}
                                            className="w-full h-13 bg-primary text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isSubmitting ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                'Verify & Claim'
                                            )}
                                        </button>

                                        <button
                                            onClick={() => setClaimStep('form')}
                                            className="w-full text-xs font-bold text-gray-400 hover:text-primary transition-colors"
                                        >
                                            ← Back to details
                                        </button>
                                    </motion.div>
                                )}

                                {/* Step 3: Success */}
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
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                                                Your Claim Code
                                            </p>
                                            <p className="text-3xl font-black text-primary tracking-[0.3em] font-display">
                                                {claimCode}
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(claimCode);
                                                    toast.success('Code copied!');
                                                }}
                                                className="w-full h-12 bg-gray-50 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 border border-gray-100"
                                            >
                                                <Copy size={14} /> Copy Code
                                            </button>

                                            <Link
                                                href="/promotions"
                                                onClick={resetModal}
                                                className="w-full h-12 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                            >
                                                Browse More Deals
                                            </Link>
                                        </div>

                                        <p className="text-[10px] text-gray-400 font-bold">
                                            This code is valid for 7 days. You&apos;ll also receive a confirmation at {claimForm.email}.
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
