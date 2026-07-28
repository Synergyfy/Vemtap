"use client";

import React from 'react';
import LoyaltyTabs from '@/components/loyalty/LoyaltyTabs';
import { 
    LayoutDashboard, 
    Gift, 
    TicketCheck, 
    Settings, 
    Award,
    History
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';

export default function LoyaltyDashboardLayout({ children }: { children: React.ReactNode }) {
    const tabs = [
        { label: 'Overview', href: '/dashboard/loyalty', icon: <LayoutDashboard size={18} /> },
        { label: 'Give Points', href: '/dashboard/loyalty/award', icon: <Award size={18} /> },
        { label: 'Redeem Reward', href: '/dashboard/loyalty/redemptions', icon: <TicketCheck size={18} /> },
        { label: 'Create Rewards', href: '/dashboard/loyalty/rewards', icon: <Gift size={18} /> },
        { label: 'Settings', href: '/dashboard/loyalty/settings', icon: <Settings size={18} /> },
    ];

    return (
        <PageLockWrapper feature="loyalty" featureName="Loyalty">
            <div className="flex flex-col gap-8 p-4 md:p-8 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <PageHeader 
                        title="Loyalty Rewards"
                        description="Manage your customer loyalty programs, points, and redemptions."
                    />
                </div>
                
                <LoyaltyTabs tabs={tabs} />
                
                <div className="mt-2">
                    {children}
                </div>
            </div>
        </PageLockWrapper>
    );
}
