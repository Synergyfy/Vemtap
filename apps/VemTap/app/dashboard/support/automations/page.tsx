'use client';

import React, { useState } from 'react';
import { 
    Zap, 
    MessageSquare, 
    Timer, 
    Settings, 
    Save, 
    ArrowLeft,
    ChevronDown,
    Plus,
    Trash2,
    ToggleLeft,
    ToggleRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageGuideButton, AICopilotButton } from '@/components/ai';

export default function AutomatedRepliesPage() {
    const router = useRouter();
    
    const [welcomeEnabled, setWelcomeEnabled] = useState(true);
    const [welcomeMsg, setWelcomeMsg] = useState('Hi! Thank you for contacting Vemtap Support. How can we help you today?');
    
    const [offHoursEnabled, setOffHoursEnabled] = useState(false);
    const [offHoursMsg, setOffHoursMsg] = useState('Our team is currently offline. We will get back to you during our business hours (9 AM - 6 PM EST).');
    
    const [faqEnabled, setFaqEnabled] = useState(true);

    return (
        <div className="p-8 space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all text-slate-600"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2"><h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Automated Support Settings</h1><PageGuideButton /><AICopilotButton /></div>
                        <p className="text-slate-500 text-sm font-medium mt-1">Configure automated responses and AI behaviors for your support channels.</p>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20 active:scale-95">
                    <Save size={18} />
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 gap-8">
                
                {/* Welcome Message Card */}
                <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                                <MessageSquare size={20} />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-slate-900">Welcome Message</h3>
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Trigger: First contact of the day</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setWelcomeEnabled(!welcomeEnabled)}
                            className={`p-1 rounded-full transition-all ${welcomeEnabled ? 'text-amber-600' : 'text-slate-300'}`}
                        >
                            {welcomeEnabled ? <ToggleRight size={44} strokeWidth={1.5} /> : <ToggleLeft size={44} strokeWidth={1.5} />}
                        </button>
                    </div>
                    <div className="p-6">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Response Text</label>
                        <textarea 
                            value={welcomeMsg}
                            onChange={(e) => setWelcomeMsg(e.target.value)}
                            className="w-full h-32 p-4 bg-slate-50 border-none rounded-2xl text-sm text-slate-700 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
                            placeholder="Type your welcome message..."
                        />
                        <div className="mt-3 flex gap-2">
                            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 cursor-pointer hover:border-amber-300 transition-all">[Customer Name]</span>
                            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 cursor-pointer hover:border-amber-300 transition-all">[Business Name]</span>
                        </div>
                    </div>
                </div>

                {/* Off-Hours Card */}
                <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                                <Timer size={20} />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-slate-900">Off-Hours Response</h3>
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Trigger: Outside business hours</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setOffHoursEnabled(!offHoursEnabled)}
                            className={`p-1 rounded-full transition-all ${offHoursEnabled ? 'text-amber-600' : 'text-slate-300'}`}
                        >
                            {offHoursEnabled ? <ToggleRight size={44} strokeWidth={1.5} /> : <ToggleLeft size={44} strokeWidth={1.5} />}
                        </button>
                    </div>
                    <div className="p-6">
                        <div className="mb-6">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Active Schedule</label>
                            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-transparent">
                                <Timer size={18} className="text-slate-400" />
                                <span className="text-sm font-bold text-slate-700">Daily: 11:00 PM - 07:00 AM</span>
                                <button className="ml-auto text-amber-600 text-xs font-bold uppercase tracking-wider hover:text-amber-700">Edit Schedule</button>
                            </div>
                        </div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Response Text</label>
                        <textarea 
                            value={offHoursMsg}
                            onChange={(e) => setOffHoursMsg(e.target.value)}
                            className="w-full h-32 p-4 bg-slate-50 border-none rounded-2xl text-sm text-slate-700 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
                            placeholder="Type your off-hours message..."
                        />
                    </div>
                </div>

                {/* AI-Driven FAQ Card */}
                <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                                <Zap size={20} />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-slate-900">AI-Driven FAQ Agent</h3>
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Trigger: Natural language keywords</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setFaqEnabled(!faqEnabled)}
                            className={`p-1 rounded-full transition-all ${faqEnabled ? 'text-amber-600' : 'text-slate-300'}`}
                        >
                            {faqEnabled ? <ToggleRight size={44} strokeWidth={1.5} /> : <ToggleLeft size={44} strokeWidth={1.5} />}
                        </button>
                    </div>
                    
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Keyword Triggers & Responses</label>
                            <button className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-600 hover:text-amber-700 transition-all">
                                <Plus size={14} />
                                Add New Trigger
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {[
                                { keywords: ['refund', 'return', 'cancel'], response: 'Our refund policy allows for returns within 30 days...' },
                                { keywords: ['hours', 'opening', 'open'], response: 'We are open Monday to Friday, 9:00 AM to 6:00 PM.' }
                            ].map((faq, i) => (
                                <div key={i} className="p-5 border border-slate-100 rounded-3xl bg-slate-50/30 hover:border-amber-200 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-wrap gap-2">
                                            {faq.keywords.map(k => (
                                                <span key={k} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-wider">{k}</span>
                                            ))}
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <button className="p-2 text-slate-400 hover:text-amber-600 rounded-lg"><Settings size={16} /></button>
                                            <button className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed italic">{faq.response}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
