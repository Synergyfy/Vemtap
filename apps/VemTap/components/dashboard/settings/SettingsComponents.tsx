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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                    <SettingsIcon size={28} />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-2">Configuration</p>
                    <h1 className="text-2xl font-black text-gray-900 leading-none">Settings</h1>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Badge className="h-12 px-6 rounded-2xl bg-white border border-gray-100 text-gray-900 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm">
                    Account Status: <span className="text-emerald-500">Verified</span>
                </Badge>
            </div>
        </div>
    );
}

export function BusinessProfileCard({ business }: { business: any }) {
    return (
        <div className="rounded-[2.5rem] bg-white p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8 mb-12 group hover:border-[#066CF4]/20 transition-all">
            <div className="flex items-center gap-8">
                <div className="size-24 rounded-[2rem] bg-gray-50 flex items-center justify-center shadow-sm border border-gray-100 overflow-hidden transition-transform group-hover:scale-105">
                    {business?.logoUrl ? <img src={business.logoUrl} className="size-full object-cover" /> : <Building2 size={40} className="text-gray-300" />}
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#066CF4] mb-2">{business?.category || 'Business Category'}</p>
                    <h2 className="text-2xl font-black text-gray-900 leading-none mb-4">{business?.name || 'Your Business'}</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
                            <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Active
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Member Since 2024</span>
                    </div>
                </div>
            </div>
            <Button variant="outline" className="h-14 px-8 rounded-2xl border-gray-100 font-black text-[10px] uppercase tracking-widest text-gray-900 hover:bg-gray-50 active:scale-95 transition-all">
                Update Profile
            </Button>
        </div>
    );
}

export function SettingsNavigationCards() {
    const { setActiveTab } = useSettingsStore();

    const sections = [
        { id: 'profile', label: 'Profile Settings', desc: 'Manage your business profile, logo and contact info.', icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'team', label: 'Team Members', desc: 'Add staff and manage their access permissions.', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
        { id: 'subscription', label: 'Subscription', desc: 'Manage your plan, limits and active features.', icon: LayoutGrid, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'billing', label: 'Billing & History', desc: 'Download invoices and update payment methods.', icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'notifications', label: 'Notifications', desc: 'Configure email and WhatsApp alert preferences.', icon: Bell, color: 'text-rose-600', bg: 'bg-rose-50' },
        { id: 'security', label: 'Account Security', desc: 'Update password and manage authentication.', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((sec, i) => (
                <motion.button
                    key={sec.id}
                    onClick={() => setActiveTab(sec.id as SettingsTab)}
                    whileHover={{ y: -5 }}
                    className="group flex flex-col gap-6 p-8 rounded-[2.5rem] bg-white border border-gray-100 shadow-sm transition-all hover:border-[#066CF4]/20 hover:shadow-xl hover:shadow-black/5 active:scale-[0.98] text-left h-full"
                >
                    <div className={cn("size-16 rounded-[2rem] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform", sec.bg)}>
                        <sec.icon size={32} className={sec.color} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-gray-900 mb-2">{sec.label}</h3>
                        <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-tight">{sec.desc}</p>
                    </div>
                </motion.button>
            ))}
        </div>
    );
}

import { Settings as SettingsIcon } from 'lucide-react';
