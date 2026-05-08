'use client';

import React from 'react';
import Link from 'next/link';
import { 
    ShoppingBag, Package, Tag, LayoutGrid, ClipboardList, Clock
} from 'lucide-react';
import { useActiveBranch } from '@/hooks/useActiveBranch';

export default function CatalogueMobileHub() {
    const { getLinkWithBranch } = useActiveBranch();

    const catalogueActions = [
        { label: 'Overview', href: '/dashboard/catalogue', icon: ShoppingBag, color: 'bg-emerald-50 text-emerald-600', description: 'Business snapshot' },
        { label: 'Products', href: '/dashboard/catalogue/products', icon: Package, color: 'bg-blue-50 text-blue-600', description: 'Manage items' },
        { label: 'Offers', href: '/dashboard/catalogue/offers', icon: Tag, color: 'bg-amber-50 text-amber-600', description: 'Promotions' },
        { label: 'Categories', href: '/dashboard/catalogue/categories', icon: LayoutGrid, color: 'bg-indigo-50 text-indigo-600', description: 'Organize stock' },
        { label: 'Orders', href: '/dashboard/catalogue/orders', icon: ClipboardList, color: 'bg-rose-50 text-rose-600', description: 'Sales history' },
        { label: 'Bookings', href: '/dashboard/catalogue/bookings', icon: Clock, color: 'bg-cyan-50 text-cyan-600', description: 'Appointments' },
    ];

    return (
        <div className="lg:hidden w-full px-4 pb-12 space-y-4">
            <div className="flex flex-col gap-4">
                {catalogueActions.map((action) => {
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
