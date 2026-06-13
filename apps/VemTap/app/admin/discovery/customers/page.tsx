'use client';

import React from 'react';
import Link from 'next/link';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import { 
    Users, UserCheck, UserMinus, Eye, 
    Search, Filter, MapPin, Tag, 
    CheckCircle2, Clock, ShieldCheck,
    MousePointerClick, TrendingUp, MoreHorizontal
} from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_CUSTOMERS = [
    {
        id: 'CUST-8801',
        name: 'John Doe',
        location: 'Wuse 2, Abuja',
        optInDate: '2026-05-15',
        status: 'Active',
        totalReferrals: 12,
        redeemedOffers: 5,
        lastActive: '2026-06-13 09:30',
        preferences: ['Fashion', 'Dining']
    },
    {
        id: 'CUST-8802',
        name: 'Sarah Smith',
        location: 'Maitama, Abuja',
        optInDate: '2026-06-01',
        status: 'Active',
        totalReferrals: 4,
        redeemedOffers: 1,
        lastActive: '2026-06-12 18:20',
        preferences: ['Spa', 'Retail']
    },
    {
        id: 'CUST-8803',
        name: 'Mike Ross',
        location: 'Garki, Abuja',
        optInDate: '2026-04-20',
        status: 'Inactive',
        totalReferrals: 28,
        redeemedOffers: 14,
        lastActive: '2026-06-10 11:45',
        preferences: ['Groceries', 'Dining']
    }
];

export default function DiscoveryCustomersPage() {
    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/customers" />

            {/* User Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Network Users', value: '45,280', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Opt-in Rate', value: '72.4%', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Active Today', value: '1,240', icon: UserCheck, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Repeat Visitors', value: '34%', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm group">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{stat.label}</p>
                        <p className="text-2xl font-display font-bold text-text-main mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Search & Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search by name, ID or location..."
                            className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                        />
                    </div>
                    <button className="h-12 px-6 rounded-2xl border border-gray-200 bg-white text-text-main text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <Filter size={16} /> Filters
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <button className="h-12 px-6 rounded-2xl bg-white border border-gray-200 text-text-main text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm">
                        Consent Logs
                    </button>
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Customer Info</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Location</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Referrals</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Redeemed</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Interests</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {MOCK_CUSTOMERS.map((cust) => (
                                <tr key={cust.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-primary/5 text-primary flex items-center justify-center font-bold">
                                                {cust.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-text-main group-hover:text-primary transition-colors">{cust.name}</p>
                                                <p className="text-[10px] font-medium text-text-secondary mt-0.5">ID: {cust.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-text-secondary font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={12} className="text-gray-400" />
                                            {cust.location}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-text-main">
                                        {cust.totalReferrals}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 font-black text-[10px]">
                                            {cust.redeemedOffers}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {cust.preferences.map(p => (
                                                <span key={p} className="px-2 py-0.5 rounded-md bg-gray-100 text-text-secondary text-[10px] font-bold">
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            cust.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {cust.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/admin/discovery/customers/${cust.id}`} title="View History" className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-primary/10 hover:text-primary transition-all">
                                                <Eye size={16} />
                                            </Link>
                                            <button title="Restrict Access" className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-rose-100 hover:text-rose-600 transition-all">
                                                <UserMinus size={16} />
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
