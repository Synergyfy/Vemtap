'use client';

import React, { useMemo } from 'react';
import { useChatStore, ChatConversation } from '@/lib/store/useChatStore';
import { Search, Plus, MoreVertical } from 'lucide-react';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useAuthStore } from '@/store/useAuthStore';
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

function formatTime(timestamp: number) {
    const diff = Date.now() - timestamp;
    const hours = diff / 3_600_000;
    if (hours < 24) {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (hours < 48) return 'Yesterday';
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ChatSidebar() {
    const conversations = useChatStore(s => s.conversations);
    const activeConversationId = useChatStore(s => s.activeConversationId);
    const searchQuery = useChatStore(s => s.searchQuery);
    const setSearchQuery = useChatStore(s => s.setSearchQuery);
    const setActiveConversation = useChatStore(s => s.setActiveConversation);
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const { data: business } = useMyBusiness(isAuthenticated);
    const user = useAuthStore(s => s.user);

    const isCustomer = user?.role === 'customer';
    
    // For business users, show their own business profile in the sidebar header
    // For customers, show the business they are talking to (or a placeholder if none selected)
    const activeConv = conversations.find(c => c.id === activeConversationId);
    
    const headerName = isCustomer 
        ? (activeConv?.contact?.name || 'Business Chat') 
        : (business?.name || user?.businessName || 'Vemtap');
        
    const headerLogo = isCustomer 
        ? (activeConv?.contact?.avatar) 
        : (business?.logoUrl || user?.businessLogo);


    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return conversations;
        return conversations.filter(c =>
            c.contact.name.toLowerCase().includes(q) ||
            c.lastMessage.toLowerCase().includes(q)
        );
    }, [conversations, searchQuery]);

    return (
        <aside className="w-80 lg:w-96 glass-sidebar flex flex-col h-full border-r border-slate-200 shrink-0">
            {/* Header */}
            <header className="p-4 border-b border-slate-200 flex justify-between items-center bg-white/50">
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
                        <Link 
                            href="/dashboard/messaging/chat/settings?tab=templates"
                            className="p-1.5 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                            title="Message Templates"
                        >
                            <Plus size={18} />
                        </Link>
                        <Link 
                            href="/dashboard/messaging/chat/settings"
                            className="p-1.5 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                            title="Chat Settings"
                        >
                            <MoreVertical size={18} />
                        </Link>
                    </div>
                )}
            </header>

            {/* Search */}
            <div className="p-4">
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
                {filtered.length === 0 ? (
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
    conversation: ChatConversation;
    isActive: boolean;
    onClick: () => void;
}) {
    const { contact } = conversation;

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
                {contact.avatar ? (
                    <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(contact.id)}`}>
                        {getInitials(contact.name)}
                    </div>
                )}
                {contact.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                    <h3 className={`text-sm truncate ${isActive ? 'font-semibold text-slate-900' : 'font-medium text-slate-900'}`}>
                        {contact.name}
                    </h3>
                    <span className="text-xs text-slate-400 shrink-0 ml-2">
                        {formatTime(conversation.lastMessageTime)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <p className={`text-xs truncate flex-1 ${
                        conversation.unreadCount > 0 ? 'font-semibold text-slate-700' : 'text-slate-500'
                    }`}>
                        {conversation.isTyping ? (
                            <span className="text-primary font-medium">typing...</span>
                        ) : (
                            conversation.lastMessage
                        )}
                    </p>
                    {conversation.unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1">
                            {conversation.unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}
