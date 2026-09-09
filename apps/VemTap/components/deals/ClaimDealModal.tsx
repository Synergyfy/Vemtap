'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, CheckCircle, Store, Clock, Info, Copy, Check } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDealPrice } from '@/lib/promotions';
import { requestClaimOtp, verifyClaimOtp } from '@/services/deals/hooks';
import { signupVisitorAndLogin } from '@/lib/visitorAuth';
import RedeemDealModal from './RedeemDealModal';

export interface ClaimConfig {
    branchId: string;
    deviceId?: string;
    sessionToken?: string;
    successPath?: string;
    onSuccess?: () => void;
    quantity?: number;
}

interface ClaimDealModalProps {
    isOpen: boolean;
    onClose: () => void;
    deal: {
        id: string;
        title: string;
        businessName: string;
        image: string;
        dealPrice: number;
        originalPrice: number;
        discountLabel: string;
        slug: string;
    };
    claimConfig?: ClaimConfig;
}

type ModalView = 'form' | 'otp' | 'confirm' | 'success' | 'mydeal';

export default function ClaimDealModal({ isOpen, onClose, deal, claimConfig }: ClaimDealModalProps) {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const [view, setView] = useState<ModalView>(isAuthenticated ? 'confirm' : 'form');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [claimCode, setClaimCode] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [showRedeemModal, setShowRedeemModal] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (isAuthenticated && user) {
                setTimeout(() => {
                    setFormData({
                        name: user.name || '',
                        email: user.email || '',
                        phone: user.phone || '',
                    });
                    setView('confirm');
                }, 0);
            } else {
                setTimeout(() => setView('form'), 0);
            }
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen, isAuthenticated, user]);

    const requestOtp = async (info: { name: string; email: string; phone: string }) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const nameParts = info.name.trim().split(/\s+/);
            await requestClaimOtp({
                offerId: deal.id,
                firstName: nameParts[0] || 'Guest',
                email: info.email,
                phone: info.phone || '',
            });
            setView('otp');
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to send verification code. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const verifyOtp = async () => {
        if (!otpCode.trim()) {
            setError('Please enter the verification code');
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            if (claimConfig && !isAuthenticated) {
                const { branchId } = claimConfig;
                await signupVisitorAndLogin({
                    name: formData.name,
                    email: formData.email || undefined,
                    phone: formData.phone || undefined,
                    branchId,
                });
            }

            const res = await verifyClaimOtp({
                email: formData.email,
                offerId: deal.id,
                code: otpCode,
            });

            const code = res.claim?.claimCode || '';
            setClaimCode(code);

            if (claimConfig?.onSuccess) {
                claimConfig.onSuccess();
                return;
            }
            if (claimConfig?.successPath) {
                router.push(claimConfig.successPath);
                return;
            }
            setView('success');
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Invalid or expired code. Please verify and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.email.trim()) {
            setError('Please fill in your name and email');
            return;
        }
        if (!agreedToTerms) {
            setError('Please agree to the terms');
            return;
        }
        setError(null);
        if (claimConfig) {
            await requestOtp(formData);
        } else {
            setIsSubmitting(true);
            try {
                await new Promise((r) => setTimeout(r, 1500));
                setView('success');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleConfirm = async () => {
        if (!agreedToTerms) {
            setError('Please agree to the terms');
            return;
        }
        setError(null);
        if (claimConfig) {
            await requestOtp(formData);
        } else {
            setIsSubmitting(true);
            try {
                await new Promise((r) => setTimeout(r, 1500));
                setView('success');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleViewMyDeal = () => {
        setView('mydeal');
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(claimCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 flex items-center justify-between px-5 h-14 border-b border-gray-100 rounded-t-3xl sm:rounded-t-3xl">
                            <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                            <h2 className="text-[15px] font-semibold text-gray-900">
                                {view === 'form' && 'Claim Deal'}
                                {view === 'otp' && 'Verify Code'}
                                {view === 'confirm' && 'Confirm Details'}
                                {view === 'success' && 'Deal Claimed!'}
                                {view === 'mydeal' && 'My Deal'}
                            </h2>
                            <div className="w-10" />
                        </div>

                        <div className="p-5">
                            {/* Deal Summary Card */}
                            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex gap-3 mb-5">
                                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                                    <img src={deal.image} alt={deal.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="inline-flex items-center gap-1 text-[#0055c4] bg-[#066cf4]/10 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase mb-1">
                                        {deal.discountLabel || 'DEAL'}
                                    </div>
                                    <h3 className="text-[14px] font-semibold text-gray-900 line-clamp-1">{deal.title}</h3>
                                    <p className="text-[12px] text-gray-500 mt-0.5">{deal.businessName}</p>
                                </div>
                            </div>

                            {/* Form View */}
                            {view === 'form' && (
                                <div className="space-y-4">
                                    <h3 className="text-[16px] font-semibold text-gray-900">Your Information</h3>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[11px] font-medium text-gray-500 block mb-1">Full Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Enter your full name"
                                                className="w-full h-11 px-4 rounded-lg border border-gray-200 bg-white text-[14px] focus:border-[#0055c4] focus:ring-1 focus:ring-[#0055c4] outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-medium text-gray-500 block mb-1">Email Address</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="Enter your email"
                                                className="w-full h-11 px-4 rounded-lg border border-gray-200 bg-white text-[14px] focus:border-[#0055c4] focus:ring-1 focus:ring-[#0055c4] outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-medium text-gray-500 block mb-1">Phone Number</label>
                                            <div className="flex gap-2">
                                                <select className="h-11 px-3 rounded-lg border border-gray-200 bg-white text-[14px] focus:border-[#0055c4] focus:ring-1 focus:ring-[#0055c4] outline-none transition-all w-24">
                                                    <option>+234</option>
                                                    <option>+1</option>
                                                    <option>+44</option>
                                                </select>
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    placeholder="Enter phone number"
                                                    className="flex-grow h-11 px-4 rounded-lg border border-gray-200 bg-white text-[14px] focus:border-[#0055c4] focus:ring-1 focus:ring-[#0055c4] outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Terms */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={agreedToTerms}
                                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                                className="mt-1 w-4 h-4 rounded border-gray-300 text-[#0055c4] focus:ring-[#0055c4]"
                                            />
                                            <span className="text-[13px] text-gray-500 leading-tight">
                                                I agree to the <span className="text-[#0055c4] font-medium">Terms of Service</span> and confirm I want to claim this deal.
                                            </span>
                                        </label>
                                    </div>

                                    {error && (
                                        <p className="text-[12px] text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>
                                    )}

                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || !formData.name.trim() || !formData.email.trim()}
                                        className="w-full h-12 bg-[#0055c4] text-white font-semibold text-[14px] rounded-lg flex items-center justify-center gap-2 hover:bg-[#0055c4]/90 transition-colors active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Claim Deal
                                                <CheckCircle size={18} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* OTP View */}
                            {view === 'otp' && (
                                <div className="space-y-4">
                                    <p className="text-[13px] text-gray-500 text-center">
                                        We sent a verification code to <strong className="text-gray-900">{formData.email}</strong>.
                                        Please enter the code below to complete your claim.
                                    </p>

                                    <div className="flex flex-col items-center gap-1">
                                        <label className="text-[11px] font-medium text-gray-500">Verification Code</label>
                                        <input
                                            type="text"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value)}
                                            placeholder="------"
                                            maxLength={6}
                                            className="w-full max-w-[200px] h-12 px-4 rounded-lg border border-gray-200 bg-white text-[18px] text-center font-mono tracking-[0.3em] focus:border-[#0055c4] focus:ring-1 focus:ring-[#0055c4] outline-none transition-all"
                                        />
                                    </div>

                                    {error && (
                                        <p className="text-[12px] text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>
                                    )}

                                    <button
                                        onClick={verifyOtp}
                                        disabled={isSubmitting || !otpCode.trim()}
                                        className="w-full h-12 bg-[#0055c4] text-white font-semibold text-[14px] rounded-lg flex items-center justify-center gap-2 hover:bg-[#0055c4]/90 transition-colors active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            'Verify & Claim Deal'
                                        )}
                                    </button>

                                    <button
                                        onClick={() => { setView('form'); setError(null); }}
                                        className="w-full h-10 text-[13px] text-gray-500 hover:text-gray-700 font-medium transition-colors"
                                    >
                                        Go Back / Edit Details
                                    </button>
                                </div>
                            )}

                            {/* Confirm View (authenticated user) */}
                            {view === 'confirm' && (
                                <div className="space-y-4">
                                    <p className="text-[13px] text-gray-500">Confirm this is your information to claim this deal:</p>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="text-[12px] text-gray-500">Name</span>
                                            <span className="text-[13px] font-semibold text-gray-900">{formData.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="text-[12px] text-gray-500">Email</span>
                                            <span className="text-[13px] font-semibold text-gray-900">{formData.email}</span>
                                        </div>
                                        {formData.phone && (
                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span className="text-[12px] text-gray-500">Phone</span>
                                                <span className="text-[13px] font-semibold text-gray-900">{formData.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={agreedToTerms}
                                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                                className="mt-1 w-4 h-4 rounded border-gray-300 text-[#0055c4] focus:ring-[#0055c4]"
                                            />
                                            <span className="text-[13px] text-gray-500 leading-tight">
                                                I agree to the <span className="text-[#0055c4] font-medium">Terms of Service</span> and confirm I want to claim this deal.
                                            </span>
                                        </label>
                                    </div>

                                    {error && (
                                        <p className="text-[12px] text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>
                                    )}

                                    <button
                                        onClick={handleConfirm}
                                        disabled={isSubmitting || !agreedToTerms}
                                        className="w-full h-12 bg-[#0055c4] text-white font-semibold text-[14px] rounded-lg flex items-center justify-center gap-2 hover:bg-[#0055c4]/90 transition-colors active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Confirm & Claim Deal
                                                <CheckCircle size={18} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Success View */}
                            {view === 'success' && (
                                <SuccessView
                                    deal={deal}
                                    claimCode={claimCode}
                                    onViewMyDeal={handleViewMyDeal}
                                    onViewBusiness={() => { onClose(); router.push(`/${deal.slug}`); }}
                                />
                            )}

                            {/* My Deal View */}
                            {view === 'mydeal' && (
                                <MyDealView
                                    deal={deal}
                                    claimCode={claimCode}
                                    onCopyCode={handleCopyCode}
                                    copied={copied}
                                    onRedeemClick={() => setShowRedeemModal(true)}
                                />
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Redeem Deal Modal — rendered outside AnimatePresence to avoid parent backdrop intercepting clicks */}
        <RedeemDealModal
            isOpen={showRedeemModal}
            onClose={() => setShowRedeemModal(false)}
            deal={deal}
            onChat={() => { onClose(); router.push(`/chat?business=${deal.slug}`); }}
        />
        </>
    );
}

function SuccessView({ deal, claimCode, onViewMyDeal, onViewBusiness }: {
    deal: ClaimDealModalProps['deal'];
    claimCode: string;
    onViewMyDeal: () => void;
    onViewBusiness: () => void;
}) {
    useEffect(() => {
        const container = document.getElementById('confetti-container');
        if (!container) return;
        const colors = ['#0055c4', '#066cf4', '#b0c6ff', '#d0e1fb'];
        const pieces: HTMLDivElement[] = [];
        for (let i = 0; i < 40; i++) {
            const el = document.createElement('div');
            el.className = 'absolute w-2.5 h-5 rounded-sm opacity-0';
            el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            el.style.left = `${Math.random() * 100}%`;
            el.style.top = '-20px';
            el.animate([
                { transform: 'translate3d(0,0,0) rotate(0deg)', opacity: 1 },
                { transform: `translate3d(${Math.random() * 100 - 50}px, 600px, 0) rotate(${Math.random() * 720}deg)`, opacity: 0 },
            ], { duration: (Math.random() * 2 + 2) * 1000, delay: Math.random() * 500, easing: 'cubic-bezier(.37,0,.63,1)', fill: 'forwards' });
            container.appendChild(el);
            pieces.push(el);
        }
        return () => pieces.forEach((p) => p.remove());
    }, []);

    return (
        <div className="flex flex-col items-center text-center">
            <div id="confetti-container" className="absolute inset-0 pointer-events-none" />

            <div className="w-20 h-20 bg-[#066cf4] rounded-full flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(6,108,244,0.2)]">
                <CheckCircle size={40} className="text-white" />
            </div>
            <h2 className="text-[22px] font-bold text-gray-900 mb-2">Deal Claimed!</h2>
            <p className="text-[14px] text-gray-500 mb-6">Your {deal.title} has been successfully secured.</p>

            {/* Claim Code */}
            {claimCode && (
                <div className="w-full bg-gray-50 rounded-xl border border-gray-200 p-4 mb-5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Your Claim Code</p>
                    <p className="text-[20px] font-mono tracking-widest text-[#0055c4] font-bold">{claimCode}</p>
                </div>
            )}

            {/* Deal Summary */}
            <div className="w-full bg-white rounded-xl border border-gray-200 p-4 mb-5 text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Deal Summary</p>
                <div className="flex items-start gap-3 mb-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-200">
                        <img src={deal.image} alt={deal.title} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h3 className="text-[14px] font-semibold text-gray-900">{deal.title}</h3>
                        <p className="text-[12px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <Store size={12} /> {deal.businessName}
                        </p>
                    </div>
                </div>
                <div className="flex justify-between items-center py-2.5 border-y border-gray-100 my-2.5">
                    <span className="text-[13px] text-gray-500">Total Value</span>
                    <span className="text-[18px] font-bold text-[#0055c4]">{formatDealPrice(deal.originalPrice)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 bg-gray-50 p-3 rounded-lg">
                    <Clock size={16} className="text-[#0055c4] shrink-0" />
                    <p className="text-[13px]">Valid until <strong className="text-gray-900">Sunday, 5:00 PM</strong></p>
                </div>
            </div>

            <div className="w-full space-y-2.5">
                <button
                    onClick={onViewMyDeal}
                    className="w-full h-12 bg-[#0055c4] text-white font-semibold text-[14px] rounded-lg flex items-center justify-center gap-2 hover:bg-[#0055c4]/90 active:scale-[0.98] transition-all"
                >
                    View My Deal
                </button>
                <button
                    onClick={onViewBusiness}
                    className="w-full h-12 bg-transparent border border-[#0055c4] text-[#0055c4] font-semibold text-[14px] rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-[0.98] transition-all"
                >
                    View Business
                </button>
            </div>
        </div>
    );
}

function MyDealView({ deal, claimCode, onCopyCode, copied, onRedeemClick }: {
    deal: ClaimDealModalProps['deal'];
    claimCode: string;
    onCopyCode: () => void;
    copied: boolean;
    onRedeemClick: () => void;
}) {
    return (
        <div className="space-y-4">
            {/* Deal Image & Info */}
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <div className="relative w-full aspect-[16/9] bg-gray-100">
                    <img src={deal.image} alt={deal.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 bg-white text-[#0055c4] text-[11px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                        <CheckCircle size={14} />
                        Claimed
                    </div>
                </div>
                <div className="p-4">
                    <h3 className="text-[18px] font-bold text-gray-900">{deal.title}</h3>
                    <p className="text-[13px] text-gray-500 flex items-center gap-1 mt-1">
                        <Store size={14} /> {deal.businessName}
                    </p>

                    {/* Claim Code */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Your Claim Code</p>
                        <div className="bg-gray-50 px-4 py-2.5 rounded-lg text-center">
                            <span className="text-[20px] font-mono tracking-widest text-[#0055c4] font-bold">{claimCode || 'CLAIMED'}</span>
                        </div>
                        {claimCode && (
                            <button
                                onClick={onCopyCode}
                                className="mt-2 w-full h-10 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center gap-2 text-[13px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                {copied ? 'Copied!' : 'Copy Code'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-[#d9e2ff] rounded-xl p-4 border border-[#b0c6ff]">
                <div className="flex items-center gap-2 mb-2">
                    <Info size={16} className="text-[#00429b]" />
                    <h4 className="text-[14px] font-semibold text-[#001945]">HOW TO USE</h4>
                </div>
                <p className="text-[13px] text-[#00429b]">
                    Show this claim code at the business when redeeming your Deal.
                </p>
            </div>

            {/* Redeem Button */}
            <button
                onClick={onRedeemClick}
                className="w-full h-12 bg-[#0055c4] text-white font-semibold text-[14px] rounded-lg flex items-center justify-center gap-2 hover:bg-[#0055c4]/90 active:scale-[0.98] transition-all"
            >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>redeem</span>
                Redeem / Use Deal
            </button>
        </div>
    );
}
