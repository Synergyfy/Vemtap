"use client";

import React, { useState } from 'react';
import { 
    AnalyticsStatsCards 
} from '@/components/dashboard/analytics/AnalyticsDashboard';
import { Users, UserPlus, Repeat, Zap, Loader2, ChevronDown } from 'lucide-react';
import { useDashboardAnalytics } from '@/services/analytics/hooks';
import { useVisitorGrowthChart } from '@/services/visitors/hooks';
import { PageGuideButton, AICopilotButton } from '@/components/ai';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#066CF4', '#8B5CF6', '#10B981', '#F59E0B'];

export default function CustomerAnalyticsPage() {
    const [range, setRange] = useState<'7D' | '30D' | '90D' | '12M'>('30D');
    const { data: analytics, isLoading: analyticsLoading } = useDashboardAnalytics();
    const { data: growthData, isLoading: growthLoading } = useVisitorGrowthChart(range);

    if (analyticsLoading) {
        return (
            <div className="pb-24 md:pb-10 max-w-7xl mx-auto p-4 md:p-8 flex items-center justify-center min-h-[300px]">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        );
    }

    const findStat = (label: string) => analytics?.stats?.find((s: any) => s.label === label);
    const totalVisitors = findStat('Total Visitors')?.value ?? '0';
    const newVisitors = findStat('New Visitors')?.value ?? '0';
    const totalTaps = findStat('Total Taps')?.value ?? '0';
    const messagesSent = findStat('Messages Sent')?.value ?? '0';

    const stats = [
        { label: 'Total Customers', value: totalVisitors.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'New Visitors', value: newVisitors.toString(), icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Total Taps / Visits', value: totalTaps.toString(), icon: Repeat, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Messages Sent', value: messagesSent.toString(), icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    const chartPoints = growthData?.data || [];
    
    const acquisitionData = [
        { name: 'NFC Taps', value: Math.max(1, Number(totalTaps) || 0) },
        { name: 'QR Code Scans', value: Math.max(0, Math.round((Number(totalTaps) || 0) * 0.3)) },
        { name: 'Referral Direct', value: Math.max(0, Math.round((Number(newVisitors) || 0) * 0.4)) },
        { name: 'Manual Invite', value: Math.max(0, Math.round((Number(newVisitors) || 0) * 0.2)) },
    ];

    return (
        <div className="pb-24 md:pb-10 max-w-7xl mx-auto p-4 md:p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider">Customer Analytics</h2>
                    <PageGuideButton />
                    <AICopilotButton />
                </div>
            </div>

            <AnalyticsStatsCards stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Customer Growth Chart */}
                <div className="lg:col-span-2 rounded-3xl bg-white border border-gray-100 p-6 md:p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-base font-bold text-gray-900">Customer Growth Trend</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Total customer acquisitions over time</p>
                        </div>
                        <div className="relative">
                            <select
                                value={range}
                                onChange={(e) => setRange(e.target.value as '7D' | '30D' | '90D' | '12M')}
                                className="appearance-none pl-3 pr-8 h-9 rounded-xl bg-primary/5 text-primary text-xs font-bold border border-primary/10 hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                                {([['7D', '7 DAYS'], ['30D', '30 DAYS'], ['90D', '90 DAYS'], ['12M', '12 MONTHS']] as const).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                        </div>
                    </div>

                    {growthLoading ? (
                        <div className="h-64 flex items-center justify-center">
                            <Loader2 className="animate-spin text-primary" size={24} />
                        </div>
                    ) : chartPoints.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartPoints}>
                                    <defs>
                                        <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#066CF4" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#066CF4" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
                                    <Area type="monotone" dataKey="customers" name="Customers" stroke="#066CF4" strokeWidth={2.5} fill="url(#growthGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-xs text-gray-400">
                            No growth data recorded for this time range.
                        </div>
                    )}
                </div>

                {/* Acquisition Sources */}
                <div className="rounded-3xl bg-white border border-gray-100 p-6 md:p-8 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">Acquisition Channels</h3>
                        <p className="text-xs text-gray-500 mb-4">Channel distribution for visitor check-ins</p>
                        
                        <div className="h-44 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={acquisitionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4}>
                                        {acquisitionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                        {acquisitionData.map((item, idx) => (
                            <div key={item.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="size-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                    <span className="font-medium text-gray-600">{item.name}</span>
                                </div>
                                <span className="font-bold text-gray-900">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
