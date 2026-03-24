'use client';

import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentApi } from '@/lib/api/agent';
import { notify } from '@/lib/notify';
import { cn } from '@/lib/utils';
import { Search, Ticket, User, Send, Loader2, Clock, MessageCircle } from 'lucide-react';

const statusOptions = ['Pending', 'In Progress', 'Resolved', 'Cancelled'] as const;

export default function AgentTicketsTable() {
    const queryClient = useQueryClient();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [replyText, setReplyText] = useState('');

    const { data: ticketsData, isLoading } = useQuery({
        queryKey: ['agent-tickets'],
        queryFn: () => agentApi.getTickets({ limit: 100 }),
    });

    const tickets = useMemo(() => {
        return Array.isArray(ticketsData) ? ticketsData : (ticketsData?.data || []);
    }, [ticketsData]);

    // Set first ticket as active if none selected
    React.useEffect(() => {
        if (!activeId && tickets.length > 0) {
            setActiveId(tickets[0].id);
        }
    }, [tickets, activeId]);

    const { data: activeTicket, isLoading: isActiveLoading } = useQuery({
        queryKey: ['agent-ticket', activeId],
        queryFn: () => agentApi.getTicketDetails(activeId!),
        enabled: !!activeId,
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => 
            agentApi.updateTicketStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-tickets'] });
            queryClient.invalidateQueries({ queryKey: ['agent-ticket', activeId] });
            notify.success('Status updated');
        },
        onError: () => notify.error('Failed to update status'),
    });

    const sendReplyMutation = useMutation({
        mutationFn: ({ id, message }: { id: string; message: string }) => 
            agentApi.sendReply(id, message),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-ticket', activeId] });
            setReplyText('');
            notify.success('Reply sent');
        },
        onError: () => notify.error('Failed to send reply'),
    });

    const filtered = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return tickets.filter((ticket: any) =>
            String(ticket.id).toLowerCase().includes(query) ||
            (ticket.title || '').toLowerCase().includes(query) ||
            (ticket.requester || '').toLowerCase().includes(query) ||
            (ticket.business?.name || '').toLowerCase().includes(query)
        );
    }, [tickets, searchQuery]);

    const handleSendReply = () => {
        if (!replyText.trim() || !activeId) return;
        sendReplyMutation.mutate({ id: activeId, message: replyText.trim() });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Ticket Queue</p>
                    <h2 className="text-xl font-display font-bold text-text-main">Assigned Tickets</h2>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                        type="text"
                        placeholder="Search tickets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-6">
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-text-secondary border-b border-gray-100">
                                <tr>
                                    <th className="px-5 py-4 text-left font-black">Ticket</th>
                                    <th className="px-5 py-4 text-left font-black">Requester</th>
                                    <th className="px-5 py-4 text-left font-black">Business</th>
                                    <th className="px-5 py-4 text-left font-black">Status</th>
                                    <th className="px-5 py-4 text-left font-black">Updated</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <Loader2 className="animate-spin text-primary mx-auto" size={32} />
                                            <p className="text-xs text-text-secondary mt-4 font-bold uppercase tracking-widest">Loading your queue...</p>
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-10 text-center text-xs text-text-secondary">
                                            No tickets found.
                                        </td>
                                    </tr>
                                ) : filtered.map((ticket: any) => (
                                    <tr
                                        key={ticket.id}
                                        onClick={() => setActiveId(ticket.id)}
                                        className={cn(
                                            'cursor-pointer hover:bg-gray-50 transition-all group',
                                            activeId === ticket.id ? 'bg-primary/5' : 'bg-white'
                                        )}
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "size-9 rounded-lg flex items-center justify-center transition-colors",
                                                    activeId === ticket.id ? "bg-primary text-white" : "bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary"
                                                )}>
                                                    <Ticket size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-text-main text-xs font-mono">{String(ticket.id).slice(-6).toUpperCase()}</p>
                                                    <p className="text-xs text-text-secondary truncate max-w-[180px] font-medium">{ticket.title}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 font-bold text-text-main text-xs">{ticket.requester || 'User'}</td>
                                        <td className="px-5 py-4 text-xs font-medium text-text-secondary">{ticket.business?.name || 'N/A'}</td>
                                        <td className="px-5 py-4">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border",
                                                ticket.status === 'Open' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    ticket.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                        'bg-green-50 text-green-600 border-green-100'
                                            )}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-[10px] text-text-secondary font-bold uppercase tracking-widest">
                                            {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col min-h-[550px] shadow-sm relative overflow-hidden">
                    {activeId ? (
                        isActiveLoading ? (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <Loader2 className="animate-spin text-primary" size={24} />
                            </div>
                        ) : activeTicket ? (
                            <>
                                <div className="flex flex-col gap-4 border-b border-gray-100 pb-5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary font-mono mb-1">
                                                ID: {String(activeTicket.id).toUpperCase()}
                                            </p>
                                            <h3 className="text-xl font-display font-bold text-text-main leading-tight">{activeTicket.title}</h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                    {(activeTicket.requester || 'U')[0].toUpperCase()}
                                                </div>
                                                <p className="text-xs text-text-secondary font-bold">
                                                    {activeTicket.requester} • <span className="text-text-main">{activeTicket.business?.name || 'Commercial'}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        {statusOptions.map((status) => (
                                            <button
                                                key={status}
                                                disabled={updateStatusMutation.isPending}
                                                onClick={() => updateStatusMutation.mutate({ id: activeId, status })}
                                                className={cn(
                                                    'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95',
                                                    activeTicket.status === status
                                                        ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                                        : 'bg-white border-gray-200 text-text-secondary hover:border-primary/30 hover:bg-gray-50'
                                                )}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto py-6 space-y-5 scrollbar-thin scrollbar-thumb-gray-200">
                                    {(activeTicket.messages || []).length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center opacity-40">
                                            <MessageCircle size={32} className="text-gray-300 mb-2" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No messages yet</p>
                                        </div>
                                    ) : activeTicket.messages.map((message: any, idx: number) => {
                                        const isAgent = message.sender === 'agent';
                                        return (
                                            <div key={idx} className={cn('flex flex-col', isAgent ? 'items-end' : 'items-start')}>
                                                <div className={cn(
                                                    'max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm leading-relaxed',
                                                    isAgent 
                                                        ? 'bg-primary text-white rounded-tr-none' 
                                                        : 'bg-gray-50 border border-gray-100 text-text-main rounded-tl-none'
                                                )}>
                                                    {message.text}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1.5 px-1 opacity-50">
                                                    <span className="text-[8px] font-black uppercase tracking-widest">
                                                        {isAgent ? 'Assigned Agent' : (activeTicket.requester || 'Sender')}
                                                    </span>
                                                    <Clock size={8} />
                                                    <span className="text-[8px] font-bold">
                                                        {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="pt-5 border-t border-gray-100 bg-white sticky bottom-0">
                                    <div className="flex items-end gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                                        <textarea
                                            rows={2}
                                            placeholder="Write your response..."
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            className="flex-1 bg-transparent resize-none border-none outline-none text-sm font-medium px-3 py-2 placeholder:text-gray-400"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendReply();
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={handleSendReply}
                                            disabled={!replyText.trim() || sendReplyMutation.isPending}
                                            className="size-11 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:bg-primary-hover hover:scale-105 transition-all transform active:scale-95 disabled:opacity-40"
                                        >
                                            {sendReplyMutation.isPending ? (
                                                <Loader2 className="animate-spin" size={18} />
                                            ) : (
                                                <Send size={18} />
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-text-secondary mt-2 px-1 font-medium">Shift + Enter for new line</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <div className="size-16 rounded-3xl bg-red-50 flex items-center justify-center mb-4">
                                    <Ticket size={28} className="text-red-500" />
                                </div>
                                <h4 className="font-bold text-text-main mb-1">Error Loading Ticket</h4>
                                <p className="text-xs text-text-secondary leading-relaxed">We couldn't retrieve the details for this ticket. It may have been deleted.</p>
                                <button 
                                    onClick={() => queryClient.invalidateQueries({ queryKey: ['agent-ticket', activeId] })}
                                    className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-text-main transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        )
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                            <div className="size-20 rounded-[2.5rem] bg-gray-50 flex items-center justify-center mb-6 border-2 border-dashed border-gray-200">
                                <Ticket size={32} className="text-gray-200" />
                            </div>
                            <h4 className="font-bold text-text-main text-lg mb-2">No Ticket Selected</h4>
                            <p className="text-xs text-text-secondary font-medium leading-relaxed max-w-[200px]">
                                Select a ticket from the queue on the left to view messages and respond.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

