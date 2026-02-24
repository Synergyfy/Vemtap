'use client';

import React, { useState } from 'react';
import { MessageCircle, User, Clock, Check, Send, Search, LogOut, Activity } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { notify } from '@/lib/notify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminSupportApi } from '@/lib/api/admin';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AgentDashboard() {
    const { logout, user } = useAuthStore();
    const queryClient = useQueryClient();
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch all tickets
    const { data: ticketsResponse, isLoading: isLoadingTickets } = useQuery({
        queryKey: ['admin-tickets'],
        queryFn: () => adminSupportApi.getAllTickets(),
    });

    const allTickets = (ticketsResponse?.data || ticketsResponse || []) as any[];

    // Fetch active ticket details
    const { data: activeTicketResponse, isLoading: isLoadingDetails } = useQuery({
        queryKey: ['admin-ticket', activeChatId],
        queryFn: () => adminSupportApi.getTicketDetails(activeChatId!),
        enabled: !!activeChatId,
    });

    const activeTicket = (activeTicketResponse?.data || activeTicketResponse) as any;

    // reply mutation
    const replyMutation = useMutation({
        mutationFn: ({ id, message }: { id: string, message: string }) => adminSupportApi.replyToTicket(id, message),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-ticket', activeChatId] });
            setReplyText('');
            notify.success('Reply sent successfully');
        },
        onError: () => notify.error('Failed to send reply'),
    });

    // resolve mutation
    const resolveMutation = useMutation({
        mutationFn: (id: string) => adminSupportApi.resolveTicket(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
            queryClient.invalidateQueries({ queryKey: ['admin-ticket', activeChatId] });
            notify.success('Ticket resolved successfully');
        },
        onError: () => notify.error('Failed to resolve ticket'),
    });

    const handleSendReply = () => {
        if (!replyText.trim() || !activeChatId) return;
        replyMutation.mutate({ id: activeChatId, message: replyText });
    };

    const handleLogout = () => {
        logout();
        notify.success('Logged out successfully');
        window.location.href = '/login';
    };

    const filteredTickets = allTickets.filter((t: any) =>
        t.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100vh-64px)] bg-gray-50 border-t border-gray-200">
            {/* Sidebar / Chat List */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="font-display font-bold text-text-main flex items-center gap-2">
                        <MessageCircle size={20} className="text-primary" />
                        Live Tickets
                    </h2>
                    <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">
                        {isLoadingTickets ? '...' : allTickets.filter((c: any) => c.status !== 'Closed').length}
                    </span>
                </div>

                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                    {isLoadingTickets ? (
                        <div className="p-8 text-center animate-pulse">
                            <Clock className="w-8 h-8 mx-auto text-gray-200 mb-2" />
                            <p className="text-[10px] font-black uppercase text-gray-300">Loading stream...</p>
                        </div>
                    ) : filteredTickets.length > 0 ? filteredTickets.map((ticket: any) => (
                        <button
                            key={ticket.id}
                            onClick={() => setActiveChatId(ticket.id)}
                            className={cn(
                                "w-full p-4 flex gap-3 text-left hover:bg-gray-50 transition-colors",
                                activeChatId === ticket.id ? 'bg-primary/5 border-l-4 border-primary' : ''
                            )}
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                <User size={18} className="text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="font-bold text-sm text-text-main truncate">{ticket.user?.name || 'Customer'}</p>
                                    <p className="text-[10px] text-text-secondary font-bold">
                                        {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true }).replace('about ', '')}
                                    </p>
                                </div>
                                <p className="text-xs text-text-secondary truncate font-medium">{ticket.subject}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={cn(
                                        "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border",
                                        ticket.status === 'Open' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                            ticket.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    )}>
                                        {ticket.status}
                                    </span>
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{ticket.category}</span>
                                </div>
                            </div>
                        </button>
                    )) : (
                        <div className="p-12 text-center">
                            <Activity className="w-8 h-8 mx-auto text-gray-100 mb-2" />
                            <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest">No tickets found</p>
                        </div>
                    )}
                </div>

                {/* Agent Profile & Logout */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs uppercase">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-text-main truncate">{user?.name || 'Agent'}</p>
                            <p className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                Online
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Logout & Clear Data"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* Chat View */}
            <div className="flex-1 flex flex-col bg-white">
                {activeChatId ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                    <User size={20} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-text-main">{activeTicket?.user?.name || 'Customer'}</p>
                                    <p className="text-xs text-text-secondary font-medium">{activeTicket?.subject} • {activeTicket?.category}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {activeTicket?.status !== 'Closed' && (
                                    <button
                                        onClick={() => resolveMutation.mutate(activeTicket.id)}
                                        disabled={resolveMutation.isPending}
                                        className="px-4 py-2 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-green-600 shadow-lg shadow-green-100 transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Check size={14} />
                                        Resolve Ticket
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/30">
                            {isLoadingDetails ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4 animate-pulse">
                                    <Activity className="w-12 h-12 text-primary/20" />
                                    <p className="text-[10px] font-black uppercase text-primary/40 tracking-[0.2em]">Synchronizing Logs...</p>
                                </div>
                            ) : activeTicket?.messages?.map((m: any, idx: number) => {
                                const isAgent = ['Admin', 'Staff', 'Manager', 'Owner'].includes(m.sender?.role);
                                return (
                                    <div key={idx} className={cn("flex", isAgent ? 'justify-end' : 'justify-start')}>
                                        <div className={cn(
                                            "max-w-[70%] px-4 py-3 shadow-sm rounded-2xl",
                                            isAgent ? 'bg-primary text-white rounded-tr-none' : 'bg-white border border-gray-100 text-text-main rounded-tl-none'
                                        )}>
                                            <p className="text-sm leading-relaxed">{m.message}</p>
                                            <div className={cn("flex items-center gap-2 mt-1 justify-end opacity-60")}>
                                                <span className="text-[8px] font-bold uppercase tracking-widest">
                                                    {isAgent ? 'VemTap Intelligence' : m.sender?.name || 'Customer'}
                                                </span>
                                                <span className="text-[8px] font-bold">
                                                    {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 border-t border-gray-100 bg-white">
                            <div className="flex items-end gap-4">
                                <div className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                    <textarea
                                        rows={2}
                                        placeholder="Type your response to the visitor..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        className="w-full bg-transparent resize-none border-none outline-none text-sm font-medium placeholder:text-gray-400"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendReply();
                                            }
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={handleSendReply}
                                    disabled={!replyText.trim() || replyMutation.isPending}
                                    className="size-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 hover:bg-primary-hover transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {replyMutation.isPending ? <Activity className="animate-spin" size={24} /> : <Send size={24} />}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <MessageCircle size={48} className="text-gray-200" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-text-main uppercase tracking-tight">Support Terminal</h3>
                        <p className="text-xs text-text-secondary mt-2 max-w-sm font-bold uppercase tracking-widest opacity-60">
                            Select an active data stream from the sidebar to start assisting visitors in real-time.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
