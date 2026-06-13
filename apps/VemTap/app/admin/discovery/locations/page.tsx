'use client';

import React from 'react';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import { useDiscoveryBusinesses } from '@/services/discovery/hooks';
import { 
    Search, Filter, Map as MapIcon, ArrowUpRight, Target, Navigation, Eye
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const MOCK_LOCATIONS = [
    { id: '1', name: 'Wuse 2', businesses: 45, offers: 120, referrals: 450, revenue: 1250000, growth: '+18%' },
    { id: '2', name: 'Garki', businesses: 32, offers: 85, referrals: 310, revenue: 850000, growth: '+12%' },
    { id: '3', name: 'Maitama', businesses: 28, offers: 64, referrals: 280, revenue: 1850000, growth: '+5%' },
    { id: '4', name: 'Jabi', businesses: 15, offers: 40, referrals: 120, revenue: 420000, growth: '+25%' },
];

export default function DiscoveryLocationsPage() {
    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/locations" />

            {/* Geographical Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Active Locations', value: '12', sub: 'Cities/Districts', icon: MapIcon, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Top Location', value: 'Wuse 2', sub: '₦1.2M Revenue', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Hotspot Growth', value: '+24%', sub: 'Last 30 days', icon: ArrowUpRight, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Network Density', value: '8.4', sub: 'Biz per km²', icon: Navigation, color: 'text-amber-500', bg: 'bg-amber-50' },
                ].map((stat) => (
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

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Location List */}
                <div className="xl:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="text-lg font-display font-bold text-text-main">Performance by District</h2>
                        <div className="flex items-center gap-2">
                            <Search className="size-4 text-text-secondary" />
                            <input type="text" placeholder="Filter locations..." className="text-sm font-medium outline-none bg-transparent" />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Location Name</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Businesses</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Active Offers</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Referrals</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Revenue</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {MOCK_LOCATIONS.map((loc) => (
                                    <tr key={loc.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center">
                                                    <MapIcon size={16} />
                                                </div>
                                                <p className="font-bold text-text-main group-hover:text-primary transition-colors">{loc.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-text-main">{loc.businesses}</td>
                                        <td className="px-6 py-4 text-center font-bold text-text-main">{loc.offers}</td>
                                        <td className="px-6 py-4 text-center font-bold text-text-main">{loc.referrals}</td>
                                        <td className="px-6 py-4 text-right font-black text-text-main">₦{loc.revenue.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/admin/discovery/locations/${loc.id}`} className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-primary/10 hover:text-primary transition-all">
                                                    <Eye size={16} />
                                                </Link>
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                                    <ArrowUpRight size={12} />
                                                    {loc.growth}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Heatmap Placeholder/Quick Insight */}
                <div className="bg-primary rounded-3xl p-8 text-white relative overflow-hidden group">
                    <div className="relative z-10">
                        <h3 className="text-lg font-display font-bold mb-2">Expansion Opportunity</h3>
                        <p className="text-white/70 text-sm font-medium leading-relaxed">
                            <span className="text-white font-bold">Jabi District</span> has seen a 25% increase in visitor check-ins but only has 15 businesses in the network.
                        </p>
                        <div className="mt-8 space-y-4">
                            <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Target Conversion Rate</p>
                                <p className="text-2xl font-display font-bold">15.2%</p>
                            </div>
                            <button className="w-full py-3 bg-white text-primary text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all active:scale-95">
                                View District Report
                            </button>
                        </div>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                        <MapIcon size={140} />
                    </div>
                </div>
            </div>
        </div>
    );
}
