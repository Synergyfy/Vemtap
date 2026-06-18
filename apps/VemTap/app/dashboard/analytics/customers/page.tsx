"use client";

import React from 'react';
import { 
    AnalyticsOverviewHeader, 
    AnalyticsStatsCards 
} from '@/components/dashboard/analytics/AnalyticsDashboard';
import { Users, UserPlus, Repeat, Zap } from 'lucide-react';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';

export default function CustomerAnalyticsPage() {
    const stats = [
        { label: 'Total Customers', value: '5,240', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%' },
        { label: 'New Customers', value: '340', icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+8%' },
        { label: 'Returning', value: '2,100', icon: Repeat, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+10%' },
        { label: 'Inactive', value: '145', icon: Zap, color: 'text-red-600', bg: 'bg-red-50', trend: '-2%' },
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
