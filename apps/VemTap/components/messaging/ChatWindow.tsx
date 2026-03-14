'use client';

import React, { useRef, useEffect } from 'react';
import { useChatStore, ChatMessage } from '@/lib/store/useChatStore';
import { Search, Phone, MoreVertical, FileText, Check, CheckCheck, Maximize2, Minimize2 } from 'lucide-react';
import ChatInput from './ChatInput';
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

function formatMessageTime(timestamp: number) {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateSeparator(timestamp: number) {
    const today = new Date();
    const msgDate = new Date(timestamp);
    if (today.toDateString() === msgDate.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday.toDateString() === msgDate.toDateString()) return 'Yesterday';
    return msgDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

function StatusIcon({ status }: { status: ChatMessage['status'] }) {
    if (status === 'sent') return <Check size={14} className="text-slate-400" />;
    if (status === 'delivered') return <CheckCheck size={14} className="text-slate-400" />;
    return <CheckCheck size={14} className="text-primary" />;
}

export default function ChatWindow() {
    const activeConversationId = useChatStore(s => s.activeConversationId);
    const conversations = useChatStore(s => s.conversations);
    const messages = useChatStore(s => s.messages);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isFullScreen, setIsFullScreen] = React.useState(false);
    const user = useAuthStore(s => s.user);
    const isCustomer = user?.role === 'customer';

    const activeConv = conversations.find(c => c.id === activeConversationId);
    const activeMessages = activeConversationId ? (messages[activeConversationId] || []) : [];

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeMessages.length, activeConversationId]);

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

    // Group messages by date
    let lastDate = '';

    return (
        <div className={`flex-1 flex flex-col h-full bg-white transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-[100] m-0 rounded-none' : ''}`}>
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 z-10 bg-white shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        {contact.avatar ? (
                            <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${getAvatarColor(contact.id)}`}>
                                {getInitials(contact.name)}
                            </div>
                        )}
                        {contact.isOnline && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 leading-tight">{contact.name}</h2>
                        {activeConv.isTyping ? (
                            <p className="text-[11px] text-primary font-medium animate-pulse">typing...</p>
                        ) : contact.isOnline ? (
                            <p className="text-[11px] text-green-600 font-medium">Online</p>
                        ) : (
                            <p className="text-[11px] text-slate-400">
                                {contact.phone || contact.email || 'Offline'}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                    <button 
                        onClick={() => setIsFullScreen(!isFullScreen)}
                        className="p-2 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                        title={isFullScreen ? 'Close Full Screen' : 'Full Screen'}
                    >
                        {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                    <button className="p-2 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                        <Search size={18} />
                    </button>
                    {!isCustomer && (
                        <div className="relative group">
                            <button className="p-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-all flex items-center gap-2 font-bold text-xs ring-1 ring-primary/20 shadow-sm shadow-primary/5">
                                <span className="material-symbols-outlined text-[20px]">settings</span>
                                <span>Settings</span>
                            </button>
                            
                            {/* Dropdown Menu */}
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 origin-top-right z-50">
                                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuration</p>
                                </div>
                                <Link 
                                    href="/dashboard/messaging/chat/settings?tab=automation"
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                                    <span>Automated Replies</span>
                                </Link>
                                <Link 
                                    href="/dashboard/messaging/chat/settings?tab=templates"
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">description</span>
                                    <span>Message Templates</span>
                                </Link>
                                <Link 
                                    href="/dashboard/messaging/chat/settings?tab=categories"
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">category</span>
                                    <span>Ticket Categories</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 chat-bg custom-scrollbar">
                {activeMessages.map((msg, i) => {
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
            <ChatInput conversationId={activeConversationId!} />
        </div>
    );
}

function MessageBubble({ message, isCustomer }: { message: ChatMessage; isCustomer: boolean }) {
    // If user is a customer, the store's "outbound" messages (from business) are actually "inbound" for them
    // and the store's "inbound" messages (from customer) are "outbound" for them.
    const isOutbound = isCustomer 
        ? message.direction === 'inbound' 
        : message.direction === 'outbound';

    return (
        <div className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'} max-w-[80%] ${isOutbound ? 'ml-auto' : ''}`}>
            <div className={`p-3 shadow-sm ${
                isOutbound
                    ? 'bg-primary text-white bubble-right'
                    : 'bg-white border border-slate-200 text-slate-700 bubble-left'
            }`}>
                {/* File attachment */}
                {message.type === 'file' && (
                    <div className={`flex items-center gap-3 p-3 rounded-lg mb-2 ${
                        isOutbound ? 'bg-white/10' : 'bg-slate-50 border border-slate-100'
                    }`}>
                        <div className={`p-2 rounded ${isOutbound ? 'bg-white/20' : 'bg-red-50 text-red-600'}`}>
                            <FileText size={24} />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold truncate">{message.fileName}</p>
                            <p className={`text-[10px] uppercase ${isOutbound ? 'text-white/70' : 'text-slate-500'}`}>
                                {message.fileSize} • PDF
                            </p>
                        </div>
                    </div>
                )}

                {/* Image */}
                {message.type === 'image' && message.fileUrl && (
                    <div className="mb-2">
                        <img
                            src={message.fileUrl}
                            alt="Shared image"
                            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ maxHeight: 240 }}
                        />
                    </div>
                )}

                {/* Text content */}
                <p className="text-sm leading-relaxed">{message.content}</p>
            </div>

            {/* Timestamp & Status */}
            <div className={`flex items-center gap-1 mt-1 ${isOutbound ? 'mr-1' : 'ml-1'}`}>
                <span className="text-[10px] text-slate-400">{formatMessageTime(message.timestamp)}</span>
                {isOutbound && <StatusIcon status={message.status} />}
            </div>
        </div>
    );
}
