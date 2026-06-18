"use client";

import React from 'react';
import { AnalyticsStatsCards } from '@/components/dashboard/analytics/AnalyticsDashboard';
import { Globe, Eye, MousePointer2, Users } from 'lucide-react';

export default function DiscoveryAnalyticsPage() {
    const stats = [
        { label: 'Profile Views', value: '12,400', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Offer Views', value: '3,200', icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Discovery Clicks', value: '890', icon: MousePointer2, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Store Visits', value: '450', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    return (
        <div className="pb-24 md:pb-10 max-w-7xl mx-auto p-4 md:p-8 space-y-12">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">Discovery Analytics</h2>
            <AnalyticsStatsCards stats={stats} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="rounded-[40px] bg-white border border-gray-100 p-10 shadow-sm min-h-[300px] flex items-center justify-center">
                   <p className="text-gray-300 font-black uppercase tracking-[0.2em] text-xs">Network Performance Chart</p>
                </div>
                <div className="rounded-[40px] bg-white border border-gray-100 p-10 flex items-center justify-center min-h-[300px]">
                   <p className="text-gray-300 font-black uppercase tracking-[0.2em] text-xs">Discovery Lead Funnel</p>
                </div>
            </div>
        </div>
    );
}
