'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Download
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AnalyticsOverviewHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight tracking-tight">Analytics</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Track your business growth and customer engagement.
                </p>
            </div>
            <div className="flex items-center gap-3">
                <Button variant="outline" className="h-10 px-5 rounded-xl border-gray-100 font-semibold text-xs uppercase tracking-wider text-gray-500">
                    <Download size={15} className="mr-2" />
                    Export
                </Button>
            </div>
        </div>
    );
}

export function AnalyticsStatsCards({ stats }: { stats: any[] }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-4 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0">
            {stats.map((stat, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="min-w-[140px] md:min-w-0 rounded-2xl bg-white p-5 border border-gray-100 shadow-sm group hover:border-[#066CF4]/20 transition-all"
                >
                    <div className={cn("size-9 md:size-10 rounded-lg flex items-center justify-center mb-4 shadow-sm", stat.bg)}>
                        <stat.icon size={20} className={stat.color} />
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5 md:mb-1">{stat.value}</div>
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] md:text-[10px] font-semibold uppercase tracking-wider text-gray-400 leading-tight">{stat.label}</span>
                        {stat.trend && (
                            <Badge className="bg-emerald-50 text-emerald-600 border-none px-1 py-0 font-semibold text-[8px]">
                                {stat.trend}
                            </Badge>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
