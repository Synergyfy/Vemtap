'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    ChevronLeft, Tag, Store, MapPin, Calendar, 
    TrendingUp, Eye, MousePointerClick, CheckCircle2, 
    XCircle, Clock, DollarSign, Share2, MoreHorizontal,
    AlertCircle, BarChart3, Target, Info
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function OfferDiscoveryDetailPage() {
    const { id } = useParams();
    const router = useRouter();

    // Mock details
    const offer = {
        id,
        name: '15% Lunch Discount',
        business: 'The Grill House',
        category: 'Discounts',
        status: 'Active',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        radius: '500m',
        minSpend: 5000,
        stats: {
            views: 1250,
            clicks: 450,
            visits: 85,
            revenue: 145000,
            ctr: '36%',
            conversion: '18.8%'
        }
    };

    return (
        <div className="p-8">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-text-secondary hover:text-text-main transition-colors mb-6 text-xs font-black uppercase tracking-widest"
            >
                <ChevronLeft size={16} /> Back to Offers
            </button>

            <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
                <div className="flex items-center gap-5">
                    <div className="size-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl font-bold shadow-inner">
                        <Tag size={32} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-display font-bold text-text-main">{offer.name}</h1>
                            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                {offer.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm font-medium text-text-secondary">
                            <span className="flex items-center gap-1.5"><Store size={14} /> {offer.business}</span>
                            <span className="flex items-center gap-1.5"><MapPin size={14} /> {offer.radius} Radius</span>
                            <span className="flex items-center gap-1.5"><Calendar size={14} /> {offer.startDate} - {offer.endDate}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="h-12 px-6 rounded-2xl border border-gray-200 bg-white text-text-main text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <Share2 size={16} /> Share Performance
                    </button>
                    <button className="h-12 px-8 rounded-2xl bg-text-main text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg active:scale-95">
                        Edit Offer Rules
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Views', value: offer.stats.views, icon: Eye, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Total Clicks', value: offer.stats.clicks, icon: MousePointerClick, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Store Visits', value: offer.stats.visits, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Revenue Generated', value: `₦${offer.stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50' },
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
                <div className="xl:col-span-2 space-y-8">
                    {/* Performance Funnel */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                        <h2 className="text-lg font-display font-bold text-text-main mb-8 flex items-center gap-2">
                            <BarChart3 size={20} className="text-primary" />
                            Conversion Funnel Performance
                        </h2>
                        <div className="space-y-12 py-4">
                            {[
                                { stage: 'Awareness', action: 'Offer Views', count: offer.stats.views, percent: '100%', color: 'bg-blue-400' },
                                { stage: 'Interest', action: 'Offer Clicks', count: offer.stats.clicks, percent: offer.stats.ctr, color: 'bg-purple-400' },
                                { stage: 'Conversion', action: 'Store Visits', count: offer.stats.visits, percent: offer.stats.conversion, color: 'bg-emerald-400' },
                            ].map((step, i) => (
                                <div key={i} className="relative">
                                    <div className="flex justify-between items-end mb-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{step.stage}</p>
                                            <p className="text-sm font-bold text-text-main">{step.action}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-display font-bold text-text-main">{step.count}</p>
                                            <p className="text-[10px] font-black text-text-secondary">{step.percent} Rate</p>
                                        </div>
                                    </div>
                                    <div className="h-4 w-full bg-gray-50 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: step.percent }}
                                            transition={{ duration: 1.5, delay: i * 0.2 }}
                                            className={`h-full ${step.color} rounded-full opacity-80`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Eligibility & Logic */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                        <h2 className="text-lg font-display font-bold text-text-main mb-6 flex items-center gap-2">
                            <Target size={20} className="text-primary" />
                            Offer Eligibility & Logic
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Discovery Radius</p>
                                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                                        <span className="text-sm font-bold text-text-main">{offer.radius}</span>
                                        <MapPin size={16} className="text-primary" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Minimum Purchase</p>
                                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                                        <span className="text-sm font-bold text-text-main">₦{offer.minSpend.toLocaleString()}</span>
                                        <DollarSign size={16} className="text-primary" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
                                    <div className="flex gap-3">
                                        <Info className="text-blue-600 shrink-0" size={18} />
                                        <p className="text-[11px] font-medium text-blue-900 leading-relaxed">
                                            This offer is only visible to customers who have completed a purchase at a <span className="font-bold text-blue-700">partner business</span> within the same district.
                                        </p>
                                    </div>
                                </div>
                                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100">
                                    <div className="flex gap-3">
                                        <Clock className="text-amber-600 shrink-0" size={18} />
                                        <p className="text-[11px] font-medium text-amber-900 leading-relaxed">
                                            Offer auto-expires in <span className="font-bold text-amber-700">17 days</span>. System will notify the business owner 48 hours prior.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Top Referral Sources */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-text-main mb-6">Top Referral Sources</h3>
                        <div className="space-y-5">
                            {[
                                { name: 'Fashion Hub', count: 185, growth: '+12%' },
                                { name: 'Supermarket Plus', count: 142, growth: '+5%' },
                                { name: 'Sharp Cuts', count: 98, growth: '+18%' },
                            ].map((src, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-lg bg-gray-50 flex items-center justify-center text-xs font-black text-text-secondary">{i+1}</div>
                                        <span className="text-sm font-bold text-text-main">{src.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-text-main">{src.count}</p>
                                        <p className="text-[10px] font-bold text-emerald-600">{src.growth}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="mt-8 w-full py-3 bg-gray-50 text-text-main text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all">
                            Manage All Sources
                        </button>
                    </div>

                    {/* AI Insight Card */}
                    <div className="bg-text-main rounded-3xl p-8 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                                <TrendingUp className="text-primary" size={20} />
                            </div>
                            <h3 className="text-lg font-display font-bold mb-2">Performance Forecast</h3>
                            <p className="text-white/70 text-xs font-medium leading-relaxed">
                                Based on current velocity, this offer is projected to generate <span className="text-white font-bold">₦420,000</span> in revenue by month-end.
                            </p>
                            <div className="mt-6 flex items-center gap-2">
                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full w-2/3 bg-primary rounded-full" />
                                </div>
                                <span className="text-[10px] font-black uppercase">On Track</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
