'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    CheckCircle,
    Store,
    Clock,
    Info,
    Mail,
    Lock,
    Eye,
    EyeOff,
    User as UserIcon,
    ArrowLeft,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Gift,
    Send,
    Heart,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import {
    useLogin,
    useCustomerRegisterRequestOtp,
    useCustomerResendRegistrationOtp,
    useCustomerRegisterVerifyAndSetPin,
} from '@/services/auth/hooks';
import { formatDealPrice } from '@/lib/promotions';
import { useCreateCatalogueOrder } from '@/services/catalogue/hooks';
import { useSendDealGift } from '@/services/deals/hooks';
import RedeemDealModal from './RedeemDealModal';
import { toast } from 'react-hot-toast';

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
        businessPhone?: string;
    };
    claimConfig?: ClaimConfig;
    initialEmail?: string;
    initialView?: ModalView;
}

type ModalView =
    | 'logged-in'
    | 'login'
    | 'signup-email'
    | 'signup-otp'
    | 'signup-profile'
    | 'gift'
    | 'gift-success'
    | 'success'
    | 'mydeal';

const isEmailValid = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
const isPinValid = (val: string) => /^\d{6}$/.test(val.trim());

export default function ClaimDealModal({
    isOpen,
    onClose,
    deal,
    claimConfig,
    initialEmail,
    initialView,
}: ClaimDealModalProps) {
    const router = useRouter();
    const { isAuthenticated, user, login } = useAuthStore();
    const createOrderMutation = useCreateCatalogueOrder();
    const sendGiftMutation = useSendDealGift();

    // Hooks for authentication
    const { loginUser } = useLogin();
    const { requestOtp } = useCustomerRegisterRequestOtp();
    const { resendOtp } = useCustomerResendRegistrationOtp();
    const { verifyAndSetPin } = useCustomerRegisterVerifyAndSetPin();

    // Modal state
    const [view, setView] = useState<ModalView>(
        initialView || (isAuthenticated ? 'logged-in' : 'login')
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Login form state
    const [loginForm, setLoginForm] = useState({ email: initialEmail || '', pin: '' });
    const [showLoginPin, setShowLoginPin] = useState(false);

    // Gift deal form state
    const [giftRecipientEmail, setGiftRecipientEmail] = useState('');
    const [giftSenderName, setGiftSenderName] = useState('');
    const [giftNote, setGiftNote] = useState('');
    const [giftIntent, setGiftIntent] = useState(false);

    // Sign up form state
    const [signupEmail, setSignupEmail] = useState(initialEmail || '');
    const [signupOtp, setSignupOtp] = useState('');
    const [signupProfile, setSignupProfile] = useState({
        firstName: '',
        lastName: '',
        pin: '',
        confirmPin: '',
    });
    const [showSignupPin, setShowSignupPin] = useState(false);
    const [showConfirmPin, setShowConfirmPin] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [resendLoading, setResendLoading] = useState(false);

    // Terms agreement
    const [agreedToTerms, setAgreedToTerms] = useState(true);

    // Redemption / celebration state
    const [redemptionCode, setRedemptionCode] = useState('');
    const [showRedeemModal, setShowRedeemModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Enforce auth requirement on gift view
    useEffect(() => {
        if (view === 'gift' && !isAuthenticated) {
            setGiftIntent(true);
            setView('login');
            setError('Please sign in or create an account to gift this deal.');
        }
    }, [view, isAuthenticated]);

    // Generate simulated redemption code for preview
    useEffect(() => {
        if (!isOpen) return;
        const prefix = deal.id.toUpperCase().slice(0, 3);
        const array = new Uint8Array(4);
        crypto.getRandomValues(array);
        const suffix = Array.from(array, (b) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[b % 36]).join('');
        setRedemptionCode(`VEM-${prefix}-${suffix}`);
    }, [isOpen, deal.id]);

    // Initialize state on open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setError(null);
            setSuccessMessage(null);
            setIsSubmitting(false);
            setResendTimer(0);
            setResendLoading(false);
            setLoginForm({ email: initialEmail || '', pin: '' });
            setShowLoginPin(false);
            setSignupEmail(initialEmail || '');
            setSignupOtp('');
            setSignupProfile({ firstName: '', lastName: '', pin: '', confirmPin: '' });
            setShowSignupPin(false);
            setShowConfirmPin(false);
            setAgreedToTerms(true);
            setGiftRecipientEmail('');
            setGiftNote('');
            setGiftIntent(initialView === 'gift' && !isAuthenticated);
            const currentName = (user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`).trim();
            setGiftSenderName(currentName);

            if (initialView) {
                if (initialView === 'gift' && !isAuthenticated) {
                    setView('login');
                    setError('Please sign in or create an account to gift this deal.');
                } else {
                    setView(initialView);
                }
            } else if (isAuthenticated && user) {
                setView('logged-in');
            } else {
                setView('login');
            }
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, isAuthenticated, user, initialEmail, initialView]);

    // Resend countdown timer
    useEffect(() => {
        if (resendTimer <= 0) return;
        const interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [resendTimer]);

    // Execute the deal claim order
    const performRealClaim = async () => {
        if (!claimConfig) {
            toast.success('Deal claimed successfully!');
            setView('success');
            return;
        }

        const { branchId, deviceId, quantity } = claimConfig;
        const currentUser = useAuthStore.getState().user;
        const fullName = (currentUser?.name || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`).trim();
        const nameParts = fullName.split(/\s+/);
        const firstName = nameParts[0] || 'Customer';
        const lastName = nameParts.slice(1).join(' ') || ' ';
        const email = currentUser?.email || undefined;
        const phone = currentUser?.phone || 'N/A';

        const res: any = await createOrderMutation.mutateAsync({
            branchId,
            deviceId,
            firstName,
            lastName,
            email,
            phone,
            items: [{ offerId: deal.id, quantity: quantity || 1 }],
        });

        if (res?.orderNumber || res?.order_number || res?.id) {
            setRedemptionCode(res.orderNumber || res.order_number || `VEM-${res.id.slice(0, 8).toUpperCase()}`);
        }

        toast.success('Deal claimed successfully!');
        if (claimConfig.onSuccess) {
            claimConfig.onSuccess();
        }
        setView('success');
    };

    // 1. Logged-in user confirms continuation
    const handleContinueLoggedIn = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            await performRealClaim();
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to claim deal. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Gift deal submission handler
    const handleSendGiftSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isAuthenticated || !user) {
            setError("You must be signed in to gift a deal.");
            setGiftIntent(true);
            setView('login');
            return;
        }

        const recipient = giftRecipientEmail.trim().toLowerCase();
        if (!recipient) {
            setError("Please enter the recipient's email address");
            return;
        }
        if (!isEmailValid(recipient)) {
            setError("Please enter a valid email address");
            return;
        }

        setIsSubmitting(true);
        try {
            const currentName = (user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`).trim();
            const sender = giftSenderName.trim() || currentName || 'A friend';
            const clientOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : undefined;
            const res = await sendGiftMutation.mutateAsync({
                offerId: deal.id,
                recipientEmail: recipient,
                senderName: sender,
                senderEmail: user?.email || undefined,
                note: giftNote.trim() || undefined,
                branchId: claimConfig?.branchId,
                frontendBaseUrl: clientOrigin,
            });
            toast.success(res?.message || `Deal sent to ${recipient}!`);
            setView('gift-success');
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to send deal gift. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 2. Email + PIN Login
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const email = loginForm.email.trim();
        const pin = loginForm.pin.trim();

        if (!email) {
            setError('Please enter your email address');
            return;
        }
        if (!isEmailValid(email)) {
            setError('Please enter a valid email address');
            return;
        }
        if (!pin) {
            setError('Please enter your 6-digit PIN');
            return;
        }
        if (!isPinValid(pin)) {
            setError('PIN must be exactly 6 digits');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await loginUser({
                identifier: email,
                password: pin,
            });

            if (res?.user && res?.access_token) {
                login(res.user, res.access_token);
                if (giftIntent) {
                    setGiftIntent(false);
                    setView('gift');
                    toast.success('Signed in! Enter recipient details to send your gift.');
                } else {
                    // Proceed directly to claiming the deal
                    await performRealClaim();
                }
            } else {
                throw new Error('Invalid login response');
            }
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                'Invalid email or PIN. Please check your credentials.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // 3. Signup Step 1: Request OTP for Email
    const handleSignupEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const email = signupEmail.trim();
        if (!email) {
            setError('Please enter your email address');
            return;
        }
        if (!isEmailValid(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);
        try {
            await requestOtp({
                email,
                branchId: claimConfig?.branchId,
            });
            setResendTimer(60);
            setView('signup-otp');
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                'Failed to send verification code. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // Resend OTP handler
    const handleResendOtp = async () => {
        if (resendTimer > 0 || resendLoading) return;
        setError(null);
        setResendLoading(true);
        try {
            await resendOtp({ email: signupEmail.trim() });
            setResendTimer(60);
            setSuccessMessage('A fresh verification code was sent to your email.');
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                'Failed to resend verification code. Please try again.'
            );
        } finally {
            setResendLoading(false);
        }
    };

    // 4. Signup Step 2: Validate OTP code & proceed to details
    const handleVerifyOtpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const otp = signupOtp.trim();
        if (!otp) {
            setError('Please enter the 6-digit verification code');
            return;
        }
        if (!isPinValid(otp)) {
            setError('Verification code must be exactly 6 digits');
            return;
        }

        setView('signup-profile');
    };

    // 5. Signup Step 3: Set Name & PIN, finalize signup & claim deal
    const handleSignupProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const firstName = signupProfile.firstName.trim();
        const lastName = signupProfile.lastName.trim();
        const pin = signupProfile.pin.trim();
        const confirmPin = signupProfile.confirmPin.trim();

        if (!firstName) {
            setError('Please enter your first name');
            return;
        }
        if (!lastName) {
            setError('Please enter your last name');
            return;
        }
        if (!pin) {
            setError('Please create a 6-digit PIN');
            return;
        }
        if (!isPinValid(pin)) {
            setError('PIN must be exactly 6 digits');
            return;
        }
        if (pin !== confirmPin) {
            setError('PIN and Confirm PIN do not match');
            return;
        }
        if (!agreedToTerms) {
            setError('Please agree to the terms to complete your sign up');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await verifyAndSetPin({
                email: signupEmail.trim(),
                code: signupOtp.trim(),
                pin,
                firstName,
                lastName,
                branchId: claimConfig?.branchId,
            });

            if (res?.user && res?.access_token) {
                login(res.user, res.access_token);
                if (giftIntent) {
                    setGiftIntent(false);
                    setView('gift');
                    toast.success('Account created! You can now send this deal as a gift.');
                } else {
                    // Immediately claim the deal with the newly activated account
                    await performRealClaim();
                }
            } else {
                throw new Error('Registration verification failed');
            }
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                'Registration failed. Please check your verification code and try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Google Login Success
    const handleGoogleAuthSuccess = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            if (giftIntent) {
                setGiftIntent(false);
                setView('gift');
                toast.success('Signed in! You can now send this deal as a gift.');
                return;
            }
            await performRealClaim();
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to claim deal. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!mounted || !isOpen) return null;

    const modalVariants: any = {
        hidden: { opacity: 0, scale: 0.96, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
        exit: { opacity: 0, scale: 0.96, y: 16, transition: { duration: 0.18 } },
    };

    const stepVariants: any = {
        initial: { opacity: 0, x: 12 },
        animate: { opacity: 1, x: 0, transition: { duration: 0.2 } },
        exit: { opacity: 0, x: -12, transition: { duration: 0.15 } },
    };

    const effectiveUserName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';

    return (
        <>
            {!showRedeemModal &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
                        onClick={onClose}
                    >
                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100"
                        >
                            {/* Mobile Drag Indicator Bar */}
                            <div className="sm:hidden flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
                            </div>

                            {/* Header */}
                            <div className="sticky top-0 bg-white/95 backdrop-blur-md z-20 flex items-center justify-between px-5 h-14 border-b border-gray-100 shrink-0">
                                {view !== 'logged-in' && view !== 'login' && view !== 'success' && view !== 'mydeal' ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setError(null);
                                            if (view === 'signup-otp') setView('signup-email');
                                            else if (view === 'signup-profile') setView('signup-otp');
                                            else if (view === 'signup-email') setView('login');
                                            else if (view === 'gift') {
                                                if (isAuthenticated) setView('logged-in');
                                                else setView('login');
                                            } else if (view === 'gift-success') {
                                                setView('gift');
                                            }
                                        }}
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 active:scale-95 transition-all"
                                        aria-label="Back"
                                    >
                                        <ArrowLeft size={19} />
                                    </button>
                                ) : view === 'login' && isAuthenticated ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setError(null);
                                            setView('logged-in');
                                        }}
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 active:scale-95 transition-all"
                                        aria-label="Back to account"
                                    >
                                        <ArrowLeft size={19} />
                                    </button>
                                ) : (
                                    <div className="w-9" />
                                )}

                                <h2 className="text-[15px] font-semibold text-gray-900 truncate px-2">
                                    {view === 'logged-in' && 'Claim Deal'}
                                    {view === 'login' && 'Sign In to Claim'}
                                    {view === 'signup-email' && 'Create Account'}
                                    {view === 'signup-otp' && 'Verify Email'}
                                    {view === 'signup-profile' && 'Set Up PIN'}
                                    {view === 'gift' && 'Gift Deal to Someone'}
                                    {view === 'gift-success' && 'Gift Sent!'}
                                    {view === 'success' && 'Deal Claimed!'}
                                    {view === 'mydeal' && 'My Deal'}
                                </h2>

                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
                                    aria-label="Close modal"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Scrollable Content Area */}
                            <div className="p-5 overflow-y-auto flex-1 overscroll-contain">
                                {/* Deal Summary Card (Hidden on Success/MyDeal) */}
                                {view !== 'success' && view !== 'mydeal' && (
                                    <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-3.5 flex gap-3 mb-5 items-center">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200 border border-black/5 relative shadow-sm">
                                            <img
                                                src={deal.image}
                                                alt={deal.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="inline-flex items-center gap-1 text-[#0055c4] bg-[#0055c4]/10 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase mb-1">
                                                {deal.discountLabel || 'DEAL'}
                                            </div>
                                            <h3 className="text-[14px] font-bold text-gray-900 truncate leading-snug">
                                                {deal.title}
                                            </h3>
                                            <p className="text-[12px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                                                <Store size={12} className="shrink-0 text-gray-400" />
                                                {deal.businessName}
                                            </p>
                                        </div>
                                        <div className="text-right pl-1">
                                            <span className="text-[15px] font-bold text-[#0055c4] block whitespace-nowrap">
                                                {deal.dealPrice === 0 ? 'FREE' : formatDealPrice(deal.dealPrice)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Error Banner */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] flex items-start gap-2.5 font-medium leading-relaxed"
                                    >
                                        <Info size={16} className="text-red-500 shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </motion.div>
                                )}

                                {/* Success Toast / Banner */}
                                {successMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] flex items-start gap-2.5 font-medium leading-relaxed"
                                    >
                                        <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                        <span>{successMessage}</span>
                                    </motion.div>
                                )}

                                <AnimatePresence mode="wait">
                                    {/* ─── 1. LOGGED-IN VIEW ─── */}
                                    {view === 'logged-in' && (
                                        <motion.div
                                            key="logged-in"
                                            variants={stepVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            className="space-y-4"
                                        >
                                            <div className="text-left">
                                                <h3 className="text-[17px] font-bold text-gray-900">
                                                    Continue with your account
                                                </h3>
                                                <p className="text-[13px] text-gray-500 mt-0.5">
                                                    We found your active session. Confirm below to claim this deal.
                                                </p>
                                            </div>

                                            {/* Account Details Box */}
                                            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 to-indigo-50/50 border border-blue-100 flex items-center gap-3.5 shadow-sm">
                                                <div className="w-12 h-12 rounded-full bg-[#0055c4] text-white flex items-center justify-center font-bold text-[16px] shadow-sm shrink-0 uppercase">
                                                    {effectiveUserName.charAt(0) || 'U'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[14px] font-bold text-gray-900 truncate">
                                                        {effectiveUserName}
                                                    </p>
                                                    <p className="text-[12px] text-gray-600 truncate flex items-center gap-1.5 mt-0.5">
                                                        <Mail size={12} className="text-gray-400 shrink-0" />
                                                        {user?.email || 'No email associated'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Claim Action */}
                                            <button
                                                type="button"
                                                onClick={handleContinueLoggedIn}
                                                disabled={isSubmitting}
                                                className="w-full h-12 bg-[#0055c4] hover:bg-[#0055c4]/90 text-white font-semibold text-[14px] rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                                            >
                                                {isSubmitting ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <span>Claim Deal as {user?.firstName || 'Me'}</span>
                                                        <CheckCircle size={18} />
                                                    </>
                                                )}
                                            </button>

                                            {/* Claim for someone else (Gift Deal) */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setError(null);
                                                    setView('gift');
                                                }}
                                                className="w-full h-11 bg-purple-50 hover:bg-purple-100/80 border border-purple-200 text-purple-800 font-medium text-[13px] rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                                            >
                                                <Gift size={16} className="text-purple-600" />
                                                Claim for someone else (Gift Deal)
                                            </button>

                                            {/* Switch Account */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setError(null);
                                                    setView('login');
                                                }}
                                                className="w-full h-11 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium text-[13px] rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                            >
                                                <UserIcon size={16} className="text-gray-500" />
                                                Use a different account
                                            </button>
                                        </motion.div>
                                    )}

                                    {/* ─── 2. LOGIN VIEW (Email + 6-Digit PIN or Google) ─── */}
                                    {view === 'login' && (
                                        <motion.div
                                            key="login"
                                            variants={stepVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            className="space-y-4"
                                        >
                                            <div className="text-left">
                                                <h3 className="text-[17px] font-bold text-gray-900">
                                                    Sign in to claim
                                                </h3>
                                                <p className="text-[13px] text-gray-500 mt-0.5">
                                                    Enter your email and 6-digit PIN to claim this offer.
                                                </p>
                                            </div>

                                            {/* Google Sign In */}
                                            <div className="pt-1">
                                                <GoogleAuthButton
                                                    role="Customer"
                                                    onSuccess={handleGoogleAuthSuccess}
                                                />
                                            </div>

                                            <div className="relative flex items-center justify-center py-1">
                                                <div className="absolute w-full h-px bg-gray-200" />
                                                <span className="relative px-3 bg-white text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                                    or sign in with email &amp; pin
                                                </span>
                                            </div>

                                            <form onSubmit={handleLoginSubmit} className="space-y-3">
                                                <div>
                                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                                                        Email Address
                                                    </label>
                                                    <div className="relative">
                                                        <Mail
                                                            size={16}
                                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                                                        />
                                                        <input
                                                            type="email"
                                                            inputMode="email"
                                                            autoComplete="email"
                                                            value={loginForm.email}
                                                            onChange={(e) =>
                                                                setLoginForm({ ...loginForm, email: e.target.value })
                                                            }
                                                            placeholder="name@example.com"
                                                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-[#0055c4] focus:ring-2 focus:ring-[#0055c4]/10 outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                                                        6-Digit PIN
                                                    </label>
                                                    <div className="relative">
                                                        <Lock
                                                            size={16}
                                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                                                        />
                                                        <input
                                                            type={showLoginPin ? 'text' : 'password'}
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            maxLength={6}
                                                            autoComplete="current-password"
                                                            value={loginForm.pin}
                                                            onChange={(e) =>
                                                                setLoginForm({
                                                                    ...loginForm,
                                                                    pin: e.target.value.replace(/[^0-9]/g, '').slice(0, 6),
                                                                })
                                                            }
                                                            placeholder="••••••"
                                                            className="w-full h-11 pl-10 pr-11 rounded-xl border border-gray-200 bg-white text-[15px] font-mono tracking-widest text-gray-900 placeholder:text-gray-300 focus:border-[#0055c4] focus:ring-2 focus:ring-[#0055c4]/10 outline-none transition-all"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowLoginPin(!showLoginPin)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                                        >
                                                            {showLoginPin ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting || !loginForm.email.trim() || loginForm.pin.length !== 6}
                                                    className="w-full h-12 bg-[#0055c4] hover:bg-[#0055c4]/90 text-white font-semibold text-[14px] rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 mt-1"
                                                >
                                                    {isSubmitting ? (
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            <span>Sign In &amp; Claim Deal</span>
                                                            <CheckCircle size={18} />
                                                        </>
                                                    )}
                                                </button>
                                            </form>

                                            {/* Link to Sign Up */}
                                            <div className="pt-2 text-center">
                                                <p className="text-[13px] text-gray-600">
                                                    New here?{' '}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setError(null);
                                                            setSignupEmail(loginForm.email);
                                                            setView('signup-email');
                                                        }}
                                                        className="font-bold text-[#0055c4] hover:underline cursor-pointer"
                                                    >
                                                        Sign up
                                                    </button>
                                                </p>
                                            </div>

                                            {/* Option to Gift Deal */}
                                            <div className="pt-2.5 border-t border-gray-100 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setError(null);
                                                        if (!isAuthenticated) {
                                                            setGiftIntent(true);
                                                            setError('Please sign in or create an account to gift this deal. We include your name and details so the recipient knows who sent it.');
                                                        } else {
                                                            setView('gift');
                                                        }
                                                    }}
                                                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-purple-700 hover:text-purple-800 transition-colors cursor-pointer"
                                                >
                                                    <Gift size={14} className="text-purple-600" />
                                                    Want to claim for someone else? Send as a Gift &rarr;
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* ─── 3. SIGN UP STEP 1: Enter Email ─── */}
                                    {view === 'signup-email' && (
                                        <motion.div
                                            key="signup-email"
                                            variants={stepVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            className="space-y-4"
                                        >
                                            <div className="text-left">
                                                <h3 className="text-[17px] font-bold text-gray-900">
                                                    Create Customer Account
                                                </h3>
                                                <p className="text-[13px] text-gray-500 mt-0.5">
                                                    Sign up to claim deals and unlock exclusive perks.
                                                </p>
                                            </div>

                                            {/* Google Sign Up */}
                                            <div className="pt-1">
                                                <GoogleAuthButton
                                                    role="Customer"
                                                    onSuccess={handleGoogleAuthSuccess}
                                                />
                                            </div>

                                            <div className="relative flex items-center justify-center py-1">
                                                <div className="absolute w-full h-px bg-gray-200" />
                                                <span className="relative px-3 bg-white text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                                    or enter your email
                                                </span>
                                            </div>

                                            <form onSubmit={handleSignupEmailSubmit} className="space-y-3">
                                                <div>
                                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                                                        Email Address
                                                    </label>
                                                    <div className="relative">
                                                        <Mail
                                                            size={16}
                                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                                                        />
                                                        <input
                                                            type="email"
                                                            inputMode="email"
                                                            autoComplete="email"
                                                            value={signupEmail}
                                                            onChange={(e) => setSignupEmail(e.target.value)}
                                                            placeholder="you@example.com"
                                                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-[#0055c4] focus:ring-2 focus:ring-[#0055c4]/10 outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting || !signupEmail.trim()}
                                                    className="w-full h-12 bg-[#0055c4] hover:bg-[#0055c4]/90 text-white font-semibold text-[14px] rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 mt-1"
                                                >
                                                    {isSubmitting ? (
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            <span>Send Verification Code</span>
                                                            <Sparkles size={16} />
                                                        </>
                                                    )}
                                                </button>
                                            </form>

                                            <div className="pt-2 text-center">
                                                <p className="text-[13px] text-gray-600">
                                                    Already have an account?{' '}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setError(null);
                                                            setView('login');
                                                        }}
                                                        className="font-bold text-[#0055c4] hover:underline cursor-pointer"
                                                    >
                                                        Sign in
                                                    </button>
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* ─── 4. SIGN UP STEP 2: Verify OTP ─── */}
                                    {view === 'signup-otp' && (
                                        <motion.div
                                            key="signup-otp"
                                            variants={stepVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            className="space-y-4"
                                        >
                                            <div className="text-left">
                                                <h3 className="text-[17px] font-bold text-gray-900">
                                                    Verify your email
                                                </h3>
                                                <p className="text-[13px] text-gray-600 mt-1 leading-relaxed">
                                                    We sent a 6-digit code to{' '}
                                                    <strong className="text-gray-900 font-semibold">{signupEmail.trim()}</strong>.
                                                </p>
                                            </div>

                                            {/* Expiry Notice Badge */}
                                            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center gap-2.5 text-blue-800 text-[12px]">
                                                <Clock size={16} className="text-[#0055c4] shrink-0" />
                                                <span>This verification code is valid for <strong>10 minutes</strong>.</span>
                                            </div>

                                            <form onSubmit={handleVerifyOtpSubmit} className="space-y-3">
                                                <div>
                                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5 text-center">
                                                        Enter 6-Digit Code
                                                    </label>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        maxLength={6}
                                                        autoComplete="one-time-code"
                                                        autoFocus
                                                        value={signupOtp}
                                                        onChange={(e) =>
                                                            setSignupOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))
                                                        }
                                                        placeholder="123456"
                                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-center text-[22px] tracking-[0.35em] font-mono font-bold text-gray-900 placeholder:text-gray-300 focus:border-[#0055c4] focus:ring-2 focus:ring-[#0055c4]/10 outline-none transition-all"
                                                    />
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={signupOtp.length !== 6}
                                                    className="w-full h-12 bg-[#0055c4] hover:bg-[#0055c4]/90 text-white font-semibold text-[14px] rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                                                >
                                                    <span>Verify Code</span>
                                                    <ShieldCheck size={18} />
                                                </button>
                                            </form>

                                            <div className="flex flex-col items-center gap-2 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={handleResendOtp}
                                                    disabled={resendTimer > 0 || resendLoading}
                                                    className="text-[13px] font-semibold text-[#0055c4] hover:underline disabled:text-gray-400 disabled:hover:no-underline flex items-center gap-1.5"
                                                >
                                                    {resendLoading ? (
                                                        <>
                                                            <RefreshCw size={14} className="animate-spin" />
                                                            Resending code...
                                                        </>
                                                    ) : resendTimer > 0 ? (
                                                        `Resend code in ${resendTimer}s`
                                                    ) : (
                                                        'Resend verification code'
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setError(null);
                                                        setView('signup-email');
                                                    }}
                                                    className="text-[12px] text-gray-500 hover:text-gray-800 underline"
                                                >
                                                    Change email address
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* ─── 5. SIGN UP STEP 3: Profile & 6-Digit PIN ─── */}
                                    {view === 'signup-profile' && (
                                        <motion.div
                                            key="signup-profile"
                                            variants={stepVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            className="space-y-4"
                                        >
                                            <div className="text-left">
                                                <h3 className="text-[17px] font-bold text-gray-900">
                                                    Set up your profile &amp; PIN
                                                </h3>
                                                <p className="text-[13px] text-gray-500 mt-0.5">
                                                    Enter your name and create a 6-digit PIN to secure your account.
                                                </p>
                                            </div>

                                            <form onSubmit={handleSignupProfileSubmit} className="space-y-3">
                                                {/* Names in responsive grid */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                                                            First Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            autoComplete="given-name"
                                                            value={signupProfile.firstName}
                                                            onChange={(e) =>
                                                                setSignupProfile({
                                                                    ...signupProfile,
                                                                    firstName: e.target.value,
                                                                })
                                                            }
                                                            placeholder="John"
                                                            className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-[14px] text-gray-900 focus:border-[#0055c4] focus:ring-2 focus:ring-[#0055c4]/10 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                                                            Last Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            autoComplete="family-name"
                                                            value={signupProfile.lastName}
                                                            onChange={(e) =>
                                                                setSignupProfile({
                                                                    ...signupProfile,
                                                                    lastName: e.target.value,
                                                                })
                                                            }
                                                            placeholder="Doe"
                                                            className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-[14px] text-gray-900 focus:border-[#0055c4] focus:ring-2 focus:ring-[#0055c4]/10 outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>

                                                {/* PIN inputs */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                                                            6-Digit PIN
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type={showSignupPin ? 'text' : 'password'}
                                                                inputMode="numeric"
                                                                pattern="[0-9]*"
                                                                maxLength={6}
                                                                autoComplete="new-password"
                                                                value={signupProfile.pin}
                                                                onChange={(e) =>
                                                                    setSignupProfile({
                                                                        ...signupProfile,
                                                                        pin: e.target.value.replace(/[^0-9]/g, '').slice(0, 6),
                                                                    })
                                                                }
                                                                placeholder="PIN"
                                                                className="w-full h-11 px-3 pr-8 rounded-xl border border-gray-200 bg-white text-[14px] font-mono tracking-widest text-center text-gray-900 focus:border-[#0055c4] focus:ring-2 focus:ring-[#0055c4]/10 outline-none transition-all"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowSignupPin(!showSignupPin)}
                                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                                                            >
                                                                {showSignupPin ? <EyeOff size={14} /> : <Eye size={14} />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                                                            Confirm PIN
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type={showConfirmPin ? 'text' : 'password'}
                                                                inputMode="numeric"
                                                                pattern="[0-9]*"
                                                                maxLength={6}
                                                                autoComplete="new-password"
                                                                value={signupProfile.confirmPin}
                                                                onChange={(e) =>
                                                                    setSignupProfile({
                                                                        ...signupProfile,
                                                                        confirmPin: e.target.value.replace(/[^0-9]/g, '').slice(0, 6),
                                                                    })
                                                                }
                                                                placeholder="Confirm"
                                                                className="w-full h-11 px-3 pr-8 rounded-xl border border-gray-200 bg-white text-[14px] font-mono tracking-widest text-center text-gray-900 focus:border-[#0055c4] focus:ring-2 focus:ring-[#0055c4]/10 outline-none transition-all"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowConfirmPin(!showConfirmPin)}
                                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                                                            >
                                                                {showConfirmPin ? <EyeOff size={14} /> : <Eye size={14} />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Terms agreement */}
                                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 mt-1">
                                                    <label className="flex items-start gap-2.5 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={agreedToTerms}
                                                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                                                            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#0055c4] focus:ring-[#0055c4]"
                                                        />
                                                        <span className="text-[12px] text-gray-500 leading-tight">
                                                            I agree to the Terms of Service and confirm I want to claim this deal.
                                                        </span>
                                                    </label>
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={
                                                        isSubmitting ||
                                                        !signupProfile.firstName.trim() ||
                                                        !signupProfile.lastName.trim() ||
                                                        signupProfile.pin.length !== 6 ||
                                                        signupProfile.confirmPin.length !== 6 ||
                                                        !agreedToTerms
                                                    }
                                                    className="w-full h-12 bg-[#0055c4] hover:bg-[#0055c4]/90 text-white font-semibold text-[14px] rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
                                                >
                                                    {isSubmitting ? (
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            <span>Complete &amp; Claim Deal</span>
                                                            <CheckCircle size={18} />
                                                        </>
                                                    )}
                                                </button>
                                            </form>
                                        </motion.div>
                                    )}

                                    {/* ─── 4. GIFT DEAL VIEW (Claim for someone else) ─── */}
                                    {view === 'gift' && (
                                        <motion.div
                                            key="gift"
                                            variants={stepVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            className="space-y-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-sm">
                                                    <Gift size={22} className="text-purple-600" />
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="text-[17px] font-bold text-gray-900 leading-tight">
                                                        Claim for someone else
                                                    </h3>
                                                    <p className="text-[12px] text-gray-500 mt-0.5">
                                                        Send this deal to a friend or family member.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Mini Deal Summary Card */}
                                            <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center gap-3">
                                                {deal.image && (
                                                    <img
                                                        src={deal.image}
                                                        alt={deal.title}
                                                        className="w-14 h-14 rounded-xl object-cover border border-purple-200/50 shrink-0"
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0 text-left">
                                                    <p className="text-[13px] font-bold text-gray-900 truncate">{deal.title}</p>
                                                    <p className="text-[11px] text-gray-500 truncate mt-0.5 flex items-center gap-1">
                                                        <Store size={11} /> {deal.businessName}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[13px] font-bold text-purple-700">
                                                            {deal.dealPrice === 0 ? 'FREE' : formatDealPrice(deal.dealPrice)}
                                                        </span>
                                                        {deal.discountLabel && (
                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-md">
                                                                {deal.discountLabel}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Authenticated Sender Details Badge */}
                                            {user && (
                                                <div className="p-3 bg-purple-50/80 border border-purple-200/70 rounded-xl flex items-center justify-between shadow-xs">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                                            {effectiveUserName.charAt(0) || 'U'}
                                                        </div>
                                                        <div className="min-w-0 text-left">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Sending as</p>
                                                            <p className="text-[13px] font-bold text-gray-900 truncate">{effectiveUserName}</p>
                                                            <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                                                        </div>
                                                    </div>
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full shrink-0">
                                                        <ShieldCheck size={12} /> Verified
                                                    </span>
                                                </div>
                                            )}

                                            <form onSubmit={handleSendGiftSubmit} className="space-y-3.5 text-left">
                                                {/* Recipient Email */}
                                                <div>
                                                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
                                                        Recipient's Email Address <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <input
                                                            type="email"
                                                            required
                                                            inputMode="email"
                                                            autoComplete="email"
                                                            value={giftRecipientEmail}
                                                            onChange={(e) => setGiftRecipientEmail(e.target.value)}
                                                            placeholder="friend@example.com"
                                                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 mt-1">
                                                        They'll receive an email with instructions on how to claim and redeem.
                                                    </p>
                                                </div>

                                                {/* Sender Name */}
                                                <div>
                                                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
                                                        Your Name (Optional)
                                                    </label>
                                                    <div className="relative">
                                                        <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            value={giftSenderName}
                                                            onChange={(e) => setGiftSenderName(e.target.value)}
                                                            placeholder="e.g. Alex"
                                                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10 outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Personal Note */}
                                                <div>
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                                                            Personal Note (Optional)
                                                        </label>
                                                        <span className="text-[10px] text-gray-400 font-mono">
                                                            {giftNote.length}/300
                                                        </span>
                                                    </div>
                                                    <textarea
                                                        rows={2}
                                                        maxLength={300}
                                                        value={giftNote}
                                                        onChange={(e) => setGiftNote(e.target.value)}
                                                        placeholder="e.g. Enjoy lunch on me! Hope you love it :)"
                                                        className="w-full p-3 rounded-xl border border-gray-200 bg-white text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10 outline-none transition-all resize-none"
                                                    />
                                                </div>

                                                {/* Submit Button */}
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting || !giftRecipientEmail.trim()}
                                                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-[14px] rounded-xl flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 transition-all active:scale-[0.98] disabled:opacity-50 mt-2 cursor-pointer"
                                                >
                                                    {isSubmitting ? (
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Gift size={18} />
                                                            <span>Send Deal to Friend</span>
                                                        </>
                                                    )}
                                                </button>
                                            </form>

                                            <div className="pt-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setError(null);
                                                        if (isAuthenticated) setView('logged-in');
                                                        else setView('login');
                                                    }}
                                                    className="text-[12px] font-semibold text-gray-500 hover:text-gray-700 cursor-pointer"
                                                >
                                                    &larr; Back to claim for myself
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* ─── 5. GIFT SUCCESS VIEW ─── */}
                                    {view === 'gift-success' && (
                                        <motion.div
                                            key="gift-success"
                                            variants={stepVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            className="space-y-5 text-center py-2"
                                        >
                                            <div className="relative mx-auto w-20 h-20">
                                                <div className="absolute inset-0 rounded-full bg-purple-100 animate-ping opacity-25" />
                                                <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30">
                                                    <Gift size={38} className="animate-bounce" />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <h3 className="text-[20px] font-bold text-gray-900">
                                                    Deal Gift Sent!
                                                </h3>
                                                <p className="text-[13px] text-gray-600 max-w-xs mx-auto leading-relaxed">
                                                    We've sent a detailed email to <strong className="text-gray-900">{giftRecipientEmail}</strong> with everything they need to claim and enjoy this deal at <strong className="text-gray-900">{deal.businessName}</strong>.
                                                </p>
                                            </div>

                                            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-left flex items-start gap-3">
                                                <Sparkles size={18} className="text-purple-600 shrink-0 mt-0.5" />
                                                <div className="text-[12px] text-purple-900/90 leading-relaxed">
                                                    <strong>What happens next:</strong> Your recipient can open the email, verify their email in seconds, and get their unique store claim code!
                                                </div>
                                            </div>

                                            <div className="space-y-2 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setError(null);
                                                        setGiftRecipientEmail('');
                                                        setGiftNote('');
                                                        setView('gift');
                                                    }}
                                                    className="w-full h-11 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-semibold text-[13px] rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                                                >
                                                    <Gift size={16} />
                                                    Send this deal to another friend
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={onClose}
                                                    className="w-full h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[13px] rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* ─── 6. SUCCESS VIEW ─── */}
                                    {view === 'success' && (
                                        <SuccessView
                                            deal={deal}
                                            onViewMyDeal={() => setView('mydeal')}
                                            onViewBusiness={() => {
                                                onClose();
                                                router.push(`/${deal.slug}`);
                                            }}
                                        />
                                    )}

                                    {/* ─── 7. MY DEAL VIEW ─── */}
                                    {view === 'mydeal' && (
                                        <MyDealView
                                            deal={deal}
                                            redemptionCode={redemptionCode}
                                            isRealClaim={!!claimConfig}
                                            onRedeemClick={() => setShowRedeemModal(true)}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>,
                    document.body
                )}

            {/* Redeem Modal Trigger */}
            <RedeemDealModal
                isOpen={showRedeemModal}
                onClose={() => setShowRedeemModal(false)}
                deal={deal}
                onChat={() => {
                    setShowRedeemModal(false);
                    onClose();
                    const targetBranchId = claimConfig?.branchId;
                    const chatUrl = targetBranchId
                        ? `/customer/messaging/chat?branchId=${targetBranchId}&businessId=${deal.slug}`
                        : `/customer/messaging/chat?businessId=${deal.slug}`;
                    router.push(chatUrl);
                }}
            />
        </>
    );
}

function SuccessView({
    deal,
    onViewMyDeal,
    onViewBusiness,
}: {
    deal: ClaimDealModalProps['deal'];
    onViewMyDeal: () => void;
    onViewBusiness: () => void;
}) {
    useEffect(() => {
        const container = document.getElementById('deal-confetti-container');
        if (!container) return;
        const colors = ['#0055c4', '#066cf4', '#b0c6ff', '#d0e1fb', '#38bdf8', '#fbbf24'];
        const pieces: HTMLDivElement[] = [];
        for (let i = 0; i < 35; i++) {
            const el = document.createElement('div');
            el.className = 'absolute w-2.5 h-4 rounded-sm opacity-0 pointer-events-none';
            el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            el.style.left = `${Math.random() * 100}%`;
            el.style.top = '-10px';
            el.animate(
                [
                    { transform: 'translate3d(0,0,0) rotate(0deg)', opacity: 1 },
                    {
                        transform: `translate3d(${Math.random() * 120 - 60}px, 450px, 0) rotate(${
                            Math.random() * 720
                        }deg)`,
                        opacity: 0,
                    },
                ],
                {
                    duration: (Math.random() * 1.8 + 1.8) * 1000,
                    delay: Math.random() * 300,
                    easing: 'cubic-bezier(.37,0,.63,1)',
                    fill: 'forwards',
                }
            );
            container.appendChild(el);
            pieces.push(el);
        }
        return () => pieces.forEach((p) => p.remove());
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center py-2 relative"
        >
            <div id="deal-confetti-container" className="absolute inset-0 pointer-events-none overflow-hidden" />

            <div className="w-18 h-18 bg-[#0055c4] rounded-full flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(0,85,196,0.3)]">
                <CheckCircle size={36} className="text-white" />
            </div>
            <h2 className="text-[20px] font-bold text-gray-900 mb-1">Deal Claimed!</h2>
            <p className="text-[13px] text-gray-500 mb-4 max-w-xs">
                Your claim for <strong className="text-gray-900 font-semibold">{deal.title}</strong> is secured.
            </p>

            <div className="w-full bg-slate-50 rounded-2xl border border-slate-200 p-3.5 mb-4 text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Deal Summary</p>
                <div className="flex items-start gap-3 mb-2.5">
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-200">
                        <img src={deal.image} alt={deal.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-bold text-gray-900 truncate">{deal.title}</h3>
                        <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                            <Store size={11} className="shrink-0" /> {deal.businessName}
                        </p>
                    </div>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-gray-200/60 mt-2">
                    <span className="text-[12px] text-gray-500">Deal Price</span>
                    <span className="text-[15px] font-bold text-[#0055c4]">
                        {deal.dealPrice === 0 ? 'FREE' : formatDealPrice(deal.dealPrice)}
                    </span>
                </div>
            </div>

            <div className="w-full space-y-2">
                <button
                    type="button"
                    onClick={onViewMyDeal}
                    className="w-full h-12 bg-[#0055c4] hover:bg-[#0055c4]/90 text-white font-semibold text-[14px] rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                >
                    View My Deal
                </button>
                <button
                    type="button"
                    onClick={onViewBusiness}
                    className="w-full h-11 bg-transparent border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-[13px] rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                    View Business
                </button>
            </div>
        </motion.div>
    );
}

function MyDealView({
    deal,
    redemptionCode,
    isRealClaim,
    onRedeemClick,
}: {
    deal: ClaimDealModalProps['deal'];
    redemptionCode: string;
    isRealClaim: boolean;
    onRedeemClick: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4 text-left"
        >
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <div className="relative w-full aspect-[16/9] bg-gray-100">
                    <img src={deal.image} alt={deal.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-[#0055c4] text-[11px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                        <CheckCircle size={13} />
                        Claimed
                    </div>
                </div>
                <div className="p-4">
                    <h3 className="text-[16px] font-bold text-gray-900 leading-snug">{deal.title}</h3>
                    <p className="text-[12px] text-gray-500 flex items-center gap-1 mt-1">
                        <Store size={13} /> {deal.businessName}
                    </p>

                    {isRealClaim ? (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="bg-blue-50/80 rounded-xl p-3 border border-blue-100">
                                <p className="text-[12px] text-[#00429b] leading-relaxed">
                                    Your claim has been recorded by <strong>{deal.businessName}</strong>. Show this screen when you visit the business to redeem your deal.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                Redemption Code
                            </p>
                            <div className="bg-gray-50 px-4 py-2.5 rounded-xl text-center border border-gray-200/60">
                                <span className="text-[18px] font-mono tracking-widest text-gray-900 font-bold">
                                    {redemptionCode}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-blue-50/80 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-1.5">
                    <Info size={15} className="text-[#0055c4]" />
                    <h4 className="text-[13px] font-bold text-[#001945] uppercase tracking-wider">How to Redeem</h4>
                </div>
                <p className="text-[12px] text-blue-900/80 leading-relaxed">
                    Present this deal claim at <strong>{deal.businessName}</strong> in-store or tap the button below when ready.
                </p>
            </div>

            <button
                type="button"
                onClick={onRedeemClick}
                className="w-full h-12 bg-[#0055c4] hover:bg-[#0055c4]/90 text-white font-semibold text-[14px] rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
            >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    redeem
                </span>
                Redeem / Use Deal
            </button>
        </motion.div>
    );
}
