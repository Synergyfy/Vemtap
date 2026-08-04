'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/services/notifications/hooks';
import { Notification } from '@/services/notifications/types';
import {
    LayoutGrid, History, Gift, User, Nfc, Bell,
    LogOut, Menu, Star, BarChart3, LifeBuoy, X, MessageSquare, Search, ShoppingBag, ShoppingCart, Download
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { useQueryClient } from '@tanstack/react-query';
import { useUrlPersistence } from '@/hooks/useUrlPersistence';
import { useCartStore } from '@/store/useCartStore';
import toast from 'react-hot-toast';
import InstallAppModal from '@/components/dashboard/InstallAppModal';

interface CustomerSidebarProps {
    children: React.ReactNode;
}

export default function CustomerSidebar({ children }: CustomerSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
    const [showInstallModal, setShowInstallModal] = useState(false);
    const { getPersistedLink } = useUrlPersistence();
    const [showNotifications, setShowNotifications] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const queryClient = useQueryClient();
    const { carts } = useCartStore();

    const cartItemCount = useMemo(() => {
        return Object.values(carts).reduce((acc, cart) => {
            return acc + cart.items.reduce((sum, item) => sum + item.quantity, 0);
        }, 0);
    }, [carts]);

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

    // Close mobile sidebar on navigation
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const { data: notifications = [] } = useNotifications();
    const unreadCount = notifications.filter((n: Notification) => !n.read).length;

    const readNotificationMutation = useMarkAsRead();
    const readAllMutation = useMarkAllAsRead();

    const handleLogout = () => {
        setIsMobileMenuOpen(false);
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
            id: 'analytics',
            label: 'Analytics',
            icon: BarChart3,
            href: '/customer/analytics',
        },
        {
            id: 'history',
            label: 'Visit History',
            icon: History,
            href: '/customer/history',
        },
        {
            id: 'rewards',
            label: 'Loyalty Rewards',
            icon: Gift,
            href: '/customer/loyalty',
        },
        {
            id: 'discover',
            label: 'Discover Businesses',
            icon: Search,
            href: '/customer/discover',
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

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`w-64 bg-white border-r border-gray-200 flex-col ${isMobileMenuOpen ? 'fixed inset-y-0 left-0 z-50 flex shadow-2xl' : 'hidden lg:flex'}`}>
                {/* Logo */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100">
                    <Link href="/customer/dashboard" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                        <Logo />
                    </Link>
                    <button
                        className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <X size={20} />
                    </button>
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
                                    onClick={() => setIsMobileMenuOpen(false)}
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
                        <Link href={getPersistedLink("/customer/loyalty")} onClick={() => setIsMobileMenuOpen(false)} className="inline-block text-xs font-bold bg-white text-primary px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
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
                            <User className="text-gray-400" size={20} />
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

            {/* Mobile Header (Visible only on small screens) */}
            <div className="lg:hidden absolute top-0 left-0 w-full h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-10">
                <Link href="/customer/dashboard" className="flex items-center gap-2">
                    <Logo />
                </Link>
                <div className="flex items-center gap-2">
                    <Link
                        href="/customer/cart"
                        className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-text-secondary relative border border-gray-100 shadow-xs"
                    >
                        <ShoppingCart size={20} />
                        {cartItemCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full px-1 border-2 border-white">
                                {cartItemCount > 9 ? '9+' : cartItemCount}
                            </span>
                        )}
                    </Link>
                    <Link
                        href="/customer/settings"
                        className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shadow-xs"
                    >
                        {user?.avatar ? (
                            <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <User size={20} className="text-text-secondary" />
                        )}
                    </Link>
                    <button
                        className="p-2 text-text-main"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden h-full pt-16 lg:pt-0">
                {/* Top Bar (Desktop) */}
                <header className="hidden lg:flex h-20 bg-white border-b border-gray-200 items-center justify-between px-8">
                    <div>
                        <h2 className="font-display font-bold text-xl text-text-main">Welcome back, {user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Customer'}! 👋</h2>
                        <p className="text-xs text-text-secondary font-medium">Here's what's happening with your rewards.</p>
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

                        {/* Profile Button */}
                        <Link
                            href="/customer/settings"
                            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 hover:bg-gray-100 transition-colors shadow-xs"
                        >
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <User size={20} className="text-text-secondary" />
                            )}
                        </Link>

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
                                <div className="absolute right-0 top-14 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                        <h3 className="font-bold text-text-main text-sm">Notifications</h3>
                                        <button
                                            onClick={() => readAllMutation.mutate()}
                                            className="text-xs text-primary font-bold hover:underline"
                                        >
                                            Mark all read
                                        </button>
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
                                            className="text-xs font-bold text-primary hover:text-primary-hover"
                                            onClick={(e) => { e.stopPropagation(); setShowNotifications(false); }}
                                        >
                                            View All Notifications
                                        </Link>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </header>

                <main className={`flex-1 overflow-y-auto bg-gray-50 ${pathname?.includes('/messaging/chat') ? '' : 'p-4'} lg:p-8`}>
                    {children}
                </main>
            </div>

            <InstallAppModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} onInstall={handleInstallApp} />
        </div>
    );
}
