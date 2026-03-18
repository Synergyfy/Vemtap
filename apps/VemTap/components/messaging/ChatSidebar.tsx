'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/lib/store/useChatStore';
import { Search, Plus, MoreVertical, FileText } from 'lucide-react';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatThreads } from '@/hooks/useMessaging';
import { useMessagingBranch } from '@/hooks/useMessagingBranch';
import { useMessagingVisitorsByBranch } from '@/services/visitors/hooks';
import Link from 'next/link';

const AVATAR_COLORS = [
    'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
];

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatTime(timestamp: string | number | Date) {
    const time = new Date(timestamp).getTime();
    const diff = Date.now() - time;
    const hours = diff / 3_600_000;
    if (hours < 24) {
        return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (hours < 48) return 'Yesterday';
    return new Date(time).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ChatSidebar() {
    const activeConversationId = useChatStore(s => s.activeConversationId);
    const searchQuery = useChatStore(s => s.searchQuery);
    const setSearchQuery = useChatStore(s => s.setSearchQuery);
    const setActiveConversation = useChatStore(s => s.setActiveConversation);
    const mockThreads = useChatStore(s => s.mockThreads);
    const addMockThread = useChatStore(s => s.addMockThread);
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const { data: business } = useMyBusiness(isAuthenticated);
    const user = useAuthStore(s => s.user);
    const { branchId, isCustomer } = useMessagingBranch();
    const [showNewChat, setShowNewChat] = useState(false);
    const [customerQuery, setCustomerQuery] = useState('');
    const newChatRef = useRef<HTMLDivElement>(null);

    const { data: threads = [], isLoading: threadsLoading } = useChatThreads('IN_HOUSE', branchId || undefined);
    const { data: visitors = [], isLoading: visitorsLoading } = useMessagingVisitorsByBranch(branchId || undefined, { search: customerQuery });

    const allThreads = useMemo(() => {
        const apiThreads = threads as any[];
        const apiIds = new Set(apiThreads.map(t => t.id));
        const mergedMocks = mockThreads.filter(t => !apiIds.has(t.id));
        return [...mergedMocks, ...apiThreads];
    }, [threads, mockThreads]);

    const activeConv = allThreads.find(c => c.id === activeConversationId);
    
    const headerName = isCustomer 
        ? (activeConv?.contact?.name || 'Business Chat') 
        : (business?.name || user?.businessName || 'Vemtap');
        
    const headerLogo = isCustomer 
        ? (activeConv?.contact?.avatar) 
        : (business?.logoUrl || user?.businessLogo);


    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return allThreads;
        return allThreads.filter(c =>
            c.contact?.name?.toLowerCase().includes(q)
        );
    }, [allThreads, searchQuery]);

    const availableVisitors = useMemo(() => {
        const existingContactIds = new Set(allThreads.map(conv => conv.contact?.id).filter(Boolean));
        return visitors.filter(v => !existingContactIds.has(v.id));
    }, [allThreads, visitors]);

    useEffect(() => {
        if (!showNewChat) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (newChatRef.current && !newChatRef.current.contains(event.target as Node)) {
                setShowNewChat(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showNewChat]);

    return (
        <aside className="w-full md:w-80 lg:w-96 glass-sidebar flex flex-col h-full min-h-0 border-r border-slate-200 shrink-0">
            {/* Header */}
            <header className="p-4 border-b border-slate-200 flex justify-between items-center bg-white/90 backdrop-blur sticky top-0 z-20">
                <div className="flex items-center gap-2">
                    {headerLogo ? (
                        <img src={headerLogo} alt={headerName} className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {headerName.charAt(0)}
                        </div>
                    )}
                    <h1 className="font-bold text-lg text-slate-800 tracking-tight">{headerName}</h1>
                </div>
                {!isCustomer && (
                    <div className="flex gap-2 text-slate-400">
                        <div className="relative" ref={newChatRef}>
                            <button
                                type="button"
                                onClick={() => setShowNewChat(prev => !prev)}
                                className={`p-1.5 rounded-lg transition-colors ${branchId ? 'hover:text-primary hover:bg-slate-100' : 'text-slate-300'}`}
                                title="New Chat"
                            >
                                <Plus size={18} />
                            </button>

                            {showNewChat && (
                                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50">
                                    <div className="px-4 pb-2 border-b border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start new chat</p>
                                        <input
                                            type="text"
                                            placeholder="Search customers..."
                                            value={customerQuery}
                                            onChange={e => setCustomerQuery(e.target.value)}
                                            className="mt-2 w-full h-9 rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                        {!branchId ? (
                                            <div className="px-4 py-4 text-xs text-amber-600">Select a branch to start a chat.</div>
                                        ) : visitorsLoading ? (
                                            <div className="px-4 py-4 text-xs text-slate-400">Loading visitors...</div>
                                        ) : availableVisitors.length === 0 ? (
                                            <div className="px-4 py-4 text-xs text-slate-400">No visitors available.</div>
                                        ) : (
                                            availableVisitors.map(visitor => (
                                                <button
                                                    key={visitor.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const threadId = addMockThread(visitor);
                                                        setActiveConversation(threadId);
                                                        setShowNewChat(false);
                                                        setCustomerQuery('');
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left"
                                                >
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${getAvatarColor(visitor.id)}`}>
                                                        {getInitials(visitor.name)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 truncate">{visitor.name}</p>
                                                        <p className="text-xs text-slate-400 truncate">{visitor.phone || visitor.email}</p>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <Link 
                            href={`/dashboard/messaging/chat/settings?tab=templates${branchId ? `&branchId=${branchId}` : ''}`}
                            className="p-1.5 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                            title="Message Templates"
                        >
                            <FileText size={18} />
                        </Link>
                        <Link 
                            href={`/dashboard/messaging/chat/settings${branchId ? `?branchId=${branchId}` : ''}`}
                            className="p-1.5 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                            title="Chat Settings"
                        >
                            <MoreVertical size={18} />
                        </Link>
                    </div>
                )}
            </header>

            {/* Search */}
            <div className="p-4 sticky top-16 z-10 bg-white/90 backdrop-blur">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border-none bg-slate-200/50 rounded-xl text-sm placeholder-slate-500 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
                    />
                </div>
            </div>

            {/* Conversations */}
            <nav className="flex-1 overflow-y-auto custom-scrollbar">
                {!isCustomer && !branchId ? (
                    <div className="p-8 text-center text-amber-500 text-sm font-medium">Please select a branch first</div>
                ) : threadsLoading ? (
                     <div className="p-8 text-center text-slate-400 text-sm">Loading conversations...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">No conversations found.</div>
                ) : (
                    filtered.map(conv => (
                        <ConversationItem
                            key={conv.id}
                            conversation={conv}
                            isActive={conv.id === activeConversationId}
                            onClick={() => setActiveConversation(conv.id)}
                        />
                    ))
                )}
            </nav>
        </aside>
    );
}

function ConversationItem({
    conversation,
    isActive,
    onClick,
}: {
    conversation: any;
    isActive: boolean;
    onClick: () => void;
}) {
    const { contact } = conversation;
    const name = contact?.name || 'Unknown';

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 p-4 transition-colors text-left ${
                isActive
                    ? 'bg-primary/10 border-r-4 border-primary'
                    : 'hover:bg-slate-50 border-r-4 border-transparent'
            }`}
        >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
                {contact?.avatar ? (
                    <img src={contact.avatar} alt={name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(conversation.id)}`}>
                        {getInitials(name)}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                    <h3 className={`text-sm truncate ${isActive ? 'font-semibold text-slate-900' : 'font-medium text-slate-900'}`}>
                        {name}
                    </h3>
                    <span className="text-xs text-slate-400 shrink-0 ml-2">
                        {formatTime(conversation.lastActivityAt || conversation.updatedAt)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-xs truncate flex-1 text-slate-500">
                        {conversation.status || 'Active conversation'}
                    </p>
                </div>
            </div>
        </button>
    );
}
