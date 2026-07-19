"use client";

import React, { useState } from 'react';
import { 
    AutomationFlowVisual, 
    AutomationTriggerCard, 
    AutomationComposer, 
    AutomationPreview,
    AutomationActivateCard
} from '@/components/dashboard/automations/WelcomeAutomation';
import { RefreshCw, ArrowLeft, Save, Play, Pause, ChevronRight, Clock, Target, Gift } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PageGuideButton, AICopilotButton } from '@/components/ai';

export default function ReactivationAutomationPage() {
    const [inactivityDays, setInactivityDays] = useState('30 Days');
    const [channel, setChannel] = useState('whatsapp');
    const [body, setBody] = useState("Hi {{CustomerName}}! It's been a while since we saw you at {{BusinessName}}. We miss you! Come visit us this week and get a FREE dessert on the house. See you soon! Code: {{OfferCode}}");
    const [isActive, setIsActive] = useState(true);

    return (
        <div className="pb-32 md:pb-20 max-w-7xl mx-auto p-4 md:p-8">
            <Link href="/dashboard/automations" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#066CF4] transition-colors mb-6">
                <ArrowLeft size={14} />
                Back to Center
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-2"><h1 className="text-3xl font-black text-gray-900 leading-tight">Reactivation Automation</h1><PageGuideButton /><AICopilotButton /></div>
                    <p className="text-sm font-medium text-gray-500 mt-1">
                        Bring back inactive customers with personalized "We Miss You" offers.
                    </p>
                </div>
                
                <div className="flex items-center gap-4 p-2 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex flex-col items-end px-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Status</span>
                        <span className={cn("text-[10px] font-bold uppercase", isActive ? "text-emerald-500" : "text-amber-500")}>{isActive ? 'Active' : 'Paused'}</span>
                    </div>
                    <button 
                        onClick={() => setIsActive(!isActive)}
                        className={cn(
                            "h-10 w-20 rounded-2xl transition-all relative flex items-center px-1.5",
                            isActive ? "bg-emerald-500" : "bg-gray-100"
                        )}
                    >
                        <div className={cn(
                            "size-7 rounded-xl bg-white shadow-sm transition-all flex items-center justify-center text-gray-400",
                            isActive ? "translate-x-10 text-emerald-500" : "translate-x-0"
                        )}>
                            {isActive ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
                        </div>
                    </button>
                </div>
            </div>

            {/* FLOW VISUALIZATION */}
            <div className="rounded-[40px] bg-gray-50 border border-gray-100 p-12 mb-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-100 to-transparent" />
                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                    <div className="flex flex-col items-center gap-3">
                        <div className="size-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-rose-500">
                            <Clock size={28} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Inactive Detected</span>
                    </div>
                    <ArrowLeft className="hidden md:block text-gray-200 rotate-180" size={24} />
                    <div className="flex flex-col items-center gap-3">
                        <div className="size-16 rounded-2xl bg-rose-500 shadow-xl shadow-rose-500/20 flex items-center justify-center text-white">
                            <Gift size={28} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Win-back Offer</span>
                    </div>
                    <ArrowLeft className="hidden md:block text-gray-200 rotate-180" size={24} />
                    <div className="flex flex-col items-center gap-3">
                        <div className="size-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-500">
                            <Target size={28} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Customer Returns</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-8">
                    {/* INACTIVITY TRIGGER */}
                    <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Define Inactive Customer</h4>
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-6 leading-relaxed">Trigger message if customer hasn't visited for:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {['30 Days', '60 Days', '90 Days', '180 Days'].map((opt) => (
                                <button 
                                    key={opt}
                                    onClick={() => setInactivityDays(opt)}
                                    className={cn(
                                        "py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] border",
                                        inactivityDays === opt ? "bg-gray-900 text-white border-gray-900" : "bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100"
                                    )}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* COMPOSER */}
                    <div className="rounded-[40px] bg-white p-8 shadow-sm border border-gray-100">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8">Reactivation Message</h3>
                        <AutomationComposer 
                            channel={channel} 
                            setChannel={setChannel}
                            body={body}
                            setBody={setBody}
                        />
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-8">
                    <AutomationPreview body={body} channel={channel} />

                    {/* ESTIMATE CARD */}
                    <div className="rounded-[32px] bg-rose-50/50 border border-rose-100 p-8">
                        <h4 className="text-xs font-black uppercase tracking-widest text-rose-900 mb-6">Automation Estimate</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-rose-800/60">Eligible Customers</span>
                                <span className="text-lg font-black text-rose-900">890</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-rose-800/60">Potential Recoveries</span>
                                <span className="text-lg font-black text-rose-900">~145</span>
                            </div>
                        </div>
                    </div>

                    <AutomationActivateCard stats={{ sends: '890', reach: '100%' }} />
                </div>
            </div>
        </div>
    );
}
