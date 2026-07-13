'use client';

import React from 'react';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import { 
    DollarSign, CreditCard, ArrowUpRight, ArrowDownRight,
    TrendingUp, Calendar, Search, Filter, Download,
    BadgeDollarSign, Receipt, FileText, MoreHorizontal, Eye
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAdminBilling } from '@/services/discovery/hooks';
import type { AdminBillingTransaction } from '@/services/discovery/types';

export default function DiscoveryBillingPage() {
    const { data, isLoading } = useAdminBilling();
    const transactions: AdminBillingTransaction[] = data?.data ?? [];
    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/billing" />

            {/* Revenue Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Revenue', value: '₦2.45M', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50', growth: '+15%' },
                    { label: 'Revenue This Month', value: '₦850k', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50', growth: '+8%' },
                    { label: 'Active Ad Spend', value: '₦450k', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50', growth: '+12%' },
                    { label: 'Pending Payments', value: '₦120k', icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-50', growth: '3 Items' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm group">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon size={20} />
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                {stat.growth}
                            </span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{stat.label}</p>
                        <p className="text-2xl font-display font-bold text-text-main mt-1">{stat.value}</p>
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
                            placeholder="Search invoices or businesses..."
                            className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                        />
                    </div>
                    <button className="h-12 px-6 rounded-2xl border border-gray-200 bg-white text-text-main text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <Filter size={16} /> Filters
                    </button>
                </div>
                <button className="h-12 px-6 rounded-2xl bg-text-main text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg active:scale-95">
                    <Download size={16} /> Export Statement
                </button>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Invoice & Date</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Business</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Description</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Method</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 rounded bg-gray-100 animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-mono font-bold text-text-main group-hover:text-primary transition-colors">{tx.id}</p>
                                            <p className="text-[10px] font-medium text-text-secondary mt-0.5">{tx.date}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-text-main">{tx.business}</span>
                                    </td>
                                    <td className="px-6 py-4 text-text-secondary font-medium italic">
                                        {tx.type}
                                    </td>
                                    <td className="px-6 py-4 font-black text-text-main">
                                        ₦{tx.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-text-secondary">
                                            <CreditCard size={14} />
                                            <span className="font-medium">{tx.method}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            tx.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                        }`}>
                                            <span className={`size-1.5 rounded-full ${tx.status === 'Paid' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/admin/discovery/billing/${tx.id}`} title="View Details" className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-primary/10 hover:text-primary transition-all">
                                                <Eye size={16} />
                                            </Link>
                                            <button title="View Invoice" className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-primary/10 hover:text-primary transition-all">
                                                <FileText size={16} />
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
