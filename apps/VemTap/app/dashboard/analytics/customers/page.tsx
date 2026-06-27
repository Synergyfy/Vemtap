"use client";

import React from 'react';
import { 
    AnalyticsOverviewHeader, 
    AnalyticsStatsCards 
} from '@/components/dashboard/analytics/AnalyticsDashboard';
import { Users, UserPlus, Repeat, Zap, Loader2 } from 'lucide-react';
import { useDashboardAnalytics } from '@/services/analytics/hooks';

export default function CustomerAnalyticsPage() {
    const { data: analytics, isLoading } = useDashboardAnalytics();

    if (isLoading) {
        return (
            <div className="pb-24 md:pb-10 max-w-7xl mx-auto p-4 md:p-8 flex items-center justify-center min-h-[300px]">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        );
    }

    // Backend returns stats[] array with labels - find them by label
    const findStat = (label: string) => analytics?.stats?.find((s: any) => s.label === label);
    const totalVisitors = findStat('Total Visitors')?.value ?? '0';
    const newVisitors = findStat('New Visitors')?.value ?? '0';
    const totalTaps = findStat('Total Taps')?.value ?? '0';
    const messagesSent = findStat('Messages Sent')?.value ?? '0';

    const stats = [
        { label: 'Total Customers', value: totalVisitors.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'New Visitors', value: newVisitors.toString(), icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Total Taps / Visits', value: totalTaps.toString(), icon: Repeat, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Messages Sent', value: messagesSent.toString(), icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    return (
        <div className="pb-24 md:pb-10 max-w-7xl mx-auto p-4 md:p-8 space-y-12">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">Customer Analytics</h2>
            <AnalyticsStatsCards stats={stats} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="rounded-[40px] bg-white border border-gray-100 p-10 shadow-sm min-h-[300px] flex items-center justify-center">
                   <p className="text-gray-300 font-black uppercase tracking-[0.2em] text-xs">Customer Growth Chart</p>
                </div>
                <div className="rounded-[40px] bg-white border border-gray-100 p-10 flex items-center justify-center min-h-[300px]">
                   <p className="text-gray-300 font-black uppercase tracking-[0.2em] text-xs">Acquisition Sources</p>
                </div>
            </div>
        </div>
    );
}
