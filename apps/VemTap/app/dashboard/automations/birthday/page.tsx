"use client";

import React, { useState } from 'react';
import { 
    AutomationFlowVisual, 
    AutomationTriggerCard, 
    AutomationComposer, 
    AutomationPreview,
    AutomationActivateCard
} from '@/components/dashboard/automations/WelcomeAutomation';
import { Cake, ArrowLeft, Save, Play, Pause, Gift, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function BirthdayAutomationPage() {
    const [timing, setTiming] = useState('On Birthday');
    const [channel, setChannel] = useState('whatsapp');
    const [body, setBody] = useState("Happy Birthday {{CustomerName}}! 🎂 Celebrate your special day with us at {{BusinessName}}. Show this message to get a FREE coffee on us! Code: {{OfferCode}}");
    const [isActive, setIsActive] = useState(true);

    return (
        <div className="pb-32 md:pb-20 max-w-7xl mx-auto p-4 md:p-8">
            <Link href="/dashboard/automations" className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 hover:text-[#066CF4] transition-colors mb-6">
                <ArrowLeft size={14} />
                Back to Center
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-tight">Birthday Automation</h1>
                    <p className="text-sm font-medium text-gray-500 mt-1">
                        Automatically celebrate customer birthdays with rewards.
                    </p>
                </div>
                
                <div className="flex items-center gap-4 p-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex flex-col items-end px-2">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Status</span>
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
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-8 mb-8 flex flex-col items-center justify-center text-center">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex flex-col items-center gap-3">
                        <div className="size-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-purple-600">
                            <Cake size={22} />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-900">Birthday Detected</span>
                    </div>
                    <ArrowLeft className="hidden md:block text-gray-200 rotate-180" size={24} />
                    <div className="flex flex-col items-center gap-3">
                        <div className="size-12 rounded-xl bg-purple-600 shadow-md shadow-purple-500/20 flex items-center justify-center text-white">
                            <Gift size={22} />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-900">Special Reward</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-8">
                    {/* TRIGGER TIMING */}
                    <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm border border-gray-100">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-6">Send Timing</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {['7 Days Before', '3 Days Before', 'On Birthday', '1 Day After'].map((opt) => (
                                <button 
                                    key={opt}
                                    onClick={() => setTiming(opt)}
                                    className={cn(
                                        "py-4 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all active:scale-[0.98] border",
                                        timing === opt ? "bg-gray-900 text-white border-gray-900" : "bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100"
                                    )}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* COMPOSER */}
                    <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm border border-gray-100">
                        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-6">Birthday Message</h3>
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

                    {/* CUSTOMER EXAMPLE CARD */}
                    <div className="rounded-2xl bg-purple-50/50 border border-purple-100 p-5 md:p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="size-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-purple-600">
                                <Sparkles size={18} />
                            </div>
                            <h4 className="text-sm font-bold text-purple-900">Example Schedule</h4>
                        </div>
                        <div className="p-4 rounded-xl bg-white border border-purple-100">
                           <div className="flex items-center gap-3">
                              <div className="size-8 rounded-full bg-gray-100 shrink-0" />
                              <div>
                                 <p className="text-xs font-bold text-gray-900">John&apos;s birthday is tomorrow</p>
                                 <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Message scheduled</p>
                              </div>
                           </div>
                        </div>
                    </div>

                    <AutomationActivateCard stats={{ sends: '120', reach: '100%' }} />
                </div>
            </div>
        </div>
    );
}
