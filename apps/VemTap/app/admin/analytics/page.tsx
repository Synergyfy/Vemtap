'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { adminAnalyticsApi } from '@/lib/api/admin';
import { ShieldAlert, Info, AlertTriangle, PieChart } from 'lucide-react';

export default function AdminAnalyticsPage() {
    const searchParams = useSearchParams();
    const businessId = searchParams.get('businessId');
    const [dateRange, setDateRange] = useState('30days');

    // Fetch live Admin Analytics from backend when in platform view
    const { data: adminDataResponse, isLoading: isLoadingAdmin } = useQuery({
        queryKey: ['admin-loyalty-stats'],
        queryFn: () => adminAnalyticsApi.getLoyaltyStats(),
        enabled: !businessId,
    });

    const adminData = adminDataResponse?.data || adminDataResponse;

    // Mock data expansion to support business-specific views
    const BUSINESS_DATA: Record<string, any> = {
        '1': {
            name: 'Green Terrace Cafe',
            stats: [
                { label: 'Total Taps', value: '45.2K', change: '+12%', trend: 'up', icon: 'nfc' },
                { label: 'Unique Visitors', value: '12.5K', change: '+8%', trend: 'up', icon: 'people' },
                { label: 'Loyalty Signups', value: '850', change: '+15%', trend: 'up', icon: 'stars' },
                { label: 'Est. Revenue', value: '₦4.2M', change: '+5%', trend: 'up', icon: 'payments' },
            ]
        },
        '2': {
            name: 'Tech Hub Lagos',
            stats: [
                { label: 'Total Taps', value: '38.1K', change: '+25%', trend: 'up', icon: 'nfc' },
                { label: 'Unique Visitors', value: '8.9K', change: '+18%', trend: 'up', icon: 'people' },
                { label: 'Event Check-ins', value: '4.2K', change: '+10%', trend: 'up', icon: 'event' },
                { label: 'Est. Revenue', value: '₦8.9M', change: '+12%', trend: 'up', icon: 'payments' },
            ]
        }
    };

    const isPlatformView = !businessId || !BUSINESS_DATA[businessId];
    const currentBusiness = !isPlatformView ? BUSINESS_DATA[businessId!] : null;

    // Use backend stats if available and in platform view, falling back to mock
    const platformStats = adminData?.stats?.map((stat: any, index: number) => {
        // Map backend labels to material icons
        const icons = ['loyalty', 'people', 'dynamic_feed', 'security'];
        return {
            label: stat.label,
            value: stat.value,
            change: `${stat.change > 0 ? '+' : ''}${stat.change}%`,
            trend: stat.trend,
            icon: icons[index] || 'analytics'
        };
    }) || [
            { label: 'Total Taps', value: '1.2M', change: '+12%', trend: 'up', icon: 'nfc' },
            { label: 'Unique Visitors', value: '850K', change: '+8%', trend: 'up', icon: 'people' },
            { label: 'Avg. Retention', value: '45%', change: '+2%', trend: 'up', icon: 'repeat' },
            { label: 'Platform Revenue', value: '₦125M', change: '+15%', trend: 'up', icon: 'attach_money' },
        ];

    const stats = isPlatformView ? platformStats : currentBusiness.stats;

    const monthlyData = [
        { month: 'Jan', value: 65 },
        { month: 'Feb', value: 72 },
        { month: 'Mar', value: 85 },
        { month: 'Apr', value: 82 },
        { month: 'May', value: 90 },
        { month: 'Jun', value: 98 },
        { month: 'Jul', value: 112 },
        { month: 'Aug', value: 125 },
        { month: 'Sep', value: 138 },
        { month: 'Oct', value: 142 },
        { month: 'Nov', value: 155 },
        { month: 'Dec', value: 170 },
    ];

    return (
        <div className="p-8">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-text-main mb-2">
                        {isPlatformView ? 'Platform Analytics' : `${currentBusiness.name} Analytics`}
                    </h1>
                    <p className="text-text-secondary font-medium">
                        {isPlatformView
                            ? 'Holistic view of platform growth and engagement'
                            : `Detailed performance metrics for ${currentBusiness.name}`}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {!isPlatformView && (
                        <button
                            onClick={() => window.history.back()}
                            className="px-4 py-2 text-primary font-bold text-sm bg-primary/5 rounded-xl hover:bg-primary/10 transition-all"
                        >
                            Back to List
                        </button>
                    )}
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

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {isLoadingAdmin && isPlatformView ? (
                    <div className="col-span-4 py-12 text-center flex items-center justify-center text-primary font-bold animate-pulse">
                        Loading ecosystem metrics...
                    </div>
                ) : stats.map((stat: any, index: number) => (
                    <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <span className="material-icons-round text-primary">{stat.icon}</span>
                            </div>
                            <span className={`flex items-center text-[10px] font-black uppercase tracking-widest ${stat.trend === 'up' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} px-2 py-1 rounded-lg`}>
                                {stat.trend === 'up' ? '↑' : '↓'} {stat.change}
                            </span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">{stat.label}</p>
                        <p className="text-3xl font-display font-black text-text-main">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Growth Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-lg font-black text-text-main uppercase tracking-tight">Growth Trend</h2>
                            <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">Monthly visitor activity over the last year</p>
                        </div>
                        <button className="text-primary text-xs font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Full Report</button>
                    </div>

                    <div className="h-64 flex items-end justify-between gap-3">
                        {monthlyData.map((data, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center gap-3 group">
                                <div
                                    className="w-full bg-slate-50 border border-slate-100 rounded-t-xl group-hover:bg-primary/10 group-hover:border-primary/20 transition-all relative overflow-hidden"
                                    style={{ height: `${(data.value / 200) * 100}%` }}
                                >
                                    <div className="absolute bottom-0 w-full bg-primary/20 h-0 group-hover:h-full transition-all duration-700"></div>
                                </div>
                                <span className="text-[10px] text-text-secondary font-black uppercase tracking-tighter">{data.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Platform Insights / Specifics */}
                {isPlatformView ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm flex flex-col gap-8">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-black text-text-main uppercase tracking-tight">Ecosystem Events</h2>
                            </div>
                            <div className="space-y-4">
                                {adminData?.securityAlerts?.map((alert: any, index: number) => (
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
                                {adminData?.sectorSplit?.map((sector: any, index: number) => (
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
                ) : (
                    <div className="bg-text-main rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 size-40 bg-white/5 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                            <h2 className="text-lg font-black uppercase tracking-tight mb-8">Quick Statistics</h2>
                            <div className="space-y-8">
                                <div>
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-2">Customer Loyalty</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-black">82%</span>
                                        <span className="text-xs font-bold text-green-400 mb-1">+5% vs last month</span>
                                    </div>
                                </div>
                                <div className="h-px bg-white/10 w-full" />
                                <div>
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-2">Average Stay Time</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-black">42m</span>
                                        <span className="text-xs font-bold text-amber-400 mb-1">Peak at 7pm - 9pm</span>
                                    </div>
                                </div>
                                <div className="h-px bg-white/10 w-full" />
                                <div>
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-2">Review Conversion</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-black">12.4%</span>
                                        <span className="text-xs font-bold text-blue-400 mb-1">158 new reviews</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
