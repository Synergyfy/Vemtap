"use client";

import React from 'react';
import { AnalyticsStatsCards } from '@/components/dashboard/analytics/AnalyticsDashboard';
import { DollarSign, ShoppingBag, BarChart3, TrendingUp } from 'lucide-react';

export default function SalesAnalyticsPage() {
    const stats = [
        { label: 'Total Revenue', value: '₦4.2M', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+14%' },
        { label: 'Transactions', value: '1,240', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+9%' },
        { label: 'Avg Order Value', value: '₦3,387', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+2%' },
    ];

    return (
        <div className="pb-24 md:pb-10 max-w-6xl mx-auto p-4 md:p-8 space-y-12">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">Sales Analytics</h2>
            <AnalyticsStatsCards stats={stats} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="rounded-[40px] bg-white border border-gray-100 p-10 shadow-sm min-h-[300px] flex items-center justify-center">
                   <p className="text-gray-300 font-black uppercase tracking-[0.2em] text-xs">Revenue Trend Chart</p>
                </div>
                <div className="rounded-[40px] bg-white border border-gray-100 p-10 flex items-center justify-center min-h-[300px]">
                   <p className="text-gray-300 font-black uppercase tracking-[0.2em] text-xs">Best Selling Products Table</p>
                </div>
            </div>
        </div>
    );
}
