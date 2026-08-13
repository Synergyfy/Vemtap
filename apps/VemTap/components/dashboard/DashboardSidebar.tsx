'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
const defaultLogo = '/VEMTAP_PNG.png';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard';
import {
    Home, Users, Gift, BarChart, Users2, Settings,
    ChevronDown, Lock, LogOut, Bell, HelpCircle, MessageSquare, ShieldCheck,
    MessageCircle, LucideIcon, Zap, ShoppingBag, QrCode, AlertCircle, FileText,
    ClipboardCheck, Search, Star, Pin, PinOff, ChevronLeft, ChevronRight, LayoutDashboard,
    X, MoreHorizontal, User, Download, Sun, Moon, Crown, ArrowRight, CheckCircle2,
    Maximize2, Minimize2
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import BranchSwitcher from './BranchSwitcher';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranches } from '@/services/branches/hooks';
import { useMarketingAssets, useAnalyticsOverview } from '@/services/marketing-assets/hooks';
import { useBusinessClaims, useCatalogueOrders } from '@/services/catalogue/hooks';
import { useOnboarding } from '@/hooks/useOnboarding';
import DashboardMobileNav from './DashboardMobileNav';
import { useChatStore } from '@/lib/store/useChatStore';
import Modal from '@/components/ui/Modal';
import UpgradeModal from './UpgradeModal';
import InstallAppModal from './InstallAppModal';
import SubscriptionExpiredModal from './SubscriptionExpiredModal';
import { useSudoStore } from '@/store/useSudoStore';
import { canAccessMenuItem } from '@/lib/utils/nav-filter';
import OwnerSearch from './OwnerSearch';
import toast from 'react-hot-toast';
import { NAVIGATION_SECTIONS, MenuItem, NavSection } from '@/constants/ownerNavigation';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import AICopilotDrawer from '@/components/ai/AICopilotDrawer';
import { useAIStore } from '@/store/useAIStore';
import Tooltip from '@/components/ui/Tooltip';

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
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);
    
    const toggleFullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    };
    
    useEffect(() => {
        setIsMounted(true);
        const savedFavs = localStorage.getItem('vt-sidebar-favs');
        if (savedFavs) setFavorites(JSON.parse(savedFavs));

        setIsCollapsed(true);
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
    const [showInstallModal, setShowInstallModal] = useState(false);
    const isChatRoute = pathname.includes('/messaging/chat');
    const isCreateAssetPage = pathname.includes('/marketing-assets/create');
    const activeConversationId = useChatStore(s => s.activeConversationId);

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
    const mainRef = useRef<HTMLElement | null>(null);

    // Auto-expand the menu corresponding to the current path
    const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
        const pathParts = pathname.split('/');
        if (pathParts.length > 2) return [pathParts[2]];
        return [];
    });

    const [expandedSections, setExpandedSections] = useState<string[]>(['section-dashboard', 'section-customers']);

    const wasCollapsedRef = useRef(false);
    const isAICopilotOpen = useAIStore((state) => state.isCopilotOpen);
    const setCopilotOpen = useAIStore((state) => state.setCopilotOpen);
    const queryClient = useQueryClient();

    const { data } = useQuery({
        queryKey: ['dashboard', activeBranchId],
        queryFn: () => dashboardApi.fetchDashboardData(activeBranchId ?? undefined),
        refetchInterval: 5000,
    });

    const notifications = (data?.notifications || []).filter((n: any) => n.scope === 'DASHBOARD');
    const unreadCount = notifications.filter((n: any) => !n.read).length;
    const { data: claimsData } = useBusinessClaims();
    const pendingRedemptions = (claimsData || []).filter((c: any) => c.status === 'claimed').length;
    const { data: ordersData } = useCatalogueOrders({ branchId: activeBranchId ?? undefined, status: 'new' });
    const newOrdersCount = ordersData?.total ?? 0;

    const { data: assets } = useMarketingAssets();
    const { data: marketingAnalytics } = useAnalyticsOverview();
    const { checklistItems, completedCount, totalCount, percentage: onboardingPercentage } = useOnboarding();
    const pendingSetupCount = totalCount - completedCount;

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

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const toggleMenu = (menuId: string) => {
        setExpandedMenus(prev => prev.includes(menuId) ? [] : [menuId]);
    };

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => prev.includes(sectionId) ? [] : [sectionId]);
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
    const businessName = myBusiness?.name || 'Business Profile';
    const publicProfileHref = getLinkWithBranch(myBusiness?.uniqueCode ? `/b/${myBusiness.uniqueCode}` : `/dashboard/settings/profile`);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden relative">
            {/* Sidebar */}
            <aside className={`
                hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 shrink-0
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
                            <span className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">{businessName}</span>
                        </div>
                    </Link>
                    <button 
                        onClick={toggleCollapse} 
                        className={`size-9 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all ${isCollapsed ? 'mx-auto' : ''}`}
                    >
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                {/* Sidebar Search */}
                {!isCollapsed && (
                    <div className="px-4 mt-6 mb-3">
                        <div className="relative group">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                            <input 
                                type="text"
                                placeholder="Search modules..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-11 bg-gray-50 border border-transparent rounded-xl pl-10 pr-4 text-sm font-medium focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-gray-400"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Navigation Content */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar space-y-4">
                    
                    {/* Main Sections */}
                    {isMounted && filteredSections.map((section) => (
                        <div key={section.id} className="space-y-1">
                            {!isCollapsed && !searchQuery && section.label && (
                                <button 
                                    onClick={() => toggleSection(section.id)}
                                    className="w-full flex items-center justify-between px-4 py-1.5 group"
                                >
                                    <span className="text-base font-semibold text-gray-600 group-hover:text-gray-800 transition-colors">
                                        {section.label}
                                    </span>
                                    <div className={`size-6 rounded-lg flex items-center justify-center transition-all ${
                                        expandedSections.includes(section.id)
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-gray-100/80 text-gray-400'
                                    }`}>
                                        <ChevronDown size={14} className={`transition-transform ${expandedSections.includes(section.id) ? '' : '-rotate-90'}`} />
                                    </div>
                                </button>
                            )}
                            
                            {(searchQuery || expandedSections.includes(section.id) || isCollapsed || !section.label) && (
                                <div className="space-y-0.5">
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
                                                            onClick={(e) => {
                                                                if (isCollapsed) {
                                                                    wasCollapsedRef.current = true;
                                                                    toggleCollapse();
                                                                    return;
                                                                }
                                                                handleItemClick(e, item);
                                                            }}
                                                             className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${
                                                                active ? 'bg-primary/5 text-primary font-semibold' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                {Icon && <div className="shrink-0"><Icon size={20} /></div>}
                                                                {!isCollapsed && <span className="text-[15px] font-semibold truncate">{item.label}</span>}
                                                            </div>
                                                            {!isCollapsed && (
                                                                ['preferences', 'analytics-overview', 'discovery'].includes(item.id) ? (
                                                                    <div className={`size-6 rounded-lg flex items-center justify-center transition-all ${
                                                                        isMenuExpanded ? 'bg-primary/10 text-primary' : 'bg-gray-100/80 text-gray-400'
                                                                    }`}>
                                                                        <ChevronDown size={14} className={`transition-transform ${isMenuExpanded ? '' : '-rotate-90'}`} />
                                                                    </div>
                                                                ) : (
                                                                    <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${isMenuExpanded ? '' : '-rotate-90'}`} />
                                                                )
                                                            )}
                                                        </button>
                                                        {!isCollapsed && isMenuExpanded && (
                                                            <div className="ml-9 space-y-1 border-l border-gray-100 pl-4 py-1">
                                                                 {item.submenu.filter((sub, idx) => {
                                                                     if (isOwnerOrAdmin) return true;
                                                                     const subKey = `${item.permission}:${sub.label.toLowerCase().replace(/\s+/g, '-')}`;
                                                                     if (userPermissions.includes(subKey)) return true;
                                                                     // Fallback: if user has parent permission but no sub-permissions,
                                                                     // show only the first item (main page) as default.
                                                                     if (userPermissions.includes(item.permission!) && idx === 0) return true;
                                                                     return false;
                                                                 }).map((sub, idx) => (
                                                                     <Link 
                                                                          key={idx}
                                                                          href={withBranch(sub.href)}
                                                                          onClick={() => {
                                                                              if (wasCollapsedRef.current) {
                                                                                  wasCollapsedRef.current = false;
                                                                                  toggleCollapse();
                                                                              }
                                                                          }}
                                                                           className={`block text-[15px] font-medium py-2 transition-colors ${
                                                                             isActive(sub.href) ? 'text-primary font-semibold' : 'text-gray-500 hover:text-gray-700'
                                                                         }`}
                                                                     >
                                                                         {sub.label}
                                                                     </Link>
                                                                 ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            if (isCollapsed) {
                                                                wasCollapsedRef.current = true;
                                                                toggleCollapse();
                                                                return;
                                                            }
                                                            router.push(withBranch(item.href!));
                                                            if (wasCollapsedRef.current) {
                                                                wasCollapsedRef.current = false;
                                                                toggleCollapse();
                                                            }
                                                        }}
                                                         className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${
                                                            active ? 'bg-primary/10 text-primary font-semibold border-l-[3px] border-primary' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            {Icon && <div className="shrink-0"><Icon size={20} /></div>}
                                                            {!isCollapsed && <span className="text-[15px] font-semibold truncate">{item.label}</span>}
                                                        </div>
                                                        {!isCollapsed && (
                                                            <div className="flex items-center gap-2">
                                                                {isLocked && <Lock size={14} className="text-gray-400" />}
                                                                {item.id === 'loyalty' && pendingRedemptions > 0 && (
                                                                    <span className="size-4 bg-emerald-500 text-white text-[8px] font-black flex items-center justify-center rounded-full">
                                                                        {pendingRedemptions}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </button>
                                                )}

                                                {/* Tooltip & Favorite Toggle on Hover */}
                                                {isCollapsed && (
                                                    <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg opacity-0 group-hover/item:opacity-100 pointer-events-none z-50 whitespace-nowrap shadow-lg">
                                                        {item.label}
                                                    </div>
                                                )}
                                                {!isCollapsed && (
                                                    <button 
                                                        onClick={(e) => toggleFavorite(e, item.id)}
                                                        className={`absolute right-2 top-1/2 -translate-y-1/2 size-7 rounded-lg flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity ${favorites.includes(item.id) ? 'text-amber-400' : 'text-gray-300 hover:text-gray-400'}`}
                                                    >
                                                        <Star size={12} className={favorites.includes(item.id) ? 'fill-current' : ''} />
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

                {/* Download App */}
                <div className="border-t border-gray-100 px-3 pt-4 pb-2 space-y-1">
                    <button
                        onClick={handleDownloadApp}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${isCollapsed ? 'justify-center' : ''}`}
                        title="Download App"
                    >
                        <Download size={20} className="shrink-0" />
                        {!isCollapsed && <span className="text-[15px] font-semibold truncate">Download App</span>}
                    </button>
                </div>

                {/* Footer / Branch Switcher */}
                <div className="border-t border-gray-100 p-4 space-y-2">
                    {!isCollapsed && <BranchSwitcher />}
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <LogOut size={20} />
                        {!isCollapsed && <span className="text-[15px] font-semibold">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden w-full min-h-0">
                {/* Top Bar */}
                <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 lg:px-8 shrink-0 sticky top-0 z-[300]">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0 hidden sm:flex">
                                {currentBranchLogo ? <img src={currentBranchLogo} alt="Logo" className="size-full object-cover p-1" /> : <Zap className="text-primary size-4" />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-medium text-gray-400 leading-none mb-0.5 truncate max-w-[120px]">{currentBranch?.name || businessName}</p>
                                <h1 className="text-sm font-semibold text-gray-900 leading-none truncate capitalize">
                                    {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Overview'}
                                </h1>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 lg:gap-3">
                        {pendingSetupCount > 0 && (
                            <button onClick={() => setShowTaskModal(true)} className="relative size-8 lg:size-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary hover:bg-primary/10 transition-all border border-transparent">
                                <ClipboardCheck size={15} className="lg:size-[18px]" />
                                <span className="absolute -top-1 -right-1 size-3.5 lg:size-4 bg-primary text-white text-[7px] lg:text-[8px] font-black rounded-full border-2 border-white flex items-center justify-center">
                                    {pendingSetupCount}
                                </span>
                            </button>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger>
                                <button className="relative size-8 lg:size-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary transition-all">
                                    <ShoppingBag size={15} className="lg:size-[18px]" />
                                    {newOrdersCount > 0 && <span className="absolute -top-1 -right-1 min-w-[15px] lg:min-w-[18px] h-[15px] lg:h-[18px] bg-red-500 text-white text-[7px] lg:text-[9px] font-black rounded-full flex items-center justify-center px-0.5 lg:px-1 border-2 border-white">
                                        {newOrdersCount > 99 ? '99+' : newOrdersCount}
                                    </span>}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64 mt-2" align="end">
                                <div className="px-3 py-2 border-b border-gray-50">
                                    <p className="text-xs font-semibold text-gray-900">New Orders</p>
                                </div>
                                {newOrdersCount > 0 ? (
                                    <>
                                        <div className="px-3 py-4 text-center">
                                            <p className="text-sm font-bold text-gray-900">{newOrdersCount} new order{newOrdersCount !== 1 ? 's' : ''}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">awaiting your attention</p>
                                        </div>
                                        <div className="border-t border-gray-50 px-2 py-1.5">
                                            <DropdownMenuItem onClick={() => router.push(withBranch('/dashboard/pos/orders'))} className="rounded-lg">
                                                <ShoppingBag size={14} />
                                                <span>Open Orders</span>
                                            </DropdownMenuItem>
                                        </div>
                                    </>
                                ) : (
                                    <div className="px-3 py-6 text-center">
                                        <ShoppingBag size={20} className="mx-auto text-gray-300 mb-2" />
                                        <p className="text-xs text-gray-400">No new orders</p>
                                    </div>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                            <DropdownMenuTrigger>
                                <button className="relative size-8 lg:size-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary transition-all">
                                    <Bell size={15} className="lg:size-[18px]" />
                                    {unreadCount > 0 && <span className="absolute top-1.5 lg:top-2 right-1.5 lg:right-2 size-1.5 bg-red-500 rounded-full border border-white" />}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-72 mt-2" align="end">
                                <div className="px-3 py-2 border-b border-gray-50 flex items-center justify-between">
                                    <p className="text-xs font-semibold text-gray-900">Notifications</p>
                                    {unreadCount > 0 && (
                                        <button onClick={() => readAllMutation.mutate()} className="text-[10px] text-primary font-semibold hover:underline">
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                {notifications.length > 0 ? (
                                    <>
                                        <div className="max-h-64 overflow-y-auto">
                                            {notifications.slice(0, 5).map((n: any) => (
                                                <DropdownMenuItem key={n.id} className="flex flex-col items-start px-3 py-2.5 border-b border-gray-50 last:border-b-0 rounded-none cursor-default">
                                                    <div className="flex items-start gap-2 w-full">
                                                        <div className={`mt-1 size-2 rounded-full shrink-0 ${n.read ? 'bg-gray-200' : 'bg-primary'}`} />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-semibold text-gray-900 truncate">{n.title}</p>
                                                            <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">{n.message}</p>
                                                            {n.timestamp && (
                                                                <p className="text-[9px] text-gray-300 mt-1">{new Date(n.timestamp).toLocaleDateString()}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-2 ml-4 w-full">
                                                        {n.actionUrl && (
                                                            <button
                                                                onClick={() => {
                                                                    if (!n.read) readNotificationMutation.mutate(n.id);
                                                                    router.push(withBranch(n.actionUrl));
                                                                }}
                                                                className="text-[10px] font-semibold text-primary hover:underline"
                                                            >
                                                                Open
                                                            </button>
                                                        )}
                                                        {!n.read && (
                                                            <button
                                                                onClick={() => readNotificationMutation.mutate(n.id)}
                                                                className="text-[10px] text-gray-400 hover:text-gray-600 hover:underline"
                                                            >
                                                                Dismiss
                                                            </button>
                                                        )}
                                                    </div>
                                                </DropdownMenuItem>
                                            ))}
                                        </div>
                                        <div className="border-t border-gray-50 px-2 py-1.5">
                                            <DropdownMenuItem onClick={() => router.push(withBranch('/dashboard/settings/notifications'))} className="rounded-lg">
                                                <Bell size={14} />
                                                <span>View All Notifications</span>
                                            </DropdownMenuItem>
                                        </div>
                                    </>
                                ) : (
                                    <div className="px-3 py-6 text-center">
                                        <Bell size={20} className="mx-auto text-gray-300 mb-2" />
                                        <p className="text-xs text-gray-400">No messages yet</p>
                                    </div>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <button
                            onClick={toggleFullscreen}
                            className="relative hidden lg:flex size-8 lg:size-9 rounded-lg bg-gray-50 items-center justify-center text-gray-400 hover:text-primary transition-all"
                            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                        >
                            {isFullscreen ? <Minimize2 size={15} className="lg:size-[16px]" /> : <Maximize2 size={15} className="lg:size-[16px]" />}
                        </button>

                        <div className="h-6 w-px bg-gray-100 mx-1 hidden sm:block" />

                        <div className="relative">
                            <DropdownMenu>
                                <DropdownMenuTrigger>
                                    <button className="size-8 lg:size-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm hover:border-primary/20 transition-all">
                                        {currentBranchLogo ? (
                                            <img src={currentBranchLogo} alt="Branch Logo" className="size-full object-cover p-1" />
                                        ) : (
                                            <div className="text-primary font-bold text-[10px] lg:text-xs">
                                                {(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')}
                                            </div>
                                        )}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 mt-2" align="end">
                                    <div className="px-3 py-2 border-b border-gray-50 mb-1">
                                        <p className="text-xs font-semibold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
                                        <p className="text-[10px] font-medium text-gray-400 truncate">{user?.email}</p>
                                        {activeSubscription?.plan?.name && (
                                            <p className="text-[10px] font-semibold text-primary mt-0.5 truncate">
                                                {activeSubscription.plan.name}
                                            </p>
                                        )}
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

            {/* AI Copilot - available on every page */}
            <AICopilotDrawer isOpen={isAICopilotOpen} onClose={() => setCopilotOpen(false)} />

            {/* Task List Modal */}
            <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="Activation Checklist" description={`${pendingSetupCount} of ${totalCount} tasks remaining`} size="md">
                <div className="space-y-3">
                    {/* Progress */}
                    <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${onboardingPercentage}%` }} />
                        </div>
                        <span className="text-xs font-black text-primary">{onboardingPercentage}% Complete</span>
                    </div>
                    {/* Checklist Items */}
                    {checklistItems.filter(i => !i.isCompleted).map((item) => (
                        <button key={item.id} onClick={() => { router.push(withBranch(item.route)); setShowTaskModal(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all text-left group">
                            <div className="size-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center shrink-0">
                                <item.icon size={20} />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <p className="text-sm font-bold text-gray-900">{item.title}</p>
                                <p className="text-xs text-gray-400 font-medium">{item.description}</p>
                            </div>
                            <ArrowRight size={16} className="text-gray-300 group-hover:text-primary transition-colors shrink-0" />
                        </button>
                    ))}
                    {/* All completed state */}
                    {pendingSetupCount === 0 && (
                        <div className="flex flex-col items-center py-8 text-center">
                            <div className="size-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
                                <CheckCircle2 size={24} />
                            </div>
                            <p className="text-sm font-bold text-gray-900">All tasks completed!</p>
                            <p className="text-xs text-gray-400 font-medium mt-1">You're all set up and ready to go.</p>
                        </div>
                    )}
                </div>
            </Modal>

            <UpgradeModal isOpen={upgradeModal.isOpen} onClose={() => setUpgradeModal({ ...upgradeModal, isOpen: false })} featureName={upgradeModal.featureName} />
            <SubscriptionExpiredModal isOpen={isSubscriptionExpired && !pathname.includes('/settings/subscription')} />
            <InstallAppModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} onInstall={handleInstallApp} />
            {!(isChatRoute && activeConversationId) && !isCreateAssetPage && <DashboardMobileNav />}
        </div>
    );
}
