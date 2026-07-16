'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Store, Tag, MousePointerClick, Handshake, FileText, Settings } from 'lucide-react';
import Logo from '@/components/brand/Logo';

const tabs = [
    { href: '/admin/discovery/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/discovery/businesses', label: 'Businesses', icon: Store },
    { href: '/admin/discovery/offers', label: 'Offers', icon: Tag },
    { href: '/admin/discovery/referrals', label: 'Referrals', icon: MousePointerClick },
    { href: '/admin/discovery/partnerships', label: 'Partnerships', icon: Handshake },
    { href: '/admin/discovery/reports', label: 'Reports', icon: FileText },
    { href: '/admin/discovery/settings', label: 'Settings', icon: Settings },
];

export default function DiscoveryNav({ current }: { current: string }) {
    return (
        <div className="mb-8">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                        <Logo iconSize={24} className="flex items-center justify-center" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">VemTap Admin</p>
                </div>
                <h1 className="text-3xl font-display font-bold text-text-main">Discovery Network Control</h1>
                <p className="text-sm font-medium text-text-secondary mt-1">
                    Manage participating businesses, offers, referrals, and attribution analytics.
                </p>
            </div>

            <div className="overflow-x-auto pb-1">
                <div className="inline-flex gap-1.5 rounded-2xl bg-white border border-gray-200 p-1.5 min-w-max">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    'px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all',
                                    current === tab.href
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'text-text-secondary hover:text-text-main hover:bg-gray-50',
                                )}
                            >
                                <Icon size={14} />
                                {tab.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
