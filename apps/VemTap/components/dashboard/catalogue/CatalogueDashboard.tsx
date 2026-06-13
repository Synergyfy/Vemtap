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

export function CatalogueOverviewHeader({ category }: { category: string }) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900 leading-tight">Products & Services</h1>
                <p className="text-sm font-medium text-gray-500 mt-1">
                    Manage what customers can order or book through your QR codes.
                </p>
            </div>
            <div className="flex items-center gap-3">
                <Badge className="h-10 px-4 rounded-xl bg-blue-50 text-[#066CF4] border-none font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <BuildingIcon type={category} size={14} />
                    {category || 'Business'}
                </Badge>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                    <HelpCircle size={22} className="text-gray-600" />
                </Button>
            </div>
        </div>
    );
}

export function CatalogueStatsCards({ stats }: { stats: any[] }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {stats.map((stat, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-[24px] md:rounded-[32px] bg-white p-5 md:p-6 shadow-sm border border-gray-100 group hover:border-[#066CF4]/20 transition-all"
                >
                    <div className="size-10 md:size-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 md:mb-6 shadow-sm">
                        <stat.icon size={24} className="text-[#066CF4]" />
                    </div>
                    <div className="text-2xl md:text-3xl font-black text-gray-900 mb-0.5 md:mb-1">{stat.value}</div>
                    <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 leading-tight">{stat.label}</div>
                </motion.div>
            ))}
        </div>
    );
}

export function CatalogueActionCards({ isProductBased }: { isProductBased: boolean }) {
    const actions = isProductBased ? [
        { label: 'Create Product Catalog', desc: 'Manage your full inventory.', icon: ShoppingBag, href: '/dashboard/catalogue/products', color: 'bg-blue-50 text-[#066CF4]' },
        { label: 'Create Digital Menu', desc: 'Sleek view for dine-in orders.', icon: Utensils, href: '/dashboard/catalogue/menus', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Import Items', desc: 'Bulk upload via CSV or Excel.', icon: Upload, href: '/dashboard/catalogue/import', color: 'bg-indigo-50 text-indigo-600' },
    ] : [
        { label: 'Service Catalog', desc: 'Define your bookable services.', icon: Scissors, href: '/dashboard/catalogue/services', color: 'bg-purple-50 text-purple-600' },
        { label: 'Manage Bookings', desc: 'Real-time appointment schedule.', icon: Clock, href: '/dashboard/catalogue/bookings', color: 'bg-amber-50 text-amber-600' },
        { label: 'Import Catalog', desc: 'Bring existing service lists.', icon: Upload, href: '/dashboard/catalogue/import', color: 'bg-indigo-50 text-indigo-600' },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                Setup Options
                <span className="h-0.5 flex-1 bg-gray-100" />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {actions.map((act, i) => (
                    <Link key={i} href={act.href} className="group h-full">
                        <div className="flex flex-col items-center text-center gap-4 p-10 rounded-[40px] bg-white border border-gray-100 shadow-sm transition-all hover:border-[#066CF4]/20 hover:shadow-xl hover:shadow-black/5 active:scale-95 h-full">
                            <div className={cn("size-20 rounded-[28px] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform mb-2", act.color)}>
                                <act.icon size={36} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900 mb-2">{act.label}</h3>
                                <p className="text-xs font-medium text-gray-400 leading-relaxed max-w-[200px]">{act.desc}</p>
                            </div>
                            <Button className="mt-4 w-full h-12 rounded-2xl bg-gray-900 text-[10px] font-black uppercase tracking-widest group-hover:bg-[#066CF4] transition-all">
                                Get Started
                            </Button>
                        </div>
                    </Link>
                ))}
            </div>
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
