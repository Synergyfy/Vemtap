'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Activity, Search, Bell, HelpCircle,
    Smartphone, Mail, Megaphone, ChevronRight, Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { PageGuideButton, AICopilotButton } from '@/components/ai';

export function MessagingOverviewHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight tracking-tight">Messaging Center</h1>
                    <PageGuideButton />
                    <AICopilotButton />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                    Create, manage, and track customer messages.
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100">
                    <Search size={18} className="text-gray-500" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 relative">
                    <Bell size={18} className="text-gray-500" />
                    <div className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border-2 border-white" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100">
                    <HelpCircle size={18} className="text-gray-500" />
                </Button>
            </div>
        </div>
    );
}

export function MessagingStatsCards({ stats }: { stats: any[] }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {stats.map((stat, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-2xl bg-white p-4 md:p-5 shadow-sm border border-gray-100 group hover:border-[#066CF4]/20 transition-all"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className={cn("size-9 md:size-10 rounded-lg flex items-center justify-center shadow-sm", stat.bg)}>
                            <stat.icon size={16} className={stat.color} />
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-600 border-none px-1.5 py-0.5 font-bold text-[9px]">
                            {stat.trend || '+0%'}
                        </Badge>
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5 leading-none tracking-tight">{stat.value}</div>
                    <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400">{stat.label}</div>
                </motion.div>
            ))}
        </div>
    );
}

// Inline WhatsApp SVG icon
function WhatsAppIconQuick({ size = 20, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    );
}

export function MessagingQuickActions() {
    const actions = [
        { label: 'SMS', icon: Smartphone, href: '/dashboard/messaging/sms', color: 'bg-blue-50 text-[#066CF4]' },
        { label: 'WhatsApp', icon: WhatsAppIconQuick, href: '/dashboard/messaging/whatsapp', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Email', icon: Mail, href: '/dashboard/messaging/email', color: 'bg-purple-50 text-purple-600' },
        { label: 'History', icon: Activity, href: '/dashboard/messaging/history', color: 'bg-amber-50 text-amber-600' },
        { label: 'Credits', icon: Sparkles, href: '/dashboard/messaging/credits', color: 'bg-indigo-50 text-indigo-600' },
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Quick Actions</h2>
            <div className="flex gap-2 md:gap-3 overflow-x-auto no-scrollbar md:grid md:grid-cols-5">
                {actions.map((action, i) => (
                    <Link key={i} href={action.href} className="group shrink-0 min-w-[110px] md:min-w-0">
                        <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-white border border-gray-100 shadow-sm transition-all hover:border-[#066CF4]/20 hover:shadow-md active:scale-[0.98]">
                            <div className={cn("size-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", action.color)}>
                                <action.icon size={18} />
                            </div>
                            <span className="text-[11px] font-semibold text-gray-700 leading-tight truncate">{action.label}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export function RecentCampaignsList({ campaigns }: { campaigns: any[] }) {
    return (
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <h3 className="text-base md:text-lg font-bold text-gray-900">Recent Messages</h3>
                <Link href="/dashboard/messaging/history">
                    <Button variant="outline" className="rounded-lg h-9 border-gray-200 text-xs font-semibold text-gray-600 px-3">View History</Button>
                </Link>
            </div>

            <div className="divide-y divide-gray-50">
                {campaigns.map((camp, i) => (
                    <div key={i} className="group flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-gray-50/60">
                        <div className="size-9 rounded-lg bg-blue-50 text-[#066CF4] flex items-center justify-center shrink-0">
                            <Megaphone size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">{camp.name}</h4>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                                {camp.audience} • {camp.channel}
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <Badge className={cn(
                                "border-none font-semibold text-[9px] uppercase px-2 py-0.5 mb-1",
                                camp.status === 'Sent' ? "bg-emerald-50 text-emerald-600" :
                                camp.status === 'Draft' ? "bg-gray-100 text-gray-400" : "bg-blue-50 text-[#066CF4]"
                            )}>
                                {camp.status}
                            </Badge>
                            <p className="text-[10px] font-medium text-gray-400">{camp.date}</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-[#066CF4] transition-all group-hover:translate-x-1 shrink-0" />
                    </div>
                ))}
            </div>
        </div>
    );
}
