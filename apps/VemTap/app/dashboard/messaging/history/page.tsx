'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import { useMessagingCampaigns } from '@/services/messaging/hooks';
import { Campaign } from '@/services/messaging/types';
import { Send, Clock, MessageSquare, Phone, Mail, CreditCard, History } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
    { label: 'SMS', href: '/dashboard/messaging/sms', icon: MessageSquare },
    { label: 'WhatsApp', href: '/dashboard/messaging/whatsapp', icon: Phone },
    { label: 'Email', href: '/dashboard/messaging/email', icon: Mail },
    { label: 'Credits', href: '/dashboard/messaging/credits', icon: CreditCard },
    { label: 'History', href: '/dashboard/messaging/history', icon: History },
];

export default function MessageHistoryPage() {
    const pathname = usePathname();
    const { data: campaigns, isLoading } = useMessagingCampaigns();
    const broadcasts = campaigns || [];

    const columns: Column<Campaign>[] = [
        {
            header: 'Message Name',
            accessor: (item: Campaign) => (
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.channel === 'WHATSAPP' || item.channel === 'WhatsApp' ? 'bg-green-50 text-green-600' :
                        item.channel === 'SMS' ? 'bg-blue-50 text-blue-600' :
                            'bg-purple-50 text-purple-600'
                        }`}>
                        <Send size={16} />
                    </div>
                    <span className="font-bold text-text-main">{item.name}</span>
                </div>
            )
        },
        { header: 'Channel', accessor: 'channel' },
        {
            header: 'Audience',
            accessor: (item: Campaign) => `${(item.audienceSize || 0).toLocaleString()} users`
        },
        {
            header: 'Status',
            accessor: (item: Campaign) => (
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${item.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    item.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                    }`}>
                    {item.status}
                </span>
            )
        },
        {
            header: 'Date',
            accessor: (item: Campaign) => {
                const ts = item.sentAt || item.createdAt;
                return ts ? new Date(ts).toLocaleDateString() : '—';
            }
        }
    ];

    return (
        <div className="p-4 md:p-8 space-y-6">
            {/* Compact Header */}
            <div>
                <h1 className="text-2xl font-black text-text-main tracking-tight">Messaging</h1>
                <p className="text-sm text-text-secondary font-medium">Reach your customers across SMS, WhatsApp, and Email.</p>
            </div>

            {/* Channel Tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {TABS.map(tab => {
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all',
                                isActive
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                            )}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </Link>
                    );
                })}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <DataTable
                    columns={columns}
                    data={broadcasts}
                    isLoading={isLoading}
                    emptyState={
                        <div className="text-center py-20">
                            <Clock size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-bold text-text-main">No history yet</h3>
                            <p className="text-text-secondary text-sm">Your sent messages will appear here.</p>
                        </div>
                    }
                />
            </div>
        </div>
    );
}
