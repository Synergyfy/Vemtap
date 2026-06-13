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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900 leading-tight">Customers</h1>
                <p className="text-sm font-medium text-gray-500 mt-1">
                    Manage and grow your customer database.
                </p>
            </div>
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                    <Search size={22} className="text-gray-600" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 relative">
                    <Filter size={22} className="text-gray-600" />
                    <div className="absolute top-2 right-2 size-2 bg-[#066CF4] rounded-full border-2 border-white" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 relative">
                    <Bell size={22} className="text-gray-600" />
                    <div className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white" />
                </Button>
            </div>
        </div>
    );
}

export function CRMStatsCards({ stats }: { stats: any[] }) {
    return (
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {stats.map((stat, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="min-w-[240px] md:flex-1 rounded-[32px] bg-white p-6 shadow-sm border border-gray-100 group hover:border-[#066CF4]/20 transition-all"
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className={cn("size-12 rounded-2xl flex items-center justify-center shadow-sm", stat.bg)}>
                            <stat.icon size={24} className={stat.color} />
                        </div>
                        {stat.trend && (
                            <Badge className={cn(
                                "border-none px-2 py-1 font-black text-[10px]",
                                stat.trend.isUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                            )}>
                                {stat.trend.isUp ? <ArrowUpRight size={10} className="mr-1" /> : <ArrowDownRight size={10} className="mr-1" />}
                                {stat.trend.value}
                            </Badge>
                        )}
                    </div>
                    <div className="text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</div>
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
        { label: 'Send Campaign', icon: Send, href: '/dashboard/messaging/create', color: 'bg-rose-50 text-rose-600' },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                Quick Actions
                <span className="h-0.5 flex-1 bg-gray-100" />
            </h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
                {actions.map((action, i) => (
                    <Link key={i} href={action.href} className="group">
                        <div className="min-w-[140px] flex flex-col items-center text-center gap-3 p-6 rounded-[32px] bg-white border border-gray-100 shadow-sm transition-all hover:border-[#066CF4]/20 hover:shadow-xl hover:shadow-black/5 active:scale-95">
                            <div className={cn("size-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform", action.color)}>
                                <action.icon size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{action.label}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
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
        <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-gray-900">Activity Summary</h3>
                <Link href="/dashboard/visitors/activity">
                    <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-[#066CF4]">View Feed</Button>
                </Link>
            </div>
            
            <div className="space-y-6">
                {activities.map((act, i) => (
                    <div key={i} className="flex gap-4 relative group">
                        {i < activities.length - 1 && (
                            <div className="absolute left-6 top-12 bottom-[-24px] w-0.5 bg-gray-50 group-hover:bg-blue-50 transition-colors" />
                        )}
                        <div className="size-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 shadow-sm z-10">
                            <act.icon size={20} className={act.color} />
                        </div>
                        <div className="flex-1 pb-6 border-b border-gray-50 last:border-0">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="text-sm font-black text-gray-900">{act.user}</h4>
                                <span className="text-[10px] font-bold text-gray-400">{act.time}</span>
                            </div>
                            <p className="text-xs font-medium text-gray-500 leading-relaxed">{act.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function CRMRecentCustomers({ customers }: { customers: any[] }) {
    return (
        <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-gray-900">Recent Customers</h3>
                <Link href="/dashboard/visitors/all">
                    <Button variant="outline" className="rounded-xl border-gray-100 text-[10px] font-black uppercase tracking-widest">View All</Button>
                </Link>
            </div>

            <div className="space-y-4">
                {customers.map((customer, i) => (
                    <Link key={i} href={`/dashboard/visitors/${customer.id}`} className="group block">
                        <div className="flex items-center gap-4 p-4 rounded-2xl border border-transparent transition-all hover:bg-gray-50 hover:border-gray-100">
                            <div className="size-12 rounded-2xl bg-[#066CF4]/10 text-[#066CF4] flex items-center justify-center font-black text-sm shrink-0">
                                {customer.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'V'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-black text-gray-900 truncate">{customer.name || 'Anonymous'}</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{customer.phone || 'No phone'}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <Badge className="bg-blue-50 text-[#066CF4] border-none font-black text-[9px] uppercase px-2 mb-1">
                                    {customer.status || 'Active'}
                                </Badge>
                                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{customer.joinedDate || 'Today'}</p>
                            </div>
                            <ChevronRight size={16} className="text-gray-200 group-hover:text-[#066CF4] transition-all group-hover:translate-x-1" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
