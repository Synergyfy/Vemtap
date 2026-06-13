'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import { 
    ChevronLeft, Activity, MapPin, Calendar, 
    TrendingUp, Eye, MousePointerClick, CheckCircle2, 
    DollarSign, Clock, BarChart3, Target, CreditCard,
    History, ShieldCheck, Info, Pause, Play, Download
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SponsoredCampaignDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'performance' | 'billing' | 'audit'>('performance');

    // Mock details
    const camp = {
        id,
        name: 'Summer Lookbook Boost',
        business: 'Fashion Hub',
        status: 'Active',
        radius: '1.5km',
        budget: 50000,
        spent: 12500,
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        stats: {
            impressions: 4500,
            clicks: 820,
            conversions: 45,
            ctr: '18.2%',
            cpc: '₦15.24',
        }
    };

    return (
        <div className="p-8">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-text-secondary hover:text-text-main transition-colors mb-6 text-xs font-black uppercase tracking-widest"
            >
                <ChevronLeft size={16} /> Back to Sponsored Placements
            </button>

            <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
                <div className="flex items-center gap-5">
                    <div className="size-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl font-bold shadow-inner">
                        <Activity size={32} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-display font-bold text-text-main">{camp.name}</h1>
                            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                {camp.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm font-medium text-text-secondary">
                            <span className="flex items-center gap-1.5 font-bold text-text-main">@{camp.business}</span>
                            <span className="flex items-center gap-1.5"><MapPin size={14} /> {camp.radius} Radius</span>
                            <span className="flex items-center gap-1.5"><Calendar size={14} /> {camp.startDate} - {camp.endDate}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="h-12 px-6 rounded-2xl border border-gray-200 bg-white text-text-main text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <Pause size={16} /> Pause Campaign
                    </button>
                    <button className="h-12 px-8 rounded-2xl bg-rose-600 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-rose-700 transition-all shadow-lg active:scale-95">
                        End & Refund
                    </button>
                </div>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100/50 rounded-2xl w-fit mb-8 border border-gray-100">
                {(['performance', 'billing', 'audit'] as const).map((tab) => (
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

            {activeTab === 'performance' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Impressions', value: camp.stats.impressions.toLocaleString(), icon: Eye, color: 'text-blue-500', bg: 'bg-blue-50' },
                            { label: 'Clicks', value: camp.stats.clicks.toLocaleString(), icon: MousePointerClick, color: 'text-purple-500', bg: 'bg-purple-50' },
                            { label: 'CTR', value: camp.stats.ctr, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50' },
                            { label: 'Conversions', value: camp.stats.conversions, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm group">
                                <div className="p-3 rounded-2xl w-fit mb-4 bg-gray-50 text-text-secondary group-hover:bg-primary/5 group-hover:text-primary transition-all">
                                    <stat.icon size={20} strokeWidth={2.5} />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{stat.label}</p>
                                <p className="text-2xl font-display font-bold text-text-main mt-1">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <div className="xl:col-span-2 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                            <h2 className="text-lg font-display font-bold text-text-main mb-8">Daily Engagement Trend</h2>
                            <div className="h-[250px] flex items-end gap-3 px-4">
                                {[40, 65, 42, 88, 55, 30, 92, 74, 45, 61, 82, 38].map((v, i) => (
                                    <div key={i} className="flex-1 bg-gray-50 rounded-t-xl relative group">
                                        <motion.div 
                                            initial={{ height: 0 }}
                                            animate={{ height: `${v}%` }}
                                            className="w-full bg-primary/80 rounded-t-xl group-hover:bg-primary transition-colors"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-6 text-[10px] font-black uppercase tracking-widest text-text-secondary border-t border-gray-50 pt-4">
                                <span>June 01</span>
                                <span>June 15</span>
                                <span>June 30</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-text-main mb-6">Targeting Overview</h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2 text-center">Radius Range</p>
                                    <div className="size-32 rounded-full border-4 border-gray-50 flex items-center justify-center mx-auto relative">
                                        <div className="size-24 rounded-full bg-primary/5 flex items-center justify-center border-2 border-primary/20 border-dashed">
                                            <span className="text-sm font-black text-primary">1.5km</span>
                                        </div>
                                        <div className="absolute top-0 right-0 p-1.5 rounded-full bg-white border border-gray-100 shadow-sm text-primary">
                                            <MapPin size={14} />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 space-y-4">
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <span className="text-text-secondary">Est. Daily Reach</span>
                                        <span className="text-text-main">1,200 - 2,500</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <span className="text-text-secondary">Bidding Strategy</span>
                                        <span className="text-primary uppercase tracking-widest text-[10px]">Aggressive</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'billing' && (
                <div className="space-y-8">
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-lg font-display font-bold text-text-main">Budget & Spending</h2>
                            <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                                <Download size={14} /> Download Invoices
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Total Budget</p>
                                <p className="text-2xl font-display font-bold text-text-main">₦{camp.budget.toLocaleString()}</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Amount Spent</p>
                                <p className="text-2xl font-display font-bold text-emerald-600">₦{camp.spent.toLocaleString()}</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Remaining</p>
                                <p className="text-2xl font-display font-bold text-blue-600">₦{(camp.budget - camp.spent).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="mt-12">
                            <div className="flex justify-between items-end mb-4">
                                <p className="text-sm font-bold text-text-main">Campaign Lifetime Burn</p>
                                <p className="text-sm font-black text-primary">{Math.round((camp.spent / camp.budget) * 100)}% Used</p>
                            </div>
                            <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(camp.spent / camp.budget) * 100}%` }}
                                    className="h-full bg-primary rounded-full shadow-lg shadow-primary/20"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50">
                            <h2 className="text-lg font-display font-bold text-text-main">Campaign Transactions</h2>
                        </div>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Invoice #</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Type</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Amount</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                <tr>
                                    <td className="px-6 py-4 font-mono font-bold text-text-main">INV-C-9021</td>
                                    <td className="px-6 py-4 text-text-secondary">June 01, 2026</td>
                                    <td className="px-6 py-4 font-medium italic">Budget Allocation</td>
                                    <td className="px-6 py-4 text-right font-black text-text-main">₦50,000</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase">Paid</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'audit' && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50">
                        <h2 className="text-lg font-display font-bold text-text-main">Campaign Audit Log</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {[
                            { action: 'Campaign Approved', admin: 'Sarah Admin', time: 'June 01, 2026 10:00 AM', detail: 'Initial activation of 1.5km boost' },
                            { action: 'Rules Updated', admin: 'System AI', time: 'June 05, 2026 02:30 PM', detail: 'Radius expansion from 1km to 1.5km' },
                            { action: 'Budget Threshold Reached', admin: 'Notification Bot', time: 'June 12, 2026 09:15 AM', detail: '80% of budget consumed' },
                        ].map((log, i) => (
                            <div key={i} className="p-6 flex items-start justify-between group hover:bg-gray-50/50 transition-colors">
                                <div className="flex gap-4">
                                    <div className="size-10 rounded-xl bg-gray-50 flex items-center justify-center text-text-secondary">
                                        <History size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-text-main group-hover:text-primary transition-colors">{log.action}</p>
                                        <p className="text-xs font-medium text-text-secondary mt-1">{log.detail}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{log.admin}</span>
                                            <span className="size-1 rounded-full bg-gray-300" />
                                            <span className="text-[10px] font-medium text-gray-400">{log.time}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                    <Info size={16} className="text-gray-400 hover:text-primary" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
