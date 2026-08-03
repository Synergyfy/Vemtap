'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/services/notifications/hooks';
import { Notification } from '@/services/notifications/types';
import {
    LayoutGrid, History, Gift, User, Bell,
    LogOut, Star, BarChart3, LifeBuoy, X, MessageSquare, Search, ShoppingBag, ShoppingCart, Download, ChevronRight
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { useUrlPersistence } from '@/hooks/useUrlPersistence';
import { useCartStore } from '@/store/useCartStore';
import toast from 'react-hot-toast';
import InstallAppModal from '@/components/dashboard/InstallAppModal';
import CustomerMobileNav from './CustomerMobileNav';
import CustomerAvatarMenu from './CustomerAvatarMenu';

interface CustomerSidebarProps {
    children: React.ReactNode;
}

const PAGE_TITLES: Record<string, string> = {
    '/customer/dashboard': 'Dashboard',
    '/customer/dashboard/orders': 'Orders & Bookings',
    '/customer/analytics': 'Analytics',
    '/customer/cart': 'Shopping Cart',
    '/customer/checkout': 'Checkout',
    '/customer/discover': 'Deals',
    '/customer/history': 'Visit History',
    '/customer/loyalty': 'My Rewards',
    '/customer/loyalty/history': 'Rewards History',
    '/customer/messaging/chat': 'Messages',
    '/customer/more': 'More',
    '/customer/notifications': 'Notifications',
    '/customer/rewards': 'Rewards Vault',
    '/customer/settings': 'Profile & Settings',
    '/customer/support': 'Support & Help',
};

export default function CustomerSidebar({ children }: CustomerSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const [showInstallModal, setShowInstallModal] = useState(false);
    const { getPersistedLink } = useUrlPersistence();
    const [showNotifications, setShowNotifications] = useState(false);
    const { carts } = useCartStore();

    const cartItemCount = useMemo(() => {
        return Object.values(carts).reduce((acc, cart) => {
            return acc + cart.items.reduce((sum, item) => sum + item.quantity, 0);
        }, 0);
    }, [carts]);

    const pageTitle = useMemo(() => {
        return PAGE_TITLES[pathname] || 'Dashboard';
    }, [pathname]);

    const isHiddenNavRoute = pathname === '/customer/cart' || pathname === '/customer/checkout' || pathname.startsWith('/customer/checkout/') || pathname.startsWith('/customer/messaging');

    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleDownloadApp = () => {
        setShowInstallModal(true);
    };

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

    // Close notifications on navigation
    useEffect(() => {
        setShowNotifications(false);
    }, [pathname]);

    const { data: notifications = [] } = useNotifications();
    const unreadCount = notifications.filter((n: Notification) => !n.read).length;

    const readNotificationMutation = useMarkAsRead();
    const readAllMutation = useMarkAllAsRead();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const menuItems: Array<{
        id: string;
        label: string;
        icon: typeof LayoutGrid;
        href: string;
        external?: boolean;
    }> = [
        {
            id: 'overview',
            label: 'Dashboard',
            icon: LayoutGrid,
            href: '/customer/dashboard',
        },
        {
            id: 'discover',
            label: 'Deals',
            icon: Search,
            href: '/customer/discover',
        },
        {
            id: 'rewards',
            label: 'Loyalty Rewards',
            icon: Gift,
            href: '/customer/loyalty',
        },
        {
            id: 'cart',
            label: 'Shopping Cart',
            icon: ShoppingCart,
            href: '/customer/cart',
        },
        {
            id: 'orders',
            label: 'Orders & Bookings',
            icon: ShoppingBag,
            href: '/customer/dashboard/orders',
        },
        {
            id: 'history',
            label: 'Visit History',
            icon: History,
            href: '/customer/history',
        },
        {
            id: 'analytics',
            label: 'Analytics',
            icon: BarChart3,
            href: '/customer/analytics',
        },
        {
            id: 'messages',
            label: 'Messages',
            icon: MessageSquare,
            href: '/customer/messaging/chat',
        },
        {
            id: 'support',
            label: 'Support & Help',
            icon: LifeBuoy,
            href: '/customer/support',
        },
        {
            id: 'profile',
            label: 'Profile & Settings',
            icon: User,
            href: '/customer/settings',
        },
    ];

    const isActive = (href: string) => pathname === href;

    const renderNotificationsPanel = () => (
        <div className="absolute right-0 top-14 w-full sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                <h3 className="font-bold text-text-main text-sm">Notifications</h3>
                <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                        <button
                            onClick={() => readAllMutation.mutate()}
                            className="text-xs text-primary font-bold hover:underline"
                        >
                            Mark all read
                        </button>
                    )}
                    <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600 lg:hidden">
                        <X size={16} />
                    </button>
                </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-text-secondary text-sm">
                        No notifications yet
                    </div>
                ) : (
                    notifications.map((note: Notification) => (
                        <div
                            key={note.id}
                            onClick={() => !note.read && readNotificationMutation.mutate(note.id)}
                            className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!note.read ? 'bg-primary/5' : ''}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${!note.read ? 'bg-primary' : 'bg-transparent'}`}></div>
                                <div className="flex-1">
                                    <p className={`text-sm ${!note.read ? 'font-bold text-text-main' : 'text-text-secondary'}`}>
                                        {note.title}
                                    </p>
                                    <p className="text-xs text-text-secondary mt-0.5">{note.message}</p>
                                    <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                        {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="p-3 border-t border-gray-100 text-center">
                <Link
                    href={getPersistedLink("/customer/notifications")}
                    className="text-xs font-bold text-primary hover:text-primary-hover inline-flex items-center gap-1"
                    onClick={() => setShowNotifications(false)}
                >
                    View All Notifications
                    <ChevronRight size={12} />
                </Link>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">

            {/* Sidebar (desktop) */}
            <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col shrink-0">
                {/* Logo */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100">
                    <Link href="/customer/dashboard" className="flex items-center gap-2">
                        <Logo />
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-4">
                    <div className="space-y-1">
                        {menuItems.map((item) => {
                            const IconComponent = item.icon;
                            return (
                                <Link
                                    key={item.id}
                                    href={getPersistedLink(item.href)}
                                    target={item.external ? '_blank' : undefined}
                                    rel={item.external ? 'noopener noreferrer' : undefined}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${isActive(item.href)
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'text-text-secondary hover:bg-gray-50 hover:text-text-main'
                                        }`}
                                >
                                    <IconComponent size={20} />
                                    <span className="flex-1">{item.label}</span>
                                    {item.id === 'cart' && cartItemCount > 0 && (
                                        <span className="bg-primary-foreground/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                            {cartItemCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Promo Card */}
                    <div className="mt-8 bg-linear-to-br from-primary to-blue-600 rounded-lg p-4 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-10 -translate-y-10 blur-xl"></div>
                        <Star className="text-white mb-2 bg-white/20 p-2 rounded-lg backdrop-blur-sm" size={32} />
                        <h3 className="font-bold text-sm mb-1">Earn more points!</h3>
                        <p className="text-xs text-white/80 mb-3">Visit our partner stores to unlock exclusive rewards.</p>
                        <Link href={getPersistedLink("/customer/loyalty")} className="inline-block text-xs font-bold bg-white text-primary px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                            View Rewards
                        </Link>
                    </div>
                </nav>

                {/* Download App */}
                <div className="border-t border-gray-100 px-4 pt-4 pb-2">
                    <button
                        onClick={handleDownloadApp}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-text-secondary hover:bg-gray-50 hover:text-text-main transition-all"
                    >
                        <Download size={20} />
                        <span className="flex-1">Download App</span>
                    </button>
                </div>

                {/* User Profile */}
                <div className="border-t border-gray-100 p-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <User className="text-gray-400" size={20} />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-text-main truncate">{user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Customer'}</p>
                            <p className="text-xs text-text-secondary truncate">{user?.email || 'customer@vemtap.com'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full py-2.5 px-3 border border-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Column */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden shrink-0 sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-lg border-b border-gray-100 flex items-center justify-between px-4">
                    <Link href="/customer/dashboard" className="flex items-center gap-2 min-w-0">
                        <div className="shrink-0">
                            <Logo />
                        </div>
                        <span className="hidden sm:block text-sm font-bold text-gray-900 truncate max-w-[160px]">{pageTitle}</span>
                    </Link>
                    <div className="flex items-center gap-1.5">
                        {/* Notification Bell */}
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100 active:scale-95 transition-all"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full px-1 border-2 border-white">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Cart */}
                        <Link
                            href="/customer/cart"
                            className="relative w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100 active:scale-95 transition-all"
                        >
                            <ShoppingCart size={20} />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full px-1 border-2 border-white">
                                    {cartItemCount > 9 ? '9+' : cartItemCount}
                                </span>
                            )}
                        </Link>

                        {/* Avatar Menu */}
                        <CustomerAvatarMenu />
                    </div>

                    {/* Mobile Notifications Panel */}
                    {showNotifications && (
                        <>
                            <div
                                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                                onClick={() => setShowNotifications(false)}
                            />
                            {renderNotificationsPanel()}
                        </>
                    )}
                </header>

                {/* Desktop Header */}
                <header className="hidden lg:flex shrink-0 h-20 bg-white border-b border-gray-200 items-center justify-between px-8 relative">
                    <div>
                        <h2 className="font-display font-bold text-xl text-text-main">Welcome back, {user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Customer'}! 👋</h2>
                        <p className="text-xs text-text-secondary font-medium">{"Here's what's happening with your rewards."}</p>
                    </div>
                    <div className="flex items-center gap-4 relative">
                        {/* Cart Button */}
                        <Link
                            href="/customer/cart"
                            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-text-secondary hover:bg-gray-100 transition-colors relative border border-gray-100 shadow-xs"
                        >
                            <ShoppingCart size={20} />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full px-1 border-2 border-white">
                                    {cartItemCount > 9 ? '9+' : cartItemCount}
                                </span>
                            )}
                        </Link>

                        {/* Avatar Menu */}
                        <CustomerAvatarMenu />

                        {/* Notification Button */}
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-text-secondary hover:bg-gray-100 transition-colors relative"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full px-1 border-2 border-white">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowNotifications(false)}
                                ></div>
                                {renderNotificationsPanel()}
                            </>
                        )}
                    </div>
                </header>

                {/* Main Content */}
                <main className={`flex-1 overflow-y-auto bg-gray-50 ${pathname.startsWith('/customer/messaging') ? 'pb-0' : 'pb-28 lg:pb-8'}`}>
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            {!isHiddenNavRoute && <CustomerMobileNav />}

            <InstallAppModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} onInstall={handleInstallApp} />
        </div>
    );
}
