"use client";

import React from 'react';
import LoyaltyTabs from '@/components/loyalty/LoyaltyTabs';
import { LayoutDashboard, Building2, LayoutTemplate, ShieldAlert } from 'lucide-react';

export default function AdminLoyaltyLayout({ children }: { children: React.ReactNode }) {
    const tabs = [
        { label: 'Overview', href: '/admin/loyalty', icon: <LayoutDashboard size={18} /> },
        { label: 'Businesses', href: '/admin/loyalty/businesses', icon: <Building2 size={18} /> },
        { label: 'Templates', href: '/admin/loyalty/templates', icon: <LayoutTemplate size={18} /> },
        { label: 'Monitoring', href: '/admin/loyalty/monitoring', icon: <ShieldAlert size={18} /> },
    ];

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Loyalty Console</h1>
                <p className="text-gray-500">Monitor global loyalty trends and manage network-wide templates.</p>
            </div>
            
            <LoyaltyTabs tabs={tabs} />
            
            <div className="mt-2">
                {children}
            </div>
        </div>
    );
}
