'use client';

import { Loader2 } from 'lucide-react';
import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import ChartCard from '@/components/dashboard/ChartCard';
import { usePeakTimesAnalytics } from '@/services/analytics/hooks';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';

export default function PeakTimesPage() {
    const { data, isLoading, error } = usePeakTimesAnalytics();

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
                <p className="text-red-500">Failed to load peak times data</p>
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

    type WeeklyRow = { day: string; hours: number[] };
    const hoursLabels = toList<string>(data.hoursLabels);
    const weeklyData = toList<WeeklyRow>(data.weeklyData).map((d) => ({
        ...d,
        hours: Array.isArray(d?.hours) ? (d.hours as number[]) : [],
    }));
    
    const maxHourlyValue = Math.max(1, ...weeklyData.flatMap(d => d.hours || []));

    return (
        <div className="p-8">
            <PageHeader
                    title="Peak Time Analysis"
                    description="Understand when your business is most crowded"
                />

                <div className="grid grid-cols-1 gap-8 mt-8">
                    <ChartCard title="Heatmap: Visitor Density" subtitle="Busy periods across the week">
                        <div className="mt-6 overflow-x-auto">
                            <div className="min-w-[800px]">
                                <div className="grid grid-cols-11 mb-4">
                                    <div className="col-span-1"></div>
                                    {hoursLabels.length === 0 ? (
                                        <div className="col-span-10 text-sm text-text-secondary italic">No hourly labels available yet.</div>
                                    ) : (
                                        hoursLabels.map((h, idx) => (
                                            <div key={idx} className="text-[10px] font-bold uppercase tracking-wider text-text-secondary text-center px-1">
                                                {h}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="space-y-4">
                                    {weeklyData.length === 0 ? (
                                        <div className="text-sm text-text-secondary italic">Start capturing customers to see weekly footfall patterns.</div>
                                    ) : (
                                        weeklyData.map((d, idx) => (
                                            <div key={idx} className="grid grid-cols-11 items-center">
                                                <div className="col-span-1 text-[10px] font-bold uppercase tracking-wider text-text-main line-clamp-1">
                                                    {d.day}
                                                </div>
                                                {d.hours.map((v: number, j: number) => {
                                                    const opacity = v / maxHourlyValue;
                                                    return (
                                                        <div 
                                                            key={j} 
                                                            className="h-10 mx-1 rounded-lg transition-all hover:scale-105 group relative cursor-pointer flex items-center justify-center" 
                                                            style={{ backgroundColor: `rgba(37, 99, 235, ${Math.max(opacity, 0.05)})` }}
                                                        >
                                                            {v > 100 && <span className="material-icons-round text-white text-xs">local_fire_department</span>}
                                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                                                {v} visitors
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-8 flex items-center justify-end gap-4">
                            <span className="text-[10px] font-bold text-text-secondary uppercase">Less Crowded</span>
                            <div className="flex gap-1">
                                {[0.1, 0.3, 0.5, 0.7, 0.9].map((o, idx) => (
                                    <div key={idx} className="size-4 rounded" style={{ backgroundColor: `rgba(37, 99, 235, ${o})` }}></div>
                                ))}
                            </div>
                            <span className="text-[10px] font-bold text-text-secondary uppercase">Busiest</span>
                        </div>
                    </ChartCard>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <ChartCard title="Busiest Day Analysis" subtitle="Weekly traffic distribution">
                            <div className="h-64 flex items-end justify-between px-4 pb-4">
                                {weeklyData.length === 0 ? (
                                    <div className="w-full h-full flex items-center justify-center text-sm text-text-secondary italic">
                                        Not enough data yet. Keep capturing customers and insights will appear.
                                    </div>
                                ) : (
                                    weeklyData.map((d, idx) => {
                                        const total = d.hours.reduce((a: number, b: number) => a + b, 0);
                                        const maxTotal = Math.max(1, ...weeklyData.map(w => w.hours.reduce((a, b) => a + b, 0)));
                                        return (
                                            <div key={idx} className="flex flex-col items-center gap-3 w-12 group relative h-full justify-end">
                                                <div
                                                    className="w-full bg-primary/20 rounded-lg hover:bg-primary transition-all cursor-pointer relative"
                                                    style={{ height: `${(total / maxTotal) * 100}%` }}
                                                >
                                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                                        {total} visits
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">
                                                    {d.day.substring(0, 3)}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </ChartCard>

                        <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col justify-center shadow-sm">
                            <div className="bg-primary/5 rounded-2xl p-6 mb-6">
                                <h4 className="text-xl font-bold text-primary mb-2 flex items-center gap-2">
                                    <span className="material-icons-round">lightbulb</span>
                                    Smart Suggestion
                                </h4>
                                <p className="text-sm text-text-main leading-relaxed">
                                    Based on your peak times ({data?.smartSuggestion?.peakTime || 'N/A'}), we suggest adding **2 additional staff** members during this window to reduce wait times and improve customer satisfaction.
                                </p>
                            </div>
                            <button className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-sm">
                                Create Staff Reminder
                            </button>
                        </div>
                    </div>
                </div>
            </div>
    );
}