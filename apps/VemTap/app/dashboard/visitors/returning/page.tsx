'use client';

import React, { useState } from 'react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import PageHeader from '@/components/dashboard/PageHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import EmptyState from '@/components/dashboard/EmptyState';
import CreateRewardModal from '@/components/dashboard/CreateRewardModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Visitor } from '@/services/visitors/types';
import { useReturningVisitors, useReturningVisitorStats } from '@/services/visitors/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { Reward } from '@/lib/store/mockDashboardStore';
import toast from 'react-hot-toast';
import SendMessageModal from '@/components/dashboard/SendMessageModal';
import VisitorDetailsModal from '@/components/dashboard/VisitorDetailsModal';
import { Repeat, Users, Star, AlertTriangle, Gift, Award, Send } from 'lucide-react';

export default function ReturningVisitorsPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedVisitorForMsg, setSelectedVisitorForMsg] = useState<Visitor | null>(null);
    const [selectedVisitorForDetails, setSelectedVisitorForDetails] = useState<Visitor | null>(null);
    const queryClient = useQueryClient();

    const userBranchId = useAuthStore((state) => state.user?.businessId);

    const { data: paginatedData, isLoading } = useReturningVisitors(userBranchId);
    const { data: statsData } = useReturningVisitorStats(userBranchId);

    const returningVisitors = paginatedData?.data || [];

    const createRewardMutation = useMutation({
        mutationFn: async (rewardData: Omit<Reward, 'id' | 'active'>) => {
            const newReward = {
                ...rewardData,
                active: true,
                branchId: userBranchId
            };
            return await api.post('/campaigns/rewards', newReward); // Assuming you'd have a reward post, mock it via API here for UI binding compatibility
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setIsCreateModalOpen(false);
            toast.success('Reward created successfully');
        }
    });

    const handleCreateReward = (rewardData: Omit<Reward, 'id' | 'active'>) => {
        createRewardMutation.mutate(rewardData);
    };

    const handleRewardVisitor = (visitor: Visitor) => {
        setSelectedVisitorForMsg(visitor);
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

    const columns: Column<Visitor>[] = [
        {
            header: 'Visitor',
            accessor: (item: Visitor) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-100">
                        {item.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                        <p className="font-bold text-text-main">{item.name}</p>
                        <p className="text-xs text-text-secondary">{item.phone}</p>
                    </div>
                </div>
            )
        },
        { header: 'Last Seen', accessor: (item: Visitor) => String(item.lastVisit || item.time || new Date().toISOString().split('T')[0]) },
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
                        handleRewardVisitor(item);
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
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm shadow-md shadow-primary/20"
                    >
                        <Gift size={18} />
                        Create Reward
                    </button>
                }
            />

            <CreateRewardModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateReward}
                isLoading={createRewardMutation.isPending}
            />

            <SendMessageModal
                isOpen={!!selectedVisitorForMsg}
                onClose={() => setSelectedVisitorForMsg(null)}
                recipientName={selectedVisitorForMsg?.name || ''}
                recipientPhone={selectedVisitorForMsg?.phone}
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
