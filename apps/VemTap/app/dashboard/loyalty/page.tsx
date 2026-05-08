"use client";

import React from 'react';
import Link from 'next/link';
import PageHeader from '@/components/dashboard/PageHeader';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';
import { LoyaltyAnalytics } from '@/components/loyalty/admin/LoyaltyAnalytics';
import { Gift, Users, Settings, Smartphone, ArrowRight, ExternalLink, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import LoyaltyMobileHub from '@/components/dashboard/LoyaltyMobileHub';

const QUICK_LINKS = [
    {
        title: 'Manage Rewards',
        description: 'Create and edit your loyalty catalog items.',
        href: '/dashboard/loyalty/rewards',
        icon: Gift,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
    },
    {
        title: 'Customer Directory',
        description: 'View and manage your loyal customer base.',
        href: '/dashboard/loyalty/customers',
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
    },
    {
        title: 'Process Redemption',
        description: 'Verify codes or generate promo vouchers.',
        href: '/dashboard/loyalty/redeem',
        icon: Ticket,
        color: 'text-rose-600',
        bgColor: 'bg-rose-50'
    },
    {
        title: 'Program Settings',
        description: 'Configure points ratios and tier rules.',
        href: '/dashboard/loyalty/settings',
        icon: Settings,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
    },
    {
        title: 'Tap Verification',
        description: 'Verify recent customer taps and visits.',
        href: '/dashboard/loyalty/verify',
        icon: Smartphone,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
    }
];

export default function LoyaltyOverviewPage() {
    return (
        <div className="p-4 md:p-8 space-y-8 md:space-y-10">
            <PageHeader
                title="Loyalty Overview"
                description="Monitor and manage your business loyalty ecosystem"
            />

            {/* Mobile Hub View */}
            <LoyaltyMobileHub />

            {/* Analytics Section */}
            <section className="hidden md:block space-y-4 md:space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg md:text-xl font-display font-bold text-slate-900 uppercase tracking-tight">System Performance</h2>
                    <Link href="/dashboard/analytics" className="text-[10px] md:text-xs font-bold text-primary hover:underline flex items-center gap-1 uppercase tracking-wider">
                        Detailed Reports
                        <ExternalLink className="size-3" />
                    </Link>
                </div>
                <LoyaltyAnalytics />
            </section>

            {/* Management Quick Links */}
            <section className="hidden md:block space-y-4 md:space-y-6 pt-8 md:pt-10 border-t border-slate-100">
                <h2 className="text-lg md:text-xl font-display font-bold text-slate-900 uppercase tracking-tight">Management Suite</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {QUICK_LINKS.map((link) => (
                        <Link
                            key={link.title}
                            href={link.href}
                            className="group p-5 md:p-6 bg-white border border-slate-200 hover:border-primary transition-all shadow-sm hover:shadow-md relative overflow-hidden rounded-2xl" 
                        >
                            <div className={cn("size-10 md:size-12 flex items-center justify-center mb-3 md:mb-4 transition-colors rounded-xl", link.bgColor, link.color, "group-hover:bg-primary group-hover:text-white")}>
                                <link.icon size={20} className="md:size-6" />
                            </div>
                            <h3 className="font-bold text-sm md:text-base text-slate-900 mb-1.5 md:mb-2 group-hover:text-primary transition-colors">{link.title}</h3>
                            <p className="text-[10px] md:text-xs text-slate-500 leading-relaxed mb-4 md:mb-6">{link.description}</p>

                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                                Access Tool
                                <ArrowRight className="w-3 h-3" />
                            </div>

                            {/* Background Decoration */}
                            <div className="absolute -bottom-4 -right-4 w-12 md:w-16 h-12 md:h-16 bg-slate-50 rounded-full opacity-50 group-hover:bg-primary/5 transition-colors" />
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
