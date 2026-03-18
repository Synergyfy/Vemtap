'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { useChatStore } from '@/lib/store/useChatStore';
import { Search, Maximize2, Minimize2, Check, CheckCheck, FileText, Info, Smartphone, MessageSquare } from 'lucide-react';
import ChatInput from './ChatInput';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { useChatThreads, useThreadMessages } from '@/hooks/useMessaging';
import { useMessagingBranch } from '@/hooks/useMessagingBranch';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

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

function formatMessageTime(timestamp: string | number | Date) {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateSeparator(timestamp: string | number | Date) {
    const today = new Date();
    const msgDate = new Date(timestamp);
    if (today.toDateString() === msgDate.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday.toDateString() === msgDate.toDateString()) return 'Yesterday';
    return msgDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

function StatusIcon({ status }: { status: string }) {
    if (status === 'SENT') return <Check size={14} className="text-slate-400" />;
    if (status === 'DELIVERED') return <CheckCheck size={14} className="text-slate-400" />;
    return <CheckCheck size={14} className="text-primary" />;
}

export default function ChatWindow() {
    const activeConversationId = useChatStore(s => s.activeConversationId);
    const mockThreads = useChatStore(s => s.mockThreads);
    const mockMessages = useChatStore(s => s.mockMessages);
    const user = useAuthStore(s => s.user);
    const { branchId, isCustomer } = useMessagingBranch();
    
    // Fetch all threads to find the active one
    const { data: threads = [] } = useChatThreads('IN_HOUSE', branchId || undefined, isCustomer);
    const allThreads = useMemo(() => {
        const apiThreads = threads as any[];
        const apiIds = new Set(apiThreads.map(t => t.id));
        const mergedMocks = mockThreads.filter(t => !apiIds.has(t.id));
        return [...mergedMocks, ...apiThreads];
    }, [threads, mockThreads]);
    const activeConv = allThreads.find(c => c.id === activeConversationId);
    const isMockThread = !!activeConversationId && mockThreads.some(t => t.id === activeConversationId);

    // Fetch messages for active thread (business or customer endpoint)
    const { data: messages = [], isLoading } = useThreadMessages(activeConversationId || '', branchId || undefined, isCustomer && !isMockThread);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isFullScreen, setIsFullScreen] = React.useState(false);
    const [showProfile, setShowProfile] = React.useState(false);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages?.length, activeConversationId, mockMessages]);

    useEffect(() => {
        setShowProfile(false);
    }, [activeConversationId]);

    if (!activeConv) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                <p className="font-bold text-slate-500 text-lg">Select a conversation</p>
                <p className="text-sm text-slate-400 mt-1">Choose a chat from the sidebar to start messaging</p>
            </div>
        );
    }

    const { contact } = activeConv;
    const contactName = contact?.name || 'Customer';
    const threadMessages = isMockThread ? (mockMessages[activeConversationId as string] || []) : (messages as any[]);
    const contactIsOnline = contact?.isOnline;
    const contactLastSeen = contact?.lastSeen ? new Date(contact.lastSeen).toLocaleString() : null;

    const lastActivityLabel = (() => {
        const raw = activeConv?.lastActivityAt || activeConv?.updatedAt;
        if (!raw) return 'Not available';
        const date = new Date(raw);
        return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
    })();

    // Group messages by date
    let lastDate = '';

    return (
        <div className={`flex-1 flex flex-col h-full min-h-0 bg-white transition-all duration-300 relative ${isFullScreen ? 'fixed inset-0 z-[100] m-0 rounded-none' : ''}`}>
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 z-10 bg-white shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        type="button"
                        onClick={() => setShowProfile(prev => !prev)}
                        className="relative"
                        title="View profile"
                    >
                        {contact?.avatar ? (
                            <img src={contact.avatar} alt={contactName} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${getAvatarColor(activeConv.id)}`}>
                                {getInitials(contactName)}
                            </div>
                        )}
                    </button>
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-slate-800 leading-tight truncate" title={contactName}>
                            {contactName}
                        </h2>
                        <p className="text-[11px] text-slate-400 truncate">
                            {contact?.phone || contact?.email || 'Active now'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                    <button
                        onClick={() => setShowProfile(prev => !prev)}
                        className={`p-2 rounded-lg transition-colors ${showProfile ? 'text-primary bg-primary/10' : 'hover:text-slate-600 hover:bg-slate-50'}`}
                        title="Contact info"
                    >
                        <Info size={18} />
                    </button>
                    <button 
                        onClick={() => setIsFullScreen(!isFullScreen)}
                        className="p-2 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                    {!isCustomer && (
                        <div className="relative group">
                            <button className="p-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-all flex items-center gap-2 font-bold text-xs ring-1 ring-primary/20 shadow-sm shadow-primary/5">
                                <span className="material-symbols-outlined text-[20px]">settings</span>
                                <span>Settings</span>
                            </button>
                            
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 origin-top-right z-50">
                                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuration</p>
                                </div>
                                <Link 
                                    href={`/dashboard/messaging/chat/settings?tab=automation${branchId ? `&branchId=${branchId}` : ''}`}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                                    <span>Automated Replies</span>
                                </Link>
                                <Link 
                                    href={`/dashboard/messaging/chat/settings?tab=templates${branchId ? `&branchId=${branchId}` : ''}`}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">description</span>
                                    <span>Message Templates</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <div className={`flex-1 flex flex-col min-h-0 transition-[padding] duration-300 ${showProfile ? 'pr-80' : ''}`}>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3 chat-bg custom-scrollbar">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-slate-400 text-sm">Loading messages...</div>
                    ) : threadMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                <FileText size={18} />
                            </div>
                            <p className="font-semibold text-slate-500">No messages yet</p>
                            <p className="text-xs text-slate-400 mt-1">Start the conversation to see messages here.</p>
                        </div>
                    ) : threadMessages.map((msg, i) => {
                        const msgDate = formatDateSeparator(msg.timestamp);
                        let showDate = false;
                        if (msgDate !== lastDate) {
                            showDate = true;
                            lastDate = msgDate;
                        }

                        return (
                            <React.Fragment key={msg.id}>
                                {showDate && (
                                    <div className="flex justify-center my-3">
                                        <span className="px-3 py-1 bg-slate-200/70 text-[10px] font-semibold text-slate-500 rounded-full uppercase tracking-wider">
                                            {msgDate}
                                        </span>
                                    </div>
                                )}
                                <MessageBubble message={msg} isCustomer={isCustomer} />
                            </React.Fragment>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <ChatInput conversationId={activeConversationId!} isMock={isMockThread} />
            </div>

            {/* Profile Panel */}
            <div
                className={`absolute top-16 right-0 bottom-0 w-full md:w-80 lg:w-96 bg-white border-l border-slate-200 shadow-lg transition-transform duration-300 ${showProfile ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Contact Info</p>
                        <h3 className="text-lg font-bold text-slate-900">Profile</h3>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowProfile(false)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
                    >
                        <Minimize2 size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto h-full">
                    <div className="flex flex-col items-center text-center gap-3">
                        {contact?.avatar ? (
                            <img src={contact.avatar} alt={contactName} className="w-20 h-20 rounded-full object-cover" />
                        ) : (
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-lg ${getAvatarColor(activeConv.id)}`}>
                                {getInitials(contactName)}
                            </div>
                        )}
                        <div>
                            <p className="text-lg font-bold text-slate-900">{contactName}</p>
                            <p className="text-xs text-slate-400 font-semibold">
                                {contactIsOnline ? 'Online' : contactLastSeen ? `Last seen ${contactLastSeen}` : 'Offline'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="rounded-xl border border-slate-100 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phone</p>
                            <p className="text-sm font-semibold text-slate-900">{contact?.phone || 'Not provided'}</p>
                        </div>
                        <div className="rounded-xl border border-slate-100 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</p>
                            <p className="text-sm font-semibold text-slate-900">{contact?.email || 'Not provided'}</p>
                        </div>
                        <div className="rounded-xl border border-slate-100 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</p>
                            <p className="text-sm font-semibold text-slate-900">{activeConv?.status || 'Active conversation'}</p>
                        </div>
                        <div className="rounded-xl border border-slate-100 p-3 bg-slate-50/50">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Source Channel</p>
                            <div className="flex items-center gap-2 mt-1">
                                {contact?.source === 'whatsapp' ? (
                                    <>
                                        <div className="size-5 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                                            <Smartphone size={10} />
                                        </div>
                                        <p className="text-sm font-bold text-emerald-600">WhatsApp Bridge</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="size-5 bg-primary rounded-full flex items-center justify-center text-white">
                                            <MessageSquare size={10} />
                                        </div>
                                        <p className="text-sm font-bold text-primary">{contact?.source || 'Direct/NFC'}</p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-100 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Last Activity</p>
                            <p className="text-sm font-semibold text-slate-900">{lastActivityLabel}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MessageBubble({ message, isCustomer }: { message: any; isCustomer: boolean }) {
    const isMine = isCustomer 
        ? message.direction === 'INBOUND'
        : message.direction === 'OUTBOUND';

    return (
        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[80%] ${isMine ? 'ml-auto' : ''}`}>
            <div className={`p-3 shadow-sm ${
                isMine
                    ? 'bg-primary text-white bubble-right'
                    : 'bg-white border border-slate-200 text-slate-700 bubble-left'
            }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
            </div>

            {/* Timestamp & Status */}
            <div className={`flex items-center gap-1 mt-1 ${isMine ? 'mr-1' : 'ml-1'}`}>
                <span className="text-[10px] text-slate-400">{formatMessageTime(message.timestamp)}</span>
                {isMine && <StatusIcon status={message.status} />}
            </div>
        </div>
    );
}
