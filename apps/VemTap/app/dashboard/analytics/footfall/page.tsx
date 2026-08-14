'use client';

import { Loader2 } from 'lucide-react';
import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import ChartCard from '@/components/dashboard/ChartCard';
import { useFootfallAnalytics } from '@/services/analytics/hooks';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';

export default function FootfallReportsPage() {
    const { data, isLoading, error } = useFootfallAnalytics();

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <p className="text-red-500">Failed to load footfall data</p>
            </div>
        );
    }

    const toList = <T,>(payload: unknown): T[] => {
        if (Array.isArray(payload)) return payload as T[];
        if (payload && typeof payload === 'object') {
            const obj = payload as { data?: unknown; items?: unknown; results?: unknown };
            if (Array.isArray(obj.data)) return obj.data as T[];
            if (Array.isArray(obj.items)) return obj.items as T[];
            if (Array.isArray(obj.results)) return obj.results as T[];
        }
        return [];
    };

    const downloadReport = () => {
        const esc = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const rows: string[][] = [
            ['Footfall Report'],
            ['Generated', new Date().toLocaleString()],
            [],
            ['Metric', 'Value'],
            ...stats.map((s) => [s.label, s.value]),
            [],
            ['Hour', 'Visits'],
            ...hourlyData.map((d) => [d.hour, d.count]),
            [],
            ['Entrance', 'Count', 'Percentage'],
            ...trafficByEntrance.map((e) => [e.name, e.count, e.percentage]),
            [],
            ['Average Stay', visitDuration.averageStay],
            ['Trend vs last week', visitDuration.trendText],
            ...durationDistribution.map((s) => [s.label, s.p, s.time]),
        ];
        const csv = rows.map((row) => row.map(esc).join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `footfall-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const stats = toList<any>(data.stats);
    const hourlyData = toList<any>(data.hourlyData);
    const trafficByEntrance = toList<any>(data.trafficByEntrance);
    const visitDuration = data.visitDuration || { averageStay: '—', trendText: '—', distribution: [] };
    const durationDistribution = toList<any>(visitDuration.distribution);
    const maxHourlyCount = Math.max(1, ...hourlyData.map(d => d.count || 0));

    return (
        <div className="p-8">
            <PageHeader
                    title="Footfall Analysis"
                    description="Detailed tracking of physical visits and traffic patterns"
                    actions={
                        <button onClick={downloadReport} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm shadow-md shadow-primary/20">
                            <span className="material-icons-round text-lg">file_download</span>
                            Download Report
                        </button>
                    }
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-8">
                    {stats.length === 0 ? (
                        <div className="col-span-full bg-white p-6 rounded-lg border border-gray-100 text-sm text-text-secondary">
                            No footfall stats available yet.
                        </div>
                    ) : (
                        stats.map((stat, index) => (
                            <div key={index} className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">{stat.label}</p>
                                <p className="text-2xl font-bold text-text-main">{stat.value}</p>
                            </div>
                        ))
                    )}
                </div>

                <ChartCard title="Hourly Footfall" subtitle="Today's traffic distributed by hour">
                    <div className="h-64 flex items-end justify-between px-2 pb-2 mt-4">
                        {hourlyData.length === 0 ? (
                            <div className="w-full h-full flex items-center justify-center text-sm text-text-secondary">
                                No hourly footfall data available yet.
                            </div>
                        ) : (
                            hourlyData.map((d, i) => (
                                <div key={i} className="flex flex-col items-center gap-3 w-full group relative h-full justify-end">
                                    <div
                                        className="w-4/5 bg-primary/20 rounded-t-sm hover:bg-primary transition-all cursor-pointer relative"
                                        style={{ height: `${(d.count / maxHourlyCount) * 100}%` }}
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                            {d.count} visits
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-text-secondary uppercase transform -rotate-45 whitespace-nowrap">{d.hour}</span>
                                </div>
                            ))
                        )}
                    </div>
                </ChartCard>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    <ChartCard title="Traffic by Entrance" subtitle="Comparison of entry points">
                        <div className="space-y-6">
                            {trafficByEntrance.length === 0 ? (
                                <div className="text-sm text-text-secondary">No entrance data available yet.</div>
                            ) : (
                                trafficByEntrance.map((item, i) => {
                                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500'];
                                    return (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold">
                                                <div className="flex items-center gap-2">
                                                    <div className={`size-3 ${colors[i % colors.length]} rounded-full`}></div>
                                                    <span className="text-text-main">{item.name}</span>
                                                </div>
                                                <span className="text-text-secondary">{item.count} ({item.percentage})</span>
                                            </div>
                                            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${colors[i % colors.length]} rounded-full`} style={{ width: item.percentage }}></div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </ChartCard>

                    <ChartCard title="Visit Duration" subtitle="Average time spent by customers">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                                        <span className="material-icons-round text-primary text-2xl">timer</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Average Stay</p>
                                        <p className="text-2xl font-display font-bold text-text-main">{visitDuration.averageStay}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-green-600">{visitDuration.trendText}</p>
                                    <p className="text-[10px] text-text-secondary uppercase">vs last week</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {durationDistribution.length === 0 ? (
                                    <div className="col-span-3 text-sm text-text-secondary text-center italic">
                                        No visit duration distribution yet.
                                    </div>
                                ) : (
                                    durationDistribution.map((s, i) => (
                                        <div key={i} className="p-4 bg-white border border-gray-100 rounded-xl text-center shadow-sm">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">{s.label}</p>
                                            <p className="font-bold text-text-main text-sm">{s.p}</p>
                                            <p className="text-[10px] text-text-secondary">{s.time}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </ChartCard>
                </div>
            </div>
    );
}