"use client";

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
    Mail, Lock, Eye, EyeOff, ArrowRight,
    ShieldCheck, 
    Zap, AlertCircle
} from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import Logo from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isPhone = (v: string) => /^[\+\d][\d\s\-\(\)]{7,20}$/.test(v.trim());
const isValidIdentifier = (v: string) => isEmail(v) || isPhone(v);

export default function LoginPage() {
    const router = useRouter();
    const storeLogin = useAuthStore((s) => s.login);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
    const [generalError, setGeneralError] = useState<string | null>(null);

    const validate = () => {
        const errors: { email?: string; password?: string } = {};
        const trimmed = formData.email.trim();

        if (!trimmed) {
            errors.email = 'Email or phone number is required';
        } else if (!isValidIdentifier(trimmed)) {
            errors.email = 'Enter a valid email address or phone number';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const routeAfterLogin = useCallback((role: string, businessId?: string, isNewUser?: boolean) => {
        const normalizedRole = role?.toLowerCase();
        if (normalizedRole === 'admin') {
            router.push('/admin');
        } else if (normalizedRole === 'owner' && (!businessId || isNewUser)) {
            router.push('/onboarding');
        } else if (businessId && (normalizedRole === 'owner' || normalizedRole === 'manager' || normalizedRole === 'staff')) {
            router.push('/dashboard');
        } else if (normalizedRole === 'customer') {
            router.push('/customer/dashboard');
        } else {
            router.push('/dashboard');
        }
    }, [router]);

    const handleGoogleSuccess = useCallback(async (credentialResponse: any) => {
        if (!credentialResponse?.credential) {
            setGeneralError('Google authentication failed — no credential received');
            return;
        }
        setIsLoggingIn(true);
        setGeneralError(null);
        try {
            const response = await api.post('/auth/google', {
                token: credentialResponse.credential,
            });
            if (!response?.user || !response?.access_token) {
                setGeneralError('Invalid response from server');
                return;
            }
            storeLogin(response.user, response.access_token);
            routeAfterLogin(response.user.role, response.user.businessId, response.isNewUser);
        } catch (err: any) {
            const message = err?.message || 'Google sign-in failed. Please try again.';
            setGeneralError(message);
        } finally {
            setIsLoggingIn(false);
        }
    }, [storeLogin, routeAfterLogin]);

    const googleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => {
            setGeneralError('Google sign-in was cancelled or failed. Please try again.');
        },
        flow: 'implicit',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError(null);

        if (!validate()) return;

        setIsLoggingIn(true);
        try {
            const response = await api.post('/auth/login', {
                identifier: formData.email.trim(),
                password: formData.password,
            });

            if (!response?.user || !response?.access_token) {
                setGeneralError('Invalid response from server');
                return;
            }

            storeLogin(response.user, response.access_token);
            routeAfterLogin(response.user.role, response.user.businessId, response.isNewUser);
        } catch (err: any) {
            const message = err?.message || 'Invalid email, phone number or password';
            setGeneralError(message);
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
            {/* LEFT COLUMN: Visual Branding */}
            <div className="hidden lg:flex lg:w-[40%] bg-[#066CF4] items-center justify-center p-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-[100px]" />
                
                <div className="relative z-10 text-white max-w-sm">
                    <Link href="/">
                        <Logo className="h-10 brightness-0 invert mb-16" />
                    </Link>
                    <h2 className="text-5xl font-black tracking-tight leading-[1.1] mb-10">
                        Manage Your <br /> Business <br /> Growth.
                    </h2>
                    <p className="text-lg font-medium text-white/70 mb-12">
                        Sign in to access your customer database, send smart campaigns, and track real-time analytics.
                    </p>
                    
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-2xl bg-white/10 flex items-center justify-center">
                                <Zap size={20} className="text-white" />
                            </div>
                            <p className="text-sm font-bold">Real-time scan tracking</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-2xl bg-white/10 flex items-center justify-center">
                                <ShieldCheck size={20} className="text-white" />
                            </div>
                            <p className="text-sm font-bold">Secure data encryption</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Minimal Login Form */}
            <div className="flex-1 flex flex-col justify-center p-6 md:p-12 lg:p-24 bg-white relative">
                <div className="max-w-md w-full mx-auto">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-12">
                        <Link href="/">
                            <Logo className="h-8" />
                        </Link>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-2">Welcome Back</h1>
                        <p className="text-sm font-medium text-gray-400">Sign in to manage your Vemtap dashboard.</p>
                    </div>

                    {/* General Error Banner */}
                    {generalError && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3"
                        >
                            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm font-bold text-red-600">{generalError}</p>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Email or Phone Number</label>
                            <div className="relative">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input
                                    type="text"
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({...formData, email: e.target.value});
                                        if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                                        if (generalError) setGeneralError(null);
                                    }}
                                    placeholder="name@business.com or +2348012345678"
                                    className={cn(
                                        "w-full pl-14 pr-6 h-16 bg-gray-50 border-2 rounded-2xl outline-none font-bold text-sm transition-all",
                                        fieldErrors.email
                                            ? "border-red-200 focus:ring-2 focus:ring-red-200"
                                            : "border-transparent focus:ring-2 focus:ring-[#066CF4]/10"
                                    )}
                                />
                            </div>
                            {fieldErrors.email && (
                                <p className="ml-4 mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1.5">
                                    <AlertCircle size={12} />
                                    {fieldErrors.email}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Password</label>
                                <Link href="/forgot-password" title="reset password" className="text-[10px] font-black uppercase tracking-widest text-[#066CF4] hover:underline">Forgot?</Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => {
                                        setFormData({...formData, password: e.target.value});
                                        if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                                        if (generalError) setGeneralError(null);
                                    }}
                                    placeholder="••••••••"
                                    className={cn(
                                        "w-full pl-14 pr-14 h-16 bg-gray-50 border-2 rounded-2xl outline-none font-bold text-sm transition-all",
                                        fieldErrors.password
                                            ? "border-red-200 focus:ring-2 focus:ring-red-200"
                                            : "border-transparent focus:ring-2 focus:ring-[#066CF4]/10"
                                    )}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#066CF4]"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p className="ml-4 mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1.5">
                                    <AlertCircle size={12} />
                                    {fieldErrors.password}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoggingIn || !formData.email || !formData.password}
                            className="w-full h-16 bg-[#066CF4] text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            {isLoggingIn ? (
                                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Login To Dashboard'
                            )}
                        </Button>
                    </form>

                    <div className="mt-10">
                        <div className="relative flex items-center justify-center mb-8">
                            <div className="absolute w-full h-px bg-gray-100" />
                            <span className="relative px-4 bg-white text-[10px] font-black uppercase tracking-widest text-gray-300">Or continue with</span>
                        </div>
                        
                        <Button
                            variant="outline"
                            disabled={isLoggingIn}
                            onClick={() => googleLogin()}
                            className="w-full h-16 rounded-2xl border-gray-100 font-bold text-sm flex items-center justify-center gap-3 hover:bg-gray-50"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="size-5" alt="Google" />
                            {isLoggingIn ? (
                                <div className="size-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                            ) : (
                                'Sign in with Google'
                            )}
                        </Button>
                    </div>

                    {/* Sign Up Link */}
                    <div className="mt-12 text-center">
                        <p className="text-sm font-medium text-gray-400">
                            Don't have an account? <Link href="/get-started" className="text-[#066CF4] font-black uppercase tracking-widest text-[10px] ml-2 hover:underline">Create Account</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
