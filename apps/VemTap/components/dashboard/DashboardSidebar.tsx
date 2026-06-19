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
    ClipboardCheck, Search, Star, Pin, PinOff, ChevronLeft, ChevronRight, LayoutDashboard,
    X, MoreHorizontal, User
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import BranchSwitcher from './BranchSwitcher';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranches } from '@/services/branches/hooks';
import { useMarketingAssets, useAnalyticsOverview } from '@/services/marketing-assets/hooks';
import DashboardMobileNav from './DashboardMobileNav';
import { useChatStore } from '@/lib/store/useChatStore';
import UpgradeModal from './UpgradeModal';
import SubscriptionExpiredModal from './SubscriptionExpiredModal';
import { useSudoStore } from '@/store/useSudoStore';
import { canAccessMenuItem } from '@/lib/utils/nav-filter';
import OwnerSearch from './OwnerSearch';
import { NAVIGATION_SECTIONS, MenuItem, NavSection } from '@/constants/ownerNavigation';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface SidebarProps {
    children: React.ReactNode;
}

export default function DashboardSidebar({ children }: SidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { activeSession } = useSudoStore();
    const isAdminMode = activeSession !== null;
    const [isMounted, setIsMounted] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [favorites, setFavorites] = useState<string[]>(['pos', 'visitors', 'in-app-chat']); // Default favorites
    
    useEffect(() => {
        setIsMounted(true);
        // Load favorites from local storage if available
        const savedFavs = localStorage.getItem('vt-sidebar-favs');
        if (savedFavs) setFavorites(JSON.parse(savedFavs));
        
        // Load collapsed state
        const savedCollapsed = localStorage.getItem('vt-sidebar-collapsed');
        
        // Collapse by default on POS route, otherwise respect saved state
        if (pathname?.includes('/dashboard/pos')) {
            setIsCollapsed(true);
        } else if (savedCollapsed === 'true') {
            setIsCollapsed(true);
        }
    }, [pathname]);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('vt-sidebar-collapsed', String(newState));
    };

    const toggleFavorite = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setFavorites(prev => {
            const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
            localStorage.setItem('vt-sidebar-favs', JSON.stringify(next));
            return next;
        });
    };

    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const { data: myBusiness, isLoading: isBusinessLoading } = useMyBusiness();
    const { data: branches = [] } = useBranches();
    const { fetchSubscriptionData, isFeatureLocked, capabilities, activeSubscription, isSubscriptionExpired } = useSubscriptionStore();
    const { activeBranchId, getLinkWithBranch } = useActiveBranch();

    const currentBranch = useMemo(() => {
        if (!activeBranchId) return null;
        return branches.find(b => b.id === activeBranchId);
    }, [branches, activeBranchId]);

    const currentBranchLogo = currentBranch?.logoUrl || myBusiness?.logoUrl || defaultLogo;
    const [upgradeModal, setUpgradeModal] = useState({ isOpen: false, featureName: '' });
    const isChatRoute = pathname.includes('/messaging/chat');
    const isCreateAssetPage = pathname.includes('/marketing-assets/create');
    const activeConversationId = useChatStore(s => s.activeConversationId);
    const mainRef = useRef<HTMLElement | null>(null);

    // Auto-expand the menu corresponding to the current path
    const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
        const pathParts = pathname.split('/');
        if (pathParts.length > 2) return [pathParts[2]];
        return [];
    });

    const [expandedSections, setExpandedSections] = useState<string[]>(['section-dashboard', 'section-customers']);

    const [showNotifications, setShowNotifications] = useState(false);
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

    const { data: assets } = useMarketingAssets();
    const { data: marketingAnalytics } = useAnalyticsOverview();
    const pendingSetupCount = useMemo(() => {
        let count = 0;
        if (!myBusiness?.logoUrl) count++;
        if (!assets || assets.length === 0) count++;
        if (!((marketingAnalytics?.totals?.downloads ?? 0) > 0)) count++;
        const visitorsCount = (Array.isArray(data?.stats) ? data.stats : []).find((s: any) => s.label.toLowerCase().includes('total visitors'))?.value || '0';
        if (visitorsCount === '0') count++;
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
        queryClient.clear();
        if (typeof window !== 'undefined') localStorage.clear();
        logout();
        router.push('/login');
    };

    const toggleMenu = (menuId: string) => {
        setExpandedMenus(prev => prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]);
    };

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]);
    };

    const userPermissions = user?.permissions || [];
    const isOwnerOrAdmin = ['owner', 'admin'].includes((user?.role as string)?.toLowerCase());

    const filteredSections = useMemo(() => {
        const realUserRole = (user?.role as string)?.toLowerCase() || 'owner';
        
        return NAVIGATION_SECTIONS.map(section => ({
            ...section,
            items: section.items.filter(item => {
                // Sudo/Admin filters
                if (isAdminMode) {
                    if (['staff', 'agent-desk', 'admin-nfc'].includes(item.id)) return false;
                    return !item.roles || item.roles.includes('owner');
                }
                
                // Search filter
                if (searchQuery) {
                    const match = item.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 item.keywords?.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                 item.submenu?.some(s => s.label.toLowerCase().includes(searchQuery.toLowerCase()));
                    if (!match) return false;
                }

                return canAccessMenuItem(item, realUserRole, userPermissions, isOwnerOrAdmin);
            })
        })).filter(section => section.items.length > 0);
    }, [searchQuery, isAdminMode, user?.role, userPermissions, isOwnerOrAdmin]);

    const favoriteItems = useMemo(() => {
        const allItems = NAVIGATION_SECTIONS.flatMap(s => s.items);
        return allItems.filter(i => favorites.includes(i.id));
    }, [favorites]);

    const isActive = (href: string) => pathname === href;
    const isParentActive = (submenu?: any[]): boolean =>
        submenu?.some(item => (item.href && pathname === item.href) || (item.submenu && isParentActive(item.submenu))) || false;

    const withBranch = (href: string) => getLinkWithBranch(href);

    const handleItemClick = (e: React.MouseEvent, item: any) => {
        if (upgradeModal.isOpen) setUpgradeModal({ isOpen: false, featureName: '' });
        if (item.feature && isFeatureLocked(item.feature)) {
            e.preventDefault();
            e.stopPropagation();
            setUpgradeModal({ isOpen: true, featureName: item.featureName || item.label });
            return false;
        }
        if (item.submenu) {
            if (!item.id) return true;
            toggleMenu(item.id);
        }
        return true;
    };

    const businessLogo = myBusiness?.logoUrl || defaultLogo;
    const businessName = myBusiness?.name || user?.businessName || 'Business Profile';
    const publicProfileHref = getLinkWithBranch(myBusiness?.uniqueCode ? `/b/${myBusiness.uniqueCode}` : `/dashboard/settings/profile`);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden relative">
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div className="fixed inset-0 bg-black/50 z-60 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsMobileOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-70 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 lg:static 
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                ${isCollapsed ? 'w-20' : 'w-72'}
            `}>
                {/* Header / Collapse Toggle */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 shrink-0">
                    <Link href={withBranch('/dashboard')} className={`flex items-center gap-2 transition-opacity ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                        <div className="flex items-center gap-2">
                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                                {businessLogo ? (
                                    <img src={businessLogo} alt={businessName} className="size-full object-cover p-1" />
                                ) : (
                                    <Zap className="text-primary size-4" />
                                )}
                            </div>
                            <span className="text-sm font-black text-gray-900 truncate max-w-[120px]">{businessName}</span>
                        </div>
                    </Link>
                    <button 
                        onClick={toggleCollapse} 
                        className={`size-8 rounded-lg border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-all ${isCollapsed ? 'mx-auto' : ''}`}
                    >
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                {/* Sidebar Search */}
                {!isCollapsed && (
                    <div className="px-4 mt-6 mb-2">
                        <div className="relative group">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                            <input 
                                type="text"
                                placeholder="Search modules..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 bg-gray-50 border border-transparent rounded-xl pl-9 pr-4 text-xs font-bold focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Navigation Content */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar space-y-6">
                    
                    {/* Quick Access Area */}
                    {!searchQuery && favoriteItems.length > 0 && (
                        <div className="space-y-2 px-1">
                            {!isCollapsed && (
                                <div className="flex items-center justify-between px-3">
                                    <p className="text-[11px] md:text-xs font-black uppercase tracking-[0.15em] text-gray-500">Quick Access</p>
                                    <Star size={10} className="text-amber-400 fill-current" />
                                </div>
                            )}
                            <div className="space-y-1">
                                {favoriteItems.map(item => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href || '');
                                    return (
                                        <Link 
                                            key={`fav-${item.id}`}
                                            href={withBranch(item.href || '')}
                                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${
                                                active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                        >
                                            <div className="shrink-0"><Icon size={18} /></div>
                                            {!isCollapsed && <span className="text-sm font-black truncate">{item.label}</span>}
                                            {isCollapsed && (
                                                <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
                                                    {item.label}
                                                </div>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Main Sections */}
                    {isMounted && filteredSections.map((section) => (
                        <div key={section.id} className="space-y-2">
                            {!isCollapsed && !searchQuery && (
                                <button 
                                    onClick={() => toggleSection(section.id)}
                                    className="w-full flex items-center justify-between px-4 py-1 group"
                                >
                                    <span className="text-[11px] md:text-xs font-black uppercase tracking-[0.15em] text-gray-500 group-hover:text-gray-700 transition-colors">
                                        {section.label}
                                    </span>
                                    <ChevronDown size={10} className={`text-gray-300 transition-transform ${expandedSections.includes(section.id) ? '' : '-rotate-90'}`} />
                                </button>
                            )}
                            
                            {(searchQuery || expandedSections.includes(section.id) || isCollapsed) && (
                                <div className="space-y-1">
                                    {section.items.map((item) => {
                                        const Icon = item.icon;
                                        const isLocked = item.feature && isFeatureLocked(item.feature);
                                        const active = item.href ? isActive(item.href) : (item.submenu && isParentActive(item.submenu));
                                        const isMenuExpanded = expandedMenus.includes(item.id);

                                        return (
                                            <div key={item.id} className="relative group/item">
                                                {item.submenu ? (
                                                    <div className="space-y-1">
                                                        <button
                                                            onClick={(e) => handleItemClick(e, item)}
                                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                                                                active ? 'bg-primary/5 text-primary' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="shrink-0"><Icon size={18} /></div>
                                                                {!isCollapsed && <span className="text-sm font-black">{item.label}</span>}
                                                            </div>
                                                            {!isCollapsed && <ChevronDown size={14} className={`transition-transform ${isMenuExpanded ? 'rotate-180' : ''}`} />}
                                                        </button>
                                                        {!isCollapsed && isMenuExpanded && (
                                                            <div className="ml-9 space-y-1 border-l border-gray-100 pl-4 py-1">
                                                                {item.submenu.map((sub, idx) => (
                                                                    <Link 
                                                                        key={idx}
                                                                        href={withBranch(sub.href)}
                                                                        className={`block text-xs md:text-sm font-bold py-1.5 transition-colors ${
                                                                            isActive(sub.href) ? 'text-primary' : 'text-gray-400 hover:text-gray-700'
                                                                        }`}
                                                                    >
                                                                        {sub.label}
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Link
                                                        href={withBranch(item.href!)}
                                                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                                                            active ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="shrink-0"><Icon size={18} /></div>
                                                            {!isCollapsed && <span className="text-sm font-black truncate">{item.label}</span>}
                                                        </div>
                                                        {!isCollapsed && (
                                                            <div className="flex items-center gap-2">
                                                                {isLocked && <Lock size={12} className="text-gray-400" />}
                                                                {item.id === 'loyalty' && pendingRedemptions > 0 && (
                                                                    <span className="size-4 bg-emerald-500 text-white text-[8px] font-black flex items-center justify-center rounded-full">
                                                                        {pendingRedemptions}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Link>
                                                )}

                                                {/* Tooltip & Favorite Toggle on Hover */}
                                                {isCollapsed && (
                                                    <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover/item:opacity-100 pointer-events-none z-50 whitespace-nowrap">
                                                        {item.label}
                                                    </div>
                                                )}
                                                {!isCollapsed && (
                                                    <button 
                                                        onClick={(e) => toggleFavorite(e, item.id)}
                                                        className={`absolute right-2 top-1/2 -translate-y-1/2 size-6 rounded-lg flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 ${favorites.includes(item.id) ? 'text-amber-400' : 'text-gray-300'}`}
                                                    >
                                                        <Star size={10} className={favorites.includes(item.id) ? 'fill-current' : ''} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Footer / Branch Switcher */}
                <div className="border-t border-gray-100 p-4 space-y-3">
                    {!isCollapsed && <BranchSwitcher />}
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <LogOut size={18} />
                        {!isCollapsed && <span className="text-xs font-black uppercase tracking-widest">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden w-full min-h-0">
                {/* Top Bar */}
                <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 lg:px-8 shrink-0 sticky top-0 z-40">
                    <div className="flex items-center gap-4 flex-1">
                        <button onClick={() => setIsMobileOpen(true)} className="p-2 text-text-secondary hover:bg-gray-50 rounded-xl lg:hidden border border-gray-100">
                            <Menu size={24} />
                        </button>
                        
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0 hidden sm:flex">
                                {currentBranchLogo ? <img src={currentBranchLogo} alt="Logo" className="size-full object-cover p-1" /> : <Zap className="text-primary size-4" />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[8px] font-black uppercase tracking-[0.1em] text-gray-400 leading-none mb-0.5 truncate max-w-[120px]">{currentBranch?.name || businessName}</p>
                                <h1 className="text-sm font-black text-gray-900 leading-none truncate capitalize">
                                    {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Overview'}
                                </h1>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-3">
                        {pendingSetupCount > 0 && (
                            <Link href={withBranch("/dashboard")} className="relative size-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary hover:bg-primary/10 transition-all border border-transparent">
                                <ClipboardCheck size={18} />
                                <span className="absolute -top-1 -right-1 size-4 bg-primary text-white text-[8px] font-black rounded-full border-2 border-white flex items-center justify-center">
                                    {pendingSetupCount}
                                </span>
                            </Link>
                        )}
                        <button onClick={() => setShowNotifications(!showNotifications)} className="relative size-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary transition-all">
                            <Bell size={18} />
                            {unreadCount > 0 && <span className="absolute top-2 right-2 size-1.5 bg-red-500 rounded-full border border-white" />}
                        </button>

                        <div className="h-6 w-px bg-gray-100 mx-1 hidden sm:block" />

                        <div className="relative">
                            <DropdownMenu>
                                <DropdownMenuTrigger>
                                    <button className="size-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm hover:border-primary/20 transition-all">
                                        {currentBranchLogo ? (
                                            <img src={currentBranchLogo} alt="Branch Logo" className="size-full object-cover p-1" />
                                        ) : (
                                            <div className="text-primary font-black text-[10px] uppercase">
                                                {(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')}
                                            </div>
                                        )}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 mt-2" align="end">
                                    <div className="px-3 py-2 border-b border-gray-50 mb-1">
                                        <p className="text-xs font-black text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
                                        <p className="text-[10px] font-bold text-gray-400 truncate">{user?.email}</p>
                                    </div>
                                    <DropdownMenuItem onClick={() => router.push(withBranch('/dashboard/settings/profile'))}>
                                        <User size={14} />
                                        <span>My Profile</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.push(withBranch('/dashboard/settings'))}>
                                        <Settings size={14} />
                                        <span>Settings</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.push(withBranch('/dashboard/support'))}>
                                        <HelpCircle size={14} />
                                        <span>Help & Support</span>
                                    </DropdownMenuItem>
                                    <div className="h-px bg-gray-50 my-1" />
                                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:bg-red-50 hover:text-red-600">
                                        <LogOut size={14} />
                                        <span>Logout</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                <main ref={mainRef} className={`flex-1 bg-gray-50 min-h-0 ${isChatRoute ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                    {children}
                </main>
            </div>

            <UpgradeModal isOpen={upgradeModal.isOpen} onClose={() => setUpgradeModal({ ...upgradeModal, isOpen: false })} featureName={upgradeModal.featureName} />
            <SubscriptionExpiredModal isOpen={isSubscriptionExpired && !pathname.includes('/settings/subscription')} />
            {!(isChatRoute && activeConversationId) && !isCreateAssetPage && <DashboardMobileNav />}
        </div>
    );
}
