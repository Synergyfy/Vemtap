'use client';

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import { useMessagingCampaigns } from '@/services/messaging/hooks';
import { Campaign } from '@/services/messaging/types';
import { Send, Clock } from 'lucide-react';

export default function MessageHistoryPage() {
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
        <div className="p-4 md:p-8">
            <PageHeader
                title="Message History"
                description="View all previous broadcasts sent to your customers"
            />

            <div className="mt-8">
                <DataTable
                    columns={columns}
                    data={broadcasts}
                    isLoading={isLoading}
                    emptyState={
                        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
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
