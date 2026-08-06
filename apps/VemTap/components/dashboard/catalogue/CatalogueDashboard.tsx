'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    ShoppingBag, Utensils, Scissors, Dumbbell, Hotel, 
    Store, LayoutGrid, Plus, Upload, Archive, 
    ChevronRight, ArrowRight, Star, Clock, 
    CheckCircle2, Search, Bell, HelpCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { PageGuideButton, AICopilotButton } from '@/components/ai';

export function CatalogueOverviewHeader({ category }: { category: string }) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-[#066CF4]/10 border border-[#066CF4]/20 flex items-center justify-center text-[#066CF4]">
                    <BuildingIcon type={category} size={28} />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-2">Showcase & Overview</p>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-black text-gray-900 leading-none">Products & Services</h1>
                        <PageGuideButton />
                        <AICopilotButton />
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Badge className="h-12 px-6 rounded-2xl bg-white border border-gray-100 text-gray-900 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm">
                    <span className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                    {category || 'Business'}
                </Badge>
                <Button variant="ghost" size="icon" className="size-12 rounded-2xl bg-white border border-gray-100 hover:bg-gray-50">
                    <HelpCircle size={20} className="text-gray-400" />
                </Button>
            </div>
        </div>
    );
}

export function CatalogueStatsCards({ stats }: { stats: any[] }) {
    return (
        <div className="grid grid-cols-2 lg:flex gap-3 md:gap-4 lg:overflow-x-auto no-scrollbar md:-mx-6 md:px-6 snap-x">
            {stats.map((stat, i) => (
                <Link key={i} href={stat.href || "/dashboard/inventory"} className="md:min-w-[240px] lg:flex-1 snap-center group">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="rounded-3xl md:rounded-[2.5rem] bg-white p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-32 md:h-40 group-hover:border-[#066CF4]/20 transition-all h-full cursor-pointer"
                    >
                        <div className="size-10 md:size-12 rounded-xl md:rounded-2xl bg-gray-50 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110">
                            <stat.icon size={20} className="text-[#066CF4]" />
                        </div>
                        <div>
                            <div className="text-2xl md:text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
                            <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</div>
                        </div>
                    </motion.div>
                </Link>
            ))}
        </div>
    );
}


function BuildingIcon({ type, size }: { type: string, size: number }) {
    const t = type.toLowerCase();
    if (t.includes('rest') || t.includes('cafe')) return <Utensils size={size} />;
    if (t.includes('salon') || t.includes('spa')) return <Scissors size={size} />;
    if (t.includes('gym')) return <Dumbbell size={size} />;
    if (t.includes('hotel')) return <Hotel size={size} />;
    return <ShoppingBag size={size} />;
}
