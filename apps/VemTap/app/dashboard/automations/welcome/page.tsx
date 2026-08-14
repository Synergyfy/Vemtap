"use client";

import React, { useState } from 'react';
import { 
    AutomationFlowVisual, 
    AutomationTriggerCard, 
    AutomationComposer, 
    AutomationPreview,
    AutomationActivateCard
} from '@/components/dashboard/automations/WelcomeAutomation';
import { Users, ArrowLeft, Save, Play, Pause, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PageGuideButton, AICopilotButton } from '@/components/ai';

export default function WelcomeAutomationPage() {
    const [timing, setTiming] = useState('Immediately');
    const [channel, setChannel] = useState('whatsapp');
    const [body, setBody] = useState("Hi {{CustomerName}}! Welcome to {{BusinessName}}. We're so glad to have you! Use code {{OfferCode}} for a 10% discount on your next visit. See you soon!");
    const [isActive, setIsActive] = useState(true);

    return (
        <div className="pb-32 md:pb-20 max-w-7xl mx-auto p-4 md:p-8">
            <Link href="/dashboard/automations" className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 hover:text-[#066CF4] transition-colors mb-6">
                <ArrowLeft size={14} />
                Back to Center
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-2"><h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-tight">Welcome Automation</h1><PageGuideButton /><AICopilotButton /></div>
                    <p className="text-sm font-medium text-gray-500 mt-1">
                        Automatically greet every new customer who registers.
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
            <AutomationFlowVisual type="welcome" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: Settings */}
                <div className="lg:col-span-7 space-y-8">
                    {/* TRIGGER SETTINGS */}
                    <AutomationTriggerCard 
                        title="Trigger Timing"
                        desc="When should the message be sent?"
                        icon={Users}
                        value={timing}
                        onChange={setTiming}
                    />

                    {/* CHANNEL & COMPOSER */}
                    <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm border border-gray-100">
                        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-6">Compose Welcome Message</h3>
                        <AutomationComposer 
                            channel={channel} 
                            setChannel={setChannel}
                            body={body}
                            setBody={setBody}
                        />
                    </div>

                    {/* DISCOUNT SECTION MOCK */}
                    <div className="rounded-2xl bg-emerald-50/50 border border-emerald-100 p-5 md:p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                                <Badge className="bg-emerald-100 text-emerald-600 border-none font-bold text-[10px]">%</Badge>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">Welcome Discount</h4>
                                <p className="text-[10px] font-medium text-gray-500 tracking-wider mt-0.5">Include a coupon in the first message.</p>
                            </div>
                        </div>
                        <button className="h-9 px-5 rounded-xl bg-emerald-600 text-white text-[9px] font-semibold uppercase tracking-wider active:scale-95 transition-all">Enabled</button>
                    </div>
                </div>

                {/* RIGHT COLUMN: Preview & Activation */}
                <div className="lg:col-span-5 space-y-8">
                    <AutomationPreview body={body} channel={channel} />
                    
                    <AutomationActivateCard stats={{ sends: '450', reach: '92%' }} />
                    
                    <Button variant="ghost" className="w-full h-10 text-[10px] font-semibold uppercase tracking-wider text-gray-400 hover:text-[#066CF4]">
                        <Save size={16} className="mr-2" />
                        Save Changes Without Activating
                    </Button>
                </div>
            </div>
        </div>
    );
}
