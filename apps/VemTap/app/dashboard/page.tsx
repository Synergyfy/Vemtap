'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, UserPlus, ShoppingBag, Gift, Bell, 
    Plus, Send, MessageSquare, QrCode, Zap, 
    TrendingUp, ArrowRight, UserCheck, Search,
    ChevronRight, BarChart3, Settings as SettingsIcon,
    PieChart, Activity, Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useDashboardAnalytics } from '@/services/analytics/hooks';
import { useBusinessLoyaltyStats } from '@/services/loyalty/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useMyBusiness } from '@/services/businesses/hooks';
import DashboardBannerWrapper from '@/components/dashboard/DashboardBannerWrapper';
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const { activeBranchId } = useActiveBranch();
    const { data: myBusiness } = useMyBusiness();
    const { data: analytics, isLoading: isAnalyticsLoading } = useDashboardAnalytics();
    const { data: loyaltyStats } = useBusinessLoyaltyStats();

    // KPI Data Mapping
    const kpis = useMemo(() => {
        const stats = analytics?.stats || [];
        const visitorsToday = stats.find(s => s.label.toLowerCase().includes('total visitors'))?.value || '0';
        const customersCaptured = stats.find(s => s.label.toLowerCase().includes('new customers'))?.value || '0';
        const activeLoyalty = loyaltyStats?.activeMembers || '0';
        
        return [
            { label: "Today's Visitors", value: visitorsToday, icon: Users, color: 'bg-blue-500' },
            { label: "Customers Captured", value: customersCaptured, icon: UserPlus, color: 'bg-emerald-500' },
            { label: "Sales Today", value: "₦0", icon: ShoppingBag, color: 'bg-purple-500' }, // Placeholder for now
            { label: "Active Loyalty Members", value: activeLoyalty, icon: Gift, color: 'bg-amber-500' }
        ];
    }, [analytics, loyaltyStats]);

    if (isAnalyticsLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <main className="p-6 space-y-10">
                <DashboardBannerWrapper />

                <OnboardingChecklist />

                {/* SECTION 1: BUSINESS SNAPSHOT (Swipeable Cards) */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Snapshot</h2>
                        <div className="flex gap-1">
                            <div className="size-1 bg-primary rounded-full" />
                            <div className="size-1 bg-gray-200 rounded-full" />
                            <div className="size-1 bg-gray-200 rounded-full" />
                        </div>
                    </div>
                    <div className="flex overflow-x-auto no-scrollbar gap-4 -mx-6 px-6 snap-x">
                        {kpis.map((kpi, i) => (
                            <div 
                                key={i}
                                className="min-w-[180px] bg-white rounded-2xl p-5 border border-gray-100 shadow-sm snap-center flex flex-col justify-between h-32 group hover:border-primary/20 transition-all"
                            >
                                <div className={`size-8 rounded-lg ${kpi.color} text-white flex items-center justify-center transition-transform group-hover:scale-110`}>
                                    <kpi.icon size={16} />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-gray-900 mb-0.5 leading-none">{kpi.value}</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none">{kpi.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* SECTION 2: QUICK ACTIONS */}
                <section>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 px-1">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Add Customer', icon: UserPlus, color: 'text-blue-600 bg-blue-50', route: '/dashboard/visitors/add' },
                            { label: 'New Sale', icon: ShoppingBag, color: 'text-purple-600 bg-purple-50', route: '/dashboard/catalogue' },
                            { label: 'Send Message', icon: Send, color: 'text-indigo-600 bg-indigo-50', route: '/dashboard/messaging' },
                            { label: 'Create Campaign', icon: Zap, color: 'text-amber-600 bg-amber-50', route: '/dashboard/marketing-assets/create' },
                            { label: 'Generate QR', icon: QrCode, color: 'text-emerald-600 bg-emerald-50', route: '/dashboard/marketing-assets' },
                            { label: 'Capture Visitor', icon: UserCheck, color: 'text-rose-600 bg-rose-50', route: '/dashboard/visitors' }
                        ].map((action, i) => (
                            <button 
                                key={i}
                                onClick={() => router.push(action.route)}
                                className="bg-white border border-gray-100 p-5 rounded-3xl flex flex-col items-center gap-3 active:scale-95 transition-all shadow-sm group hover:border-primary/20"
                            >
                                <div className={`size-12 rounded-2xl ${action.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                    <action.icon size={24} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* SECTION 3: BUSINESS HEALTH */}
                <section className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Business Health</h2>
                    <div className="space-y-6">
                        {[
                            { label: 'Customer Growth', value: 75, color: 'bg-blue-500', trend: '+12%' },
                            { label: 'Sales Growth', value: 45, color: 'bg-purple-500', trend: '+5%' },
                            { label: 'QR Scan Activity', value: 90, color: 'bg-emerald-500', trend: '+28%' },
                            { label: 'Referral Activity', value: 30, color: 'bg-amber-500', trend: '+2%' }
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{item.label}</span>
                                    <span className="text-[10px] font-black text-emerald-500">{item.trend}</span>
                                </div>
                                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                    <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${item.value}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* SECTION 4: RECENT ACTIVITY */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Recent Activity</h2>
                        <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">View All</button>
                    </div>
                    {analytics?.recentVisitors?.length > 0 ? (
                        <div className="space-y-3">
                            {(analytics?.recentVisitors || []).slice(0, 5).map((visitor: any, i: number) => (
                                <div key={i} className="bg-white border border-gray-100 p-4 rounded-3xl flex items-center gap-4 shadow-sm">
                                    <div className="size-10 rounded-xl bg-gray-50 flex items-center justify-center text-primary">
                                        <Activity size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-gray-900 truncate">{visitor.name || 'New Visitor'}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{visitor.status === 'new' ? 'New visitor captured' : 'Returning visitor'}</p>
                                    </div>
                                    <p className="text-[10px] font-black text-gray-300 uppercase">{visitor.time || 'Just now'}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-6">
                            <div className="size-24 rounded-full bg-[#066CF4]/5 flex items-center justify-center text-gray-300">
                                <Users size={48} strokeWidth={1} />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-gray-900 mb-1">No Customers Yet</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight leading-relaxed max-w-[240px] mx-auto">
                                    Your customer list is waiting for its first entry. Start by setting up your QR codes.
                                </p>
                            </div>
                            <Button 
                                onClick={() => router.push('/dashboard/marketing-assets/create')}
                                className="h-12 px-8 rounded-xl bg-[#066CF4] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Generate QR Code
                            </Button>
                        </div>
                    )}
                </section>

                {/* SECTION 5: MANAGE YOUR BUSINESS */}
                <section className="space-y-4">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Manage Your Business</h2>
                    {[
                        { 
                            title: 'Customers', 
                            desc: 'Manage visitors, customers, loyalty, messaging and forms.', 
                            icon: Users, 
                            color: 'text-blue-600 bg-blue-50',
                            route: '/dashboard/visitors'
                        },
                        { 
                            title: 'Sales', 
                            desc: 'Manage inventory, catalogue and POS.', 
                            icon: ShoppingBag, 
                            color: 'text-purple-600 bg-purple-50',
                            route: '/dashboard/catalogue'
                        },
                        { 
                            title: 'Growth', 
                            desc: 'Marketing, referrals, reviews and QR campaigns.', 
                            icon: TrendingUp, 
                            color: 'text-emerald-600 bg-emerald-50',
                            route: '/dashboard/marketing-assets'
                        },
                        { 
                            title: 'Insights', 
                            desc: 'Analytics and business performance.', 
                            icon: BarChart3, 
                            color: 'text-amber-600 bg-amber-50',
                            route: '/dashboard/analytics'
                        },
                        { 
                            title: 'Settings', 
                            desc: 'Business configuration and account settings.', 
                            icon: SettingsIcon, 
                            color: 'text-gray-600 bg-gray-50',
                            route: '/dashboard/settings'
                        }
                    ].map((module, i) => (
                        <button 
                            key={i}
                            onClick={() => router.push(module.route)}
                            className="w-full bg-white border border-gray-100 p-6 rounded-[2.5rem] flex items-center gap-5 shadow-sm active:scale-[0.98] transition-all text-left"
                        >
                            <div className={`size-14 rounded-2xl ${module.color} shrink-0 flex items-center justify-center`}>
                                <module.icon size={28} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-black text-gray-900 mb-1">{module.title}</h3>
                                <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-tight">{module.desc}</p>
                            </div>
                            <ChevronRight className="text-gray-300" size={20} />
                        </button>
                    ))}
                </section>
            </main>
        </div>
    );
}
