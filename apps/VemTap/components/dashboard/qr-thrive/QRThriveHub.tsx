'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    QrCode, Scan, Activity, Users, TrendingUp, 
    Plus, BarChart3, List, Download, Globe,
    FileText, Video, Utensils, MessageSquare, 
    Wifi, Ticket, Calendar, Building2, Smartphone,
    ImageIcon, ChevronRight, ArrowRight, Star
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useQrThriveStore } from '@/store/useQrThriveStore';

export function QRThriveOverviewHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900 leading-tight">QRThrive</h1>
                <p className="text-sm font-medium text-gray-500 mt-1">
                    Create powerful dynamic QR experiences for your customers.
                </p>
            </div>
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                    <Plus size={22} className="text-gray-600" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                    <BarChart3 size={22} className="text-gray-600" />
                </Button>
            </div>
        </div>
    );
}

export function QRThriveMetrics() {
    const stats = [
        { label: 'QR Experiences', value: '42', icon: QrCode, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Total Scans', value: '18.2k', icon: Scan, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Active QRs', value: '35', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Conversions', value: '2.4k', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Engagement', value: '68%', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
    ];

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
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</div>
                </motion.div>
            ))}
        </div>
    );
}

export function QRThriveQuickActions() {
    const { setView } = useQrThriveStore();
    
    const actions = [
        { label: 'Create New QR', icon: Plus, action: () => setView('create'), color: 'bg-[#066CF4] text-white' },
        { label: 'View Analytics', icon: BarChart3, action: () => setView('analytics'), color: 'bg-white text-gray-900' },
        { label: 'Manage QRs', icon: List, action: () => setView('manage'), color: 'bg-white text-gray-900' },
        { label: 'Download Assets', icon: Download, action: () => {}, color: 'bg-white text-gray-900' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {actions.map((act, i) => (
                <button
                    key={i}
                    onClick={act.action}
                    className={cn(
                        "flex items-center gap-4 p-6 rounded-[32px] shadow-sm border border-gray-100 transition-all hover:shadow-xl active:scale-[0.98]",
                        act.color
                    )}
                >
                    <div className={cn("size-12 rounded-2xl flex items-center justify-center", act.color.includes('white') ? 'bg-gray-50' : 'bg-white/20')}>
                        <act.icon size={24} />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest">{act.label}</span>
                </button>
            ))}
        </div>
    );
}

export function QRThriveCategoriesGrid() {
    const categories = [
        { id: 'url', label: 'Website QR', desc: 'Link to any URL.', icon: Globe, color: 'bg-blue-50 text-blue-600' },
        { id: 'pdf', label: 'PDF QR', desc: 'Brochures & Menus.', icon: FileText, color: 'bg-emerald-50 text-emerald-600' },
        { id: 'video', label: 'Video QR', desc: 'Direct video link.', icon: Video, color: 'bg-purple-50 text-purple-600' },
        { id: 'menu', label: 'Digital Menu', desc: 'Interactive ordering.', icon: Utensils, color: 'bg-amber-50 text-amber-600' },
        { id: 'whatsapp', label: 'WhatsApp QR', desc: 'Instant chat links.', icon: MessageSquare, color: 'bg-green-50 text-green-600' },
        { id: 'wifi', label: 'WiFi QR', desc: 'Auto WiFi connect.', icon: Wifi, color: 'bg-indigo-50 text-indigo-600' },
        { id: 'coupon', label: 'Coupon QR', desc: 'Limited offers.', icon: Ticket, color: 'bg-rose-50 text-rose-600' },
        { id: 'event', label: 'Event QR', desc: 'Event registration.', icon: Calendar, color: 'bg-orange-50 text-orange-600' },
        { id: 'business', label: 'Business QR', desc: 'Profile & contact.', icon: Building2, color: 'bg-cyan-50 text-cyan-600' },
        { id: 'social', label: 'Social Media', desc: 'All your links.', icon: Smartphone, color: 'bg-pink-50 text-pink-600' },
        { id: 'app', label: 'App Download', desc: 'App store links.', icon: Download, color: 'bg-teal-50 text-teal-600' },
        { id: 'gallery', label: 'Image Gallery', desc: 'Photo experiences.', icon: ImageIcon, color: 'bg-violet-50 text-violet-600' },
    ];

    const { setSelectedType, setView } = useQrThriveStore();

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                Experience Categories
                <span className="h-0.5 flex-1 bg-gray-100" />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => {
                            setSelectedType(cat.id as any);
                            setView('create');
                        }}
                        className="group flex flex-col items-center text-center gap-4 p-8 rounded-[40px] bg-white border border-gray-100 shadow-sm transition-all hover:border-[#066CF4]/20 hover:shadow-xl active:scale-95"
                    >
                        <div className={cn("size-16 rounded-[22px] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform", cat.color)}>
                            <cat.icon size={32} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-gray-900">{cat.label}</h3>
                            <p className="text-[10px] font-medium text-gray-400 mt-1">{cat.desc}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

export function QRThriveLeaderboard() {
    return (
        <div className="rounded-[40px] bg-gray-900 p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#066CF4]/20 rounded-full blur-3xl -mr-32 -mt-32" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-10 rounded-xl bg-[#066CF4] flex items-center justify-center">
                            <Star size={20} fill="white" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-widest">Top Performing QR</h3>
                    </div>
                    <h2 className="text-3xl font-black mb-2">Summer Menu 2024</h2>
                    <p className="text-sm font-medium text-white/50 mb-8 max-w-sm">Generating 4x more scans than average. High conversion to orders in Victoria Island.</p>
                    
                    <div className="flex gap-8">
                        <div>
                            <p className="text-2xl font-black">4.2k</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Total Scans</p>
                        </div>
                        <div className="border-l border-white/10 pl-8">
                            <p className="text-2xl font-black text-emerald-400">82%</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Conversion</p>
                        </div>
                    </div>
                </div>

                <div className="relative p-6 bg-white rounded-[40px] shadow-2xl rotate-3">
                    <QrCode size={120} className="text-gray-900" />
                    <div className="absolute -bottom-4 -left-4 bg-emerald-500 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                        Trending 🔥
                    </div>
                </div>
            </div>
        </div>
    );
}
