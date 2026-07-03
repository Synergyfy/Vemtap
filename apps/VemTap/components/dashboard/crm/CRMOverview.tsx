'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Users, UserPlus, Repeat, Activity, 
    ArrowUpRight, ArrowDownRight, Search, 
    Filter, Bell, Plus, LayoutGrid, Archive,
    Download, Upload, Send, ChevronRight,
    TrendingUp, Calendar, ShoppingBag, MessageSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function CRMOverviewHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-[#066CF4]/10 border border-[#066CF4]/20 flex items-center justify-center text-[#066CF4]">
                    <Users size={28} />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-2">Management</p>
                    <h1 className="text-2xl font-black text-gray-900 leading-none">Customers</h1>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#066CF4] transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search customers..." 
                        className="h-14 pl-12 pr-6 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-[#066CF4]/5 outline-none w-full md:w-64 transition-all"
                    />
                </div>
                <Button variant="ghost" size="icon" className="size-14 rounded-2xl bg-white border border-gray-100 hover:bg-gray-50 relative">
                    <Filter size={20} className="text-gray-400" />
                </Button>
            </div>
        </div>
    );
}

export function CRMStatsCards({ stats }: { stats: any[] }) {
    return (
        <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 snap-x">
            {stats.map((stat, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="min-w-[160px] md:min-w-[240px] md:flex-1 rounded-[1.5rem] md:rounded-[2.5rem] bg-white p-4 md:p-6 shadow-sm border border-gray-100 snap-center flex flex-col justify-between h-32 md:h-40 group hover:border-[#066CF4]/20 transition-all"
                >
                    <div className="flex justify-between items-start">
                        <div className={cn("size-10 md:size-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110", stat.bg)}>
                            <stat.icon size={20} className={`md:w-6 md:h-6 ${stat.color}`} />
                        </div>
                        {stat.trend && (
                            <div className={cn(
                                "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                stat.trend.isUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                            )}>
                                {stat.trend.isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                {stat.trend.value}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-2xl md:text-3xl font-black text-gray-900 mb-0.5 md:mb-1">{stat.value}</div>
                        <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

export function CRMQuickActions() {
    const actions = [
        { label: 'View Customers', icon: Users, href: '/dashboard/visitors/all', color: 'bg-blue-50 text-blue-600' },
        { label: 'Create Segment', icon: LayoutGrid, href: '/dashboard/visitors/segments', color: 'bg-purple-50 text-purple-600' },
        { label: 'Export Data', icon: Download, href: '/dashboard/visitors/export', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Import List', icon: Upload, href: '/dashboard/visitors/import', color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Send Message', icon: Send, href: '/dashboard/messaging/sms', color: 'bg-rose-50 text-rose-600' },
    ];

    return (
        <section>
            <div className="flex items-center justify-between mb-6 px-1">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {actions.map((action, i) => (
                    <Link key={i} href={action.href} className="group">
                        <div className="flex flex-col items-center text-center gap-3 md:gap-4 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] bg-white border border-gray-100 shadow-sm transition-all hover:border-[#066CF4]/20 hover:shadow-xl hover:shadow-black/5 active:scale-95 h-full">
                            <div className={cn("size-12 md:size-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform", action.color)}>
                                <action.icon size={20} className="md:w-6 md:h-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-700 leading-tight">{action.label}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}

export function CRMActivityFeed() {
    const activities = [
        { type: 'registration', user: 'Sarah J.', desc: 'Registered via Main Entrance QR', time: '10 mins ago', icon: UserPlus, color: 'text-blue-500' },
        { type: 'visit', user: 'Michael K.', desc: 'Visited via NFC Plate Table 4', time: '25 mins ago', icon: Activity, color: 'text-purple-500' },
        { type: 'order', user: 'Elena R.', desc: 'Placed an order for $45.00', time: '1 hour ago', icon: ShoppingBag, color: 'text-emerald-500' },
        { type: 'message', user: 'David W.', desc: 'Opened "Weekend Special" WhatsApp', time: '3 hours ago', icon: MessageSquare, color: 'text-rose-500' },
    ];

    return (
        <div className="rounded-[2.5rem] bg-white p-8 shadow-sm border border-gray-100">
            <div className="space-y-6">
                {activities.map((act, i) => (
                    <div key={i} className="flex gap-4 relative group">
                        {i < activities.length - 1 && (
                            <div className="absolute left-6 top-12 bottom-[-24px] w-0.5 bg-gray-50 group-hover:bg-[#066CF4]/5 transition-colors" />
                        )}
                        <div className="size-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 shadow-sm z-10 transition-transform group-hover:scale-110">
                            <act.icon size={20} className={act.color} />
                        </div>
                        <div className="flex-1 pb-6 border-b border-gray-50 last:border-0">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="text-xs font-black text-gray-900">{act.user}</h4>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">{act.time}</span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-tight">{act.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
            <Link href="/dashboard/visitors/activity" className="mt-6 block">
                <Button className="w-full h-12 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest border-none">
                    View Full Feed
                </Button>
            </Link>
        </div>
    );
}

export function CRMRecentCustomers({ customers }: { customers: any[] }) {
    return (
        <div className="rounded-[2.5rem] bg-white p-6 shadow-sm border border-gray-100">
            <div className="space-y-3">
                {customers.map((customer, i) => (
                    <Link key={i} href={`/dashboard/visitors/${customer.id}`} className="group block">
                        <div className="flex items-center gap-4 p-4 rounded-[2rem] border border-transparent transition-all hover:bg-gray-50 hover:border-gray-100">
                            <div className="size-12 rounded-2xl bg-[#066CF4]/10 text-[#066CF4] flex items-center justify-center font-black text-sm shrink-0 transition-transform group-hover:scale-110">
                                {customer.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'V'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-black text-gray-900 truncate">{customer.name || 'Anonymous'}</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{customer.phone || 'No phone'}</p>
                            </div>
                            <ChevronRight size={16} className="text-gray-200 group-hover:text-[#066CF4] transition-all group-hover:translate-x-1" />
                        </div>
                    </Link>
                ))}
            </div>
            <Link href="/dashboard/visitors/all" className="mt-6 block">
                <Button className="w-full h-12 rounded-2xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#066CF4] transition-all">
                    View All Customers
                </Button>
            </Link>
        </div>
    );
}
