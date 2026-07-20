'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2, CheckCircle2, ShieldCheck, Rocket } from 'lucide-react';
import { toast } from 'react-hot-toast';

function OnboardingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { signup } = useAuthStore();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Initializing secure onboarding...');

    useEffect(() => {
        const autoOnboard = async () => {
            const email = searchParams.get('email');
            const businessName = searchParams.get('businessName') || 'New Business';
            const name = searchParams.get('name') || 'Business Owner';

            if (!email) {
                setStatus('error');
                setMessage('Missing required onboarding information. Please contact support.');
                return;
            }

            try {
                setMessage('Creating your business infrastructure...');
                await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate work

                const signupData = {
                    email,
                    name,
                    businessName,
                    role: 'owner' as const,
                    planId: 'free' as const,
                };

                await signup(signupData as any, '');

                setMessage('Setting up your dashboard workspace...');
                await new Promise(resolve => setTimeout(resolve, 1000));

                setStatus('success');
                setMessage('Success! Redirecting you to your new dashboard...');

                toast.success("Let's help you bring your next customer back. Your dashboard is ready!");

                setTimeout(() => {
                    router.push('/dashboard/settings/subscription');
                }, 2000);
            } catch (error) {
                console.error('Onboarding error:', error);
                setStatus('error');
                setMessage('We encountered an issue during onboarding. Please try logging in manually.');
                toast.error('Automated onboarding failed.');
            }
        };

        autoOnboard();
    }, [searchParams, signup, router]);

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px]">
            <div className="max-w-md w-full bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-10 text-center relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute -top-24 -left-24 size-48 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -right-24 size-48 bg-primary/10 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <div className="mb-10 inline-flex">
                        <div className="size-20 bg-primary/5 rounded-4xl flex items-center justify-center relative">
                            {status === 'loading' && (
                                <Loader2 size={40} className="text-primary animate-spin" />
                            )}
                            {status === 'success' && (
                                <div className="text-green-500 animate-in zoom-in duration-500">
                                    <CheckCircle2 size={48} />
                                </div>
                            )}
                            {status === 'error' && (
                                <div className="text-red-500 animate-in shake duration-500">
                                    <ShieldCheck size={48} />
                                </div>
                            )}

                            {/* Decorative Dots */}
                            <div className="absolute -top-2 -right-2 size-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <div className="size-2 bg-primary rounded-full animate-pulse" />
                            </div>
                        </div>
                    </div>

                    <h1 className="text-3xl font-display font-bold text-text-main mb-4 tracking-tight">
                        {status === 'loading' && 'Configuring VemTap'}
                        {status === 'success' && 'Welcome Aboard!'}
                        {status === 'error' && 'Something went wrong'}
                    </h1>

                    <p className="text-text-secondary font-medium leading-relaxed mb-10">
                        {message}
                    </p>

                    {status === 'loading' && (
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                            <div className="h-full bg-primary animate-[onboarding-progress_3s_ease-in-out_infinite]" />
                        </div>
                    )}

                    {status === 'error' && (
                        <button
                            onClick={() => router.push('/get-started')}
                            className="w-full h-14 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
                        >
                            Return to Signup
                        </button>
                    )}

                    <div className="pt-8 border-t border-gray-50 mt-10">
                        <div className="flex items-center justify-center gap-6 opacity-30">
                            <ShieldCheck size={20} />
                            <Rocket size={20} />
                            <div className="h-4 w-px bg-gray-300" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Enterprise Grade Security</span>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes onboarding-progress {
                    0% { width: 0%; transform: translateX(-100%); }
                    50% { width: 50%; transform: translateX(0%); }
                    100% { width: 100%; transform: translateX(100%); }
                }
                .shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
            `}</style>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
                <Loader2 size={40} className="text-primary animate-spin" />
                <p className="mt-4 text-text-secondary font-medium">Loading session...</p>
            </div>
        }>
            <OnboardingContent />
        </Suspense>
    );
}

