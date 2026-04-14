'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, MessageCircle, ShoppingBag, QrCode } from 'lucide-react';
import { useActiveBranch } from '@/hooks/useActiveBranch';

import { useSudoStore } from '@/store/useSudoStore';

export default function DashboardMobileNav() {
    const pathname = usePathname();
    const { getLinkWithBranch } = useActiveBranch();
    const { activeSession } = useSudoStore();
    const isAdminMode = activeSession !== null;

    const navItems = [
        {
            label: 'Visitors',
            icon: Users,
            href: '/dashboard/visitors/all'
        },
        {
            label: 'Chat',
            icon: MessageCircle,
            href: '/dashboard/messaging/chat'
        },
        {
            label: 'Catalogue',
            icon: ShoppingBag,
            href: '/dashboard/catalogue'
        },
        {
            label: 'QR',
            icon: QrCode,
            href: '/dashboard/business-link'
        }
    ];

    return (
        <div
            className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const isActive = item.href === '/dashboard/visitors/all'
                        ? pathname.startsWith('/dashboard/visitors')
                        : pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={getLinkWithBranch(item.href)}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative ${isActive ? 'text-primary' : 'text-text-secondary hover:text-text-main'
                                }`}
                        >
                            {/* Active indicator bar at top */}
                            {isActive && (
                                <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-full shadow-[0_2px_8px_rgba(var(--primary-rgb),0.5)]"></div>
                            )}

                            <div className={`relative p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary/10 mt-1' : 'mt-1'}`}>
                                <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
                            </div>
                            <span className={`text-[10px] font-black tracking-wide ${isActive ? 'text-primary' : 'font-semibold'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
