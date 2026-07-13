'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import { 
    ChevronLeft, Boxes, Tag, TrendingUp, Users, 
    DollarSign, Target, BarChart3, ArrowUpRight,
    PieChart, LayoutGrid, Info, Download, Store
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdminCategory } from '@/services/discovery/hooks';

export default function DiscoveryCategoryDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'businesses' | 'offers' | 'revenue' | 'conversions'>('businesses');
    const { data: cat, isLoading } = useAdminCategory(id as string);

    if (isLoading) {
        return (
            <div className="p-8">
                <DiscoveryNav current="/admin/discovery/categories" />
                <div className="h-8 w-40 bg-gray-100 rounded mb-6 animate-pulse" />
                <div className="flex items-center gap-5 mb-8 animate-pulse">
                    <div className="size-20 rounded-3xl bg-gray-100" />
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-gray-100 rounded" />
                        <div className="h-4 w-64 bg-gray-100 rounded" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm animate-pulse">
                            <div className="h-10 w-10 rounded-2xl bg-gray-100 mb-4" />
                            <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
                            <div className="h-6 w-16 bg-gray-100 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!cat) return null;

    return (
        <div className="p-8">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-text-secondary hover:text-text-main transition-colors mb-6 text-xs font-black uppercase tracking-widest"
            >
                <ChevronLeft size={16} /> Back to Categories
            </button>

            <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
                <div className="flex items-center gap-5">
                    <div className="size-20 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl font-bold shadow-inner">
                        <Boxes size={32} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-display font-bold text-text-main">{cat.name}</h1>
                            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                High Performance
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm font-medium text-text-secondary">
                            <span className="flex items-center gap-1.5"><Store size={14} /> {cat.totalBusinesses} Businesses</span>
                            <span className="flex items-center gap-1.5 font-bold text-text-main"><TrendingUp size={14} /> {cat.conversion} Conv. Rate</span>
                            <span className="flex items-center gap-1.5"><DollarSign size={14} /> {cat.avgTicketSize} Avg. Sale</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="h-12 px-6 rounded-2xl border border-gray-200 bg-white text-text-main text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <Download size={16} /> Industry Report
                    </button>
                    <button className="h-12 px-8 rounded-2xl bg-text-main text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg active:scale-95">
                        Adjust Category Rules
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Category Revenue', value: `₦${cat.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Total Referrals', value: cat.referrals.toLocaleString(), icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Active Offers', value: cat.activeOffers, icon: Tag, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Network Penetration', value: cat.penetration, icon: Target, color: 'text-amber-500', bg: 'bg-amber-50' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm group">
                        <div className={`p-3 rounded-2xl w-fit mb-4 ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                            <stat.icon size={20} strokeWidth={2.5} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{stat.label}</p>
                        <p className="text-2xl font-display font-bold text-text-main mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Sub-navigation Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100/50 rounded-2xl w-fit mb-8 border border-gray-100">
                {(['businesses', 'offers', 'revenue', 'conversions'] as const).map((tab) => (
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
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="text-lg font-display font-bold text-text-main uppercase tracking-tight">Top {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} in {cat.name}</h2>
                    <div className="flex items-center gap-2">
                        <LayoutGrid size={18} className="text-text-secondary cursor-pointer hover:text-primary" />
                        <div className="w-px h-4 bg-gray-200 mx-1" />
                        <PieChart size={18} className="text-text-secondary cursor-pointer hover:text-primary" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Entity Name</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Referral Volume</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Conv. Rate</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Revenue Contributed</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {activeTab === 'conversions' ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center text-text-secondary text-sm">
                                        Conversion data coming soon.
                                    </td>
                                </tr>
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center text-text-secondary text-sm">
                                        No data available for this tab yet.
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
