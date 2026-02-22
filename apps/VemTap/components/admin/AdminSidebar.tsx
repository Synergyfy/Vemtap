'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard';
import { Notification } from '@/lib/store/mockDashboardStore';
import {
    Home, Store, Users, Nfc, CreditCard, BarChart, MessageSquare, Activity,
    Settings, ChevronDown, Shield, LogOut, Gift, Search, Bell, HelpCircle, Package, FileText, Tag, Menu, X
} from 'lucide-react';
import Logo from '@/components/brand/Logo';

interface AdminSidebarProps {
    children: React.ReactNode;
    activePage?: string;
}

export default function AdminSidebar({ children, activePage }: AdminSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['businesses']);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data } = useQuery({
        queryKey: ['dashboard'],
        queryFn: dashboardApi.fetchDashboardData,
        refetchInterval: 5000,
    });

    const notifications = (data?.notifications || []).filter((n: Notification) => n.scope === 'ADMIN');
    const unreadCount = notifications.filter((n: Notification) => !n.read).length;

    const readNotificationMutation = useMutation({
        mutationFn: dashboardApi.markNotificationRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });

    const readAllMutation = useMutation({
        mutationFn: dashboardApi.markAllNotificationsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });

    const toggleMenu = (menu: string) => {
        setExpandedMenus(prev =>
            prev.includes(menu) ? prev.filter(m => m !== menu) : [...prev, menu]
        );
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const menuItems = [
        {
            id: 'overview',
            label: 'Dashboard',
            icon: Home,
            href: '/admin/dashboard',
        },
        {
            id: 'businesses',
            label: 'Businesses',
            icon: Store,
            submenu: [
                { label: 'All Businesses', href: '/admin/businesses' },
                { label: 'Pending Approval', href: '/admin/businesses/pending' },
                { label: 'Suspended', href: '/admin/businesses/suspended' },
            ]
        },
        {
            id: 'users',
            label: 'Users',
            icon: Users,
            href: '/admin/users',
        },
        {
            id: 'devices',
            label: 'Devices',
            icon: Nfc,
            submenu: [
                { label: 'All Devices', href: '/admin/devices' },
                { label: 'Active', href: '/admin/devices/active' },
                { label: 'Inactive', href: '/admin/devices/inactive' },
            ]
        },
        {
            id: 'subscriptions',
            label: 'Subscriptions',
            icon: CreditCard,
            href: '/admin/subscriptions',
        },
        {
            id: 'products',
            label: 'Products',
            icon: Package,
            submenu: [
                { label: 'All Products', href: '/admin/products' },
                { label: 'Add New Product', href: '/admin/products/create' },
            ]
        },
        {
            id: 'analytics',
            label: 'Platform Analytics',
            icon: BarChart,
            href: '/admin/analytics',
        },
        {
            id: 'loyalty',
            label: 'Loyalty Control',
            icon: Gift,
            href: '/admin/loyalty',
        },
        {
            id: 'support',
            label: 'Support Tickets',
            icon: MessageSquare,
            href: '/admin/support',
        },
        {
            id: 'quotes',
            label: 'Quote Requests',
            icon: FileText,
            href: '/admin/quotes',
        },
        {
            id: 'messaging',
            label: 'WhatsApp Templates',
            icon: MessageSquare,
            href: '/admin/messaging',
        },
        {
            id: 'pricing',
            label: 'Pricing Plans',
            icon: Tag,
            href: '/admin/pricing',
        },
        {
            id: 'health',
            label: 'System Health',
            icon: Activity,
            href: '/admin/health',
        },
        {
            id: 'agents',
            label: 'Manage Agents',
            icon: Shield,
            href: '/admin/agents',
        },
        {
            id: 'agent-hub',
            label: 'Support Agent Hub',
            icon: HelpCircle,
            href: '/admin/support',
        },
        {
            id: 'settings',
            label: 'System Settings',
            icon: Settings,
            href: '/admin/settings',
        },
    ];

    const isActive = (href: string) => pathname === href;
    const isParentActive = (submenu?: { href: string }[]) =>
        submenu?.some(item => pathname === item.href);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden relative">
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-60 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar - Light theme matching business dashboard */}
            <aside className={`
                fixed inset-y-0 left-0 z-70 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo with Wordmark */}
                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                    <Link href="/admin/dashboard" className="flex items-center gap-2">
                        <Logo />
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-3">
                    {menuItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                            <div key={item.id} className="mb-1">
                                {item.submenu ? (
                                    <>
                                        <button
                                            onClick={() => toggleMenu(item.id)}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isParentActive(item.submenu)
                                                ? 'bg-primary/5 text-primary'
                                                : 'text-text-secondary hover:bg-gray-50 hover:text-text-main'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <IconComponent size={18} />
                                                <span>{item.label}</span>
                                            </div>
                                            <ChevronDown
                                                size={16}
                                                className={`transition-transform ${expandedMenus.includes(item.id) ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        {expandedMenus.includes(item.id) && (
                                            <div className="mt-1 ml-9 space-y-1">
                                                {item.submenu.map((subItem) => (
                                                    <Link
                                                        key={subItem.href}
                                                        href={subItem.href}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(subItem.href)
                                                            ? 'bg-primary text-white'
                                                            : 'text-text-secondary hover:bg-gray-50 hover:text-text-main'
                                                            }`}
                                                    >
                                                        {subItem.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        href={item.href!}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.href!)
                                            ? 'bg-primary/5 text-primary'
                                            : 'text-text-secondary hover:bg-gray-50 hover:text-text-main'
                                            }`}
                                    >
                                        <IconComponent size={18} />
                                        <span>{item.label}</span>
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Admin Profile */}
                <div className="border-t border-gray-200 p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Shield className="text-primary" size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-text-main truncate">{user?.name || 'Admin'}</p>
                            <p className="text-xs text-text-secondary truncate">System Administrator</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full py-2 px-3 bg-gray-50 text-text-secondary rounded-lg text-sm font-bold hover:bg-gray-100 hover:text-text-main transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden w-full">
                {/* Top Bar */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={() => setIsMobileOpen(true)}
                            className="p-2 text-text-secondary hover:bg-gray-50 rounded-lg lg:hidden"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="relative max-w-md w-full hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search businesses, users, devices..."
                                className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 relative">
                        {/* Notification Button */}
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 text-text-secondary hover:text-text-main hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full px-1">
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
                                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
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
                                            notifications.map((note: any) => (
                                                <div
                                                    key={note.id}
                                                    onClick={() => !note.read && readNotificationMutation.mutate(note.id)}
                                                    className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!note.read ? 'bg-blue-50/30' : ''}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!note.read ? 'bg-primary' : 'bg-transparent'}`}></div>
                                                        <div className="flex-1">
                                                            <p className={`text-sm ${!note.read ? 'font-bold text-text-main' : 'text-text-secondary'}`}>
                                                                {note.title}
                                                            </p>
                                                            <p className="text-xs text-text-secondary mt-1">{note.message}</p>
                                                            <p className="text-[10px] text-gray-400 mt-2">
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
                                            href="/admin/notifications"
                                            className="text-xs font-bold text-primary hover:text-primary-hover"
                                            onClick={() => setShowNotifications(false)}
                                        >
                                            View All Notifications
                                        </Link>
                                    </div>
                                </div>
                            </>
                        )}

                        <button className="p-2 text-text-secondary hover:text-text-main hover:bg-gray-50 rounded-lg transition-colors">
                            <HelpCircle size={20} />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    );
}
