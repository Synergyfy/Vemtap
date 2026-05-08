import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, ShoppingBag, MessageCircle, MessageSquare } from 'lucide-react';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useSudoStore } from '@/store/useSudoStore';

export default function DashboardMobileNav() {
    const pathname = usePathname();
    const { getLinkWithBranch } = useActiveBranch();
    const { activeSession } = useSudoStore();
    const isAdminMode = activeSession !== null;

    const navItems = [
        {
            label: 'Home',
            icon: Home,
            href: '/dashboard'
        },
        {
            label: 'Visitor',
            icon: Users,
            href: '/dashboard/visitors'
        },
        {
            label: 'Catalogue',
            icon: ShoppingBag,
            href: '/dashboard/catalogue'
        },
        {
            label: 'Chat',
            icon: MessageCircle,
            href: '/dashboard/messaging/chat'
        },
        {
            label: 'Channels',
            icon: MessageSquare,
            href: '/dashboard/messaging'
        }
    ];

    return (
        <div
            className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.06)]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex justify-around items-center h-20 px-2">
                {navItems.map((item) => {
                    const isActive = item.label === 'Home' 
                        ? pathname === '/dashboard' || pathname === '/dashboard/'
                        : pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={getLinkWithBranch(item.href)}
                            className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
                                isActive ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            <div className={`relative p-2 rounded-2xl transition-all duration-300 ${
                                isActive 
                                    ? item.label === 'Home' 
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-110' 
                                        : 'bg-emerald-50 text-emerald-600 scale-110'
                                    : 'bg-transparent'
                            }`}>
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                
                                {isActive && item.label !== 'Home' && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white"></div>
                                )}
                            </div>
                            <span className={`text-[10px] mt-1.5 font-bold tracking-tight transition-all ${
                                isActive ? 'text-emerald-600 opacity-100' : 'text-gray-400 opacity-80'
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
