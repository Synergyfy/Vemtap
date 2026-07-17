'use client';

import React from 'react';
import Link from 'next/link';
import { 
    ShieldAlert, ShieldCheck, AlertTriangle, Eye, 
    Search, Filter, Ban, MoreHorizontal, CheckCircle2,
    Activity, Fingerprint, MousePointer2, Zap, ChevronLeft
} from 'lucide-react';
import { useAdminFraudAlerts } from '@/services/discovery/hooks';
import { motion } from 'framer-motion';

export default function DiscoveryFraudPage() {
    const { data: dashboard, isLoading } = useAdminFraudAlerts();

    const stats = [
        { label: 'Security Score', value: dashboard?.securityScore ?? '—', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50', sub: 'Healthy' },
        { label: 'Active Alerts', value: dashboard?.activeAlerts ?? '—', icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50', sub: '3 Critical' },
        { label: 'Fraud Prevented', value: dashboard?.fraudPrevented ?? '—', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50', sub: 'Last 30 Days' },
        { label: 'Suspicious Users', value: dashboard?.suspiciousUsers ?? '—', icon: Fingerprint, color: 'text-amber-500', bg: 'bg-amber-50', sub: 'Watchlist' },
    ];

    if (isLoading) {
        return (
            <div className="p-8">
                <DiscoveryNav current="/admin/discovery/fraud" />
                <div className="flex items-center justify-center py-32">
                    <div className="flex items-center gap-3 text-text-secondary">
                        <Activity className="animate-spin" size={20} />
                        <span className="text-sm font-bold uppercase tracking-widest">Loading fraud dashboard…</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <Link href="/admin/discovery/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-main transition-colors mb-6">
                <ChevronLeft size={14} /> Back to Discovery
            </Link>

            {/* Risk Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {stats.map((stat) => (
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

            {/* Fraud Logs Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShieldAlert className="text-rose-500" size={20} />
                        <h2 className="text-lg font-display font-bold text-text-main">Anomaly Detection Feed</h2>
                    </div>
                    <div className="flex gap-2">
                        <button className="h-10 px-4 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest text-text-secondary hover:bg-gray-50 transition-all">Clear Resolved</button>
                        <button className="h-10 px-4 rounded-xl bg-text-main text-white text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all">Update Rules</button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Incident & Time</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Type</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Business Involved</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Reasoning</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Confidence</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {dashboard?.alerts?.map((alert) => (
                                <tr key={alert.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-mono font-bold text-text-main group-hover:text-primary transition-colors">{alert.id}</p>
                                            <p className="text-[10px] font-medium text-text-secondary mt-0.5">{alert.date}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                            alert.severity === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                            alert.severity === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                            'bg-blue-50 text-blue-600 border border-blue-100'
                                        }`}>
                                            {alert.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-text-main">
                                        {alert.business}
                                    </td>
                                    <td className="px-6 py-4 max-w-xs truncate italic text-text-secondary">
                                        {alert.reason}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="font-black text-text-main">{alert.confidence}</span>
                                            <div className="w-12 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                <div className="h-full bg-primary" style={{ width: alert.confidence }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            alert.status === 'Flagged' ? 'bg-rose-50 text-rose-600' :
                                            alert.status === 'Investigating' ? 'bg-amber-50 text-amber-600' :
                                            'bg-emerald-50 text-emerald-600'
                                        }`}>
                                            {alert.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button title="Examine Data" className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-primary/10 hover:text-primary transition-all">
                                                <Eye size={16} />
                                            </button>
                                            <button title="Suspend Entity" className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-rose-100 hover:text-rose-600 transition-all">
                                                <Ban size={16} />
                                            </button>
                                            <button className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-gray-100 transition-all">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </div>
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
