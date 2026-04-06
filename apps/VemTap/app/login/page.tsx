'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AuthSidePanel from '@/components/auth/AuthSidePanel';
import { useAuthStore } from '../../store/useAuthStore';
import Logo from '@/components/brand/Logo';
import { useLogin, useCheckUserStatus, useCompleteCustomerSetup, useResendDefaultPassword } from '@/services/auth/hooks';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { toast } from 'react-hot-toast';

type LoginStep = 'identifier' | 'setup-email' | 'info' | 'password';
type LoginTab = 'email' | 'phone';

export default function LoginPage() {
    const { loginUser, isLoading: isLoginLoading } = useLogin();
    const { checkStatus, isLoading: isCheckLoading } = useCheckUserStatus();
    const { completeSetup, isLoading: isSetupLoading } = useCompleteCustomerSetup();
    const { resendPassword, isLoading: isResendLoading } = useResendDefaultPassword();

    const router = useRouter();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const login = useAuthStore((state) => state.login);

    const [step, setStep] = useState<LoginStep>('identifier');
    const [activeTab, setActiveTab] = useState<LoginTab>('email');
    const [userStatus, setUserStatus] = useState<any>(null);

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        identifier: '',
        email: '',
        password: '',
        rememberMe: false,
    });
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

     
    console.log('[LOGIN PAGE] 🔍 isAuthenticated:', isAuthenticated);

    const handleContinue = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const identifier = formData.identifier.trim();
            if (!identifier) throw new Error('Input is required.');

            const res = await checkStatus(identifier);
            if (!res.exists) {
                throw new Error('No account found with this ' + activeTab + '.');
            }

            setUserStatus(res);

            // Flow Logic
            if (res.role?.toLowerCase() === 'customer') {
                if (!res.isPasswordChanged && !res.hasRealEmail) {
                    setStep('setup-email');
                } else {
                    setStep('password');
                }
            } else {
                // Owner/Staff flow
                setStep('password');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to verify account');
        }
    };

    const handleSetupEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (!formData.email) throw new Error('Email is required.');
            await completeSetup({ identifier: formData.identifier, email: formData.email });
            setStep('info');
        } catch (err: any) {
            setError(err.message || 'Failed to setup email');
        }
    };

    const handleResendPassword = async () => {
        try {
            await resendPassword(formData.identifier);
            toast.success('Default password resent to your email');
        } catch (err: any) {
            toast.error(err.message || 'Failed to resend password');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        if (!isMounted) return;
        e.preventDefault();
        setError('');

        try {
            const identifier = formData.identifier.trim();
            const password = formData.password.trim();

            if (!identifier || !password) {
                throw new Error('Email/Phone and password are required.');
            }

            const response = await loginUser({ identifier, password } as any);

            if (!isMounted) return;

            if (!response.access_token || !response.user) {
                throw new Error('Invalid response from server.');
            }

            // Sync with Zustand store
            login(response.user as any, response.access_token);
            toast.success('Login successful');

            const userRole = response.user.role?.toLowerCase();

            if (userRole === 'admin') {
                router.push('/admin/dashboard');
                return;
            }
            if (userRole === 'customer') {
                router.push('/customer/dashboard');
                return;
            }
            if (userRole === 'agent' || (userRole === 'staff' && (identifier.includes('agent') || identifier.includes('support')))) {
                router.push('/agent/dashboard');
                return;
            }

            // Standard redirect for owners/managers/other staff
            if (userRole === 'owner' && !response.user.businessId) {
                router.push('/get-started');
                return;
            }

            // Default fallback
            router.push('/dashboard');
        } catch (err: any) {
            if (isMounted) {
                setError(err.message || 'Login failed');
            }
        }
    };


    return (
        <div className="h-screen bg-white flex overflow-hidden font-sans">
            {/* Left Side: Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col overflow-y-auto">
                <div className="p-8 md:p-12 lg:p-20 pb-28 md:pb-36 lg:pb-40 flex flex-col min-h-full">
                    <Link href="/" className="mb-12 md:mb-20 block w-fit">
                        <Logo />
                    </Link>

                    <div className="flex-1 flex flex-col justify-center">
                        <div className="w-full max-w-2xl mx-auto lg:mx-0">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-10"
                            >
                                <div>
                                    <h1 className="text-4xl font-display font-bold text-text-main mb-4 leading-tight tracking-tight">
                                        {step === 'identifier' && "Welcome back"}
                                        {step === 'setup-email' && "One last step"}
                                        {step === 'info' && "Check your inbox"}
                                        {step === 'password' && "Securing your entry"}
                                    </h1>
                                    <p className="text-base text-text-secondary font-medium leading-relaxed max-w-lg">
                                        {step === 'identifier' && "Login to manage your business and check your customer data in real-time."}
                                        {step === 'setup-email' && "Please provide your email address to receive your temporary password and complete your account setup."}
                                        {step === 'info' && "We've sent a welcome email with your default password to your provided email address."}
                                        {step === 'password' && "Enter your password to access your dashboard."}
                                    </p>
                                </div>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 animate-shake">
                                        <span className="material-icons-round text-red-600">error</span>
                                        <p className="text-sm font-semibold text-red-900">{error}</p>
                                    </div>
                                )}

                                {step === 'identifier' && (
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <GoogleAuthButton 
                                                role="owner" 
                                                label="Sign in with Google"
                                                onSuccess={(res) => {
                                                    if (res.isNewUser) {
                                                        router.push('/get-started?from=google');
                                                        return;
                                                    }
                                                    const userRole = res.user.role?.toLowerCase();
                                                    
                                                    if (userRole === 'admin') router.push('/admin/dashboard');
                                                    else if (userRole === 'customer') router.push('/customer/dashboard');
                                                    else if (userRole === 'agent' || userRole === 'staff') router.push('/agent/dashboard');
                                                    else router.push('/dashboard');
                                                }}
                                            />
                                            
                                            <div className="relative my-8 pt-4">
                                                <div className="absolute inset-0 flex items-center">
                                                    <div className="w-full border-t border-slate-100"></div>
                                                </div>
                                                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em] bg-white px-4 text-slate-300">
                                                    OR CONTINUE MANUALLY
                                                </div>
                                            </div>
                                        </div>

                                        <form onSubmit={handleContinue} className="space-y-8">
                                        <div className="space-y-6">
                                            <div className="w-full bg-gray-50 p-1.5 h-14 rounded-2xl border border-gray-100 flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('email')}
                                                    className={`flex-1 h-full rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'email' ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-text-secondary hover:text-text-main'}`}
                                                >
                                                    <span className="material-icons-round text-lg">alternate_email</span>
                                                    Email Address
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('phone')}
                                                    className={`flex-1 h-full rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'phone' ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-text-secondary hover:text-text-main'}`}
                                                >
                                                    <span className="material-icons-round text-lg">phone</span>
                                                    Phone Number
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">
                                                    {activeTab === 'email' ? 'Email Address' : 'Phone Number'}
                                                </label>
                                                <div className="relative">
                                                    <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                                                        {activeTab === 'email' ? 'email' : 'phone'}
                                                    </span>
                                                    <input
                                                        type={activeTab === 'email' ? 'email' : 'text'}
                                                        placeholder={activeTab === 'email' ? 'email@company.com' : '+234...'}
                                                        className="w-full h-14 bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-5 font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 focus:bg-white transition-all text-sm"
                                                        value={formData.identifier}
                                                        onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isCheckLoading}
                                            className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-hover hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-base mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isCheckLoading ? (
                                                <span className="material-icons-round animate-spin">refresh</span>
                                            ) : (
                                                <>
                                                    Continue
                                                    <span className="material-icons-round text-xl">arrow_forward_ios</span>
                                                </>
                                            )}
                                        </button>
                                    </form>
                                    </div>
                                )}

                                {step === 'setup-email' && (
                                    <form onSubmit={handleSetupEmail} className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">Enter Your Email</label>
                                            <div className="relative">
                                                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">alternate_email</span>
                                                <input
                                                    type="email"
                                                    placeholder="your@email.com"
                                                    className="w-full h-14 bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-5 font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 focus:bg-white transition-all text-sm"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSetupLoading}
                                            className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-hover hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-base mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSetupLoading ? (
                                                <span className="material-icons-round animate-spin">refresh</span>
                                            ) : (
                                                <>
                                                    Save & Send Password
                                                    <span className="material-icons-round text-xl">send</span>
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStep('identifier')}
                                            className="w-full text-center text-xs font-bold text-text-secondary hover:text-primary transition-colors"
                                        >
                                            Back to Identifier
                                        </button>
                                    </form>
                                )}

                                {step === 'info' && (
                                    <div className="space-y-8">
                                        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex flex-col items-center text-center gap-4">
                                            <span className="material-icons-round text-primary text-5xl">mark_email_read</span>
                                            <div className="space-y-2">
                                                <h3 className="font-bold text-text-main text-lg underline decoration-primary decoration-2 underline-offset-4">Success!</h3>
                                                <p className="text-sm font-medium text-text-secondary leading-relaxed">
                                                    We've sent your temporary password to <b>{formData.email}</b>. Please check your inbox (and spam folder) and use it to sign in below.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <button
                                                onClick={() => setStep('password')}
                                                className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-hover transition-all flex items-center justify-center gap-3"
                                            >
                                                Proceed to Password
                                                <span className="material-icons-round text-xl">login</span>
                                            </button>
                                            <div className="flex flex-col items-center gap-3 pt-4">
                                                <p className="text-xs font-semibold text-text-secondary italic">Didn't receive the email?</p>
                                                <button
                                                    onClick={handleResendPassword}
                                                    disabled={isResendLoading}
                                                    className="text-xs font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-2"
                                                >
                                                    {isResendLoading ? 'Resending...' : 'Resend Welcome Email'}
                                                    {!isResendLoading && <span className="material-icons-round text-sm">replay</span>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 'password' && (
                                    <form onSubmit={handleLogin} className="space-y-8">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-text-secondary">Security Password</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setStep('identifier')}
                                                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                                >
                                                    Change Identifier ({formData.identifier})
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">shield</span>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    className="w-full h-14 bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-12 font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 focus:bg-white transition-all text-sm"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    required
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                                                >
                                                    <span className="material-icons-round text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id="remember"
                                                        className="peer sr-only"
                                                        checked={formData.rememberMe}
                                                        onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                                                    />
                                                    <div className="size-5 border-2 border-gray-200 rounded-lg peer-checked:bg-primary peer-checked:border-primary transition-all"></div>
                                                    <span className="material-icons-round absolute text-white text-xs scale-0 peer-checked:scale-100 transition-transform left-[4px]">check</span>
                                                </div>
                                                <span className="text-xs font-semibold text-text-secondary group-hover:text-text-main transition-colors">Keep me signed in for 30 days</span>
                                            </label>
                                            <Link href="/forgot-password" id="forgot-password" className="text-xs font-bold text-primary hover:underline underline-offset-4">Forgot password?</Link>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoginLoading}
                                            className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-hover hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-base mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoginLoading ? (
                                                <>
                                                    <span className="material-icons-round animate-spin">refresh</span>
                                                    Proccessing Secure Login...
                                                </>
                                            ) : (
                                                <>
                                                    Sign In to Dashboard
                                                    <span className="material-icons-round text-xl">arrow_forward</span>
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </motion.div>

                            <p className="text-xs text-center lg:text-left text-text-secondary font-bold uppercase tracking-[0.2em] mt-8">
                                Don't have an VemTap business account? <Link href="/get-started" className="text-primary hover:underline underline-offset-4">Join now</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Shared Mockup Image */}
            <div className="hidden lg:block lg:w-1/2 relative overflow-hidden h-screen">
                <AuthSidePanel
                    features={[
                        {
                            title: "Monitor your business in real-time.",
                            description: "Track customer visits, peak hours, and loyalty growth instantly from your dashboard.",
                            icon: "analytics"
                        },
                        {
                            title: "Connect with every tap.",
                            description: "Turn anonymous footfall into loyal customers with our seamless NFC technology.",
                            icon: "nfc"
                        }
                    ]}
                />
            </div>
        </div>
    );
}

