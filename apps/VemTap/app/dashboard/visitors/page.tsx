"use client";

import React from 'react';
import { 
    CRMOverviewHeader, 
    CRMStatsCards, 
    CRMQuickActions, 
    CRMActivityFeed, 
    CRMRecentCustomers 
} from '@/components/dashboard/crm/CRMOverview';
import { CRMGrowthChart } from '@/components/dashboard/crm/CRMChart';
import { useVisitors, useVisitorStats } from '@/services/visitors/hooks';
import { Users, UserPlus, Repeat, Activity } from 'lucide-react';

export default function VisitorsOverviewPage() {
    const { data: paginatedData, isLoading: isLoadingVisitors } = useVisitors(undefined, { limit: 5 });
    const { data: statsData, isLoading: isLoadingStats } = useVisitorStats();

    const visitors = paginatedData?.data || [];
    const isLoading = isLoadingVisitors || isLoadingStats;

    const stats = statsData?.stats && statsData.stats.length > 0 ? statsData.stats.map(s => ({
        ...s,
        bg: s.color === 'blue' ? 'bg-blue-50' : s.color === 'green' ? 'bg-emerald-50' : s.color === 'purple' ? 'bg-purple-50' : 'bg-amber-50',
        color: s.color === 'blue' ? 'text-blue-600' : s.color === 'green' ? 'text-emerald-600' : s.color === 'purple' ? 'text-purple-600' : 'text-amber-600',
        icon: s.icon === 'group' ? Users : s.icon === 'person_add' ? UserPlus : s.icon === 'repeat' ? Repeat : Activity
    })) : [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Loading Customers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 p-4 md:p-6 max-w-7xl mx-auto space-y-8">
            <CRMOverviewHeader />

            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Performance Snapshot</h2>
                </div>
                <CRMStatsCards stats={stats} />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                {/* LEFT COLUMN: Growth & Quick Actions */}
                <div className="lg:col-span-8 space-y-8">
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Growth Trends</h2>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <CRMGrowthChart />
                        </div>
                    </section>
                    
                    <CRMQuickActions />
                </div>

                {/* RIGHT COLUMN: Recent & Activity */}
                <div className="lg:col-span-4 space-y-8">
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Latest Members</h2>
                        </div>
                        <CRMRecentCustomers customers={visitors} />
                    </section>

                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Activity Log</h2>
                        </div>
                        <CRMActivityFeed />
                    </section>
                </div>
            </div>
        </div>
    );
}
