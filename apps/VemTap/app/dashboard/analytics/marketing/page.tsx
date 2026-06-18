"use client";

import React from 'react';
import { AnalyticsStatsCards } from '@/components/dashboard/analytics/AnalyticsDashboard';
import { Megaphone, Send, MailOpen, MousePointer } from 'lucide-react';

export default function MarketingAnalyticsPage() {
    const stats = [
        { label: 'Campaigns Sent', value: '124', icon: Megaphone, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Messages Delivered', value: '24.2k', icon: Send, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Open Rate', value: '68%', icon: MailOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Click Rate', value: '21%', icon: MousePointer, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    return (
        <div className="pb-24 md:pb-10 max-w-7xl mx-auto p-4 md:p-8 space-y-12">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">Marketing Analytics</h2>
            <AnalyticsStatsCards stats={stats} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="rounded-[40px] bg-white border border-gray-100 p-10 shadow-sm min-h-[300px] flex items-center justify-center">
                   <p className="text-gray-300 font-black uppercase tracking-[0.2em] text-xs">Campaign Performance Leaderboard</p>
                </div>
                <div className="rounded-[40px] bg-white border border-gray-100 p-10 flex items-center justify-center min-h-[300px]">
                   <p className="text-gray-300 font-black uppercase tracking-[0.2em] text-xs">Engagement Funnel</p>
                </div>
            </div>
        </div>
    );
}
