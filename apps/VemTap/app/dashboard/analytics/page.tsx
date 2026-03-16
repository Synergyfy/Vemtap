'use client';

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { BarChart3, TrendingUp, Users, Clock, Calendar,
    ArrowUpRight, ArrowDownRight, MousePointer2,
    MessageSquare, Star, Zap, Share2, Download, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore, AuthState } from '../../../store/useAuthStore';
import { useDashboardAnalytics } from '@/services/analytics/hooks';
import { exportToCSV } from '@/lib/utils/export';
import toast from 'react-hot-toast';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';

const iconMap: Record<string, React.ElementType> = {
    'Total Visits': Users,
    'Total Customers': Users,
    'New Customers': Zap,
    'Avg. Stay Time': Clock,
    'Repeat Rate': TrendingUp,
};

const colorMap: Record<string, { color: string; bg: string }> = {
    'Total Visits': { color: 'text-primary', bg: 'bg-primary/5' },
    'Total Customers': { color: 'text-primary', bg: 'bg-primary/5' },
    'New Customers': { color: 'text-emerald-500', bg: 'bg-emerald-50' },
    'Avg. Stay Time': { color: 'text-purple-600', bg: 'bg-purple-50' },
    'Repeat Rate': { color: 'text-amber-500', bg: 'bg-amber-50' },
};

export default function AnalyticsDashboardPage() {
    const router = useRouter();
    const user = useAuthStore((state: AuthState) => state.user);
    const { data, isLoading, error } = useDashboardAnalytics();

    React.useEffect(() => {
        if (!isLoading && user && user.role === 'staff') {
            router.push('/dashboard');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="p-4 md:p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-4 md:p-8 flex items-center justify-center min-h-[400px]">
                <p className="text-red-500">Failed to load analytics data</p>
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

    const stats = toList<any>(data.stats);
    const messagingRoi = toList<any>(data.messagingRoi);
    const peakTimes = toList<any>(data.peakTimes);
    const topPerformers = toList<any>(data.topPerformers);
    const engagementQuality = data.engagementQuality || {};

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
                    <PageHeader
                        title="Business Analytics"
                        description="Deep dive into your customer behavior and engagement performance"
                    />
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                            <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 rounded-lg transition-all">7D</button>
                            <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text-main rounded-lg transition-all">30D</button>    
                            <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text-main rounded-lg transition-all">90D</button>    
                        </div>
                        <button
                            onClick={() => {
                                const exportData = data.stats.map((s: any) => ({ Metric: s.label, Value: s.value, Trend: s.trend }));
                                exportToCSV(exportData, `analytics_report_${new Date().toISOString().split('T')[0]}`);
                                toast.success('Analytics report exported');
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-text-main text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-black transition-all shadow-lg shadow-text-main/10"
                        >
                            <Download size={14} />
                            Export
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {stats.length === 0 && (
                        <div className="col-span-full bg-white p-6 rounded-lg border border-gray-100 text-sm text-text-secondary">
                            No summary stats available yet.
                        </div>
                    )}
                    {stats.map((stat, i) => {
                        const Icon = iconMap[stat.label] || Users;
                        const colors = colorMap[stat.label] || { color: 'text-primary', bg: 'bg-primary/5' };
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`size-12 rounded-lg ${colors.bg} ${colors.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                        <Icon size={24} />
                                    </div>
                                    <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${stat.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                        {stat.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                        {stat.trend}
                                    </div>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-black tracking-tight text-text-main">{stat.value}</h3>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="mb-10">
                    <h3 className="text-xl font-display font-bold text-text-main mb-6 flex items-center gap-2">
                        <MessageSquare size={24} className="text-primary" />
                        Messaging ROI
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {messagingRoi.length === 0 && (
                            <div className="col-span-full bg-white p-6 rounded-lg border border-gray-100 text-sm text-text-secondary">
                                No messaging ROI data available yet.
                            </div>
                        )}
                        {messagingRoi.map((stat, i) => {
                            const roiColors: Record<string, { color: string; bg: string }> = {
                                'Sent': { color: 'text-blue-500', bg: 'bg-blue-50' },
                                'Delivered': { color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                'Opened': { color: 'text-purple-500', bg: 'bg-purple-50' },
                                'Clicked': { color: 'text-amber-500', bg: 'bg-amber-50' },
                                'Failed': { color: 'text-red-500', bg: 'bg-red-50' },
                                'Unsub': { color: 'text-gray-500', bg: 'bg-gray-50' },
                            };
                            const colors = roiColors[stat.label] || { color: 'text-gray-500', bg: 'bg-gray-50' };
                            return (
                                <div key={i} className="bg-white p-4 rounded-lg border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-all"> 
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${colors.color} mb-1`}>{stat.label}</span>
                                    <span className="text-2xl font-black text-text-main tracking-tight">{stat.value}</span>
                                    {stat.sub && <span className="text-xs font-bold text-gray-400 mt-1">{stat.sub}</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-8 rounded-lg border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="text-xl font-black mb-2 tracking-tight text-text-main">Peak Traffic Times</h4>
                            <p className="text-sm text-text-secondary font-medium mb-12">Identify your busiest hours to optimize staffing</p>

                            <div className="flex items-end justify-between gap-4 h-64">
                                {peakTimes.length === 0 && (
                                    <div className="w-full h-full flex items-center justify-center text-sm text-text-secondary">
                                        No peak time data available yet.
                                    </div>
                                )}
                                {peakTimes.map((t, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                        <div className="w-full relative">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${t.value}%` }}
                                                className="w-full bg-text-main rounded-xl relative overflow-hidden group-hover:bg-primary transition-colors cursor-pointer"
                                            >
                                                <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                                            </motion.div>
                                            {t.value > 80 && (
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-white text-[8px] font-black py-1 px-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest shadow-lg">Peak Hour</div>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{t.hour}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-text-main p-8 rounded-lg text-white relative overflow-hidden">
                            <Star className="absolute -right-6 -top-6 size-40 text-white/5 rotate-12" />
                            <h4 className="text-xl font-black mb-6 tracking-tight relative z-10">Engagement Quality</h4>
                            <div className="space-y-6 relative z-10">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-white/60">Survey Completion</span>
                                        <span className="text-sm font-black">{engagementQuality.surveyCompletion}</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[78%] rounded-full" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-white/60">Review Conversion</span>
                                        <span className="text-sm font-black">{engagementQuality.reviewConversion}</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-400 w-[12.4%] rounded-full" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-white/60">Social Follows</span>
                                        <span className="text-sm font-black">{engagementQuality.socialFollows}</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-400 w-[60%] rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary mb-6">Top Performers</h4>
                            <div className="space-y-4">
                                {topPerformers.length === 0 && (
                                    <div className="text-sm text-text-secondary">
                                        No top performers yet.
                                    </div>
                                )}
                                {topPerformers.map((item, i) => {
                                    const performerIcons: Record<string, React.ElementType> = {
                                        'collection': Share2,
                                        'survey': MessageSquare,
                                        'nfc': MousePointer2,
                                    };
                                    const performerColors: Record<string, string> = {
                                        'collection': 'text-blue-500',
                                        'survey': 'text-purple-500',
                                        'nfc': 'text-amber-500',
                                    };
                                    const Icon = performerIcons[item.type] || Share2;
                                    const color = performerColors[item.type] || 'text-gray-500';
                                    return (
                                        <div key={i} className="flex items-center justify-between group cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-xl bg-gray-50 flex items-center justify-center text-text-secondary group-hover:bg-primary/5 group-hover:text-primary transition-all">
                                                    <Icon size={18} />
                                                </div>
                                                <span className="text-xs font-bold text-text-secondary group-hover:text-text-main transition-all">{item.label}</span>
                                            </div>
                                            <ArrowUpRight size={14} className="text-gray-300 group-hover:text-primary transition-all" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    );
}
