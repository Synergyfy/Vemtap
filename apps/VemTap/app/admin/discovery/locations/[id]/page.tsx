'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import {
    ChevronLeft, MapPin, Store, Tag,
    TrendingUp, Users, DollarSign, Target,
    Navigation, Download
} from 'lucide-react';
import { useAdminLocation } from '@/services/discovery/hooks';

export default function DiscoveryLocationDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'businesses' | 'offers' | 'revenue' | 'referrals'>('businesses');
    const { data: loc, isLoading } = useAdminLocation(id as string);

    if (isLoading) {
        return (
            <div className="p-8">
                <div className="h-4 w-40 bg-gray-100 rounded mb-6 animate-pulse" />
                <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
                    <div className="flex items-center gap-5">
                        <div className="size-20 rounded-3xl bg-gray-100 animate-pulse" />
                        <div>
                            <div className="h-8 w-48 bg-gray-100 rounded mb-2 animate-pulse" />
                            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm animate-pulse">
                            <div className="h-10 w-10 rounded-2xl bg-gray-100 mb-4" />
                            <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
                            <div className="h-6 w-20 bg-gray-100 rounded" />
                        </div>
                    ))}
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 animate-pulse">
                    <div className="h-12 bg-gray-50 rounded-lg mb-4" />
                    <div className="h-12 bg-gray-50 rounded-lg mb-4" />
                    <div className="h-12 bg-gray-50 rounded-lg" />
                </div>
            </div>
        );
    }

    if (!loc) {
        return (
            <div className="p-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-text-secondary hover:text-text-main transition-colors mb-6 text-xs font-black uppercase tracking-widest"
                >
                    <ChevronLeft size={16} /> Back to Locations
                </button>
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
                    <p className="text-text-secondary text-sm">Location not found.</p>
                </div>
            </div>
        );
    }

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
                            <span className="flex items-center gap-1.5"><Store size={14} /> {loc.businesses} Businesses</span>
                            <span className="flex items-center gap-1.5"><Navigation size={14} /> {loc.density}</span>
                            <span className="flex items-center gap-1.5 text-emerald-600 font-bold"><TrendingUp size={14} /> {loc.growth} Growth</span>
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
                    { label: 'Network Revenue', value: `₦${loc.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Total Referrals', value: loc.referrals.toLocaleString(), icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Active Offers', value: loc.offers, icon: Tag, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Conversion Rate', value: loc.conversionRate, icon: Target, color: 'text-amber-500', bg: 'bg-amber-50' },
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
                    <div className="p-12 text-center">
                        <Store size={40} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-sm font-bold text-text-secondary">Business data for this location is not yet available.</p>
                        <p className="text-xs text-text-secondary/60 mt-1">This section will be populated in a future update.</p>
                    </div>
                )}
                {activeTab !== 'businesses' && (
                    <div className="p-12 text-center">
                        <Tag size={40} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-sm font-bold text-text-secondary">This section is coming soon.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
