'use client';

import React from 'react';
import { 
    Tag, Store, MousePointerClick, TrendingUp,
    Search, Filter, PieChart, BarChart3,
    ArrowUpRight, Target, LayoutGrid, Boxes, Eye, ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const MOCK_CATEGORIES = [
    { id: '1', name: 'Restaurants', referrals: 1250, conversion: '18.5%', revenue: 2450000, topOffer: '15% Lunch Discount' },
    { id: '2', name: 'Fashion', referrals: 840, conversion: '12.4%', revenue: 1850000, topOffer: 'Summer Lookbook' },
    { id: '3', name: 'Supermarkets', referrals: 2100, conversion: '5.2%', revenue: 4200000, topOffer: 'Free Delivery' },
    { id: '4', name: 'Salons', referrals: 320, conversion: '22.8%', revenue: 850000, topOffer: 'Free Consultation' },
];

export default function DiscoveryCategoriesPage() {
    return (
        <div className="p-8">
            <Link href="/admin/discovery/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-main transition-colors mb-6">
                <ChevronLeft size={14} /> Back to Discovery
            </Link>

            {/* Category Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Network Categories', value: '18', sub: 'Industry Segments', icon: Boxes, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Highest Conversion', value: 'Salons', sub: '22.8% Rate', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Most Referrals', value: 'Retail', sub: '2.1k this month', icon: MousePointerClick, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Revenue Leader', value: 'Dining', sub: '₦2.4M Generated', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50' },
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
                {/* Category Table */}
                <div className="xl:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="text-lg font-display font-bold text-text-main">Industry Performance</h2>
                        <div className="flex gap-2">
                            <button className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-gray-100 transition-all">
                                <LayoutGrid size={18} />
                            </button>
                            <button className="p-2 rounded-lg bg-primary text-white shadow-lg shadow-primary/20">
                                <PieChart size={18} />
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Category Name</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Total Referrals</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Avg. Conversion</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Revenue Impact</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {MOCK_CATEGORIES.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-text-main group-hover:text-primary transition-colors">{cat.name}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-text-main">{cat.referrals.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase">
                                                {cat.conversion}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-text-main">₦{cat.revenue.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/admin/discovery/categories/${cat.id}`} className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-primary/10 hover:text-primary transition-all inline-flex items-center">
                                                <Eye size={16} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Category Insight Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm relative overflow-hidden">
                        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-text-main mb-6 flex items-center gap-2">
                            <TrendingUp className="text-primary" size={18} />
                            Trending Categories
                        </h3>
                        <div className="space-y-6">
                            {[
                                { label: 'Fitness & Wellness', growth: '+42%', color: 'bg-blue-500' },
                                { label: 'Grocery & Essentials', growth: '+28%', color: 'bg-emerald-500' },
                                { label: 'Home Services', growth: '+15%', color: 'bg-amber-500' },
                            ].map((item) => (
                                <div key={item.label}>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-xs font-bold text-text-secondary">{item.label}</p>
                                        <p className="text-sm font-black text-emerald-600">{item.growth}</p>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: item.growth }}
                                            transition={{ duration: 1 }}
                                            className={`h-full ${item.color} rounded-full`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-text-main rounded-3xl p-8 text-white relative overflow-hidden group">
                        <h3 className="text-lg font-display font-bold mb-2">Smart Grouping</h3>
                        <p className="text-white/60 text-xs font-medium leading-relaxed">
                            Businesses in the <span className="text-white font-bold">Food & Drink</span> category see a 12% boost when paired with <span className="text-white font-bold">Retailers</span>.
                        </p>
                        <button className="mt-6 w-full py-3 bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-white/20 transition-all">
                            Configure Cross-Category Rules
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
