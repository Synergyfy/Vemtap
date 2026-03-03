'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useBusinessStore } from '@/store/useBusinessStore';
import defaultLogo from '@/public/VEMTAP_PNG.png';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard';
import { Notification } from '@/lib/store/mockDashboardStore';
import {
    Home, Users, Nfc, Send, Gift, BarChart, Users2, Settings,
    ChevronDown, LogOut, Bell, Search, HelpCircle, Menu, X, Zap, MessageSquare, Smartphone, Building2, ShieldCheck
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import BranchSwitcher from './BranchSwitcher';
import { useMyBusiness } from '@/services/businesses/hooks';
import TrialBanner from './TrialBanner';

interface SidebarProps {
    children: React.ReactNode;
}

export default function DashboardSidebar({ children }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const { data: myBusiness } = useMyBusiness();

    // eslint-disable-next-line no-console
    console.log('[DASHBOARD SIDEBAR] 🔍 isAuthenticated:', isAuthenticated, 'path:', pathname);

    // Auto-expand the menu corresponding to the current path
    const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
        // Only expand based on current path logic initially
        const pathParts = pathname.split('/');
        if (pathParts.length > 2) {
            return [pathParts[2]];
        }
        return [];
    });
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const queryClient = useQueryClient();
    const { activeBranchId } = useBusinessStore();

    const { data } = useQuery({
        queryKey: ['dashboard', activeBranchId],
        queryFn: dashboardApi.fetchDashboardData,
        refetchInterval: 5000,
    });

    const notifications = (data?.notifications || []).filter((n: Notification) => n.scope === 'DASHBOARD');
    const redemptionRequests = data?.redemptionRequests || [];
    const unreadCount = notifications.filter((n: Notification) => !n.read).length;
    const pendingRedemptions = redemptionRequests.filter((r: any) => r.status === 'pending').length;

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

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    // Unified Expand Logic: Handle nested menus
    const toggleMenu = (menuId: string, parentId?: string) => {
        setExpandedMenus(prev => {
            const isExpanded = prev.includes(menuId);
            if (isExpanded) {
                // Remove this menu and its sub-menus (if any)
                return prev.filter(id => id !== menuId);
            } else {
                // If it's a top-level menu, we might want to close others (Accordion style)
                // If it's a nested menu, we just add it to the stack
                if (!parentId) {
                    return [menuId];
                }
                return [...prev, menuId];
            }
        });
    };

    const menuItems = [
        {
            id: 'overview',
            label: 'Dashboard',
            icon: Home,
            href: '/dashboard',
            roles: ['owner', 'manager', 'staff']
        },
        {
            id: 'visitors',
            label: 'Visitors',
            icon: Users,
            roles: ['owner', 'manager', 'staff'],
            submenu: [
                { label: 'Overview', href: '/dashboard/visitors' },
                { label: 'All Visitors', href: '/dashboard/visitors/all' },
                { label: 'New Visitors', href: '/dashboard/visitors/new' },
                { label: 'Returning', href: '/dashboard/visitors/returning' },
            ]
        },
        {
            id: 'devices',
            label: 'NFC Hub',
            icon: Nfc,
            roles: ['owner', 'manager', 'staff'],
            submenu: [
                { label: 'NFC Asset Hub', href: '/dashboard/nfc-manager' },
            ]
        },
        {
            id: 'messaging-center',
            label: 'Messaging Center',
            icon: MessageSquare,
            roles: ['owner', 'manager'],
            submenu: [
                { label: 'Overview', href: '/dashboard/messaging' },
                {
                    id: 'whatsapp',
                    label: 'WhatsApp Channel',
                    submenu: [
                        { label: 'Overview', href: '/dashboard/messaging/whatsapp' },
                        { label: 'Send Message', href: '/dashboard/messaging/whatsapp/send' },
                        { label: 'Templates', href: '/dashboard/messaging/whatsapp/templates' },
                        { label: 'Top up', href: '/dashboard/messaging/whatsapp/topup' },
                        { label: 'Settings', href: '/dashboard/messaging/whatsapp/settings' },
                        {
                            id: 'whatsapp-automations',
                            label: 'Automation',
                            submenu: [
                                { label: 'Overview', href: '/dashboard/automations' },
                                { label: 'Active Automations', href: '/dashboard/automations/active' },
                                { label: 'Automation Logs', href: '/dashboard/automations/logs' },
                                { label: 'Performance Overview', href: '/dashboard/automations/performance' },
                            ]
                        }
                    ]
                },
                {
                    id: 'sms',
                    label: 'SMS Channel',
                    submenu: [
                        { label: 'Overview', href: '/dashboard/messaging/sms' },
                        { label: 'Send Message', href: '/dashboard/messaging/sms/send' },
                        { label: 'Templates', href: '/dashboard/messaging/sms/templates' },
                        { label: 'Top up', href: '/dashboard/messaging/sms/topup' },
                        { label: 'Settings', href: '/dashboard/messaging/sms/settings' },
                    ]
                },
                {
                    id: 'email',
                    label: 'Email Channel',
                    submenu: [
                        { label: 'Overview', href: '/dashboard/messaging/email' },
                        { label: 'Send Message', href: '/dashboard/messaging/email/send' },
                        { label: 'Templates', href: '/dashboard/messaging/email/templates' },
                        { label: 'Settings', href: '/dashboard/messaging/email/settings' },
                    ]
                },
                { label: 'Message History', href: '/dashboard/messaging/history' },
            ].map(item => ({ ...item, onClick: () => setIsMobileOpen(false) }))
        },
        {
            id: 'surveys',
            label: 'Surveys',
            icon: MessageSquare,
            href: '/dashboard/surveys',
            roles: ['owner', 'manager']
        },

        {
            id: 'loyalty',
            label: 'Loyalty',
            icon: Gift,
            roles: ['owner', 'manager', 'staff'],
            submenu: [
                { label: 'Overview', href: '/dashboard/loyalty' },
                { label: 'Rewards', href: '/dashboard/loyalty/rewards' },
                { label: 'Settings', href: '/dashboard/loyalty/settings' },
                { label: 'Customers', href: '/dashboard/loyalty/customers' },
                { label: 'Verify', href: '/dashboard/loyalty/verify' },
                { label: 'New User Preview', href: '/dashboard/messaging/preview/new' },
                { label: 'Returning Preview', href: '/dashboard/messaging/preview/returning' },
            ]
        },
        {
            id: 'analytics',
            label: 'Analytics',
            icon: BarChart,
            roles: ['owner', 'manager'],
            submenu: [
                { label: 'Overview', href: '/dashboard/analytics' },
                { label: 'Footfall', href: '/dashboard/analytics/footfall' },
                { label: 'Peak Times', href: '/dashboard/analytics/peak-times' },
            ]
        },
        {
            id: 'support',
            label: 'Support',
            icon: HelpCircle,
            href: '/dashboard/support',
            roles: ['owner', 'manager', 'staff']
        },
        {
            id: 'agent-desk',
            label: 'Support Desk',
            icon: HelpCircle,
            href: '/agent/dashboard',
            roles: ['staff', 'manager']
        },
        {
            id: 'staff',
            label: 'Team',
            icon: Users2,
            href: '/dashboard/staff',
            roles: ['owner']
        },
        {
            id: 'admin-nfc',
            label: 'Admin NFC Grants',
            icon: ShieldCheck,
            href: '/admin/nfc-grants',
            roles: ['admin']
        },

        {
            id: 'settings',
            label: 'Settings',
            icon: Settings,
            href: '/dashboard/settings',
            roles: ['owner', 'manager'],
            submenu: [
                { label: 'Profile', href: '/dashboard/settings/profile' },
                { label: 'Branches', href: '/dashboard/settings/branches' },
                { label: 'Engagement', href: '/dashboard/settings/engagement' },
                { label: 'Notifications', href: '/dashboard/settings/notifications' },
                { label: 'Integrations', href: '/dashboard/settings/integrations' },
                { label: 'Subscription', href: '/dashboard/settings/subscription' },
                { label: 'Privacy & Data', href: '/dashboard/settings/privacy' },
            ]
        },
    ];

    const filteredMenuItems = menuItems.filter(item =>
        !item.roles || item.roles.includes((user?.role as string)?.toLowerCase() || 'owner')
    );

    const isActive = (href: string) => pathname === href;
    const isParentActive = (submenu?: any[]): boolean =>
        submenu?.some(item => (item.href && pathname === item.href) || (item.submenu && isParentActive(item.submenu))) || false;

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
                fixed inset-y-0 left-0 z-70 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo  */}
                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <Logo />
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
                    {filteredMenuItems.map((item) => {
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
                                                {IconComponent && <IconComponent size={18} />}
                                                <span>{item.label}</span>
                                            </div>
                                            <ChevronDown
                                                size={16}
                                                className={`transition-transform ${expandedMenus.includes(item.id) ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        {expandedMenus.includes(item.id) && (
                                            <div className="mt-1 ml-9 space-y-1">
                                                {item.submenu.map((subItem: any, idx) => (
                                                    subItem.submenu ? (
                                                        <div key={subItem.id || idx} className="mb-1">
                                                            <button
                                                                onClick={() => toggleMenu(subItem.id, item.id)}
                                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isParentActive(subItem.submenu)
                                                                    ? 'text-primary'
                                                                    : 'text-text-secondary hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                <span>{subItem.label}</span>
                                                                <ChevronDown
                                                                    size={14}
                                                                    className={`transition-transform ${expandedMenus.includes(subItem.id) ? 'rotate-180' : ''}`}
                                                                />
                                                            </button>
                                                            {expandedMenus.includes(subItem.id) && (
                                                                <div className="mt-1 ml-4 space-y-1 border-l border-gray-100">
                                                                    {subItem.submenu.map((nestedItem: any, nIdx: number) => (
                                                                        nestedItem.submenu ? (
                                                                            <div key={nestedItem.id || nIdx} className="mb-1">
                                                                                <button
                                                                                    onClick={() => toggleMenu(nestedItem.id, subItem.id)}
                                                                                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${isParentActive(nestedItem.submenu)
                                                                                        ? 'text-primary'
                                                                                        : 'text-text-secondary hover:bg-gray-50'
                                                                                        }`}
                                                                                >
                                                                                    <span>{nestedItem.label}</span>
                                                                                    <ChevronDown
                                                                                        size={12}
                                                                                        className={`transition-transform ${expandedMenus.includes(nestedItem.id) ? 'rotate-180' : ''}`}
                                                                                    />
                                                                                </button>
                                                                                {expandedMenus.includes(nestedItem.id) && (
                                                                                    <div className="mt-1 ml-3 space-y-1 border-l border-gray-100">
                                                                                        {nestedItem.submenu.map((deepItem: any) => (
                                                                                            <Link
                                                                                                key={deepItem.href}
                                                                                                href={deepItem.href}
                                                                                                className={`block px-3 py-1 rounded-lg text-[10px] font-medium transition-colors ${isActive(deepItem.href)
                                                                                                    ? 'text-primary border-l-2 border-primary -ml-px'
                                                                                                    : 'text-text-secondary hover:text-text-main'
                                                                                                    }`}
                                                                                            >
                                                                                                {deepItem.label}
                                                                                            </Link>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            <Link
                                                                                key={nestedItem.href}
                                                                                href={nestedItem.href}
                                                                                className={`block px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isActive(nestedItem.href)
                                                                                    ? 'text-primary border-l-2 border-primary -ml-px'
                                                                                    : 'text-text-secondary hover:text-text-main'
                                                                                    }`}
                                                                            >
                                                                                {nestedItem.label}
                                                                            </Link>
                                                                        )
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <Link
                                                            key={subItem.href}
                                                            href={subItem.href}
                                                            onClick={() => setIsMobileOpen(false)}
                                                            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(subItem.href)
                                                                ? 'bg-primary text-white'
                                                                : 'text-text-secondary hover:bg-gray-50 hover:text-text-main'
                                                                }`}
                                                        >
                                                            {subItem.label}
                                                        </Link>
                                                    )
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        href={item.href!}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.href!)
                                            ? 'bg-primary/5 text-primary'
                                            : 'text-text-secondary hover:bg-gray-50 hover:text-text-main'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {IconComponent && <IconComponent size={18} />}
                                            <span>{item.label}</span>
                                        </div>
                                        {item.id === 'loyalty' && pendingRedemptions > 0 && (
                                            <span className="w-5 h-5 bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center rounded-full shadow-sm shadow-emerald-500/20">
                                                {pendingRedemptions}
                                            </span>
                                        )}
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="border-t border-gray-200 p-4">
                    <Link
                        href={`/business/${(myBusiness?.name || user?.businessName || 'profile').toLowerCase().replace(/\s+/g, '-')}`}
                        className="flex items-center gap-3 mb-3 hover:bg-gray-50 p-2 rounded-xl transition-colors group"
                    >
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-gray-100 group-hover:scale-105 transition-transform">
                            {myBusiness?.logoUrl || defaultLogo ? (
                                <img
                                    src={myBusiness?.logoUrl || defaultLogo.src}
                                    alt={myBusiness?.name || 'Store'}
                                    className="w-full h-full object-contain p-1"
                                />
                            ) : (
                                <Users className="text-primary" size={20} />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-text-main truncate">{user?.name || 'Business Owner'}</p>
                            <p className="text-xs text-text-secondary truncate">{myBusiness?.name || user?.businessName || 'Business Profile'}</p>
                        </div>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full py-2 px-3 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
                {/* Top Bar */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={() => setIsMobileOpen(true)}
                            className="p-2 text-text-secondary hover:bg-gray-50 rounded-lg lg:hidden"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="relative max-w-sm w-full hidden sm:block">
                            <BranchSwitcher />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 lg:gap-4 relative">
                        <TrialBanner compact />
                        {/* Removed Plan Badge */}

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
                                            notifications.map((note: Notification) => (
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
                                            href="/dashboard/notifications"
                                            className="text-xs font-bold text-primary hover:text-primary-hover"
                                            onClick={() => setShowNotifications(false)}
                                        >
                                            View All Notifications
                                        </Link>
                                    </div>
                                </div>
                            </>
                        )}

                        <Link
                            href="/dashboard/support"
                            className="p-2 text-text-secondary hover:text-text-main hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <HelpCircle size={20} />
                        </Link>

                        {/* User Avatar & Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserDropdown(!showUserDropdown)}
                                className="flex items-center gap-2 p-0.5 hover:bg-gray-100 rounded-full transition-all focus:outline-none border border-transparent hover:border-gray-200"
                            >
                                <div className="size-8 rounded-full bg-primary/5 flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm transition-transform hover:scale-105 active:scale-95">
                                    {myBusiness?.logoUrl || (defaultLogo as any)?.src ? (
                                        <img
                                            src={myBusiness?.logoUrl || (defaultLogo as any).src}
                                            alt={myBusiness?.name || 'Store'}
                                            className="w-full h-full object-contain p-1"
                                        />
                                    ) : (
                                        <Users className="text-primary" size={16} />
                                    )}
                                </div>
                            </button>

                            {showUserDropdown && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowUserDropdown(false)}
                                    ></div>
                                    <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-4 py-3 border-b border-gray-50 mb-1 bg-gray-50/50">
                                            <p className="text-sm font-bold text-text-main truncate">{user?.name || 'User'}</p>
                                            <p className="text-[11px] text-text-secondary truncate">{user?.email || (user as any)?.email}</p>
                                        </div>
                                        <div className="px-2">
                                            <Link
                                                href="/dashboard/settings/profile"
                                                className="flex items-center gap-3 px-3 py-2 text-sm text-text-secondary hover:bg-primary/5 hover:text-primary rounded-lg transition-colors"
                                                onClick={() => setShowUserDropdown(false)}
                                            >
                                                <Settings size={16} className="opacity-70" />
                                                <span>Profile</span>
                                            </Link>
                                            {((user?.role as string)?.toLowerCase() === 'owner' || (user?.role as string)?.toLowerCase() === 'admin') && (
                                                <Link
                                                    href="/dashboard/staff"
                                                    className="flex items-center gap-3 px-3 py-2 text-sm text-text-secondary hover:bg-primary/5 hover:text-primary rounded-lg transition-colors"
                                                    onClick={() => setShowUserDropdown(false)}
                                                >
                                                    <Users2 size={16} className="opacity-70" />
                                                    <span>Users</span>
                                                </Link>
                                            )}
                                        </div>
                                        <div className="border-t border-gray-50 my-2"></div>
                                        <div className="px-2">
                                            <button
                                                onClick={() => {
                                                    setShowUserDropdown(false);
                                                    handleLogout();
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <LogOut size={16} />
                                                <span>Logout</span>
                                            </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                        </div>
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
