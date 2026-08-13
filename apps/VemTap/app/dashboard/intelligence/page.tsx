"use client";

import React from 'react';
import { 
    IntelligenceHubHeader, 
    ActionableInsightsGrid 
} from '@/components/dashboard/intelligence/IntelligenceComponents';
import { useIntelligenceStore } from '@/store/useIntelligenceStore';
import { motion } from 'framer-motion';

export default function IntelligenceHubPage() {
    return (
        <div className="pb-24 md:pb-10 max-w-6xl mx-auto p-4 md:p-6 space-y-8">
            
            <IntelligenceHubHeader />
            
            {/* KPI OVERVIEW MOCK */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Customer Health Score', value: '85/100' },
                    { label: 'Avg Lifetime Value', value: '₦142k' },
                    { label: 'Retention Rate', value: '78%' },
                    { label: 'Growth Potential', value: 'High' },
                ].map((stat, i) => (
                    <div key={i} className="p-5 md:p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                        <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* ACTIONABLE INSIGHTS */}
            <ActionableInsightsGrid />

            {/* TREND CHART PLACEHOLDER */}
            <div className="rounded-2xl bg-gray-900 p-7 text-white min-h-[300px] flex items-center justify-center shadow-lg">
                <p className="text-white/30 font-semibold uppercase tracking-wider text-xs">Customer Health Trend Chart</p>
            </div>
        </div>
    );
}
