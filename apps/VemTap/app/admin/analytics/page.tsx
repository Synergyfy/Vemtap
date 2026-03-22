'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { adminAnalyticsApi } from '@/lib/api/admin';
import { ShieldAlert, Info, AlertTriangle, PieChart } from 'lucide-react';

function AnalyticsContent() {
    const searchParams = useSearchParams();
    const businessId = searchParams.get('businessId');
    const [dateRange, setDateRange] = useState('30days');

    // Fetch live Admin Analytics from backend
    const { data: adminSummaryResponse, isLoading: isLoadingAdmin } = useQuery({
        queryKey: ['admin-summary'],
        queryFn: () => adminAnalyticsApi.getAdminSummary(),
    });

    const { data: businessSummaryResponse, isLoading: isLoadingBusiness } = useQuery({
        queryKey: ['business-summary'],
        queryFn: () => adminAnalyticsApi.getBusinessSummary(),
    });

    const isLoading = isLoadingAdmin || isLoadingBusiness;

    const summaryData = adminSummaryResponse?.data || adminSummaryResponse;
    const businessData = businessSummaryResponse?.data || businessSummaryResponse;

    if (isLoading) {
        return (
            <div className="p-8 animate-pulse text-center">
                <div className="h-20 w-1/3 bg-gray-100 rounded-2xl mb-8 mx-auto"></div>
                <div className="grid grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-50 rounded-xl"></div>)}
                </div>
                <div className="h-96 bg-gray-50 rounded-2xl"></div>
            </div>
        );
    }

    const stats = summaryData?.stats || [];
    const monthlyData = summaryData?.monthlyData || [];
    const securityAlerts = summaryData?.securityAlerts || [];
    const sectorSplit = summaryData?.sectorSplit || [];

    const businessStats = [
        { label: 'Total Businesses', value: businessData?.totalBusinesses || 0, icon: 'storefront', color: 'bg-blue-50 text-blue-600' },
        { label: 'Active', value: businessData?.activeBusinesses || 0, icon: 'check_circle', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Pending', value: businessData?.pendingBusinesses || 0, icon: 'pending', color: 'bg-amber-50 text-amber-600' },
        { label: 'Suspended', value: businessData?.suspendedBusinesses || 0, icon: 'block', color: 'bg-red-50 text-red-600' },
    ];

    return (
        <div className="p-8">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-text-main mb-2">
                        Platform Analytics
                    </h1>
                    <p className="text-text-secondary font-medium">
                        Holistic view of platform growth and engagement
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="90days">Last 3 Months</option>
                        <option value="1year">Last Year</option>
                    </select>
                </div>
            </div>

            {/* Global Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {stats.map((stat: any, index: number) => (
                    <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <span className="material-icons-round text-primary">
                                    {stat.label.includes('Business') ? 'store' :
                                        stat.label.includes('Customer') ? 'people' :
                                            stat.label.includes('Tap') ? 'nfc' : 'analytics'}
                                </span>
                            </div>
                            {stat.change !== 0 && (
                                <span className={`flex items-center text-[10px] font-black uppercase tracking-widest ${stat.trend === 'up' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} px-2 py-1 rounded-lg`}>
                                    {stat.trend === 'up' ? '↑' : '↓'} {stat.change}%
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">{stat.label}</p>
                        <p className="text-3xl font-display font-black text-text-main">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Business Ecosystem Section */}
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    <h2 className="text-xl font-display font-bold text-text-main">Business Ecosystem</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {businessStats.map((stat, index) => (
                        <div key={index} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                                <span className="material-icons-round text-2xl">{stat.icon}</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{stat.label}</p>
                                <p className="text-xl font-bold text-text-main">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Growth Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-lg font-black text-text-main uppercase tracking-tight">Growth Trend</h2>
                            <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">Monthly visitor activity (Last 12 Months)</p>
                        </div>
                    </div>

                    <div className="h-64 flex items-end justify-between gap-3">
                        {monthlyData.length > 0 ? monthlyData.map((data: any, index: number) => (
                            <div key={index} className="flex-1 flex flex-col items-center gap-3 group">
                                <div
                                    className="w-full bg-slate-50 border border-slate-100 rounded-t-xl group-hover:bg-primary/10 group-hover:border-primary/20 transition-all relative overflow-hidden"
                                    style={{ height: `${Math.max(5, (data.value / (Math.max(...monthlyData.map((d: any) => d.value)) || 1)) * 100)}%` }}
                                >
                                    <div className="absolute bottom-0 w-full bg-primary/20 h-0 group-hover:h-full transition-all duration-700"></div>
                                </div>
                                <span className="text-[10px] text-text-secondary font-black uppercase tracking-tighter">{data.month}</span>
                            </div>
                        )) : (
                            <div className="w-full h-full flex items-center justify-center text-text-secondary font-bold">No historical data yet</div>
                        )}
                    </div>
                </div>

                {/* Insights and Sector Split */}
                <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm flex flex-col gap-8">
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-text-main uppercase tracking-tight">Ecosystem Events</h2>
                        </div>
                        <div className="space-y-4">
                            {securityAlerts.map((alert: any, index: number) => (
                                <div key={index} className={`flex items-start gap-3 p-3 rounded-xl border ${alert.type === 'risk' ? 'border-red-100 bg-red-50 text-red-900' :
                                    alert.type === 'warn' ? 'border-amber-100 bg-amber-50 text-amber-900' :
                                        'border-blue-100 bg-blue-50 text-blue-900'
                                    }`}>
                                    <div className="shrink-0 mt-0.5">
                                        {alert.type === 'risk' ? <ShieldAlert size={16} className="text-red-500" /> :
                                            alert.type === 'warn' ? <AlertTriangle size={16} className="text-amber-500" /> :
                                                <Info size={16} className="text-blue-500" />}
                                    </div>
                                    <p className="text-xs font-medium leading-relaxed">{alert.msg}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-text-main uppercase tracking-tight flex items-center gap-2">
                                <PieChart size={18} className="text-primary" /> Sector Split
                            </h2>
                        </div>
                        <div className="space-y-4">
                            {sectorSplit.map((sector: any, index: number) => (
                                <div key={index}>
                                    <div className="flex justify-between text-xs font-bold text-text-main mb-1.5 uppercase tracking-widest">
                                        <span>{sector.label}</span>
                                        <span>{sector.value}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-primary"
                                            style={{ width: `${sector.value}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminAnalyticsPage() {
    return (
        <Suspense fallback={
            <div className="p-8 animate-pulse text-center">
                <div className="h-20 w-1/3 bg-gray-100 rounded-2xl mb-8 mx-auto"></div>
                <div className="grid grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-50 rounded-xl"></div>)}
                </div>
                <div className="h-96 bg-gray-50 rounded-2xl"></div>
            </div>
        }>
            <AnalyticsContent />
        </Suspense>
    );
}
