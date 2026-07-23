"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
    CRMOverviewHeader, 
    CRMStatsCards, 
    CRMQuickActions, 
    CRMActivityFeed, 
    CRMRecentCustomers 
} from '@/components/dashboard/crm/CRMOverview';
import { CRMGrowthChart } from '@/components/dashboard/crm/CRMChart';
import { useVisitors, useVisitorStats, useActivityFeed } from '@/services/visitors/hooks';
import { useAIStore } from '@/store/useAIStore';
import { Users, UserPlus, Repeat, Activity } from 'lucide-react';

export default function CustomersDashboard() {
    const { data: paginatedData, isLoading: isLoadingVisitors } = useVisitors(undefined, { limit: 5 });
    const { data: statsData, isLoading: isLoadingStats } = useVisitorStats();
    const { data: activityData, isLoading: isLoadingActivity } = useActivityFeed();

    const setAnalysisContext = useAIStore((state) => state.triggerAnalysis);

    const visitors = paginatedData?.data || [];
    const activities = activityData?.data || [];
    const isLoading = isLoadingVisitors || isLoadingStats || isLoadingActivity;

    const stats = statsData?.stats && statsData.stats.length > 0 ? statsData.stats.map(s => ({
        ...s,
        bg: s.color === 'blue' ? 'bg-blue-50' : s.color === 'green' ? 'bg-emerald-50' : s.color === 'purple' ? 'bg-purple-50' : 'bg-amber-50',
        color: s.color === 'blue' ? 'text-blue-600' : s.color === 'green' ? 'text-emerald-600' : s.color === 'purple' ? 'text-purple-600' : 'text-amber-600',
        icon: s.icon === 'group' ? Users : s.icon === 'person_add' ? UserPlus : s.icon === 'repeat' ? Repeat : Activity
    })) : [];

    // Set AI analysis context with customer data
    const customerContext = useMemo(() => ({
        totalCustomers: statsData?.stats?.find(s => s.label.toLowerCase().includes('total'))?.value || paginatedData?.total?.toString() || '0',
        recentCustomers: visitors.slice(0, 5).map(v => v.name || v.firstName || v.phone).filter(Boolean),
        newThisMonth: statsData?.stats?.find(s => s.label.toLowerCase().includes('new this month'))?.value || '0',
        returningVisitors: statsData?.stats?.find(s => s.label.toLowerCase().includes('returning'))?.value || '0',
        averageFrequency: statsData?.stats?.find(s => s.label.toLowerCase().includes('frequency') || s.label.toLowerCase().includes('avg'))?.value || '0',
        recentActivity: activities.slice(0, 10).map(a => ({ userName: a.userName, type: a.type, timestamp: a.timestamp })),
    }), [statsData, paginatedData, visitors, activities]);

    useEffect(() => {
        useAIStore.setState(state => ({
            analysisContext: {
                ...state.analysisContext,
                customers: customerContext,
            },
        }));
    }, [customerContext]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Customers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 p-6 md:p-8 space-y-12">
            <CRMOverviewHeader />

            <section>
                <div className="flex items-center justify-between mb-6 px-1">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Performance Snapshot</h2>
                </div>
                <CRMStatsCards stats={stats} />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: Growth & Quick Actions */}
                <div className="lg:col-span-8 space-y-12">
                    <section>
                         <div className="flex items-center justify-between mb-6 px-1">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Growth Trends</h2>
                        </div>
                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                            <CRMGrowthChart />
                        </div>
                    </section>
                    
                    <CRMQuickActions />
                </div>

                {/* RIGHT COLUMN: Recent & Activity */}
                <div className="lg:col-span-4 space-y-12">
                    <section>
                         <div className="flex items-center justify-between mb-6 px-1">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Latest Members</h2>
                        </div>
                        <CRMRecentCustomers customers={visitors} />
                    </section>

                    <section>
                         <div className="flex items-center justify-between mb-6 px-1">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Activity Log</h2>
                        </div>
                        <CRMActivityFeed activities={activities} />
                    </section>
                </div>
            </div>
        </div>
    );
}
