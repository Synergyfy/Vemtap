'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Smartphone, MessageSquare, Mail, Bell, 
    ArrowRight, CheckCircle2, ShieldCheck, 
    Sparkles, Info, Play, Pause, Save,
    Clock, Database, Users, ChevronRight, Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AutomationFlowVisual({ type }: { type: string }) {
    return (
        <div className="rounded-[40px] bg-gray-50 border border-gray-100 p-8 md:p-12 mb-8">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 text-center mb-10">Workflow Visualization</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <div className="flex flex-col items-center gap-3">
                    <div className="size-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#066CF4]">
                        <Users size={28} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Registration</span>
                </div>
                <ArrowRight className="hidden md:block text-gray-200" size={24} />
                <div className="md:hidden size-1 h-8 bg-gray-100 rounded-full" />
                
                <div className="flex flex-col items-center gap-3">
                    <div className="size-16 rounded-2xl bg-[#066CF4] shadow-xl shadow-blue-500/20 flex items-center justify-center text-white">
                        <MessageSquare size={28} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Welcome Message</span>
                </div>
                <ArrowRight className="hidden md:block text-gray-200" size={24} />
                <div className="md:hidden size-1 h-8 bg-gray-100 rounded-full" />

                <div className="flex flex-col items-center gap-3">
                    <div className="size-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-500">
                        <Database size={28} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">CRM Entry</span>
                </div>
            </div>
        </div>
    );
}

export function AutomationTriggerCard({ title, desc, icon: Icon, value, onChange }: any) {
    return (
        <div className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-6">
                <div className="size-12 rounded-2xl bg-blue-50 text-[#066CF4] flex items-center justify-center">
                    <Icon size={24} />
                </div>
                <div>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">{title}</h4>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-0.5">{desc}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                {['Immediately', '5 Minutes', '1 Hour', '1 Day'].map((opt) => (
                    <button 
                        key={opt}
                        onClick={() => onChange(opt)}
                        className={cn(
                            "py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] border",
                            value === opt ? "bg-gray-900 text-white border-gray-900" : "bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100"
                        )}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}

export function AutomationComposer({ channel, setChannel, body, setBody }: any) {
    const channels = [
        { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone, color: 'text-green-500' },
        { id: 'sms', label: 'SMS', icon: MessageSquare, color: 'text-blue-500' },
        { id: 'email', label: 'Email', icon: Mail, color: 'text-indigo-500' },
    ];

    return (
        <div className="space-y-6">
            {/* Channel Selection */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl overflow-x-auto no-scrollbar">
                {channels.map((ch) => (
                    <button
                        key={ch.id}
                        onClick={() => setChannel(ch.id)}
                        className={cn(
                            "flex-1 min-w-[100px] flex items-center justify-center gap-2 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                            channel === ch.id ? "bg-white text-[#066CF4] shadow-sm" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        <ch.icon size={14} className={cn(channel === ch.id ? "text-[#066CF4]" : "text-gray-400")} />
                        {ch.label}
                    </button>
                ))}
            </div>

            {/* Message Body */}
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Message Body</label>
                <div className="relative">
                    <textarea 
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Welcome your new customer..."
                        className="w-full min-h-[160px] rounded-[32px] bg-white border border-gray-100 p-8 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#066CF4]/10 transition-all shadow-sm resize-none"
                    />
                    <div className="absolute bottom-6 right-8 flex gap-2">
                        <button className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:text-[#066CF4] transition-colors"><Sparkles size={16} /></button>
                    </div>
                </div>
            </div>

            {/* Variables */}
            <div className="flex flex-wrap gap-2">
                {['CustomerName', 'BusinessName', 'OfferCode'].map(v => (
                    <button 
                        key={v}
                        onClick={() => setBody(body + ` {{${v}}}`)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#066CF4] text-[9px] font-black uppercase tracking-widest hover:bg-[#066CF4] hover:text-white transition-all"
                    >
                        +{v}
                    </button>
                ))}
            </div>
        </div>
    );
}

export function AutomationPreview({ body, channel }: { body: string, channel: string }) {
    return (
        <div className="rounded-[40px] bg-white p-6 shadow-sm border border-gray-100">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-300 text-center mb-6">Live Mobile Preview</h4>
            <div className="relative mx-auto w-full max-w-[240px] aspect-[9/18.5] bg-gray-900 rounded-[3rem] border-[8px] border-gray-800 shadow-2xl overflow-hidden">
                <div className="h-full w-full bg-white flex flex-col">
                    <div className="h-12 bg-gray-50 border-b border-gray-100 flex items-center px-6 gap-3">
                        <div className="size-6 rounded-full bg-gray-200" />
                        <div className="w-16 h-1.5 bg-gray-200 rounded" />
                    </div>
                    <div className="flex-1 p-4">
                        <div className={cn(
                            "max-w-[85%] rounded-2xl rounded-tl-none p-4",
                            channel === 'whatsapp' ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-900"
                        )}>
                            <p className="text-[10px] font-medium leading-relaxed whitespace-pre-wrap">
                                {body || "Your welcome message will appear here..."}
                            </p>
                            <span className={cn("block mt-2 text-[7px] font-bold text-right opacity-40")}>9:41 AM</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function AutomationActivateCard({ stats }: { stats: any }) {
    return (
        <div className="rounded-[40px] bg-gray-900 p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#066CF4]/20 rounded-full blur-2xl -mr-16 -mt-16" />
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="size-10 rounded-xl bg-[#066CF4] flex items-center justify-center">
                        <Zap size={20} />
                    </div>
                    <h3 className="text-xl font-black">Ready to Activate</h3>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Estimated Monthly Sends</p>
                        <p className="text-3xl font-black">{stats.sends || '450'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Expected Growth Reach</p>
                        <p className="text-3xl font-black">{stats.reach || '92%'}</p>
                    </div>
                </div>

                <Button className="w-full h-16 rounded-2xl bg-[#066CF4] text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl hover:bg-[#4293FF] transition-all">
                    Activate Automation
                </Button>
                <p className="text-center text-[9px] font-black uppercase tracking-widest text-white/30 mt-4">Safe & Encrypted 24/7 Engine</p>
            </div>
        </div>
    );
}
