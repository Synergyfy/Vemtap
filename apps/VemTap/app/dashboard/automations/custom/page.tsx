"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Zap, Users, ShoppingBag, 
    MessageSquare, Mail, Smartphone, ArrowRight,
    ArrowLeft, ChevronRight, CheckCircle2, LayoutGrid,
    Target, Clock, Star, Save, Play, Palette, Bell
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const triggers = [
    { id: 'registration', label: 'Customer Registers', icon: Users, color: 'text-blue-500' },
    { id: 'visit', label: 'Customer Visits', icon: Smartphone, color: 'text-purple-500' },
    { id: 'order', label: 'Customer Orders', icon: ShoppingBag, color: 'text-emerald-500' },
    { id: 'qr_scan', label: 'QR Scan Detected', icon: Zap, color: 'text-amber-500' },
];

const actions = [
    { id: 'send_whatsapp', label: 'Send WhatsApp', icon: Smartphone, color: 'text-green-500' },
    { id: 'send_sms', label: 'Send SMS', icon: MessageSquare, color: 'text-blue-500' },
    { id: 'add_tag', label: 'Add VIP Tag', icon: Star, color: 'text-amber-500' },
    { id: 'assign_segment', label: 'Assign Segment', icon: LayoutGrid, color: 'text-purple-500' },
];

export default function CustomAutomationBuilderPage() {
    const [step, setStep] = useState(1);
    const [workflow, setWorkflow] = useState<any>({
        name: 'My New Workflow',
        trigger: null,
        actions: [],
        delay: 'Immediately'
    });

    return (
        <div className="pb-32 md:pb-20 max-w-5xl mx-auto p-4 md:p-8">
            <Link href="/dashboard/automations" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#066CF4] transition-colors mb-6">
                <ArrowLeft size={14} />
                Back to Center
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-4">
                    <div className="size-14 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-xl">
                        <Edit3 size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 leading-tight">{workflow.name}</h1>
                        <p className="text-sm font-medium text-gray-500">Visual Workflow Builder</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-12 px-6 rounded-xl border-gray-100 font-black text-[10px] uppercase tracking-widest text-gray-400">Save Draft</Button>
                    <Button className="h-12 px-6 rounded-xl bg-[#066CF4] font-black text-[10px] uppercase tracking-widest text-white shadow-xl shadow-blue-500/20">Activate Flow</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* LEFT COLUMN: VISUAL BUILDER */}
                <div className="lg:col-span-7 space-y-12 relative">
                    <div className="absolute left-[39px] top-10 bottom-10 w-1 bg-gray-50" />

                    {/* STEP 1: TRIGGER */}
                    <div className="relative z-10 flex gap-8">
                        <div className="size-20 rounded-[28px] bg-white border-4 border-white shadow-xl flex items-center justify-center shrink-0">
                            <div className="size-14 rounded-2xl bg-blue-50 text-[#066CF4] flex items-center justify-center">
                                <Zap size={28} />
                            </div>
                        </div>
                        <div className="flex-1 pt-2">
                           <Badge className="bg-blue-50 text-[#066CF4] border-none font-black text-[9px] uppercase mb-2">Step 01: Trigger</Badge>
                           <div className="p-8 rounded-[40px] bg-white border border-gray-100 shadow-sm">
                              <h3 className="text-lg font-black text-gray-900 mb-6">When this happens...</h3>
                              <div className="grid grid-cols-2 gap-3">
                                 {triggers.map((t) => (
                                    <button 
                                        key={t.id}
                                        onClick={() => setWorkflow({...workflow, trigger: t.id})}
                                        className={cn(
                                            "flex flex-col items-center gap-3 p-6 rounded-3xl border transition-all active:scale-[0.98]",
                                            workflow.trigger === t.id ? "bg-blue-50/50 border-[#066CF4]" : "bg-gray-50 border-transparent hover:bg-gray-100"
                                        )}
                                    >
                                       <t.icon size={24} className={workflow.trigger === t.id ? 'text-[#066CF4]' : 'text-gray-400'} />
                                       <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-tight">{t.label}</span>
                                    </button>
                                 ))}
                              </div>
                           </div>
                        </div>
                    </div>

                    {/* STEP 2: DELAY */}
                    <div className="relative z-10 flex gap-8">
                        <div className="size-20 rounded-[28px] bg-white border-4 border-white shadow-xl flex items-center justify-center shrink-0">
                            <div className="size-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Clock size={28} />
                            </div>
                        </div>
                        <div className="flex-1 pt-2">
                           <Badge className="bg-amber-50 text-amber-600 border-none font-black text-[9px] uppercase mb-2">Step 02: Delay</Badge>
                           <div className="p-8 rounded-[40px] bg-white border border-gray-100 shadow-sm">
                              <h3 className="text-lg font-black text-gray-900 mb-6">Then wait for...</h3>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                 {['Instant', '1 Hour', '1 Day', '7 Days'].map(d => (
                                    <button 
                                        key={d}
                                        onClick={() => setWorkflow({...workflow, delay: d})}
                                        className={cn(
                                            "py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all",
                                            workflow.delay === d ? "bg-gray-900 text-white border-gray-900" : "bg-gray-50 text-gray-400 border-transparent"
                                        )}
                                    >{d}</button>
                                 ))}
                              </div>
                           </div>
                        </div>
                    </div>

                    {/* STEP 3: ACTION */}
                    <div className="relative z-10 flex gap-8">
                        <div className="size-20 rounded-[28px] bg-white border-4 border-white shadow-xl flex items-center justify-center shrink-0">
                            <div className="size-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Play size={28} />
                            </div>
                        </div>
                        <div className="flex-1 pt-2">
                           <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase mb-2">Step 03: Action</Badge>
                           <div className="p-8 rounded-[40px] bg-white border border-gray-100 shadow-sm">
                              <h3 className="text-lg font-black text-gray-900 mb-6">Do this automatically...</h3>
                              <div className="grid grid-cols-1 gap-3">
                                 {actions.map((a) => (
                                    <button 
                                        key={a.id}
                                        className="flex items-center justify-between p-5 rounded-[24px] bg-gray-50 hover:bg-gray-100 transition-all text-left"
                                    >
                                       <div className="flex items-center gap-4">
                                          <div className="size-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                                             <a.icon size={20} className={a.color} />
                                          </div>
                                          <span className="text-xs font-black text-gray-900 uppercase tracking-widest">{a.label}</span>
                                       </div>
                                       <Plus size={16} className="text-gray-300" />
                                    </button>
                                 ))}
                              </div>
                           </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: WORKFLOW PREVIEW */}
                <div className="lg:col-span-5 space-y-8">
                    <div className="sticky top-24">
                        <div className="rounded-[40px] bg-gray-900 p-10 text-white shadow-2xl">
                           <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/30 mb-8">Workflow Preview</h3>
                           <div className="space-y-6">
                              <div className="flex items-start gap-4">
                                 <div className="size-8 rounded-xl bg-blue-500/20 text-[#066CF4] flex items-center justify-center shrink-0 mt-1">
                                    <Zap size={16} />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Trigger</p>
                                    <p className="text-sm font-bold">{workflow.trigger ? `Customer ${workflow.trigger}` : 'Not selected'}</p>
                                 </div>
                              </div>
                              <div className="ml-4 h-8 w-0.5 bg-white/10" />
                              <div className="flex items-start gap-4">
                                 <div className="size-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-1">
                                    <Clock size={16} />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Wait Period</p>
                                    <p className="text-sm font-bold">{workflow.delay}</p>
                                 </div>
                              </div>
                              <div className="ml-4 h-8 w-0.5 bg-white/10" />
                              <div className="flex items-start gap-4">
                                 <div className="size-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 mt-1">
                                    <Play size={16} />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Action</p>
                                    <p className="text-sm font-bold">Configure in step 3</p>
                                 </div>
                              </div>
                           </div>

                           <div className="mt-12 pt-10 border-t border-white/10 text-center">
                              <Button className="w-full h-16 rounded-2xl bg-[#066CF4] text-xs font-black uppercase tracking-[0.2em] text-white">Activate Workflow</Button>
                              <p className="mt-4 text-[9px] font-black uppercase tracking-widest text-white/20">Runs automatically 24/7</p>
                           </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Edit3({ size, className }: any) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
}
