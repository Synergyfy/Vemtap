'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import {
    MapPin, Store, Tag, TrendingUp, Users, DollarSign,
    Search, Filter, Eye, Navigation
} from 'lucide-react';
import { useAdminLocations } from '@/services/discovery/hooks';
import type { AdminLocation } from '@/services/discovery/types';

export default function DiscoveryLocationsPage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const { data: response, isLoading } = useAdminLocations({ page, limit: 10, search });
    const locations: AdminLocation[] = response?.data ?? [];

    if (isLoading) {
        return (
            <div className="p-8">
                <DiscoveryNav current="/admin/discovery/locations" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm animate-pulse">
                            <div className="h-10 w-10 rounded-2xl bg-gray-100 mb-4" />
                            <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
                            <div className="h-6 w-16 bg-gray-100 rounded" />
                        </div>
                    ))}
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50">
                        <div className="h-5 w-40 bg-gray-100 rounded" />
                    </div>
                    <div className="p-6 space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/locations" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Locations', value: locations.length || '0', icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Total Businesses', value: locations.reduce((sum, l) => sum + l.businesses, 0).toLocaleString(), icon: Store, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Total Offers', value: locations.reduce((sum, l) => sum + l.offers, 0).toLocaleString(), icon: Tag, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Total Revenue', value: `₦${locations.reduce((sum, l) => sum + l.revenue, 0).toLocaleString()}`, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50' },
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

            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search locations..."
                            className="w-full h-12 pl-11 pr-4 rounded-2xl border border-gray-100 bg-white text-sm text-text-main placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Location Name</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Businesses</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Offers</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Referrals</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Revenue</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Growth</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {locations.map((loc) => (
                                <tr key={loc.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
                                                <MapPin size={16} />
                                            </div>
                                            <p className="font-bold text-text-main group-hover:text-primary transition-colors">{loc.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-text-main">{loc.businesses}</td>
                                    <td className="px-6 py-4 text-center font-bold text-text-main">{loc.offers}</td>
                                    <td className="px-6 py-4 text-center font-bold text-text-main">{loc.referrals.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-black text-text-main">₦{loc.revenue.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase">
                                            <TrendingUp size={10} /> {loc.growth}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/admin/discovery/locations/${loc.id}`} className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-primary/10 hover:text-primary transition-all inline-flex items-center">
                                            <Eye size={16} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {locations.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-text-secondary">
                                        No locations found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
