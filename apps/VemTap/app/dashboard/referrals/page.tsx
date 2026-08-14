"use client";

import React from 'react';
import { 
    ReferralOverviewHeader, 
    ReferralStatsCards, 
    ReferralHeroCard 
} from '@/components/dashboard/referrals/ReferralDashboard';
import { Button } from '@/components/ui/button';
import { Link, Zap, Wallet, Users, LayoutGrid, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import NextLink from 'next/link';

export default function ReferralsPage() {
    const quickActions = [
        { label: 'Copy Referral Link', icon: Link, href: '/dashboard/referrals/link', color: 'bg-blue-50 text-[#066CF4]' },
        { label: 'View Earnings', icon: Wallet, href: '/dashboard/referrals/earnings', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Referral Tracking', icon: Users, href: '/dashboard/referrals/tracking', color: 'bg-purple-50 text-purple-600' },
        { label: 'Request Payout', icon: Zap, href: '/dashboard/referrals/payouts', color: 'bg-amber-50 text-amber-600' },
        { label: 'Referral Resources', icon: FileText, href: '/dashboard/referrals/resources', color: 'bg-indigo-50 text-indigo-600' },
    ];

    return (
        <div className="pb-24 md:pb-10 max-w-5xl mx-auto p-4 md:p-8 space-y-12">
            {/* SCREEN 1: REFERRAL DASHBOARD */}
            
            <ReferralOverviewHeader />

            {/* EARNINGS OVERVIEW */}
            <ReferralStatsCards />
            
            {/* PERFORMANCE HERO */}
            <ReferralHeroCard />

            {/* QUICK ACTIONS */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider flex items-center gap-3">
                    Quick Actions
                    <span className="h-0.5 flex-1 bg-gray-100" />
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {quickActions.map((act, i) => (
                        <NextLink key={i} href={act.href} className="group h-full">
                            <div className="flex flex-col items-center text-center gap-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:border-[#066CF4]/20 hover:shadow-xl hover:shadow-black/5 active:scale-95 h-full">
                                <div className={cn("size-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform", act.color)}>
                                    <act.icon size={24} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-900 leading-tight">{act.label}</span>
                            </div>
                        </NextLink>
                    ))}
                </div>
            </div>

            {/* RECENT ACTIVITY */}
            <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-8">Recent Activity</h3>
                <div className="text-center py-12 text-gray-400 font-bold uppercase tracking-wider text-xs">
                    No recent referral activity. Share your link to get started!
                </div>
            </div>
        </div>
    );
}
