'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import { 
    ChevronLeft, MapPin, Store, Tag, 
    TrendingUp, Users, DollarSign, Target,
    Search, Filter, Map as MapIcon, ArrowUpRight,
    Navigation, Activity, Calendar, Download
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DiscoveryLocationDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'businesses' | 'offers' | 'revenue' | 'referrals'>('businesses');

    // Mock details
    const loc = {
        id,
        name: 'Wuse 2',
        city: 'Abuja',
        stats: {
            totalBusinesses: 45,
            activeOffers: 120,
            referrals: 450,
            revenue: 1250000,
            growth: '+18%',
            density: '12.4 biz/km²'
        }
    };

    return (
        <div className="p-8">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-text-secondary hover:text-text-main transition-colors mb-6 text-xs font-black uppercase tracking-widest"
            >
                <ChevronLeft size={16} /> Back to Locations
            </button>

            <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
                <div className="flex items-center gap-5">
                    <div className="size-20 rounded-3xl bg-primary/5 text-primary flex items-center justify-center text-3xl font-bold shadow-inner">
                        <MapPin size={32} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-display font-bold text-text-main">{loc.name} District</h1>
                            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                                {loc.city}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm font-medium text-text-secondary">
                            <span className="flex items-center gap-1.5"><Store size={14} /> {loc.stats.totalBusinesses} Businesses</span>
                            <span className="flex items-center gap-1.5"><Navigation size={14} /> {loc.stats.density}</span>
                            <span className="flex items-center gap-1.5 text-emerald-600 font-bold"><TrendingUp size={14} /> {loc.stats.growth} Growth</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="h-12 px-6 rounded-2xl border border-gray-200 bg-white text-text-main text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <Download size={16} /> District Report
                    </button>
                    <button className="h-12 px-8 rounded-2xl bg-text-main text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg active:scale-95">
                        Manage Area Rules
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Network Revenue', value: `₦${loc.stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Total Referrals', value: loc.stats.referrals.toLocaleString(), icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Active Offers', value: loc.stats.activeOffers, icon: Tag, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Conversion Rate', value: '14.2%', icon: Target, color: 'text-amber-500', bg: 'bg-amber-50' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                        <div className={`p-3 rounded-2xl w-fit mb-4 ${stat.bg} ${stat.color}`}>
                            <stat.icon size={20} strokeWidth={2.5} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{stat.label}</p>
                        <p className="text-2xl font-display font-bold text-text-main mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Sub-navigation Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100/50 rounded-2xl w-fit mb-8 border border-gray-100">
                {(['businesses', 'offers', 'revenue', 'referrals'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === tab 
                            ? 'bg-white text-primary shadow-sm' 
                            : 'text-text-secondary hover:text-text-main'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {activeTab === 'businesses' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Business Name</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Category</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Referrals</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Revenue Contributed</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {[
                                    { name: 'The Grill House', cat: 'Dining', ref: 145, rev: 650000, status: 'Active' },
                                    { name: 'Fashion Hub', cat: 'Retail', ref: 89, rev: 320000, status: 'Active' },
                                    { name: 'Juice Paradise', cat: 'Dining', ref: 64, rev: 120000, status: 'Active' },
                                ].map((biz, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-text-main">{biz.name}</td>
                                        <td className="px-6 py-4 text-text-secondary font-medium">{biz.cat}</td>
                                        <td className="px-6 py-4 text-center font-bold text-text-main">{biz.ref}</td>
                                        <td className="px-6 py-4 text-right font-black text-text-main">₦{biz.rev.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase">{biz.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {/* Other tabs follow similar structure... */}
            </div>
        </div>
    );
}
