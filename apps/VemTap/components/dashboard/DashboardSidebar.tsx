'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
const defaultLogo = '/VEMTAP_PNG.png';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard';
import { Notification } from '@/lib/store/mockDashboardStore';
import {
    Home, Users, Gift, BarChart, Users2, Settings,
    ChevronDown, Lock, LogOut, Bell, HelpCircle, Menu, MessageSquare, ShieldCheck,
    MessageCircle, LucideIcon, Zap, ShoppingBag, QrCode, AlertCircle, FileText,
    ClipboardCheck
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import BranchSwitcher from './BranchSwitcher';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useMarketingAssets, useAnalyticsOverview } from '@/services/marketing-assets/hooks';
import DashboardMobileNav from './DashboardMobileNav';
import { useChatStore } from '@/lib/store/useChatStore';
import UpgradeModal from './UpgradeModal';
import SubscriptionExpiredModal from './SubscriptionExpiredModal';
import { useSudoStore } from '@/store/useSudoStore';
import { canAccessMenuItem } from '@/lib/utils/nav-filter';
import OwnerSearch from './OwnerSearch';
import { OWNER_MENU_ITEMS } from '@/constants/ownerNavigation';

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
    permission?: string;
    feature?: string;
    featureName?: string;
    submenu?: MenuItem[];
    external?: boolean;
    onClick?: () => void;
}

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
    const isCreateAssetPage = pathname.includes('/marketing-assets/create');
    const activeConversationId = useChatStore(s => s.activeConversationId);
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

    // Setup Checklist Pending Count
    const { data: assets } = useMarketingAssets();
    const { data: marketingAnalytics } = useAnalyticsOverview();
    const pendingSetupCount = useMemo(() => {
        let count = 0;
        if (!myBusiness?.logoUrl) count++;
        if (!assets || assets.length === 0) count++;
        if (!(marketingAnalytics?.totals?.downloads > 0)) count++;
        const visitorsCount = (Array.isArray(data?.stats) ? data.stats : []).find((s: any) => s.label.toLowerCase().includes('total visitors'))?.value || '0';
        if (visitorsCount === '0') count++;
        // Campaign placeholder
        count++; 
        return count;
    }, [myBusiness, assets, marketingAnalytics, data]);

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

    const menuItems: MenuItem[] = OWNER_MENU_ITEMS as any[];

    const userPermissions = user?.permissions || [];
    const isOwnerOrAdmin = ['owner', 'admin'].includes((user?.role as string)?.toLowerCase());

    const filteredMenuItems = menuItems.filter(item => {
        const realUserRole = (user?.role as string)?.toLowerCase() || 'owner';
        
        // Handle Admin/Agent Sudo Mode (Impersonation)
        if (isAdminMode) {
            if (item.id === 'staff') return false;
            if (item.id === 'agent-desk') return false;
            if (item.id === 'admin-nfc') return false;
            
            return !item.roles || item.roles.includes('owner');
        }

        // Hide Marketing Materials for excluded categories (PRD §8.0)
        if (item.id === 'marketing-assets' && myBusiness) {
            const bizCat = typeof (myBusiness as any).category === 'object'
                ? (myBusiness as any).category?.name
                : myBusiness.category;
            
            if (bizCat) {
                const excludedCategories = [
                    'hospital',
                    'clinic',
                    'dental clinic',
                    'eye clinic',
                    'medical laboratory',
                    'pharmacy',
                    'airport',
                    'government',
                    'ministry',
                    'agency',
                    'educational',
                    'school',
                    'university'
                ];
                const catLower = bizCat.toLowerCase();
                const isExcluded = excludedCategories.some(ex => {
                    if (ex === 'hospital') {
                        return catLower.includes('hospital') && !catLower.includes('hospitality');
                    }
                    return catLower.includes(ex);
                });
                if (isExcluded) {
                    return false;
                }
            }
        }

        return canAccessMenuItem(item, realUserRole, userPermissions, isOwnerOrAdmin);
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
                {/* Top Bar - Consolidated Unified Header */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 lg:px-8 shrink-0 sticky top-0 z-40">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={() => setIsMobileOpen(true)}
                            className="p-2 text-text-secondary hover:bg-gray-50 rounded-xl lg:hidden border border-gray-100"
                        >
                            <Menu size={24} />
                        </button>
                        
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0 hidden sm:flex">
                                {businessLogo ? (
                                    <img src={businessLogo} alt="Logo" className="size-full object-cover p-1" />
                                ) : (
                                    <Zap className="text-primary size-5" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1 truncate max-w-[120px]">
                                    {businessName}
                                </p>
                                <h1 className="text-base font-black text-gray-900 leading-none truncate">
                                    {pathname === '/dashboard' ? (
                                        <>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.firstName || 'Owner'}</>
                                    ) : (
                                        menuItems.find(i => i.href && pathname.startsWith(i.href))?.label || 'Dashboard'
                                    )}
                                </h1>
                            </div>
                        </div>

                        <div className="hidden lg:flex items-center gap-4 ml-6 border-l border-gray-100 pl-6">
                            <div className="w-48">
                                <BranchSwitcher />
                            </div>
                            <div className="w-64">
                                <OwnerSearch />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-3">
                        {/* Plan Status */}
                        {(() => {
                            const isOnTrial = activeSubscription?.status === 'trial' || activeSubscription?.status === 'trialing';
                            const planId = String(activeSubscription?.planId || '').toLowerCase();
                            const isFree = planId.includes('free') || Boolean(activeSubscription?.plan?.isFree);
                            const planName = activeSubscription?.plan?.name || (isFree ? 'Free' : 'Active');

                            return (
                                <Link
                                    href={withBranch("/dashboard/settings/subscription" + (!isFree ? "/manage" : ""))}
                                    className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                                        isSubscriptionExpired ? 'bg-red-50 border-red-100 text-red-600' :
                                        isOnTrial ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                        'bg-gray-50 border-gray-100 text-gray-600'
                                    }`}
                                >
                                    <span className="text-[9px] font-black uppercase tracking-widest">{planName}</span>
                                    {isOnTrial && <Zap size={10} className="fill-current" />}
                                </Link>
                            );
                        })()}

                        <div className="h-8 w-px bg-gray-100 mx-2 hidden sm:block" />

                        {/* Setup Progress Icon */}
                        {pendingSetupCount > 0 && (
                            <Link
                                href={withBranch("/dashboard")}
                                className="relative size-10 rounded-xl bg-[#066CF4]/5 flex items-center justify-center text-[#066CF4] hover:bg-[#066CF4]/10 transition-all border border-transparent hover:border-[#066CF4]/20 mr-1 sm:mr-0"
                                title="Pending Setup Tasks"
                            >
                                <ClipboardCheck size={20} />
                                <span className="absolute -top-1 -right-1 size-5 bg-[#066CF4] text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                                    {pendingSetupCount}
                                </span>
                            </Link>
                        )}

                        {/* Notification Button */}
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative size-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary transition-all border border-transparent hover:border-gray-200"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white" />
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowNotifications(false)}
                                ></div>
                                <div className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                        <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest">Notifications</h3>
                                        <button
                                            onClick={() => readAllMutation.mutate()}
                                            className="text-[10px] text-primary font-black uppercase hover:underline"
                                        >
                                            Mark all read
                                        </button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-10 text-center text-gray-400 text-xs font-medium">
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
                                                        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!note.read ? 'bg-primary' : 'bg-transparent'}`}></div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm ${!note.read ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                                                                {note.title}
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{note.message}</p>
                                                            <p className="text-[10px] text-gray-300 mt-2 font-bold uppercase">
                                                                {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="p-4 border-t border-gray-100 text-center">
                                        <Link
                                            href={withBranch("/dashboard/notifications")}
                                            className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-hover"
                                            onClick={() => setShowNotifications(false)}
                                        >
                                            View All Activity
                                        </Link>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* User Avatar & Dropdown */}
                        <div className="relative ml-1">
                            <button
                                onClick={() => setShowUserDropdown(!showUserDropdown)}
                                className="size-10 rounded-xl bg-[#066CF4]/10 border border-[#066CF4]/20 flex items-center justify-center overflow-hidden transition-transform hover:scale-105 active:scale-95"
                            >
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="Avatar" className="size-full object-cover" />
                                ) : (
                                    <span className="text-[#066CF4] font-black text-xs uppercase">
                                        {(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')}
                                    </span>
                                )}
                            </button>

                            {showUserDropdown && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowUserDropdown(false)}
                                    ></div>
                                    <div className="absolute right-0 top-14 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden py-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-5 py-4 border-b border-gray-50 mb-2 bg-gray-50/50">
                                            <p className="text-sm font-black text-gray-900 truncate">{user?.name || 'User'}</p>
                                            <p className="text-[11px] font-bold text-gray-400 truncate uppercase tracking-tight">{user?.email}</p>
                                        </div>
                                        <div className="px-2 space-y-1">
                                            <Link
                                                href={withBranch("/dashboard/settings/profile")}
                                                className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-primary/5 hover:text-primary rounded-xl transition-colors"
                                                onClick={() => setShowUserDropdown(false)}
                                            >
                                                <Settings size={16} className="opacity-70" />
                                                <span>Business Profile</span>
                                            </Link>
                                            {((user?.role as string)?.toLowerCase() === 'owner' || (user?.role as string)?.toLowerCase() === 'admin') && (
                                                <Link
                                                    href={withBranch("/dashboard/staff")}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-primary/5 hover:text-primary rounded-xl transition-colors"
                                                    onClick={() => setShowUserDropdown(false)}
                                                >
                                                    <Users2 size={16} className="opacity-70" />
                                                    <span>Staff & Access</span>
                                                </Link>
                                            )}
                                        </div>
                                        <div className="border-t border-gray-50 my-2 mx-2"></div>
                                        <div className="px-2">
                                            <button
                                                onClick={() => {
                                                    setShowUserDropdown(false);
                                                    handleLogout();
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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

            {/* Only show Mobile Nav if NOT on an active chat conversation */}
            {!(isChatRoute && activeConversationId) && !isCreateAssetPage && <DashboardMobileNav />}
            
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
