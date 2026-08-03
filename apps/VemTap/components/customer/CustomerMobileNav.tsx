'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, MessageSquare, ShoppingBag, MoreHorizontal } from 'lucide-react';

interface Tab {
    label: string;
    icon: typeof Home;
    href: string;
    activePaths: string[];
}

const TABS: Tab[] = [
    {
        label: 'Home',
        icon: Home,
        href: '/customer/dashboard',
        activePaths: ['/customer/dashboard'],
    },
    {
        label: 'Deals',
        icon: Search,
        href: '/customer/discover',
        activePaths: ['/customer/discover'],
    },
    {
        label: 'Chat',
        icon: MessageSquare,
        href: '/customer/messaging/chat',
        activePaths: ['/customer/messaging', '/customer/messaging/chat'],
    },
    {
        label: 'Orders',
        icon: ShoppingBag,
        href: '/customer/dashboard/orders',
        activePaths: ['/customer/dashboard/orders'],
    },
    {
        label: 'More',
        icon: MoreHorizontal,
        href: '/customer/more',
        activePaths: ['/customer/more', '/customer/settings', '/customer/history', '/customer/analytics', '/customer/notifications', '/customer/support', '/customer/messaging/chat'],
    },
];

export default function CustomerMobileNav() {
    const pathname = usePathname();

    const isTabActive = (tab: Tab) => {
        if (tab.href === '/customer/dashboard') {
            return pathname === '/customer/dashboard' || pathname === '/customer';
        }
        return tab.activePaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    };

    return (
        <div
            className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.06)]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex items-center h-20 px-2">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = isTabActive(tab);

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative ${
                                isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            <div
                                className={`relative p-2.5 rounded-2xl transition-all duration-300 ${
                                    isActive
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110'
                                        : 'bg-transparent'
                                }`}
                            >
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span
                                className={`text-[11px] mt-1.5 font-semibold tracking-tight transition-all ${
                                    isActive ? 'text-primary opacity-100' : 'text-gray-400 opacity-80'
                                }`}
                            >
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
