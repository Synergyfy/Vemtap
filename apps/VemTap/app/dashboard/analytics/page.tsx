"use client";

import React from 'react';
import { 
    AnalyticsOverviewHeader, 
    AnalyticsStatsCards 
} from '@/components/dashboard/analytics/AnalyticsDashboard';
import { 
    Users, UserPlus, QrCode, Megaphone, Repeat, 
    ShoppingBag, Package, TrendingUp, DollarSign,
    Globe, LayoutGrid, FileText, Star
} from 'lucide-react';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function AnalyticsPage() {
    const { dateRange, setDateRange } = useAnalyticsStore();

    const stats = [
        { label: 'Total Customers', value: '5,240', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%' },
        { label: 'New Customers', value: '340', icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+8%' },
        { label: 'QR Scans', value: '8,920', icon: QrCode, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+18%' },
        { label: 'Campaign Engagement', value: '67%', icon: Megaphone, color: 'text-rose-600', bg: 'bg-rose-50', trend: '+5%' },
        { label: 'Returning', value: '2,100', icon: Repeat, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+10%' },
    ];

    const analyticsModules = [
        { title: 'Customer Analytics', desc: 'Behavior & growth tracking.', icon: Users, href: '/dashboard/analytics/customers', color: 'bg-blue-50 text-[#066CF4]' },
        { title: 'Sales Analytics', desc: 'Revenue & transaction data.', icon: DollarSign, href: '/dashboard/analytics/sales', color: 'bg-emerald-50 text-emerald-600' },
        { title: 'Inventory Analytics', desc: 'Stock health & velocity.', icon: Package, href: '/dashboard/analytics/inventory', color: 'bg-amber-50 text-amber-600' },
        { title: 'Customer Value', desc: 'CLV & loyalty insights.', icon: Star, href: '/dashboard/analytics/customer-value', color: 'bg-purple-50 text-purple-600' },
        { title: 'Marketing', desc: 'Campaign effectiveness.', icon: Megaphone, href: '/dashboard/analytics/marketing', color: 'bg-rose-50 text-rose-600' },
        { title: 'Discovery Network', desc: 'Network performance.', icon: Globe, href: '/dashboard/analytics/discovery', color: 'bg-indigo-50 text-indigo-600' },
    ];

    return (
        <div className="pb-24 md:pb-10 max-w-6xl mx-auto p-4 md:p-8 space-y-12">
            <AnalyticsOverviewHeader />

            {/* Date Range Filter */}
            <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-fit">
                {['Today', '7D', '30D', '90D', '12M'].map((range) => (
                    <button 
                        key={range}
                        onClick={() => setDateRange(range.toLowerCase() as any)}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            dateRange === range.toLowerCase() ? "bg-[#066CF4] text-white" : "text-gray-400 hover:text-gray-600"
                        }`}
                    >
                        {range}
                    </button>
                ))}
            </div>

            <AnalyticsStatsCards stats={stats} />

            {/* NAVIGATION HUB */}
            <div className="space-y-6">
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                    Analytics Modules
                    <span className="h-0.5 flex-1 bg-gray-100" />
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {analyticsModules.map((mod, i) => (
                        <Link key={i} href={mod.href} className="group">
                            <motion.div 
                                whileHover={{ y: -5 }}
                                className="p-8 rounded-[32px] bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all active:scale-[0.98]"
                            >
                                <div className={cn("size-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm", mod.color)}>
                                    <mod.icon size={28} />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-2">{mod.title}</h3>
                                <p className="text-xs font-medium text-gray-500 mb-6">{mod.desc}</p>
                                <Button className="w-full h-12 rounded-xl bg-gray-900 text-[10px] font-black uppercase tracking-widest group-hover:bg-[#066CF4] transition-all">
                                    View Analytics
                                </Button>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
