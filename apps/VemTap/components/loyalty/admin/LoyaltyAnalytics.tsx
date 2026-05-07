"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
    Users, Gift, Zap, TrendingUp, BarChart3,
    ArrowUpRight, ArrowDownRight, Activity, PieChart, Loader2,
    LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useBusinessLoyaltyStats } from '@/services/loyalty/hooks';
import { BusinessLoyaltyStats } from '@/services/loyalty/types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import StatsCard from '@/components/dashboard/StatsCard';

interface AnalyticsStat {
    label: string;
    value: string | number;
    change: string;
    icon: LucideIcon;
    trend: {
        value: string;
        isUp: boolean;
    };
    color: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
}

interface TierData {
    label: string;
    value: number;
    color: string;
}

export const LoyaltyAnalytics: React.FC<{ className?: string }> = ({ className }) => {
    const { activeBranchId } = useAuthStore();
    const { data, isLoading } = useBusinessLoyaltyStats(activeBranchId || undefined);

    const stats: AnalyticsStat[] = (data?.stats || [
        { label: 'Total Members', value: '0', change: 0, trend: 'up' },
        { label: 'Points Earned', value: '0', change: 0, trend: 'up' },
        { label: 'Rewards Claimed', value: '0', change: 0, trend: 'up' },
        { label: 'Redemption Rate', value: '0%', change: 0, trend: 'up' },
    ]).map((s: BusinessLoyaltyStats['stats'][0], i: number) => {
        const icons = [Users, Zap, Gift, Activity];
        const colors: ('blue' | 'green' | 'purple' | 'yellow' | 'red')[] = ['blue', 'yellow', 'green', 'purple'];
        return {
            label: s.label,
            value: s.value,
            change: `${s.change}%`,
            trend: {
                value: `${Math.abs(s.change)}%`,
                isUp: s.trend === 'up'
            },
            icon: icons[i] || Activity,
            color: colors[i] || 'blue'
        };
    });

    const tierData: TierData[] = data?.tierDistribution || [
        { label: 'Bronze', value: 0, color: 'bg-orange-600' },
        { label: 'Silver', value: 0, color: 'bg-slate-400' },
        { label: 'Gold', value: 0, color: 'bg-yellow-500' },
        { label: 'Platinum', value: 0, color: 'bg-indigo-600' },
    ];

    const activityData = data?.activityTrend || [];

    return (
        <div className={cn("space-y-8", className)}>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <StatsCard
                            label={stat.label}
                            value={stat.value.toString()}
                            icon={stat.icon}
                            trend={stat.trend}
                            color={stat.color}
                        />
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Chart */}
                <div className="lg:col-span-12 bg-white border border-slate-100 rounded-[2rem] md:rounded-3xl p-4 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-10">
                        <div>
                            <h3 className="text-base md:text-lg font-bold text-slate-900 uppercase tracking-tight">Activity Overview</h3>
                            <p className="text-[10px] md:text-xs text-slate-500 font-medium">Trends in points earning vs redemptions (Last 7 days)</p>
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

                </div>
        </div>
    );
};
