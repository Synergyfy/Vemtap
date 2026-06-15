"use client";

import React from 'react';
import { 
    DiscoveryOverviewHeader, 
    DiscoveryMetrics,
    DiscoveryScoreCard
} from '@/components/dashboard/discovery/DiscoveryComponents';
import { 
    Eye, Store, MousePointer, Users, 
    TrendingUp, Plus, BarChart3, ArrowRight
} from 'lucide-react';
import { useDiscoveryStore } from '@/store/useDiscoveryStore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function DiscoveryPage() {
    const { discoveryScore } = useDiscoveryStore();

    const stats = [
        { label: 'Discovery Views', value: '12,450', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%' },
        { label: 'Profile Visits', value: '4,120', icon: Store, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+8%' },
        { label: 'Promo Clicks', value: '980', icon: MousePointer, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+15%' },
        { label: 'Customer Leads', value: '315', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+10%' },
        { label: 'Conv. Rate', value: '7.6%', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50', trend: '+2%' },
    ];

    return (
        <div className="pb-24 md:pb-10 max-w-6xl mx-auto p-4 md:p-8 space-y-12">
            <DiscoveryOverviewHeader />
            
            <DiscoveryMetrics stats={stats} />
            
            <DiscoveryScoreCard score={discoveryScore} />

            {/* QUICK ACTIONS & CHART PLACEHOLDER */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 rounded-[40px] bg-white p-10 border border-gray-100 shadow-sm min-h-[400px]">
                   <h3 className="text-xl font-black text-gray-900 mb-8">Performance Over Time</h3>
                   <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-100 rounded-3xl">
                      <p className="text-gray-300 font-black uppercase tracking-[0.2em] text-xs">Discovery Trend Chart</p>
                   </div>
                </div>

                <div className="space-y-6">
                    <Link href="/dashboard/discovery/promotions" className="block p-8 rounded-[40px] bg-[#066CF4] text-white shadow-2xl shadow-blue-500/20 hover:scale-[1.02] transition-all">
                        <div className="size-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                            <Plus size={28} />
                        </div>
                        <h3 className="text-xl font-black mb-2">Create Promotion</h3>
                        <p className="text-sm font-medium text-white/70">Launch a new offer to drive traffic from the network.</p>
                        <ArrowRight size={24} className="mt-8" />
                    </Link>

                    <Link href="/dashboard/discovery/analytics" className="block p-8 rounded-[40px] bg-white border border-gray-100 shadow-sm hover:border-[#066CF4]/20 hover:shadow-xl transition-all">
                        <div className="size-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
                            <BarChart3 size={28} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">Detailed Analytics</h3>
                        <p className="text-sm font-medium text-gray-400">View performance breakdown by source and interest.</p>
                        <ArrowRight size={24} className="mt-8 text-gray-300" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
