'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Clock, TrendingUp, Users, Building2, Award, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const kpis = [
    { label: 'Available Wallet Balance', value: '₦84,500', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', change: '+12.5%', href: '/dashboard/business-partnership/wallet' },
    { label: 'Pending Rewards', value: '₦12,300', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', change: '4 pending', href: '/dashboard/business-partnership/rewards' },
    { label: 'Monthly Earnings', value: '₦28,750', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', change: '+8.2%', href: '/dashboard/business-partnership/wallet' },
    { label: 'Total Businesses Referred', value: '24', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', change: '+3 this month', href: '/dashboard/business-partnership/network' },
    { label: 'Active Referral Businesses', value: '18', icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50', change: '75% active rate', href: '/dashboard/business-partnership/network' },
    { label: 'Current Partner Level', value: 'Gold Partner', icon: Award, color: 'text-amber-600', bg: 'bg-amber-50', change: 'Next: Platinum', href: '/dashboard/business-partnership/rewards' },
];

const monthlyEarningsData = [
    { month: 'Jan', earnings: 12000, referrals: 2 },
    { month: 'Feb', earnings: 18000, referrals: 3 },
    { month: 'Mar', earnings: 15000, referrals: 2 },
    { month: 'Apr', earnings: 22000, referrals: 4 },
    { month: 'May', earnings: 28000, referrals: 5 },
    { month: 'Jun', earnings: 25000, referrals: 3 },
    { month: 'Jul', earnings: 32000, referrals: 6 },
];

const monthlyReferralsData = [
    { month: 'Jan', referrals: 2 },
    { month: 'Feb', referrals: 3 },
    { month: 'Mar', referrals: 2 },
    { month: 'Apr', referrals: 4 },
    { month: 'May', referrals: 5 },
    { month: 'Jun', referrals: 3 },
    { month: 'Jul', referrals: 6 },
];

const businessGrowthData = [
    { month: 'Jan', businesses: 8 },
    { month: 'Feb', businesses: 10 },
    { month: 'Mar', businesses: 12 },
    { month: 'Apr', businesses: 15 },
    { month: 'May', businesses: 18 },
    { month: 'Jun', businesses: 21 },
    { month: 'Jul', businesses: 24 },
];

const renewalRateData = [
    { month: 'Jan', rate: 88 },
    { month: 'Feb', rate: 85 },
    { month: 'Mar', rate: 90 },
    { month: 'Apr', rate: 92 },
    { month: 'May', rate: 87 },
    { month: 'Jun', rate: 93 },
    { month: 'Jul', rate: 91 },
];

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

    const chartData = {
        earnings: { data: monthlyEarningsData, lines: [{ key: 'earnings', color: '#066CF4' }], title: 'Monthly Earnings' },
        referrals: { data: monthlyReferralsData, lines: [{ key: 'referrals', color: '#8B5CF6' }], title: 'Monthly Referrals' },
        growth: { data: businessGrowthData, lines: [{ key: 'businesses', color: '#10B981' }], title: 'Business Growth' },
        renewal: { data: renewalRateData, lines: [{ key: 'rate', color: '#F59E0B' }], title: 'Renewal Rate' },
    };

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
