"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
    Mail, Lock, Eye, EyeOff, ArrowRight, 
    ChevronRight, CheckCircle2, ShieldCheck, 
    Globe, Zap, Layout
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate login
        setTimeout(() => {
            setIsLoading(false);
            router.push('/dashboard');
        }, 1500);
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

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input 
                                    type="email" 
                                    required
                                    value={formData.email} 
                                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                                    placeholder="name@business.com" 
                                    className="w-full pl-14 pr-6 h-16 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#066CF4]/10 outline-none font-bold text-sm transition-all" 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Password</label>
                                <Link href="/forgot-password" title="reset password"  className="text-[10px] font-black uppercase tracking-widest text-[#066CF4] hover:underline">Forgot?</Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input 
                                    type={showPassword ? 'text' : 'password'} 
                                    required
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

                        <Button 
                            type="submit"
                            disabled={isLoading || !formData.email || !formData.password} 
                            className="w-full h-16 bg-[#066CF4] text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            {isLoading ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Login To Dashboard'}
                        </Button>
                    </form>

                    <div className="mt-10">
                        <div className="relative flex items-center justify-center mb-8">
                            <div className="absolute w-full h-px bg-gray-100" />
                            <span className="relative px-4 bg-white text-[10px] font-black uppercase tracking-widest text-gray-300">Or continue with</span>
                        </div>
                        
                        <Button variant="outline" className="w-full h-16 rounded-2xl border-gray-100 font-bold text-sm flex items-center justify-center gap-3 hover:bg-gray-50">
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="size-5" alt="Google" />
                            Sign in with Google
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
