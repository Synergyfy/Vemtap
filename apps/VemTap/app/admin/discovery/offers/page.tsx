'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import { 
    Search, Filter, Download, Plus, MoreHorizontal, 
    Eye, CheckCircle2, XCircle, Clock, Tag, Store, 
    MapPin, Users, TrendingUp, Calendar, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdminOffers } from '@/services/discovery/hooks';

export default function DiscoveryOffersPage() {
    const [search, setSearch] = useState('');
    const { data, isLoading } = useAdminOffers({ search });
    const offers = data?.data ?? [];
    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/offers" />

            {/* Header Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search offers by name or business..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                        />
                    </div>
                    <button className="h-12 px-6 rounded-2xl border border-gray-200 bg-white text-text-main text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <Filter size={16} /> Filters
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <button className="h-12 px-6 rounded-2xl bg-white border border-gray-200 text-text-main text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        Offer Categories
                    </button>
                    <button className="h-12 px-6 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95">
                        <Plus size={16} /> Create Global Offer
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Active', value: '342', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Pending Approval', value: '18', color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Scheduled', value: '45', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Expired (30d)', value: '89', color: 'text-gray-500', bg: 'bg-gray-50' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{stat.label}</p>
                            <p className={`text-2xl font-display font-bold ${stat.color} mt-1`}>{stat.value}</p>
                        </div>
                        <div className={`size-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                            <Tag size={18} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Offers Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Offer Details</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Business</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Period</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Performance</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Revenue</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={`skeleton-${i}`} className="animate-pulse">
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                                <div className="h-3 bg-gray-100 rounded w-1/2" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                <div className="h-3 bg-gray-100 rounded w-2/3" />
                                                <div className="h-3 bg-gray-100 rounded w-2/3" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-8 bg-gray-100 rounded w-12" />
                                                <div className="h-8 bg-gray-100 rounded w-12" />
                                                <div className="h-8 bg-gray-100 rounded w-12" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="h-4 bg-gray-200 rounded w-20" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="h-6 bg-gray-100 rounded-full w-20" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 justify-end">
                                                <div className="h-8 w-8 bg-gray-100 rounded-lg" />
                                                <div className="h-8 w-8 bg-gray-100 rounded-lg" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                offers.map((offer) => (
                                    <tr key={offer.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-text-main group-hover:text-primary transition-colors">{offer.name}</p>
                                                <p className="text-[10px] font-medium text-text-secondary mt-0.5">{offer.category}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="size-6 rounded-md bg-gray-100 text-[10px] flex items-center justify-center font-bold text-gray-500">
                                                    <Store size={12} />
                                                </div>
                                                <span className="font-bold text-text-main">{offer.business}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-[11px] font-medium text-text-secondary">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={12} className="text-gray-400" />
                                                    {offer.startDate}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={12} className="text-gray-400" />
                                                    {offer.endDate}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black text-text-secondary uppercase">Views</p>
                                                    <p className="font-bold text-text-main">{offer.views.toLocaleString()}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black text-text-secondary uppercase">Clicks</p>
                                                    <p className="font-bold text-text-main">{offer.clicks.toLocaleString()}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black text-text-secondary uppercase">Visits</p>
                                                    <p className="font-bold text-emerald-600">{offer.visits.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-text-main">
                                            ₦{offer.revenue.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                offer.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                                                offer.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                                                'bg-blue-50 text-blue-600'
                                            }`}>
                                                <span className={`size-1.5 rounded-full ${
                                                    offer.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                    offer.status === 'Pending' ? 'bg-amber-500' :
                                                    'bg-blue-500'
                                                }`} />
                                                {offer.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center gap-2">
                                                {offer.status === 'Pending' && (
                                                    <button title="Approve" className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all">
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                )}
                                                <Link href={`/admin/discovery/offers/${offer.id}`} title="View Details" className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-primary/10 hover:text-primary transition-all">
                                                    <Eye size={16} />
                                                </Link>
                                                <button className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-gray-100 transition-all">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Insight */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center gap-3">
                    <AlertCircle className="text-primary" size={16} />
                    <p className="text-xs font-medium text-text-secondary">
                        <span className="text-text-main font-bold">Pro Tip:</span> Offers with a radius under 500m have a <span className="text-emerald-600 font-bold">14% higher conversion rate</span> in Wuse 2.
                    </p>
                </div>
            </div>
        </div>
    );
}
