'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Users, Building, Wallet, Clock, 
    CheckCircle2, Bell, HelpCircle, ArrowUpRight,
    ArrowRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useReferralStore } from '@/store/useReferralStore';
import Link from 'next/link';

export function ReferralOverviewHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900 leading-tight">Referrals & Commissions</h1>
                <p className="text-sm font-medium text-gray-500 mt-1">
                    Grow Vemtap and earn rewards for every business you refer.
                </p>
            </div>
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 relative">
                    <Bell size={22} className="text-gray-600" />
                    <div className="absolute top-2 right-2 size-2 bg-[#066CF4] rounded-full border-2 border-white" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                    <HelpCircle size={22} className="text-gray-600" />
                </Button>
            </div>
        </div>
    );
}

export function ReferralStatsCards() {
    const { stats } = useReferralStore();
    const data = [
        { label: 'Total Referrals', value: stats.referrals, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Active Businesses', value: stats.active, icon: Building, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Total Earnings', value: `₦${stats.earnings.total.toLocaleString()}`, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Pending', value: `₦${stats.earnings.pending.toLocaleString()}`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Paid', value: `₦${stats.earnings.paid.toLocaleString()}`, icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    return (
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {data.map((stat, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="min-w-[180px] md:flex-1 rounded-[32px] bg-white p-6 shadow-sm border border-gray-100 group hover:border-[#066CF4]/20 transition-all"
                >
                    <div className={cn("size-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm", stat.bg)}>
                        <stat.icon size={24} className={stat.color} />
                    </div>
                    <div className="text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</div>
                </motion.div>
            ))}
        </div>
    );
}

export function ReferralHeroCard() {
    const { partnerLevel } = useReferralStore();
    return (
        <div className="rounded-[40px] bg-gradient-to-br from-[#066CF4] to-[#4293FF] p-10 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                    <h2 className="text-3xl font-black leading-tight mb-2">Your Referral Business Is Growing</h2>
                    <p className="text-sm font-medium text-white/70">You're currently a <span className="font-black uppercase tracking-widest">{partnerLevel}</span> level partner.</p>
                </div>
                <Button className="h-16 px-10 rounded-2xl bg-white text-[#066CF4] font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-50 active:scale-95 transition-all shadow-xl">
                    Invite More Businesses <ArrowRight size={18} className="ml-2" />
                </Button>
            </div>
        </div>
    );
}
