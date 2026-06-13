'use client';

import React from 'react';
import Link from 'next/link';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import { 
    Search, Filter, Plus, MoreHorizontal, 
    Eye, CheckCircle2, Pause, Play, XCircle,
    Activity, DollarSign, Target, Calendar,
    TrendingUp, BadgeDollarSign, MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_CAMPAIGNS = [
    {
        id: 'CAMP-001',
        business: 'Fashion Hub',
        name: 'Summer Lookbook Boost',
        radius: '1.5km',
        budget: 50000,
        spent: 12500,
        duration: '30 Days',
        status: 'Active',
        impressions: 4500,
        clicks: 820,
        conversions: 45,
    },
    {
        id: 'CAMP-002',
        business: 'The Grill House',
        name: 'Lunch Hour Featured',
        radius: '500m',
        budget: 25000,
        spent: 25000,
        duration: '14 Days',
        status: 'Ended',
        impressions: 12000,
        clicks: 2100,
        conversions: 180,
    },
    {
        id: 'CAMP-003',
        business: 'Sharp Cuts',
        name: 'New Client acquisition',
        radius: '2km',
        budget: 75000,
        spent: 0,
        duration: '60 Days',
        status: 'Pending',
        impressions: 0,
        clicks: 0,
        conversions: 0,
    }
];

export default function DiscoverySponsoredPage() {
    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/sponsored" />

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    { label: 'Active Campaigns', value: '24', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Monthly Ad Revenue', value: '₦850,000', icon: BadgeDollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Avg. Click-Through Rate', value: '4.8%', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50' },
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

            {/* Filters & Search */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search campaigns or businesses..."
                            className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                        />
                    </div>
                    <button className="h-12 px-6 rounded-2xl border border-gray-200 bg-white text-text-main text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <Filter size={16} /> Filters
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <button className="h-12 px-6 rounded-2xl bg-white border border-gray-200 text-text-main text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        Billing Logs
                    </button>
                    <button className="h-12 px-6 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95">
                        <Plus size={16} /> Create Campaign
                    </button>
                </div>
            </div>

            {/* Campaigns Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Campaign & Business</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Targeting</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Budget & Progress</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Performance</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {MOCK_CAMPAIGNS.map((camp) => (
                                <tr key={camp.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-bold text-text-main group-hover:text-primary transition-colors">{camp.name}</p>
                                            <p className="text-[10px] font-medium text-text-secondary mt-0.5">{camp.business}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-[11px] font-medium text-text-secondary">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin size={12} className="text-gray-400" />
                                                {camp.radius} Radius
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={12} className="text-gray-400" />
                                                {camp.duration}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-[150px]">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <p className="text-[10px] font-black text-text-main">₦{camp.spent.toLocaleString()}</p>
                                                <p className="text-[10px] font-bold text-text-secondary">₦{camp.budget.toLocaleString()}</p>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-primary rounded-full" 
                                                    style={{ width: `${(camp.spent / camp.budget) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-text-secondary uppercase">Imps</p>
                                                <p className="font-bold text-text-main">{camp.impressions.toLocaleString()}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-text-secondary uppercase">Clicks</p>
                                                <p className="font-bold text-text-main">{camp.clicks.toLocaleString()}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-text-secondary uppercase">Conv</p>
                                                <p className="font-bold text-emerald-600">{camp.conversions}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            camp.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                                            camp.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                                            'bg-gray-100 text-gray-500'
                                        }`}>
                                            <span className={`size-1.5 rounded-full ${
                                                camp.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                camp.status === 'Pending' ? 'bg-amber-500' :
                                                'bg-gray-400'
                                            }`} />
                                            {camp.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {camp.status === 'Pending' && (
                                                <button title="Approve" className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all">
                                                    <CheckCircle2 size={16} />
                                                </button>
                                            )}
                                            {camp.status === 'Active' ? (
                                                <button title="Pause" className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all">
                                                    <Pause size={16} />
                                                </button>
                                            ) : camp.status === 'Paused' && (
                                                <button title="Resume" className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all">
                                                    <Play size={16} />
                                                </button>
                                            )}
                                            <Link href={`/admin/discovery/sponsored/${camp.id}`} title="View Details" className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-primary/10 hover:text-primary transition-all">
                                                <Eye size={16} />
                                            </Link>
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
