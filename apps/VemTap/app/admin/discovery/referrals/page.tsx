'use client';

import React from 'react';
import Link from 'next/link';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import { 
    Search, Filter, Download, MoreHorizontal, 
    Eye, MousePointerClick, User, Store, 
    ArrowRight, CheckCircle2, XCircle, Clock, 
    ShieldAlert, SearchCode
} from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_REFERRALS = [
    {
        id: 'REF-000123',
        customer: 'John Doe',
        source: 'Fashion Hub',
        target: 'The Grill House',
        offer: '15% Lunch Discount',
        status: 'Purchased',
        revenue: 15000,
        date: '2026-06-12 10:45',
    },
    {
        id: 'REF-000124',
        customer: 'Sarah Smith',
        source: 'Supermarket Plus',
        target: 'Sharp Cuts Barbershop',
        offer: 'Free Wash & Style',
        status: 'Visited',
        revenue: 0,
        date: '2026-06-12 11:30',
    },
    {
        id: 'REF-000125',
        customer: 'Mike Ross',
        source: 'The Grill House',
        target: 'Juice Paradise',
        offer: 'BOGO Smoothie',
        status: 'Clicked',
        revenue: 0,
        date: '2026-06-12 12:15',
    }
];

export default function DiscoveryReferralsPage() {
    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/referrals" />

            {/* Header Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search referrals by ID, customer or business..."
                            className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                        />
                    </div>
                    <button className="h-12 px-6 rounded-2xl border border-gray-200 bg-white text-text-main text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <Filter size={16} /> Filters
                    </button>
                </div>
                <button className="h-12 px-6 rounded-2xl bg-text-main text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg active:scale-95">
                    <Download size={16} /> Export Logs
                </button>
            </div>

            {/* Referrals Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Referral ID & Date</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Customer</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Path (Source ➔ Target)</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Offer</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Value</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {MOCK_REFERRALS.map((ref) => (
                                <tr key={ref.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-mono font-bold text-text-main group-hover:text-primary transition-colors">{ref.id}</p>
                                            <p className="text-[10px] font-medium text-text-secondary mt-0.5">{ref.date}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="size-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                <User size={14} />
                                            </div>
                                            <span className="font-bold text-text-main">{ref.customer}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 font-medium">
                                            <span className="text-text-secondary">{ref.source}</span>
                                            <ArrowRight size={12} className="text-gray-300" />
                                            <span className="text-text-main font-bold">{ref.target}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 italic text-text-secondary">
                                        {ref.offer}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            ref.status === 'Purchased' ? 'bg-emerald-50 text-emerald-600' :
                                            ref.status === 'Visited' ? 'bg-blue-50 text-blue-600' :
                                            'bg-amber-50 text-amber-600'
                                        }`}>
                                            <span className={`size-1.5 rounded-full ${
                                                ref.status === 'Purchased' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                ref.status === 'Visited' ? 'bg-blue-500' :
                                                'bg-amber-500'
                                            }`} />
                                            {ref.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-text-main">
                                        {ref.revenue > 0 ? `₦${ref.revenue.toLocaleString()}` : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/admin/discovery/referrals/investigate/${ref.id}`} title="Investigate" className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-amber-100 hover:text-amber-600 transition-all">
                                                <SearchCode size={16} />
                                            </Link>
                                            <button title="View Details" className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-primary/10 hover:text-primary transition-all">
                                                <Eye size={16} />
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

            {/* Fraud Alert Placeholder */}
            <div className="mt-8 p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-white border border-rose-100 text-rose-500 flex items-center justify-center shrink-0 shadow-sm">
                    <ShieldAlert size={24} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-rose-900 uppercase tracking-widest">Fraud Detection Active</h3>
                    <p className="text-xs font-medium text-rose-700/80 mt-1 leading-relaxed">
                        Our AI has flagged <span className="font-bold underline cursor-pointer">3 suspicious referral paths</span> in the last 24 hours. Automated cross-referencing of device IDs and check-in timestamps is preventing duplicate attribution.
                    </p>
                </div>
            </div>
        </div>
    );
}
