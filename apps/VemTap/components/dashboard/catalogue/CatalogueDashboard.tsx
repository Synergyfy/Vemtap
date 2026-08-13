'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    ShoppingBag, Utensils, Scissors, Dumbbell, Hotel, 
    HelpCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PageGuideButton, AICopilotButton } from '@/components/ai';

export function CatalogueOverviewHeader({ category }: { category: string }) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-[#066CF4]/10 border border-[#066CF4]/20 flex items-center justify-center text-[#066CF4]">
                    <BuildingIcon type={category} size={20} />
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 leading-none mb-1">Showcase & Overview</p>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-none tracking-tight">Products & Services</h1>
                        <PageGuideButton />
                        <AICopilotButton />
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Badge className="h-9 px-4 rounded-lg bg-white border border-gray-100 text-gray-700 font-semibold text-[10px] uppercase tracking-wider flex items-center gap-2 shadow-sm">
                    <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    {category || 'Business'}
                </Badge>
                <Button variant="ghost" size="icon" className="size-9 rounded-lg bg-white border border-gray-100 hover:bg-gray-50">
                    <HelpCircle size={16} className="text-gray-400" />
                </Button>
            </div>
        </div>
    );
}

export function CatalogueStatsCards({ stats }: { stats: any[] }) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {stats.map((stat, i) => (
                <Link key={i} href={stat.href || "/dashboard/inventory"} className="group">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="rounded-2xl bg-white p-4 md:p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-28 md:h-32 group-hover:border-[#066CF4]/20 transition-all"
                    >
                        <div className="size-9 md:size-10 rounded-lg bg-gray-50 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110">
                            <stat.icon size={16} className="text-[#066CF4]" />
                        </div>
                        <div>
                            <div className="text-2xl md:text-[28px] font-bold text-gray-900 mb-0.5 leading-none tracking-tight">{stat.value}</div>
                            <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400">{stat.label}</div>
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
