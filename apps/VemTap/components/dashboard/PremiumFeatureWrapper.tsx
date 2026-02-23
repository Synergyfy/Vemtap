'use client';

import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Lock, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PremiumFeatureWrapperProps {
    children: React.ReactNode;
    featureName: string;
    description: string;
}

export default function PremiumFeatureWrapper({ children, featureName, description }: PremiumFeatureWrapperProps) {
    const { user } = useAuthStore();

    // Check if user has a premium plan or active trial
    const isPremium = user?.planId === 'premium' || user?.planId === 'white-label' || user?.planId === 'enterprise' || (user as any)?.subscriptionStatus === 'trialing';

    if (isPremium) {
        return <>{children}</>;
    }

    return (
        <div className="relative min-h-[400px] flex items-center justify-center p-8">
            {/* Blurry Background Content */}
            <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none filter blur-sm">
                {children}
            </div>

            {/* Locked Overlay */}
            <div className="relative z-10 max-w-md w-full bg-white rounded-3xl border border-gray-200 shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
                    <Lock size={32} />
                </div>

                <h2 className="text-2xl font-display font-bold text-text-main mb-3">
                    Unlock {featureName}
                </h2>
                <p className="text-text-secondary font-medium mb-8">
                    {description} Upgrade to a Premium plan to access this and other advanced growth tools.
                </p>

                <div className="space-y-4">
                    <Link
                        href="/dashboard/settings/billing"
                        className="w-full flex items-center justify-center gap-2 h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
                    >
                        <Zap size={18} />
                        View Premium Plans
                    </Link>

                    <button
                        onClick={() => window.location.href = 'mailto:hello@vemtap.com?subject=Premium Trial Request'}
                        className="w-full flex items-center justify-center gap-2 h-12 bg-white border border-gray-200 text-text-main font-bold rounded-xl hover:bg-gray-50 transition-all"
                    >
                        Contact Sales for a Trial
                        <ArrowRight size={16} />
                    </button>
                </div>

                <p className="mt-6 text-[10px] text-text-secondary/60 font-medium uppercase tracking-widest">
                    Available on Basic, Premium & Enterprise tiers
                </p>
            </div>
        </div>
    );
}
