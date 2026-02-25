'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AuthSidePanel from '@/components/auth/AuthSidePanel';
import { useAuthStore, AuthState } from '../../store/useAuthStore';
import Logo from '@/components/brand/Logo';
import { Headset } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((state: AuthState) => state.login);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    });
    const [isAutoLogin, setIsAutoLogin] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);

        try {
            const email = formData.email.trim().toLowerCase();
            const password = formData.password.trim();

            if (!email || !password) {
                throw new Error('Email and password are required.');
            }

            const inferredRole =
                email.includes('admin') ? 'admin' :
                    email.includes('customer') ? 'customer' :
                        email.includes('manager') ? 'manager' :
                            email.includes('staff') || email.includes('agent') ? 'staff' :
                                'owner';

            const mockUser = {
                id: `mock-${inferredRole}-${Date.now()}`,
                email,
                name: email.split('@')[0]?.replace(/[._-]/g, ' ') || 'VemTap User',
                role: inferredRole,
            };

            login(mockUser as any, 'mock-token');

            if (inferredRole === 'admin') {
                router.push('/admin/dashboard');
                return;
            }
            if (inferredRole === 'customer') {
                router.push('/customer/dashboard');
                return;
            }
            if (inferredRole === 'staff' && (email.includes('agent') || email.includes('support'))) {
                router.push('/agent/dashboard');
                return;
            }
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleAgentMockLogin = () => {
        setError('');
        setIsAutoLogin(true);
        setFormData((prev) => ({
            ...prev,
            email: 'agent@vemtap.com',
            password: 'vemtap-agent',
            rememberMe: true,
        }));
        setShowPassword(true);

        const mockUser = {
            id: `mock-agent-${Date.now()}`,
            email: 'agent@vemtap.com',
            name: 'Support Agent',
            role: 'staff',
        };

        setTimeout(() => {
            login(mockUser as any, 'mock-token');
            router.push('/agent/dashboard');
            setIsAutoLogin(false);
        }, 600);
    };

    return (
        <div className="h-screen bg-white flex overflow-hidden font-sans">
            {/* Left Side: Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col overflow-y-auto">
                <div className="p-8 md:p-12 lg:p-20 pb-20 md:pb-28 lg:pb-32 flex flex-col min-h-full">
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
                                    <h1 className="text-4xl font-display font-bold text-text-main mb-4 leading-tight tracking-tight">Welcome back</h1>
                                    <p className="text-base text-text-secondary font-medium leading-relaxed max-w-lg">Login to manage your business and check your customer data in real-time.</p>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-8">
                                    {error && (
                                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 animate-shake">
                                            <span className="material-icons-round text-red-600">error</span>
                                            <p className="text-sm font-semibold text-red-900">{error}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">Email Address</label>
                                            <div className="relative">
                                                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">low_priority</span>
                                                <input
                                                    type="email"
                                                    placeholder="name@company.com"
                                                    className="w-full h-14 bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-5 font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 focus:bg-white transition-all text-sm"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-text-secondary">Security Password</label>
                                                <Link href="/forgot-password" hidden className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Forgot?</Link>
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
                                        disabled={isLoggingIn}
                                        className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-hover hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-base mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                    >
                                        {isLoggingIn ? (
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

                                <div className="mt-10">
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-text-secondary mb-4">Agent Access (Mock)</p>
                                    <button
                                        type="button"
                                        onClick={handleAgentMockLogin}
                                        className="w-full rounded-3xl border border-gray-200 bg-white hover:bg-gray-50 transition-all p-6 flex items-center gap-4 shadow-sm hover:shadow-md"
                                    >
                                        <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                            <Headset size={24} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="text-sm font-black text-text-main uppercase tracking-wider">Support Agent Dashboard</p>
                                            <p className="text-xs text-text-secondary font-medium mt-1">
                                                {isAutoLogin ? 'Auto logging in...' : 'Preview the live support workspace without backend auth.'}
                                            </p>
                                        </div>
                                        <span className="material-icons-round text-primary text-xl">{isAutoLogin ? 'autorenew' : 'arrow_forward'}</span>
                                    </button>
                                </div>
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

