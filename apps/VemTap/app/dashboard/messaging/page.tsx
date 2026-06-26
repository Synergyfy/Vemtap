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
        { label: 'Total Campaigns', value: campaigns.length.toString(), icon: Megaphone, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+0%' },
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
            {/* SCREEN 1: CAMPAIGN DASHBOARD */}
            
            <MessagingOverviewHeader />

            {/* OVERVIEW METRICS */}
            <MessagingStatsCards stats={stats} />

            {/* QUICK ACTIONS */}
            <MessagingQuickActions />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: Recent Campaigns */}
                <div className="lg:col-span-8 space-y-8">
                    <RecentCampaignsList campaigns={campaigns} />
                </div>

                {/* RIGHT COLUMN: Templates & Small Actions */}
                <div className="lg:col-span-4 space-y-8">
                    {/* MESSAGE TEMPLATES */}
                    <div className="rounded-[32px] bg-gray-900 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#066CF4]/20 rounded-full blur-2xl" />
                        <h3 className="text-xl font-black mb-6 relative z-10">Premium Templates</h3>
                        <div className="space-y-3 relative z-10">
                            {['Promotion', 'Flash Sale', 'Event Invitation', 'Welcome Message'].map((t) => (
                                <button key={t} className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left group">
                                    <span className="text-xs font-bold text-white/80 group-hover:text-white">{t}</span>
                                    <Sparkles size={14} className="text-[#066CF4]" />
                                </button>
                            ))}
                        </div>
                        <Button className="w-full mt-8 h-12 rounded-xl bg-[#066CF4] text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/20">
                            Explore All
                        </Button>
                    </div>

                    {/* EMPTY STATE MOCK (Small version) */}
                    {(!campaigns || campaigns.length === 0) && (
                        <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100 text-center">
                            <div className="size-16 rounded-full bg-blue-50 text-[#066CF4] flex items-center justify-center mx-auto mb-4">
                                <Plus size={32} />
                            </div>
                            <h4 className="text-sm font-black text-gray-900 mb-2">No active campaigns</h4>
                            <p className="text-xs font-medium text-gray-400 mb-6">Start engaging your audience today.</p>
                            <Link href="/dashboard/messaging/create">
                                <Button variant="outline" className="h-10 px-6 rounded-xl border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#066CF4]">
                                    New Campaign
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
