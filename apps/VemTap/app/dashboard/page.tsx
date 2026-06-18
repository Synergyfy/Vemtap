'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, UserPlus, ShoppingBag, Gift, Bell, 
    Plus, Send, MessageSquare, QrCode, Zap, 
    TrendingUp, ArrowRight, UserCheck, Search,
    ChevronRight, BarChart3, Settings as SettingsIcon,
    PieChart, Activity, Sparkles, FileText, Package,
    ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useDashboardAnalytics } from '@/services/analytics/hooks';
import { useBusinessLoyaltyStats } from '@/services/loyalty/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranches } from '@/services/branches/hooks';
import DashboardBannerWrapper from '@/components/dashboard/DashboardBannerWrapper';
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist';
import { Button } from '@/components/ui/button';

import { useMockDashboardStore } from '@/lib/store/mockDashboardStore';

export default function DashboardPage() {
    const router = useRouter();
    const [isHealthExpanded, setIsHealthExpanded] = useState(false);
    const [isActivityExpanded, setIsActivityExpanded] = useState(false);
    const user = useAuthStore((state) => state.user);
    const { activeBranchId } = useActiveBranch();
    const { data: myBusiness } = useMyBusiness();
    const { data: branches = [] } = useBranches();
    const { data: analytics, isLoading: isAnalyticsLoading } = useDashboardAnalytics();
    const { data: loyaltyStats } = useBusinessLoyaltyStats();

    const activeBranch = branches.find(b => b.id === activeBranchId);
    const businessName = user?.businessName || myBusiness?.name;
    
    const branchDisplayName = useMemo(() => {
        if (!activeBranchId) return 'All Locations';
        const normalized = (activeBranch?.name || '').trim();
        const isDefaultLabel = /^main\s*branch$/i.test(normalized);
        if (activeBranch?.isMainBranch && (isDefaultLabel || !normalized) && businessName) return businessName;
        return normalized || businessName || 'Main Branch';
    }, [activeBranch, activeBranchId, businessName]);
    
    // Fallback Mock Data
    const mockStats = useMockDashboardStore((state) => state.stats);
    const mockVisitors = useMockDashboardStore((state) => state.visitors);

    // KPI Data Mapping
    const kpis = useMemo(() => {
        // Use real analytics if available, otherwise fallback to mock data
        const stats = analytics?.stats || [
            { label: 'Total Visitors', value: mockStats.totalVisitors.toString() },
            { label: 'New Customers Today', value: mockStats.todaysVisits.toString() }
        ];
        
        const visitorsToday = stats.find(s => s.label.toLowerCase().includes('total visitors'))?.value || mockStats.todaysVisits.toString();
        const customersCaptured = stats.find(s => s.label.toLowerCase().includes('new customers'))?.value || (mockStats.todaysVisits * 0.7).toFixed(0);
        const activeLoyalty = loyaltyStats?.stats?.find(s => s.label.toLowerCase().includes('active'))?.value || '124';
        
        return [
            { label: "Today's Visitors", value: visitorsToday, icon: Users, color: 'bg-blue-500' },
            { label: "Customers Captured", value: customersCaptured, icon: UserPlus, color: 'bg-emerald-500' },
            { label: "Sales Today", value: "₦45,200", icon: ShoppingBag, color: 'bg-purple-500' }, 
            { label: "Active Loyalty Members", value: activeLoyalty, icon: Gift, color: 'bg-amber-500' }
        ];
    }, [analytics, loyaltyStats, mockStats]);

    // Format recent activity from analytics or mock data
    const recentActivity = useMemo(() => {
        if (analytics?.recentVisitors && analytics.recentVisitors.length > 0) return analytics.recentVisitors;
        return mockVisitors.slice(0, 5).map(v => ({
            name: v.name,
            status: v.status === 'new' ? 'new' : 'returning',
            time: v.time
        }));
    }, [analytics, mockVisitors]);

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <main className="p-6 space-y-8 max-w-7xl mx-auto">
                {/* 1. TOP SECTION: Greeting & Branding */}
                <section className="space-y-1">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.firstName || 'Owner'}
                        </h1>
                        {isAnalyticsLoading && (
                            <div className="size-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        )}
                    </div>
                </section>

                <DashboardBannerWrapper />

                <OnboardingChecklist />

                {/* 2. BUSINESS SNAPSHOT (Horizontal swipeable cards) */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Snapshot</h2>
                        <div className="flex gap-1">
                            <div className="size-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(6,108,244,0.4)]" />
                            <div className="size-1.5 bg-gray-200 rounded-full" />
                        </div>
                    </div>
                    <div className="flex overflow-x-auto no-scrollbar gap-4 -mx-6 px-6 snap-x pb-2">
                        {kpis.map((kpi, i) => (
                            <div 
                                key={i}
                                className="min-w-[190px] bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm snap-center flex flex-col justify-between h-36 group hover:border-primary/20 transition-all hover:shadow-md"
                            >
                                <div className={`size-10 rounded-2xl ${kpi.color} text-white flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg shadow-current/10`}>
                                    <kpi.icon size={20} />
                                </div>
                                <div>
                                    <p className="text-3xl font-black text-gray-900 mb-0.5 leading-none tracking-tight">{kpi.value}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none">{kpi.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. QUICK ACTIONS (Visually Prominent Grid) */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Quick Actions</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                                    { label: 'Marketing Assets', icon: Sparkles, color: 'text-purple-600 bg-purple-50/50 border-purple-100/50', route: '/dashboard/marketing-assets' },
                                    { label: 'Channels', icon: Zap, color: 'text-blue-600 bg-blue-50/50 border-blue-100/50', route: '/dashboard/customer-capture/channels' },
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
                                { label: 'New Sale', icon: ShoppingBag, color: 'text-purple-600 bg-purple-50/50 border-purple-100/50', route: '/dashboard/commerce' },
                                { label: 'Add Customer', icon: UserPlus, color: 'text-blue-600 bg-blue-50/50 border-blue-100/50', route: '/dashboard/visitors/add' },
                                { label: 'Send Message', icon: Send, color: 'text-indigo-600 bg-indigo-50/50 border-indigo-100/50', route: '/dashboard/messaging' },
                                { label: 'Create Campaign', icon: Zap, color: 'text-amber-600 bg-amber-50/50 border-amber-100/50', route: '/dashboard/marketing-assets/create' },
                                { label: 'My Business QR', icon: QrCode, color: 'text-emerald-600 bg-emerald-50/50 border-emerald-100/50', route: '/dashboard/customer-experience' },
                                { label: 'Capture Visitor', icon: UserCheck, color: 'text-rose-600 bg-rose-50/50 border-rose-100/50', route: '/dashboard/visitors' }
                            ];
                        }, [user?.role]).map((action, i) => (
                            <button 
                                key={i}
                                onClick={() => router.push(action.route)}
                                className={`bg-white border border-gray-100 p-6 rounded-[2.5rem] flex flex-col items-center gap-4 active:scale-95 transition-all shadow-sm group hover:border-primary/20 hover:shadow-md`}
                            >
                                <div className={`size-16 rounded-[1.5rem] ${action.color} border flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                                    <action.icon size={28} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* 4. BUSINESS HEALTH (Indicators) */}
                <section className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8 cursor-pointer group" onClick={() => setIsHealthExpanded(!isHealthExpanded)}>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Business Health</h2>
                        <div className="flex gap-3 items-center">
                            <span className="text-[10px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                                {isHealthExpanded ? 'Collapse' : 'Expand'}
                            </span>
                            <div className="size-10 rounded-2xl bg-gray-50 flex items-center justify-center text-primary group-hover:bg-primary/5 transition-colors">
                                {isHealthExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </div>
                    </div>
                    {(() => {
                        const healthMetrics = [
                            { label: 'Customer Growth', value: 75, color: 'bg-blue-500', trend: '+12%' },
                            { label: 'Sales Growth', value: 45, color: 'bg-purple-500', trend: '+5%' },
                            { label: 'QR Scan Activity', value: 90, color: 'bg-emerald-500', trend: '+28%' },
                            { label: 'Referral Activity', value: 30, color: 'bg-amber-500', trend: '+2%' }
                        ];
                        const renderItem = (item: any) => (
                            <div key={item.label} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{item.label}</span>
                                    <div className="flex items-center gap-1">
                                        <TrendingUp size={10} className="text-emerald-500" />
                                        <span className="text-[10px] font-black text-emerald-500">{item.trend}</span>
                                    </div>
                                </div>
                                <div className="h-2.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.value}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className={`h-full ${item.color} rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]`} 
                                    />
                                </div>
                            </div>
                        );
                        
                        return (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {healthMetrics.slice(0, 1).map(renderItem)}
                                </div>
                                <AnimatePresence>
                                    {isHealthExpanded && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }} 
                                            animate={{ height: 'auto', opacity: 1 }} 
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden mt-8"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {healthMetrics.slice(1).map(renderItem)}
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
                    <div className="flex items-center justify-between mb-4 px-1 cursor-pointer group" onClick={() => setIsActivityExpanded(!isActivityExpanded)}>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Recent Activity</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                                {isActivityExpanded ? 'Collapse' : 'Expand'}
                            </span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); router.push('/dashboard/notifications'); }}
                                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm"
                            >
                                View All
                            </button>
                            <div className="text-gray-400 group-hover:text-primary transition-colors flex items-center justify-center bg-white size-7 rounded-full border border-gray-100 shadow-sm">
                                {isActivityExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                        </div>
                    </div>
                    {recentActivity.length > 0 ? (
                        <>
                            <div className="space-y-3">
                                {recentActivity.slice(0, 1).map((visitor: any, i: number) => (
                                    <div key={`first-${i}`} className="bg-white border border-gray-100 p-5 rounded-[2rem] flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="size-12 rounded-2xl bg-gray-50 flex items-center justify-center text-primary border border-gray-100">
                                            <Activity size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-gray-900 truncate">{visitor.name || 'New Visitor'}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{visitor.status === 'new' ? 'New visitor captured' : 'Returning visitor'}</p>
                                        </div>
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">{visitor.time || 'Just now'}</p>
                                    </div>
                                ))}
                            </div>
                            <AnimatePresence>
                                {isActivityExpanded && recentActivity.length > 1 && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }} 
                                        animate={{ height: 'auto', opacity: 1 }} 
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden mt-3"
                                    >
                                        <div className="space-y-3">
                                            {recentActivity.slice(1).map((visitor: any, i: number) => (
                                                <div key={`rest-${i}`} className="bg-white border border-gray-100 p-5 rounded-[2rem] flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="size-12 rounded-2xl bg-gray-50 flex items-center justify-center text-primary border border-gray-100">
                                                        <Activity size={20} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-black text-gray-900 truncate">{visitor.name || 'New Visitor'}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{visitor.status === 'new' ? 'New visitor captured' : 'Returning visitor'}</p>
                                                    </div>
                                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">{visitor.time || 'Just now'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    ) : (
                        <div className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-6">
                            <div className="size-24 rounded-[2rem] bg-[#066CF4]/5 flex items-center justify-center text-gray-300 border border-[#066CF4]/10">
                                <Users size={48} strokeWidth={1} />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xl font-black text-gray-900 tracking-tight">No Customers Yet</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed max-w-[240px] mx-auto">
                                    Start by getting your first QR code to capture visitors.
                                </p>
                            </div>
                            <Button 
                                onClick={() => router.push('/dashboard/customer-experience')}
                                className="h-14 px-10 rounded-2xl bg-[#066CF4] text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Plus size={18} />
                                My Business QR
                            </Button>
                        </div>
                    )}
                </section>

                {/* 6. MANAGE YOUR BUSINESS (Main Modules) */}
                <section className="space-y-4">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Manage Your Business</h2>
                    {[
                        { 
                            title: 'Customers', 
                            desc: 'Visitors, Loyalty & Messaging', 
                            icon: Users, 
                            color: 'text-blue-600 bg-blue-50',
                            route: '/dashboard/visitors'
                        },
                        { 
                            title: 'Sales', 
                            desc: 'Inventory, Catalogue & POS', 
                            icon: ShoppingBag, 
                            color: 'text-purple-600 bg-purple-50',
                            route: '/dashboard/catalogue'
                        },
                        { 
                            title: 'Growth', 
                            desc: 'Marketing & Referral Campaigns', 
                            icon: Zap, 
                            color: 'text-emerald-600 bg-emerald-50',
                            route: '/dashboard/marketing-assets'
                        },
                        { 
                            title: 'Insights', 
                            desc: 'Analytics & Performance', 
                            icon: BarChart3, 
                            color: 'text-amber-600 bg-amber-50',
                            route: '/dashboard/analytics'
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
                            className="w-full bg-white border border-gray-100 p-8 rounded-[3rem] flex items-center gap-6 shadow-sm active:scale-[0.98] transition-all text-left group hover:border-primary/20 hover:shadow-md"
                        >
                            <div className={`size-16 rounded-[1.5rem] ${module.color} shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm`}>
                                <module.icon size={32} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-black text-gray-900 mb-1">{module.title}</h3>
                                <p className="text-[11px] font-bold text-gray-400 leading-relaxed uppercase tracking-widest">{module.desc}</p>
                            </div>
                            <div className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                                <ChevronRight size={20} />
                            </div>
                        </button>
                    ))}
                </section>
            </main>
        </div>
    );
}
