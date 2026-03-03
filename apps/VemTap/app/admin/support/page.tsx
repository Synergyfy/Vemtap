'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, MessageCircle, RefreshCw, Search, Send } from 'lucide-react';
import { notify } from '@/lib/notify';
import { adminSupportApi } from '@/lib/api/admin';
import { cn } from '@/lib/utils';

type TicketStatus = 'Open' | 'In Progress' | 'Closed';

const STATUS_OPTIONS: TicketStatus[] = ['Open', 'In Progress', 'Closed'];
const PAGE_SIZE = 10;

const extractList = (payload: any): any[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.tickets)) return payload.tickets;
    if (Array.isArray(payload?.data?.tickets)) return payload.data.tickets;
    return [];
};

const getStatusClass = (status: string) => {
    if (status === 'Open') return 'bg-orange-50 text-orange-700 border-orange-100';
    if (status === 'In Progress') return 'bg-blue-50 text-blue-700 border-blue-100';
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
};

export default function AdminSupportPage() {
    const queryClient = useQueryClient();
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [replyText, setReplyText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const { data: ticketsResponse, isLoading: isLoadingTickets, refetch } = useQuery({
        queryKey: ['admin-tickets'],
        queryFn: () => adminSupportApi.getAllTickets(),
    });

    const tickets = useMemo(() => extractList(ticketsResponse), [ticketsResponse]);

    const filteredTickets = useMemo(() => {
        return tickets.filter((ticket: any) => {
            const query = searchQuery.trim().toLowerCase();
            const matchesQuery =
                !query ||
                ticket?.id?.toLowerCase().includes(query) ||
                ticket?.subject?.toLowerCase().includes(query) ||
                ticket?.user?.name?.toLowerCase().includes(query) ||
                ticket?.user?.email?.toLowerCase().includes(query);

            const matchesStatus = statusFilter === 'all' || ticket?.status === statusFilter;
            return matchesQuery && matchesStatus;
        });
    }, [tickets, searchQuery, statusFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
    const paginatedTickets = filteredTickets.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const { data: selectedTicketResponse, isLoading: isLoadingDetails } = useQuery({
        queryKey: ['admin-ticket', selectedTicketId],
        queryFn: () => adminSupportApi.getTicketDetails(selectedTicketId!),
        enabled: !!selectedTicketId,
    });

    const selectedTicket = selectedTicketResponse?.data || selectedTicketResponse;

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
            adminSupportApi.updateTicketStatus(id, status),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
            queryClient.invalidateQueries({ queryKey: ['admin-ticket', variables.id] });
            notify.success(`Ticket status updated to ${variables.status}`);
        },
        onError: () => notify.error('Failed to update ticket status'),
    });

    const replyMutation = useMutation({
        mutationFn: ({ id, message }: { id: string; message: string }) =>
            adminSupportApi.replyToTicket(id, message),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin-ticket', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
            setReplyText('');
            notify.success('Reply sent');
        },
        onError: () => notify.error('Failed to send reply'),
    });

    const handleStatusChange = (id: string, status: string) => {
        if (!STATUS_OPTIONS.includes(status as TicketStatus)) return;
        updateStatusMutation.mutate({ id, status: status as TicketStatus });
    };

    const handleSendReply = () => {
        if (!selectedTicketId || !replyText.trim()) return;
        replyMutation.mutate({ id: selectedTicketId, message: replyText.trim() });
    };

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-text-main">Support Tickets</h1>
                    <p className="text-text-secondary text-sm font-medium mt-1">List view for all support conversations</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="h-11 px-4 border border-gray-200 rounded-xl bg-white text-sm font-bold text-text-secondary hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 space-y-3">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by ticket id, subject, user name or email..."
                            className="w-full h-11 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="all">All Statuses</option>
                        {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-wider text-text-secondary">Ticket</th>
                                <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-wider text-text-secondary">User</th>
                                <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-wider text-text-secondary">Category</th>
                                <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-wider text-text-secondary">Status</th>
                                <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-wider text-text-secondary">Updated</th>
                                <th className="text-right py-3 px-4 text-[10px] font-black uppercase tracking-wider text-text-secondary">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoadingTickets ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center">
                                        <Loader2 className="mx-auto animate-spin text-primary" size={28} />
                                        <p className="text-sm text-text-secondary font-medium mt-3">Loading tickets...</p>
                                    </td>
                                </tr>
                            ) : filteredTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-sm text-text-secondary font-medium">
                                        No tickets found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedTickets.map((ticket: any) => (
                                    <tr key={ticket.id} className={cn('hover:bg-gray-50', selectedTicketId === ticket.id ? 'bg-primary/5' : '')}>
                                        <td className="py-3 px-4">
                                            <p className="font-bold text-sm text-text-main">{ticket.subject || 'No subject'}</p>
                                            <p className="text-xs text-text-secondary font-medium mt-0.5">{ticket.id}</p>
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="text-sm font-bold text-text-main">{ticket.user?.name || 'Unknown User'}</p>
                                            <p className="text-xs text-text-secondary">{ticket.user?.email || 'No email'}</p>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-text-secondary font-medium">{ticket.category || 'General'}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border', getStatusClass(ticket.status))}>
                                                    {ticket.status}
                                                </span>
                                                <select
                                                    value={ticket.status}
                                                    onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                                                    className="h-8 px-2 bg-gray-50 border border-gray-200 rounded-md text-xs font-bold focus:outline-none"
                                                >
                                                    {STATUS_OPTIONS.map((status) => (
                                                        <option key={status} value={status}>{status}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-text-secondary font-medium">
                                            {ticket.updatedAt
                                                ? formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })
                                                : '-'}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                onClick={() => setSelectedTicketId(ticket.id)}
                                                className="h-8 px-3 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-50"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                    <p className="text-xs text-text-secondary font-black uppercase tracking-widest">
                        {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''} found
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-bold disabled:opacity-40"
                        >
                            Prev
                        </button>
                        <span className="text-xs font-bold text-text-secondary">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-bold disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {selectedTicketId && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="p-5 border-b border-gray-100">
                        <h2 className="text-lg font-display font-bold text-text-main">Ticket Details</h2>
                        <p className="text-xs text-text-secondary font-medium mt-1">
                            {selectedTicket?.subject || selectedTicketId}
                        </p>
                    </div>

                    <div className="p-5 space-y-4">
                        {isLoadingDetails ? (
                            <div className="py-8 text-center">
                                <Loader2 className="mx-auto animate-spin text-primary" size={24} />
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                    {(selectedTicket?.messages || []).length === 0 ? (
                                        <div className="py-8 text-center text-sm text-text-secondary font-medium">
                                            No messages yet.
                                        </div>
                                    ) : (
                                        selectedTicket.messages.map((message: any, index: number) => (
                                            <div key={index} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-xs font-black uppercase tracking-wider text-text-secondary">
                                                        {message.sender?.name || message.sender?.role || 'User'}
                                                    </p>
                                                    <p className="text-[10px] text-text-secondary font-medium">
                                                        {message.createdAt
                                                            ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })
                                                            : ''}
                                                    </p>
                                                </div>
                                                <p className="text-sm text-text-main mt-2 whitespace-pre-wrap">{message.message}</p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="pt-3 border-t border-gray-100">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary">Reply</label>
                                    <div className="mt-2 flex gap-3 items-end">
                                        <textarea
                                            rows={3}
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Write a reply..."
                                            className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                        <button
                                            onClick={handleSendReply}
                                            disabled={!replyText.trim() || replyMutation.isPending}
                                            className="h-11 px-4 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-hover disabled:opacity-50 inline-flex items-center gap-2"
                                        >
                                            {replyMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                                            Send
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {!selectedTicketId && !isLoadingTickets && (
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                    <MessageCircle className="mx-auto text-gray-300" size={32} />
                    <p className="text-sm text-text-secondary font-medium mt-3">
                        Select a ticket from the list to view details and reply.
                    </p>
                </div>
            )}
        </div>
    );
}
