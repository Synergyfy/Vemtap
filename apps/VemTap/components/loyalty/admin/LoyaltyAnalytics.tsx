"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users, Gift, Zap, TrendingUp, BarChart3,
    ArrowUpRight, ArrowDownRight, Activity, PieChart, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLoyaltyStore } from '@/store/loyaltyStore';
import { useBusinessStore } from '@/store/useBusinessStore';

interface AnalyticsStat {
    label: string;
    value: string | number;
    change: number;
    icon: any;
    trend: 'up' | 'down';
}

export const LoyaltyAnalytics: React.FC<{ className?: string }> = ({ className }) => {
    const { allProfiles, fetchAllProfiles, isLoading } = useLoyaltyStore();
    const { activeBranchId } = useBusinessStore();

    useEffect(() => {
        if (activeBranchId && activeBranchId !== 'all') {
            fetchAllProfiles(activeBranchId);
        }
    }, [activeBranchId, fetchAllProfiles]);

    const STATS: AnalyticsStat[] = [
        {
            label: 'Total Members',
            value: activeBranchId === 'all' ? '---' : allProfiles.length.toLocaleString(),
            change: 12.5,
            icon: Users,
            trend: 'up'
        },
        { label: 'Points Earned', value: '45,200', change: 8.2, icon: Zap, trend: 'up' },
        { label: 'Rewards Claimed', value: '312', change: -2.4, icon: Gift, trend: 'down' },
        { label: 'Redemption Rate', value: '24.8%', change: 5.1, icon: Activity, trend: 'up' },
    ];

    return (
        <div className={cn("space-y-8", className)}>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {STATS.map((stat, index) => (
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
                {/* Main Chart Placeholder */}
                <div className="lg:col-span-8 bg-white border border-slate-100 p-8">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Activity Overview</h3>
                            <p className="text-xs text-slate-500 font-medium">Trends in points earning vs redemptions (Last 30 days)</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-primary" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Earnings</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-slate-200" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Claims</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[300px] w-full bg-slate-50/50 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 relative group overflow-hidden">
                        <BarChart3 className="w-16 h-16 text-slate-200 transition-transform group-hover:scale-110" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4">Interactive Chart Data Rendering...</p>
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>

                {/* Breakdown Panel */}
                <div className="lg:col-span-4 bg-white p-8 text-slate-900 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <PieChart className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold tracking-tight uppercase">Tier Distribution</h3>
                    </div>

                    <div className="space-y-6">
                        {[
                            { label: 'Bronze', value: 65, color: 'bg-orange-600' },
                            { label: 'Silver', value: 20, color: 'bg-slate-400' },
                            { label: 'Gold', value: 10, color: 'bg-yellow-500' },
                            { label: 'Platinum', value: 5, color: 'bg-indigo-600' },
                        ].map((tier) => (
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
                                        className={cn("h-full", tier.color)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-5 bg-slate-50 border border-slate-100 text-center">
                        <TrendingUp className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Growth Forecast</p>
                        <p className="text-lg font-display font-black text-slate-900">+18% Revenue Increase</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
