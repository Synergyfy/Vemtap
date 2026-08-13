"use client";

import React, { useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { 
    Mail, Lock, Eye, EyeOff,
    ShieldCheck, 
    Zap, AlertCircle
} from 'lucide-react';

import Logo from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { getFirstPermittedDashboardRoute, isRouteAllowed } from '@/lib/utils/nav-filter';
import { hasSavedOnboardingProgress } from '@/lib/onboardingProgress';

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isPhone = (v: string) => /^[\+\d][\d\s\-\(\)]{7,20}$/.test(v.trim());
const isValidIdentifier = (v: string) => isEmail(v) || isPhone(v);

export default function LoginPage() {
    return (
        <Suspense>
            <LoginPageContent />
        </Suspense>
    );
}

function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect');
    const storeLogin = useAuthStore((s) => s.login);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [requires2FA, setRequires2FA] = useState(false);
    const [twoFACode, setTwoFACode] = useState('');
    const [pendingLogin, setPendingLogin] = useState<{ identifier: string; password: string } | null>(null);

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

    const routeAfterLogin = useCallback((role: string, businessId?: string, isNewUser?: boolean, permissions: string[] = []) => {
        const normalizedRole = role?.toLowerCase();
        const isOwnerOrAdmin = normalizedRole === 'owner' || normalizedRole === 'admin';
        const landing = getFirstPermittedDashboardRoute(normalizedRole, permissions);

        // Only honor ?redirect= when the user can actually access the target.
        // Otherwise fall through to the topmost page of their permission set.
        if (redirectTo) {
            const redirectAllowed =
                !redirectTo.startsWith('/dashboard') ||
                isOwnerOrAdmin ||
                isRouteAllowed(redirectTo, normalizedRole, permissions, isOwnerOrAdmin);
            if (redirectAllowed) {
                router.push(redirectTo);
                return;
            }
        }

        if (normalizedRole === 'admin') {
            router.push('/admin');
        } else if (normalizedRole === 'owner' && (!businessId || isNewUser)) {
            router.push('/onboarding');
        } else if (normalizedRole === 'owner' && hasSavedOnboardingProgress(useAuthStore.getState().user?.id)) {
            // Owner with an in-progress onboarding resume where they stopped.
            router.push('/onboarding');
        } else if (businessId && (normalizedRole === 'owner' || normalizedRole === 'manager' || normalizedRole === 'staff')) {
            router.push(landing ?? '/dashboard');
        } else if (normalizedRole === 'customer') {
            router.push('/customer/dashboard');
        } else {
            router.push(landing ?? '/dashboard');
        }
    }, [router, redirectTo]);

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
            await storeLogin(response.user, response.access_token);
            routeAfterLogin(response.user.role, response.user.businessId, response.isNewUser, response.user.permissions || []);
        } catch (err: any) {
            const message = err?.message || 'Google sign-in failed. Please try again.';
            setGeneralError(message);
        } finally {
            setIsLoggingIn(false);
        }
    }, [storeLogin, routeAfterLogin]);



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

            if (response?.requiresTwoFactor) {
                setRequires2FA(true);
                setPendingLogin({ identifier: formData.email.trim(), password: formData.password });
                setIsLoggingIn(false);
                return;
            }

            if (!response?.user || !response?.access_token) {
                setGeneralError('Invalid response from server');
                return;
            }

            await storeLogin(response.user, response.access_token);
            routeAfterLogin(response.user.role, response.user.businessId, response.isNewUser, response.user.permissions || []);
        } catch (err: any) {
            const message = err?.message || 'Invalid email, phone number or password';
            setGeneralError(message);
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handle2FASubmit = async () => {
        setGeneralError(null);
        if (twoFACode.length !== 6 || !pendingLogin) return;
        setIsLoggingIn(true);
        try {
            const response = await api.post('/auth/login', {
                identifier: pendingLogin.identifier,
                password: pendingLogin.password,
                twoFactorCode: twoFACode,
            });
            if (!response?.user || !response?.access_token) {
                setGeneralError('Invalid 2FA code');
                return;
            }
            await storeLogin(response.user, response.access_token);
            routeAfterLogin(response.user.role, response.user.businessId, response.isNewUser, response.user.permissions || []);
        } catch (err: any) {
            setGeneralError(err?.message || 'Invalid 2FA code');
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
                        <Logo className="h-9 brightness-0 invert mb-12" />
                    </Link>
                    <h2 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.12] mb-8">
                        Manage Your <br /> Business <br /> Growth.
                    </h2>
                    <p className="text-lg font-medium text-white/70 mb-10">
                        Sign in to access your customer database, send smart campaigns, and track real-time analytics.
                    </p>
                    
                    <div className="space-y-5">
                        <div className="flex items-center gap-3.5">
                            <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <Zap size={18} className="text-white" />
                            </div>
                            <p className="text-sm font-semibold">Real-time scan tracking</p>
                        </div>
                        <div className="flex items-center gap-3.5">
                            <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <ShieldCheck size={18} className="text-white" />
                            </div>
                            <p className="text-sm font-semibold">Secure data encryption</p>
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

                    <div className="mb-8 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary/10 rounded-full mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Account Login</span>
                        </div>
                        <h1 className="text-[28px] font-bold text-text-main tracking-tight leading-tight mb-2">Welcome back</h1>
                        <p className="text-sm text-text-secondary font-medium">Sign in to manage your Vemtap dashboard.</p>
                    </div>

                    {/* General Error Banner */}
                    {generalError && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3"
                        >
                            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm font-medium text-red-600">{generalError}</p>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {requires2FA ? (
                            <>
                                <div className="text-center mb-4">
                                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <ShieldCheck size={28} className="text-primary" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">Two-Factor Authentication</h3>
                                    <p className="text-sm text-gray-400 mt-1">Enter the 6-digit code from your authenticator app</p>
                                </div>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={twoFACode}
                                        onChange={(e) => {
                                            setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6));
                                            if (generalError) setGeneralError(null);
                                        }}
                                        placeholder="000000"
                                        autoFocus
                                        className="w-full h-14 bg-gray-50 border border-gray-200 rounded-xl outline-none font-semibold text-lg text-center tracking-[0.4em] focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    disabled={isLoggingIn || twoFACode.length !== 6}
                                    onClick={handle2FASubmit}
                                    className="w-full h-12 bg-[#066CF4] text-white font-bold uppercase tracking-wider text-[11px] rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    {isLoggingIn ? (
                                        <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Verify Code'
                                    )}
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => { setRequires2FA(false); setTwoFACode(''); setPendingLogin(null); }}
                                    className="w-full text-sm font-semibold text-gray-400 hover:text-[#066CF4] transition-colors cursor-pointer"
                                >Back to login</button>
                            </>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-text-secondary">Email or Phone Number</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
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
                                        "w-full pl-11 pr-4 h-12 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-normal text-text-main transition-all placeholder:text-gray-400",
                                        fieldErrors.email
                                            ? "border-red-300 focus:border-red-300 focus:ring-4 focus:ring-red-100"
                                            : "focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                                    )}
                                />
                            </div>
                            {fieldErrors.email && (
                                <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1.5">
                                    <AlertCircle size={12} />
                                    {fieldErrors.email}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-medium text-text-secondary">Password</label>
                                <Link href="/forgot-password" title="reset password" className="text-xs font-semibold text-primary hover:underline">Forgot?</Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
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
                                        "w-full pl-11 pr-11 h-12 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-normal text-text-main transition-all placeholder:text-gray-400",
                                        fieldErrors.password
                                            ? "border-red-300 focus:border-red-300 focus:ring-4 focus:ring-red-100"
                                            : "focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                                    )}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary cursor-pointer"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1.5">
                                    <AlertCircle size={12} />
                                    {fieldErrors.password}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoggingIn || !formData.email || !formData.password}
                            className="w-full h-12 bg-[#066CF4] text-white font-bold uppercase tracking-wider text-[11px] rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            {isLoggingIn ? (
                                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Login To Dashboard'
                            )}
                        </Button>
                        </>
                        )}
                    </form>

                    <div className="mt-8">
                        <div className="relative flex items-center justify-center mb-6">
                            <div className="absolute w-full h-px bg-gray-100" />
                            <span className="relative px-4 bg-white text-[10px] font-bold uppercase tracking-wider text-gray-400">Or continue with</span>
                        </div>

                        {isLoggingIn ? (
                            <div className="w-full h-11 flex items-center justify-center bg-white rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.06)]">
                                <div className="size-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="w-full flex justify-center overflow-hidden rounded-2xl">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setGeneralError('Google Sign-In failed or was cancelled. Please try again.')}
                                    useOneTap={false}
                                    theme="outline"
                                    shape="rectangular"
                                    width="100%"
                                    text="signin_with"
                                />
                            </div>
                        )}
                    </div>

                    {/* Sign Up Link */}
                    <div className="mt-10 text-center">
                        <p className="text-sm text-text-secondary font-medium">
                            Don&apos;t have an account? <Link href="/get-started" className="text-primary font-bold uppercase tracking-wider text-[10px] ml-2 hover:underline">Create Account</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
