'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    User, Users, CreditCard, Bell, 
    ShieldCheck, HelpCircle, Building2, ChevronRight,
    LayoutGrid
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSettingsStore, SettingsTab } from '@/store/useSettingsStore';
import Link from 'next/link';

export function SettingsOverviewHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900 leading-tight">Business Settings</h1>
                <p className="text-sm font-medium text-gray-500 mt-1">
                    Manage your Vemtap account and business preferences.
                </p>
            </div>
        </div>
    );
}

export function BusinessProfileCard({ business }: { business: any }) {
    return (
        <div className="rounded-[40px] bg-white p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <div className="flex items-center gap-6">
                <div className="size-24 rounded-[32px] bg-gray-50 flex items-center justify-center shadow-sm border border-gray-100 overflow-hidden">
                    {business?.logo ? <img src={business.logo} className="size-full object-cover" /> : <Building2 size={32} className="text-gray-300" />}
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-900">{business?.name || 'Your Business'}</h2>
                    <p className="text-xs font-bold text-[#066CF4] uppercase tracking-widest mt-1">{business?.category || 'Business Category'}</p>
                    <div className="flex items-center gap-3 mt-3">
                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase px-3 py-1">Active</Badge>
                        <span className="text-[10px] font-medium text-gray-400">Joined Oct 2024</span>
                    </div>
                </div>
            </div>
            <Button variant="outline" className="h-14 px-8 rounded-2xl border-gray-100 font-black text-[10px] uppercase tracking-widest text-[#066CF4]">
                View Full Profile
            </Button>
        </div>
    );
}

export function SettingsNavigationCards() {
    const { setActiveTab } = useSettingsStore();

    const sections = [
        { id: 'profile', label: 'Profile Settings', icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'team', label: 'Team Members', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
        { id: 'subscription', label: 'Subscription', icon: LayoutGrid, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'billing', label: 'Billing', icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'notifications', label: 'Notifications', icon: Bell, color: 'text-rose-600', bg: 'bg-rose-50' },
        { id: 'security', label: 'Security', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((sec, i) => (
                <motion.button
                    key={sec.id}
                    onClick={() => setActiveTab(sec.id as SettingsTab)}
                    whileHover={{ y: -5 }}
                    className="flex flex-col gap-4 p-8 rounded-[32px] bg-white border border-gray-100 shadow-sm transition-all hover:border-[#066CF4]/20 hover:shadow-xl hover:shadow-black/5 active:scale-95 text-left"
                >
                    <div className={cn("size-16 rounded-2xl flex items-center justify-center shadow-sm", sec.bg)}>
                        <sec.icon size={28} className={sec.color} />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-gray-900">{sec.label}</h3>
                    </div>
                </motion.button>
            ))}
        </div>
    );
}
