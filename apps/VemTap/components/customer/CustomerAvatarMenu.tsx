'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useUrlPersistence } from '@/hooks/useUrlPersistence';
import {
    User, Settings, Search, Gift, History, Bell, LifeBuoy, LogOut,
    ChevronRight, UserCircle2
} from 'lucide-react';

export default function CustomerAvatarMenu() {
    const router = useRouter();
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const { getPersistedLink } = useUrlPersistence();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const displayName = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Customer';
    const email = user?.email || 'customer@vemtap.com';

    const menuItems = [
        { id: 'profile', label: 'Profile & Settings', icon: Settings, href: '/customer/settings' },
        { id: 'deals', label: 'Deals', icon: Search, href: '/customer/discover' },
        { id: 'rewards', label: 'Rewards', icon: Gift, href: '/customer/rewards' },
        { id: 'history', label: 'History', icon: History, href: '/customer/history' },
        { id: 'notifications', label: 'Notifications', icon: Bell, href: '/customer/notifications' },
        { id: 'support', label: 'Support & Help', icon: LifeBuoy, href: '/customer/support' },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        setIsOpen(false);
        await logout();
        router.push('/login');
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 hover:bg-gray-100 transition-all active:scale-95 relative shrink-0"
                aria-label="Account menu"
            >
                {user?.avatar ? (
                    <img src={user.avatar} alt={displayName} className="w-full h-full rounded-full object-cover" />
                ) : (
                    <div className="w-full h-full rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <User size={18} className="text-text-secondary" />
                    </div>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 bg-gray-50/70 flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt={displayName} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <UserCircle2 size={22} className="text-text-secondary" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-text-main truncate">{displayName}</p>
                                <p className="text-[11px] text-text-secondary font-medium truncate">{email}</p>
                            </div>
                        </div>

                        {/* Links */}
                        <div className="py-2">
                            {menuItems.map((item) => {
                                const IconComp = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.id}
                                        href={getPersistedLink(item.href)}
                                        className={`flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold transition-colors ${isActive
                                            ? 'bg-primary/5 text-primary'
                                            : 'text-text-secondary hover:bg-gray-50 hover:text-text-main'
                                            }`}
                                    >
                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                                            <IconComp size={15} />
                                        </span>
                                        <span className="flex-1">{item.label}</span>
                                        <ChevronRight size={14} className="text-gray-300" />
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-100 p-2">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold text-red-600 hover:bg-red-50 transition-colors rounded-xl"
                            >
                                <span className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                                    <LogOut size={15} />
                                </span>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
