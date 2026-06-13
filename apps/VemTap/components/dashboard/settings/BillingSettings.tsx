'use client';

import React from 'react';
import { CreditCard, History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function BillingSettingsView() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-[40px] bg-white p-8 shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8">Payment Methods</h3>
                <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#066CF4]">
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-gray-900">•••• •••• •••• 4582</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expires 12/26</p>
                        </div>
                    </div>
                    <Button variant="outline" className="rounded-xl border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">Edit</Button>
                </div>
            </div>

            <div className="rounded-[40px] bg-white p-8 shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8">Billing History</h3>
                <div className="space-y-4">
                    {[
                        { date: 'Oct 01, 2024', amt: '₦15,000', status: 'Paid' },
                        { date: 'Sep 01, 2024', amt: '₦15,000', status: 'Paid' },
                    ].map((bill, i) => (
                        <div key={i} className="flex items-center justify-between p-6 rounded-3xl bg-gray-50 border border-gray-100">
                            <div>
                                <p className="text-xs font-black text-gray-900">{bill.date}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subscription Payment</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-gray-900">{bill.amt}</p>
                                <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase px-2">{bill.status}</Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
