"use client";

import React from 'react';
import {
    Building2, Users, Star, ArrowUpRight, ArrowDownRight,
    ShieldAlert, Activity, PieChart, Info, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { adminAnalyticsApi } from '@/lib/api/admin';

export default function AdminLoyaltyPage() {
    const { data: adminSummaryResponse, isLoading } = useQuery({
        queryKey: ['admin-summary'],
        queryFn: () => adminAnalyticsApi.getAdminSummary(),
    });

    const summaryData = adminSummaryResponse?.data || adminSummaryResponse;

    if (isLoading) {
        return (
            <div className="p-8 animate-pulse space-y-10">
                <div className="h-12 w-1/3 bg-gray-100 rounded mb-2"></div>
                <div className="grid grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-50 border border-slate-100" />)}
                </div>
                <div className="h-96 bg-gray-50 border border-slate-100" />
            </div>
        );
    }

    const stats = summaryData?.stats || [];
    const monthlyData = summaryData?.monthlyData || [];
    const securityAlerts = summaryData?.securityAlerts || [];
    const sectorSplit = summaryData?.sectorSplit || [];

    // Map stats to the UI icons
    const statIcons: Record<string, any> = {
        'Total Businesses': Building2,
        'Total Customers': Users,
        'Total Platform Taps': Star,
        'Active Devices': Activity
    };

    return (
        <div className="p-8 space-y-10">
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-text-main mb-2 uppercase tracking-tighter">System Loyalty Control</h1>
                <p className="text-text-secondary uppercase text-[10px] tracking-widest font-black">Platform-Wide Reward Ecosystem Monitoring</p>
            </div>

            {/* Global Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat: any, index: number) => {
                    const Icon = statIcons[stat.label] || Star;
                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="p-6 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="w-10 h-10 bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Icon className="w-5 h-5" />
                                </div>
                                {stat.change !== 0 && (
                                    <div className={cn(
                                        "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border",
                                        stat.trend === 'up' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                                    )}>
                                        {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        {Math.abs(stat.change)}%
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1 relative z-10">{stat.label}</p>
                            <h4 className="text-2xl font-display font-black text-slate-900 group-hover:text-primary transition-colors relative z-10">{stat.value}</h4>

                            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-slate-50 rounded-full opacity-50 group-hover:bg-primary/5 transition-colors" />
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* System Activity Chart */}
                <div className="lg:col-span-8 bg-white border border-slate-200 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Platform Trajectory</h3>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Aggregate Tap Activity (Last 12 Months)</p>
                        </div>
                    </div>

                    <div className="h-[350px] flex items-end justify-between gap-3 px-2">
                        {monthlyData.length > 0 ? monthlyData.map((data: any, index: number) => (
                            <div key={index} className="flex-1 flex flex-col items-center gap-3 group">
                                <div
                                    className="w-full bg-slate-50 border border-slate-100 rounded-t-lg group-hover:bg-primary/10 group-hover:border-primary/20 transition-all relative overflow-hidden"
                                    style={{ height: `${Math.max(5, (data.value / (Math.max(...monthlyData.map((d: any) => d.value)) || 1)) * 100)}%` }}
                                >
                                    <div className="absolute bottom-0 w-full bg-primary/20 h-0 group-hover:h-full transition-all duration-700"></div>
                                </div>
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{data.month}</span>
                            </div>
                        )) : (
                            <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-100 text-slate-300">
                                <Activity className="w-12 h-12 mb-4 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No historical data stream...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Alerts & Critical Status */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-900 p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <ShieldAlert className="w-5 h-5 text-rose-500" />
                                <h3 className="text-lg font-bold tracking-tight uppercase">Security Pulse</h3>
                            </div>

                            <div className="space-y-4">
                                {securityAlerts.map((alert: any, i: number) => (
                                    <div key={i} className="p-3 bg-white/5 border-l-2 border-white/10 flex gap-3 items-start">
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full mt-1.5",
                                            alert.type === 'risk' ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" :
                                                alert.type === 'warn' ? "bg-yellow-500" : "bg-blue-400"
                                        )} />
                                        <p className="text-[10px] font-medium text-white/60 leading-relaxed uppercase tracking-wide">{alert.msg}</p>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full h-12 mt-8 bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                Audit Fraud Logs
                            </button>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -translate-y-16 translate-x-16" />
                    </div>

                    <div className="bg-white border border-slate-200 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <PieChart className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight uppercase">Sector Split</h3>
                        </div>

                        <div className="space-y-4">
                            {sectorSplit.map((sector: any) => (
                                <div key={sector.label} className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-slate-400">{sector.label}</span>
                                        <span className="text-slate-900">{sector.value}%</span>
                                    </div>
                                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${sector.value}%` }}
                                            className="h-full bg-primary"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
