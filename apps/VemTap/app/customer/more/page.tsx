'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    LayoutGrid, Search, Gift, ShoppingBag, ShoppingCart, History,
    BarChart3, MessageSquare, Bell, User, LifeBuoy, LogOut, Download,
    ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useUrlPersistence } from '@/hooks/useUrlPersistence';
import toast from 'react-hot-toast';
import InstallAppModal from '@/components/dashboard/InstallAppModal';

interface BeforeInstallPromptEventLike extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function CustomerMorePage() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const { carts } = useCartStore();
    const { getPersistedLink } = useUrlPersistence();
    const [showInstallModal, setShowInstallModal] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEventLike | null>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEventLike);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const cartItemCount = useMemo(() => {
        return Object.values(carts).reduce((acc, cart) => {
            return acc + cart.items.reduce((sum, item) => sum + item.quantity, 0);
        }, 0);
    }, [carts]);

    const handleInstallApp = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const result = await deferredPrompt.userChoice;
            if (result.outcome === 'accepted') {
                toast.success('App installed successfully!');
                setShowInstallModal(false);
            } else {
                toast('App installation cancelled', { icon: '📱' });
            }
            setDeferredPrompt(null);
        } else {
            toast('Open your browser menu and tap "Install App" or "Add to Home Screen"', {
                icon: '📱',
                duration: 4000,
            });
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const items: Array<{
        id: string;
        label: string;
        desc: string;
        icon: typeof LayoutGrid;
        color: string;
        href: string;
        badge?: number;
    }> = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            desc: 'Your rewards overview',
            icon: LayoutGrid,
            color: 'bg-blue-50 text-blue-600',
            href: '/customer/dashboard',
        },
        {
            id: 'discover',
            label: 'Deals',
            desc: 'Deals & offers near you',
            icon: Search,
            color: 'bg-purple-50 text-purple-600',
            href: '/customer/discover',
        },
        {
            id: 'rewards',
            label: 'Rewards Vault',
            desc: 'Browse all rewards',
            icon: Gift,
            color: 'bg-amber-50 text-amber-600',
            href: '/customer/rewards',
        },
        {
            id: 'orders',
            label: 'Orders & Bookings',
            desc: 'Track purchases & reservations',
            icon: ShoppingBag,
            color: 'bg-emerald-50 text-emerald-600',
            href: '/customer/dashboard/orders',
        },
        {
            id: 'cart',
            label: 'Shopping Cart',
            desc: 'View items ready to checkout',
            icon: ShoppingCart,
            color: 'bg-orange-50 text-orange-600',
            href: '/customer/cart',
            badge: cartItemCount,
        },
        {
            id: 'history',
            label: 'Check-in Ledger',
            desc: 'Your visit & points history',
            icon: History,
            color: 'bg-sky-50 text-sky-600',
            href: '/customer/history',
        },
        {
            id: 'analytics',
            label: 'Analytics',
            desc: 'Breakdown of your activity',
            icon: BarChart3,
            color: 'bg-indigo-50 text-indigo-600',
            href: '/customer/analytics',
        },
        {
            id: 'messages',
            label: 'Messages',
            desc: 'Chat with businesses',
            icon: MessageSquare,
            color: 'bg-cyan-50 text-cyan-600',
            href: '/customer/messaging/chat',
        },
        {
            id: 'notifications',
            label: 'Notifications',
            desc: 'Alerts & activity updates',
            icon: Bell,
            color: 'bg-rose-50 text-rose-600',
            href: '/customer/notifications',
        },
        {
            id: 'profile',
            label: 'Profile & Settings',
            desc: 'Manage your account',
            icon: User,
            color: 'bg-slate-100 text-slate-700',
            href: '/customer/settings',
        },
        {
            id: 'support',
            label: 'Support & Help',
            desc: 'FAQs & live support',
            icon: LifeBuoy,
            color: 'bg-teal-50 text-teal-600',
            href: '/customer/support',
        },
    ];

    return (
        <div className="max-w-2xl mx-auto space-y-4 md:space-y-6 pb-24 p-4">
            <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <LayoutGrid size={20} />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-text-main tracking-tight">More</h1>
                    <p className="text-xs md:text-sm text-text-secondary font-medium">Explore everything VemTap has for you.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                {items.map((item) => {
                    const IconComp = item.icon;
                    return (
                        <Link
                            key={item.id}
                            href={getPersistedLink(item.href)}
                            className="bg-white border border-gray-100 rounded-2xl px-3.5 py-3 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group active:scale-[0.98]"
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                                <IconComp size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-text-main truncate">{item.label}</p>
                                <p className="text-[11px] text-text-secondary font-medium truncate">{item.desc}</p>
                            </div>
                            {!!item.badge && item.badge > 0 && (
                                <span className="min-w-[20px] h-5 px-1.5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                                    {item.badge > 9 ? '9+' : item.badge}
                                </span>
                            )}
                            <ChevronRight size={16} className="text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                        </Link>
                    );
                })}
            </div>

            {/* Account actions */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <button
                    onClick={() => setShowInstallModal(true)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-text-secondary hover:bg-gray-50 transition-all active:scale-[0.99]"
                >
                    <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                        <Download size={16} />
                    </div>
                    Download App
                </button>
                <div className="border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-all active:scale-[0.99]"
                    >
                        <div className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                            <LogOut size={16} />
                        </div>
                        Sign Out
                    </button>
                </div>
            </div>

            <p className="text-center text-[11px] text-gray-400 font-medium pt-2">
                Signed in as {user?.email || 'customer@vemtap.com'}
            </p>

            <InstallAppModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} onInstall={handleInstallApp} />
        </div>
    );
}
