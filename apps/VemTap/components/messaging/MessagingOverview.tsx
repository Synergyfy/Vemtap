'use client';

import React from 'react';
import Link from 'next/link';
import { MessageChannel, useMessagingStore } from '@/lib/store/useMessagingStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Send, Users, Activity, BarChart2, MessageSquare, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useBusinessStore } from '@/store/useBusinessStore';

export default function MessagingOverview() {
    const { stats, wallets, broadcasts: allBroadcasts } = useMessagingStore();
    const { activeBranchId } = useBusinessStore();

    // Filter broadcasts by branch
    const broadcasts = allBroadcasts.filter(b =>
        activeBranchId === 'all' || b.branchId === activeBranchId
    );

    // Mock data for the chart
    const data = [
        { name: 'Mon', sent: 400, delivered: 240 },
        { name: 'Tue', sent: 300, delivered: 139 },
        { name: 'Wed', sent: 200, delivered: 980 },
        { name: 'Thu', sent: 278, delivered: 390 },
        { name: 'Fri', sent: 189, delivered: 480 },
        { name: 'Sat', sent: 239, delivered: 380 },
        { name: 'Sun', sent: 349, delivered: 430 },
    ];

    const globalStats = stats.Global;

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
                {(['WhatsApp', 'SMS', 'Email'] as MessageChannel[]).map((channel) => {
                    const chStats = stats[channel];
                    const chWallet = wallets[channel];
                    const Icon = channel === 'WhatsApp' ? MessageSquare : channel === 'SMS' ? Send : Mail;
                    const colorClasses = channel === 'WhatsApp' ? 'bg-green-50 text-green-600' : channel === 'SMS' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600';

                    return (
                        <div key={channel} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative group overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={cn("p-4 rounded-3xl shadow-lg", colorClasses)}>
                                        <Icon size={24} />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{channel} Status</p>
                                        <p className="text-xl font-mono font-bold text-green-500">ACTIVE</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Sent</p>
                                            <p className="text-2xl font-black text-slate-900 tracking-tighter">{chStats.totalSent.toLocaleString()}</p>
                                        </div>
                                        <div className={cn(
                                            "px-2 py-0.5 rounded-lg text-[10px] font-black",
                                            chStats.growth >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                        )}>
                                            {chStats.growth >= 0 ? '+' : ''}{chStats.growth}%
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-50">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-400">Delivery Rate</span>
                                            <span className="text-slate-900">{chStats.deliveryRate}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${chStats.deliveryRate}%` }}
                                                className={cn("h-full", channel === 'WhatsApp' ? 'bg-green-500' : channel === 'SMS' ? 'bg-blue-500' : 'bg-purple-500')}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={cn("absolute -right-8 -bottom-8 size-32 opacity-5 rounded-full", channel === 'WhatsApp' ? 'bg-green-500' : channel === 'SMS' ? 'bg-blue-500' : 'bg-purple-500')} />
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 opacity-50 shrink-0">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-white text-slate-400 rounded-lg">
                        <Activity size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Acquisition</p>
                        <h3 className="text-lg font-bold text-slate-600">1,240</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[400px]">
                    <h3 className="text-lg font-bold text-text-main mb-4">Traffic Overview</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
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
