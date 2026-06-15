"use client";

import React from 'react';
import { ArrowLeft, Wallet, TrendingUp, BarChart3, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useReferralStore } from '@/store/useReferralStore';

export default function EarningsPage() {
    const { stats } = useReferralStore();
    
    const earnings = [
        { id: '1', business: 'Blue Bottle Cafe', date: 'Oct 24, 2024', amount: '₦15,000', status: 'Approved' },
        { id: '2', business: 'Urban Hair Salon', date: 'Oct 22, 2024', amount: '₦45,000', status: 'Paid' },
        { id: '3', business: 'Corner Bookstore', date: 'Oct 18, 2024', amount: '₦10,000', status: 'Pending' },
    ];

    return (
        <div className="pb-32 md:pb-20 max-w-5xl mx-auto p-4 md:p-8">
            <Link href="/dashboard/referrals" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#066CF4] transition-colors mb-6">
                <ArrowLeft size={14} />
                Back to Dashboard
            </Link>

            <h1 className="text-3xl font-black text-gray-900 leading-tight mb-8">Commission Earnings</h1>

            {/* EARNINGS SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                {[
                    { label: 'Total Approved', value: `₦${stats.earnings.total.toLocaleString()}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Pending Payout', value: `₦${stats.earnings.pending.toLocaleString()}`, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Total Paid', value: `₦${stats.earnings.paid.toLocaleString()}`, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((stat, i) => (
                    <div key={i} className="p-8 rounded-[32px] bg-white border border-gray-100 shadow-sm">
                        <div className={cn("size-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm", stat.bg)}>
                            <Wallet size={24} className={stat.color} />
                        </div>
                        <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* EARNINGS LIST */}
            <div className="rounded-[40px] bg-white p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-gray-900">Commission Ledger</h3>
                    <Button variant="outline" className="rounded-xl border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                       Last 3 Months <ChevronDown size={14} className="ml-2" />
                    </Button>
                </div>

                <div className="space-y-4">
                    {earnings.map((e) => (
                        <div key={e.id} className="flex items-center justify-between p-6 rounded-3xl bg-gray-50 border border-gray-100">
                            <div>
                                <h4 className="text-sm font-black text-gray-900">{e.business}</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{e.date}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-gray-900">{e.amount}</p>
                                <Badge className={cn(
                                    "border-none font-black text-[8px] uppercase px-3 py-1",
                                    e.status === 'Paid' ? "bg-emerald-50 text-emerald-600" :
                                    e.status === 'Approved' ? "bg-blue-50 text-[#066CF4]" : "bg-amber-50 text-amber-600"
                                )}>
                                    {e.status}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
