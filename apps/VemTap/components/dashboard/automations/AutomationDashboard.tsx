'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Zap, Send, Users, TrendingUp, Search, 
    Bell, HelpCircle, Plus, Sparkles, Cake, 
    RefreshCw, Edit3, ChevronRight, Activity,
    Calendar, MessageSquare, Play, Pause, Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function AutomationOverviewHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900 leading-tight">Automation Center</h1>
                <p className="text-sm font-medium text-gray-500 mt-1">
                    Automatically engage customers while you focus on your business.
                </p>
            </div>
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 relative">
                    <Bell size={22} className="text-gray-600" />
                    <div className="absolute top-2 right-2 size-2 bg-[#066CF4] rounded-full border-2 border-white" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                    <HelpCircle size={22} className="text-gray-600" />
                </Button>
            </div>
        </div>
    );
}

export function AutomationStatsCards({ stats }: { stats: any[] }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 px-4 md:px-0 overflow-x-auto no-scrollbar pb-4 md:pb-0 -mx-4 md:mx-0">
            {stats.map((stat, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="min-w-[160px] md:min-w-0 rounded-[24px] md:rounded-[32px] bg-white p-4 md:p-6 shadow-sm border border-gray-100 group hover:border-[#066CF4]/20 transition-all"
                >
                    <div className="flex justify-between items-start mb-3 md:mb-6">
                        <div className={cn("size-8 md:size-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm", stat.bg)}>
                            <stat.icon size={18} className={stat.color} />
                        </div>
                        {stat.trend && (
                            <Badge className="bg-emerald-50 text-emerald-600 border-none px-1.5 py-0.5 font-black text-[8px] md:text-[10px]">
                                {stat.trend}
                            </Badge>
                        )}
                    </div>
                    <div className="text-xl md:text-3xl font-black text-gray-900 mb-0.5 md:mb-1">{stat.value}</div>
                    <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 leading-tight">{stat.label}</div>
                </motion.div>
            ))}
        </div>
    );
}

export function PopularAutomationsSection() {
    const automations = [
        { id: 'welcome', label: 'Welcome Automation', desc: 'Automatically greet new customers.', icon: Sparkles, href: '/dashboard/automations/welcome', color: 'bg-blue-50 text-[#066CF4]' },
        { id: 'birthday', label: 'Birthday Automation', desc: 'Send birthday wishes and offers.', icon: Cake, href: '/dashboard/automations/birthday', color: 'bg-purple-50 text-purple-600' },
        { id: 'reactivation', label: 'Reactivation', desc: 'Bring inactive customers back.', icon: RefreshCw, href: '/dashboard/automations/reactivation', color: 'bg-rose-50 text-rose-600' },
        { id: 'custom', label: 'Custom Workflow', desc: 'Build your own smart flow.', icon: Edit3, href: '/dashboard/automations/custom', color: 'bg-gray-50 text-gray-600' },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                Popular Automations
                <span className="h-0.5 flex-1 bg-gray-100" />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {automations.map((aut, i) => (
                    <Link key={i} href={aut.href} className="group">
                        <div className="flex flex-col items-center text-center gap-4 p-8 rounded-[40px] bg-white border border-gray-100 shadow-sm transition-all hover:border-[#066CF4]/20 hover:shadow-xl hover:shadow-black/5 active:scale-95 h-full">
                            <div className={cn("size-16 rounded-[22px] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform", aut.color)}>
                                <aut.icon size={28} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-900 mb-1">{aut.label}</h3>
                                <p className="text-[10px] font-medium text-gray-400 leading-relaxed">{aut.desc}</p>
                            </div>
                            <Button className="mt-2 h-10 px-6 rounded-xl bg-gray-900 text-[9px] font-black uppercase tracking-widest group-hover:bg-[#066CF4] transition-all">
                                Setup
                            </Button>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export function ActiveAutomationsList({ rules }: { rules: any[] }) {
    return (
        <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-gray-900">Active Workflows</h3>
                <Link href="/dashboard/automations/logs">
                    <Button variant="outline" className="rounded-xl border-gray-100 text-[10px] font-black uppercase tracking-widest">View Activity Logs</Button>
                </Link>
            </div>

            <div className="space-y-4">
                {rules.map((rule, i) => (
                    <div key={i} className="group relative p-6 rounded-[32px] bg-gray-50/50 border border-transparent transition-all hover:bg-white hover:border-gray-100 hover:shadow-xl hover:shadow-black/5">
                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                            <div className="size-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-100">
                                <Zap size={24} className="text-[#066CF4]" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <h4 className="text-base font-black text-gray-900 truncate">{rule.name}</h4>
                                    <Badge className={cn(
                                        "border-none font-black text-[8px] uppercase px-2",
                                        rule.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                    )}>
                                        {rule.status}
                                    </Badge>
                                </div>
                                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                                    Trigger: {rule.trigger} • {rule.sent.toLocaleString()} Sent
                                </p>
                            </div>

                            <div className="flex items-center gap-8 md:px-8 border-t md:border-t-0 md:border-x border-gray-100 pt-4 md:pt-0">
                                <div className="text-center">
                                    <p className="text-sm font-black text-gray-900">{rule.reached.toLocaleString()}</p>
                                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Reached</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-black text-[#066CF4]">{rule.successRate}%</p>
                                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Success</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-black text-gray-900">{rule.performance || 'A'}</p>
                                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Score</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button className="size-12 rounded-2xl bg-white border border-gray-100 text-gray-400 flex items-center justify-center hover:text-[#066CF4] transition-all">
                                    {rule.status === 'active' ? <Pause size={20} /> : <Play size={20} />}
                                </button>
                                <button className="size-12 rounded-2xl bg-white border border-gray-100 text-gray-400 flex items-center justify-center hover:text-[#066CF4] transition-all">
                                    <Edit3 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
