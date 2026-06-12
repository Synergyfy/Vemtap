'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Phone, Mail, MessageSquare, Calendar, 
    ChevronRight, MapPin, Star, Clock, 
    ShoppingBag, Info, User, Tag, Edit3,
    ArrowRight, CheckCircle2, ShieldCheck,
    MoreHorizontal, Smartphone, MoreVertical, Send
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CRMProfileHeader({ customer }: { customer: any }) {
    const quickActions = [
        { icon: Phone, label: 'Call', color: 'bg-blue-50 text-blue-600' },
        { icon: MessageSquare, label: 'SMS', color: 'bg-purple-50 text-purple-600' },
        { icon: Mail, label: 'Email', color: 'bg-emerald-50 text-emerald-600' },
        { icon: Smartphone, label: 'WhatsApp', color: 'bg-green-50 text-green-600' },
    ];

    return (
        <div className="rounded-[48px] bg-white p-8 md:p-10 shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-32 -mt-32" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Avatar */}
                <div className="size-32 rounded-[40px] bg-[#066CF4]/10 text-[#066CF4] flex items-center justify-center font-black text-5xl italic shadow-2xl border-[6px] border-white shrink-0">
                    {customer.name?.[0] || 'C'}
                </div>

                {/* Name & Basic Info */}
                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2 justify-center md:justify-start">
                        <h1 className="text-4xl font-black text-gray-900">{customer.name || 'Anonymous'}</h1>
                        <Badge className="bg-amber-100 text-amber-600 border-none font-black text-[10px] uppercase px-3 py-1 w-fit mx-auto md:mx-0">
                            VIP Customer
                        </Badge>
                    </div>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-sm font-medium text-gray-400">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            Joined Oct 12, 2024
                        </div>
                        <div className="hidden md:block size-1 rounded-full bg-gray-200" />
                        <div className="flex items-center gap-1.5">
                            <MapPin size={14} />
                            Victoria Island, Lagos
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-3">
                        {quickActions.map((act) => (
                            <button key={act.label} className={cn("size-14 rounded-2xl flex items-center justify-center shadow-sm transition-all hover:scale-110 active:scale-95", act.color)}>
                                <act.icon size={22} />
                            </button>
                        ))}
                        <Button variant="outline" className="size-14 rounded-2xl border-gray-100 bg-white shadow-sm flex items-center justify-center hover:bg-gray-50">
                            <MoreVertical size={22} className="text-gray-400" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function CRMProfileDataCards({ customer }: { customer: any }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Contact Information */}
            <div className="rounded-[40px] bg-white p-8 shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Contact Details</h3>
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                            <Phone size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Phone</p>
                            <p className="text-sm font-bold text-gray-700">+234 801 234 5678</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                            <Mail size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Email</p>
                            <p className="text-sm font-bold text-gray-700">sarah.j@example.com</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Birthday</p>
                            <p className="text-sm font-bold text-gray-700">June 24, 1995</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Business Metrics */}
            <div className="rounded-[40px] bg-white p-8 shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Customer Metrics</h3>
                <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 rounded-3xl bg-blue-50/50 border border-blue-50 text-center">
                        <p className="text-2xl font-black text-[#066CF4]">24</p>
                        <p className="text-[9px] font-black text-[#066CF4] uppercase tracking-widest mt-1">Total Visits</p>
                    </div>
                    <div className="p-4 rounded-3xl bg-emerald-50/50 border border-emerald-50 text-center">
                        <p className="text-2xl font-black text-emerald-600">8</p>
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">Total Orders</p>
                    </div>
                    <div className="p-4 rounded-3xl bg-purple-50/50 border border-purple-50 text-center">
                        <p className="text-2xl font-black text-purple-600">12</p>
                        <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mt-1">Campaigns</p>
                    </div>
                    <div className="p-4 rounded-3xl bg-rose-50/50 border border-rose-50 text-center">
                        <p className="text-2xl font-black text-rose-600">2d</p>
                        <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mt-1">Last Seen</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function CRMProfileTabs() {
    const [activeTab, setActiveTab] = useState('overview');
    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'visits', label: 'Visits' },
        { id: 'orders', label: 'Orders' },
        { id: 'messages', label: 'Messages' },
        { id: 'activity', label: 'Activity' },
    ];

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === tab.id 
                                ? "bg-gray-900 text-white shadow-xl" 
                                : "bg-white text-gray-400 border border-gray-100 hover:bg-gray-50"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content Area */}
            <div className="rounded-[40px] bg-white p-8 md:p-10 shadow-sm border border-gray-100 min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'overview' && <div className="space-y-8">
                            <div>
                                <h4 className="text-xl font-black text-gray-900 mb-2">Customer Value Score</h4>
                                <div className="flex items-center gap-6">
                                    <div className="text-5xl font-black text-[#066CF4]">9.4</div>
                                    <div className="flex-1 max-w-xs h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full w-[94%] bg-[#066CF4]" />
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-gray-400 mt-4 leading-relaxed">
                                    Sarah is in the top 5% of your customers. High likelihood of repeat purchase.
                                </p>
                            </div>
                            
                            <hr className="border-gray-50" />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Loyalty Tags</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {['Frequent Visitor', 'Coffee Lover', 'Weekend Regular'].map(tag => (
                                            <Badge key={tag} className="bg-blue-50 text-[#066CF4] border-none font-black text-[9px] uppercase px-3 py-1.5 rounded-xl">
                                                {tag}
                                            </Badge>
                                        ))}
                                        <button className="px-3 py-1.5 rounded-xl bg-gray-50 text-gray-400 text-[9px] font-black uppercase tracking-widest border border-dashed border-gray-200">
                                            + Add Tag
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Internal Notes</h4>
                                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                                        <p className="text-xs font-medium text-amber-900 leading-relaxed italic">
                                            "Prefers oat milk in her latte. Always visits on Saturdays before noon."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>}

                        {activeTab === 'visits' && <div className="space-y-6">
                            {[
                                { loc: 'Main Entrance QR', branch: 'Victoria Island', time: 'Oct 24, 2:15 PM', icon: MapPin },
                                { loc: 'NFC Table 4', branch: 'Victoria Island', time: 'Oct 20, 11:30 AM', icon: Smartphone },
                                { loc: 'Promotion Flyer', branch: 'Online', time: 'Oct 15, 9:00 PM', icon: Star },
                            ].map((v, i) => (
                                <div key={i} className="flex items-center gap-4 p-5 rounded-3xl bg-gray-50 border border-gray-100 group hover:bg-white transition-all">
                                    <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#066CF4]">
                                        <v.icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-black text-gray-900">{v.loc}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{v.branch}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-900">{v.time}</p>
                                        <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Verified</p>
                                    </div>
                                </div>
                            ))}
                        </div>}

                        {activeTab === 'orders' && <div className="space-y-6">
                            {[
                                { id: 'ORD-8821', items: 'Caramel Macchiato, Blueberry Muffin', total: '₦4,500', date: 'Oct 24, 2024', status: 'Completed' },
                                { id: 'ORD-8754', items: 'Oat Milk Latte, Avocado Toast', total: '₦6,200', date: 'Oct 20, 2024', status: 'Completed' },
                                { id: 'ORD-8612', items: 'Cold Brew, Chocolate Croissant', total: '₦3,800', date: 'Oct 15, 2024', status: 'Completed' },
                            ].map((order, i) => (
                                <div key={i} className="flex items-center justify-between p-6 rounded-3xl bg-gray-50 border border-gray-100 group hover:bg-white transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-500">
                                            <ShoppingBag size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-gray-900">{order.id}</h4>
                                            <p className="text-xs text-gray-400 font-medium truncate max-w-[200px]">{order.items}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-gray-900">{order.total}</p>
                                        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{order.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>}

                        {activeTab === 'messages' && <div className="space-y-6">
                            {[
                                { type: 'WhatsApp', campaign: 'Weekend Special Offer', status: 'Delivered', time: 'Oct 25, 10:00 AM', icon: Smartphone, color: 'text-green-500' },
                                { type: 'SMS', campaign: 'Loyalty Reward Unlock', status: 'Opened', time: 'Oct 20, 4:30 PM', icon: MessageSquare, color: 'text-purple-500' },
                                { type: 'Email', campaign: 'October Newsletter', status: 'Clicked', time: 'Oct 15, 9:00 AM', icon: Mail, color: 'text-blue-500' },
                            ].map((msg, i) => (
                                <div key={i} className="flex items-center gap-4 p-5 rounded-3xl bg-gray-50 border border-gray-100 group hover:bg-white transition-all">
                                    <div className={cn("size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center", msg.color)}>
                                        <msg.icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-black text-gray-900">{msg.campaign}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{msg.type}</p>
                                    </div>
                                    <div className="text-right">
                                        <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase mb-1">{msg.status}</Badge>
                                        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{msg.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>}

                        {activeTab === 'activity' && <div className="space-y-8 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-50">
                            {[
                                { title: 'Registered as Customer', desc: 'Signed up via Main Entrance QR Code.', time: 'Oct 12, 2024', icon: User, color: 'bg-blue-50 text-[#066CF4]' },
                                { title: 'Visited Business', desc: 'Checked in at Victoria Island branch.', time: 'Oct 15, 2:15 PM', icon: MapPin, color: 'bg-emerald-50 text-emerald-600' },
                                { title: 'Placed Order', desc: 'Purchased 2 items totaling ₦3,800.', time: 'Oct 15, 2:30 PM', icon: ShoppingBag, color: 'bg-amber-50 text-amber-600' },
                                { title: 'Received Campaign', desc: 'Sent "Weekend Special" via WhatsApp.', time: 'Oct 20, 10:00 AM', icon: Send, color: 'bg-purple-50 text-purple-600' },
                                { title: 'Earned Reward', desc: 'Unlocked "Free Coffee" loyalty reward.', time: 'Oct 24, 9:00 AM', icon: Star, color: 'bg-rose-50 text-rose-600' },
                            ].map((act, i) => (
                                <div key={i} className="flex gap-6 relative z-10">
                                    <div className={cn("size-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0 border-4 border-white", act.color)}>
                                        <act.icon size={20} />
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-sm font-black text-gray-900">{act.title}</h4>
                                            <span className="text-[10px] font-bold text-gray-400">{act.time}</span>
                                        </div>
                                        <p className="text-xs font-medium text-gray-500 leading-relaxed">{act.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
