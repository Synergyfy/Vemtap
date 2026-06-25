"use client";

import React from 'react';
import { AnalyticsStatsCards } from '@/components/dashboard/analytics/AnalyticsDashboard';
import { Megaphone, Send, MailOpen, MousePointer, Loader2 } from 'lucide-react';
import { useMessagingAnalytics } from '@/services/messaging/hooks';
import { useMessagingCampaigns } from '@/services/messaging/hooks';

export default function MarketingAnalyticsPage() {
    const { data: analytics, isLoading: analyticsLoading } = useMessagingAnalytics();
    const { data: campaignsData, isLoading: campaignsLoading } = useMessagingCampaigns();
    const campaigns = (campaignsData as any)?.data ?? [];

    const isLoading = analyticsLoading || campaignsLoading;

    if (isLoading) {
        return (
            <div className="pb-24 md:pb-10 max-w-7xl mx-auto p-4 md:p-8 flex items-center justify-center min-h-[300px]">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        );
    }

    const stats = [
        { label: 'Campaigns Sent', value: campaigns.length.toString(), icon: Megaphone, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Messages Delivered', value: analytics?.delivered?.toLocaleString() ?? '0', icon: Send, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Open Rate', value: analytics?.openRate != null ? `${analytics.openRate.toFixed(1)}%` : '0%', icon: MailOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Click Rate', value: analytics?.globalStats?.clickRate != null ? `${analytics.globalStats.clickRate.toFixed(1)}%` : '0%', icon: MousePointer, color: 'text-amber-600', bg: 'bg-amber-50' },
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
