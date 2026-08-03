"use client";

import React from 'react';
import LoyaltyTabs from '@/components/loyalty/LoyaltyTabs';
import { Wallet, History } from 'lucide-react';

export default function CustomerLoyaltyLayout({ children }: { children: React.ReactNode }) {
    const tabs = [
        { label: 'My Rewards', href: '/customer/loyalty', icon: <Wallet size={18} /> },
        { label: 'History', href: '/customer/loyalty/history', icon: <History size={18} /> },
    ];

    return (
        <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full pb-24">
            <div className="flex flex-col gap-1">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Your Rewards</h1>
                <p className="text-xs md:text-sm text-gray-500">Track your points and unlock exclusive rewards.</p>
            </div>
            
            <div className="py-1">
                <LoyaltyTabs tabs={tabs} />
            </div>
            
            <div className="mt-1">
                {children}
            </div>
        </div>
    );
}
