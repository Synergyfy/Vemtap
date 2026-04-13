'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import PageHeader from '@/components/dashboard/PageHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import EmptyState from '@/components/dashboard/EmptyState';
import { useVisitors, useVisitorStats } from '@/services/visitors/hooks';
import { Visitor } from '@/services/visitors/types';
import { Users, UserPlus, Repeat, Star, Search, Download, MoreVertical, Send, Gift, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils/date';
import SendMessageModal from '@/components/dashboard/SendMessageModal';
import MessagingChannelSelectorModal from '@/components/dashboard/MessagingChannelSelectorModal';
import VisitorDetailsModal from '@/components/dashboard/VisitorDetailsModal';
import { exportToCSV } from '@/lib/utils/export';
import { useDebounce } from '@/hooks/useDebounce';
import SudoActionGuard from '@/components/shared/SudoActionGuard';

export default function VisitorsOverviewPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedVisitorForMsg, setSelectedVisitorForMsg] = useState<Visitor | null>(null);
    const [selectedVisitorForDetails, setSelectedVisitorForDetails] = useState<Visitor | null>(null);
    const [showChannelSelector, setShowChannelSelector] = useState(false);
    const [selectedChannelForMsg, setSelectedChannelForMsg] = useState<'In-App' | 'WhatsApp' | 'SMS' | 'Email'>('In-App');
    const [allowedChannelsForMsg, setAllowedChannelsForMsg] = useState<Array<'In-App' | 'WhatsApp' | 'SMS' | 'Email'>>(['In-App', 'WhatsApp', 'SMS', 'Email']);

    const debouncedSearch = useDebounce(searchQuery, 400);

    const { data: paginatedData, isLoading: isLoadingVisitors } = useVisitors(undefined, {
        search: debouncedSearch,
        status: filterStatus !== 'all' ? filterStatus : undefined
    });
    const { data: statsData } = useVisitorStats();

    const visitors = paginatedData?.data || [];
    const isLoading = isLoadingVisitors;

    const handleExportCSV = () => {
        const csvContent = [
            ['Name', 'Phone', 'Status', 'Last Visit'],
            ...visitors.map((v: Visitor) => [getVisitorDisplayName(v), v.phone || 'Not provided', v.status || 'Active', resolveDisplayDate(v)])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `visitors_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('Report exported successfully!');
    };

    const stats = statsData?.stats && statsData.stats.length > 0 ? statsData.stats.map(s => ({
        ...s,
        color: s.color as any,
        // Map backend string icon names to Lucide components
        icon: s.icon === 'group' ? Users : s.icon === 'person_add' ? UserPlus : s.icon === 'repeat' ? Repeat : Star
    })) : [
        { label: 'Total Visitors', value: visitors.length.toString(), icon: Users, color: 'blue' as const, trend: { value: '+0%', isUp: true } },
        { label: 'New This Month', value: visitors.filter(v => v.status === 'New' || v.status === 'new').length.toString(), icon: UserPlus, color: 'green' as const, trend: { value: '+0%', isUp: true } },
        { label: 'Returning', value: visitors.filter(v => v.status === 'Returning' || v.status === 'returning').length.toString(), icon: Repeat, color: 'purple' as const, trend: { value: '+0%', isUp: true } },
        { label: 'VIP Members', value: visitors.filter(v => v.status === 'VIP' || v.status === 'vip').length.toString(), icon: Star, color: 'yellow' as const, trend: { value: '+0%', isUp: true } },
    ];

    const filteredVisitors = visitors; // Server handles filtering now via useVisitors query param hook params payload

    const handleSelectInApp = () => {
        if (selectedVisitorForMsg) {
            setSelectedChannelForMsg('In-App');
            setAllowedChannelsForMsg(['In-App']);
            setShowChannelSelector(false);
        }
    };

    const handleSelectExternal = () => {
        if (selectedVisitorForMsg) {
            setSelectedChannelForMsg('WhatsApp'); // Default external to WhatsApp
            setAllowedChannelsForMsg(['WhatsApp', 'SMS', 'Email']);
            setShowChannelSelector(false);
        }
    };

    const getVisitorDisplayName = (visitor: Visitor) => {
        return visitor.name ||
            (visitor.firstName || visitor.lastName
                ? `${visitor.firstName || ''} ${visitor.lastName || ''}`.trim()
                : 'Unknown Visitor');
    };

    const resolveDisplayDate = (item: Visitor) => {
        const timestampDate = typeof item.timestamp === 'number'
            ? new Date(item.timestamp < 1_000_000_000_000 ? item.timestamp * 1000 : item.timestamp)
            : null;
        const candidates: Array<string | Date | null | undefined> = [item.lastVisit, item.time, item.joinedDate, timestampDate];
        for (const candidate of candidates) {
            const formatted = formatDate(candidate);
            if (formatted !== 'N/A' && formatted !== 'Invalid Date') return formatted;
            if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
        }
        return 'Not provided';
    };

    const columns: Column<Visitor>[] = [
        {
            header: 'Visitor',
            accessor: (item: Visitor) => {
                const displayName = getVisitorDisplayName(item);
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                            {displayName.split(' ').filter(Boolean).map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                            <p className="font-bold text-text-main">{displayName}</p>
                            <p className="text-[10px] text-text-secondary font-medium tracking-tight uppercase">ID: {(item.id || '      ').substr(0, 6)}</p>
                        </div>
                    </div>
                );
            }
        },
        { header: 'Contact', accessor: 'phone' },
        { header: 'Email', accessor: 'email', },
        { header: 'Last Visit', accessor: (item: Visitor) => resolveDisplayDate(item) },
        {
            header: 'Status',
            accessor: (item: Visitor) => (
                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${item.status?.toLowerCase() === 'new' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                    {item.status || 'Active'}
                </span>
            )
        },
        {
            header: 'Actions',
            accessor: (item: Visitor) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVisitorForMsg(item);
                            setShowChannelSelector(true);
                        }}
                        className="p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                        title="Quick Message"
                    >
                        <Send size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="p-4 md:p-8">
            <PageHeader
                title="Visitors Overview"
                description="Monitor your customer footfall and engagement levels"
                actions={
                    <div className="flex items-center gap-3">
                        <SudoActionGuard action="Exporting visitor data">
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-text-main font-bold rounded-xl hover:bg-gray-50 transition-all text-sm shadow-sm"
                            >
                                <Download size={18} />
                                Export
                            </button>
                        </SudoActionGuard>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <StatsCard key={index} {...(stat as any)} />
                ))}
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search visitors..."
                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-5 font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    className="h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="all">All Status</option>
                    <option value="new">New</option>
                    <option value="returning">Returning</option>
                    <option value="vip">VIP Only</option>
                </select>
            </div>

            <DataTable
                columns={columns}
                data={filteredVisitors}
                isLoading={isLoading}
                onRowClick={(visitor) => setSelectedVisitorForDetails(visitor)}
                emptyState={
                    <EmptyState
                        icon="people"
                        title="No visitors activity"
                        description="Visitor activity will appear here after customers tap your live NFC devices."
                    />
                }
            />

            <MessagingChannelSelectorModal
                isOpen={showChannelSelector}
                onClose={() => {
                    setShowChannelSelector(false);
                    setSelectedVisitorForMsg(null);
                }}
                onSelectInApp={handleSelectInApp}
                onSelectExternal={handleSelectExternal}
                recipientName={selectedVisitorForMsg ? getVisitorDisplayName(selectedVisitorForMsg) : ''}
            />

            <SendMessageModal
                isOpen={!!selectedVisitorForMsg && !showChannelSelector}
                onClose={() => setSelectedVisitorForMsg(null)}
                recipientName={selectedVisitorForMsg ? getVisitorDisplayName(selectedVisitorForMsg) : ''}
                recipientPhone={selectedVisitorForMsg?.phone}
                recipientEmail={selectedVisitorForMsg?.email}
                visitors={selectedVisitorForMsg ? [selectedVisitorForMsg] : undefined}
                initialChannel={selectedChannelForMsg}
                allowedChannels={allowedChannelsForMsg}
                type="general"
            />

            <VisitorDetailsModal
                isOpen={!!selectedVisitorForDetails}
                onClose={() => setSelectedVisitorForDetails(null)}
                visitor={selectedVisitorForDetails as any}
            />
        </div>
    );
}
