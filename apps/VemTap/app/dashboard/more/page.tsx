'use client';

import React from 'react';
import Link from 'next/link';
import { BarChart3, QrCode, Settings, ChevronRight, Users2, ShieldCheck, User } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useSudoStore } from '@/store/useSudoStore';
import { canAccessMenuItem } from '@/lib/utils/nav-filter';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { PageGuideButton, AICopilotButton } from '@/components/ai';

const MORE_CARDS = [
    {
        id: 'analytics',
        title: 'Advanced Analytics',
        description: 'View detailed insights, reports, and business metrics.',
        icon: BarChart3,
        href: '/dashboard/analytics',
        roles: ['owner', 'manager'],
        permission: 'analytics',
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-50'
    },
    {
        id: 'qrthrive',
        title: 'Explore QRThrive',
        description: 'Manage specialized QR experiences and integrations.',
        icon: QrCode,
        href: '/dashboard/explore-qrthrive',
        roles: ['owner', 'manager', 'marketing', 'staff'],
        permission: 'qrthrive',
        color: 'text-fuchsia-500',
        bgColor: 'bg-fuchsia-50'
    },
    {
        id: 'settings',
        title: 'Business Settings',
        description: 'Manage preferences, billing, and integrations.',
        icon: Settings,
        href: '/dashboard/settings',
        roles: ['owner', 'manager'],
        permission: 'settings',
        color: 'text-slate-600',
        bgColor: 'bg-slate-100'
    },
    {
        id: 'team',
        title: 'Staff & Roles',
        description: 'Manage your team members and their permissions.',
        icon: Users2,
        href: '/dashboard/staff',
        roles: ['owner', 'manager'],
        permission: 'settings',
        color: 'text-amber-500',
        bgColor: 'bg-amber-50'
    },
    {
        id: 'profile',
        title: 'My Profile',
        description: 'Manage your personal account details.',
        icon: User,
        href: '/dashboard/settings/profile',
        roles: ['owner', 'manager', 'cashier', 'inventory', 'marketing', 'customer_service', 'staff'],
        color: 'text-sky-500',
        bgColor: 'bg-sky-50'
    }
];

export default function MoreLandingPage() {
    const user = useAuthStore((state) => state.user);
    const { activeSession } = useSudoStore();
    const { getLinkWithBranch } = useActiveBranch();
    const isAdminMode = activeSession !== null;

    const userPermissions = user?.permissions || [];
    const isOwnerOrAdmin = ['owner', 'admin'].includes((user?.role as string)?.toLowerCase());
    const realUserRole = (user?.role as string)?.toLowerCase() || 'owner';

    const visibleCards = MORE_CARDS.filter(card => {
        if (isAdminMode) {
            return !card.roles || card.roles.includes('owner');
        }
        return canAccessMenuItem(card, realUserRole, userPermissions, isOwnerOrAdmin);
    });

    return (
        <div className="w-full px-4 md:px-8 py-8 space-y-8 pb-24">
            <div className="space-y-2">
                <div className="flex items-center gap-2"><h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">More</h1><PageGuideButton /><AICopilotButton /></div>
                <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-2xl">
                    Access analytics, QRThrive, and business settings.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {visibleCards.map((card) => (
                    <Link 
                        key={card.id} 
                        href={getLinkWithBranch(card.href)}
                        className="group flex flex-col bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className={`size-14 rounded-2xl ${card.bgColor} ${card.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                            <card.icon size={28} />
                        </div>
                        
                        <h3 className="text-lg font-black text-gray-900 mb-2 leading-tight">
                            {card.title}
                        </h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tight leading-relaxed mb-6 flex-1">
                            {card.description}
                        </p>
                        
                        <div className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 group-hover:text-gray-900 transition-colors mt-auto">
                            Open Module <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
