"use client";

import React from 'react';
import { AnalyticsStatsCards } from '@/components/dashboard/analytics/AnalyticsDashboard';
import { Package, AlertCircle, Archive, LayoutGrid } from 'lucide-react';

export default function InventoryAnalyticsPage() {
    const stats = [
        { label: 'Total Products', value: '142', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Stock Value', value: '₦8.4M', icon: Archive, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Low Stock Items', value: '12', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'Out of Stock', value: '4', icon: XCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    return (
        <div className="pb-24 md:pb-10 max-w-6xl mx-auto p-4 md:p-8 space-y-12">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">Inventory Analytics</h2>
            <AnalyticsStatsCards stats={stats} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="rounded-[40px] bg-white border border-gray-100 p-10 shadow-sm min-h-[300px] flex items-center justify-center">
                   <p className="text-gray-300 font-black uppercase tracking-[0.2em] text-xs">Inventory Value Trend</p>
                </div>
                <div className="rounded-[40px] bg-white border border-gray-100 p-10 flex items-center justify-center min-h-[300px]">
                   <p className="text-gray-300 font-black uppercase tracking-[0.2em] text-xs">Reorder Recommendations</p>
                </div>
            </div>
        </div>
    );
}

function XCircle({ size, className }: any) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
}
