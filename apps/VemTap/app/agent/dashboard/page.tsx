'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { agentApi } from '@/lib/api/agent';
import { MessageCircle, Ticket, Clock3, CheckCircle2, Loader2 } from 'lucide-react';

export default function AgentDashboardPage() {
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['agent-stats'],
        queryFn: () => agentApi.getStats(),
    });

    const { data: chatsData, isLoading: chatsLoading } = useQuery({
        queryKey: ['agent-chats'],
        queryFn: () => agentApi.getChats({ limit: 5 }),
    });

    const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
        queryKey: ['agent-tickets'],
        queryFn: () => agentApi.getTickets({ limit: 5 }),
    });

    const isLoading = statsLoading || chatsLoading || ticketsLoading;

    const assignedChats = Array.isArray(chatsData) ? chatsData : (chatsData?.data || []);
    const supportTickets = Array.isArray(ticketsData) ? ticketsData : (ticketsData?.data || []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Agent Dashboard</p>
                <h1 className="text-3xl font-display font-bold text-text-main">Support Overview</h1>
                <p className="text-text-secondary text-sm font-medium">Track your assigned chats, tickets, and response pace.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Assigned Chats</p>
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <MessageCircle size={18} />
                        </div>
                    </div>
                    <p className="text-3xl font-display font-bold text-text-main mt-3">{stats?.activeChats || assignedChats.length}</p>
                    <p className="text-xs text-text-secondary mt-2">Active conversations waiting for replies.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Open Tickets</p>
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Ticket size={18} />
                        </div>
                    </div>
                    <p className="text-3xl font-display font-bold text-text-main mt-3">{stats?.openTickets || supportTickets.length}</p>
                    <p className="text-xs text-text-secondary mt-2">Pending or in-progress ticket requests.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Resolved Today</p>
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <CheckCircle2 size={18} />
                        </div>
                    </div>
                    <p className="text-3xl font-display font-bold text-text-main mt-3">{stats?.resolvedToday || 0}</p>
                    <p className="text-xs text-text-secondary mt-2">Tickets closed so far.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Avg Response</p>
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                            <Clock3 size={18} />
                        </div>
                    </div>
                    <p className="text-3xl font-display font-bold text-text-main mt-3">{stats?.avgResponseTime || 'N/A'}</p>
                    <p className="text-xs text-text-secondary mt-2">Average time to first reply.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Assigned Chats</p>
                            <h2 className="text-lg font-bold text-text-main">Live Conversations</h2>
                        </div>
                        <Link
                            href="/agent/support"
                            className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary-hover px-3 py-1 bg-primary/5 rounded-full"
                        >
                            Open Support
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {assignedChats.length === 0 ? (
                            <div className="py-8 text-center text-text-secondary text-sm">No active chats assigned.</div>
                        ) : assignedChats.map((chat: any) => (
                            <div key={chat.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-bold text-sm text-text-main">{chat.user?.name || 'Customer'}</p>
                                    <p className="text-xs text-text-secondary truncate max-w-[200px]">{chat.subject || 'No subject'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary shrink-0">{chat.status}</p>
                                    <p className="text-[10px] text-text-secondary mt-1">{chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Ticket Queue</p>
                            <h2 className="text-lg font-bold text-text-main">Priority Tickets</h2>
                        </div>
                        <Link
                            href="/agent/tickets"
                            className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary-hover px-3 py-1 bg-primary/5 rounded-full"
                        >
                            View Tickets
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {supportTickets.length === 0 ? (
                            <div className="py-8 text-center text-text-secondary text-sm">No priority tickets.</div>
                        ) : supportTickets.map((ticket: any) => (
                            <div key={ticket.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-bold text-sm text-text-main">{ticket.title}</p>
                                    <p className="text-xs text-text-secondary">{ticket.requester || 'Requester'} • {ticket.business?.name || 'Business'}</p>
                                </div>
                                <div className="text-right">
                                    <p className={cn(
                                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                        ticket.status === 'Open' ? 'bg-red-50 text-red-600 border-red-100' :
                                            ticket.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                'bg-green-50 text-green-600 border-green-100'
                                    )}>{ticket.status}</p>
                                    <p className="text-[10px] text-text-secondary mt-1">{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString() : ''}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

