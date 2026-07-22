"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircle2, Building2, Smartphone, Mail, 
    Lock, ArrowRight, ArrowLeft, Eye, EyeOff, 
    Check, User, ShieldCheck
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRegisterOwner, useOtp } from '@/services/auth/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import type { AuthResponse } from '@/services/auth/types';

// Confetti Component
const Confetti = () => {
    const colors = ['#066CF4', '#4293FF', '#000000', '#F8FAFC', '#E2E8F0'];
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(30)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ y: -20, x: Math.random() * 400 - 200, opacity: 1 }}
                    animate={{ y: 800, rotate: 360, x: Math.random() * 400 - 200 }}
                    transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                    className="absolute size-2 rounded-full"
                    style={{ 
                        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                        left: `${Math.random() * 100}%`
                    }}
                />
            ))}
        </div>
    );
};

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

    useEffect(() => {
        if (refCode) {
            setFormData(p => ({ ...p, referralCode: refCode }));
        }
    }, []);

    // OTP verification states
    const [otpCode, setOtpCode] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [resendDisabled, setResendDisabled] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);

    const [error, setError] = useState('');
    const { registerOwner, requestOwnerOtp } = useRegisterOwner();
    const { verifyOtp } = useOtp();
    const login = useAuthStore(state => state.login);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setResendDisabled(false);
        }
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
            setResendDisabled(true);
        } catch (err: any) {
            setError(err.message || 'Failed to request verification code');
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
        } catch (err: any) {
            setError(err.message || 'Invalid or expired verification code');
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
            setResendDisabled(true);
        } catch (err: any) {
            setError(err.message || 'Failed to resend verification code');
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

            login(response.user, response.access_token);

            router.push('/onboarding');
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
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
            login(response.user, response.access_token);

            // Redirect immediately to onboarding
            router.push('/onboarding');
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950/2 flex flex-col lg:flex-row overflow-x-hidden selection:bg-primary selection:text-white">
            {/* LEFT COLUMN: Premium Visual Hero (Desktop) */}
            <div className="hidden lg:flex lg:w-[42%] bg-slate-950 items-center justify-center p-16 lg:p-20 relative overflow-hidden text-white">
                {/* Background Ambient Glow Effects */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
                
                <div className="relative z-10 max-w-md w-full space-y-12">
                    <Link href="/" className="inline-block transition-transform hover:scale-105">
                        <Logo className="h-10 brightness-0 invert" />
                    </Link>
                    
                    <div className="space-y-4">
                        <Badge className="bg-primary/20 text-primary border border-primary/30 px-4 py-1.5 font-black uppercase tracking-[0.2em] text-[10px] rounded-full backdrop-blur-md">
                            ⚡ Trusted by 2,000+ Businesses
                        </Badge>
                        <h2 className="text-4xl lg:text-5xl font-display font-black tracking-tight leading-[1.1] text-white">
                            The Modern Standard For <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-teal-300">Customer Growth.</span>
                        </h2>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                            Turn one-time visitors into repeat loyal customers with instant QR registration, automated campaigns, and real-time analytics.
                        </p>
                    </div>
                    
                    <div className="space-y-6 pt-2">
                        {[
                            { title: '2-Second Capture', desc: 'Scan & register via QR and NFC without download app required.' },
                            { title: 'Automated CRM', desc: 'Automatically segment customers & launch retention campaigns.' },
                            { title: 'Multi-Branch POS', desc: 'Manage catalogue, orders, staff roles, and analytics seamlessly.' }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 items-start p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
                                <div className="size-7 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/30">
                                    <CheckCircle2 size={16} strokeWidth={3} />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="font-black text-xs uppercase tracking-widest text-white">{item.title}</p>
                                    <p className="text-slate-400 text-xs font-medium leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="size-9 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[10px] font-black text-white/50">
                                        V{i}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-white">4.9 / 5 Rating</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Owner Satisfaction</p>
                            </div>
                        </div>
                        <ShieldCheck size={24} className="text-primary/60" />
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Multi-step Signup Form */}
            <div className="flex-1 flex flex-col justify-center p-6 md:p-12 lg:p-20 bg-white relative">
                <div className="max-w-md w-full mx-auto space-y-8">
                    {/* Mobile Brand Header */}
                    <div className="lg:hidden flex flex-col items-center text-center space-y-3 mb-4">
                        <Link href="/">
                            <Logo className="h-9" />
                        </Link>
                        <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest px-3 py-1">
                            Account Setup
                        </Badge>
                    </div>

                    {/* Stepper Header Bar */}
                    {step < 4 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
                                <span className="text-primary flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-primary animate-pulse" />
                                    Step {step} of 3
                                </span>
                                <span className="text-text-secondary/60">
                                    {step === 1 ? 'Contact Details' : step === 2 ? 'Email Verification' : isGoogleUser ? 'Business Profile' : 'Security Setup'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3].map((s) => (
                                    <div key={s} className={`h-2 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-primary shadow-sm shadow-primary/20' : 'bg-gray-100'}`} />
                                ))}
                            </div>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {/* STEP 1: Contact Email */}
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                <div className="space-y-2">
                                    <h1 className="text-2xl sm:text-3xl font-display font-black text-text-main tracking-tight leading-tight">
                                        {isGoogleUser ? 'Complete Registration' : 'Create Your VemTap Account'}
                                    </h1>
                                    <p className="text-sm font-medium text-text-secondary">
                                        {isGoogleUser ? 'We verified your email with Google. Continue to complete profile.' : 'Get started free with your business email.'}
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {isGoogleUser ? (
                                        <>
                                            <div className="p-6 rounded-2xl bg-blue-50/80 border border-blue-100 text-center space-y-3">
                                                <div className="size-14 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm text-primary border border-blue-100">
                                                    <Mail size={28} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Google Verified Email</p>
                                                    <p className="text-base font-black text-text-main mt-0.5">{formData.email}</p>
                                                </div>
                                            </div>

                                            {error && <p className="text-red-500 text-xs font-semibold px-2">{error}</p>}

                                            <Button 
                                                onClick={() => setStep(3)} 
                                                className="w-full h-14 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-[0.15em] text-xs rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 cursor-pointer"
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
                                                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary/50">Or register with email</span>
                                                <div className="flex-1 h-px bg-gray-100" />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Business Email Address</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                    <input 
                                                        type="email" 
                                                        value={formData.email} 
                                                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                                                        placeholder="owner@yourbusiness.com" 
                                                        className="w-full pl-13 pr-5 h-14 bg-gray-50/80 border border-gray-200/80 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none font-bold text-sm transition-all" 
                                                    />
                                                </div>
                                            </div>

                                            {error && <p className="text-red-500 text-xs font-semibold px-2">{error}</p>}

                                            <Button 
                                                onClick={handleStep2Submit} 
                                                disabled={isLoading || !formData.email} 
                                                className="w-full h-14 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-[0.15em] text-xs rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                                            >
                                                {isLoading ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Get Verification Code <ArrowRight size={16} /></>}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: Verification OTP */}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <button onClick={handleBack} className="flex items-center gap-2 text-text-secondary hover:text-text-main transition-colors cursor-pointer">
                                    <ArrowLeft size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
                                </button>

                                <div className="space-y-2">
                                    <h1 className="text-2xl sm:text-3xl font-display font-black text-text-main tracking-tight">Verify Your Email</h1>
                                    <p className="text-sm font-medium text-text-secondary leading-relaxed">
                                        We sent a 4-digit security code to <span className="text-primary font-bold">{formData.email}</span>.
                                    </p>
                                </div>

                                <div className="space-y-6 pt-2">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">4-Digit Security Code</label>
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                            <input 
                                                type="text" 
                                                maxLength={4}
                                                value={otpCode} 
                                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} 
                                                placeholder="1 2 3 4" 
                                                className="w-full pl-13 pr-5 h-16 bg-gray-50/80 border border-gray-200/80 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none font-black text-center tracking-[0.8em] text-xl transition-all" 
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    
                                    {error && <p className="text-red-500 text-xs font-semibold px-2">{error}</p>}

                                    <Button 
                                        onClick={handleVerifyOtp} 
                                        disabled={otpLoading || otpCode.length !== 4} 
                                        className="w-full h-14 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-[0.15em] text-xs rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                                    >
                                        {otpLoading ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify & Continue'}
                                    </Button>

                                    <div className="text-center pt-2">
                                        <button 
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={resendDisabled || resendLoading}
                                            className="text-[11px] font-black uppercase tracking-widest text-text-secondary/70 hover:text-primary disabled:opacity-50 transition-colors cursor-pointer"
                                        >
                                            {resendDisabled ? `Resend Code in ${resendTimer}s` : 'Resend Verification Code'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: Account Profile & Security */}
                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <button onClick={() => { if (isGoogleUser) { setStep(1); } else { handleBack(); } }} className="flex items-center gap-2 text-text-secondary hover:text-text-main transition-colors cursor-pointer">
                                    <ArrowLeft size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
                                </button>

                                <div className="space-y-2">
                                    <h1 className="text-2xl sm:text-3xl font-display font-black text-text-main tracking-tight">
                                        {isGoogleUser ? 'Complete Your Profile' : 'Account Details & Security'}
                                    </h1>
                                    <p className="text-sm font-medium text-text-secondary">
                                        {isGoogleUser ? 'Enter your name and details to setup account.' : 'Set up your name, business contact phone, and password.'}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">First Name</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input 
                                                    type="text" 
                                                    value={formData.firstName} 
                                                    onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                                                    placeholder="First Name" 
                                                    className="w-full pl-11 pr-4 h-13 bg-gray-50/80 border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none font-bold text-sm transition-all" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Last Name</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input 
                                                    type="text" 
                                                    value={formData.lastName} 
                                                    onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                                                    placeholder="Last Name" 
                                                    className="w-full pl-11 pr-4 h-13 bg-gray-50/80 border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none font-bold text-sm transition-all" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {!isGoogleUser && (
                                        <>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Phone Number</label>
                                                <div className="relative">
                                                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                    <input 
                                                        type="tel" 
                                                        value={formData.phone} 
                                                        onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} 
                                                        placeholder="WhatsApp / Phone Number" 
                                                        className="w-full pl-11 pr-4 h-13 bg-gray-50/80 border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none font-bold text-sm transition-all" 
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">
                                                    Referral Code <span className="text-text-secondary/50 font-normal lowercase">(optional)</span>
                                                </label>
                                                <div className="relative">
                                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                    <input 
                                                        type="text" 
                                                        value={formData.referralCode} 
                                                        onChange={(e) => setFormData({...formData, referralCode: e.target.value})} 
                                                        placeholder="e.g. VEM-XXXXX" 
                                                        className="w-full pl-11 pr-4 h-13 bg-gray-50/80 border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none font-bold text-sm transition-all uppercase" 
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-gray-100 space-y-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Create Password</label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                        <input 
                                                            type={showPassword ? 'text' : 'password'} 
                                                            value={formData.password} 
                                                            onChange={(e) => setFormData({...formData, password: e.target.value})} 
                                                            placeholder="••••••••" 
                                                            className="w-full pl-11 pr-12 h-13 bg-gray-50/80 border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none font-bold text-sm transition-all" 
                                                        />
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setShowPassword(!showPassword)} 
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary cursor-pointer"
                                                        >
                                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Confirm Password</label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                        <input 
                                                            type={showPassword ? 'text' : 'password'} 
                                                            value={formData.confirmPassword} 
                                                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
                                                            placeholder="••••••••" 
                                                            className="w-full pl-11 pr-12 h-13 bg-gray-50/80 border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none font-bold text-sm transition-all" 
                                                        />
                                                    </div>
                                                </div>

                                                {/* Password strength checklist */}
                                                <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-1.5 mt-2">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary/70 mb-2">Password Rules</p>
                                                    {[
                                                        { label: 'Minimum 8 characters', pass: pwdRules.minLength },
                                                        { label: 'At least 1 lowercase letter', pass: pwdRules.hasLowercase },
                                                        { label: 'At least 1 uppercase letter', pass: pwdRules.hasUppercase },
                                                        { label: 'At least 1 digit (0-9)', pass: pwdRules.hasNumber },
                                                        { label: 'At least 1 special character', pass: pwdRules.hasSymbol },
                                                    ].map((rule, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 text-xs">
                                                            {rule.pass ? (
                                                                <Check size={13} className="text-emerald-500 shrink-0" strokeWidth={3} />
                                                            ) : (
                                                                <div className="size-3 rounded-full border border-gray-300 shrink-0" />
                                                            )}
                                                            <span className={cn("font-medium transition-colors text-[11px]", rule.pass ? "text-emerald-700 font-bold" : "text-text-secondary/60")}>
                                                                {rule.label}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {error && <p className="text-red-500 text-xs font-semibold px-2">{error}</p>}

                                    <Button 
                                        onClick={isGoogleUser ? handleGoogleComplete : handleFinalSubmit} 
                                        disabled={isLoading || !formData.firstName || !formData.lastName || (!isGoogleUser && (!formData.password || formData.password !== formData.confirmPassword || !isPasswordStrong))} 
                                        className="w-full h-14 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-[0.15em] text-xs rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 mt-4"
                                    >
                                        {isLoading ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isGoogleUser ? 'Complete Registration' : 'Create My Account & Start Onboarding')}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Login Link */}
                    {step < 4 && (
                        <div className="pt-4 text-center">
                            <p className="text-xs font-medium text-text-secondary">
                                Already have a business account? <Link href="/login" className="text-primary font-black uppercase tracking-widest text-[10px] ml-1.5 hover:underline">Sign In Here</Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
