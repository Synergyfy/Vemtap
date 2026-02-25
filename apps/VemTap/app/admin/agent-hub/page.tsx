'use client';

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { MessageCircle, Search, User, Send, Activity, CheckCircle2, ArrowRight, RefreshCw, Wand2 } from 'lucide-react';

const agents = [
    { id: 'agent-1', name: 'Amara Obi', status: 'online', activeChats: 2 },
    { id: 'agent-2', name: 'Tunde Bello', status: 'online', activeChats: 1 },
    { id: 'agent-3', name: 'Zainab Yusuf', status: 'away', activeChats: 0 },
];

const initialConversations = [
    {
        id: 'conv-1001',
        user: { name: 'Samuel O.', email: 'samuel@crestline.com', business: 'Crestline Foods' },
        channel: 'Chatbot',
        status: 'unassigned',
        priority: 'High',
        updatedAt: '2 min ago',
        subject: 'SMS credits not reflecting',
        assignedTo: null as string | null,
        messages: [
            { sender: 'user', text: 'My SMS credits did not update after top-up.', time: '2 min ago' },
            { sender: 'bot', text: 'I can connect you to an agent. Please confirm.', time: '2 min ago' },
        ],
        activity: [
            { action: 'Escalated by chatbot', by: 'VemBot', time: '3 min ago' },
        ],
    },
    {
        id: 'conv-1002',
        user: { name: 'Chioma A.', email: 'chioma@tapi.io', business: 'Tapi Retail' },
        channel: 'Chatbot',
        status: 'assigned',
        assignedTo: 'agent-1',
        priority: 'Normal',
        updatedAt: '8 min ago',
        subject: 'Need help setting WhatsApp integration',
        messages: [
            { sender: 'user', text: 'How do I connect WhatsApp for my business?', time: '12 min ago' },
            { sender: 'agent', text: 'I can guide you through the steps. Are you in Settings > Integrations?', time: '9 min ago' },
        ],
        activity: [
            { action: 'Assigned to Amara Obi', by: 'Admin', time: '10 min ago' },
            { action: 'Reply sent', by: 'Amara Obi', time: '9 min ago' },
        ],
    },
    {
        id: 'conv-1003',
        user: { name: 'Ibrahim M.', email: 'ibrahim@brightpay.com', business: 'BrightPay' },
        channel: 'Chatbot',
        status: 'assigned',
        assignedTo: 'agent-2',
        priority: 'Low',
        updatedAt: '20 min ago',
        subject: 'Billing invoice download',
        messages: [
            { sender: 'user', text: 'I need my invoice for last month.', time: '22 min ago' },
        ],
        activity: [
            { action: 'Assigned to Tunde Bello', by: 'Admin', time: '20 min ago' },
        ],
    },
];


export default function AgentHubPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'unassigned' | 'assigned' | 'all'>('unassigned');
    const [conversations, setConversations] = useState(initialConversations);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [selectedAgentId, setSelectedAgentId] = useState(agents[0].id);

    const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

    const filtered = useMemo(() => {
        const byTab = conversations.filter((c) => {
            if (activeTab === 'unassigned') return c.status === 'unassigned';
            if (activeTab === 'assigned') return c.status === 'assigned';
            return true;
        });
        return byTab.filter((c) =>
            c.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [activeTab, conversations, searchQuery]);

    const assignToAgent = (conversationId: string, agentId: string) => {
        const agent = agents.find((a) => a.id === agentId);
        setConversations((prev) => prev.map((c) =>
            c.id === conversationId
                ? {
                    ...c,
                    status: 'assigned',
                    assignedTo: agentId,
                    updatedAt: 'Just now',
                    activity: [...c.activity, { action: `Assigned to ${agent?.name || 'Agent'}`, by: 'Admin', time: 'Just now' }],
                }
                : c
        ));
    };

    const updateStatus = (status: typeof statuses[number]) => {
        if (!activeConversation) return;
        setConversations((prev) => prev.map((c) =>
            c.id === activeConversation.id
                ? {
                    ...c,
                    updatedAt: 'Just now',
                    activity: [...c.activity, { action: `Status ? ${status}`, by: 'Admin', time: 'Just now' }],
                }
                : c
        ));
    };

    const sendReply = () => {
        if (!replyText.trim() || !activeConversation) return;
        setConversations((prev) => prev.map((c) =>
            c.id === activeConversation.id
                ? {
                    ...c,
                    updatedAt: 'Just now',
                    messages: [...c.messages, { sender: 'agent', text: replyText.trim(), time: 'Just now' }],
                    activity: [...c.activity, { action: 'Reply sent', by: 'Agent', time: 'Just now' }],
                }
                : c
        ));
        setReplyText('');
    };

    const unassignedCount = conversations.filter((c) => c.status === 'unassigned').length;

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Support Agent Hub</p>
                    <h1 className="text-3xl font-display font-bold text-text-main">Admin Assignment Console</h1>
                    <p className="text-text-secondary text-sm font-medium">Assign agents, track activity, and manage resolution states.</p>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <select
                        value={selectedAgentId}
                        onChange={(e) => setSelectedAgentId(e.target.value)}
                        className="h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>{agent.name} ({agent.status})</option>
                        ))}
                    </select>
                    <button className="h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold flex items-center gap-2">
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Unassigned Requests</p>
                    <p className="text-2xl font-display font-bold text-text-main mt-1">{unassignedCount}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Active Agents</p>
                    <p className="text-2xl font-display font-bold text-text-main mt-1">{agents.filter(a => a.status === 'online').length}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Chats In Progress</p>
                    <p className="text-2xl font-display font-bold text-text-main mt-1">{conversations.filter(c => c.status === 'assigned').length}</p>
                </div>
            </div>

            <div className="flex h-[calc(100vh-260px)] bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
                <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h2 className="font-display font-bold text-text-main flex items-center gap-2">
                            <MessageCircle size={20} className="text-primary" />
                            Conversations
                        </h2>
                        <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">
                            {filtered.length}
                        </span>
                    </div>

                    <div className="p-4 border-b border-gray-100 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search chats..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="flex gap-2">
                            {([
                                { id: 'unassigned', label: 'Unassigned' },
                                { id: 'assigned', label: 'Assigned' },
                                { id: 'all', label: 'All' },
                            ] as const).map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        'px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition',
                                        activeTab === tab.id ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-text-secondary'
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                        {filtered.length === 0 ? (
                            <div className="p-10 text-center">
                                <Activity className="w-8 h-8 mx-auto text-gray-200 mb-2" />
                                <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest">No conversations</p>
                            </div>
                        ) : filtered.map((ticket) => (
                            <button
                                key={ticket.id}
                                onClick={() => setActiveConversationId(ticket.id)}
                                className={cn(
                                    'w-full p-4 flex gap-3 text-left hover:bg-gray-50 transition-colors',
                                    activeConversationId === ticket.id ? 'bg-primary/5 border-l-4 border-primary' : ''
                                )}
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                    <User size={18} className="text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-bold text-sm text-text-main truncate">{ticket.user.name}</p>
                                        <p className="text-[10px] text-text-secondary font-bold">{ticket.updatedAt}</p>
                                    </div>
                                    <p className="text-xs text-text-secondary truncate font-medium">{ticket.subject}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={cn(
                                            'text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border',
                                            ticket.status === 'unassigned' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                        )}
                                        >
                                            {ticket.status}
                                        </span>
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{ticket.priority}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex flex-col bg-white">
                    {activeConversation ? (
                        <>
                            <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                        <User size={20} className="text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-text-main">{activeConversation.user.name}</p>
                                        <p className="text-xs text-text-secondary font-medium">{activeConversation.subject}  -  {activeConversation.channel}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={selectedAgentId}
                                        onChange={(e) => setSelectedAgentId(e.target.value)}
                                        className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                                    >
                                        {agents.map((agent) => (
                                            <option key={agent.id} value={agent.id}>{agent.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => assignToAgent(activeConversation.id, selectedAgentId)}
                                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest"
                                    >
                                        Assign
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/30">
                                {activeConversation.messages.map((m, idx) => {
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
                                                        {isAgent ? 'Agent' : activeConversation.user.name}
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
                            <h3 className="text-xl font-display font-bold text-text-main uppercase tracking-tight">Admin Assignment Console</h3>
                            <p className="text-xs text-text-secondary mt-2 max-w-sm font-bold uppercase tracking-widest opacity-60">
                                Select a conversation to assign and review activity.
                            </p>
                        </div>
                    )}
                </div>

                <div className="w-80 bg-white border-l border-gray-200 p-6 hidden xl:block">
                    <h4 className="text-xs font-black uppercase tracking-widest text-text-secondary mb-4">Agent Activity</h4>
                    {activeConversation ? (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Assigned Agent</p>
                                <p className="text-sm font-bold text-text-main">
                                    {agents.find(a => a.id === activeConversation.assignedTo)?.name || 'Unassigned'}
                                </p>
                            </div>
                            {activeConversation.activity.map((item, idx) => (
                                <div key={idx} className="p-4 rounded-xl bg-white border border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={14} className="text-primary" />
                                        <p className="text-xs font-bold text-text-main">{item.action}</p>
                                    </div>
                                    <p className="text-[10px] text-text-secondary mt-1">{item.by}  -  {item.time}</p>
                                </div>
                            ))}
                            <button className="w-full py-3 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-text-secondary hover:bg-gray-50 transition flex items-center justify-center gap-2">
                                <ArrowRight size={14} />
                                View Full Timeline
                            </button>
                        </div>
                    ) : (
                        <div className="text-xs text-text-secondary">Select a chat to see agent activity.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

