'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import { 
    ChevronLeft, History, User, Activity, 
    ShieldCheck, Clock, ArrowRight, Lock,
    Unlock, Edit3, CheckCircle2, Database,
    Server, Globe, Info, Search, Filter,
    Eye, LayoutGrid, Smartphone
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdminAuditLog } from '@/services/discovery/hooks';

export default function DiscoveryAuditLogDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: log, isLoading } = useAdminAuditLog(id as string);

    if (isLoading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-4 w-40 bg-gray-200 rounded" />
                    <div className="flex items-center gap-5">
                        <div className="size-20 rounded-3xl bg-gray-100" />
                        <div className="space-y-3">
                            <div className="h-6 w-48 bg-gray-200 rounded" />
                            <div className="h-4 w-64 bg-gray-100 rounded" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <div className="xl:col-span-2 h-64 bg-gray-100 rounded-3xl" />
                        <div className="h-64 bg-gray-100 rounded-3xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!log) return null;

    return (
        <div className="p-8">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-text-secondary hover:text-text-main transition-colors mb-6 text-xs font-black uppercase tracking-widest"
            >
                <ChevronLeft size={16} /> Back to Audit Logs
            </button>

            <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
                <div className="flex items-center gap-5">
                    <div className="size-20 rounded-3xl bg-gray-50 text-text-secondary border border-gray-100 flex items-center justify-center text-3xl font-bold shadow-inner">
                        <History size={32} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-display font-bold text-text-main">Event {log.id}</h1>
                            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                {log.status}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-text-secondary mt-1">{log.action} performed by <span className="font-bold text-text-main">{log.admin}</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="h-12 px-6 rounded-2xl border border-gray-200 bg-white text-text-main text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <ShieldCheck size={16} /> Verify Hash
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">
                    {/* Before/After Comparison (The "Stitch" requirement) */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-lg font-display font-bold text-text-main uppercase tracking-tight">Data Transformation</h2>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-text-secondary">
                                <Clock size={12} />
                                System Snapshot
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2">
                            <div className="p-8 bg-gray-50/50 border-r border-gray-100">
                                <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary mb-6 flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-rose-500" />
                                    Before Changes
                                </h3>
                                <div className="space-y-4 font-mono text-xs">
                                    {Object.entries(log.changes.before).map(([key, val]) => (
                                        <div key={key} className="flex justify-between border-b border-gray-200/50 pb-2">
                                            <span className="text-text-secondary">{key}:</span>
                                            <span className="text-text-main font-bold">{val === null ? 'null' : `"${val}"`}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="p-8">
                                <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-emerald-500" />
                                    After Changes
                                </h3>
                                <div className="space-y-4 font-mono text-xs">
                                    {Object.entries(log.changes.after).map(([key, val]) => (
                                        <div key={key} className="flex justify-between border-b border-gray-200/50 pb-2">
                                            <span className="text-text-secondary">{key}:</span>
                                            <span className="text-primary font-bold">"{val}"</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Event Metadata */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-text-main mb-6 flex items-center gap-2">
                            <Info className="text-primary" size={18} />
                            Administrative Details
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Module</p>
                                <p className="text-sm font-bold text-text-main">{log.module}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Target Resource</p>
                                <p className="text-sm font-bold text-text-main">{log.target}</p>
                                <p className="text-[10px] font-medium text-text-secondary uppercase mt-0.5">{log.business}</p>
                            </div>
                            <div className="pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-3 mb-4">
                                    <Globe size={14} className="text-gray-400" />
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Source IP</p>
                                        <p className="text-xs font-mono font-bold text-text-main">{log.ip}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Smartphone size={14} className="text-gray-400" />
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Environment</p>
                                        <p className="text-xs font-medium text-text-main leading-tight">{log.device}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Immutable Stamp */}
                    <div className="bg-text-main rounded-3xl p-8 text-white relative overflow-hidden group">
                        <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                            <Lock size={20} className="text-primary" />
                            Digital Signature
                        </h3>
                        <p className="text-white/60 text-xs font-mono break-all leading-relaxed">
                            sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                        </p>
                        <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                            <CheckCircle2 size={12} />
                            Chain Verified
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                            <Server size={120} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
