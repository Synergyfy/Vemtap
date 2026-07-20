"use client";

import React, { useState } from 'react';
import { ArrowLeft, Wallet, Building2, ChevronDown, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useReferralStore } from '@/store/useReferralStore';
import toast from 'react-hot-toast';
import { PageGuideButton, AICopilotButton } from '@/components/ai';

export default function PayoutsPage() {
    const { stats, requestPayout } = useReferralStore();
    const [isRequesting, setIsRequesting] = useState(false);

    const payoutHistory = [
        { id: '1', date: 'Oct 01, 2024', amount: '₦100,000', method: 'Bank Transfer', status: 'Paid' },
        { id: '2', date: 'Sep 01, 2024', amount: '₦50,000', method: 'Bank Transfer', status: 'Paid' },
    ];

    const handleRequest = () => {
        setIsRequesting(true);
        setTimeout(() => {
            setIsRequesting(false);
            requestPayout(stats.earnings.pending);
            toast.success('Payout request submitted!');
        }, 1500);
    };

    return (
        <div className="pb-32 md:pb-20 max-w-5xl mx-auto p-4 md:p-8">
            <Link href="/dashboard/referrals" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#066CF4] transition-colors mb-6">
                <ArrowLeft size={14} />
                Back to Dashboard
            </Link>

            <div className="flex items-center gap-2 mb-8"><h1 className="text-3xl font-black text-gray-900 leading-tight">Payouts</h1><PageGuideButton /><AICopilotButton /></div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* PAYOUT CARD */}
                <div className="lg:col-span-2 rounded-[40px] bg-gray-900 p-10 text-white shadow-2xl">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-2">Available Balance</h3>
                    <p className="text-5xl font-black mb-8">₦{stats.earnings.pending.toLocaleString()}</p>
                    
                    <Button 
                        onClick={handleRequest}
                        disabled={isRequesting || stats.earnings.pending === 0}
                        className="h-16 w-full rounded-2xl bg-[#066CF4] text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        {isRequesting ? 'Processing...' : 'Request Payout'}
                    </Button>
                    <p className="text-center text-[9px] font-black uppercase tracking-widest text-white/20 mt-4">Next Payout: Nov 01, 2024</p>
                </div>

                {/* METHOD */}
                <div className="rounded-[40px] bg-white p-8 border border-gray-100 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Payout Method</h3>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 mb-4">
                        <div className="size-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-gray-900">GTBank •••• 4582</p>
                            <p className="text-[10px] font-bold text-gray-400">Account Ending 4582</p>
                        </div>
                    </div>
                    <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-[#066CF4]">Change Method</Button>
                </div>
            </div>

            {/* HISTORY */}
            <div className="mt-12 rounded-[40px] bg-white p-8 shadow-sm border border-gray-100">
                <h3 className="text-xl font-black text-gray-900 mb-8">Payout History</h3>
                <div className="space-y-4">
                    {payoutHistory.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-6 rounded-3xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <CheckCircle2 size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-900">{p.method}</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.date}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-gray-900">{p.amount}</p>
                                <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[8px] uppercase px-3 py-1">Paid</Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
