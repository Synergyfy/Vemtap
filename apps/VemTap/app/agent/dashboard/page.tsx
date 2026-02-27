'use client';

import Link from 'next/link';
import { MessageCircle, Ticket, Clock3, CheckCircle2 } from 'lucide-react';
import { assignedChats, supportTickets } from '@/components/agent/mockData';

export default function AgentDashboardPage() {
    const openTickets = supportTickets.filter((ticket) => !['Resolved', 'Cancelled'].includes(ticket.status));
    const resolvedToday = supportTickets.filter((ticket) => ticket.status === 'Resolved').length;

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Agent Dashboard</p>
                <h1 className="text-3xl font-display font-bold text-text-main">Support Overview</h1>
                <p className="text-text-secondary text-sm font-medium">Track your assigned chats, tickets, and response pace.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Assigned Chats</p>
                        <MessageCircle size={18} className="text-primary" />
                    </div>
                    <p className="text-3xl font-display font-bold text-text-main mt-3">{assignedChats.length}</p>
                    <p className="text-xs text-text-secondary mt-2">Active conversations waiting for replies.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Open Tickets</p>
                        <Ticket size={18} className="text-primary" />
                    </div>
                    <p className="text-3xl font-display font-bold text-text-main mt-3">{openTickets.length}</p>
                    <p className="text-xs text-text-secondary mt-2">Pending or in-progress ticket requests.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Resolved Today</p>
                        <CheckCircle2 size={18} className="text-primary" />
                    </div>
                    <p className="text-3xl font-display font-bold text-text-main mt-3">{resolvedToday}</p>
                    <p className="text-xs text-text-secondary mt-2">Tickets closed so far.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Avg Response</p>
                        <Clock3 size={18} className="text-primary" />
                    </div>
                    <p className="text-3xl font-display font-bold text-text-main mt-3">4m</p>
                    <p className="text-xs text-text-secondary mt-2">Average time to first reply.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Assigned Chats</p>
                            <h2 className="text-lg font-bold text-text-main">Live Conversations</h2>
                        </div>
                        <Link
                            href="/agent/support"
                            className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary-hover"
                        >
                            Open Support
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {assignedChats.map((chat) => (
                            <div key={chat.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                                <div>
                                    <p className="font-bold text-text-main">{chat.user.name}</p>
                                    <p className="text-xs text-text-secondary">{chat.subject}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{chat.status}</p>
                                    <p className="text-[10px] text-text-secondary">{chat.updatedAt}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Ticket Queue</p>
                            <h2 className="text-lg font-bold text-text-main">Priority Tickets</h2>
                        </div>
                        <Link
                            href="/agent/tickets"
                            className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary-hover"
                        >
                            View Tickets
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {supportTickets.map((ticket) => (
                            <div key={ticket.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                                <div>
                                    <p className="font-bold text-text-main">{ticket.title}</p>
                                    <p className="text-xs text-text-secondary">{ticket.requester} • {ticket.business}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{ticket.status}</p>
                                    <p className="text-[10px] text-text-secondary">{ticket.updatedAt}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
