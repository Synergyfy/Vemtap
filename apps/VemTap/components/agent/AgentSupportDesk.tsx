'use client';

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { MessageCircle, Search, User, Send, Activity, CheckCircle2, Clock, Ticket } from 'lucide-react';

type ViewMode = 'chats' | 'tickets';

type SupportDeskProps = {
    initialView?: ViewMode;
};

const assignedChats = [
    {
        id: 'conv-2001',
        user: { name: 'Samuel O.', email: 'samuel@crestline.com', business: 'Crestline Foods' },
        channel: 'Chatbot',
        status: 'In Progress',
        priority: 'High',
        updatedAt: '2 min ago',
        subject: 'SMS credits not reflecting',
        messages: [
            { sender: 'user', text: 'My SMS credits did not update after top-up.', time: '2 min ago' },
            { sender: 'bot', text: 'I can connect you to an agent. Please confirm.', time: '2 min ago' },
        ],
        activity: [
            { action: 'Assigned', by: 'Admin', time: '5 min ago' },
        ],
    },
    {
        id: 'conv-2002',
        user: { name: 'Chioma A.', email: 'chioma@tapi.io', business: 'Tapi Retail' },
        channel: 'Chatbot',
        status: 'Pending',
        priority: 'Normal',
        updatedAt: '12 min ago',
        subject: 'Need help setting WhatsApp integration',
        messages: [
            { sender: 'user', text: 'How do I connect WhatsApp for my business?', time: '12 min ago' },
        ],
        activity: [
            { action: 'Assigned', by: 'Admin', time: '15 min ago' },
        ],
    },
];

const supportTickets = [
    {
        id: 'TCK-3101',
        title: 'Business account locked',
        requester: 'Mariam K.',
        business: 'Kora Events',
        channel: 'Customer',
        status: 'Pending',
        updatedAt: '5 min ago',
        messages: [
            { sender: 'user', text: 'My business account is locked after password reset.', time: '6 min ago' },
        ],
        activity: [
            { action: 'Ticket created', by: 'Customer', time: '7 min ago' },
        ],
    },
    {
        id: 'TCK-3102',
        title: 'Device sync failure',
        requester: 'Ibrahim M.',
        business: 'BrightPay',
        channel: 'Business',
        status: 'In Progress',
        updatedAt: '18 min ago',
        messages: [
            { sender: 'user', text: 'Our NFC device is not syncing visits.', time: '20 min ago' },
            { sender: 'agent', text: 'Checking device logs now.', time: '18 min ago' },
        ],
        activity: [
            { action: 'Assigned to Agent', by: 'Admin', time: '22 min ago' },
            { action: 'Reply sent', by: 'Agent', time: '18 min ago' },
        ],
    },
];

const statuses = ['Pending', 'In Progress', 'Resolved', 'Cancelled'] as const;

export default function AgentSupportDesk({ initialView = 'chats' }: SupportDeskProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeView, setActiveView] = useState<ViewMode>(initialView);
    const [chats, setChats] = useState(assignedChats);
    const [tickets, setTickets] = useState(supportTickets);
    const [activeId, setActiveId] = useState<string | null>(
        initialView === 'tickets' ? supportTickets[0]?.id || null : assignedChats[0]?.id || null
    );
    const [replyText, setReplyText] = useState('');

    const activeItem = activeView === 'chats'
        ? chats.find((t) => t.id === activeId) || null
        : tickets.find((t) => t.id === activeId) || null;

    const filtered = useMemo(() => {
        const source = activeView === 'chats' ? chats : tickets;
        return source.filter((t: any) => {
            const name = activeView === 'chats' ? t.user.name : t.requester;
            const subject = activeView === 'chats' ? t.subject : t.title;
            return (
                name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.id.toLowerCase().includes(searchQuery.toLowerCase())
            );
        });
    }, [chats, tickets, searchQuery, activeView]);

    const updateStatus = (status: typeof statuses[number]) => {
        if (!activeItem) return;
        if (activeView === 'chats') {
            setChats((prev) => prev.map((t: any) =>
                t.id === activeItem.id
                    ? {
                        ...t,
                        status,
                        updatedAt: 'Just now',
                        activity: [...t.activity, { action: `Status -> ${status}`, by: 'Agent', time: 'Just now' }],
                    }
                    : t
            ));
            return;
        }
        setTickets((prev) => prev.map((t: any) =>
            t.id === activeItem.id
                ? {
                    ...t,
                    status,
                    updatedAt: 'Just now',
                    activity: [...t.activity, { action: `Status -> ${status}`, by: 'Agent', time: 'Just now' }],
                }
                : t
        ));
    };

    const sendReply = () => {
        if (!replyText.trim() || !activeItem) return;
        if (activeView === 'chats') {
            setChats((prev) => prev.map((t: any) =>
                t.id === activeItem.id
                    ? {
                        ...t,
                        updatedAt: 'Just now',
                        messages: [...t.messages, { sender: 'agent', text: replyText.trim(), time: 'Just now' }],
                        activity: [...t.activity, { action: 'Reply sent', by: 'Agent', time: 'Just now' }],
                    }
                    : t
            ));
        } else {
            setTickets((prev) => prev.map((t: any) =>
                t.id === activeItem.id
                    ? {
                        ...t,
                        updatedAt: 'Just now',
                        messages: [...t.messages, { sender: 'agent', text: replyText.trim(), time: 'Just now' }],
                        activity: [...t.activity, { action: 'Reply sent', by: 'Agent', time: 'Just now' }],
                    }
                    : t
            ));
        }
        setReplyText('');
    };

    return (
        <div className="flex h-[calc(100vh-220px)] bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-100">
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={() => { setActiveView('chats'); setActiveId(chats[0]?.id || null); }}
                            className={cn(
                                'flex-1 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border',
                                activeView === 'chats' ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-text-secondary'
                            )}
                        >
                            Chat Requests
                        </button>
                        <button
                            onClick={() => { setActiveView('tickets'); setActiveId(tickets[0]?.id || null); }}
                            className={cn(
                                'flex-1 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border',
                                activeView === 'tickets' ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-text-secondary'
                            )}
                        >
                            Support Tickets
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder={activeView === 'chats' ? 'Search assigned chats...' : 'Search tickets...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                    {filtered.length === 0 ? (
                        <div className="p-10 text-center">
                            <Activity className="w-8 h-8 mx-auto text-gray-200 mb-2" />
                            <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest">
                                {activeView === 'chats' ? 'No assigned chats' : 'No tickets found'}
                            </p>
                        </div>
                    ) : filtered.map((ticket: any) => (
                        <button
                            key={ticket.id}
                            onClick={() => setActiveId(ticket.id)}
                            className={cn(
                                'w-full p-4 flex gap-3 text-left hover:bg-gray-50 transition-colors',
                                activeId === ticket.id ? 'bg-primary/5 border-l-4 border-primary' : ''
                            )}
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                {activeView === 'chats' ? <User size={18} className="text-gray-400" /> : <Ticket size={18} className="text-gray-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="font-bold text-sm text-text-main truncate">
                                        {activeView === 'chats' ? ticket.user.name : ticket.requester}
                                    </p>
                                    <p className="text-[10px] text-text-secondary font-bold">{ticket.updatedAt}</p>
                                </div>
                                <p className="text-xs text-text-secondary truncate font-medium">
                                    {activeView === 'chats' ? ticket.subject : ticket.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border bg-blue-50 text-blue-600 border-blue-100">
                                        {ticket.status}
                                    </span>
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{ticket.priority || ticket.channel}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-white">
                {activeItem ? (
                    <>
                        <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                    <User size={20} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-text-main">
                                        {activeView === 'chats' ? activeItem.user.name : activeItem.requester}
                                    </p>
                                    <p className="text-xs text-text-secondary font-medium">
                                        {activeView === 'chats' ? activeItem.subject : activeItem.title} • {activeItem.channel}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {statuses.map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => updateStatus(status)}
                                        className={cn(
                                            'px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border',
                                            activeItem?.status === status
                                                ? 'bg-primary text-white border-primary'
                                                : 'bg-white border-gray-200 text-text-secondary'
                                        )}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/30">
                            {activeItem.messages.map((m: any, idx: number) => {
                                const isAgent = m.sender !== 'user';
                                return (
                                    <div key={idx} className={cn('flex', isAgent ? 'justify-end' : 'justify-start')}>
                                        <div className={cn(
                                            'max-w-[70%] px-4 py-3 shadow-sm rounded-2xl',
                                            isAgent ? 'bg-primary text-white rounded-tr-none' : 'bg-white border border-gray-100 text-text-main rounded-tl-none'
                                        )}>
                                            <p className="text-sm leading-relaxed">{m.text}</p>
                                            <div className="flex items-center gap-2 mt-1 justify-end opacity-60">
                                                <span className="text-[8px] font-bold uppercase tracking-widest">
                                                    {isAgent ? 'Agent' : (activeView === 'chats' ? activeItem.user.name : activeItem.requester)}
                                                </span>
                                                <span className="text-[8px] font-bold">{m.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-white">
                            <div className="flex items-end gap-4">
                                <div className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                    <textarea
                                        rows={2}
                                        placeholder="Type your response..."
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
                                    className="size-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 hover:bg-primary-hover transition-all transform active:scale-95 disabled:opacity-50"
                                >
                                    <Send size={22} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <MessageCircle size={48} className="text-gray-200" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-text-main uppercase tracking-tight">Agent Workspace</h3>
                        <p className="text-xs text-text-secondary mt-2 max-w-sm font-bold uppercase tracking-widest opacity-60">
                            Select a conversation to start assisting.
                        </p>
                    </div>
                )}
            </div>

            <div className="w-80 bg-white border-l border-gray-200 p-6 hidden xl:block">
                <h4 className="text-xs font-black uppercase tracking-widest text-text-secondary mb-4">Activity Log</h4>
                {activeItem ? (
                    <div className="space-y-4">
                        {activeItem.activity.map((item: any, idx: number) => (
                            <div key={idx} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-primary" />
                                    <p className="text-xs font-bold text-text-main">{item.action}</p>
                                </div>
                                <p className="text-[10px] text-text-secondary mt-1">{item.by} • {item.time}</p>
                            </div>
                        ))}
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                            <Clock size={12} /> SLA Running
                        </div>
                    </div>
                ) : (
                    <div className="text-xs text-text-secondary">Select a ticket to see activity.</div>
                )}
            </div>
        </div>
    );
}
