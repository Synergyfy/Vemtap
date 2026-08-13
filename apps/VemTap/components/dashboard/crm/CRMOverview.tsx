'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Users, UserPlus, Activity, 
    ArrowUpRight, ArrowDownRight, Search, 
    Filter, LayoutGrid,
    Download, Upload, Send, ChevronRight,
    ShoppingBag, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { PageGuideButton, AICopilotButton } from '@/components/ai';

export function CRMOverviewHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-[#066CF4]/10 border border-[#066CF4]/20 flex items-center justify-center text-[#066CF4]">
                    <Users size={20} />
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 leading-none mb-1">CRM</p>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-none tracking-tight">Customer Overview</h1>
                        <PageGuideButton />
                        <AICopilotButton />
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#066CF4] transition-colors" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search customers..." 
                        className="h-10 pl-9 pr-4 bg-white border border-gray-100 rounded-xl text-sm font-medium focus:ring-4 focus:ring-[#066CF4]/5 outline-none w-full md:w-56 transition-all"
                    />
                </div>
                <Button variant="ghost" size="icon" className="size-10 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 relative">
                    <Filter size={16} className="text-gray-400" />
                </Button>
            </div>
        </div>
    );
}

export function CRMStatsCards({ stats }: { stats: any[] }) {
    return (
        <div className="grid grid-cols-2 lg:flex gap-3 md:gap-4 lg:overflow-x-auto no-scrollbar md:-mx-6 md:px-6 snap-x">
            {stats.map((stat, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="min-w-[160px] md:min-w-[240px] md:flex-1 rounded-2xl bg-white p-4 md:p-5 shadow-sm border border-gray-100 snap-center flex flex-col justify-between h-28 md:h-32 group hover:border-[#066CF4]/20 transition-all"
                >
                    <div className="flex justify-between items-start">
                        <div className={cn("size-9 md:size-10 rounded-lg flex items-center justify-center shadow-sm transition-transform group-hover:scale-110", stat.bg)}>
                            <stat.icon size={16} className={`md:w-[18px] md:h-[18px] ${stat.color}`} />
                        </div>
                        {stat.trend && (
                            <div className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                                stat.trend.isUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                            )}>
                                {stat.trend.isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                {stat.trend.value}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-2xl md:text-[28px] font-bold text-gray-900 mb-0.5 md:mb-1 leading-none tracking-tight">{stat.value}</div>
                        <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400">{stat.label}</div>
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
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Quick Actions</h2>
            </div>
            <div className="flex gap-2 md:gap-3 overflow-x-auto no-scrollbar md:grid md:grid-cols-5">
                {actions.map((action, i) => (
                    <Link key={i} href={action.href} className="group shrink-0 min-w-[120px] md:min-w-0">
                        <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white border border-gray-100 shadow-sm transition-all hover:border-[#066CF4]/20 hover:shadow-md active:scale-[0.98]">
                            <div className={cn("size-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", action.color)}>
                                <action.icon size={18} />
                            </div>
                            <span className="text-[11px] font-semibold text-gray-700 leading-tight">{action.label}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
    const d = Math.floor(hrs / 24);
    return `${d}d ago`;
}

function getActivityIcon(type: string) {
    switch (type) {
        case 'registration': return { icon: UserPlus, color: 'text-blue-500' };
        case 'visit': return { icon: Activity, color: 'text-purple-500' };
        case 'order': return { icon: ShoppingBag, color: 'text-emerald-500' };
        case 'message': return { icon: MessageSquare, color: 'text-rose-500' };
        default: return { icon: Activity, color: 'text-gray-500' };
    }
}

export function CRMActivityFeed({ activities = [] }: { activities?: { id: string; type: string; userName: string; description: string; timestamp: string }[] }) {
    if (activities.length === 0) {
        return (
            <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="size-14 rounded-xl bg-gray-50 flex items-center justify-center mb-4">
                    <Activity size={22} className="text-gray-300" />
                </div>
                <p className="text-xs font-semibold text-gray-400">No recent activity</p>
            </div>
        );
    }

    const shown = activities.slice(0, 8);

    return (
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
            <div className="max-h-[360px] overflow-y-auto pr-1 -mr-1 no-scrollbar">
                <div className="relative">
                    <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gray-50" aria-hidden />
                    <div className="space-y-1 p-3">
                        {shown.map((act, i) => {
                            const { icon: Icon, color } = getActivityIcon(act.type);
                            return (
                                <div key={act.id || i} className="flex gap-3 relative items-start py-2 px-2 rounded-xl hover:bg-gray-50/60 transition-colors">
                                    <div className="size-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 z-10 border border-gray-100">
                                        <Icon size={14} className={color} />
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex justify-between items-baseline gap-2">
                                            <h4 className="text-xs font-semibold text-gray-900 truncate">{act.userName}</h4>
                                            <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap shrink-0">{timeAgo(act.timestamp)}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-snug mt-0.5 line-clamp-2">{act.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <Link href="/dashboard/visitors/activity" className="block">
                <Button className="w-full h-11 rounded-none bg-gray-50 hover:bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider border-none border-t border-gray-100">
                    {activities.length > shown.length ? `View All ${activities.length} Activity` : 'View Full Feed'}
                </Button>
            </Link>
        </div>
    );
}

export function CRMRecentCustomers({ customers }: { customers: any[] }) {
    return (
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-50">
                {customers.map((customer, i) => (
                    <Link key={i} href={`/dashboard/visitors/${customer.id}`} className="group block">
                        <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50/60">
                            <div className="size-9 rounded-lg bg-[#066CF4]/10 text-[#066CF4] flex items-center justify-center font-bold text-xs shrink-0 transition-transform group-hover:scale-110">
                                {customer.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'V'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">{customer.name || 'Anonymous'}</h4>
                                <p className="text-[10px] font-medium text-gray-400 mt-0.5 truncate">{customer.phone || 'No phone'}</p>
                            </div>
                            <ChevronRight size={16} className="text-gray-300 group-hover:text-[#066CF4] transition-all group-hover:translate-x-1 shrink-0" />
                        </div>
                    </Link>
                ))}
            </div>
            <Link href="/dashboard/visitors/all" className="block">
                <Button className="w-full h-11 rounded-none bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#066CF4] transition-colors border-t border-gray-100">
                    View All Customers
                </Button>
            </Link>
        </div>
    );
}
