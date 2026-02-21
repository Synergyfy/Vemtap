'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDevice } from '@/services/devices/hooks';
import Link from 'next/link';
import {
    ArrowLeft, BarChart2, Users, MousePointer2,
    Calendar, TrendingUp, Clock, MapPin, Battery
} from 'lucide-react';
import LogoIcon from '@/components/brand/LogoIcon';
import ChartCard from '@/components/dashboard/ChartCard';
import StatsCard from '@/components/dashboard/StatsCard';

export default function DeviceStatsPage() {
    const params = useParams();
    const router = useRouter();
    const deviceId = params.id as string;

    const { data: device, isLoading } = useDevice(deviceId);

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!device) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-400 mb-6">
                    <LogoIcon size={40} />
                </div>
                <h2 className="text-2xl font-display font-bold text-text-main mb-2">Device Not Found</h2>
                <p className="text-text-secondary mb-8">The hardware point you're looking for doesn't exist or has been removed.</p>
                <Link href="/dashboard/devices" className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors">
                    Back to Infrastructure
                </Link>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-text-secondary hover:text-primary transition-all shadow-sm hover:shadow-md"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${device.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-300'}`}></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary leading-none">Live Performance</span>
                        </div>
                        <h1 className="text-3xl font-display font-bold text-text-main tracking-tight">{device.name}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="px-4 py-2 border-r border-gray-100">
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Type</p>
                        <p className="text-sm font-bold text-text-main">{device.type}</p>
                    </div>
                    <div className="px-4 py-2">
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Code</p>
                        <p className="text-sm font-bold text-primary font-mono">{device.code}</p>
                    </div>
                </div>
            </div>

            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    label="Total Taps"
                    value={(device.totalScans || 0).toLocaleString()}
                    icon={MousePointer2}
                    trend={{ value: '12%', isUp: true }}
                    color="purple"
                />
                <StatsCard
                    label="Unique Visitors"
                    value={Math.floor((device.totalScans || 0) * 0.7).toLocaleString()}
                    icon={Users}
                    trend={{ value: '5.2%', isUp: true }}
                    color="blue"
                />
                <StatsCard
                    label="Conversion Rate"
                    value="24.8%"
                    icon={TrendingUp}
                    trend={{ value: '1.2%', isUp: true }}
                    color="green"
                />
                <StatsCard
                    label="Avg. Dwell Time"
                    value="18m"
                    icon={Clock}
                    trend={{ value: 'Stable', isUp: true }}
                    color="yellow"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart */}
                <div className="lg:col-span-2 space-y-8">
                    <ChartCard title="Tap Activity (Last 7 Days)" subtitle="Daily distribution of customer engagement">
                        <div className="h-64 flex items-end justify-between gap-2 px-4">
                            {[35, 42, 38, 55, 48, 62, 75].map((val, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-help">
                                    <div
                                        className="w-full bg-primary/20 rounded-t-lg group-hover:bg-primary transition-all relative"
                                        style={{ height: `${val}%` }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-text-main text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            {val}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-text-secondary uppercase">Day {i + 1}</span>
                                </div>
                            ))}
                        </div>
                    </ChartCard>

                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-text-main mb-6">Device Health Diagnostics</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                            <Battery size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-text-secondary uppercase">Battery Level</p>
                                            <p className="text-sm font-bold text-text-main">{device.batteryLevel}%</p>
                                        </div>
                                    </div>
                                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: `${device.batteryLevel}%` }}></div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <TrendingUp size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-text-secondary uppercase">Signal Strength</p>
                                        <p className="text-sm font-bold text-text-main">Strong (92%)</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-text-secondary uppercase">Last Activity</p>
                                        <p className="text-sm font-bold text-text-main">{device.lastActive}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-text-secondary uppercase">Assigned Location</p>
                                        <p className="text-sm font-bold text-text-main">{device.location}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Peak Hours & Recent Activity */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-text-main mb-6">Peak Usage Times</h3>
                        <div className="space-y-4">
                            {[
                                { time: '12:00 PM - 2:00 PM', label: 'Lunch Rush', val: 85 },
                                { time: '8:00 AM - 10:00 AM', label: 'Morning Peak', val: 65 },
                                { time: '4:00 PM - 6:00 PM', label: 'Evening Surge', val: 45 },
                            ].map((peak, i) => (
                                <div key={i} className="group">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs font-bold text-text-main">{peak.label}</span>
                                        <span className="text-[10px] font-black text-primary uppercase">{peak.time}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary group-hover:bg-primary-hover transition-all" style={{ width: `${peak.val}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-text-main rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full translate-x-10 -translate-y-10 blur-3xl"></div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="material-icons-round text-primary">auto_awesome</span>
                            AI Insight
                        </h3>
                        <p className="text-sm text-white/70 leading-relaxed font-medium">
                            This device at the <span className="text-white font-bold">{device.location}</span> is performing <span className="text-emerald-400 font-bold">15% better</span> than the store average. Consider placing similar tags at other high-traffic zones.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
