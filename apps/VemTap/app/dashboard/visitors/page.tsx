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
import { Users, UserPlus, Repeat, Activity, Star } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

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
    })) : [
        { label: 'Total Customers', value: '1,250', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: { value: '+12%', isUp: true } },
        { label: 'New This Month', value: '120', icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: { value: '+5%', isUp: true } },
        { label: 'Returning', value: '740', icon: Repeat, color: 'text-purple-600', bg: 'bg-purple-50', trend: { value: '+8%', isUp: true } },
        { label: 'Active Today', value: '580', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50', trend: { value: '-2%', isUp: false } },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="pb-24 md:pb-10 max-w-5xl mx-auto p-4 md:p-8 space-y-12">
            {/* SCREEN 1: CUSTOMERS OVERVIEW */}
            
            <CRMOverviewHeader />

            {/* CUSTOMER SUMMARY CARDS */}
            <CRMStatsCards stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: Growth & Activity */}
                <div className="lg:col-span-8 space-y-8">
                    {/* CUSTOMER GROWTH CHART */}
                    <CRMGrowthChart />
                    
                    {/* QUICK ACTIONS */}
                    <CRMQuickActions />
                </div>

                {/* RIGHT COLUMN: Recent & Feed */}
                <div className="lg:col-span-4 space-y-8">
                    {/* RECENT CUSTOMERS */}
                    <CRMRecentCustomers customers={visitors.length > 0 ? visitors : [
                        { id: '1', name: 'Sarah Jenkins', phone: '+234 801 234 5678', status: 'VIP', joinedDate: '2 hours ago' },
                        { id: '2', name: 'Michael K.', phone: '+234 802 345 6789', status: 'New', joinedDate: '5 hours ago' },
                        { id: '3', name: 'Elena Rodriguez', phone: '+234 803 456 7890', status: 'Active', joinedDate: 'Yesterday' },
                        { id: '4', name: 'David Wilson', phone: '+234 804 567 8901', status: 'Active', joinedDate: '2 days ago' },
                        { id: '5', name: 'James T.', phone: '+234 805 678 9012', status: 'Inactive', joinedDate: '1 week ago' },
                    ]} />

                    {/* CUSTOMER ACTIVITY SUMMARY */}
                    <CRMActivityFeed />
                </div>
            </div>
        </div>
    );
}
