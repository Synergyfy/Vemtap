"use client";

import React from 'react';
import { AnalyticsStatsCards } from '@/components/dashboard/analytics/AnalyticsDashboard';
import { Star, TrendingUp, Users, Target, Loader2 } from 'lucide-react';
import { usePosDashboard } from '@/services/pos/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useDashboardAnalytics } from '@/services/analytics/hooks';

export default function CustomerValuePage() {
    const { activeBranchId } = useActiveBranch();
    const { data: posDashboard, isLoading: posLoading } = usePosDashboard(activeBranchId ?? undefined);
    const { data: analytics, isLoading: analyticsLoading } = useDashboardAnalytics();

    const isLoading = posLoading || analyticsLoading;

    if (isLoading) {
        return (
            <div className="pb-24 md:pb-10 max-w-7xl mx-auto p-4 md:p-8 flex items-center justify-center min-h-[300px]">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        );
    }

    const totalRevenue = posDashboard?.revenue ?? 0;
    const transactionCount = posDashboard?.transactionCount ?? 0;
    const avgSaleValue = posDashboard?.averageSaleValue ?? 0;

    const findStat = (label: string) => analytics?.stats?.find((s: any) => s.label === label);
    const totalVisitors = parseInt(findStat('Total Visitors')?.value ?? '0', 10) || 1; // avoid divide by zero

    // CLV = total revenue / unique customers
    const avgClv = totalVisitors > 0 ? Math.round(totalRevenue / totalVisitors) : 0;
    // Retention proxy: repeat visitors / total visitors (only valid if backend provides it)
    const repeatStat = findStat('Returning Visitors');
    const repeatVisitors = parseInt(repeatStat?.value ?? '0', 10);
    const retentionRate = totalVisitors > 0 ? Math.round((repeatVisitors / totalVisitors) * 100) : 0;
    const repeatPurchaseRate = transactionCount > 0 && totalVisitors > 0
        ? Math.round(Math.min((transactionCount / totalVisitors) * 100, 100))
        : 0;

    const stats = [
        { label: 'Avg CLV', value: `₦${avgClv.toLocaleString()}`, icon: Star, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Avg Spend', value: `₦${Math.round(avgSaleValue).toLocaleString()}`, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Retention Rate', value: `${retentionRate}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Repeat Purchase', value: `${repeatPurchaseRate}%`, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    return (
        <div className="pb-24 md:pb-10 max-w-7xl mx-auto p-4 md:p-8 space-y-12">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">Customer Value Analytics</h2>
            <AnalyticsStatsCards stats={stats} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="rounded-[40px] bg-white border border-gray-100 p-10 shadow-sm min-h-[300px] flex items-center justify-center">
                   <p className="text-gray-300 font-black uppercase tracking-[0.2em] text-xs">CLV Growth Chart</p>
                </div>
                <div className="rounded-[40px] bg-white border border-gray-100 p-10 flex items-center justify-center min-h-[300px]">
                   <p className="text-gray-300 font-black uppercase tracking-[0.2em] text-xs">Top Customers Leaderboard</p>
                </div>
            </div>
        </div>
    );
}
