'use client';

import React from 'react';
import Link from 'next/link';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import { 
    History, User, Activity, ShieldCheck, 
    Search, Filter, Clock, ArrowRight,
    Lock, Unlock, Edit3, CheckCircle2,
    Database, Server, Globe, Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdminAuditLogs } from '@/services/discovery/hooks';

export default function DiscoveryAuditLogsPage() {
    const { data, isLoading } = useAdminAuditLogs({ limit: 20 });
    const audits = data?.data ?? [];

    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/audit-logs" />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-6">
                    {/* Search & Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div className="relative flex-1 min-w-[300px] group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary group-focus-within:text-primary transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search by admin name, action or target ID..."
                                className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                            />
                        </div>
                        <button className="h-12 px-6 rounded-2xl border border-gray-200 bg-white text-text-main text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                            <Filter size={16} /> Date Range
                        </button>
                    </div>

                    {/* Audit Table */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Timestamp & ID</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Administrator</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Action performed</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-sm">
                                    {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-6 py-4">
                                                    <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
                                                    <div className="h-2 w-16 bg-gray-100 rounded" />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="h-3 w-32 bg-gray-200 rounded" />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="h-3 w-28 bg-gray-200 rounded" />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="h-8 w-8 bg-gray-100 rounded-lg ml-auto" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : audits.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-text-main">{log.date}</p>
                                                    <p className="text-[10px] font-mono text-text-secondary mt-0.5">{log.id}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-text-main font-bold">
                                                    <div className="size-6 rounded-md bg-gray-100 flex items-center justify-center">
                                                        <User size={12} className="text-gray-500" />
                                                    </div>
                                                    {log.admin}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-text-secondary italic">{log.action}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/admin/discovery/audit-logs/${log.id}`} className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-primary/10 hover:text-primary transition-all inline-flex items-center">
                                                    <Eye size={16} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Audit Sidebar / Stats */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-text-main mb-6 flex items-center gap-2">
                            <ShieldCheck className="text-primary" size={18} />
                            Log Integrity
                        </h3>
                        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100">
                            <div className="flex gap-3">
                                <Database className="text-emerald-600 shrink-0" size={18} />
                                <div>
                                    <p className="text-xs font-bold text-emerald-900">Immutable Storage</p>
                                    <p className="text-[10px] font-medium text-emerald-800/70 mt-1 leading-relaxed">
                                        Audit logs are cryptographically hashed and cannot be modified by any administrator.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
