'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    ShoppingBag, Package, AlertCircle, LayoutGrid, 
    Plus, ArrowRight, Settings, HelpCircle, Bell
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CatalogueOverviewHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900 leading-tight">Catalogue</h1>
                <p className="text-sm font-medium text-gray-500 mt-1">
                    Manage your products, services, and inventory.
                </p>
            </div>
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 relative">
                    <Bell size={22} className="text-gray-600" />
                    <div className="absolute top-2 right-2 size-2 bg-[#066CF4] rounded-full border-2 border-white" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                    <Settings size={22} className="text-gray-600" />
                </Button>
            </div>
        </div>
    );
}

export function CatalogueStatsCards({ stats }: { stats: any[] }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
            {stats.map((stat, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-[24px] md:rounded-[32px] bg-white p-5 md:p-6 shadow-sm border border-gray-100 group hover:border-[#066CF4]/20 transition-all"
                >
                    <div className={cn("size-10 md:size-12 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-sm", stat.bg)}>
                        <stat.icon size={20} className={stat.color} />
                    </div>
                    <div className="text-xl md:text-3xl font-black text-gray-900 mb-0.5 md:mb-1">{stat.value}</div>
                    <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</div>
                </motion.div>
            ))}
        </div>
    );
}

export function CatalogueActionCards({ isProductBased }: { isProductBased: boolean }) {
    const actions = [
        { label: `Add ${isProductBased ? 'Product' : 'Service'}`, desc: 'Create new catalog item.', icon: Plus, color: 'bg-blue-50 text-[#066CF4]' },
        { label: 'Import Catalog', desc: 'Bulk upload via CSV.', icon: Plus, color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Manage Categories', desc: 'Organize your offerings.', icon: LayoutGrid, color: 'bg-purple-50 text-purple-600' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {actions.map((act, i) => (
                <button
                    key={i}
                    className="flex flex-col items-center text-center gap-4 p-8 rounded-[32px] bg-white border border-gray-100 shadow-sm transition-all hover:border-[#066CF4]/20 hover:shadow-xl hover:shadow-black/5 active:scale-95 h-full"
                >
                    <div className={cn("size-16 rounded-[22px] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform mb-2", act.color)}>
                        <act.icon size={28} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-gray-900 mb-2">{act.label}</h3>
                        <p className="text-xs font-medium text-gray-400 leading-relaxed max-w-[200px]">{act.desc}</p>
                    </div>
                </button>
            ))}
        </div>
    );
}
