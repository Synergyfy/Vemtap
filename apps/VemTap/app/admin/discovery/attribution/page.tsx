'use client';

import React from 'react';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import { 
    Target, TrendingUp, DollarSign, Clock, CheckCircle2,
    ArrowRight, MapPin, MousePointerClick, Tag, Search, Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdminAttribution } from '@/services/discovery/hooks';

export default function DiscoveryAttributionPage() {
    const { data, isLoading } = useAdminAttribution();
    const stats = data?.metrics;
    const paths = data?.paths ?? [];
    const windowHours = data?.window ?? 24;

    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/attribution" />

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            ) : (<>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Attributed Visits', value: stats?.attributedVisits?.toLocaleString() ?? '0', icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Attributed Purchases', value: stats?.attributedPurchases?.toLocaleString() ?? '0', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Attributed Revenue', value: stats?.attributedRevenue ?? '₦0', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Avg Attribution Time', value: stats?.avgAttributionTime ?? '0m', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
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

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Journey Visualization Placeholder */}
                <div className="xl:col-span-2 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-lg font-display font-bold text-text-main">Top Attribution Paths</h2>
                            <p className="text-xs text-text-secondary font-medium mt-1">Most successful business-to-business customer flows</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {paths.map((path, i) => (
                            <div key={i} className="p-4 rounded-2xl border border-gray-50 bg-gray-50/30 flex items-center justify-between group hover:bg-white hover:border-gray-200 hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="px-3 py-1.5 rounded-lg bg-white border border-gray-100 text-xs font-bold text-text-main">{path.from}</div>
                                        <ArrowRight size={14} className="text-gray-300" />
                                        <div className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold">{path.to}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-text-secondary uppercase">Monthly Flow</p>
                                        <p className="text-sm font-bold text-text-main">{path.flow} users</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-text-secondary uppercase">Conv. Rate</p>
                                        <p className="text-sm font-bold text-emerald-600">{path.conversion}</p>
                                    </div>
                                    <div className="text-right min-w-[80px]">
                                        <p className="text-[10px] font-black text-text-secondary uppercase">Revenue</p>
                                        <p className="text-sm font-black text-text-main">{path.revenue}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-text-main mb-6 flex items-center gap-2">
                            <Target className="text-primary" size={18} />
                            Attribution Window
                        </h3>
                        <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                            <p className="text-4xl font-display font-bold text-primary">{windowHours}h</p>
                            <p className="text-xs font-bold text-text-secondary mt-2 uppercase tracking-widest">Active Setting</p>
                        </div>
                        <p className="text-xs font-medium text-text-secondary mt-6 leading-relaxed">
                            Referrals are currently attributed if the customer visits the target business within <span className="text-text-main font-bold">{windowHours} hours</span> of receiving the offer.
                        </p>
                        <button className="mt-8 w-full py-4 bg-gray-50 text-text-main text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all">
                            Change Attribution Rules
                        </button>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                        <TrendingUp size={160} />
                    </div>
                </div>
            </div>
        </>)}
        </div>
    );
}
