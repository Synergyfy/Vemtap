'use client';

import React from 'react';
import Link from 'next/link';
import { 
    Gift, Users, Ticket, Settings
} from 'lucide-react';
import { useActiveBranch } from '@/hooks/useActiveBranch';

export default function LoyaltyMobileHub() {
    const { getLinkWithBranch } = useActiveBranch();

    const loyaltyActions = [
        { label: 'Overview', href: '/dashboard/loyalty', icon: Gift, color: 'bg-emerald-50 text-emerald-600', description: 'Program health' },
        { label: 'Customers', href: '/dashboard/loyalty/customers', icon: Users, color: 'bg-blue-50 text-blue-600', description: 'Member list' },
        { label: 'Rewards', href: '/dashboard/loyalty/rewards', icon: Gift, color: 'bg-amber-50 text-amber-600', description: 'Manage benefits' },
        { label: 'Redeem Reward', href: '/dashboard/loyalty/redeem', icon: Ticket, color: 'bg-indigo-50 text-indigo-600', description: 'Process vouchers' },
        { label: 'Settings', href: '/dashboard/loyalty/settings', icon: Settings, color: 'bg-slate-50 text-slate-600', description: 'Rule configuration' },
    ];

    return (
        <div className="lg:hidden w-full px-4 pb-12 space-y-4">
            <div className="flex flex-col gap-4">
                {loyaltyActions.map((action) => {
                    const ActionIcon = action.icon;
                    return (
                        <Link 
                            key={action.href}
                            href={getLinkWithBranch(action.href)}
                            className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 active:scale-95 transition-all"
                        >
                            <div className={`p-4 ${action.color} rounded-2xl`}>
                                <ActionIcon size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-900">{action.label}</h3>
                                <p className="text-xs text-gray-500 font-medium">{action.description}</p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
