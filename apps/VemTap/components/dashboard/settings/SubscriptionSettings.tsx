'use client';

import React from 'react';
import { CreditCard, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function SubscriptionSettingsView() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-[40px] bg-white p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Current Plan</h3>
                    <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px] uppercase px-3 py-1">Active</Badge>
                </div>
                
                <div className="flex items-center gap-6 mb-8">
                    <div className="size-20 rounded-3xl bg-blue-50 text-[#066CF4] flex items-center justify-center">
                        <Zap size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-gray-900">Gold Plan</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">₦15,000 / month</p>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    {['5,000 Customer Profiles', 'WhatsApp Automation', 'Full Analytics'].map(f => (
                        <div key={f} className="flex items-center gap-3 text-sm font-bold text-gray-700">
                            <CheckCircle2 size={18} className="text-emerald-500" />
                            {f}
                        </div>
                    ))}
                </div>

                <Button className="w-full h-16 rounded-2xl bg-gray-900 text-xs font-black uppercase tracking-widest text-white">
                    Upgrade Subscription
                </Button>
            </div>
        </div>
    );
}
