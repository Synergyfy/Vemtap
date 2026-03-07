"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users, Gift, Zap, TrendingUp, BarChart3,
    ArrowUpRight, ArrowDownRight, Activity, PieChart, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLoyaltyStore } from '@/store/loyaltyStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useBusinessStore } from '@/store/useBusinessStore';
import { useBusinessLoyaltyStats } from '@/services/loyalty/hooks';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface AnalyticsStat {
    label: string;
    value: string | number;
    change: number;
    icon: any;
    trend: 'up' | 'down';
}

export const LoyaltyAnalytics: React.FC<{ className?: string }> = ({ className }) => {
    const { activeBranchId } = useAuthStore();
    const { data, isLoading } = useBusinessLoyaltyStats(activeBranchId || undefined);

    const stats: AnalyticsStat[] = (data?.stats || [
        { label: 'Total Members', value: '0', change: 0, trend: 'up' },
        { label: 'Points Earned', value: '0', change: 0, trend: 'up' },
        { label: 'Rewards Claimed', value: '0', change: 0, trend: 'up' },
        { label: 'Redemption Rate', value: '0%', change: 0, trend: 'up' },
    ]).map((s: any, i: number) => {
        const icons = [Users, Zap, Gift, Activity];
        return {
            ...s,
            icon: icons[i] || Activity,
            trend: s.trend || 'up'
        };
    });

    const tierData = data?.tierDistribution || [
        { label: 'Bronze', value: 0, color: 'bg-orange-600' },
        { label: 'Silver', value: 0, color: 'bg-slate-400' },
        { label: 'Gold', value: 0, color: 'bg-yellow-500' },
        { label: 'Platinum', value: 0, color: 'bg-indigo-600' },
    ];

    const activityData = data?.activityTrend || [];

    return (
        <div className={cn("space-y-8", className)}>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="p-6 bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group relative"
                    >
                        {isLoading && index === 0 && (
                            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            </div>
                        )}
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div className={cn(
                                "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border",
                                stat.trend === 'up' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                            )}>
                                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {Math.abs(stat.change)}%
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">{stat.label}</p>
                        <h4 className="text-2xl font-display font-black text-slate-900 group-hover:text-primary transition-colors">{stat.value}</h4>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Chart */}
                <div className="lg:col-span-8 bg-white border border-slate-100 p-8">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Activity Overview</h3>
                            <p className="text-xs text-slate-500 font-medium">Trends in points earning vs redemptions (Last 7 days)</p>
                        </div>
                    </div>

                    <div className="h-[300px] w-full relative">
                        {activityData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                                    <Bar name="Earnings" dataKey="earnings" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                                    <Bar name="Claims" dataKey="claims" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-100 bg-slate-50/50">
                                <BarChart3 className="w-12 h-12 text-slate-200" />
                                <p className="text-[10px] font-black uppercase text-slate-400 mt-4">No recent activity data</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Breakdown Panel */}
                <div className="lg:col-span-4 bg-white p-8 text-slate-900 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <PieChart className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold tracking-tight uppercase">Tier Distribution</h3>
                    </div>

                    <div className="space-y-6">
                        {tierData.map((tier: any) => (
                            <div key={tier.label} className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-500">{tier.label} Members</span>
                                    <span>{tier.value}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${tier.value}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className={cn("h-full", tier.color || 'bg-primary')}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-5 bg-slate-50 border border-slate-100 text-center">
                        <TrendingUp className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Growth Forecast</p>
                        <p className="text-lg font-display font-black text-slate-900">{data?.growthForecast || '+0%'} Growth</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
