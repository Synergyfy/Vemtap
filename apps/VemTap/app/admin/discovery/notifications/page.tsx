'use client';

import React from 'react';
import Link from 'next/link';
import { 
    Bell, MessageSquare, Mail, Smartphone,
    CheckCircle2, XCircle, Clock, Eye,
    Search, Filter, BarChart3, TrendingUp,
    ArrowUpRight, Send, AlertCircle, ChevronLeft
} from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_LOGS = [
    {
        id: 'NOT-001',
        recipient: 'John Doe',
        business: 'Fashion Hub',
        channel: 'Push',
        status: 'Delivered',
        openRate: 'Opened',
        date: '2026-06-13 10:01',
        content: '15% off lunch at The Grill House...'
    },
    {
        id: 'NOT-002',
        recipient: 'Sarah Smith',
        business: 'Supermarket Plus',
        channel: 'SMS',
        status: 'Sent',
        openRate: 'N/A',
        date: '2026-06-13 09:45',
        content: 'Get a free wash & style at Sharp Cuts...'
    },
    {
        id: 'NOT-003',
        recipient: 'Mike Ross',
        business: 'The Grill House',
        channel: 'Email',
        status: 'Delivered',
        openRate: 'Unopened',
        date: '2026-06-13 08:30',
        content: 'BOGO Smoothie at Juice Paradise...'
    }
];

export default function DiscoveryNotificationsPage() {
    return (
        <div className="p-8">
            <Link href="/admin/discovery/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-main transition-colors mb-6">
                <ChevronLeft size={14} /> Back to Discovery
            </Link>

            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Push Notifications', value: '12.4k', sub: '82% Success', icon: Smartphone, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'SMS Messages', value: '4.2k', sub: '95% Success', icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Emails Sent', value: '8.1k', sub: '78% Open Rate', icon: Mail, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Avg. Open Rate', value: '24.5%', sub: '+2.1% this week', icon: Eye, color: 'text-amber-500', bg: 'bg-amber-50' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm group">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{stat.label}</p>
                        <p className="text-2xl font-display font-bold text-text-main mt-1">{stat.value}</p>
                        <p className="text-[10px] font-bold text-text-secondary mt-1">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Logs & Search */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search by recipient or content..."
                            className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                        />
                    </div>
                    <button className="h-12 px-6 rounded-2xl border border-gray-200 bg-white text-text-main text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <Filter size={16} /> Filters
                    </button>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-text-secondary bg-gray-100 px-4 py-2 rounded-xl">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Feed Active
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Recipient & Time</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Channel</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Source Business</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Message Preview</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Interaction</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {MOCK_LOGS.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-bold text-text-main">{log.recipient}</p>
                                            <p className="text-[10px] font-medium text-text-secondary mt-0.5">{log.date}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {log.channel === 'Push' ? <Smartphone size={14} className="text-blue-500" /> : 
                                             log.channel === 'SMS' ? <MessageSquare size={14} className="text-emerald-500" /> : 
                                             <Mail size={14} className="text-purple-500" />}
                                            <span className="font-bold text-text-main">{log.channel}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-text-secondary">
                                        {log.business}
                                    </td>
                                    <td className="px-6 py-4 max-w-xs truncate italic text-text-secondary">
                                        "{log.content}"
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            log.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                        }`}>
                                            <span className={`size-1.5 rounded-full ${log.status === 'Delivered' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                                            log.openRate === 'Opened' ? 'text-primary' : 'text-gray-400'
                                        }`}>
                                            {log.openRate}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
