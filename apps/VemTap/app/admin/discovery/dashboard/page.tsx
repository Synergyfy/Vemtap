'use client';

import React from 'react';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import { useDiscoveryStats } from '@/services/discovery/hooks';
import { 
    Store, Tag, Eye, MousePointerClick, Users, 
    CheckCircle2, Gift, TrendingUp, DollarSign, 
    Megaphone, Handshake, Bell, Percent, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DiscoveryDashboardPage() {
    const { data: stats, isLoading } = useDiscoveryStats();

    const kpiCards = [
        { label: 'Participating Businesses', value: stats?.totalBusinesses, icon: Store, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Active Offers', value: stats?.activeOffers, icon: Tag, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Total Offer Views', value: stats?.totalOfferViews?.toLocaleString(), icon: Eye, color: 'text-purple-500', bg: 'bg-purple-50' },
        { label: 'Total Offer Clicks', value: stats?.totalOfferClicks?.toLocaleString(), icon: MousePointerClick, color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: 'Referrals Generated', value: stats?.referralsGenerated, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'Referrals Completed', value: stats?.referralsCompleted, icon: CheckCircle2, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { label: 'Coupons Redeemed', value: stats?.couponsRedeemed, icon: Gift, color: 'text-pink-500', bg: 'bg-pink-50' },
        { label: 'Attributed Sales', value: stats?.attributedSales, icon: TrendingUp, color: 'text-cyan-500', bg: 'bg-cyan-50' },
        { label: 'Attributed Revenue', value: `₦${(stats?.attributedRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Sponsored Revenue', value: `₦${(stats?.sponsoredRevenue || 0).toLocaleString()}`, icon: Megaphone, color: 'text-orange-500', bg: 'bg-orange-50' },
        { label: 'Active Partnerships', value: stats?.activePartnerships, icon: Handshake, color: 'text-teal-500', bg: 'bg-teal-50' },
        { label: 'Notifications Sent', value: stats?.notificationsSent?.toLocaleString(), icon: Bell, color: 'text-rose-500', bg: 'bg-rose-50' },
    ];

    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/dashboard" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {kpiCards.map((card, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={card.label}
                        className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
                    >
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}>
                                <card.icon size={20} strokeWidth={2.5} />
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                <ArrowUpRight size={12} />
                                12%
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-text-secondary">{card.label}</p>
                        <p className="text-2xl font-display font-bold text-text-main mt-1 tracking-tight">
                            {isLoading ? '...' : card.value}
                        </p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="xl:col-span-2 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gray-50 text-text-secondary">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-display font-bold text-text-main tracking-tight">Network Performance</h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mt-1">Referrals vs Completed Visits</p>
                            </div>
                        </div>
                        <select className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold text-text-main outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                            <option>This Month</option>
                        </select>
                    </div>

                    <div className="h-[300px] flex items-end gap-4 relative mt-4">
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="w-full border-b border-gray-900 border-dashed" />
                            ))}
                        </div>
                        {[65, 45, 78, 52, 88, 61, 74].map((val, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                <div className="w-full relative flex items-end justify-center rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors h-[240px]">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${val}%` }}
                                        transition={{ duration: 1, delay: 0.5 + (i * 0.1), ease: "easeOut" }}
                                        className="w-full rounded-2xl bg-gradient-to-t from-primary/80 to-primary shadow-lg shadow-primary/20 group-hover:from-primary group-hover:to-primary-hover transition-all"
                                    />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Day {i+1}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm"
                    >
                        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-text-main mb-6 flex items-center gap-2">
                            <Percent className="text-emerald-500" size={18} />
                            Conversion Insights
                        </h3>
                        <div className="space-y-6">
                            {[
                                { label: 'Offer View to Click', value: '27.3%', color: 'bg-blue-500' },
                                { label: 'Click to Visit', value: '18.5%', color: 'bg-purple-500' },
                                { label: 'Visit to Purchase', value: '12.4%', color: 'bg-emerald-500' },
                            ].map((item) => (
                                <div key={item.label}>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-xs font-bold text-text-secondary">{item.label}</p>
                                        <p className="text-sm font-black text-text-main">{item.value}</p>
                                    </div>
                                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: item.value }}
                                            transition={{ duration: 1, delay: 1 }}
                                            className={`h-full ${item.color} rounded-full`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-primary rounded-3xl p-8 shadow-xl shadow-primary/20 text-white relative overflow-hidden group"
                    >
                        <div className="relative z-10">
                            <h3 className="text-lg font-display font-bold mb-2">Network Expansion</h3>
                            <p className="text-white/70 text-sm font-medium leading-relaxed">
                                You have <span className="text-white font-bold">12 pending</span> businesses waiting for network approval.
                            </p>
                            <button className="mt-6 w-full py-3 bg-white text-primary text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all active:scale-95">
                                Review Applications
                            </button>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Store size={120} />
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
