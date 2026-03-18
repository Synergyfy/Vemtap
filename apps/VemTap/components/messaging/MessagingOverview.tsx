'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMessagingAnalytics } from '@/services/messaging/hooks';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Send, Users, Activity, BarChart2, MessageSquare, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const CHANNEL_CONFIG = {
    whatsapp: { label: 'WhatsApp', icon: MessageSquare, colorClasses: 'bg-green-50 text-green-600', barColor: 'bg-green-500' },
    sms: { label: 'SMS', icon: Send, colorClasses: 'bg-blue-50 text-blue-600', barColor: 'bg-blue-500' },
    email: { label: 'Email', icon: Mail, colorClasses: 'bg-purple-50 text-purple-600', barColor: 'bg-purple-500' },
};

export default function MessagingOverview() {
    const { data: globalAnalytics } = useMessagingAnalytics();
    const { data: whatsappAnalytics, isLoading: whatsappLoading, isError: whatsappError } = useMessagingAnalytics('WHATSAPP');
    const { data: smsAnalytics, isLoading: smsLoading, isError: smsError } = useMessagingAnalytics('SMS');
    const { data: emailAnalytics, isLoading: emailLoading, isError: emailError } = useMessagingAnalytics('EMAIL');
    const [isChartMounted, setIsChartMounted] = useState(false);

    useEffect(() => {
        setIsChartMounted(true);
    }, []);

    const chartData = globalAnalytics?.trafficTrend || [];

    const getChannelStats = (
        channel: 'whatsapp' | 'sms' | 'email',
        data?: { channelStats?: Record<string, any>; sent?: number; deliveryRate?: number }
    ) => {
        const byChannel = data?.channelStats?.[channel];
        if (byChannel) return byChannel;
        if (typeof data?.sent === 'number') {
            return { totalSent: data.sent, deliveryRate: data.deliveryRate || 0, growth: 0 };
        }
        return { totalSent: 0, deliveryRate: 0, growth: 0 };
    };

    const channelQueries = {
        whatsapp: { data: whatsappAnalytics, isLoading: whatsappLoading, isError: whatsappError },
        sms: { data: smsAnalytics, isLoading: smsLoading, isError: smsError },
        email: { data: emailAnalytics, isLoading: emailLoading, isError: emailError },
    };

    const globalStats = globalAnalytics?.globalStats || { totalSent: 0, totalDelivered: 0, openRate: 0, clickRate: 0 };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-black text-slate-800 uppercase tracking-tight">Performance Overview</h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[10px] font-black text-green-600 uppercase">Live Systems OK</span>
                </div>
            </div>

            {/* Per-Channel Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(['whatsapp', 'sms', 'email'] as const).map((channel) => {
                    const config = CHANNEL_CONFIG[channel];
                    const query = channelQueries[channel];
                    const chStats = getChannelStats(channel, query.data);
                    const Icon = config.icon;
                    const statusLabel = query.isError ? 'Unavailable' : query.isLoading ? 'Loading' : 'Active';
                    const statusClass = query.isError
                        ? 'text-red-500'
                        : query.isLoading
                            ? 'text-slate-400'
                            : 'text-green-500';

                    return (
                        <div key={channel} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative group overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={cn("p-4 rounded-3xl shadow-lg", config.colorClasses)}>
                                        <Icon size={24} />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{config.label} Status</p>
                                        <p className={`text-xl font-mono font-bold ${statusClass}`}>{statusLabel}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Sent</p>
                                            <p className="text-2xl font-black text-slate-900 tracking-tighter">{chStats.totalSent?.toLocaleString() || 0}</p>
                                        </div>
                                        <div className={cn(
                                            "px-2 py-0.5 rounded-lg text-[10px] font-black",
                                            (chStats.growth || 0) >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                        )}>
                                            {(chStats.growth || 0) >= 0 ? '+' : ''}{chStats.growth || 0}%
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-50">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-400">Delivery Rate</span>
                                            <span className="text-slate-900">{chStats.deliveryRate || 0}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${chStats.deliveryRate || 0}%` }}
                                                className={cn("h-full", config.barColor)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={cn("absolute -right-8 -bottom-8 size-32 opacity-5 rounded-full", config.barColor)} />
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-white text-primary rounded-lg">
                        <Activity size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Sent</p>
                        <h3 className="text-lg font-bold text-slate-900">{globalStats.totalSent?.toLocaleString() || 0}</h3>
                    </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-white text-green-600 rounded-lg">
                        <BarChart2 size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Delivered</p>
                        <h3 className="text-lg font-bold text-slate-900">{globalStats.totalDelivered?.toLocaleString() || 0}</h3>
                    </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-white text-blue-600 rounded-lg">
                        <Users size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Open Rate</p>
                        <h3 className="text-lg font-bold text-slate-900">{globalStats.openRate || 0}%</h3>
                    </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-white text-purple-600 rounded-lg">
                        <Activity size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Click Rate</p>
                        <h3 className="text-lg font-bold text-slate-900">{globalStats.clickRate || 0}%</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[400px]">
                    <h3 className="text-lg font-bold text-text-main mb-4">Traffic Overview</h3>
                    <div className="h-[330px] min-h-[330px] w-full">
                        {isChartMounted ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={330} debounce={80}>
                                <AreaChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        itemStyle={{ color: '#374151', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="sent" stackId="1" stroke="#3B82F6" fill="#EFF6FF" strokeWidth={3} />
                                    <Area type="monotone" dataKey="delivered" stackId="1" stroke="#10B981" fill="#ECFDF5" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full animate-pulse rounded-lg bg-slate-50" />
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-text-main mb-2">Quick Broadcast</h3>
                        <p className="text-sm text-text-secondary mb-6">Start a new message across any channel.</p>

                        <div className="space-y-4">
                            <Link href="/dashboard/messaging/whatsapp/send" className="block p-4 border border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors">
                                        <MessageSquare size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-text-main text-sm">WhatsApp Blast</h4>
                                        <p className="text-xs text-text-secondary">High open rates & engagement</p>
                                    </div>
                                </div>
                            </Link>

                            <Link href="/dashboard/messaging/sms/send" className="block p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                        <Send size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-text-main text-sm">SMS Alert</h4>
                                        <p className="text-xs text-text-secondary">Instant delivery & reach</p>
                                    </div>
                                </div>
                            </Link>

                            <Link href="/dashboard/messaging/email/send" className="block p-4 border border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                        <Mail size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-text-main text-sm">Email Campaign</h4>
                                        <p className="text-xs text-text-secondary">Rich content & newsletters</p>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 mt-6">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-text-secondary font-medium">Recent Activity</span>
                            <Link href="/dashboard/messaging/history" className="text-primary font-bold hover:underline">View History</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
