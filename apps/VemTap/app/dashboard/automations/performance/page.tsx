'use client';

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, MessageSquare, Award, Clock, ArrowUpRight, Loader2 } from 'lucide-react';
import { useAutomationPerformance } from '@/services/messaging/hooks';

export default function AutomationPerformancePage() {
    const { data: performance, isLoading } = useAutomationPerformance();

    const stats = [
        { label: 'Total Messages Sent', value: performance?.totalMessagesSent?.toLocaleString() || '0', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50', growth: '+12.5%' },
        { label: 'Total Replies', value: performance?.totalReplies?.toLocaleString() || '0', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', growth: '+8.2%' },
        { label: 'Reply Rate', value: performance?.replyRate ? `${performance.replyRate}%` : '0%', icon: BarChart3, color: 'text-primary', bg: 'bg-primary/5', growth: '+2.1%' },
        { label: 'Loyalty Points Issued', value: performance?.loyaltyPointsIssued?.toLocaleString() || '0', icon: Award, color: 'text-purple-600', bg: 'bg-purple-50', growth: '+15.0%' },
    ];

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <PageHeader
                    title="Performance Overview"
                    description="Measure the impact of your automated customer engagement sequences."
                />
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-3xl ${stat.bg} ${stat.color} shadow-lg shadow-current/5`}>
                                <stat.icon size={24} />
                            </div>
                            <div className="flex items-center gap-1 text-emerald-500 font-black text-xs">
                                <ArrowUpRight size={14} />
                                {stat.growth}
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-3xl font-display font-black text-text-main">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Engagement Chart */}
                <div className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-display font-black text-text-main">Engagement Trend</h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                                <div className="size-2 rounded-full bg-primary" />
                                Messages Sent
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                                <div className="size-2 rounded-full bg-emerald-500" />
                                Replies
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 flex items-end gap-3 px-4">
                        {(performance?.dailyStats || []).length > 0 ? (
                            performance?.dailyStats.map((day, i) => {
                                const maxSent = Math.max(...performance!.dailyStats.map(d => d.sent)) || 1;
                                return (
                                    <div key={i} className="flex-1 flex flex-col gap-1 items-center group">
                                        <div className="flex-1 w-full relative flex items-end justify-center gap-1">
                                            <div
                                                style={{ height: `${(day.sent / maxSent) * 100}%` }}
                                                className="w-full bg-primary/20 group-hover:bg-primary transition-all rounded-t-lg"
                                            />
                                            <div
                                                style={{ height: `${(day.replies / maxSent) * 100}%` }}
                                                className="w-full bg-emerald-500/20 group-hover:bg-emerald-500 transition-all rounded-t-lg"
                                            />
                                        </div>
                                        <span className="text-[8px] font-black text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                                            {new Date(day.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-text-secondary text-sm font-medium italic">
                                No trend data available for this period.
                            </div>
                        )}
                    </div>
                </div>

                {/* Best Performing Automations */}
                <div className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm flex flex-col">
                    <h3 className="text-xl font-display font-black text-text-main mb-8">Top Automations</h3>
                    <div className="space-y-6 flex-1">
                        {(performance?.topAutomations || []).length > 0 ? (
                            performance?.topAutomations.map((item, i) => (
                                <div key={i} className="p-6 bg-gray-50/50 rounded-3xl border border-gray-50 flex items-center justify-between group hover:bg-white hover:border-gray-200 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center font-black text-text-main shadow-sm group-hover:scale-110 transition-transform">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-text-main text-sm">{item.name}</p>
                                            <p className="text-[10px] text-text-secondary font-medium">{item.replies} Replies generated</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-display font-black text-text-main">{item.replyRate}%</p>
                                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Reply Rate</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-text-secondary text-sm font-medium italic">
                                No top automation data available.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

