'use client';

import React from 'react';
import Link from 'next/link';
import { 
    Users, Globe, UserPlus, Repeat
} from 'lucide-react';
import { useActiveBranch } from '@/hooks/useActiveBranch';

export default function VisitorMobileHub() {
    const { getLinkWithBranch } = useActiveBranch();

    const visitorActions = [
        { label: 'Overview', href: '/dashboard/visitors', icon: Users, color: 'bg-emerald-50 text-emerald-600', description: 'Real-time stats' },
        { label: 'All Visitors', href: '/dashboard/visitors/all', icon: Globe, color: 'bg-blue-50 text-blue-600', description: 'Full history' },
        { label: 'New Visitors', href: '/dashboard/visitors/new', icon: UserPlus, color: 'bg-indigo-50 text-indigo-600', description: 'First-time taps' },
        { label: 'Returning', href: '/dashboard/visitors/returning', icon: Repeat, color: 'bg-amber-50 text-amber-600', description: 'Loyal customers' },
    ];

    return (
        <div className="lg:hidden w-full px-4 pb-12 space-y-4">
            <div className="flex flex-col gap-4">
                {visitorActions.map((action) => {
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
