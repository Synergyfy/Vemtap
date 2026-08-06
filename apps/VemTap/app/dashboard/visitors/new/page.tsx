'use client';

import React, { useState } from 'react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import PageHeader from '@/components/dashboard/PageHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import EmptyState from '@/components/dashboard/EmptyState';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Visitor } from '@/services/visitors/types';
import { useNewVisitors, useNewVisitorStats, useVisitor } from '@/services/visitors/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { UserPlus, Calendar, TrendingUp, Timer, Send, Hand, Tag } from 'lucide-react';
import SendMessageModal from '@/components/dashboard/SendMessageModal';
import MessagingChannelSelectorModal from '@/components/dashboard/MessagingChannelSelectorModal';
import VisitorDetailsModal from '@/components/dashboard/VisitorDetailsModal';
import { formatDate } from '@/lib/utils/date';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

function NewVisitorJoinedCell({ visitor }: { visitor: Visitor }) {
    const { data: fullVisitor } = useVisitor(visitor.id);

    const resolveJoinedDate = (item: Visitor) => {
        const enhanced = item as Visitor & {
            firstSeen?: string;
            firstSeenDate?: string;
            createdAt?: string;
            updatedAt?: string;
            firstSeenAt?: string;
            firstVisitAt?: string;
            firstVisitDate?: string;
        };
        const timestampDate = typeof item.timestamp === 'number'
            ? new Date(item.timestamp < 1_000_000_000_000 ? item.timestamp * 1000 : item.timestamp)
            : null;
        const candidates: Array<string | Date | null | undefined> = [
            item.joinedDate,
            enhanced.firstSeen,
            enhanced.firstSeenDate,
            enhanced.firstSeenAt,
            enhanced.firstVisitAt,
            enhanced.firstVisitDate,
            enhanced.createdAt,
            timestampDate,
            item.lastVisit,
            item.time,
            enhanced.updatedAt,
        ];
        for (const candidate of candidates) {
            const formatted = formatDate(candidate);
            if (formatted !== 'N/A' && formatted !== 'Invalid Date') return formatted;
            if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
        }
        return 'Not provided';
    };

    return resolveJoinedDate((fullVisitor || visitor) as Visitor);
}

export default function NewVisitorsPage() {
    const queryClient = useQueryClient();
    const router = useRouter();

    const [isBulkMsgOpen, setIsBulkMsgOpen] = useState(false);
    const [selectedVisitorForMsg, setSelectedVisitorForMsg] = useState<Visitor | null>(null);
    const [selectedVisitorForDetails, setSelectedVisitorForDetails] = useState<Visitor | null>(null);
    const [showChannelSelector, setShowChannelSelector] = useState(false);
    const [isBulkChannelSelector, setIsBulkChannelSelector] = useState(false);
    const [selectedChannelForMsg, setSelectedChannelForMsg] = useState<'In-App' | 'WhatsApp' | 'SMS' | 'Email'>('In-App');
    const [allowedChannelsForMsg, setAllowedChannelsForMsg] = useState<Array<'In-App' | 'WhatsApp' | 'SMS' | 'Email'>>(['In-App', 'WhatsApp', 'SMS', 'Email']);

    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const { data: paginatedData, isLoading } = useNewVisitors();
    const { data: statsData } = useNewVisitorStats();

    const newVisitors = paginatedData?.data || [];

    const getVisitorDisplayName = (visitor: Visitor) => {
        return visitor.name ||
            (visitor.firstName || visitor.lastName
                ? `${visitor.firstName || ''} ${visitor.lastName || ''}`.trim()
                : 'Unknown Visitor');
    };
    
    const handleWelcomeVisitor = (visitor: Visitor) => {
        setSelectedVisitorForMsg(visitor);
        setIsBulkChannelSelector(false);
        setShowChannelSelector(true);
    };

    const handleSendWelcomeMessage = () => {
        if (newVisitors.length > 0) {
            setIsBulkChannelSelector(true);
            setShowChannelSelector(true);
        } else {
            toast.error('No new visitors to send welcome message to');
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
        icon: s.icon === 'person_add'
            ? UserPlus
            : s.icon === 'calendar'
                ? Calendar
                : s.icon === 'trending_up'
                    ? TrendingUp
                    : s.icon === 'tag'
                        ? Tag
                        : Timer
    })) : [];

    const columns: Column<Visitor>[] = [
        {
            header: 'Visitor',
            accessor: (item: Visitor) => {
                const displayName = getVisitorDisplayName(item);

                return (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-green-600 font-bold text-xs border border-green-100 uppercase">
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
        { header: 'Joined', accessor: (item: Visitor) => <NewVisitorJoinedCell visitor={item} /> },
        {
            header: 'Status',
            accessor: () => (
                <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-700">
                    NEW
                </span>
            )
        },
        {
            header: 'Actions',
            accessor: (item: Visitor) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleWelcomeVisitor(item);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-primary-hover transition-colors"
                >
                    <Hand size={14} />
                    Welcome
                </button>
            )
        }
    ];

    return (
        <div className="p-4 md:p-8">
            <PageHeader
                title="New Visitors"
                description="Identify and welcome your first-time customers"
                actions={
                    <button
                        onClick={handleSendWelcomeMessage}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm shadow-md shadow-primary/20"
                    >
                        <Send size={18} />
                        Send Welcome Message
                    </button>
                }
            />

            <SendMessageModal
                isOpen={isBulkMsgOpen}
                onClose={() => setIsBulkMsgOpen(false)}
                recipientName={`${newVisitors.length} New Visitors`}
                visitors={newVisitors}
                initialChannel={selectedChannelForMsg}
                allowedChannels={allowedChannelsForMsg}
                type="welcome"
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
                type="welcome"
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
                data={newVisitors}
                isLoading={isLoading}
                onRowClick={(visitor) => setSelectedVisitorForDetails(visitor)}
                emptyState={
                    <EmptyState
                        icon="person_add"
                        title="Your first new visitor is just around the corner"
                        description="Every returning customer was once a new visitor. Keep your welcome messages ready!"
                    />
                }
            />
        </div>
    );
}
