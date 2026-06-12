'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Megaphone, Bell, Percent, Calendar, 
    Rocket, Edit3, ChevronRight, ArrowRight,
    Users, LayoutGrid, Target, Sparkles,
    Smartphone, MessageSquare, Mail, Send,
    Image as ImageIcon, FileDown, CheckCircle2,
    ShieldCheck, Clock, Globe
} from 'lucide-react';
import { useMessagingStore, CampaignType, MessagingChannel } from '@/store/useMessagingStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function StepCreateCampaign() {
    const { campaignData, updateCampaign, setStep } = useMessagingStore();

    const types: { id: CampaignType, label: string, desc: string, icon: any, color: string }[] = [
        { id: 'promotion', label: 'Promotion', desc: 'Drive sales with limited deals.', icon: Megaphone, color: 'bg-blue-50 text-[#066CF4]' },
        { id: 'announcement', label: 'Announcement', desc: 'Keep customers updated.', icon: Bell, color: 'bg-indigo-50 text-indigo-600' },
        { id: 'discount_offer', label: 'Discount Offer', desc: 'Reward your regulars.', icon: Percent, color: 'bg-emerald-50 text-emerald-600' },
        { id: 'event_invitation', label: 'Event Invitation', desc: 'Fill your calendar.', icon: Calendar, color: 'bg-amber-50 text-amber-600' },
        { id: 'product_launch', label: 'Product Launch', desc: 'Show off your new stock.', icon: Rocket, color: 'bg-rose-50 text-rose-600' },
        { id: 'custom', label: 'Custom Campaign', desc: 'Create from scratch.', icon: Edit3, color: 'bg-gray-50 text-gray-600' },
    ];

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-black text-gray-900 leading-tight">Create Campaign</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">What kind of campaign would you like to start?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {types.map((type) => (
                    <button
                        key={type.id}
                        onClick={() => {
                            updateCampaign({ type: type.id });
                            setStep(2);
                        }}
                        className={cn(
                            "group flex items-center gap-4 p-5 rounded-[32px] bg-white border transition-all hover:shadow-xl active:scale-[0.98]",
                            campaignData.type === type.id ? "border-[#066CF4] shadow-lg shadow-blue-500/5" : "border-gray-100 shadow-sm"
                        )}
                    >
                        <div className={cn("size-16 rounded-[22px] flex items-center justify-center shrink-0 shadow-sm transition-all group-hover:scale-110", type.color)}>
                            <type.icon size={28} />
                        </div>
                        <div className="text-left flex-1">
                            <h3 className="text-base font-bold text-gray-900">{type.label}</h3>
                            <p className="text-xs font-medium text-gray-400 mt-0.5">{type.desc}</p>
                        </div>
                        <ChevronRight size={18} className={cn("transition-all", campaignData.type === type.id ? "text-[#066CF4]" : "text-gray-200")} />
                    </button>
                ))}
            </div>

            <div className="space-y-4 pt-8 border-t border-gray-50">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Campaign Name</label>
                    <input 
                        type="text" 
                        value={campaignData.name}
                        onChange={(e) => updateCampaign({ name: e.target.value })}
                        placeholder="e.g. Weekend Flash Sale"
                        className="w-full h-14 rounded-2xl bg-gray-50 border-none px-6 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#066CF4]/10 transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Campaign Goal</label>
                    <select 
                        value={campaignData.goal}
                        onChange={(e) => updateCampaign({ goal: e.target.value })}
                        className="w-full px-6 h-14 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#066CF4]/10 outline-none font-bold text-sm appearance-none"
                    >
                        <option value="increase_visits">Increase Shop Visits</option>
                        <option value="drive_sales">Drive Direct Sales</option>
                        <option value="promote_product">Promote New Product</option>
                        <option value="customer_retention">Win Back Inactive Customers</option>
                        <option value="event_attendance">Fill Event Attendance</option>
                    </select>
                </div>
            </div>
            
            <div className="flex gap-4">
                <Button variant="ghost" className="h-14 flex-1 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400">Save Draft</Button>
                <Button 
                    onClick={() => setStep(2)}
                    disabled={!campaignData.name}
                    className="h-14 flex-[2] rounded-2xl bg-[#066CF4] text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                >
                    Continue to Audience
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export function StepSelectAudience() {
    const { audience, updateAudience, setStep } = useMessagingStore();

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-black text-gray-900 leading-tight">Select Audience</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">Who should receive this message?</p>
            </div>

            <div className="space-y-4">
                {[
                    { id: 'all', label: 'All Customers', count: 1250, icon: Users, color: 'text-blue-500' },
                    { id: 'segments', label: 'Smart Segments', count: 0, icon: LayoutGrid, color: 'text-purple-500' },
                    { id: 'custom', label: 'Custom Filter', count: 0, icon: Target, color: 'text-emerald-500' },
                ].map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => updateAudience({ type: opt.id as any })}
                        className={cn(
                            "w-full flex items-center justify-between p-6 rounded-[32px] bg-white border transition-all active:scale-[0.98]",
                            audience.type === opt.id ? "border-[#066CF4] shadow-xl bg-blue-50/10" : "border-gray-100 shadow-sm hover:border-gray-200"
                        )}
                    >
                        <div className="flex items-center gap-4 text-left">
                            <div className="size-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                                <opt.icon size={24} className={opt.color} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">{opt.label}</h3>
                                {opt.id === 'all' && <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Reach: {opt.count}</p>}
                            </div>
                        </div>
                        {audience.type === opt.id && <CheckCircle2 className="text-[#066CF4]" size={24} />}
                    </button>
                ))}
            </div>

            {/* Audience Preview Card */}
            <div className="rounded-[40px] bg-gray-900 p-8 text-white relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Live Reach</p>
                        <p className="text-4xl font-black">{audience.type === 'all' ? '1,250' : '0'}</p>
                    </div>
                    <div className="size-14 rounded-2xl bg-[#066CF4] flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Users size={28} />
                    </div>
                </div>
                <p className="text-xs font-medium text-white/50 leading-relaxed">
                    Estimated audience based on your current selection. High likelihood of 60%+ open rate.
                </p>
            </div>

            <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(1)} className="h-14 flex-1 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400">Back</Button>
                <Button 
                    onClick={() => setStep(3)}
                    className="h-14 flex-[2] rounded-2xl bg-[#066CF4] text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/20"
                >
                    Continue to Compose
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export function StepComposeMessage() {
    const { message, updateMessage, setStep } = useMessagingStore();

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-black text-gray-900 leading-tight">Compose Message</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">Create the content for your campaign.</p>
            </div>

            {/* Channel Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl overflow-x-auto no-scrollbar">
                {[
                    { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
                    { id: 'sms', label: 'SMS', icon: MessageSquare },
                    { id: 'email', label: 'Email', icon: Mail },
                    { id: 'push', label: 'Push', icon: Bell },
                ].map((ch) => (
                    <button
                        key={ch.id}
                        onClick={() => updateMessage({ channel: ch.id as any })}
                        className={cn(
                            "flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                            message.channel === ch.id ? "bg-white text-[#066CF4] shadow-sm" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        <ch.icon size={14} />
                        {ch.label}
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Message Body</label>
                    <div className="relative">
                        <textarea 
                            value={message.body}
                            onChange={(e) => updateMessage({ body: e.target.value })}
                            placeholder="Type your message here..."
                            className="w-full min-h-[160px] rounded-[32px] bg-white border border-gray-100 p-8 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#066CF4]/10 transition-all shadow-sm"
                        />
                        <div className="absolute bottom-6 right-8 flex gap-2">
                            <button className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:text-[#066CF4] transition-colors"><Sparkles size={16} /></button>
                            <button className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:text-[#066CF4] transition-colors"><ImageIcon size={16} /></button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <p className="w-full text-[9px] font-black uppercase tracking-widest text-gray-300 mb-1 ml-4">Variables</p>
                    {['CustomerName', 'BusinessName', 'OfferCode'].map(v => (
                        <button 
                            key={v}
                            onClick={() => updateMessage({ body: message.body + ` {{${v}}}` })}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#066CF4] text-[9px] font-black uppercase tracking-widest hover:bg-[#066CF4] hover:text-white transition-all"
                        >
                            +{v}
                        </button>
                    ))}
                </div>
            </div>

            {/* Live Mobile Preview */}
            <div className="relative mx-auto w-full max-w-[280px] aspect-[9/18] bg-gray-900 rounded-[3rem] border-[8px] border-gray-800 shadow-2xl overflow-hidden scale-90 origin-top">
                <div className="h-full w-full bg-white overflow-hidden flex flex-col">
                    <div className="h-14 bg-gray-50 border-b border-gray-100 flex items-center px-6 gap-3">
                        <div className="size-8 rounded-full bg-gray-200 shrink-0" />
                        <div className="w-20 h-2 bg-gray-200 rounded" />
                    </div>
                    <div className="flex-1 p-4">
                        <div className="max-w-[80%] rounded-2xl rounded-tl-none bg-[#066CF4] p-4 text-white">
                            <p className="text-[11px] font-medium leading-relaxed whitespace-pre-wrap">
                                {message.body || "Your message will appear here..."}
                            </p>
                            <span className="block mt-2 text-[8px] font-bold text-white/50 text-right">9:41 AM</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(2)} className="h-14 flex-1 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400">Back</Button>
                <Button 
                    onClick={() => setStep(4)}
                    className="h-14 flex-[2] rounded-2xl bg-[#066CF4] text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/20"
                >
                    Review Campaign
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export function StepReviewCampaign() {
    const { campaignData, audience, message, setStep } = useMessagingStore();

    return (
        <div className="space-y-8 pb-20">
            <div className="text-center">
                <h2 className="text-3xl font-black text-gray-900 leading-tight">Review Campaign</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">Almost ready! Please double check everything.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="p-6 rounded-[32px] bg-white border border-gray-100 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-blue-50 text-[#066CF4] flex items-center justify-center">
                            <Megaphone size={24} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Campaign</p>
                            <h3 className="text-base font-bold text-gray-900">{campaignData.name}</h3>
                        </div>
                    </div>
                    <button onClick={() => setStep(1)} className="text-[9px] font-black uppercase tracking-widest text-[#066CF4] opacity-0 group-hover:opacity-100 transition-all">Edit</button>
                </div>

                <div className="p-6 rounded-[32px] bg-white border border-gray-100 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Audience</p>
                            <h3 className="text-base font-bold text-gray-900">{audience.type === 'all' ? 'All Customers (1,250)' : 'Selected Audience'}</h3>
                        </div>
                    </div>
                    <button onClick={() => setStep(2)} className="text-[9px] font-black uppercase tracking-widest text-[#066CF4] opacity-0 group-hover:opacity-100 transition-all">Edit</button>
                </div>

                <div className="p-6 rounded-[32px] bg-white border border-gray-100 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Smartphone size={24} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Channel</p>
                            <h3 className="text-base font-bold text-gray-900 uppercase">{message.channel}</h3>
                        </div>
                    </div>
                    <button onClick={() => setStep(3)} className="text-[9px] font-black uppercase tracking-widest text-[#066CF4] opacity-0 group-hover:opacity-100 transition-all">Edit</button>
                </div>
            </div>

            {/* Delivery Estimate */}
            <div className="rounded-[40px] bg-gray-50 border border-gray-100 p-8">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 text-center">Delivery Estimate</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-lg font-black text-gray-900">1,250</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Reach</p>
                    </div>
                    <div className="border-x border-gray-200">
                        <p className="text-lg font-black text-gray-900">100%</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Trust</p>
                    </div>
                    <div>
                        <p className="text-lg font-black text-gray-900">~2m</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Time</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <Button 
                    onClick={() => setStep(5)}
                    className="h-16 rounded-2xl bg-[#066CF4] text-xs font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-blue-500/20 active:scale-95 transition-all"
                >
                    Launch Campaign Now
                    <Send className="ml-3 h-5 w-5" />
                </Button>
                <Button variant="ghost" className="h-12 text-[10px] font-black uppercase tracking-widest text-gray-400">Schedule For Later</Button>
            </div>
        </div>
    );
}

export function StepSendingCampaign() {
    const { resetStore } = useMessagingStore();
    const [progress, setProgress] = React.useState(0);
    const [isSuccess, setIsSuccess] = React.useState(false);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setIsSuccess(true), 500);
                    return 100;
                }
                return prev + 5;
            });
        }, 100);
        return () => clearInterval(interval);
    }, []);

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="relative mb-10">
                    <div className="size-32 rounded-[40px] bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/10">
                        <CheckCircle2 size={64} />
                    </div>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute -right-4 -top-4 text-emerald-400">
                        <Sparkles size={32} />
                    </motion.div>
                </div>
                <h2 className="text-4xl font-black text-gray-900 leading-tight mb-4">Campaign Sent Successfully 🎉</h2>
                <p className="text-lg font-medium text-gray-400 mb-12 max-w-xs">Your messages are being delivered to your audience right now.</p>
                
                <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
                    <Link href="/dashboard/messaging/reports">
                        <Button className="w-full h-16 rounded-2xl bg-[#066CF4] text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl">View Delivery Report</Button>
                    </Link>
                    <Button onClick={() => resetStore()} variant="outline" className="w-full h-14 rounded-2xl border-gray-100 font-black text-[10px] uppercase tracking-widest text-gray-400">Create Another Campaign</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative size-48 mb-12">
                <svg className="size-full" viewBox="0 0 100 100">
                    <circle className="text-gray-50" strokeWidth="8" stroke="currentColor" fill="transparent" r="44" cx="50" cy="50" />
                    <motion.circle 
                        className="text-[#066CF4]" 
                        strokeWidth="8" 
                        strokeDasharray={276.46}
                        strokeDashoffset={276.46 - (276.46 * progress) / 100}
                        strokeLinecap="round" 
                        stroke="currentColor" 
                        fill="transparent" 
                        r="44" 
                        cx="50" 
                        cy="50" 
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Send size={40} className="text-[#066CF4] animate-bounce" />
                    <span className="text-2xl font-black text-gray-900 mt-2">{progress}%</span>
                </div>
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">Sending Campaign</h2>
            <p className="text-sm font-medium text-gray-400 mb-10 uppercase tracking-widest">Delivering to 1,250 recipients...</p>
            
            <div className="grid grid-cols-3 gap-8 w-full max-w-sm">
                <div>
                    <p className="text-xl font-black text-gray-900">{Math.round(1250 * (progress/100))}</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Sent</p>
                </div>
                <div>
                    <p className="text-xl font-black text-gray-900">{1250 - Math.round(1250 * (progress/100))}</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Remaining</p>
                </div>
                <div>
                    <p className="text-xl font-black text-emerald-500">0</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Failed</p>
                </div>
            </div>
        </div>
    );
}
