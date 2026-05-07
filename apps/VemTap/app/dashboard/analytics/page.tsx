'use client';

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { BarChart3, TrendingUp, Users, Clock, Calendar,
    ArrowUpRight, ArrowDownRight, MousePointer2,
    MessageSquare, Star, Zap, Share2, Download, Loader2, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore, AuthState } from '../../../store/useAuthStore';
import { useDashboardAnalytics } from '@/services/analytics/hooks';
import { exportToCSV } from '@/lib/utils/export';
import toast from 'react-hot-toast';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';
import StatsCard from '@/components/dashboard/StatsCard';

const iconMap: Record<string, LucideIcon> = {
    'Total Visits': Users,
    'Total Customers': Users,
    'New Customers': Zap,
    'Avg. Stay Time': Clock,
    'Repeat Rate': TrendingUp,
};

const colorMap: Record<string, 'blue' | 'green' | 'purple' | 'yellow' | 'red'> = {
    'Total Visits': 'blue',
    'Total Customers': 'blue',
    'New Customers': 'green',
    'Avg. Stay Time': 'purple',
    'Repeat Rate': 'yellow',
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
        <div className="p-4 md:p-8 space-y-8 md:space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <PageHeader
                        title="Business Analytics"
                        description="Deep dive into your customer behavior and engagement performance"
                    />
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm flex-1 sm:flex-none">
                            <button className="flex-1 sm:px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 rounded-lg transition-all">7D</button>
                            <button className="flex-1 sm:px-4 py-2 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text-main rounded-lg transition-all">30D</button>    
                            <button className="flex-1 sm:px-4 py-2 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text-main rounded-lg transition-all">90D</button>    
                        </div>
                        <button
                            onClick={() => {
                                const exportData = data.stats.map((s: any) => ({ Metric: s.label, Value: s.value, Trend: s.trend }));
                                exportToCSV(exportData, `analytics_report_${new Date().toISOString().split('T')[0]}`);
                                toast.success('Analytics report exported');
                            }}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-text-main text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-black transition-all shadow-lg shadow-text-main/10 sm:w-auto"
                        >
                            <Download size={14} />
                            Export
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {stats.length === 0 && (
                        <div className="col-span-full bg-white p-8 rounded-2xl border border-gray-100 text-sm text-text-secondary text-center">
                            No summary stats available yet.
                        </div>
                    )}
                    {stats.map((stat, i) => {
                        const Icon = iconMap[stat.label] || Users;
                        const color = colorMap[stat.label] || 'blue';
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <StatsCard
                                    label={stat.label}
                                    value={stat.value}
                                    icon={Icon}
                                    color={color}
                                    trend={{
                                        value: stat.trend,
                                        isUp: stat.isUp
                                    }}
                                />
                            </motion.div>
                        );
                    })}
                </div>

                <div className="space-y-6">
                    <h3 className="text-lg md:text-xl font-display font-bold text-text-main flex items-center gap-2 uppercase tracking-tight">
                        <MessageSquare size={20} className="text-primary md:size-6" />
                        Messaging ROI
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                        {messagingRoi.length === 0 && (
                            <div className="col-span-full bg-white p-8 rounded-2xl border border-gray-100 text-sm text-text-secondary text-center">
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
                                <div key={i} className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-all group"> 
                                    <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${colors.color} mb-1.5`}>{stat.label}</span>
                                    <span className="text-xl md:text-2xl font-black text-text-main tracking-tight group-hover:text-primary transition-colors">{stat.value}</span>
                                    {stat.sub && <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{stat.sub}</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    <div className="lg:col-span-2 bg-white p-5 md:p-8 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="text-lg md:text-xl font-black mb-1.5 md:mb-2 tracking-tight text-text-main uppercase">Peak Traffic Times</h4>
                            <p className="text-[10px] md:text-sm text-text-secondary font-medium mb-8 md:mb-12">Identify busiest hours to optimize staffing</p>

                            <div className="flex items-end justify-between gap-1.5 md:gap-4 h-48 md:h-64">
                                {peakTimes.length === 0 && (
                                    <div className="w-full h-full flex items-center justify-center text-sm text-text-secondary italic">
                                        No peak time data available yet.
                                    </div>
                                )}
                                {peakTimes.map((t, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-3 md:gap-4 group">
                                        <div className="w-full relative">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${t.value}%` }}
                                                className="w-full bg-text-main rounded-lg md:rounded-xl relative overflow-hidden group-hover:bg-primary transition-colors cursor-pointer"
                                            >
                                                <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                                            </motion.div>
                                            {t.value > 80 && (
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-white text-[7px] font-black py-1 px-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest shadow-lg z-20">Peak</div>
                                            )}
                                        </div>
                                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-text-secondary">{t.hour}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                        <div className="bg-text-main p-6 md:p-8 rounded-2xl text-white relative overflow-hidden">
                            <Star className="absolute -right-6 -top-6 size-32 md:size-40 text-white/5 rotate-12" />
                            <h4 className="text-lg md:text-xl font-black mb-6 tracking-tight relative z-10 uppercase">Engagement Quality</h4>
                            <div className="space-y-5 md:space-y-6 relative z-10">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] md:text-xs font-bold text-white/60 uppercase tracking-wider">Survey Completion</span>
                                        <span className="text-xs md:text-sm font-black">{engagementQuality.surveyCompletion}</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[78%] rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] md:text-xs font-bold text-white/60 uppercase tracking-wider">Review Conversion</span>
                                        <span className="text-xs md:text-sm font-black">{engagementQuality.reviewConversion}</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-400 w-[12.4%] rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] md:text-xs font-bold text-white/60 uppercase tracking-wider">Social Follows</span>
                                        <span className="text-xs md:text-sm font-black">{engagementQuality.socialFollows}</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-400 w-[60%] rounded-full shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
                            <h4 className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-text-secondary mb-6">Top Performers</h4>
                            <div className="space-y-4">
                                {topPerformers.length === 0 && (
                                    <div className="text-sm text-text-secondary italic">
                                        No top performers yet.
                                    </div>
                                )}
                                {topPerformers.map((item, i) => {
                                    const performerIcons: Record<string, React.ElementType> = {
                                        'collection': Share2,
                                        'survey': MessageSquare,
                                        'nfc': MousePointer2,
                                    };
                                    const Icon = performerIcons[item.type] || Share2;
                                    return (
                                        <div key={i} className="flex items-center justify-between group cursor-pointer p-2 -mx-2 rounded-xl hover:bg-gray-50 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="size-9 rounded-xl bg-gray-50 flex items-center justify-center text-text-secondary group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                    <Icon size={16} />
                                                </div>
                                                <span className="text-[11px] md:text-xs font-bold text-text-secondary group-hover:text-text-main transition-all uppercase tracking-tight">{item.label}</span>
                                            </div>
                                            <ArrowUpRight size={14} className="text-gray-300 group-hover:text-primary transition-all translate-x-1 group-hover:translate-x-0 group-hover:-translate-y-1" />
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
