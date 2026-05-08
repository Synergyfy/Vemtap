'use client';

import React from 'react';
import Link from 'next/link';
import { 
    User, Shield, CreditCard, Store, Users
} from 'lucide-react';
import { useActiveBranch } from '@/hooks/useActiveBranch';

export default function SettingsMobileHub() {
    const { getLinkWithBranch } = useActiveBranch();

    const settingsActions = [
        { label: 'Profile', href: '/dashboard/settings/profile', icon: User, color: 'bg-emerald-50 text-emerald-600', description: 'Personal info' },
        { label: 'Business Locations', href: '/dashboard/settings/branches', icon: Store, color: 'bg-blue-50 text-blue-600', description: 'Manage branches' },
        { label: 'Team', href: '/dashboard/staff', icon: Users, color: 'bg-amber-50 text-amber-600', description: 'Staff & permissions' },
        { label: 'Subscription', href: '/dashboard/settings/subscription', icon: CreditCard, color: 'bg-indigo-50 text-indigo-600', description: 'Plans & billing' },
        { label: 'Legal & Compliance', href: '/dashboard/compliance', icon: Shield, color: 'bg-slate-50 text-slate-600', description: 'Data & privacy' },
    ];

    return (
        <div className="lg:hidden w-full px-4 pb-12 space-y-4">
            <div className="flex flex-col gap-4">
                {settingsActions.map((action) => {
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
