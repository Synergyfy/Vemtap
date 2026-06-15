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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-[#066CF4]/10 border border-[#066CF4]/20 flex items-center justify-center text-[#066CF4]">
                    <BuildingIcon type={category} size={28} />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-2">Inventory Management</p>
                    <h1 className="text-2xl font-black text-gray-900 leading-none">Products & Services</h1>
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
        <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 snap-x">
            {stats.map((stat, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="min-w-[240px] md:flex-1 rounded-[2.5rem] bg-white p-6 shadow-sm border border-gray-100 snap-center flex flex-col justify-between h-40 group hover:border-[#066CF4]/20 transition-all"
                >
                    <div className="size-12 rounded-2xl bg-gray-50 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110">
                        <stat.icon size={24} className="text-[#066CF4]" />
                    </div>
                    <div>
                        <div className="text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

export function CatalogueActionCards({ isProductBased }: { isProductBased: boolean }) {
    const actions = isProductBased ? [
        { label: 'Product Catalog', desc: 'Manage your full inventory, stock levels and pricing.', icon: ShoppingBag, href: '/dashboard/catalogue/products', color: 'bg-blue-50 text-[#066CF4]' },
        { label: 'Digital Menu', desc: 'Create a sleek, interactive view for dine-in customers.', icon: Utensils, href: '/dashboard/catalogue/menus', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Bulk Import', desc: 'Quickly upload your entire list via CSV or Excel.', icon: Upload, href: '/dashboard/catalogue/import', color: 'bg-indigo-50 text-indigo-600' },
    ] : [
        { label: 'Service Catalog', desc: 'Define your bookable services and time slots.', icon: Scissors, href: '/dashboard/catalogue/services', color: 'bg-purple-50 text-purple-600' },
        { label: 'Bookings', desc: 'Real-time appointment schedule and staff assignments.', icon: Clock, href: '/dashboard/catalogue/bookings', color: 'bg-amber-50 text-amber-600' },
        { label: 'Bulk Import', desc: 'Bring existing service lists via CSV or Excel.', icon: Upload, href: '/dashboard/catalogue/import', color: 'bg-indigo-50 text-indigo-600' },
    ];

    return (
        <section>
            <div className="flex items-center justify-between mb-6 px-1">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Setup Options</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {actions.map((act, i) => (
                    <Link key={i} href={act.href} className="group h-full">
                        <div className="flex flex-col items-center text-center gap-4 p-10 rounded-[2.5rem] bg-white border border-gray-100 shadow-sm transition-all hover:border-[#066CF4]/20 hover:shadow-xl hover:shadow-black/5 active:scale-[0.98] h-full">
                            <div className={cn("size-20 rounded-[2rem] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform mb-2", act.color)}>
                                <act.icon size={36} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black text-gray-900 mb-2">{act.label}</h3>
                                <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-tight max-w-[200px] mx-auto">{act.desc}</p>
                            </div>
                            <Button className="mt-8 w-full h-14 rounded-2xl bg-gray-900 text-[10px] font-black uppercase tracking-widest group-hover:bg-[#066CF4] transition-all shadow-xl shadow-black/5">
                                Configure {act.label.split(' ')[0]}
                            </Button>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
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
