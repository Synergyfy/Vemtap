'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Package, CreditCard, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useSudoStore } from '@/store/useSudoStore';
import { canAccessMenuItem } from '@/lib/utils/nav-filter';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { PageGuideButton, AICopilotButton } from '@/components/ai';

const COMMERCE_CARDS = [
    {
        id: 'pos',
        title: 'Point of Sale (POS)',
        description: 'Process sales, handle orders, and print receipts.',
        icon: CreditCard,
        href: '/dashboard/pos',
        roles: ['owner', 'manager', 'cashier', 'staff'],
        permission: 'pos',
        color: 'text-violet-500',
        bgColor: 'bg-violet-50'
    },
    {
        id: 'catalogue',
        title: 'Catalogue',
        description: 'Manage products, services, offers, and categories.',
        icon: ShoppingBag,
        href: '/dashboard/catalogue',
        roles: ['owner', 'manager', 'inventory'],
        permission: 'catalogue',
        color: 'text-blue-500',
        bgColor: 'bg-blue-50'
    },
    {
        id: 'inventory',
        title: 'Inventory',
        description: 'Track stock levels, adjustments, and reorder alerts.',
        icon: Package,
        href: '/dashboard/inventory',
        roles: ['owner', 'manager', 'inventory'],
        permission: 'inventory',
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-50'
    }
];

export default function CommerceLandingPage() {
    const user = useAuthStore((state) => state.user);
    const { activeSession } = useSudoStore();
    const { getLinkWithBranch } = useActiveBranch();
    const isAdminMode = activeSession !== null;

    const userPermissions = user?.permissions || [];
    const isOwnerOrAdmin = ['owner', 'admin'].includes((user?.role as string)?.toLowerCase());
    const realUserRole = (user?.role as string)?.toLowerCase() || 'owner';

    const visibleCards = COMMERCE_CARDS.filter(card => {
        if (isAdminMode) {
            return !card.roles || card.roles.includes('owner');
        }
        return canAccessMenuItem(card, realUserRole, userPermissions, isOwnerOrAdmin);
    });

    return (
        <div className="w-full px-4 md:px-8 py-8 space-y-8 pb-24">
            <div className="space-y-2">
                <div className="flex items-center gap-2"><h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Commerce</h1><PageGuideButton /><AICopilotButton /></div>
                <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-2xl">
                    Manage your core business operations. Select a module below to get started.
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
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                            {card.title}
                        </h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tight leading-relaxed mb-6 flex-1">
                            {card.description}
                        </p>
                        
                        <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-gray-300 group-hover:text-gray-900 transition-colors mt-auto">
                            Open Module <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                ))}

                {visibleCards.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-sm font-bold text-gray-900">No Access</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tight mt-1">
                            You don&apos;t have permission to view any commerce modules.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
