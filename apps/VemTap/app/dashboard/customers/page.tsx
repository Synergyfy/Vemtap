"use client";

import React, { useState } from 'react';
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

export default function CustomersDashboard() {
    const { data: paginatedData, isLoading: isLoadingVisitors } = useVisitors(undefined, { limit: 5 });
    const { data: statsData, isLoading: isLoadingStats } = useVisitorStats();

    const visitors = paginatedData?.data || [];
    const isLoading = isLoadingVisitors || isLoadingStats;

    const stats = statsData?.stats && statsData.stats.length > 0 ? statsData.stats.map(s => ({
        ...s,
        bg: s.color === 'blue' ? 'bg-blue-50' : s.color === 'green' ? 'bg-emerald-50' : s.color === 'purple' ? 'bg-purple-50' : 'bg-amber-50',
        color: s.color === 'blue' ? 'text-blue-600' : s.color === 'green' ? 'text-emerald-600' : s.color === 'purple' ? 'text-purple-600' : 'text-amber-600',
        icon: s.icon === 'group' ? Users : s.icon === 'person_add' ? UserPlus : s.icon === 'repeat' ? Repeat : Activity
    })) : [
        { label: 'Total Customers', value: '1,250', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: { value: '+12%', isUp: true } },
        { label: 'New This Month', value: '120', icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: { value: '+5%', isUp: true } },
        { label: 'Returning', value: '740', icon: Repeat, color: 'text-purple-600', bg: 'bg-purple-50', trend: { value: '+8%', isUp: true } },
        { label: 'Active Today', value: '580', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50', trend: { value: '-2%', isUp: false } },
    ];

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
                        <CRMRecentCustomers customers={visitors.length > 0 ? visitors : [
                            { id: '1', name: 'Sarah Jenkins', phone: '+234 801 234 5678', status: 'VIP', joinedDate: '2 hours ago' },
                            { id: '2', name: 'Michael K.', phone: '+234 802 345 6789', status: 'New', joinedDate: '5 hours ago' },
                            { id: '3', name: 'Elena Rodriguez', phone: '+234 803 456 7890', status: 'Active', joinedDate: 'Yesterday' },
                        ]} />
                    </section>

                    <section>
                         <div className="flex items-center justify-between mb-6 px-1">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Activity Log</h2>
                        </div>
                        <CRMActivityFeed />
                    </section>
                </div>
            </div>
        </div>
    );
}
