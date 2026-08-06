'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminNotificationsApi } from '@/lib/api/admin';
import {
    Home, Store, Users, Nfc, CreditCard, BarChart, MessageSquare, Activity,
    Settings, ChevronDown, Shield, ShieldCheck, LogOut, Gift, Search, Bell, HelpCircle, Package, FileText, Tag, Menu, X, Workflow, Eye, Zap, ClipboardList, Headset, Megaphone
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import AdminMobileNav from './AdminMobileNav';
import { ADMIN_MENU_ITEMS } from '@/constants/adminNavigation';
import AdminSearch from '@/components/admin/AdminSearch';

interface AdminSidebarProps {
    children: React.ReactNode;
    activePage?: string;
}

export default function AdminSidebar({ children, activePage }: AdminSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: notifications = [] } = useQuery<any[]>({
        queryKey: ['admin-notifications'],
        queryFn: async () => {
            const response = await adminNotificationsApi.getAll();
            return (Array.isArray(response) ? response : response?.data || []) as any[];
        },
        refetchInterval: 10000,
    });

    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    const readNotificationMutation = useMutation({
        mutationFn: adminNotificationsApi.markRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
        }
    });

    const readAllMutation = useMutation({
        mutationFn: adminNotificationsApi.markAllRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
        }
    });

    const toggleMenu = (menu: string) => {
        setExpandedMenus(prev => (prev.includes(menu) ? [] : [menu]));
    };

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const filteredMenuItems = ADMIN_MENU_ITEMS.filter(item => {
        // Super Admin check (Role is Admin and no restrictions, or specific email/id)
        if (user?.role?.toLowerCase() === 'admin' && (!user.permissions || user.permissions.length === 0)) return true;
        if (user?.permissions?.includes('admin:all')) return true;

        // Check specific permission
        if (!item.permission) return true; // Default to show if no specific permission defined yet
        return user?.permissions?.includes(item.permission);
    });

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

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-70 w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo with Wordmark */}
                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                    <Link href="/admin/dashboard" className="flex items-center gap-2">
                        <Logo />
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-0.5">
                    {filteredMenuItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                            <div key={item.id}>
                                {item.submenu ? (
                                    <>
                                        <button
                                            onClick={() => toggleMenu(item.id)}
                                            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[15px] font-medium transition-all ${
                                                isParentActive(item.submenu) || expandedMenus.includes(item.id)
                                                    ? 'bg-primary/5 text-primary font-semibold'
                                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <IconComponent size={20} className="shrink-0" />
                                                <span className="truncate">{item.label}</span>
                                            </div>
                                            <ChevronDown
                                                size={16}
                                                className={`shrink-0 text-gray-400 transition-transform ${(expandedMenus.includes(item.id) || isParentActive(item.submenu)) ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        {(expandedMenus.includes(item.id) || isParentActive(item.submenu)) && (
                                            <div className="mt-1 ml-10 space-y-0.5">
                                                {item.submenu.map((subItem) => (
                                                    <Link
                                                        key={subItem.href}
                                                        href={subItem.href}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className={`block px-4 py-2.5 rounded-xl text-[15px] font-medium transition-all ${
                                                            isActive(subItem.href)
                                                                ? 'bg-primary/10 text-primary font-semibold border-l-[3px] border-primary'
                                                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
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
                                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-all ${
                                            isActive(item.href!)
                                                ? 'bg-primary/10 text-primary font-semibold border-l-[3px] border-primary'
                                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                    >
                                        <IconComponent size={20} />
                                        <span>{item.label}</span>
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Admin Profile */}
                <div className="border-t border-gray-100 p-4">
                    <div className="flex items-center gap-3 mb-3 px-1">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Shield className="text-primary" size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Admin'}</p>
                            <p className="text-xs text-gray-500 truncate">System Administrator</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full py-2.5 px-4 bg-gray-50 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-100 hover:text-gray-900 transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden w-full">
                {/* Top Bar */}
                <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 shrink-0">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={() => setIsMobileOpen(true)}
                            className="p-2.5 text-gray-500 hover:bg-gray-50 rounded-xl lg:hidden border border-gray-100"
                        >
                            <Menu size={22} />
                        </button>
                        <AdminSearch />
                    </div>
                    <div className="flex items-center gap-3 relative">
                        {/* Notification Button */}
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative size-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary transition-all"
                        >
                            <Bell size={18} />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 size-1.5 bg-red-500 rounded-full border border-white" />
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowNotifications(false)}
                                ></div>
                                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                        <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                                        <button
                                            onClick={() => readAllMutation.mutate()}
                                            className="text-xs text-primary font-semibold hover:underline"
                                        >
                                            Mark all read
                                        </button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-gray-500 text-sm">
                                                No notifications yet
                                            </div>
                                        ) : (
                                            notifications.map((note: any) => (
                                                <div
                                                    key={note.id}
                                                    onClick={() => !note.isRead && readNotificationMutation.mutate(note.id)}
                                                    className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!note.isRead ? 'bg-blue-50/30' : ''}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!note.isRead ? 'bg-primary' : 'bg-transparent'}`}></div>
                                                        <div className="flex-1">
                                                            <p className={`text-sm ${!note.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                                                {note.title}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">{note.message}</p>
                                                            <p className="text-[10px] text-gray-400 mt-2">
                                                                {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                                            className="text-xs font-semibold text-primary hover:underline"
                                            onClick={() => setShowNotifications(false)}
                                        >
                                            View All Notifications
                                        </Link>
                                    </div>
                                </div>
                            </>
                        )}

                        <button className="size-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary transition-all">
                            <HelpCircle size={18} />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-gray-50 pb-16 lg:pb-0">
                    {children}
                </main>
            </div>

            <AdminMobileNav />
        </div>
    );
}
