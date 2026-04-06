'use client';

import React, { useState } from 'react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import PageHeader from '@/components/dashboard/PageHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import EmptyState from '@/components/dashboard/EmptyState';
import { RewardCreationModal } from '@/components/loyalty/admin/RewardCreationModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Reward, Visitor } from '@/services/visitors/types';
import { useReturningVisitors, useReturningVisitorStats } from '@/services/visitors/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils/date';
import SendMessageModal from '@/components/dashboard/SendMessageModal';
import MessagingChannelSelectorModal from '@/components/dashboard/MessagingChannelSelectorModal';
import VisitorDetailsModal from '@/components/dashboard/VisitorDetailsModal';
import { Repeat, Users, Star, AlertTriangle, Gift, Award, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReturningVisitorsPage() {
    const [isBulkMsgOpen, setIsBulkMsgOpen] = useState(false);
    const [selectedVisitorsForMsg, setSelectedVisitorsForMsg] = useState<Visitor[] | null>(null);
    const [selectedVisitorForDetails, setSelectedVisitorForDetails] = useState<Visitor | null>(null);
    const [showChannelSelector, setShowChannelSelector] = useState(false);
    const [isBulkChannelSelector, setIsBulkChannelSelector] = useState(false);
    const [selectedChannelForMsg, setSelectedChannelForMsg] = useState<'In-App' | 'WhatsApp' | 'SMS' | 'Email'>('In-App');
    const [allowedChannelsForMsg, setAllowedChannelsForMsg] = useState<Array<'In-App' | 'WhatsApp' | 'SMS' | 'Email'>>(['In-App', 'WhatsApp', 'SMS', 'Email']);

    const queryClient = useQueryClient();
    const { user, activeBranchId } = useAuthStore();
    const router = useRouter();

    const { data: paginatedData, isLoading } = useReturningVisitors();
    const { data: statsData } = useReturningVisitorStats();

    const returningVisitors = paginatedData?.data || [];

    const handleMessageVisitor = (visitor: Visitor) => {
        setSelectedVisitorsForMsg([visitor]);
        setIsBulkChannelSelector(false);
        setShowChannelSelector(true);
    };

    const handleSendMessageToAll = () => {
        if (returningVisitors.length > 0) {
            setIsBulkChannelSelector(true);
            setShowChannelSelector(true);
        } else {
            toast.error('No returning visitors to message');
        }
    };

    const handleSelectInApp = () => {
        setSelectedChannelForMsg('In-App');
        setAllowedChannelsForMsg(['In-App']);
        if (isBulkChannelSelector) {
            setIsBulkMsgOpen(true);
        }
        setShowChannelSelector(false);
    };

    const handleSelectExternal = () => {
        setSelectedChannelForMsg('WhatsApp');
        setAllowedChannelsForMsg(['WhatsApp', 'SMS', 'Email']);
        if (isBulkChannelSelector) {
            setIsBulkMsgOpen(true);
        }
        setShowChannelSelector(false);
    };

    const stats = statsData?.stats && statsData.stats.length > 0 ? statsData.stats.map(s => ({
        ...s,
        color: s.color as 'blue' | 'green' | 'purple' | 'red' | 'yellow',
        icon: s.icon === 'repeat' ? Repeat : s.icon === 'group' ? Users : s.icon === 'star' ? Star : AlertTriangle
    })) : [
        { label: 'Return Rate', value: '0%', icon: Repeat, color: 'blue' as const, trend: { value: '+0%', isUp: true } },
        { label: 'Repeat Count', value: returningVisitors.length.toString(), icon: Users, color: 'green' as const, trend: { value: '+0%', isUp: true } },
        { label: 'VIP Status', value: '0', icon: Star, color: 'yellow' as const, trend: { value: '+0%', isUp: true } },
        { label: 'Churn Risk', value: '0', icon: AlertTriangle, color: 'red' as const, trend: { value: '-0', isUp: true } },
    ];

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
                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-100 uppercase">
                            {displayName.split(' ').filter(Boolean).map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                            <p className="font-bold text-text-main">{displayName}</p>
                            <p className="text-xs text-text-secondary">{item.phone || 'No phone'}</p>
                        </div>
                    </div>
                );
            }
        },
        { header: 'Last Seen', accessor: (item: Visitor) => resolveDisplayDate(item) },
        {
            header: 'Level',
            accessor: (item: Visitor) => (
                <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700">
                    RETURNING
                </span>
            )
        },
        {
            header: 'Actions',
            accessor: (item: Visitor) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleMessageVisitor(item);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-primary-hover transition-colors"
                >
                    <Send size={14} />
                    Message
                </button>
            )
        }
    ];

    return (
        <div className="p-4 md:p-8">
            <PageHeader
                title="Returning Visitors"
                description="Monitor loyalty and reward your repeat customers"
                actions={
                    <button
                        onClick={handleSendMessageToAll}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm shadow-md shadow-primary/20"
                    >
                        <Send size={18} />
                        Send Message
                    </button>
                }
            />

            <SendMessageModal
                isOpen={isBulkMsgOpen}
                onClose={() => setIsBulkMsgOpen(false)}
                recipientName={`${returningVisitors.length} Returning Visitors`}
                visitors={returningVisitors}
                initialChannel={selectedChannelForMsg}
                allowedChannels={allowedChannelsForMsg}
                type="reward"
            />

            <MessagingChannelSelectorModal
                isOpen={showChannelSelector}
                onClose={() => {
                    setShowChannelSelector(false);
                    setSelectedVisitorsForMsg(null);
                }}
                onSelectInApp={handleSelectInApp}
                onSelectExternal={handleSelectExternal}
                recipientName={selectedVisitorsForMsg?.length === 1 
                    ? getVisitorDisplayName(selectedVisitorsForMsg[0]) 
                    : (selectedVisitorsForMsg && selectedVisitorsForMsg.length > 1 ? `${selectedVisitorsForMsg.length} Visitors` : '')}
            />

            <SendMessageModal
                isOpen={!!selectedVisitorsForMsg && !showChannelSelector}
                onClose={() => setSelectedVisitorsForMsg(null)}
                recipientName={selectedVisitorsForMsg?.length === 1 
                    ? getVisitorDisplayName(selectedVisitorsForMsg[0]) 
                    : (selectedVisitorsForMsg && selectedVisitorsForMsg.length > 1 ? `${selectedVisitorsForMsg.length} Visitors` : '')}
                recipientPhone={selectedVisitorsForMsg?.length === 1 ? selectedVisitorsForMsg[0].phone : undefined}
                recipientEmail={selectedVisitorsForMsg?.length === 1 ? selectedVisitorsForMsg[0].email : undefined}
                visitors={selectedVisitorsForMsg || undefined}
                initialChannel={selectedChannelForMsg}
                allowedChannels={allowedChannelsForMsg}
                type="reward"
            />

            <VisitorDetailsModal
                isOpen={!!selectedVisitorForDetails}
                onClose={() => setSelectedVisitorForDetails(null)}
                visitor={selectedVisitorForDetails as any}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <StatsCard key={index} {...(stat as any)} />
                ))}
            </div>

            <DataTable
                columns={columns}
                data={returningVisitors}
                isLoading={isLoading}
                onRowClick={(visitor) => setSelectedVisitorForDetails(visitor)}
                emptyState={
                    <EmptyState
                        icon="loop"
                        title="No returning visitors yet"
                        description="Focus on your welcome messages to encourage customers to return to your business."
                    />
                }
            />
        </div>
    );
}
