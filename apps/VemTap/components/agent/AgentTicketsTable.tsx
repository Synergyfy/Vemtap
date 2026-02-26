'use client';

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Search, Ticket, User, Send } from 'lucide-react';
import { statusOptions, supportTickets } from '@/components/agent/mockData';

export default function AgentTicketsTable() {
    const [tickets, setTickets] = useState(supportTickets);
    const [activeId, setActiveId] = useState<string | null>(supportTickets[0]?.id || null);
    const [searchQuery, setSearchQuery] = useState('');
    const [replyText, setReplyText] = useState('');

    const activeTicket = tickets.find((ticket) => ticket.id === activeId) || null;

    const filtered = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return tickets.filter((ticket) =>
            ticket.id.toLowerCase().includes(query) ||
            ticket.title.toLowerCase().includes(query) ||
            ticket.requester.toLowerCase().includes(query) ||
            ticket.business.toLowerCase().includes(query)
        );
    }, [tickets, searchQuery]);

    const updateStatus = (status: (typeof statusOptions)[number]) => {
        if (!activeTicket) return;
        setTickets((prev) => prev.map((ticket) =>
            ticket.id === activeTicket.id
                ? {
                    ...ticket,
                    status,
                    updatedAt: 'Just now',
                    activity: [...ticket.activity, { action: `Status -> ${status}`, by: 'Agent', time: 'Just now' }],
                }
                : ticket
        ));
    };

    const sendReply = () => {
        if (!replyText.trim() || !activeTicket) return;
        setTickets((prev) => prev.map((ticket) =>
            ticket.id === activeTicket.id
                ? {
                    ...ticket,
                    updatedAt: 'Just now',
                    messages: [...ticket.messages, { sender: 'agent', text: replyText.trim(), time: 'Just now' }],
                    activity: [...ticket.activity, { action: 'Reply sent', by: 'Agent', time: 'Just now' }],
                }
                : ticket
        ));
        setReplyText('');
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
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-xs uppercase tracking-widest text-text-secondary">
                                <tr>
                                    <th className="px-5 py-3 text-left font-black">Ticket</th>
                                    <th className="px-5 py-3 text-left font-black">Requester</th>
                                    <th className="px-5 py-3 text-left font-black">Business</th>
                                    <th className="px-5 py-3 text-left font-black">Status</th>
                                    <th className="px-5 py-3 text-left font-black">Updated</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-10 text-center text-xs text-text-secondary">
                                            No tickets found.
                                        </td>
                                    </tr>
                                ) : filtered.map((ticket) => (
                                    <tr
                                        key={ticket.id}
                                        onClick={() => setActiveId(ticket.id)}
                                        className={cn(
                                            'cursor-pointer hover:bg-gray-50 transition-colors',
                                            activeId === ticket.id ? 'bg-primary/5' : 'bg-white'
                                        )}
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-9 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    <Ticket size={16} className="text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-text-main">{ticket.id}</p>
                                                    <p className="text-xs text-text-secondary truncate max-w-[220px]">{ticket.title}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 font-medium text-text-main">{ticket.requester}</td>
                                        <td className="px-5 py-4 text-text-secondary">{ticket.business}</td>
                                        <td className="px-5 py-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border bg-blue-50 text-blue-600 border-blue-100">
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-xs text-text-secondary font-semibold">{ticket.updatedAt}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col min-h-[480px]">
                    {activeTicket ? (
                        <>
                            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{activeTicket.id}</p>
                                    <h3 className="text-lg font-bold text-text-main">{activeTicket.title}</h3>
                                    <p className="text-xs text-text-secondary font-medium">
                                        {activeTicket.requester} • {activeTicket.business} • {activeTicket.channel}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {statusOptions.map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => updateStatus(status)}
                                            className={cn(
                                                'px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border',
                                                activeTicket.status === status
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'bg-white border-gray-200 text-text-secondary'
                                            )}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto py-5 space-y-4">
                                {activeTicket.messages.map((message, idx) => {
                                    const isAgent = message.sender !== 'user';
                                    return (
                                        <div key={idx} className={cn('flex', isAgent ? 'justify-end' : 'justify-start')}>
                                            <div className={cn(
                                                'max-w-[80%] px-4 py-3 shadow-sm rounded-2xl text-sm',
                                                isAgent ? 'bg-primary text-white rounded-tr-none' : 'bg-gray-50 border border-gray-100 text-text-main rounded-tl-none'
                                            )}>
                                                <p className="leading-relaxed">{message.text}</p>
                                                <div className="flex items-center gap-2 mt-1 justify-end opacity-60">
                                                    <span className="text-[8px] font-bold uppercase tracking-widest">
                                                        {isAgent ? 'Agent' : activeTicket.requester}
                                                    </span>
                                                    <span className="text-[8px] font-bold">{message.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex items-end gap-3">
                                    <div className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                        <textarea
                                            rows={2}
                                            placeholder="Reply to the ticket..."
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            className="w-full bg-transparent resize-none border-none outline-none text-sm font-medium placeholder:text-gray-400"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    sendReply();
                                                }
                                            }}
                                        />
                                    </div>
                                    <button
                                        onClick={sendReply}
                                        disabled={!replyText.trim()}
                                        className="size-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 hover:bg-primary-hover transition-all transform active:scale-95 disabled:opacity-50"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                                <User size={26} className="text-gray-200" />
                            </div>
                            <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">Select a ticket to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
