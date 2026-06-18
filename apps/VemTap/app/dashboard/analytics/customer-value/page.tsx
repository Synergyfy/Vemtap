"use client";

import React from 'react';
import { AnalyticsStatsCards } from '@/components/dashboard/analytics/AnalyticsDashboard';
import { Star, TrendingUp, Users, Target } from 'lucide-react';

export default function CustomerValuePage() {
    const stats = [
        { label: 'Avg CLV', value: '₦45,200', icon: Star, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Avg Spend', value: '₦3,450', icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Retention Rate', value: '78%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Repeat Purchase', value: '42%', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
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
