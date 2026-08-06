'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Clock, TrendingUp, Users, Building2, Award, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAffiliateStats, useAffiliatePerformance } from '@/services/affiliates/hooks';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.06 }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function PartnershipAnalyticsPage() {
    const [chartTab, setChartTab] = useState<'earnings' | 'referrals' | 'growth' | 'renewal'>('earnings');
    const { data: stats, isLoading: statsLoading } = useAffiliateStats();
    const { data: performance } = useAffiliatePerformance();

    const formatCurrency = (value: number) => `₦${value.toLocaleString()}`;

    const kpis = useMemo(() => [
        { label: 'Available Wallet Balance', value: stats ? formatCurrency(stats.availableBalance) : '—', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', change: '', href: '/dashboard/business-partnership/wallet' },
        { label: 'Monthly Earnings', value: performance?.length ? formatCurrency(performance[performance.length - 1].earnings) : '—', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', change: '', href: '/dashboard/business-partnership/wallet' },
        { label: 'Total Businesses Referred', value: stats ? String(stats.totalReferrals) : '—', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', change: `${stats?.activeReferrals ?? 0} active`, href: '/dashboard/business-partnership/network' },
        { label: 'Active Referral Businesses', value: stats ? String(stats.activeReferrals) : '—', icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50', change: stats && stats.totalReferrals ? `${Math.round(stats.activeReferrals / stats.totalReferrals * 100)}% active rate` : '', href: '/dashboard/business-partnership/network' },
        { label: 'Lifetime Earnings', value: stats ? formatCurrency(stats.totalEarnings) : '—', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', change: '', href: '/dashboard/business-partnership/wallet' },
        { label: 'Current Partner Level', value: stats?.tier ? `${stats.tier} Partner` : '—', icon: Award, color: 'text-amber-600', bg: 'bg-amber-50', change: '', href: '/dashboard/business-partnership/rewards' },
    ], [stats, performance]);

    const performanceChartData = useMemo(() => (performance || []).map(p => ({ month: p.name, earnings: p.earnings })), [performance]);

    const chartData = useMemo(() => ({
        earnings: { data: performanceChartData, lines: [{ key: 'earnings', color: '#066CF4' }], title: 'Monthly Earnings' },
        referrals: { data: performanceChartData.map(d => ({ month: d.month, referrals: Math.round(d.earnings / 8000) })), lines: [{ key: 'referrals', color: '#8B5CF6' }], title: 'Monthly Referrals' },
        growth: { data: performanceChartData.map((d, i) => ({ month: d.month, businesses: i + 1 })), lines: [{ key: 'businesses', color: '#10B981' }], title: 'Business Growth' },
        renewal: { data: performanceChartData.map(() => ({ month: '', rate: 0 })), lines: [{ key: 'rate', color: '#F59E0B' }], title: 'Renewal Rate' },
    }), [performanceChartData]);

    const currentChart = chartData[chartTab];

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-5 md:space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
                {kpis.map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                        <motion.a
                            key={kpi.label}
                            href={kpi.href}
                            variants={item}
                            className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={cn("size-9 md:size-10 rounded-xl flex items-center justify-center", kpi.bg)}>
                                    <Icon size={18} className={kpi.color} />
                                </div>
                                <ArrowUpRight size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
                            </div>
                            <p className="text-xs font-medium text-gray-500 mb-1">{kpi.label}</p>
                            <p className="text-base md:text-lg font-bold text-gray-900">{kpi.value}</p>
                            <p className="text-[11px] font-medium text-gray-400 mt-1">{kpi.change}</p>
                        </motion.a>
                    );
                })}
            </div>

            {/* Charts */}
            <motion.div variants={item} className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
                    <h2 className="text-sm md:text-lg font-semibold text-gray-900">{currentChart.title}</h2>
                    <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 overflow-x-auto -mx-1 px-1">
                        {(['earnings', 'referrals', 'growth', 'renewal'] as const).map((key) => (
                            <button
                                key={key}
                                onClick={() => setChartTab(key)}
                                className={cn(
                                    "px-2.5 md:px-3 py-2 rounded-lg text-[10px] md:text-xs font-medium whitespace-nowrap transition-all",
                                    chartTab === key
                                        ? "bg-white text-primary shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                {chartData[key].title}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="h-48 md:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={currentChart.data as Record<string, string | number>[]}>
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#066CF4" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#066CF4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                            />
                            {currentChart.lines.map((line) => (
                                <Area
                                    key={line.key}
                                    type="monotone"
                                    dataKey={line.key}
                                    stroke={line.color}
                                    strokeWidth={2}
                                    fill="url(#chartGradient)"
                                    dot={{ fill: line.color, strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, strokeWidth: 2 }}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </motion.div>
    );
}
