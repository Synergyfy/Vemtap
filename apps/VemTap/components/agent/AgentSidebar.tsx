'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Logo from '@/components/brand/Logo';
import { Home, MessageCircle, Ticket, Settings, LogOut, Menu, X } from 'lucide-react';

export default function AgentSidebar({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const menuItems = [
        { label: 'Overview', href: '/agent/dashboard', icon: Home },
        { label: 'Support', href: '/agent/support', icon: MessageCircle },
        { label: 'Tickets', href: '/agent/tickets', icon: Ticket },
        { label: 'Profile', href: '/agent/settings/profile', icon: Settings },
    ];

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden relative">
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-60 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside className={`
                fixed inset-y-0 left-0 z-70 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                    <Link href="/agent/dashboard" className="flex items-center gap-2">
                        <Logo />
                    </Link>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-3">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-primary/5 text-primary'
                                    : 'text-text-secondary hover:bg-gray-50 hover:text-text-main'
                                    }`}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-gray-200 p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {(user?.name || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-text-main truncate">{user?.name || 'Support Agent'}</p>
                            <p className="text-xs text-text-secondary truncate">{user?.email || 'agent@vemtap.com'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full py-2 px-3 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={() => setIsMobileOpen(true)}
                            className="p-2 text-text-secondary hover:bg-gray-50 rounded-lg lg:hidden"
                        >
                            <Menu size={24} />
                        </button>
                        <div>
                            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Agent Workspace</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-right">
                            <p className="text-sm font-bold text-text-main">{user?.name || 'Support Agent'}</p>
                            <p className="text-[10px] text-text-secondary">Online</p>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    );
}
