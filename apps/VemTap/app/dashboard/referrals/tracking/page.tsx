"use client";

import React from 'react';
import { ArrowLeft, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PageGuideButton, AICopilotButton } from '@/components/ai';

export default function ReferralTrackingPage() {
    const referrals = [
        { id: '1', business: 'Blue Bottle Cafe', owner: 'John O.', date: 'Oct 24, 2024', status: 'Activated', comm: '₦15,000' },
        { id: '2', business: 'Urban Hair Salon', owner: 'Elena R.', date: 'Oct 22, 2024', status: 'Subscribed', comm: '₦45,000' },
        { id: '3', business: 'Fast Gym', owner: 'David W.', date: 'Oct 20, 2024', status: 'Registered', comm: '₦0' },
        { id: '4', business: 'TechGadget Store', owner: 'Mike K.', date: 'Oct 15, 2024', status: 'Invited', comm: '₦0' },
    ];

    return (
        <div className="pb-32 md:pb-20 max-w-5xl mx-auto p-4 md:p-8">
            <Link href="/dashboard/referrals" className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 hover:text-[#066CF4] transition-colors mb-6">
                <ArrowLeft size={14} />
                Back to Dashboard
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-2"><h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-tight">Referral Tracking</h1><PageGuideButton /><AICopilotButton /></div>
                    <p className="text-sm font-medium text-gray-500 mt-1">Monitor the journey of every business you&apos;ve referred.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="h-10 rounded-xl border-gray-100 font-semibold text-[10px] uppercase tracking-wider text-gray-400">
                        <Filter size={16} className="mr-2" /> Filter
                    </Button>
                </div>
            </div>

            {/* PIPELINE */}
            <div className="space-y-4">
                {referrals.map((ref) => (
                    <div key={ref.id} className="group p-5 md:p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-[#066CF4]/20 hover:shadow-lg transition-all">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-lg bg-blue-50 text-[#066CF4] flex items-center justify-center font-bold text-sm">
                                    {ref.business[0]}
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-gray-900">{ref.business}</h4>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{ref.owner} • {ref.date}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-8 px-4">
                                <Badge className={cn(
                                    "border-none font-semibold text-[8px] uppercase px-4 py-1.5",
                                    ref.status === 'Activated' || ref.status === 'Subscribed' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                )}>
                                    {ref.status}
                                </Badge>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{ref.comm}</p>
                                    <p className="text-[8px] font-semibold text-gray-400 uppercase tracking-wider">Comm.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
