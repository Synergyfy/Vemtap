'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Store, Users, Nfc, ClipboardList } from 'lucide-react';

export default function AdminMobileNav() {
    const pathname = usePathname();

    const navItems = [
        {
            label: 'Dashboard',
            icon: Home,
            href: '/admin/dashboard'
        },
        {
            label: 'Businesses',
            icon: Store,
            href: '/admin/businesses'
        },
        {
            label: 'Customers',
            icon: Users,
            href: '/admin/users/customers'
        },
        {
            label: 'Devices',
            icon: Nfc,
            href: '/admin/devices'
        },
        {
            label: 'Profiling',
            icon: ClipboardList,
            href: '/admin/business-profiling'
        }
    ];

    return (
        <div
            className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.06)]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex justify-around items-center h-20 px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
                                isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            <div className={`relative p-2.5 rounded-2xl transition-all duration-300 ${
                                isActive 
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' 
                                    : 'bg-transparent'
                            }`}>
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={`text-[11px] mt-1.5 font-semibold tracking-tight transition-all ${
                                isActive ? 'text-primary opacity-100' : 'text-gray-400 opacity-80'
                            }`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
