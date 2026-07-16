'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    ChevronLeft, Store, MapPin, Calendar, Tag, 
    TrendingUp, Users, DollarSign, CheckCircle2, 
    XCircle, Ban, ArrowUpRight, MousePointerClick,
    ShieldCheck, Bell, Activity, Clock, MoreHorizontal
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function BusinessDiscoveryDetailPage() {
    const { id } = useParams();
    const router = useRouter();

    // Mock details
    const biz = {
        id,
        name: 'The Grill House',
        category: 'Restaurant & Dining',
        location: 'Wuse 2, Abuja',
        dateJoined: '2026-02-10',
        status: 'Active',
        plan: 'Premium',
        stats: {
            totalReferralsSent: 450,
            totalReferralsRecv: 320,
            completionRate: '72%',
            attributedRevenue: 2450000,
            activeOffers: 3,
            sponsoredCampaigns: 2,
        }
    };

    return (
        <div className="p-8">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-text-secondary hover:text-text-main transition-colors mb-6 text-xs font-black uppercase tracking-widest"
            >
                <ChevronLeft size={16} /> Back to Businesses
            </button>

            <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
                <div className="flex items-center gap-5">
                    <div className="size-20 rounded-3xl bg-primary/5 text-primary flex items-center justify-center text-3xl font-bold shadow-inner">
                        {biz.name.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-display font-bold text-text-main">{biz.name}</h1>
                            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                {biz.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm font-medium text-text-secondary">
                            <span className="flex items-center gap-1.5"><MapPin size={14} /> {biz.location}</span>
                            <span className="flex items-center gap-1.5"><Tag size={14} /> {biz.category}</span>
                            <span className="flex items-center gap-1.5"><Calendar size={14} /> Joined {biz.dateJoined}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="h-12 px-6 rounded-2xl border border-gray-200 bg-white text-text-main text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm">
                        <Ban size={16} /> Suspend
                    </button>
                    <button className="h-12 px-8 rounded-2xl bg-text-main text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg active:scale-95">
                        <Edit3 size={16} className="hidden" /> Manage Network Rules
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Referrals Sent', value: biz.stats.totalReferralsSent, icon: MousePointerClick, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Referrals Received', value: biz.stats.totalReferralsRecv, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Network Revenue', value: `₦${biz.stats.attributedRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Completion Rate', value: biz.stats.completionRate, icon: CheckCircle2, color: 'text-amber-500', bg: 'bg-amber-50' },
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
                    {/* Active Offers Section */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-lg font-display font-bold text-text-main">Network Offers</h2>
                            <button className="text-xs font-black uppercase text-primary hover:underline">Create New</button>
                        </div>
                        <div className="p-6 space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-center justify-between group hover:bg-white hover:border-gray-200 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-primary">
                                            <Tag size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-text-main group-hover:text-primary transition-colors">15% Lunch Special</p>
                                            <p className="text-[10px] font-medium text-text-secondary mt-0.5 uppercase tracking-tighter">Active until June 30, 2026</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Views</p>
                                            <p className="font-bold text-text-main">1.2k</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Conv.</p>
                                            <p className="font-bold text-emerald-600">8.4%</p>
                                        </div>
                                        <button className="p-2 rounded-lg hover:bg-gray-100 transition-all">
                                            <MoreHorizontal size={16} className="text-text-secondary" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Attribution History */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50">
                            <h2 className="text-lg font-display font-bold text-text-main">Recent Attribution History</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Customer</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Source</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-sm">
                                    {[1, 2, 3].map(i => (
                                        <tr key={i}>
                                            <td className="px-6 py-4 font-bold text-text-main">John Doe</td>
                                            <td className="px-6 py-4 text-text-secondary font-medium italic">Fashion Hub</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase">Purchased</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-text-main">₦12,500</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Trust & Verification */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-text-main mb-6 flex items-center gap-2">
                            <ShieldCheck className="text-primary" size={18} />
                            Trust & Verification
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                <div className="flex gap-3">
                                    <ShieldCheck className="text-emerald-600 shrink-0" size={18} />
                                    <div>
                                        <p className="text-xs font-bold text-emerald-900">Verified Member</p>
                                        <p className="text-[10px] font-medium text-emerald-800/70 mt-1 leading-relaxed">
                                            This business has maintained a 0% fraud rate for over 90 days.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 space-y-3">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-text-secondary">Network Score</span>
                                    <span className="text-text-main">9.8 / 10</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-[98%]" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Communication Log */}
                    <div className="bg-text-main rounded-3xl p-8 text-white relative overflow-hidden group">
                        <h3 className="text-lg font-display font-bold mb-4">Notification Center</h3>
                        <div className="space-y-4 relative z-10">
                            {[
                                { msg: 'New offer approved', time: '2h ago', icon: CheckCircle2 },
                                { msg: 'Campaign budget reached 80%', time: '5h ago', icon: Activity },
                                { msg: 'Fraud alert cleared', time: '1d ago', icon: ShieldCheck },
                            ].map((log, i) => (
                                <div key={i} className="flex gap-3 items-start border-l-2 border-white/10 pl-4 py-1 hover:border-primary transition-colors">
                                    <div className="text-[10px] font-medium text-white/50">{log.time}</div>
                                    <p className="text-xs font-bold leading-tight">{log.msg}</p>
                                </div>
                            ))}
                        </div>
                        <button className="mt-8 w-full py-3 bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-white/20 transition-all">
                            View Message History
                        </button>
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                            <Bell size={120} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const Edit3 = ({ size, className }: { size: number, className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);
