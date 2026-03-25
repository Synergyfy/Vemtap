'use client';

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useChatStore } from '@/lib/store/useChatStore';
import { 
    Search, 
    Maximize2, 
    Minimize2, 
    Trash2, 
    Check, 
    CheckCheck, 
    FileText, 
    Info, 
    Smartphone, 
    MessageSquare, 
    CornerUpLeft, 
    ArrowLeft, 
    Settings 
} from 'lucide-react';
import ChatInput from './ChatInput';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatThreads, useMarkThreadAsRead, useThreadMessages, useDeleteMessage } from '@/hooks/useMessaging';
import { useMessagingBranch } from '@/hooks/useMessagingBranch';
import { useMessagingRealtime } from '@/hooks/useMessagingRealtime';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import Spinner from '../ui/Spinner';

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
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateSeparator(timestamp: string | number | Date) {
    if (!timestamp) return '';
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
    const setActiveConversation = useChatStore(s => s.setActiveConversation);
    const typingByThread = useChatStore(s => s.typingByThread);
    const { branchId, isCustomer } = useMessagingBranch();
    const searchParams = useSearchParams();
    
    // Fetch all threads to find the active one
    const { data: threads = [], isLoading: threadsLoading } = useChatThreads('IN_HOUSE', branchId || undefined, isCustomer);
    const user = useAuthStore((state) => state.user);
    const isOwner = user?.role === 'owner';
    const pendingThreads = useChatStore(s => s.pendingThreads);
    
    const allThreads: any[] = useMemo(() => {
        const real = threads as any[];
        const realIds = new Set(real.map(t => t.id));
        const realContactIds = new Set(real.map(t => t.contact?.id).filter(Boolean));
        
        // Filter pending: hide if its real counterpart is in the list
        const filteredPending = pendingThreads.filter(t => 
            !realIds.has(t.linkedThreadId || '') && 
            !realContactIds.has(t.contact?.id)
        );
        return [...filteredPending, ...real];
    }, [threads, pendingThreads]);
    
    const activeConv = allThreads.find(c => c.id === activeConversationId);
    const isPendingThread = activeConversationId?.startsWith('pending-');

    const [targetBranchId, setTargetBranchId] = useState<string | null>(null);
    const [targetBranchName, setTargetBranchName] = useState<string | null>(null);
    const [targetResolveError, setTargetResolveError] = useState<string | null>(null);
    const [targetResolving, setTargetResolving] = useState(false);
    const targetCode =
        searchParams.get('branchId') ||
        searchParams.get('businessId') ||
        searchParams.get('code');

    useEffect(() => {
        if (!isCustomer || !targetCode || targetBranchId || targetResolving) return;
        let cancelled = false;
        const isUuid = (value: string) =>
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

        const resolveTargetBranch = async () => {
            setTargetResolving(true);
            setTargetResolveError(null);
            try {
                if (isUuid(targetCode)) {
                    if (!cancelled) {
                        setTargetBranchId(targetCode);
                        setTargetBranchName(null);
                    }
                    return;
                }

                try {
                    const branch = await api.get(`/public/branches/code/${targetCode}`);
                    if (branch?.id) {
                        if (!cancelled) {
                            setTargetBranchId(branch.id);
                            setTargetBranchName(branch.name || branch?.business?.name || null);
                        }
                        return;
                    }
                } catch {
                    // fall through to business lookup
                }

                const business = await api.get(`/public/businesses/code/${targetCode}`);
                const branches = business?.branches || [];
                const mainBranch = branches.find((b: any) => b.isMainBranch) || branches[0];
                if (mainBranch?.id) {
                    if (!cancelled) {
                        setTargetBranchId(mainBranch.id);
                        setTargetBranchName(mainBranch.name || business?.name || null);
                    }
                } else if (!cancelled) {
                    setTargetResolveError('Could not resolve a branch for this chat link.');
                }
            } catch (error: any) {
                if (!cancelled) {
                    setTargetResolveError(error?.message || 'Failed to resolve chat target.');
                }
            } finally {
                if (!cancelled) {
                    setTargetResolving(false);
                }
            }
        };

        resolveTargetBranch();
        return () => {
            cancelled = true;
        };
    }, [isCustomer, targetCode, targetBranchId, targetResolving]);

    // Fetch messages for active thread (business or customer endpoint)
    const { data: messages = [], isLoading } = useThreadMessages(
        (!isPendingThread && activeConversationId) ? activeConversationId : '', 
        branchId || undefined, 
        isCustomer && !isPendingThread
    );
    const deleteMessageMutation = useDeleteMessage(isCustomer);
    const markThreadAsRead = useMarkThreadAsRead(isCustomer);
    const { emitTyping } = useMessagingRealtime({
        activeThreadId: activeConversationId,
        branchId: branchId || undefined,
        isCustomer,
        isPendingThread,
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isFullScreen, setIsFullScreen] = React.useState(false);
    const [showProfile, setShowProfile] = React.useState(false);
    const [replyToMessage, setReplyToMessage] = React.useState<any | null>(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [messages?.length, activeConversationId]);

    useEffect(() => {
        setShowProfile(false);
        setReplyToMessage(null);
    }, [activeConversationId]);

    useEffect(() => {
        if (!activeConversationId || isCustomer || isPendingThread || !branchId || !activeConv) return;
        // Only mark as read if there are actually unread messages
        if ((activeConv as any).unreadCount > 0) {
            markThreadAsRead.mutate({ threadId: activeConversationId, branchId });
        }
    }, [activeConversationId, branchId, isCustomer, isPendingThread, (activeConv as any)?.unreadCount, markThreadAsRead]);

    const handleConversationStarted = useCallback(
        (threadId: string) => {
            setActiveConversation(threadId);
        },
        [setActiveConversation]
    );


    if (!activeConv) {
        if (isCustomer && (targetBranchId || targetResolving || targetResolveError)) {
            return (
                <div className="flex-1 flex flex-col h-full min-h-0 bg-white">
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 px-6 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        {targetResolving ? (
                            <>
                                <p className="font-bold text-slate-500 text-lg">Preparing chat...</p>
                                <p className="text-sm text-slate-400 mt-1">Resolving the right branch for you.</p>
                            </>
                        ) : targetResolveError ? (
                            <>
                                <p className="font-bold text-slate-500 text-lg">Unable to start chat</p>
                                <p className="text-sm text-slate-400 mt-1">{targetResolveError}</p>
                            </>
                        ) : (
                            <>
                                <p className="font-bold text-slate-500 text-lg">
                                    Start a conversation{targetBranchName ? ` with ${targetBranchName}` : ''}
                                </p>
                                <p className="text-sm text-slate-400 mt-1">Send your first message below.</p>
                            </>
                        )}
                    </div>
                    {targetBranchId && !targetResolving && !targetResolveError && (
                        <ChatInput
                            startBranchId={targetBranchId}
                            onConversationStarted={handleConversationStarted}
                        />
                    )}
                </div>
            );
        }

        if (threadsLoading) {
            return (
                <div className="flex-1 flex flex-col h-full bg-slate-50 animate-pulse">
                    <div className="h-16 border-b border-slate-200 bg-white flex items-center px-4 justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-100 rounded-full" />
                            <div className="space-y-1.5">
                                <div className="h-2.5 w-24 bg-slate-100 rounded" />
                                <div className="h-2 w-16 bg-slate-100 rounded" />
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 p-6 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                <div className={`h-12 w-2/3 rounded-2xl ${i % 2 === 0 ? 'bg-primary/10' : 'bg-slate-200/50'}`} />
                            </div>
                        ))}
                    </div>
                    <div className="h-16 bg-white border-t border-slate-200 p-2">
                        <div className="h-full bg-slate-50 rounded-xl" />
                    </div>
                </div>
            );
        }

        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                    <MessageSquare className="w-10 h-10 text-slate-300" />
                </div>
                <p className="font-bold text-slate-500 text-lg">Select a conversation</p>
                <p className="text-sm text-slate-400 mt-1">Choose a chat from the sidebar to start messaging</p>
            </div>
        );
    }

    const { contact } = activeConv;
    
    // Name Fallback: If name is generic or missing, try to find it in pending threads (local cache)
    let contactName = contact?.name && contact.name !== 'Unknown' && contact.name !== 'Customer' ? contact.name : 'Unknown';
    if (contactName === 'Unknown') {
        const pending = pendingThreads.find(p => p.linkedThreadId === activeConv.id || p.contact?.id === contact?.id);
        if (pending?.contact?.name) {
            contactName = pending.contact.name;
        } else if (contact?.name) {
            contactName = contact.name; // Use whatever backend gave us if no pending match
        } else {
            contactName = 'Customer'; // Final fallback
        }
    }
    const threadMessages = [...messages].sort((a, b) => {
        const timeA = new Date(a.timestamp || a.createdAt || a.sentAt || a.updatedAt).getTime();
        const timeB = new Date(b.timestamp || b.createdAt || b.sentAt || b.updatedAt).getTime();
        return timeA - timeB;
    }) as any[];
    const contactIsOnline = contact?.isOnline;
    const contactLastSeen = contact?.lastSeen ? new Date(contact.lastSeen).toLocaleString() : null;
    const isTyping = activeConversationId ? typingByThread[activeConversationId] : false;

    const lastActivityLabel = (() => {
        const raw = activeConv?.lastActivityAt || activeConv?.updatedAt;
        if (!raw) return 'Not available';
        const date = new Date(raw);
        return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
    })();

    // Group messages by date
    let lastDate = '';

    return (
        <div className={`flex-1 flex flex-col h-full min-h-0 bg-white transition-all duration-300 relative overflow-hidden ${isFullScreen ? 'fixed inset-0 z-100 m-0 rounded-none' : ''}`}>
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-4 border-b border-slate-200 z-10 bg-white shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    {/* Mobile Back Button */}
                    <button
                        onClick={() => setActiveConversation(null)}
                        className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => setShowProfile(prev => !prev)}
                        className="relative"
                        title="View profile"
                    >
                        {contact?.avatar ? (
                            <img src={contact.avatar} alt={contactName} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs ${getAvatarColor(activeConv.id)}`}>
                                {getInitials(contactName)}
                            </div>
                        )}
                    </button>
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-slate-800 leading-tight truncate" title={contactName}>
                            {contactName}
                        </h2>
                        <p className="text-[10px] text-slate-400 truncate font-medium">
                            {isTyping ? 'Typing...' : (contact?.phone || contact?.email || 'Active now')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                    <button
                        onClick={() => setShowProfile(prev => !prev)}
                        className={`p-2 rounded-lg transition-colors ${showProfile ? 'text-primary bg-primary/10' : 'hover:text-slate-600 hover:bg-slate-50'}`}
                        title="Contact info"
                    >
                        <Info size={18} />
                    </button>
                    <button 
                        onClick={() => setIsFullScreen(!isFullScreen)}
                        className="hidden md:block p-2 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                    {!isCustomer && (
                        <Link 
                            href={`/dashboard/messaging/chat/settings${branchId ? `?branchId=${branchId}` : ''}`}
                            className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-all"
                        >
                            <Settings size={18} />
                        </Link>
                    )}
                </div>
            </header>

            <div className={`flex-1 flex flex-col min-h-0 transition-[padding] duration-300 ${showProfile ? 'md:pr-80' : ''}`}>
                {/* Messages: Add dynamic padding to accommodate keyboard */}
                <div 
                    className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 chat-bg custom-scrollbar pb-24 md:pb-6"
                >
                    {isLoading ? (
                        <div className="flex-1 space-y-4 animate-pulse">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`h-10 w-2/3 rounded-xl ${i % 2 === 0 ? 'bg-primary/10' : 'bg-slate-100'}`} />
                                </div>
                            ))}
                        </div>
                    ) : threadMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                <FileText size={18} />
                            </div>
                            <p className="font-semibold text-slate-500">No messages yet</p>
                            <p className="text-xs text-slate-400 mt-1">Start the conversation to see messages here.</p>
                        </div>
                    ) : threadMessages.map((msg, i) => {
                        const msgTimestamp = msg.timestamp || msg.createdAt || msg.sentAt || msg.updatedAt;
                        const msgDate = formatDateSeparator(msgTimestamp);
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
                                <MessageBubble
                                    message={msg}
                                    isCustomer={isCustomer}
                                    showOwnerPill={!isCustomer && msg.direction === 'OUTBOUND' && user?.role === 'owner'}
                                    onReply={() => setReplyToMessage(msg)}
                                    onDelete={() => {
                                        if (window.confirm('Delete this message?')) {
                                            deleteMessageMutation.mutate({ 
                                                messageId: msg.id, 
                                                threadId: activeConversationId!, 
                                                branchId: branchId || undefined 
                                            });
                                        }
                                    }}
                                />
                            </React.Fragment>
                        );
                    })}
                    {isTyping && (
                        <div className="flex items-center gap-2 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[10px] ${getAvatarColor(activeConv.id)}`}>
                                {getInitials(contactName)}
                            </div>
                            <div className="bg-slate-100 border border-slate-200 p-3 rounded-2xl rounded-bl-none flex items-center gap-1">
                                <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input: Use viewport-height-aware positioning to stay above keyboard */}
                <div className="md:shrink-0 bg-white fixed md:relative bottom-0 left-0 right-0 w-full z-20 md:z-10 safe-area-bottom border-t border-slate-200">
                    <ChatInput
                        conversationId={activeConversationId || undefined}
                        replyTo={replyToMessage}
                        onCancelReply={() => setReplyToMessage(null)}
                        onTypingChange={(next) => {
                            if (!activeConversationId) return;
                            emitTyping(activeConversationId, next);
                        }}
                    />
                </div>
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

function MessageBubble({
    message,
    isCustomer,
    showOwnerPill,
    onReply,
    onDelete,
}: {
    message: any;
    isCustomer: boolean;
    showOwnerPill?: boolean;
    onReply?: () => void;
    onDelete?: () => void;
}) {
    const isMine = isCustomer 
        ? message.direction === 'INBOUND'
        : message.direction === 'OUTBOUND';
    const replyContent = message?.replyTo?.content || '';
    const [showActionsMobile, setShowActionsMobile] = useState(false);

    return (
        <div 
            className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[80%] ${isMine ? 'ml-auto' : ''}`}
            onClick={() => setShowActionsMobile(!showActionsMobile)}
        >
            <div className={`p-3 shadow-sm relative group ${
                isMine
                    ? 'bg-primary text-white bubble-right'
                    : 'bg-white border border-slate-200 text-slate-700 bubble-left'
            }`}>
                {(onReply || onDelete) && (
                    <div className={`absolute -top-3 ${isMine ? 'right-2' : 'left-2'} flex gap-1 transition-opacity ${showActionsMobile ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}>
                        {onReply && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onReply(); }}
                                className={`h-6 px-2 rounded-full text-[10px] font-bold flex items-center gap-1 border shadow-sm ${
                                    isMine
                                        ? 'bg-white text-primary border-white/40'
                                        : 'bg-white text-slate-500 border-slate-200'
                                }`}
                                title="Reply to message"
                            >
                                <CornerUpLeft size={12} />
                                Reply
                            </button>
                        )}
                        {onDelete && isMine && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                className="h-6 px-2 rounded-full text-[10px] font-bold flex items-center gap-1 border shadow-sm bg-white text-rose-500 border-rose-200 hover:bg-rose-50"
                                title="Delete message"
                            >
                                <Trash2 size={12} />
                                Delete
                            </button>
                        )}
                    </div>
                )}
                {replyContent && (
                    <div className={`mb-2 rounded-lg px-2 py-1 text-[11px] ${
                        isMine ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-500 border border-slate-200'
                    }`}>
                        <p className="line-clamp-2">{replyContent}</p>
                    </div>
                )}
                <p className="text-sm leading-relaxed">{message.content}</p>
            </div>

            {/* Timestamp & Status */}
            <div className={`flex items-center gap-1.5 mt-1 ${isMine ? 'mr-1' : 'ml-1'}`}>
                {showOwnerPill && (
                    <span className="px-1.5 py-0.5 bg-white/20 text-white text-[9px] font-bold rounded-full border border-white/30 mr-1 shadow-sm">
                        OWNER
                    </span>
                )}
                <span className="text-[10px] text-slate-400">
                    {formatMessageTime(message.timestamp || message.createdAt || message.sentAt || message.updatedAt)}
                </span>
                {isMine && <StatusIcon status={message.status} />}
            </div>
        </div>
    );
}
