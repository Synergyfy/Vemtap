'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, UserPlus, ShoppingBag, Gift,
    Plus, Send, MessageSquare, QrCode, Zap,
    TrendingUp, ArrowRight,
    BarChart3, Settings as SettingsIcon,
    Activity, Sparkles, FileText, Package,
    ChevronDown, ChevronUp,
    Tag, Handshake, Globe2, MoreHorizontal
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useDashboardAnalytics } from '@/services/analytics/hooks';
import { useBusinessLoyaltyStats } from '@/services/loyalty/hooks';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranches } from '@/services/branches/hooks';
import { useCatalogueOffersAdmin } from '@/services/catalogue/hooks';
import DashboardBannerWrapper from '@/components/dashboard/DashboardBannerWrapper';
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist';
import CreateDealPromptModal from '@/components/dashboard/CreateDealPromptModal';
import { Button } from '@/components/ui/button';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard';

import { PageGuideButton, AICopilotButton } from '@/components/ai';
import InstallAppButton from '@/components/shared/InstallAppButton';
import { useAIStore } from '@/store/useAIStore';

export default function DashboardPage() {
    const router = useRouter();
    const [isHealthExpanded, setIsHealthExpanded] = useState(false);
    const [isActivityExpanded, setIsActivityExpanded] = useState(false);
    const [showDealPrompt, setShowDealPrompt] = useState(false);
    const [showBannerMenu, setShowBannerMenu] = useState(false);
    const user = useAuthStore((state) => state.user);
    const { activeBranchId, getLinkWithBranch } = useActiveBranch();
    const { data: myBusiness } = useMyBusiness();
    const { data: branches = [] } = useBranches();
    const { data: analytics, isLoading: isAnalyticsLoading } = useDashboardAnalytics();
    const { data: loyaltyStats } = useBusinessLoyaltyStats();
    const { data: dashboard } = useQuery({
        queryKey: ['dashboard', activeBranchId],
        queryFn: () => dashboardApi.fetchDashboardData(activeBranchId ?? undefined),
    });
    const { data: offers, isLoading: isOffersLoading } = useCatalogueOffersAdmin(
        activeBranchId ? { branchId: activeBranchId } : {},
        { enabled: !!activeBranchId }
    );

    useEffect(() => {
        if (!isOffersLoading && activeBranchId && offers && offers.length === 0) {
            const dismissed = sessionStorage.getItem('deal_prompt_dismissed');
            if (!dismissed) {
                setShowDealPrompt(true);
            }
        }
    }, [isOffersLoading, activeBranchId, offers]);

    const activeBranch = branches.find(b => b.id === activeBranchId);
    const businessName = user?.businessName || myBusiness?.name;
    
    const branchDisplayName = useMemo(() => {
        if (!activeBranchId) return 'All Locations';
        const normalized = (activeBranch?.name || '').trim();
        const isDefaultLabel = /^main\s*branch$/i.test(normalized);
        if (activeBranch?.isMainBranch && (isDefaultLabel || !normalized) && businessName) return businessName;
        return normalized || businessName || 'Main Branch';
    }, [activeBranch, activeBranchId, businessName]);

    // KPI Data Mapping
    const kpis = useMemo(() => {
        const analyticsStats = analytics?.stats || [];
        const dashboardStats = dashboard ? [
            { label: 'Total Visitors', value: dashboard.stats.totalVisitors.toString() },
            { label: 'New Customers Today', value: dashboard.stats.todaysVisits.toString() }
        ] : [];
        const allStats = analyticsStats.length > 0 ? analyticsStats : dashboardStats;
        
        const totalVisitors = allStats.find(s => s.label.toLowerCase().includes('total visitors'))?.value || '0';
        const customersCaptured = allStats.find(s => s.label.toLowerCase().includes('new customers'))?.value ||
                                  allStats.find(s => s.label.toLowerCase().includes('new visitors'))?.value || '0';
        const salesValue = allStats.find(s => s.label.toLowerCase().includes('sales'))?.value ||
                          allStats.find(s => s.label.toLowerCase().includes('revenue'))?.value || '₦0';
        const activeLoyalty = loyaltyStats?.stats?.find(s => s.label.toLowerCase().includes('active'))?.value || '0';
        
        return [
            { label: "Total Visitors", value: totalVisitors, icon: Users, color: 'bg-blue-500' },
            { label: "Customers Captured", value: customersCaptured, icon: UserPlus, color: 'bg-emerald-500' },
            { label: "Sales Today", value: salesValue, icon: ShoppingBag, color: 'bg-purple-500' },
            { label: "Active Loyalty Members", value: activeLoyalty, icon: Gift, color: 'bg-amber-500' }
        ];
    }, [analytics, loyaltyStats, dashboard]);

    // Format recent activity
    const recentActivity = useMemo(() => {
        if (analytics?.recentVisitors && analytics.recentVisitors.length > 0) return analytics.recentVisitors;
        if (dashboard?.recentVisitors && dashboard.recentVisitors.length > 0) {
            return dashboard.recentVisitors.slice(0, 5).map((v: any) => ({
                name: v.name,
                status: v.status === 'new' ? 'new' : 'returning',
                time: v.time
            }));
        }
        return [];
    }, [analytics, dashboard]);

    // --- AI Integration ---
    const triggerAnalysis = useAIStore((state) => state.triggerAnalysis);
    const refreshKey = useAIStore((state) => state.refreshKeys['dashboard'] ?? 0);

    const aiContext = useMemo(() => {
        const toNum = (v: unknown) => parseInt(String(v ?? '').replace(/[^0-9]/g, '') || '0', 10);
        const visitors = toNum(kpis[0]?.value);
        const revenue = toNum(kpis[2]?.value);
        return {
            totalCustomers: visitors,
            totalRevenue: revenue,
            totalVisitors: visitors,
            averageSpending: visitors > 0 ? Math.round(revenue / visitors) : 0,
            repeatCustomerRate: dashboard?.stats?.repeatVisitors && dashboard?.stats?.totalVisitors
                ? Math.round((dashboard.stats.repeatVisitors / dashboard.stats.totalVisitors) * 100)
                : undefined,
            activeCampaigns: 0,
        };
    }, [kpis, dashboard]);

    const handleRefreshAnalysis = useCallback(() => {
        triggerAnalysis('dashboard', aiContext);
    }, [triggerAnalysis, aiContext]);

    const handleDealPromptClose = useCallback(() => {
        sessionStorage.setItem('deal_prompt_dismissed', '1');
        setShowDealPrompt(false);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <CreateDealPromptModal isOpen={showDealPrompt} onClose={handleDealPromptClose} />
            <main className="p-4 sm:p-6 max-w-7xl mx-auto">
                <div className="space-y-6">
                        {/* 1. NATIVE APP HEADER SECTION */}
                        <section className="relative bg-[#066CF4] -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 px-4 sm:px-6 pt-5 pb-14 rounded-b-xl shadow-lg mb-6">
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                <Sparkles size={120} />
                            </div>
                            
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <p className="text-blue-100/70 text-[9px] font-semibold uppercase tracking-widest mb-0.5">
                                            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <h1 className="text-base md:text-lg font-semibold text-white/90 tracking-tight">
                                                {user?.firstName || 'Owner'}
                                            </h1>
                                            {isAnalyticsLoading && (
                                                <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="relative shrink-0">
                                        <button onClick={() => setShowBannerMenu(!showBannerMenu)} className="size-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                                            <MoreHorizontal size={18} />
                                        </button>
                                        {showBannerMenu && (
                                            <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-1.5 flex flex-col gap-1 z-20 min-w-[180px]">
                                                <div onClick={() => setShowBannerMenu(false)} className="flex items-center gap-2 px-2 py-1">
                                                    <PageGuideButton />
                                                    <span className="text-xs font-semibold text-gray-700">Guide</span>
                                                </div>
                                                <div onClick={() => setShowBannerMenu(false)} className="flex items-center gap-2 px-2 py-1">
                                                    <AICopilotButton />
                                                    <span className="text-xs font-semibold text-gray-700">AI Copilot</span>
                                                </div>
                                                <div onClick={() => setShowBannerMenu(false)} className="flex items-center gap-2 px-2 py-1">
                                                    <InstallAppButton iconOnly />
                                                    <span className="text-xs font-semibold text-gray-700">Install App</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Main Highlight — money is hero */}
                                <div className="pt-1 pb-1">
                                    <p className="text-blue-100/60 text-[10px] font-medium tracking-wider mb-1 flex items-center gap-1.5">
                                        <ShoppingBag size={12} /> Today's Sales
                                    </p>
                                    <h2 className="text-[32px] md:text-5xl font-black text-white tracking-tight leading-none">
                                        {kpis[2]?.value || '₦0'}
                                    </h2>
                                </div>
                            </div>

                            {/* Overlapping Snapshot Cards */}
                            <div className="absolute left-0 right-0 -bottom-10 px-4 sm:px-6">
                                <div className="grid grid-cols-3 gap-3 md:gap-4">
                                    {[kpis[0], kpis[1], kpis[3]].map((kpi, i) => (
                                        <div 
                                            key={i}
                                            className="w-full bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col gap-2 sm:gap-3 h-[88px] sm:h-[100px] border border-gray-100 relative overflow-hidden backdrop-blur-sm"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-blue-50/30 pointer-events-none" />
                                            <div className="absolute -right-2 -bottom-2 opacity-[0.04] pointer-events-none">
                                                <kpi.icon size={64} />
                                            </div>
                                            <div className={`size-7 sm:size-8 rounded-full ${kpi.color} text-white flex items-center justify-center shadow-sm z-10 shrink-0`}>
                                                <kpi.icon size={14} className="sm:w-3.5 sm:h-3.5" />
                                            </div>
                                            <div className="flex flex-col gap-0.5 z-10">
                                                <p className="text-sm sm:text-base font-black text-gray-900 tracking-tight truncate leading-none">{kpi.value}</p>
                                                <p className="text-[7px] sm:text-[8px] font-bold text-gray-400 leading-tight truncate uppercase tracking-wider">{kpi.label}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Adjust spacing for content below the overlapping cards */}
                        <div className="pt-6 space-y-6">
                            <DashboardBannerWrapper onAnalyzeDashboard={handleRefreshAnalysis} />
                            <OnboardingChecklist />

                        {/* 3. QUICK ACTIONS (Visually Prominent Grid) */}
                        <section>
                            <div className="flex items-center justify-between mb-2.5">
                                <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Quick Actions</h2>
                            </div>
                            <div className="grid grid-cols-4 gap-2 md:gap-3">
                                {useMemo(() => {
                                    const role = (user?.role as string)?.toLowerCase() || 'owner';
                                    if (role === 'cashier') {
                                        return [
                                            { label: 'New Sale', icon: Plus, color: 'text-purple-600 bg-purple-50/50 border-purple-100/50', route: '/dashboard/pos' },
                                            { label: 'Sales History', icon: Activity, color: 'text-blue-600 bg-blue-50/50 border-blue-100/50', route: '/dashboard/pos' },
                                            { label: 'Receipts', icon: FileText, color: 'text-gray-600 bg-gray-50/50 border-gray-100/50', route: '/dashboard/pos' }
                                        ];
                                    }
                                    if (role === 'inventory') {
                                        return [
                                            { label: 'Stock Count', icon: Package, color: 'text-emerald-600 bg-emerald-50/50 border-emerald-100/50', route: '/dashboard/inventory' },
                                            { label: 'Adjust Inventory', icon: SettingsIcon, color: 'text-amber-600 bg-amber-50/50 border-amber-100/50', route: '/dashboard/inventory' },
                                            { label: 'Inventory Report', icon: BarChart3, color: 'text-indigo-600 bg-indigo-50/50 border-indigo-100/50', route: '/dashboard/inventory' }
                                        ];
                                    }
                                    if (role === 'marketing') {
                                        return [
                                            { label: 'My Business QR', icon: QrCode, color: 'text-emerald-600 bg-emerald-50/50 border-emerald-100/50', route: '/dashboard/customer-experience' },
                                            { label: 'Marketing Kit', icon: Sparkles, color: 'text-purple-600 bg-purple-50/50 border-purple-100/50', route: '/dashboard/marketing-assets' },
                                            { label: 'Channels', icon: Zap, color: 'text-blue-600 bg-blue-50/50 border-blue-100/50', route: '/dashboard/messaging/sms' },
                                            { label: 'Campaigns', icon: Send, color: 'text-amber-600 bg-amber-50/50 border-amber-100/50', route: '/dashboard/marketing-assets/create' }
                                        ];
                                    }
                                    if (role === 'customer_service') {
                                        return [
                                            { label: 'Visitors', icon: Users, color: 'text-blue-600 bg-blue-50/50 border-blue-100/50', route: '/dashboard/visitors' },
                                            { label: 'Chat', icon: MessageSquare, color: 'text-indigo-600 bg-indigo-50/50 border-indigo-100/50', route: '/dashboard/messaging/chat' },
                                            { label: 'Forms', icon: FileText, color: 'text-rose-600 bg-rose-50/50 border-rose-100/50', route: '/dashboard/engagement/forms' },
                                            { label: 'Loyalty', icon: Gift, color: 'text-amber-600 bg-amber-50/50 border-amber-100/50', route: '/dashboard/loyalty' }
                                        ];
                                    }
                                    // Default / Owner / Manager
                                    return [
                                        { label: 'Create Deals', icon: Tag, color: 'text-orange-600 bg-orange-50/50 border-orange-100/50', route: '/dashboard/discovery/deals' },
                                        { label: 'POS Terminal', icon: ShoppingBag, color: 'text-blue-600 bg-blue-50/50 border-blue-100/50', route: '/dashboard/pos' },
                                        { label: 'Add Product', icon: Package, color: 'text-emerald-600 bg-emerald-50/50 border-emerald-100/50', route: '/dashboard/catalogue/products?action=add' },
                                        { label: 'Refer a Business', icon: UserPlus, color: 'text-rose-600 bg-rose-50/50 border-rose-100/50', route: '/dashboard/business-partnership' }
                                    ];
                                }, [user?.role]).map((action, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => router.push(getLinkWithBranch(action.route))}
                                        className={`w-full bg-white border border-gray-100 rounded-xl px-1.5 py-3 sm:px-3 sm:py-4 flex flex-col items-center gap-1.5 sm:gap-2 active:scale-[0.98] transition-all shadow-sm group hover:border-primary/20 hover:shadow-md`}
                                    >
                                        <div className={`size-9 sm:size-10 rounded-xl ${action.color} border shrink-0 flex items-center justify-center transition-transform group-hover:scale-110`}>
                                            <action.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                                        </div>
                                        <span className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-700 leading-tight text-center line-clamp-2">{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* 4. BUSINESS HEALTH (Indicators) */}
                        <section className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-6 cursor-pointer group" onClick={() => setIsHealthExpanded(!isHealthExpanded)}>
                                <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Business Health</h2>
                                <div className="flex gap-3 items-center">
                                    <span className="text-[10px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                                        {isHealthExpanded ? 'Collapse' : 'Expand'}
                                    </span>
                                    <div className="size-8 rounded-lg bg-gray-50 flex items-center justify-center text-primary group-hover:bg-primary/5 transition-colors">
                                        {isHealthExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </div>
                            </div>
                            {(() => {
                                const healthMetrics = analytics?.topPerformers?.length ? analytics.topPerformers.map(p => ({
                                    label: p.label,
                                    value: p.type === 'up' ? 75 : 45,
                                    color: 'bg-blue-500',
                                    trend: p.type === 'up' ? '+12%' : '+5%'
                                })) : [
                                    { label: 'Customer Growth', value: 75, color: 'bg-blue-500', trend: '+12%' },
                                    { label: 'QR Scan Activity', value: 90, color: 'bg-emerald-500', trend: '+28%' },
                                ];
                                // Single chart with two lines — POS Orders style
                                const chartData = [
                                    { name: 'Mon', growth: Math.max(10, healthMetrics[0].value - 35), scans: Math.max(15, (healthMetrics[1]?.value || 90) - 40) },
                                    { name: 'Tue', growth: Math.max(15, healthMetrics[0].value - 25), scans: Math.max(20, (healthMetrics[1]?.value || 90) - 28) },
                                    { name: 'Wed', growth: Math.max(20, healthMetrics[0].value - 16), scans: Math.max(30, (healthMetrics[1]?.value || 90) - 18) },
                                    { name: 'Thu', growth: Math.max(25, healthMetrics[0].value - 8), scans: Math.max(40, (healthMetrics[1]?.value || 90) - 8) },
                                    { name: 'Fri', growth: healthMetrics[0].value, scans: healthMetrics[1]?.value || 90 },
                                ];
                                
                                return (
                                    <>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="flex items-center gap-1.5">
                                                <span className="size-2.5 rounded-full bg-[#3b82f6]" />
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{healthMetrics[0].label}</span>
                                                <span className="text-[10px] font-bold text-emerald-500 ml-1">{healthMetrics[0].trend}</span>
                                            </div>
                                            {healthMetrics[1] && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="size-2.5 rounded-full bg-[#10b981]" />
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{healthMetrics[1].label}</span>
                                                    <span className="text-[10px] font-bold text-emerald-500 ml-1">{healthMetrics[1].trend}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="h-[160px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData}>
                                                    <defs>
                                                        <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id="scansGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12, fontWeight: 700 }} />
                                                    <Area type="monotone" dataKey="growth" stroke="#3b82f6" fill="url(#growthGradient)" strokeWidth={2} name={healthMetrics[0].label} />
                                                    {healthMetrics[1] && <Area type="monotone" dataKey="scans" stroke="#10b981" fill="url(#scansGradient)" strokeWidth={2} strokeDasharray="4 4" name={healthMetrics[1].label} />}
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <AnimatePresence>
                                            {isHealthExpanded && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }} 
                                                    animate={{ height: 'auto', opacity: 1 }} 
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden mt-4"
                                                >
                                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                                        {healthMetrics.map((m:any) => (
                                                            <div key={m.label} className="text-center">
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{m.label}</p>
                                                                <p className="text-lg font-black text-gray-900">{m.value}%</p>
                                                                <p className="text-[10px] font-bold text-emerald-500">{m.trend} vs last week</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </>
                                );
                            })()}
                        </section>

                        {/* 5. RECENT ACTIVITY (Feed) */}
                        <section>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Recent Activity</h2>
                                <button 
                                    onClick={() => router.push('/dashboard/notifications')}
                                    className="text-[10px] font-semibold uppercase tracking-wider text-primary hover:text-primary/70 transition-colors cursor-pointer"
                                >
                                    View All
                                </button>
                            </div>
                            {recentActivity.length > 0 ? (
                                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="divide-y divide-gray-50">
                                        {recentActivity.slice(0, 1).map((visitor: any, i: number) => (
                                            <div key={`first-${i}`} className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50/60 transition-colors">
                                                <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                                                    visitor.status === 'new'
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        : 'bg-blue-50 text-blue-600 border-blue-100'
                                                }`}>
                                                    <Activity size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0 flex items-center gap-2.5">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{visitor.name || 'New Visitor'}</p>
                                                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                                        visitor.status === 'new'
                                                            ? 'bg-emerald-50 text-emerald-600'
                                                            : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                        <span className={`size-1 rounded-full ${visitor.status === 'new' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                                        {visitor.status === 'new' ? 'New' : 'Returning'}
                                                    </span>
                                                </div>
                                                <span className="shrink-0 text-[10px] font-semibold text-gray-400">{visitor.time || 'Just now'}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <AnimatePresence>
                                        {isActivityExpanded && recentActivity.length > 1 && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }} 
                                                animate={{ height: 'auto', opacity: 1 }} 
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="divide-y divide-gray-50 border-t border-gray-100">
                                                    {recentActivity.slice(1).map((visitor: any, i: number) => (
                                                        <div key={`rest-${i}`} className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50/60 transition-colors">
                                                            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                                                                visitor.status === 'new'
                                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                    : 'bg-blue-50 text-blue-600 border-blue-100'
                                                            }`}>
                                                                <Activity size={18} />
                                                            </div>
                                                            <div className="flex-1 min-w-0 flex items-center gap-2.5">
                                                                <p className="text-sm font-semibold text-gray-900 truncate">{visitor.name || 'New Visitor'}</p>
                                                                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                                                    visitor.status === 'new'
                                                                        ? 'bg-emerald-50 text-emerald-600'
                                                                        : 'bg-blue-50 text-blue-600'
                                                                }`}>
                                                                    <span className={`size-1 rounded-full ${visitor.status === 'new' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                                                    {visitor.status === 'new' ? 'New' : 'Returning'}
                                                                </span>
                                                            </div>
                                                            <span className="shrink-0 text-[10px] font-semibold text-gray-400">{visitor.time || 'Just now'}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    {recentActivity.length > 1 && (
                                        <button
                                            onClick={() => setIsActivityExpanded(!isActivityExpanded)}
                                            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-primary hover:bg-gray-50/70 transition-colors border-t border-gray-100 cursor-pointer"
                                        >
                                            {isActivityExpanded ? (
                                                <>
                                                    Collapse <ChevronUp size={12} />
                                                </>
                                            ) : (
                                                <>
                                                    Show all ({recentActivity.length}) <ChevronDown size={12} />
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-5">
                                    <div className="size-16 rounded-2xl bg-[#066CF4]/5 flex items-center justify-center text-gray-300 border border-[#066CF4]/10">
                                        <Users size={32} strokeWidth={1.2} />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-lg font-bold text-text-main tracking-tight">Your first customer is waiting</h4>
                                        <p className="text-sm text-gray-400 leading-relaxed max-w-[280px] mx-auto">
                                            Create your QR code and start capturing customers today. Let&apos;s bring them back.
                                        </p>
                                    </div>
                                    <Button 
                                        onClick={() => router.push('/dashboard/customer-experience')}
                                        className="h-11 px-6 rounded-xl bg-[#066CF4] text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
                                    >
                                        <Plus size={16} />
                                        My Business QR
                                    </Button>
                                </div>
                            )}
                        </section>

                        {/* 6. MANAGE YOUR BUSINESS (Main Modules) */}
                        <section className="space-y-3">
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Manage Your Business</h2>
                            <div className="grid grid-cols-4 gap-2 md:gap-3">
                                {[
                                    { 
                                        title: 'Customers', 
                                        desc: 'Visitors, Loyalty & Messaging', 
                                        icon: Users, 
                                        color: 'text-blue-600 bg-blue-50',
                                        route: '/dashboard/visitors'
                                    },
                                    { 
                                        title: 'Deals', 
                                        desc: 'Promotions, Offers & Discovery', 
                                        icon: Tag, 
                                        color: 'text-orange-600 bg-orange-50',
                                        route: '/dashboard/discovery/deals'
                                    },
                                    { 
                                        title: 'Sales', 
                                        desc: 'Inventory, Catalogue & POS', 
                                        icon: ShoppingBag, 
                                        color: 'text-purple-600 bg-purple-50',
                                        route: '/dashboard/catalogue'
                                    },
                                    { 
                                        title: 'Partnership', 
                                        desc: 'Network, Agreements & Earnings', 
                                        icon: Handshake, 
                                        color: 'text-emerald-600 bg-emerald-50',
                                        route: '/dashboard/business-partnership'
                                    },
                                    { 
                                        title: 'Insights', 
                                        desc: 'Analytics & Performance', 
                                        icon: BarChart3, 
                                        color: 'text-amber-600 bg-amber-50',
                                        route: '/dashboard/analytics'
                                    },
                                    { 
                                        title: 'Channels', 
                                        desc: 'SMS, WhatsApp & Email', 
                                        icon: Globe2, 
                                        color: 'text-sky-600 bg-sky-50',
                                        route: '/dashboard/messaging'
                                    },
                                    { 
                                        title: 'Loyalty', 
                                        desc: 'Rewards, Points & Redemptions', 
                                        icon: Gift, 
                                        color: 'text-rose-600 bg-rose-50',
                                        route: '/dashboard/loyalty'
                                    },
                                    { 
                                        title: 'Settings', 
                                        desc: 'Business & Account Config', 
                                        icon: SettingsIcon, 
                                        color: 'text-gray-600 bg-gray-50',
                                        route: '/dashboard/settings'
                                    }
                                ].map((module, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => router.push(module.route)}
                                        className="w-full bg-white border border-gray-100 px-2 py-3 sm:px-3 sm:py-3.5 rounded-xl flex flex-col items-center gap-2 shadow-sm active:scale-[0.98] transition-all text-center group hover:border-primary/20 hover:shadow-md"
                                    >
                                        <div className={`size-9 sm:size-10 rounded-xl ${module.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                            <module.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-[10px] sm:text-xs font-bold text-text-main leading-tight line-clamp-1">{module.title}</h3>
                                            <p className="text-[8px] sm:text-[9px] font-medium text-gray-400 leading-tight line-clamp-2 hidden sm:block">{module.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>
                    </div>
            </main>
        </div>
    );
}
