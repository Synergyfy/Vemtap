'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Eye, Store, MousePointer, Users, 
    TrendingUp, Bell, HelpCircle, ArrowUpRight,
    Megaphone, Gift, Zap, Settings, ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDiscoveryStore } from '@/store/useDiscoveryStore';
import Link from 'next/link';

export function DiscoveryOverviewHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900 leading-tight">Discovery Network</h1>
                <p className="text-sm font-medium text-gray-500 mt-1">
                    Get discovered by customers across the Vemtap ecosystem.
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

export function DiscoveryMetrics({ stats }: { stats: any[] }) {
    return (
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {stats.map((stat, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="min-w-[180px] md:flex-1 rounded-[32px] bg-white p-6 shadow-sm border border-gray-100 group hover:border-[#066CF4]/20 transition-all"
                >
                    <div className={cn("size-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm", stat.bg)}>
                        <stat.icon size={24} className={stat.color} />
                    </div>
                    <div className="text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</span>
                        {stat.trend && (
                            <Badge className="bg-emerald-50 text-emerald-600 border-none px-1 py-0 font-black text-[8px]">
                                {stat.trend}
                            </Badge>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

export function DiscoveryScoreCard({ score }: { score: number }) {
    return (
        <div className="rounded-[40px] bg-white p-10 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
                <Badge className="bg-blue-50 text-[#066CF4] border-none px-4 py-1.5 font-black uppercase tracking-widest mb-4">
                    Discovery Score
                </Badge>
                <h3 className="text-2xl font-black text-gray-900">Your Business Is Discoverable</h3>
                <p className="text-sm font-medium text-gray-500 mt-2 max-w-sm">Complete your profile and add promotions to increase your score.</p>
            </div>
            <div className="flex items-center gap-8">
                <div className="relative size-32 flex items-center justify-center">
                    <svg className="size-full" viewBox="0 0 100 100">
                        <circle className="text-gray-100" strokeWidth="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                        <circle 
                            className="text-[#066CF4]" 
                            strokeWidth="8" 
                            strokeDasharray={251.2}
                            strokeDashoffset={251.2 - (251.2 * score) / 100}
                            strokeLinecap="round" 
                            stroke="currentColor" 
                            fill="transparent" 
                            r="40" 
                            cx="50" 
                            cy="50" 
                        />
                    </svg>
                    <div className="absolute text-3xl font-black text-gray-900">{score}</div>
                </div>
                <Button className="h-16 px-8 rounded-2xl bg-gray-900 text-xs font-black uppercase tracking-widest text-white hover:bg-[#066CF4] transition-all">
                    Manage Listing
                </Button>
            </div>
        </div>
    );
}
