'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import { motion } from 'framer-motion';
import {
    Handshake, TrendingUp, Users, ArrowUpRight, ArrowDownRight,
    DollarSign, Award, Target, ChevronRight, Eye, ExternalLink,
    Building2, BarChart3, Activity, ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonthlyDataPoint {
    month: string;
    partnerships: number;
    revenue: number;
    referrals: number;
}

interface TopPartner {
    id: string;
    name: string;
    tier: string;
    revenue: number;
    referrals: number;
    conversionRate: number;
    trend: 'up' | 'down';
}

interface ActivityItem {
    id: string;
    type: 'agreement' | 'payout' | 'milestone' | 'tier';
    message: string;
    timestamp: string;
}

const MONTHLY_DATA: MonthlyDataPoint[] = [
    { month: 'Jan', partnerships: 24, revenue: 420000, referrals: 86 },
    { month: 'Feb', partnerships: 32, revenue: 580000, referrals: 112 },
    { month: 'Mar', partnerships: 28, revenue: 495000, referrals: 98 },
    { month: 'Apr', partnerships: 45, revenue: 720000, referrals: 145 },
    { month: 'May', partnerships: 38, revenue: 685000, referrals: 134 },
    { month: 'Jun', partnerships: 52, revenue: 890000, referrals: 178 },
    { month: 'Jul', partnerships: 48, revenue: 815000, referrals: 162 },
];

const TOP_PARTNERS: TopPartner[] = [
    { id: 'BIZ-007', name: 'AutoCare', tier: 'Elite', revenue: 124000, referrals: 22, conversionRate: 68, trend: 'up' },
    { id: 'BIZ-003', name: 'Tech Solutions', tier: 'Gold', revenue: 78000, referrals: 14, conversionRate: 72, trend: 'up' },
    { id: 'BIZ-001', name: 'Fashion Hub', tier: 'Gold', revenue: 57000, referrals: 8, conversionRate: 55, trend: 'down' },
    { id: 'BIZ-008', name: 'PrintMaster', tier: 'Silver', revenue: 56000, referrals: 10, conversionRate: 61, trend: 'up' },
    { id: 'BIZ-002', name: 'The Grill House', tier: 'Bronze', revenue: 18000, referrals: 5, conversionRate: 48, trend: 'down' },
    { id: 'BIZ-009', name: 'Green Grocers', tier: 'Silver', revenue: 42000, referrals: 9, conversionRate: 59, trend: 'up' },
];

const RECENT_ACTIVITY: ActivityItem[] = [
    { id: 'ACT-001', type: 'agreement', message: 'AutoCare partnered with Tech Solutions', timestamp: '2 hours ago' },
    { id: 'ACT-002', type: 'payout', message: '₦200,000 paid to Tech Solutions', timestamp: '5 hours ago' },
    { id: 'ACT-003', type: 'milestone', message: 'AutoCare reached 20 referrals', timestamp: '1 day ago' },
    { id: 'ACT-004', type: 'tier', message: 'Fashion Hub upgraded to Gold tier', timestamp: '2 days ago' },
    { id: 'ACT-005', type: 'agreement', message: 'Green Grocers partnered with Fresh Dairy', timestamp: '3 days ago' },
    { id: 'ACT-006', type: 'payout', message: '₦100,000 paid to Fashion Hub', timestamp: '4 days ago' },
    { id: 'ACT-007', type: 'milestone', message: 'Tech Solutions reached 50 total referrals', timestamp: '5 days ago' },
    { id: 'ACT-008', type: 'agreement', message: 'The Grill House partnered with Green Grocers', timestamp: '6 days ago' },
];

const TIER_DISTRIBUTION = [
    { name: 'Elite', count: 4, color: 'bg-purple-500' },
    { name: 'Gold', count: 8, color: 'bg-amber-500' },
    { name: 'Silver', count: 14, color: 'bg-gray-400' },
    { name: 'Bronze', count: 22, color: 'bg-orange-600' },
];

const activityIcons: Record<string, React.FC<{ size?: number; className?: string }>> = {
    agreement: Handshake,
    payout: DollarSign,
    milestone: Award,
    tier: TrendingUp,
};

const activityColors: Record<string, string> = {
    agreement: 'text-blue-500 bg-blue-50',
    payout: 'text-emerald-500 bg-emerald-50',
    milestone: 'text-purple-500 bg-purple-50',
    tier: 'text-amber-500 bg-amber-50',
};

export default function PartnershipsAnalyticsPage() {
    const [view, setView] = useState<'revenue' | 'partnerships' | 'referrals'>('revenue');

    const stats = useMemo(() => ({
        totalPartnerships: 267,
        activeReferrals: 915,
        totalRevenue: 4605000,
        avgCommissionRate: 10.5,
        partnerBusinesses: 48,
        growthRate: 23.4,
    }), []);

    const maxRevenue = Math.max(...MONTHLY_DATA.map(d => d.revenue));
    const maxPartnerships = Math.max(...MONTHLY_DATA.map(d => d.partnerships));
    const maxReferrals = Math.max(...MONTHLY_DATA.map(d => d.referrals));

    const chartMax = view === 'revenue' ? maxRevenue : view === 'partnerships' ? maxPartnerships : maxReferrals;

    const totalTiered = TIER_DISTRIBUTION.reduce((s, t) => s + t.count, 0);

    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/partnerships" />
            <Link href="/admin/discovery/partnerships" className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-main transition-colors mb-6">
                <ChevronLeft size={14} /> Back to Partnerships Hub
            </Link>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
                {[
                    { label: 'Total Partnerships', value: stats.totalPartnerships.toString(), icon: Handshake, color: 'text-blue-500', bg: 'bg-blue-50', trend: '+12%' },
                    { label: 'Active Referrals', value: stats.activeReferrals.toLocaleString(), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50', trend: '+18%' },
                    { label: 'Revenue Generated', value: `₦${(stats.totalRevenue / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/5', trend: '+23%' },
                    { label: 'Avg Commission', value: `${stats.avgCommissionRate}%`, icon: Target, color: 'text-purple-500', bg: 'bg-purple-50', trend: null },
                    { label: 'Partner Businesses', value: stats.partnerBusinesses.toString(), icon: Building2, color: 'text-amber-500', bg: 'bg-amber-50', trend: '+8%' },
                ].map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
                    >
                        <div className="flex items-start justify-between">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon size={20} />
                            </div>
                            {stat.trend && (
                                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full flex items-center gap-0.5">
                                    <ArrowUpRight size={12} /> {stat.trend}
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mt-4">{stat.label}</p>
                        <p className="text-2xl font-display font-bold text-text-main mt-0.5">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column — Charts */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Monthly Trends Chart */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-display font-bold text-text-main">Monthly Trends</h2>
                                <p className="text-xs font-medium text-text-secondary mt-1">Partnership activity over the last 7 months</p>
                            </div>
                            <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl">
                                {(['revenue', 'partnerships', 'referrals'] as const).map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => setView(v)}
                                        className={cn(
                                            'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                                            view === v ? 'bg-white text-text-main shadow-sm' : 'text-text-secondary hover:text-text-main'
                                        )}
                                    >
                                        {v === 'revenue' ? 'Revenue' : v === 'partnerships' ? 'Partnerships' : 'Referrals'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="h-[280px] flex items-end gap-3 relative">
                            {/* Grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                {[0, 1, 2, 3, 4].map(i => (
                                    <div key={i} className="border-t border-dashed border-gray-100 h-0" />
                                ))}
                            </div>
                            {MONTHLY_DATA.map((d, i) => {
                                const val = view === 'revenue' ? d.revenue : view === 'partnerships' ? d.partnerships : d.referrals;
                                const height = chartMax > 0 ? (val / chartMax) * 100 : 0;
                                return (
                                    <div key={d.month} className="flex-1 flex flex-col items-center gap-2 relative group">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${height}%` }}
                                            transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
                                            className="w-full max-w-[48px] rounded-2xl bg-gradient-to-t from-primary/80 to-primary shadow-lg relative cursor-pointer"
                                        >
                                            <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                                                {view === 'revenue' ? `₦${(val / 1000).toFixed(0)}K` : val}
                                            </div>
                                        </motion.div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{d.month}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Top Performing Partners */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-3xl border border-gray-100 shadow-sm"
                    >
                        <div className="px-8 pt-8 pb-6 flex items-center justify-between border-b border-gray-50">
                            <div>
                                <h2 className="text-xl font-display font-bold text-text-main">Top Performing Partners</h2>
                                <p className="text-xs font-medium text-text-secondary mt-1">Ranked by revenue generated</p>
                            </div>
                            <button className="text-xs font-black uppercase tracking-widest text-primary hover:text-primary-hover transition-all">View All</button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {TOP_PARTNERS.map((partner, idx) => (
                                <div key={partner.id} className="flex items-center gap-4 px-8 py-4 hover:bg-gray-50/50 transition-colors group">
                                    <span className="w-6 text-xs font-black text-text-secondary">{idx + 1}</span>
                                    <div className="size-10 rounded-xl bg-gray-100 flex items-center justify-center text-text-secondary font-bold text-sm">
                                        {partner.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-text-main truncate">{partner.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-medium text-text-secondary">{partner.id}</span>
                                            <span className={cn(
                                                'text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded',
                                                partner.tier === 'Elite' ? 'text-purple-600 bg-purple-50' :
                                                partner.tier === 'Gold' ? 'text-amber-600 bg-amber-50' :
                                                partner.tier === 'Silver' ? 'text-gray-500 bg-gray-100' :
                                                'text-orange-600 bg-orange-50'
                                            )}>{partner.tier}</span>
                                        </div>
                                    </div>
                                    <div className="hidden md:block text-right">
                                        <p className="text-sm font-bold text-text-main">₦{partner.revenue.toLocaleString()}</p>
                                        <p className="text-[10px] font-medium text-text-secondary">{partner.referrals} referrals</p>
                                    </div>
                                    <div className="hidden sm:block text-right">
                                        <div className="flex items-center gap-1 justify-end">
                                            {partner.trend === 'up' ? (
                                                <ArrowUpRight size={14} className="text-emerald-500" />
                                            ) : (
                                                <ArrowDownRight size={14} className="text-red-500" />
                                            )}
                                            <span className="text-xs font-bold text-text-secondary">{partner.conversionRate}%</span>
                                        </div>
                                        <p className="text-[10px] font-medium text-text-secondary">Conv. rate</p>
                                    </div>
                                    <button className="p-2 rounded-lg bg-gray-50 text-text-secondary opacity-0 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary transition-all">
                                        <Eye size={15} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Right Column — Sidebar */}
                <div className="space-y-6">

                    {/* Tier Distribution */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm"
                    >
                        <h3 className="text-sm font-black uppercase tracking-widest text-text-main flex items-center gap-2 mb-6">
                            <Award className="text-primary" size={18} /> Tier Distribution
                        </h3>
                        <div className="space-y-4">
                            {TIER_DISTRIBUTION.map((tier) => {
                                const pct = (tier.count / totalTiered) * 100;
                                return (
                                    <div key={tier.name}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-bold text-text-main">{tier.name}</span>
                                            <span className="text-[10px] font-medium text-text-secondary">{tier.count} businesses</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
                                                className={`h-full rounded-full ${tier.color}`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-text-secondary">Total enrolled</span>
                                <span className="text-lg font-display font-bold text-text-main">{totalTiered}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Conversion Insights */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.55 }}
                        className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm"
                    >
                        <h3 className="text-sm font-black uppercase tracking-widest text-text-main flex items-center gap-2 mb-6">
                            <Target className="text-primary" size={18} /> Conversion Insights
                        </h3>
                        <div className="space-y-5">
                            {[
                                { label: 'Referral → Customer', value: '64%', trend: '+5%', direction: 'up' },
                                { label: 'Avg. Days to Convert', value: '12d', trend: '-2d', direction: 'down' },
                                { label: 'Repeat Referral Rate', value: '38%', trend: '+3%', direction: 'up' },
                            ].map((metric) => (
                                <div key={metric.label} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-text-secondary">{metric.label}</p>
                                        <p className="text-lg font-display font-bold text-text-main mt-0.5">{metric.value}</p>
                                    </div>
                                    <span className={cn(
                                        'text-[10px] font-black flex items-center gap-0.5',
                                        metric.direction === 'up' ? 'text-emerald-600' : 'text-red-500'
                                    )}>
                                        {metric.direction === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                        {metric.trend}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Recent Activity */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white rounded-3xl border border-gray-100 shadow-sm"
                    >
                        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-gray-50">
                            <h3 className="text-sm font-black uppercase tracking-widest text-text-main flex items-center gap-2">
                                <Activity className="text-primary" size={16} /> Recent Activity
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {RECENT_ACTIVITY.slice(0, 5).map((item) => {
                                const Icon = activityIcons[item.type];
                                const color = activityColors[item.type];
                                return (
                                    <div key={item.id} className="flex items-start gap-3 px-6 py-3.5 hover:bg-gray-50/50 transition-colors">
                                        <div className={`p-2 rounded-xl ${color}`}>
                                            <Icon size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-text-main leading-relaxed">{item.message}</p>
                                            <p className="text-[10px] font-medium text-text-secondary mt-0.5">{item.timestamp}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="px-6 py-4 border-t border-gray-50">
                            <button className="text-xs font-black uppercase tracking-widest text-primary hover:text-primary-hover transition-all flex items-center gap-1">
                                View All Activity <ChevronRight size={14} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
