'use client';

import React from 'react';
import Link from 'next/link';
import { 
    Home, Users, MessageCircle, MessageSquare, Gift, 
    ShoppingBag, BarChart, FileText, QrCode, Zap, Settings,
    UserPlus, History, Smartphone, Globe
} from 'lucide-react';
import { useActiveBranch } from '@/hooks/useActiveBranch';

export default function MobileDashboardHub() {
    const { getLinkWithBranch } = useActiveBranch();

    const sections = [
        { label: 'Dashboard', icon: Home, href: '/dashboard?show_stats=1', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Visitors', icon: Users, href: '/dashboard/visitors', color: 'bg-teal-50 text-teal-600' },
        { label: 'In-App Chat', icon: MessageCircle, href: '/dashboard/messaging/chat', color: 'bg-blue-50 text-blue-600' },
        { label: 'Channels', icon: MessageSquare, href: '/dashboard/messaging', color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Loyalty', icon: Gift, href: '/dashboard/loyalty', color: 'bg-amber-50 text-amber-600' },
        { label: 'Catalogue', icon: ShoppingBag, href: '/dashboard/catalogue', color: 'bg-rose-50 text-rose-600' },
        { label: 'Advanced Analytics', icon: BarChart, href: '/dashboard/analytics', color: 'bg-cyan-50 text-cyan-600' },
        { label: 'Manage Forms', icon: FileText, href: '/dashboard/engagement/forms', color: 'bg-orange-50 text-orange-600' },
        { label: 'Explore QRThrive', icon: QrCode, href: '/dashboard/explore-qrthrive', color: 'bg-purple-50 text-purple-600' },
        { label: 'Customer Experience', icon: Zap, href: '/dashboard/customer-experience', color: 'bg-yellow-50 text-yellow-600' },
        { label: 'Settings', icon: Settings, href: '/dashboard/settings', color: 'bg-slate-50 text-slate-600' },
    ];

    return (
        <div className="lg:hidden w-full px-4 pb-12">
            {/* Sections Grid */}
            <div className="grid grid-cols-2 gap-4">
                {sections.map((section) => {
                    const SectionIcon = section.icon;
                    return (
                        <Link 
                            key={section.href}
                            href={getLinkWithBranch(section.href)}
                            className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-start gap-4 active:scale-95 transition-all"
                        >
                            <div className={`p-3 ${section.color} rounded-2xl shadow-sm`}>
                                <SectionIcon size={22} />
                            </div>
                            <span className="text-xs font-black text-gray-900 leading-tight">
                                {section.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
