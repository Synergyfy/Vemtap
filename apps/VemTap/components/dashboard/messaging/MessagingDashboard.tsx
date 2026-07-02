'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Megaphone, Send, MailOpen, MousePointer, 
    Activity, Search, Bell, HelpCircle,
    Plus, Sparkles, Zap, Percent, Calendar,
    Rocket, Edit3, ChevronRight, ArrowUpRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function MessagingOverviewHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900 leading-tight">Messaging Center</h1>
                <p className="text-sm font-medium text-gray-500 mt-1">
                    Create, manage, and track customer messages.
                </p>
            </div>
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                    <Search size={22} className="text-gray-600" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 relative">
                    <Bell size={22} className="text-gray-600" />
                    <div className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                    <HelpCircle size={22} className="text-gray-600" />
                </Button>
            </div>
        </div>
    );
}

export function MessagingStatsCards({ stats }: { stats: any[] }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 px-4 md:px-0">
            {stats.map((stat, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-[24px] md:rounded-[32px] bg-white p-4 md:p-6 shadow-sm border border-gray-100 group hover:border-[#066CF4]/20 transition-all"
                >
                    <div className="flex justify-between items-start mb-3 md:mb-6">
                        <div className={cn("size-8 md:size-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm", stat.bg)}>
                            <stat.icon size={18} className={stat.color} />
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-600 border-none px-1.5 py-0.5 font-black text-[8px] md:text-[10px]">
                            {stat.trend || '+0%'}
                        </Badge>
                    </div>
                    <div className="text-xl md:text-3xl font-black text-gray-900 mb-0.5 md:mb-1">{stat.value}</div>
                    <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 leading-tight">{stat.label}</div>
                </motion.div>
            ))}
        </div>
    );
}

export function MessagingQuickActions() {
    const actions = [
        { label: 'SMS', icon: Megaphone, href: '/dashboard/messaging/sms', color: 'bg-blue-50 text-[#066CF4]' },
        { label: 'WhatsApp', icon: Zap, href: '/dashboard/messaging/whatsapp', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Email', icon: Send, href: '/dashboard/messaging/email', color: 'bg-purple-50 text-purple-600' },
        { label: 'History', icon: Activity, href: '/dashboard/messaging/history', color: 'bg-amber-50 text-amber-600' },
        { label: 'Credits', icon: Sparkles, href: '/dashboard/messaging/credits', color: 'bg-indigo-50 text-indigo-600' },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                Quick Actions
                <span className="h-0.5 flex-1 bg-gray-100" />
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 px-4 md:px-0">
                {actions.map((action, i) => (
                    <Link key={i} href={action.href} className="group">
                        <div className="flex flex-col items-center text-center gap-3 p-5 md:p-6 rounded-[24px] md:rounded-[32px] bg-white border border-gray-100 shadow-sm transition-all hover:border-[#066CF4]/20 hover:shadow-xl hover:shadow-black/5 active:scale-95 h-full">
                            <div className={cn("size-10 md:size-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform", action.color)}>
                                <action.icon size={20} className="md:w-6 md:h-6" />
                            </div>
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-900 leading-tight">{action.label}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export function RecentCampaignsList({ campaigns }: { campaigns: any[] }) {
    return (
        <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-gray-900">Recent Messages</h3>
                <Link href="/dashboard/messaging/history">
                    <Button variant="outline" className="rounded-xl border-gray-100 text-[10px] font-black uppercase tracking-widest">View History</Button>
                </Link>
            </div>

            <div className="space-y-4">
                {campaigns.map((camp, i) => (
                    <div key={i} className="group flex items-center gap-4 p-4 rounded-2xl border border-transparent transition-all hover:bg-gray-50 hover:border-gray-100">
                        <div className="size-12 rounded-2xl bg-blue-50 text-[#066CF4] flex items-center justify-center shrink-0 shadow-sm">
                            <Megaphone size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-gray-900 truncate">{camp.name}</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                {camp.audience} • {camp.channel}
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <Badge className={cn(
                                "border-none font-black text-[9px] uppercase px-2 mb-1",
                                camp.status === 'Sent' ? "bg-emerald-50 text-emerald-600" :
                                camp.status === 'Draft' ? "bg-gray-100 text-gray-400" : "bg-blue-50 text-[#066CF4]"
                            )}>
                                {camp.status}
                            </Badge>
                            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{camp.date}</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-200 group-hover:text-[#066CF4] transition-all group-hover:translate-x-1" />
                    </div>
                ))}
            </div>
        </div>
    );
}
