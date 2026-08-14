"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircle2, Building2, Smartphone, Mail, 
    Lock, ArrowRight, ArrowLeft, Eye, EyeOff, 
    Check, User, ShieldCheck, Sparkles
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRegisterOwner, useOtp } from '@/services/auth/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import type { AuthResponse } from '@/services/auth/types';

// Shared field styling — text-base (16px) prevents mobile browsers from zooming into inputs on focus
const fieldBase =
    'w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white text-base font-medium text-text-main placeholder:text-gray-400 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all';

function Label({ children }: { children: React.ReactNode }) {
    return (
        <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary block mb-2">
            {children}
        </label>
    );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-xl sm:text-[28px] font-bold text-text-main tracking-tight leading-[1.2]">
                    {title}
                </h1>
                <p className="text-sm sm:text-[15px] font-normal text-text-secondary leading-relaxed">
                    {subtitle}
                </p>
            </div>
            {children}
        </div>
    );
}

const getErrorMessage = (err: unknown, fallback: string): string =>
    err instanceof Error && err.message ? err.message : fallback;

export default function GetStartedPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isGoogleUser, setIsGoogleUser] = useState(false);
    const [formData, setFormData] = useState({
        businessName: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        referralCode: '',
    });

    const refCode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ref') : null;

    // Apply the ?ref= code once. Adjusted during render (guarded by the previous
    // value) instead of an effect so the referral autofill doesn't trigger a
    // setState-in-effect lint error.
    const [appliedRefCode, setAppliedRefCode] = useState<string | null>(null);
    if (refCode && refCode !== appliedRefCode) {
        setAppliedRefCode(refCode);
        setFormData(p => ({ ...p, referralCode: refCode }));
    }

    // OTP verification states
    const [otpCode, setOtpCode] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [resendLoading, setResendLoading] = useState(false);
    const resendDisabled = resendTimer > 0;

    const [error, setError] = useState('');
    const { registerOwner, requestOwnerOtp } = useRegisterOwner();
    const { verifyOtp } = useOtp();
    const login = useAuthStore(state => state.login);

    useEffect(() => {
        if (resendTimer <= 0) return;
        const interval = setInterval(() => {
            setResendTimer((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [resendTimer]);

    // Password rules checker
    const getPasswordRules = (pwd: string) => {
        return {
            minLength: pwd.length >= 8,
            hasLowercase: /[a-z]/.test(pwd),
            hasUppercase: /[A-Z]/.test(pwd),
            hasNumber: /[0-9]/.test(pwd),
            hasSymbol: /[^A-Za-z0-9]/.test(pwd),
        };
    };

    const pwdRules = getPasswordRules(formData.password);
    const isPasswordStrong = Object.values(pwdRules).every(Boolean);

    const handleBack = () => setStep(s => s - 1);

    const handleStep2Submit = async () => {
        setError('');
        setIsLoading(true);
        try {
            await requestOwnerOtp({ email: formData.email, role: 'Owner' });
            setStep(2);
            setResendTimer(30);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to request verification code'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setError('');
        setOtpLoading(true);
        try {
            await verifyOtp({
                email: formData.email,
                code: otpCode
            });
            setStep(3);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Invalid or expired verification code'));
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setResendLoading(true);
        try {
            await requestOwnerOtp({ email: formData.email, role: 'Owner' });
            setResendTimer(30);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to resend verification code'));
        } finally {
            setResendLoading(false);
        }
    };

    const handleGoogleSuccess = (authResponse: AuthResponse) => {
        const { user, isNewUser } = authResponse;

        if (!isNewUser) {
            router.push('/dashboard');
            return;
        }

        setIsGoogleUser(true);
        setFormData(prev => ({
            ...prev,
            email: user.email || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            phone: user.phone || '',
        }));
    };

    const handleGoogleComplete = async () => {
        setIsLoading(true);
        setError('');
        try {
            const ownerPayload: import('@/services/auth/types').RegisterOwnerRequest = {
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                ...(formData.phone && formData.phone.trim().length > 0 ? { businessNumber: formData.phone.trim() } : {}),
                ...(formData.referralCode ? { referralCode: formData.referralCode } : {}),
            };
            const response = await registerOwner(ownerPayload);

            await login(response.user, response.access_token);

            router.push(formData.referralCode ? `/onboarding?ref=${encodeURIComponent(formData.referralCode)}` : '/onboarding');
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Something went wrong'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalSubmit = async () => {
        setError('');
        setIsLoading(true);
        try {
            const ownerPayload: import('@/services/auth/types').RegisterOwnerRequest = {
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                ...(formData.phone && formData.phone.trim().length > 0 ? { businessNumber: formData.phone.trim() } : {}),
                ...(formData.referralCode ? { referralCode: formData.referralCode } : {}),
            };
            const response = await registerOwner(ownerPayload);

            // Log user in
            await login(response.user, response.access_token);

            // Redirect immediately to onboarding
            router.push(formData.referralCode ? `/onboarding?ref=${encodeURIComponent(formData.referralCode)}` : '/onboarding');
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Registration failed. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white overflow-x-hidden selection:bg-primary selection:text-white">
            <div className="flex flex-col lg:flex-row min-h-screen">
                {/* LEFT COLUMN: Visual Hero (Desktop) */}
                <div className="relative hidden lg:flex lg:w-[42%] items-center justify-center overflow-hidden bg-gray-50/80 p-16 lg:p-20">
                    <div className="absolute -top-24 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[110px] pointer-events-none" />
                    <div className="absolute -bottom-24 left-0 w-96 h-96 bg-blue-400/5 rounded-full blur-[110px] pointer-events-none" />

                    <div className="relative z-10 max-w-md w-full space-y-10">
                        <Link href="/" className="inline-block transition-transform hover:scale-105">
                            <Logo className="h-10" />
                        </Link>

                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary/10 rounded-full">
                                <Sparkles size={12} className="text-primary" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                                    Trusted by 2,000+ Businesses
                                </span>
                            </div>
                            <h2 className="text-4xl xl:text-5xl font-bold tracking-tight leading-[1.15] text-text-main">
                                The Modern Standard For <span className="text-primary">Customer Growth.</span>
                            </h2>
                            <p className="text-text-secondary text-[15px] font-normal leading-relaxed max-w-sm">
                                Turn one-time visitors into repeat loyal customers with instant QR registration, automated campaigns, and real-time analytics.
                            </p>
                        </div>

                        <div className="space-y-3 pt-2">
                            {[
                                { title: '2-Second Capture', desc: 'Scan & register via QR and NFC without download app required.' },
                                { title: 'Automated CRM', desc: 'Automatically segment customers & launch retention campaigns.' },
                                { title: 'Multi-Branch POS', desc: 'Manage catalogue, orders, staff roles, and analytics seamlessly.' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-3.5 items-start p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-primary/20 transition-all duration-300">
                                    <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <CheckCircle2 size={16} strokeWidth={3} />
                                    </div>
                                    <div className="space-y-0.5 min-w-0">
                                        <p className="font-bold text-xs uppercase tracking-wider text-text-main">{item.title}</p>
                                        <p className="text-text-secondary text-xs font-normal leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="size-9 rounded-full bg-gray-100 border-2 border-gray-50 flex items-center justify-center text-[10px] font-bold text-text-secondary">
                                            V{i}
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-text-main">4.9 / 5 Rating</p>
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-text-secondary opacity-60">Owner Satisfaction</p>
                                </div>
                            </div>
                            <ShieldCheck size={24} className="text-primary/50" />
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Multi-step Signup Form */}
                <div className="flex-1 flex flex-col justify-start px-5 pt-6 pb-10 sm:px-8 md:px-12 lg:px-16 lg:justify-center lg:pt-0">
                    <div className="max-w-md w-full mx-auto">
                        {/* Mobile Brand Header */}
                        <div className="lg:hidden flex flex-col items-center text-center space-y-3 mb-6">
                            <Link href="/" className="inline-flex">
                                <Logo className="h-11" />
                            </Link>
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary/10 rounded-full">
                                <span className="size-1.5 rounded-full bg-primary" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                                    Account Setup
                                </span>
                            </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-gray-100 bg-white p-6 sm:p-8 shadow-sm">
                            {/* Stepper Header */}
                            {step < 4 && (
                                <div className="space-y-4 mb-7">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                                            Step {step} of 3
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-secondary opacity-60">
                                            {step === 1 ? 'Contact Details' : step === 2 ? 'Email Verification' : isGoogleUser ? 'Business Profile' : 'Security Setup'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3].map((s) => (
                                            <div key={s} className={cn(
                                                "h-0.5 flex-1 rounded-full transition-all duration-500",
                                                s <= step ? 'bg-primary' : 'bg-gray-200'
                                            )} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <AnimatePresence mode="wait">
                                {/* STEP 1: Contact Email */}
                                {step === 1 && (
                                    <motion.div key="step1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                                        <StepShell
                                            title={isGoogleUser ? 'Complete Registration' : 'Create Your VemTap Account'}
                                            subtitle={isGoogleUser ? 'We verified your email with Google. Continue to complete profile.' : 'Get started free with your business email.'}
                                        >
                                            <div className="space-y-5">
                                                {isGoogleUser ? (
                                                    <>
                                                        <div className="p-5 rounded-2xl bg-blue-50/80 border border-blue-100 text-center space-y-3">
                                                            <div className="size-14 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm text-primary border border-blue-100">
                                                                <Mail size={26} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Google Verified Email</p>
                                                                <p className="text-base font-bold text-text-main mt-0.5 break-all">{formData.email}</p>
                                                            </div>
                                                        </div>

                                                        {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}

                                                        <Button
                                                            onClick={() => setStep(3)}
                                                            className="w-full h-12 bg-primary hover:bg-primary-hover text-white font-bold uppercase tracking-[0.14em] text-xs rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                                                        >
                                                            Continue To Setup <ArrowRight size={16} />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <GoogleAuthButton
                                                            role="owner"
                                                            onSuccess={handleGoogleSuccess}
                                                            label="Sign up with Google"
                                                        />

                                                        <div className="flex items-center gap-4">
                                                            <div className="flex-1 h-px bg-gray-100" />
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary/50">Or register with email</span>
                                                            <div className="flex-1 h-px bg-gray-100" />
                                                        </div>

                                                        <div>
                                                            <Label>Business Email Address</Label>
                                                            <div className="relative">
                                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                                <input
                                                                    type="email"
                                                                    value={formData.email}
                                                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                                    placeholder="owner@yourbusiness.com"
                                                                    className={fieldBase}
                                                                />
                                                            </div>
                                                        </div>

                                                        {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}

                                                        <Button
                                                            onClick={handleStep2Submit}
                                                            disabled={isLoading || !formData.email}
                                                            className="w-full h-12 bg-primary hover:bg-primary-hover text-white font-bold uppercase tracking-[0.14em] text-xs rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                                                        >
                                                            {isLoading ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Get Verification Code <ArrowRight size={16} /></>}
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </StepShell>
                                    </motion.div>
                                )}

                                {/* STEP 2: Verification OTP */}
                                {step === 2 && (
                                    <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="space-y-5">
                                        <button onClick={handleBack} className="flex items-center gap-2 text-text-secondary hover:text-text-main transition-colors cursor-pointer">
                                            <ArrowLeft size={15} />
                                            <span className="text-xs font-medium uppercase tracking-[0.14em]">Back</span>
                                        </button>

                                        <div className="space-y-6">
                                            <div className="flex items-start gap-4">
                                                <div className="size-11 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                                                    <Mail size={20} />
                                                </div>
                                                <div className="space-y-1 min-w-0">
                                                    <h1 className="text-[22px] sm:text-2xl font-semibold text-text-main tracking-tight leading-tight">
                                                        Verify Your Email
                                                    </h1>
                                                    <p className="text-sm font-normal text-text-secondary leading-relaxed">
                                                        We sent a 4-digit code to <span className="text-primary font-medium break-all">{formData.email}</span>. Enter it below to continue.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-5">
                                                <div>
                                                    <Label>4-Digit Security Code</Label>
                                                    <input
                                                        type="text"
                                                        maxLength={4}
                                                        value={otpCode}
                                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                                        placeholder="• • • •"
                                                        className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white text-lg font-medium tracking-[0.7em] text-center text-text-main placeholder:text-text-secondary/20 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all"
                                                        autoFocus
                                                    />
                                                </div>

                                                {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

                                                <Button
                                                    onClick={handleVerifyOtp}
                                                    disabled={otpLoading || otpCode.length !== 4}
                                                    className="w-full h-12 bg-primary hover:bg-primary-hover text-white font-semibold uppercase tracking-[0.14em] text-xs rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                                                >
                                                    {otpLoading ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify & Continue'}
                                                </Button>

                                                <div className="text-center pt-1 flex items-center justify-center gap-1.5">
                                                    <span className="text-xs font-normal text-text-secondary/70">Didn&apos;t get it?</span>
                                                    <button
                                                        type="button"
                                                        onClick={handleResendOtp}
                                                        disabled={resendDisabled || resendLoading}
                                                        className="text-xs font-semibold text-primary hover:underline disabled:opacity-50 disabled:no-underline transition-colors cursor-pointer"
                                                    >
                                                        {resendDisabled ? `Resend in ${resendTimer}s` : 'Resend Code'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 3: Account Profile & Security */}
                                {step === 3 && (
                                    <motion.div key="step3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="space-y-5">
                                        <button onClick={() => { if (isGoogleUser) { setStep(1); } else { handleBack(); } }} className="flex items-center gap-2 text-text-secondary hover:text-text-main transition-colors cursor-pointer">
                                            <ArrowLeft size={15} />
                                            <span className="text-xs font-medium uppercase tracking-[0.14em]">Back</span>
                                        </button>

                                        <div className="space-y-6">
                                            <div className="flex items-start gap-4">
                                                <div className="size-11 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                                                    <ShieldCheck size={20} />
                                                </div>
                                                <div className="space-y-1 min-w-0">
                                                    <h1 className="text-xl sm:text-2xl font-semibold text-text-main tracking-tight leading-tight">
                                                        {isGoogleUser ? 'Complete Your Profile' : 'Account Details & Security'}
                                                    </h1>
                                                    <p className="text-sm font-normal text-text-secondary leading-relaxed">
                                                        {isGoogleUser ? 'Enter your name and details to setup account.' : 'Set up your name, business contact phone, and password.'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label>First Name</Label>
                                                        <div className="relative">
                                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                            <input
                                                                type="text"
                                                                value={formData.firstName}
                                                                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                                                placeholder="First Name"
                                                                className={fieldBase}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label>Last Name</Label>
                                                        <div className="relative">
                                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                            <input
                                                                type="text"
                                                                value={formData.lastName}
                                                                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                                                placeholder="Last Name"
                                                                className={fieldBase}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {!isGoogleUser && (
                                                    <>
                                                        <div>
                                                            <Label>Phone Number</Label>
                                                            <div className="relative">
                                                                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                                <input
                                                                    type="tel"
                                                                    value={formData.phone}
                                                                    onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                                                                    placeholder="WhatsApp / Phone Number"
                                                                    className={fieldBase}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <Label>Referral Code <span className="text-text-secondary/50 font-normal lowercase">(optional)</span></Label>
                                                            <div className="relative">
                                                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                                <input
                                                                    type="text"
                                                                    value={formData.referralCode}
                                                                    onChange={(e) => setFormData({...formData, referralCode: e.target.value})}
                                                                    placeholder="e.g. VEM-XXXXX"
                                                                    className={cn(fieldBase, "uppercase")}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="pt-2 border-t border-gray-100 space-y-4">
                                                            <div>
                                                                <Label>Create Password</Label>
                                                                <div className="relative">
                                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                                    <input
                                                                        type={showPassword ? 'text' : 'password'}
                                                                        value={formData.password}
                                                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                                                        placeholder="••••••••"
                                                                        className={cn(fieldBase, "pr-12")}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowPassword(!showPassword)}
                                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary cursor-pointer"
                                                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                                    >
                                                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <Label>Confirm Password</Label>
                                                                <div className="relative">
                                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                                    <input
                                                                        type={showPassword ? 'text' : 'password'}
                                                                        value={formData.confirmPassword}
                                                                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                                                        placeholder="••••••••"
                                                                        className={cn(fieldBase, "pr-12")}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowPassword(!showPassword)}
                                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary cursor-pointer"
                                                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                                    >
                                                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Password strength checklist */}
                                                            <div className="p-4 bg-gray-50/60 rounded-xl border border-gray-100 space-y-2 mt-2">
                                                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary/70 mb-2">Password Rules</p>
                                                                {[
                                                                    { label: 'Minimum 8 characters', pass: pwdRules.minLength },
                                                                    { label: 'At least 1 lowercase letter', pass: pwdRules.hasLowercase },
                                                                    { label: 'At least 1 uppercase letter', pass: pwdRules.hasUppercase },
                                                                    { label: 'At least 1 digit (0-9)', pass: pwdRules.hasNumber },
                                                                    { label: 'At least 1 special character', pass: pwdRules.hasSymbol },
                                                                ].map((rule, idx) => (
                                                                    <div key={idx} className="flex items-center gap-2.5 text-xs">
                                                                        {rule.pass ? (
                                                                            <Check size={13} className="text-emerald-500 shrink-0" strokeWidth={3} />
                                                                        ) : (
                                                                            <div className="size-3.5 rounded-full border-2 border-gray-300 shrink-0" />
                                                                        )}
                                                                        <span className={cn("font-medium transition-colors text-xs", rule.pass ? "text-emerald-700 font-semibold" : "text-text-secondary/60")}>
                                                                            {rule.label}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

                                                <Button
                                                    onClick={isGoogleUser ? handleGoogleComplete : handleFinalSubmit}
                                                    disabled={isLoading || !formData.firstName || !formData.lastName || (!isGoogleUser && (!formData.password || formData.password !== formData.confirmPassword || !isPasswordStrong))}
                                                    className="w-full h-auto min-h-12 bg-primary hover:bg-primary-hover text-white font-semibold uppercase tracking-[0.12em] text-xs leading-snug whitespace-normal rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none mt-1 px-4 py-4 text-center"
                                                >
                                                    {isLoading ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isGoogleUser ? 'Complete Registration' : 'Create My Account')}
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Login Link */}
                        {step < 4 && (
                            <div className="pt-6 text-center">
                                <p className="text-[13px] font-normal text-text-secondary">
                                    Already have a business account? <Link href="/login" className="text-primary font-bold uppercase tracking-[0.14em] text-[10px] ml-1.5 hover:underline">Sign In Here</Link>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}