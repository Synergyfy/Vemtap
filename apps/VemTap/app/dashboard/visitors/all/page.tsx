'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Visitor } from '@/services/visitors/types';
import { useVisitors, useVisitorStats } from '@/services/visitors/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { useBranches } from '@/services/branches/hooks';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import PageHeader from '@/components/dashboard/PageHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import EmptyState from '@/components/dashboard/EmptyState';
import AddVisitorModal, { VisitorFormData } from '@/components/dashboard/AddVisitorModal';
import SendMessageModal from '@/components/dashboard/SendMessageModal';
import DeleteConfirmationModal from '@/components/dashboard/DeleteConfirmationModal';
import VisitorDetailsModal from '@/components/dashboard/VisitorDetailsModal';
import PreviewRewardModal from '@/components/dashboard/PreviewRewardModal';
import ImportContactsModal from '@/components/dashboard/ImportContactsModal';
import {
    Users, UserPlus, Repeat, Star, Download, Search, Edit,
    Trash2, MoreVertical, Send, MessageSquare, Gift,
    CheckCircle2, Timer, MessageCircle, MapPin, Upload
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AllVisitorsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedVisitorForMsg, setSelectedVisitorForMsg] = useState<Visitor | null>(null);
    const [selectedVisitorForDetails, setSelectedVisitorForDetails] = useState<Visitor | null>(null);
    const [rewardPreviewVisitor, setRewardPreviewVisitor] = useState<Visitor | null>(null);
    const [deleteVisitorId, setDeleteVisitorId] = useState<string | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const userBusinessId = useAuthStore((state) => state.user?.businessId);
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const { data: branches = [] } = useBranches();

    const { data: paginatedData, isLoading: isLoadingVisitors } = useVisitors(activeBranchId === 'all' || !activeBranchId ? undefined : activeBranchId, {
        search: searchQuery,
        status: filterStatus !== 'all' ? filterStatus : undefined
    });
    const { data: statsData } = useVisitorStats(userBusinessId);

    const visitors = paginatedData?.data || [];
    const isLoading = isLoadingVisitors;

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => await api.delete(`/visitors/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['visitors'] });
            toast.success('Visitor removed successfully');
            setDeleteVisitorId(null);
        }
    });

    const addVisitorMutation = useMutation({
        mutationFn: async (data: VisitorFormData) => {
            const nameParts = data.name.trim().split(/\s+/);
            const firstName = nameParts[0] || 'Visitor';
            const lastName = nameParts.slice(1).join(' ') || ' ';

            const payload = {
                firstName,
                lastName,
                email: data.email,
                phone: data.phone,
            };

            const url = data.branchId
                ? `/visitors?branchId=${data.branchId}`
                : '/visitors';

            return await api.post(url, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['visitors'] });
            setIsAddModalOpen(false);
            toast.success('Visitor added successfully');
        }
    });

    const handleAddVisitor = (data: VisitorFormData) => {
        addVisitorMutation.mutate(data);
    };

    const handleExportCSV = () => {
        const csvContent = [
            ['Name', 'Phone', 'Email', 'Status', 'Last Visit'],
            ...visitors.map((v: Visitor) => [v.name, v.phone, v.email || '', v.status, String(v.lastVisit || v.time)])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `visitors_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('CSV exported successfully!');
    };

    const confirmDeleteVisitor = () => {
        if (deleteVisitorId) {
            deleteMutation.mutate(deleteVisitorId);
        }
    };

    const handleInviteVisitor = (visitor: Visitor) => {
        setSelectedVisitorForMsg(visitor);
    };

    const handleSendMessage = () => {
        if (visitors.length > 0) {
            setSelectedVisitorForMsg(visitors[0]); // Just for demo, generically opening a message composer
        } else {
            toast('No visitors available to message');
        }
    };

    const stats = statsData?.stats && statsData.stats.length > 0 ? statsData.stats.map(s => ({
        ...s,
        color: s.color as 'blue' | 'green' | 'purple' | 'red' | 'yellow',
        icon: s.icon === 'group' ? Users : s.icon === 'person_add' ? UserPlus : s.icon === 'repeat' ? Repeat : Star
    })) : [
        { label: 'Total Visitors', value: visitors.length.toString(), icon: Users, color: 'blue' as const, trend: { value: '+0%', isUp: true } },
        { label: 'New This Month', value: visitors.filter((v: Visitor) => v.status === 'New' || v.status === 'new').length.toString(), icon: UserPlus, color: 'green' as const, trend: { value: '+0%', isUp: true } },
        { label: 'Avg. Frequency', value: '0', icon: Repeat, color: 'purple' as const, trend: { value: '0%', isUp: false } },
        { label: 'Top Segment', value: 'Returning', icon: Star, color: 'yellow' as const, trend: { value: '+0%', isUp: true } },
    ];

    const filteredVisitors = visitors;

    const columns: Column<Visitor>[] = [
        {
            header: 'Visitor',
            accessor: (item: Visitor) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {item.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                        <p className="font-bold text-text-main">{item.name}</p>
                        <p className="text-xs text-text-secondary">Customer ID: {item.id.toUpperCase()}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Contact Info',
            accessor: (item: Visitor) => (
                <div className="space-y-0.5">
                    <p className="text-sm text-text-main font-medium">{item.phone}</p>
                    {item.email && <p className="text-[10px] text-text-secondary">{item.email}</p>}
                </div>
            )
        },
        {
            header: 'Consent',
            accessor: (item: Visitor) => (
                <div className="flex items-center gap-2">
                    {item.optIn ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle2 size={10} />
                            Opt-in
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                            <Timer size={10} />
                            24h Purge
                        </div>
                    )}
                </div>
            )
        },
        {
            header: 'Engagement',
            accessor: (item: Visitor) => (
                <div className="flex items-center gap-2">
                    {item.surveyAnswers ? (
                        <div className="size-6 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center" title="Has survey responses">
                            <MessageCircle size={14} />
                        </div>
                    ) : (
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">None</span>
                    )}
                </div>
            )
        },
        {
            header: 'Location',
            accessor: (item: Visitor) => (
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <MapPin size={12} className="text-slate-400" />
                    <span className="text-xs truncate max-w-[120px]">{item.location || 'N/A'}</span>
                </div>
            )
        },
        {
            header: 'Status',
            accessor: (item: Visitor) => (
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${item.status === 'new' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                    {item.status}
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
                            handleInviteVisitor(item);
                        }}
                        className="p-1.5 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        title="Send message"
                    >
                        <Send size={18} />
                    </button>
                    {item.status === 'returning' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setRewardPreviewVisitor(item);
                            }}
                            className="p-1.5 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Preview reward"
                        >
                            <Gift size={18} />
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteVisitorId(item.id);
                        }}
                        className="p-1.5 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete visitor"
                    >
                        <Trash2 size={18} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVisitorForDetails(item);
                        }}
                        className="p-1.5 text-text-secondary hover:text-text-main hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <MoreVertical size={18} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="p-4 md:p-8">
            <PageHeader
                title="All Visitors"
                description="View and manage your entire customer database"
                actions={
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-text-main font-bold rounded-xl hover:bg-gray-50 transition-all text-sm shadow-sm"
                        >
                            <Download size={18} />
                            Export CSV
                        </button>
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-text-main font-bold rounded-xl hover:bg-gray-50 transition-all text-sm shadow-sm"
                        >
                            <Upload size={18} />
                            Import
                        </button>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm shadow-md shadow-primary/20"
                        >
                            <UserPlus size={18} />
                            Add Visitor
                        </button>
                    </div>
                }
            />

            <AddVisitorModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddVisitor}
                isLoading={isLoading || addVisitorMutation.isPending}
                branches={branches}
                defaultBranchId={activeBranchId && activeBranchId !== 'all' ? activeBranchId : branches[0]?.id}
            />

            <ImportContactsModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
            />

            <SendMessageModal
                isOpen={!!selectedVisitorForMsg}
                onClose={() => setSelectedVisitorForMsg(null)}
                recipientName={selectedVisitorForMsg?.name || ''}
                recipientPhone={selectedVisitorForMsg?.phone}
                type="welcome"
            />

            <VisitorDetailsModal
                isOpen={!!selectedVisitorForDetails}
                onClose={() => setSelectedVisitorForDetails(null)}
                visitor={selectedVisitorForDetails as any}
            />

            <PreviewRewardModal
                isOpen={!!rewardPreviewVisitor}
                onClose={() => setRewardPreviewVisitor(null)}
                rewardTitle="Free Coffee or Pastry"
                businessName={'Your Business'}
            />

            <DeleteConfirmationModal
                isOpen={!!deleteVisitorId}
                onClose={() => setDeleteVisitorId(null)}
                onConfirm={confirmDeleteVisitor}
                title="Delete Visitor?"
                description="This action cannot be undone. All visitor history and data will be permanently removed."
                isLoading={deleteMutation.isPending}
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
                        placeholder="Search by name, email, or phone..."
                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-5 font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-3">
                    <select
                        className="h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="new">New</option>
                        <option value="returning">Returning</option>
                    </select>
                    <button
                        onClick={handleSendMessage}
                        className="h-12 px-6 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm"
                    >
                        Send Message
                    </button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredVisitors}
                isLoading={isLoading}
                onRowClick={(visitor) => {
                    setSelectedVisitorForDetails(visitor);
                }}
                emptyState={
                    <EmptyState
                        icon="people"
                        title={searchQuery || filterStatus !== 'all' ? "No visitors found" : "No visitors yet"}
                        description={searchQuery || filterStatus !== 'all'
                            ? "Try adjusting your search or filters"
                            : "Start collecting visitor data by placing your NFC devices at your business location."}
                        action={{
                            label: "Add Visitor",
                            onClick: () => setIsAddModalOpen(true),
                            icon: "person_add"
                        }}
                    />
                }
            />

            <div className="mt-6 flex items-center justify-between px-2">
                <p className="text-sm text-text-secondary font-medium">
                    Showing {filteredVisitors.length} of {visitors.length} visitors
                    {searchQuery && ` (filtered by "${searchQuery}")`}
                    {filterStatus !== 'all' && ` (status: ${filterStatus})`}
                </p>
            </div>
        </div>
    );
}
