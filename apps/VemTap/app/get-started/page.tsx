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

    // Form State
    const [formData, setFormData] = useState({
        businessName: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });

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
            await requestOwnerOtp({
                email: formData.email,
                phone: formData.phone,
                role: 'Owner'
            });
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
            await requestOwnerOtp({
                email: formData.email,
                phone: formData.phone,
                role: 'Owner'
            });
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
            const response = await registerOwner({
                email: formData.email,
                businessNumber: formData.phone,
                firstName: formData.firstName,
                lastName: formData.lastName,
                businessName: formData.businessName,
            });

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
            const response = await registerOwner({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                businessName: formData.businessName,
            });

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
        <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
            {/* LEFT COLUMN: Visual Info */}
            <div className="hidden lg:flex lg:w-[40%] bg-gray-900 items-center justify-center p-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#066CF4]/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-[100px]" />
                
                <div className="relative z-10 text-white max-w-sm">
                    <Link href="/">
                        <Logo className="h-10 brightness-0 invert mb-16" />
                    </Link>
                    <Badge className="bg-[#066CF4] text-white border-none px-4 py-1.5 font-black uppercase tracking-widest mb-8">
                        Join 2,000+ Businesses
                    </Badge>
                    <h2 className="text-5xl font-black tracking-tight leading-[1.1] mb-10">
                        The Future Of <br /> Customer <br /> Engagement.
                    </h2>
                    
                    <div className="space-y-8">
                        {[
                            { t: 'Capture', d: 'QR and NFC registration in 2 seconds.' },
                            { t: 'Database', d: 'Auto-build your customer list.' },
                            { t: 'Growth', d: 'Send smart automated messages.' }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="size-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={16} className="text-[#066CF4]" />
                                </div>
                                <div>
                                    <p className="font-black text-sm uppercase tracking-widest mb-1">{item.t}</p>
                                    <p className="text-white/40 text-xs font-medium">{item.d}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-20 pt-10 border-t border-white/5">
                        <div className="flex items-center gap-4">
                           <div className="flex -space-x-3">
                              {[1, 2, 3, 4].map(i => <div key={i} className="size-8 rounded-full bg-gray-800 border-2 border-gray-900" />)}
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Loved by owners worldwide</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Multi-step Form */}
            <div className="flex-1 flex flex-col justify-center p-6 md:p-12 lg:p-24 bg-white relative">
                <div className="max-w-md w-full mx-auto">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-12">
                        <Link href="/">
                            <Logo className="h-8" />
                        </Link>
                    </div>

                    {/* Progress Indicator */}
                    {step < 4 && (
                        <div className="mb-12">
                            <div className="flex items-center justify-between mb-4">
                               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#066CF4]">Step {step} of 3</span>
                               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">
                                   {step === 1 ? 'Contact' : step === 2 ? 'Verify' : isGoogleUser ? 'Business' : 'Security'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3].map((s) => (
                                    <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-[#066CF4]' : 'bg-gray-100'}`}></div>
                                ))}
                            </div>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {/* STEP 1: Contact Info */}
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                <div>
                                    <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-2">
                                        {isGoogleUser ? 'Enter Your Phone Number' : 'How Can We Reach You?'}
                                    </h1>
                                    <p className="text-sm font-medium text-gray-400">
                                        {isGoogleUser ? 'We need your phone number to complete your profile.' : 'Your contact info will be used for account verification.'}
                                    </p>
                                </div>
                                <div className="space-y-6">
                                    {isGoogleUser ? (
                                        <>
                                            <div className="p-8 rounded-3xl bg-blue-50 border border-blue-100 text-center space-y-4">
                                                <div className="size-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm text-[#066CF4]">
                                                    <Mail size={32} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Verified Email</p>
                                                    <p className="text-sm font-bold text-gray-900">{formData.email}</p>
                                                </div>
                                            </div>

                                            {error && <p className="text-red-500 text-xs font-semibold ml-4">{error}</p>}

                                            <Button 
                                                onClick={() => setStep(3)} 
                                                className="w-full h-16 bg-[#066CF4] text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
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
                                                <div className="flex-1 h-px bg-gray-200" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Or</span>
                                                <div className="flex-1 h-px bg-gray-200" />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Email Address</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                                    <input 
                                                        type="email" 
                                                        value={formData.email} 
                                                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                                                        placeholder="name@business.com" 
                                                        className="w-full pl-14 pr-6 h-16 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#066CF4]/10 outline-none font-bold text-sm transition-all" 
                                                    />
                                                </div>
                                            </div>

                                            {error && <p className="text-red-500 text-xs font-semibold ml-4">{error}</p>}

                                            <Button 
                                                onClick={handleStep2Submit} 
                                                disabled={isLoading || !formData.email} 
                                                className="w-full h-16 bg-[#066CF4] text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                            >
                                                {isLoading ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Send Verification Code <ArrowRight size={16} /></>}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: OTP Verification */}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                <button onClick={handleBack} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors mb-4">
                                    <ArrowLeft size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
                                </button>
                                <div>
                                    <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-2">Verify Your Email</h1>
                                    <p className="text-sm font-medium text-gray-400">We sent a 4-digit verification code to <span className="text-[#066CF4] font-bold">{formData.email}</span>.</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Verification Code</label>
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                            <input 
                                                type="text" 
                                                maxLength={4}
                                                value={otpCode} 
                                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} 
                                                placeholder="e.g. 1234" 
                                                className="w-full pl-14 pr-6 h-16 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#066CF4]/10 outline-none font-bold text-center tracking-[1em] text-lg transition-all" 
                                            />
                                        </div>
                                    </div>
                                    
                                    {error && <p className="text-red-500 text-xs font-semibold ml-4">{error}</p>}

                                    <Button 
                                        onClick={handleVerifyOtp} 
                                        disabled={otpLoading || otpCode.length !== 4} 
                                        className="w-full h-16 bg-[#066CF4] text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        {otpLoading ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify Code'}
                                    </Button>

                                    <div className="text-center pt-2">
                                        <button 
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={resendDisabled || resendLoading}
                                            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#066CF4] disabled:opacity-50 transition-colors"
                                        >
                                            {resendDisabled ? `Resend Code in ${resendTimer}s` : 'Resend Code'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: Password / Security */}
                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                <button onClick={() => { if (isGoogleUser) { setStep(1); } else { handleBack(); } }} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors mb-4">
                                    <ArrowLeft size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
                                </button>
                                <div>
                                    <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-2">{isGoogleUser ? 'Tell Us About Your Business' : 'Secure Your Account'}</h1>
                                    <p className="text-sm font-medium text-gray-400">{isGoogleUser ? 'Just a few more details to get started.' : 'Set up your business details and password.'}</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Business Name</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                            <input 
                                                type="text" 
                                                value={formData.businessName} 
                                                onChange={(e) => setFormData({...formData, businessName: e.target.value})} 
                                                placeholder="e.g. Blue Bottle Coffee" 
                                                className="w-full pl-14 pr-6 h-16 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#066CF4]/10 outline-none font-bold text-sm transition-all" 
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">First Name</label>
                                            <div className="relative">
                                                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                                <input 
                                                    type="text" 
                                                    value={formData.firstName} 
                                                    onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                                                    placeholder="First Name" 
                                                    className="w-full pl-14 pr-6 h-16 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#066CF4]/10 outline-none font-bold text-sm transition-all" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Last Name</label>
                                            <div className="relative">
                                                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                                <input 
                                                    type="text" 
                                                    value={formData.lastName} 
                                                    onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                                                    placeholder="Last Name" 
                                                    className="w-full pl-14 pr-6 h-16 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#066CF4]/10 outline-none font-bold text-sm transition-all" 
                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                    {!isGoogleUser && (
                                        <div className="border-t border-gray-100 pt-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Create Password</label>
                                                <div className="relative">
                                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                                    <input 
                                                        type={showPassword ? 'text' : 'password'} 
                                                        value={formData.password} 
                                                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                                                        placeholder="••••••••" 
                                                        className="w-full pl-14 pr-14 h-16 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#066CF4]/10 outline-none font-bold text-sm transition-all" 
                                                    />
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setShowPassword(!showPassword)} 
                                                        className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#066CF4]"
                                                    >
                                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-2 mt-4">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Confirm Password</label>
                                                <div className="relative">
                                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                                    <input 
                                                        type="password" 
                                                        value={formData.confirmPassword} 
                                                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
                                                        placeholder="••••••••" 
                                                        className="w-full pl-14 pr-6 h-16 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#066CF4]/10 outline-none font-bold text-sm transition-all" 
                                                    />
                                                </div>
                                            </div>

                                            {/* Password strength checklist */}
                                            <div className="space-y-2 px-6 py-4 bg-gray-50 rounded-2xl mt-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Password Requirements</p>
                                                {[
                                                    { label: 'Minimum 8 characters', pass: pwdRules.minLength },
                                                    { label: 'At least 1 lowercase letter', pass: pwdRules.hasLowercase },
                                                    { label: 'At least 1 uppercase letter', pass: pwdRules.hasUppercase },
                                                    { label: 'At least 1 digit (0-9)', pass: pwdRules.hasNumber },
                                                    { label: 'At least 1 special character', pass: pwdRules.hasSymbol },
                                                ].map((rule, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                                        {rule.pass ? (
                                                            <Check size={14} className="text-emerald-500 shrink-0" />
                                                        ) : (
                                                            <div className="size-3.5 rounded-full border border-gray-300 shrink-0" />
                                                        )}
                                                        <span className={cn("font-medium transition-colors", rule.pass ? "text-emerald-600" : "text-gray-400")}>
                                                            {rule.label}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {error && <p className="text-red-500 text-xs font-semibold ml-4">{error}</p>}

                                    <Button 
                                        onClick={isGoogleUser ? handleGoogleComplete : handleFinalSubmit} 
                                        disabled={isLoading || !formData.businessName || !formData.firstName || !formData.lastName || (!isGoogleUser && (!formData.password || formData.password !== formData.confirmPassword || !isPasswordStrong))} 
                                        className="w-full h-16 bg-[#066CF4] text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        {isLoading ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isGoogleUser ? 'Complete Setup' : 'Create My Account')}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Login Link */}
                    {step < 4 && (
                        <div className="mt-12 text-center">
                           <p className="text-sm font-medium text-gray-400">
                               Already have an account? <Link href="/login" className="text-[#066CF4] font-black uppercase tracking-widest text-[10px] ml-2 hover:underline">Sign In</Link>
                           </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
