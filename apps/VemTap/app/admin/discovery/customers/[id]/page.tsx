'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    ChevronLeft, User, ShieldCheck, MapPin, 
    Calendar, Tag, TrendingUp, MousePointerClick,
    CheckCircle2, DollarSign, Clock, History,
    Ban, Bell, Smartphone, Mail, Info,
    UserCheck, ShoppingBag, Eye, Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdminCustomer } from '@/services/discovery/hooks';

export default function DiscoveryCustomerProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = React.useState<'overview' | 'visits' | 'offers' | 'referrals' | 'purchases'>('overview');

    const { data: cust, isLoading } = useAdminCustomer(id as string);

    if (isLoading || !cust) {
        return (
            <div className="p-8">
                <DiscoveryNav current="/admin/discovery/customers" />
                <div className="animate-pulse space-y-8 mt-8">
                    <div className="flex items-center gap-5">
                        <div className="size-24 rounded-[2.5rem] bg-gray-200" />
                        <div className="space-y-3">
                            <div className="h-8 w-48 bg-gray-200 rounded" />
                            <div className="h-4 w-64 bg-gray-200 rounded" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                                <div className="size-10 rounded-2xl bg-gray-200 mb-4" />
                                <div className="h-3 w-20 bg-gray-200 rounded mb-2" />
                                <div className="h-6 w-16 bg-gray-200 rounded" />
                            </div>
                        ))}
                    </div>
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
                <ChevronLeft size={16} /> Back to Customers
            </button>

            <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
                <div className="flex items-center gap-5">
                    <div className="size-24 rounded-[2.5rem] bg-primary text-white flex items-center justify-center text-4xl font-display font-black shadow-xl shadow-primary/20">
                        {cust.name.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-display font-bold text-text-main">{cust.name}</h1>
                            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                {cust.status}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 mt-3 text-sm font-medium text-text-secondary">
                            <span className="flex items-center gap-1.5"><Mail size={14} className="text-gray-400" /> {cust.email}</span>
                            <span className="flex items-center gap-1.5"><Smartphone size={14} className="text-gray-400" /> {cust.phone}</span>
                            <span className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-400" /> {cust.location}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="h-12 px-6 rounded-2xl border border-gray-200 bg-white text-text-main text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm">
                        <Ban size={16} /> Disable Promotions
                    </button>
                    <button className="h-12 px-8 rounded-2xl bg-text-main text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg active:scale-95">
                        Export User Data
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {[
                    { label: 'Network Visits', value: cust.stats.totalVisits, icon: UserCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Offers Received', value: cust.stats.offersReceived, icon: Tag, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Offers Redeemed', value: cust.stats.offersRedeemed, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Referral Chain', value: cust.stats.totalReferrals, icon: MousePointerClick, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Total Value', value: `₦${cust.stats.totalSpend.toLocaleString()}`, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/5' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                        <div className={`p-3 rounded-2xl w-fit mb-4 ${stat.bg} ${stat.color}`}>
                            <stat.icon size={20} strokeWidth={2.5} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{stat.label}</p>
                        <p className="text-xl font-display font-bold text-text-main mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Sub-navigation Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100/50 rounded-2xl w-fit mb-8 border border-gray-100">
                {(['overview', 'visits', 'offers', 'referrals', 'purchases'] as const).map((tab) => (
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

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">
                    {/* Activity Timeline Placeholder */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                        <h2 className="text-lg font-display font-bold text-text-main mb-8 flex items-center gap-2">
                            <History size={20} className="text-primary" />
                            Recent Network Activity
                        </h2>
                        <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                            {cust.activityTimeline.map((item, i) => (
                                <div key={i} className="relative pl-12">
                                    <div className="absolute left-0 size-10 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center z-10 group-hover:border-primary transition-colors">
                                        <div className="size-2 rounded-full bg-primary" />
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-black text-text-main">{item.action}</p>
                                            <p className="text-xs font-medium text-text-secondary mt-1">{item.via}</p>
                                            <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">{item.time}</p>
                                        </div>
                                        {item.val && <p className="text-sm font-black text-text-main">{item.val}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Discovery Consent Card */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-text-main mb-6 flex items-center gap-2">
                            <ShieldCheck className="text-emerald-500" size={18} />
                            Network Consent
                        </h3>
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                            <div className="flex gap-3">
                                <Info className="text-emerald-600 shrink-0" size={18} />
                                <div>
                                    <p className="text-xs font-bold text-emerald-900">Discovery Active</p>
                                    <p className="text-[10px] font-medium text-emerald-800/70 mt-1 leading-relaxed">
                                        User opted-in on {cust.optInDate} via QR scan.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 space-y-4">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-text-secondary">Loyalty Points</span>
                                <span className="text-primary font-black">1,450 pts</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-text-secondary">Trust Rating</span>
                                <span className="text-emerald-600">High</span>
                            </div>
                        </div>
                    </div>

                    {/* Preferences Card */}
                    <div className="bg-text-main rounded-3xl p-8 text-white relative overflow-hidden group">
                        <h3 className="text-lg font-display font-bold mb-4">Discovery Engine</h3>
                        <p className="text-white/60 text-xs font-medium leading-relaxed mb-6">
                            This user is most likely to convert on <span className="text-white font-bold">Afternoon Dining</span> and <span className="text-white font-bold">Boutique Retail</span> offers.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {cust.preferences.map(t => (
                                <span key={t} className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest">
                                    {t}
                                </span>
                            ))}
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                            <Target size={120} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
