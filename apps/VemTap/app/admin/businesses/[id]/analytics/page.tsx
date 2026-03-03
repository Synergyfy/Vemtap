'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Users, Activity, Building2, Smartphone, Loader2, Calendar } from 'lucide-react';
import type { ComponentType } from 'react';
import { adminBusinessesApi } from '@/lib/api/admin';
import { notify } from '@/lib/notify';

interface AnalyticsData {
    businessName: string;
    totalVisitors: number;
    totalTaps: number;
    totalBranches: number;
    recentActivity: Array<{
        id: string;
        visitorName: string;
        branchName: string;
        status: string;
        timestamp: string;
    }>;
}

export default function BusinessAnalyticsPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params.id as string;
    const businessName = searchParams.get('name') || `Business ${id}`;

    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            try {
                const stats = await adminBusinessesApi.getStats(id);
                setData(stats);
            } catch (err: any) {
                notify.error(err.message || 'Failed to load business analytics');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchStats();
        }
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-text-secondary font-medium animate-pulse">Loading analytics data...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <Link href="/admin/businesses" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                        <ArrowLeft size={16} />
                        Back to businesses
                    </Link>
                    <h1 className="text-3xl font-display font-bold text-text-main mt-2">{data?.businessName || businessName}</h1>
                    <p className="text-sm text-text-secondary font-medium mt-1">Real-time analytics snapshot for business performance.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Total Visitors" value={data?.totalVisitors.toLocaleString() || '0'} icon={Users} />
                <MetricCard title="Total Tap Events" value={data?.totalTaps.toLocaleString() || '0'} icon={Smartphone} />
                <MetricCard title="Branches" value={data?.totalBranches.toString() || '0'} icon={Building2} />
                <MetricCard title="Total Activity" value={data?.recentActivity.length.toString() || '0'} icon={Activity} />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-widest text-text-secondary">Recent Activity</h2>
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-tighter">Live Updates</span>
                </div>

                <div className="divide-y divide-gray-100">
                    {data?.recentActivity && data.recentActivity.length > 0 ? (
                        data.recentActivity.map((activity) => (
                            <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <Users size={18} className="text-text-secondary group-hover:text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-text-main">{activity.visitorName}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Building2 size={12} className="text-text-secondary" />
                                            <p className="text-[11px] text-text-secondary font-medium">{activity.branchName}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-1.5 mb-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${activity.status === 'returning' ? 'bg-blue-500' : 'bg-green-500'}`} />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{activity.status}</p>
                                    </div>
                                    <div className="flex items-center justify-end gap-1 text-gray-400">
                                        <Calendar size={12} />
                                        <p className="text-[10px] font-medium">{new Date(activity.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center">
                            <Activity size={32} className="mx-auto text-gray-200 mb-3" />
                            <p className="text-sm text-text-secondary font-medium">No recent activity recorded yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: string; icon: ComponentType<{ size?: number; className?: string }> }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{title}</p>
                <div className="p-2 bg-primary/5 rounded-lg">
                    <Icon size={18} className="text-primary" />
                </div>
            </div>
            <p className="text-3xl font-display font-bold text-text-main">{value}</p>
        </div>
    );
}
