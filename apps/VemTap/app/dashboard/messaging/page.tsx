"use client";

import React from 'react';
import { 
    MessagingOverviewHeader, 
    MessagingStatsCards, 
    MessagingQuickActions, 
    RecentCampaignsList 
} from '@/components/dashboard/messaging/MessagingDashboard';
import { 
    Megaphone, Send, MailOpen, MousePointer, 
    Activity, Layout, Sparkles, Plus
} from 'lucide-react';
import { useMessagingCampaigns, useMessagingAnalytics } from '@/services/messaging/hooks';
import Spinner from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function MessagingPage() {
    const { data: campaignsData, isLoading: campaignsLoading } = useMessagingCampaigns();
    const campaigns = (campaignsData as any)?.data || [];
    const { data: analytics, isLoading: analyticsLoading } = useMessagingAnalytics();

    const isLoading = campaignsLoading || analyticsLoading;

    const stats = analytics ? [
        { label: 'Total Messages', value: campaigns.length.toString(), icon: Megaphone, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+0%' },
        { label: 'Messages Sent', value: analytics.sent?.toLocaleString() || '0', icon: Send, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+0%' },
        { label: 'Open Rate', value: analytics?.openRate ? `${analytics.openRate}%` : '0%', icon: MailOpen, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+0%' },
        { label: 'Click Rate', value: analytics?.globalStats?.clickRate ? `${analytics.globalStats.clickRate}%` : '0%', icon: MousePointer, color: 'text-amber-600', bg: 'bg-amber-50', trend: '+0%' },
    ] : [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="pb-24 md:pb-10 max-w-5xl mx-auto p-4 md:p-8 space-y-12">
            {/* SCREEN 1: MESSAGE DASHBOARD */}
            
            <MessagingOverviewHeader />

            {/* OVERVIEW METRICS */}
            <MessagingStatsCards stats={stats} />

            {/* QUICK ACTIONS */}
            <MessagingQuickActions />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: Recent Messages */}
                <div className="lg:col-span-8 space-y-8">
                    <RecentCampaignsList campaigns={campaigns} />
                </div>

                {/* RIGHT COLUMN: Templates & Small Actions */}
                <div className="lg:col-span-4 space-y-8">
                    {/* EMPTY STATE MOCK (Small version) */}
                    {(!campaigns || campaigns.length === 0) && (
                        <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100 text-center">
                            <div className="size-16 rounded-full bg-blue-50 text-[#066CF4] flex items-center justify-center mx-auto mb-4">
                                <Plus size={32} />
                            </div>
                            <h4 className="text-sm font-black text-gray-900 mb-2">No messages yet</h4>
                            <p className="text-xs font-medium text-gray-400 mb-6">Start engaging your audience today.</p>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
