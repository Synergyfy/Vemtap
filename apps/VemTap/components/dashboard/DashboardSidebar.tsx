'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
const defaultLogo = '/VEMTAP_PNG.png';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard';
import { Notification } from '@/lib/store/mockDashboardStore';
import {
    Home, Users, Nfc, Gift, BarChart, Users2, Settings,
    ChevronDown, Lock, LogOut, Bell, HelpCircle, Menu, MessageSquare, ShieldCheck,
    MessageCircle, LucideIcon, Zap, ShoppingBag, QrCode, AlertCircle
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import BranchSwitcher from './BranchSwitcher';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useMyBusiness } from '@/services/businesses/hooks';
import DashboardMobileNav from './DashboardMobileNav';
import UpgradeModal from './UpgradeModal';
import SubscriptionExpiredModal from './SubscriptionExpiredModal';

interface SidebarProps {
    children: React.ReactNode;
}

interface MenuItem {
    id?: string;
    label: string;
    description?: string;
    icon?: LucideIcon;
    href?: string;
    roles?: string[];
    feature?: string;
    featureName?: string;
    submenu?: MenuItem[];
    external?: boolean;
    onClick?: () => void;
}

import { useSudoStore } from '@/store/useSudoStore';

export default function DashboardSidebar({ children }: SidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { activeSession } = useSudoStore();
    const isAdminMode = activeSession !== null;
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const { data: myBusiness, isLoading: isBusinessLoading } = useMyBusiness();
    const { fetchSubscriptionData, isFeatureLocked, capabilities, activeSubscription, isSubscriptionExpired } = useSubscriptionStore();
    const { activeBranchId, getLinkWithBranch } = useActiveBranch();
    const [upgradeModal, setUpgradeModal] = useState({ isOpen: false, featureName: '' });
    const isChatRoute = pathname.includes('/messaging/chat');
    const mainRef = useRef<HTMLElement | null>(null);

    // Close upgrade modal and mobile sidebar on navigation
    useEffect(() => {
        setUpgradeModal({ isOpen: false, featureName: '' });
        setIsMobileOpen(false);
    }, [pathname, searchParams]);

    useEffect(() => {
        if (isChatRoute && mainRef.current) {
            mainRef.current.scrollTop = 0;
        }
    }, [isChatRoute, pathname]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchSubscriptionData();
        }
    }, [isAuthenticated, fetchSubscriptionData]);

    const mainBranch = myBusiness?.branches?.find(b => b.isMainBranch);
    const activeBranch = myBusiness?.branches?.find(b => b.id === activeBranchId);
    const firstBranchWithCode = myBusiness?.branches?.find(b => b.uniqueCode);
    const businessLogo = myBusiness?.logoUrl || mainBranch?.logoUrl || defaultLogo;
    const businessName = myBusiness?.name || user?.businessName || 'Business Profile';
    const businessSlug = businessName.toLowerCase().replace(/\s+/g, '-');
    const publicProfileCode = activeBranch?.uniqueCode || mainBranch?.uniqueCode || firstBranchWithCode?.uniqueCode || myBusiness?.uniqueCode;
    const publicProfileHref = getLinkWithBranch(publicProfileCode ? `/b/${publicProfileCode}` : `/business/${businessSlug}`);



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

    const { data } = useQuery({
        queryKey: ['dashboard', activeBranchId],
        queryFn: dashboardApi.fetchDashboardData,
        refetchInterval: 5000,
    });

    const notifications = (data?.notifications || []).filter((n: Notification) => n.scope === 'DASHBOARD');
    const redemptionRequests = data?.redemptionRequests || [];
    const unreadCount = notifications.filter((n: Notification) => !n.read).length;
    const pendingRedemptions = redemptionRequests.filter((r: any) => r.status === 'pending').length;
    const isFreePlan = Boolean(activeSubscription?.plan?.isFree) || String(activeSubscription?.planId || '').toLowerCase().includes('free');

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
        // 1. Clear React Query Cache
        queryClient.clear();

        // 2. Clear Local Storage (Zustand persists here)
        if (typeof window !== 'undefined') {
            localStorage.clear();
        }

        // 3. Clear Auth Store State
        logout();

        // 4. Redirect to login
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

    const menuItems: MenuItem[] = [
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
            id: 'live-chat',
            label: 'In-App Chat',
            icon: MessageCircle,
            href: '/dashboard/messaging/chat',
            roles: ['owner', 'manager', 'staff'],
        },
        {
            id: 'messaging-center',
            label: 'Channels',
            icon: MessageSquare,
            roles: ['owner', 'manager'],
            submenu: [
                { label: 'WhatsApp', href: '/dashboard/messaging/whatsapp' },
                { label: 'SMS', href: '/dashboard/messaging/sms' },
                { label: 'Email', href: '/dashboard/messaging/email' },
                { label: 'Messaging Credits', href: '/dashboard/messaging/credits' },
                { label: 'History', href: '/dashboard/messaging/history' },
            ]
        },
        {
            id: 'loyalty',
            label: 'Loyalty',
            icon: Gift,
            roles: ['owner', 'manager', 'staff'],
            feature: 'loyalty',
            featureName: 'Loyalty Programs',
            submenu: [
                { label: 'Overview', href: '/dashboard/loyalty' },
                { label: 'Rewards', href: '/dashboard/loyalty/rewards' },
                { label: 'Redeem Reward', href: '/dashboard/loyalty/redeem' },
                { label: 'Settings', href: '/dashboard/loyalty/settings' },
                { label: 'Customers', href: '/dashboard/loyalty/customers' },
            ]
        },
        {
            id: 'engagement',
            label: 'Engagement',
            icon: Zap,
            submenu: [
                { label: 'User Experience', href: '/dashboard/engagement/experience' },
                { label: 'Form Creator', href: '/dashboard/engagement/forms' },
            ]
        },
        {
            id: 'catalogue',
            label: 'Catalogue',
            icon: ShoppingBag,
            roles: ['owner', 'manager'],
            feature: 'catalogue',
            featureName: 'Catalogue',
            submenu: [
                { label: 'Overview', href: '/dashboard/catalogue' },
                { label: 'Items', href: '/dashboard/catalogue/products' },
                { label: 'Offers', href: '/dashboard/catalogue/offers' },
                { label: 'Categories', href: '/dashboard/catalogue/categories' },
                { label: 'Orders', href: '/dashboard/catalogue/orders' },
                { label: 'Bookings', href: '/dashboard/catalogue/bookings' },
            ]
        },
        {
            id: 'business-leads',
            label: 'Business Leads',
            icon: QrCode,
            roles: ['owner', 'manager'],
            submenu: [
                { label: 'Orders', href: '/dashboard/business-leads/orders' },
                { label: 'Bookings', href: '/dashboard/business-leads/bookings' },
            ]
        },
        {
            id: 'analytics',
            label: 'Advanced Analytics ',
            icon: BarChart,
            roles: ['owner', 'manager'],
            submenu: [
                { label: 'Overview', href: '/dashboard/analytics' },
                { label: 'Footfall', href: '/dashboard/analytics/footfall', feature: 'footfall', featureName: 'Advanced Analytics' },
                { label: 'Peak Times', href: '/dashboard/analytics/peak-times', feature: 'peak-times', featureName: 'Advanced Analytics' },
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
            id: 'devices',
            label: 'Business Link',
            icon: Nfc,
            href: '/dashboard/business-link',
            roles: ['owner', 'manager', 'staff'],

        },
        {
            id: 'explore-qrthrive',
            label: 'Explore QRThrive',
            icon: QrCode,
            href: '/dashboard/explore-qrthrive',
            roles: ['owner', 'manager', 'staff'],
        },

        {
            id: 'settings',
            label: 'Settings',
            icon: Settings,
            href: '/dashboard/settings',
            roles: ['owner', 'manager'],
            submenu: [
                { label: 'Profile', href: '/dashboard/settings/profile' },
                { label: 'Business Locations', href: '/dashboard/settings/branches' },

                { label: 'Subscription', href: '/dashboard/settings/subscription' },
                { label: 'Privacy & Data', href: '/dashboard/settings/privacy' },
                { label: 'Legal & Compliance', href: '/dashboard/compliance' },
            ]
        },
    ];

    const filteredMenuItems = menuItems.filter(item => {
        const realUserRole = (user?.role as string)?.toLowerCase() || 'owner';
        
        // Handle Admin/Agent Sudo Mode (Impersonation)
        if (isAdminMode) {
            // Hide sensitive items or agent/admin tools while impersonating a business
            if (item.id === 'staff') return false;
            if (item.id === 'agent-desk') return false;
            if (item.id === 'admin-nfc') return false;
            
            // Treat the impersonator as an 'owner' so they see standard business menus
            return !item.roles || item.roles.includes('owner');
        }

        // Normal Flow (Not impersonating)
        if (realUserRole === 'admin') return true;
        return !item.roles || item.roles.includes(realUserRole);
    }).map(item => {
        return item;
    });

    const isActive = (href: string) => pathname === href;
    const isParentActive = (submenu?: any[]): boolean =>
        submenu?.some(item => (item.href && pathname === item.href) || (item.submenu && isParentActive(item.submenu))) || false;
    const primaryNavClasses = (active: boolean) =>
        active
            ? 'bg-primary text-white shadow-lg shadow-primary/20'
            : 'text-text-secondary hover:bg-blue-50 hover:text-primary';
    const subNavClasses = (active: boolean) =>
        active
            ? 'bg-gray-100 text-text-main'
            : 'text-text-secondary hover:bg-gray-100 hover:text-text-main';
    const withBranch = (href: string) => getLinkWithBranch(href);

    const handleItemClick = (e: React.MouseEvent, item: any, parentId?: string) => {
        // Close modal if open when clicking something else
        if (upgradeModal.isOpen) {
            setUpgradeModal({ isOpen: false, featureName: '' });
        }

        if (item.feature && isFeatureLocked(item.feature)) {
            e.preventDefault();
            e.stopPropagation();
            setUpgradeModal({ isOpen: true, featureName: item.featureName || item.label });
            return false;
        }
        if (item.submenu) {
            if (!item.id) {
                return true;
            }
            toggleMenu(item.id, parentId);
        }
        return true;
    };

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
                    <Link href={withBranch('/dashboard')} className="flex items-center gap-2">
                        <Logo />
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
                    {isMounted && filteredMenuItems.map((item) => {
                        const IconComponent = item.icon;
                        const isLocked = isMounted && item.feature && isFeatureLocked(item.feature);
                        return (
                            <div key={item.id} className="mb-1">
                                {item.submenu ? (
                                    <>
                                        <button
                                            onClick={(e) => handleItemClick(e, item)}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-black transition-colors ${primaryNavClasses(isParentActive(item.submenu))
                                                } ${isLocked ? 'opacity-70' : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {IconComponent && <IconComponent size={18} />}
                                                <span>{item.label}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isLocked && <Lock size={14} className="text-text-secondary" />}
                                                <ChevronDown
                                                    size={16}
                                                    className={`transition-transform ${expandedMenus.includes(item.id || '') ? 'rotate-180' : ''}`}
                                                />
                                            </div>
                                        </button>
                                        {expandedMenus.includes(item.id || '') && !isLocked && (
                                            <div className="mt-2 ml-4 space-y-2">
                                                {item.submenu.map((subItem: any, idx) => {
                                                    const isSubLocked = isMounted && subItem.feature && isFeatureLocked(subItem.feature);
                                                    return subItem.submenu ? (
                                                        <div key={subItem.id || idx} className="mb-1">
                                                            <button
                                                                onClick={(e) => handleItemClick(e, subItem, item.id)}
                                                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-black transition-colors ${subNavClasses(isParentActive(subItem.submenu))
                                                                    } ${isSubLocked ? 'opacity-70' : ''}`}
                                                            >
                                                                <span>{subItem.label}</span>
                                                                <div className="flex items-center gap-2">
                                                                    {isSubLocked && <Lock size={12} className="text-text-secondary" />}
                                                                    <ChevronDown
                                                                        size={14}
                                                                        className={`transition-transform ${expandedMenus.includes(subItem.id) ? 'rotate-180' : ''}`}
                                                                    />
                                                                </div>
                                                            </button>
                                                            {expandedMenus.includes(subItem.id) && !isSubLocked && (
                                                                <div className="mt-2 ml-3 space-y-2">
                                                                    {subItem.submenu.map((nestedItem: any, nIdx: number) => {
                                                                        const isNestedLocked = isMounted && nestedItem.feature && isFeatureLocked(nestedItem.feature);
                                                                        return nestedItem.submenu ? (
                                                                            <div key={nestedItem.id || nIdx} className="mb-1">
                                                                                <button
                                                                                    onClick={(e) => handleItemClick(e, nestedItem, subItem.id)}
                                                                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-black transition-colors ${subNavClasses(isParentActive(nestedItem.submenu))
                                                                                        } ${isNestedLocked ? 'opacity-70' : ''}`}
                                                                                >
                                                                                    <span>{nestedItem.label}</span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        {isNestedLocked && <Lock size={12} className="text-text-secondary" />}
                                                                                        <ChevronDown
                                                                                            size={12}
                                                                                            className={`transition-transform ${expandedMenus.includes(nestedItem.id) ? 'rotate-180' : ''}`}
                                                                                        />
                                                                                    </div>
                                                                                </button>
                                                                                {expandedMenus.includes(nestedItem.id) && !isNestedLocked && (
                                                                                    <div className="mt-1 ml-3 space-y-1 border-l border-gray-100">
                                                                                        {nestedItem.submenu.map((deepItem: any, dIdx: number) => (
                                                                                            deepItem.href ? (
                                                                                                <Link
                                                                                                    key={deepItem.href}
                                                                                                    href={getLinkWithBranch(deepItem.href!)}
                                                                                                    onClick={(e) => {
                                                                                                        if (deepItem.feature && isFeatureLocked(deepItem.feature)) {
                                                                                                            e.preventDefault();
                                                                                                            setUpgradeModal({ isOpen: true, featureName: deepItem.featureName || deepItem.label });
                                                                                                        }
                                                                                                    }}
                                                                                                    className={`flex items-center justify-between px-3 py-1 rounded-lg text-[10px] font-medium transition-colors ${isActive(deepItem.href)
                                                                                                        ? 'text-primary border-l-2 border-primary -ml-px'
                                                                                                        : 'text-text-secondary hover:text-text-main'
                                                                                                        }`}
                                                                                                >
                                                                                                    <span>{deepItem.label}</span>
                                                                                                    {deepItem.feature && isFeatureLocked(deepItem.feature) && <Lock size={10} className="text-text-secondary" />}
                                                                                                </Link>
                                                                                            ) : (
                                                                                                <span
                                                                                                    key={`${deepItem.label}-${dIdx}`}
                                                                                                    className="flex items-center justify-between px-3 py-1 rounded-lg text-[10px] font-medium text-text-secondary"
                                                                                                >
                                                                                                    <span>{deepItem.label}</span>
                                                                                                    {deepItem.feature && isFeatureLocked(deepItem.feature) && <Lock size={10} className="text-text-secondary" />}
                                                                                                </span>
                                                                                            )
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            nestedItem.href ? (
                                                                                <Link
                                                                                    key={nestedItem.href}
                                                                                    href={withBranch(nestedItem.href!)}
                                                                                    onClick={(e) => {
                                                                                        if (nestedItem.feature && isFeatureLocked(nestedItem.feature)) {
                                                                                            e.preventDefault();
                                                                                            setUpgradeModal({ isOpen: true, featureName: nestedItem.featureName || nestedItem.label });
                                                                                        }
                                                                                    }}
                                                                                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-black transition-colors ${subNavClasses(isActive(nestedItem.href))
                                                                                        }`}
                                                                                >
                                                                                    <span className="flex flex-col text-left">
                                                                                        <span>{nestedItem.label}</span>
                                                                                        {nestedItem.description && (
                                                                                            <span className="text-[10px] font-medium text-text-secondary mt-0.5">{nestedItem.description}</span>
                                                                                        )}
                                                                                    </span>
                                                                                    {nestedItem.feature && isFeatureLocked(nestedItem.feature) && <Lock size={12} className="text-text-secondary" />}
                                                                                </Link>
                                                                            ) : (
                                                                                <span
                                                                                    key={`${nestedItem.label}-${nIdx}`}
                                                                                    className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-black text-text-secondary"
                                                                                >
                                                                                    <span>{nestedItem.label}</span>
                                                                                    {nestedItem.feature && isFeatureLocked(nestedItem.feature) && <Lock size={12} className="text-text-secondary" />}
                                                                                </span>
                                                                            )
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        subItem.href ? (
                                                            <Link
                                                                key={subItem.href}
                                                                href={getLinkWithBranch(subItem.href!)}
                                                                onClick={(e) => {
                                                                    setIsMobileOpen(false);
                                                                    if (subItem.feature && isFeatureLocked(subItem.feature)) {
                                                                        e.preventDefault();
                                                                        setUpgradeModal({ isOpen: true, featureName: subItem.featureName || subItem.label });
                                                                    }
                                                                }}
                                                                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-black transition-colors ${subNavClasses(isActive(subItem.href))
                                                                    }`}
                                                            >
                                                                <span className="flex flex-col text-left">
                                                                    <span>{subItem.label}</span>
                                                                    {subItem.description && (
                                                                        <span className="text-[10px] font-medium text-text-secondary mt-0.5">{subItem.description}</span>
                                                                    )}
                                                                </span>
                                                                {subItem.feature && isFeatureLocked(subItem.feature) && <Lock size={12} className="text-text-secondary" />}
                                                            </Link>
                                                        ) : (
                                                            <span
                                                                key={`${subItem.label}-${idx}`}
                                                                className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-black text-text-secondary"
                                                            >
                                                                <span>{subItem.label}</span>
                                                                {subItem.feature && isFeatureLocked(subItem.feature) && <Lock size={12} className="text-text-secondary" />}
                                                            </span>
                                                        )
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        href={item.external ? item.href! : withBranch(item.href!)}
                                        target={item.external ? '_blank' : undefined}
                                        rel={item.external ? 'noopener noreferrer' : undefined}
                                        onClick={(e) => {
                                            if (item.feature && isFeatureLocked(item.feature)) {
                                                e.preventDefault();
                                                setUpgradeModal({ isOpen: true, featureName: item.featureName || item.label });
                                            }
                                        }}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-black transition-colors ${primaryNavClasses(isActive(item.href!))
                                            } ${isLocked ? 'opacity-70' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {IconComponent && <IconComponent size={18} />}
                                            <span>{item.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isLocked && <Lock size={14} className="text-text-secondary" />}
                                            {item.id === 'loyalty' && pendingRedemptions > 0 && !isLocked && (
                                                <span className="w-5 h-5 bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center rounded-full shadow-sm shadow-emerald-500/20">
                                                    {pendingRedemptions}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                )}

                            </div>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="border-t border-gray-200 p-4">
                    <Link
                        href={publicProfileHref}
                        className="flex items-center gap-3 mb-3 hover:bg-gray-50 p-2 rounded-xl transition-colors group"
                    >
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-gray-100 group-hover:scale-105 transition-transform">
                            {businessLogo ? (
                                <img
                                    src={businessLogo}
                                    alt={businessName}
                                    className="w-full h-full object-contain p-1"
                                />
                            ) : (
                                <Users className="text-primary" size={20} />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-text-main truncate">{user?.name || 'Business Owner'}</p>
                            <p className="text-xs text-text-secondary truncate">{businessName}</p>
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
            <div className="flex-1 flex flex-col h-screen overflow-hidden w-full min-h-0">
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
                        {(() => {
                            const isOnTrial = activeSubscription?.status === 'trial' || activeSubscription?.status === 'trialing';
                            const planId = String(activeSubscription?.planId || '').toLowerCase();
                            const isFree = planId.includes('free') || Boolean(activeSubscription?.plan?.isFree);
                            const planName = activeSubscription?.plan?.name || (isFree ? 'Free Plan' : 'Active Plan');

                            // Compute counts/days for trial
                            let daysRemaining = 0;
                            if (isOnTrial && activeSubscription?.trialEndDate) {
                                const trialEndDate = new Date(activeSubscription.trialEndDate);
                                const now = new Date();
                                daysRemaining = Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                            }

                            const subscriptionLink = withBranch("/dashboard/settings/subscription" + (!isFree ? "/manage" : ""));

                            return (
                                <>
                                    {/* Desktop View: Full Badge */}
                                    <div className="hidden sm:flex items-center">
                                        {isSubscriptionExpired ? (
                                            <Link
                                                href={subscriptionLink}
                                                className="inline-flex items-center px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-black uppercase tracking-widest whitespace-nowrap hover:bg-red-100 transition-colors shadow-sm shadow-red-100 animate-pulse"
                                            >
                                                Plan Expired
                                            </Link>
                                        ) : isFree ? (
                                            <Link
                                                href={subscriptionLink}
                                                className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-black uppercase tracking-widest whitespace-nowrap hover:bg-gray-200 transition-colors"
                                            >
                                                Free Plan
                                            </Link>
                                        ) : isOnTrial ? (
                                            <Link
                                                href={subscriptionLink}
                                                className="flex items-center gap-2 pl-3 pr-1 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full transition-all group"
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                                                    {planName}
                                                </span>
                                                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white rounded-full">
                                                    <Zap size={10} className="fill-white" />
                                                    <span className="text-[9px] font-black uppercase tracking-tighter">
                                                        {daysRemaining > 0 ? `${daysRemaining}d trial` : 'Last day!'}
                                                    </span>
                                                </div>
                                            </Link>
                                        ) : (
                                            <Link
                                                href={subscriptionLink}
                                                className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-widest whitespace-nowrap hover:bg-emerald-100 transition-colors"
                                            >
                                                {planName}
                                            </Link>
                                        )}
                                    </div>

                                    {/* Mobile View: Compact Icon */}
                                    <div className="flex sm:hidden items-center">
                                        <Link
                                            href={subscriptionLink}
                                            className={`size-9 rounded-xl flex items-center justify-center border transition-all shadow-sm ${
                                                isSubscriptionExpired
                                                    ? 'bg-red-50 border-red-200 text-red-600 animate-pulse'
                                                    : isFree 
                                                        ? 'bg-gray-50 border-gray-200 text-gray-400' 
                                                        : isOnTrial 
                                                            ? 'bg-amber-50 border-amber-200 text-amber-600' 
                                                            : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                            }`}
                                        >
                                            {isSubscriptionExpired ? (
                                                <AlertCircle size={18} />
                                            ) : isFree ? (
                                                <Zap size={18} className="opacity-40" />
                                            ) : isOnTrial ? (
                                                <div className="relative">
                                                    <Zap size={18} className="fill-current" />
                                                    {daysRemaining > 0 && (
                                                        <span className="absolute -top-1 -right-1 size-4 bg-amber-500 text-white text-[8px] font-black rounded-full border-2 border-amber-50 flex items-center justify-center">
                                                            {daysRemaining}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <ShieldCheck size={18} />
                                            )}
                                        </Link>
                                    </div>
                                </>
                            );
                        })()}

                        {/* Notification Button */}
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 text-text-secondary hover:text-text-main hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 min-w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full px-1">
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
                                            href={withBranch("/dashboard/notifications")}
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
                            href={withBranch("/dashboard/support")}
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
                                    {businessLogo ? (
                                        <img
                                            src={businessLogo}
                                            alt={businessName}
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
                                            <p className="text-[11px] text-text-secondary truncate">{user?.email}</p>
                                        </div>
                                        <div className="px-2">
                                            <Link
                                                href={withBranch("/dashboard/settings/profile")}
                                                className="flex items-center gap-3 px-3 py-2 text-sm text-text-secondary hover:bg-primary/5 hover:text-primary rounded-lg transition-colors"
                                                onClick={() => setShowUserDropdown(false)}
                                            >
                                                <Settings size={16} className="opacity-70" />
                                                <span>Profile</span>
                                            </Link>
                                            {((user?.role as string)?.toLowerCase() === 'owner' || (user?.role as string)?.toLowerCase() === 'admin') && (
                                                <Link
                                                    href={withBranch("/dashboard/staff")}
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
                <main
                    ref={mainRef}
                    className={`flex-1 bg-gray-50 min-h-0 ${isChatRoute ? 'overflow-hidden' : 'overflow-y-auto pb-16 lg:pb-0'}`}
                >
                    {children}
                </main>
            </div>

            {/* Only show Mobile Nav if NOT on a chat route */}
            {!isChatRoute && <DashboardMobileNav />}
            
            <UpgradeModal
                isOpen={upgradeModal.isOpen}
                onClose={() => setUpgradeModal({ ...upgradeModal, isOpen: false })}
                featureName={upgradeModal.featureName}
            />

            <SubscriptionExpiredModal
                isOpen={isSubscriptionExpired && !pathname.includes('/settings/subscription')}
            />
        </div>
    );
}
