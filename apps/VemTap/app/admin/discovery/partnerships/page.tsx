'use client';

import React from 'react';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import { 
    Handshake, Users, TrendingUp, DollarSign, 
    Search, Filter, Plus, MoreHorizontal,
    CheckCircle2, XCircle, Ban, Eye,
    ArrowRight, Store, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdminPartnerships } from '@/services/discovery/hooks';

export default function DiscoveryPartnershipsPage() {
    const { data, isLoading } = useAdminPartnerships();
    const partnerships = data?.data ?? [];

    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/partnerships" />

            {/* Partnership Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    { label: 'Active Partnerships', value: '64', icon: Handshake, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Customers Shared', value: '2,840', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Partner Revenue', value: '₦1.2M', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex items-center gap-4">
                        <div className={`size-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                            <stat.icon size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{stat.label}</p>
                            <p className="text-2xl font-display font-bold text-text-main mt-0.5">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions & Search */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search partnerships or businesses..."
                            className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                        />
                    </div>
                    <button className="h-12 px-6 rounded-2xl border border-gray-200 bg-white text-text-main text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <Filter size={16} /> Filters
                    </button>
                </div>
                <button className="h-12 px-6 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95">
                    <Plus size={16} /> Create Agreement
                </button>
            </div>

            {/* Partnerships Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Partner Pair (A ➔ B)</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Created Date</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Shared Traffic</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Revenue Impact</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-24 rounded-lg bg-gray-100" />
                                                <div className="size-3 rounded-full bg-gray-100" />
                                                <div className="h-8 w-24 rounded-lg bg-gray-100" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-gray-100" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-16 rounded bg-gray-100" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-20 rounded bg-gray-100" /></td>
                                        <td className="px-6 py-4"><div className="h-6 w-16 rounded-full bg-gray-100" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-20 rounded bg-gray-100 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : partnerships.map((prt) => (
                                <tr key={prt.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-xs font-bold text-text-main group-hover:border-primary transition-colors">{prt.businessA}</div>
                                            <ArrowRight size={14} className="text-gray-300" />
                                            <div className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-xs font-bold text-text-main group-hover:border-primary transition-colors">{prt.businessB}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-text-secondary font-medium">
                                            <Calendar size={14} className="text-gray-400" />
                                            {prt.dateCreated}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Users size={14} className="text-purple-500" />
                                            <span className="font-bold text-text-main">{prt.customersShared}</span>
                                            <span className="text-[10px] text-text-secondary font-medium uppercase tracking-widest ml-1">Visitors</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp size={14} className="text-emerald-500" />
                                            <span className="font-bold text-text-main">₦{prt.revenueGenerated.toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            prt.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                                            prt.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                                            'bg-rose-50 text-rose-600'
                                        }`}>
                                            <span className={`size-1.5 rounded-full ${
                                                prt.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                prt.status === 'Pending' ? 'bg-amber-500' :
                                                'bg-rose-500'
                                            }`} />
                                            {prt.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {prt.status === 'Pending' && (
                                                <button title="Approve" className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all">
                                                    <CheckCircle2 size={16} />
                                                </button>
                                            )}
                                            <button title="View Performance" className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-primary/10 hover:text-primary transition-all">
                                                <Eye size={16} />
                                            </button>
                                            <button title="Suspend Partnership" className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-rose-50 hover:text-rose-600 transition-all">
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
