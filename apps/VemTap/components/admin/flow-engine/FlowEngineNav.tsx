'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Activity, Settings, Bot, FileCode2, Gauge, Logs, PlayCircle } from 'lucide-react';
import Logo from '@/components/brand/Logo';

const tabs = [
    { href: '/admin/flow-engine', label: 'Overview', icon: Gauge },
    { href: '/admin/flow-engine/templates', label: 'Flow Templates', icon: FileCode2 },
    { href: '/admin/flow-engine/triggers', label: 'Trigger Management', icon: Bot },
    { href: '/admin/flow-engine/settings', label: 'WhatsApp Settings', icon: Settings },
    { href: '/admin/flow-engine/sessions', label: 'Sessions Monitor', icon: PlayCircle },
    { href: '/admin/flow-engine/logs', label: 'Logs & Errors', icon: Logs },
    { href: '/admin/flow-engine/analytics', label: 'System Analytics', icon: Activity },
];

export default function FlowEngineNav({ current }: { current: string }) {
    return (
        <div className="mb-8">
            <div className="mb-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                        <Logo iconSize={24} className="flex items-center justify-center" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">VemTap Admin</p>
                </div>
                <h1 className="text-3xl font-display font-bold text-text-main">WhatsApp Flow Engine</h1>
                <p className="text-sm font-medium text-text-secondary mt-1">
                    Template control center with mocked data before API integration.
                </p>
            </div>

            <div className="overflow-x-auto pb-1">
                <div className="inline-flex gap-2 rounded-2xl bg-white border border-gray-200 p-2 min-w-max">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    'px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all',
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
