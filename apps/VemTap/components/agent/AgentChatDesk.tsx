'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentApi } from '@/lib/api/agent';
import { notify } from '@/lib/notify';
import { cn } from '@/lib/utils';
import { Search, User, Send, MessageCircle, CheckCircle2, Loader2, Clock } from 'lucide-react';

const statusOptions = ['Pending', 'In Progress', 'Resolved', 'Cancelled'] as const;

export default function AgentChatDesk() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

    const { data: chatsData, isLoading: chatsLoading } = useQuery({
        queryKey: ['agent-chats'],
        queryFn: () => agentApi.getChats({ limit: 100 }),
    });

    const chats = useMemo(() => {
        return Array.isArray(chatsData) ? chatsData : (chatsData?.data || []);
    }, [chatsData]);

    // Set first chat as active if none selected
    useEffect(() => {
        if (!activeId && chats.length > 0) {
            setActiveId(chats[0].id);
        }
    }, [chats, activeId]);

    const { data: activeChat, isLoading: isActiveLoading } = useQuery({
        queryKey: ['agent-chat', activeId],
        queryFn: () => agentApi.getTicketDetails(activeId!),
        enabled: !!activeId,
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => 
            agentApi.updateTicketStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-chats'] });
            queryClient.invalidateQueries({ queryKey: ['agent-chat', activeId] });
            notify.success('Status updated');
        },
        onError: () => notify.error('Failed to update status'),
    });

    const sendReplyMutation = useMutation({
        mutationFn: ({ id, message }: { id: string; message: string }) => 
            agentApi.sendReply(id, message),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-chat', activeId] });
            setReplyText('');
            notify.success('Message sent');
        },
        onError: () => notify.error('Failed to send message'),
    });

    const filtered = useMemo(() => {
        return chats.filter((chat: any) => {
            const name = (chat.user?.name || '').toLowerCase();
            const subject = (chat.subject || '').toLowerCase();
            const query = searchQuery.toLowerCase();
            return name.includes(query) || subject.includes(query) || String(chat.id).toLowerCase().includes(query);
        });
    }, [chats, searchQuery]);

    const handleSendReply = () => {
        if (!replyText.trim() || !activeId) return;
        sendReplyMutation.mutate({ id: activeId, message: replyText.trim() });
    };

    return (
        <div className="flex h-[calc(100vh-220px)] bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-3">Assigned Chats</p>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Find a conversation..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100 scrollbar-thin">
                    {chatsLoading ? (
                        <div className="p-10 text-center">
                            <Loader2 className="animate-spin text-primary mx-auto mb-3" size={24} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Syncing chats...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-10 text-center">
                            <MessageCircle className="w-8 h-8 mx-auto text-gray-200 mb-2" />
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">No assigned chats</p>
                        </div>
                    ) : filtered.map((chat: any) => (
                        <button
                            key={chat.id}
                            onClick={() => setActiveId(chat.id)}
                            className={cn(
                                'w-full p-4 flex gap-3 text-left hover:bg-white transition-all group relative',
                                activeId === chat.id ? 'bg-white' : ''
                            )}
                        >
                            {activeId === chat.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-colors",
                                activeId === chat.id ? "bg-primary/5 border-primary/20 text-primary" : "bg-white border-gray-100 text-gray-400 group-hover:border-primary/20 group-hover:text-primary"
                            )}>
                                <User size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="font-bold text-sm text-text-main truncate">{chat.user?.name || 'Customer'}</p>
                                    <p className="text-[10px] text-text-secondary font-bold">
                                        {chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </p>
                                </div>
                                <p className="text-xs text-text-secondary truncate font-medium">{chat.subject || 'New Conversation'}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className={cn(
                                        "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border",
                                        chat.status === 'Open' ? 'bg-red-50 text-red-600 border-red-100' :
                                            chat.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                'bg-green-50 text-green-600 border-green-100'
                                    )}>
                                        {chat.status}
                                    </span>
                                    {chat.priority && (
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{chat.priority}</span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-white">
                {activeId ? (
                    isActiveLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    ) : activeChat ? (
                        <>
                            <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-text-main text-sm">{activeChat.user?.name || 'Customer'}</p>
                                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">
                                            {activeChat.subject} • {activeChat.channel || 'Direct'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {statusOptions.map((status) => (
                                        <button
                                            key={status}
                                            disabled={updateStatusMutation.isPending}
                                            onClick={() => updateStatusMutation.mutate({ id: activeId, status })}
                                            className={cn(
                                                'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95',
                                                activeChat.status === status
                                                    ? 'bg-primary text-white border-primary shadow-sm'
                                                    : 'bg-white border-gray-200 text-text-secondary hover:bg-gray-50'
                                            )}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/20 scrollbar-thin">
                                {(activeChat.messages || []).length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                                        <MessageCircle size={40} className="text-gray-300 mb-3" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No messages in this thread</p>
                                    </div>
                                ) : activeChat.messages.map((m: any, idx: number) => {
                                    const isAgent = m.sender === 'agent';
                                    return (
                                        <div key={idx} className={cn('flex flex-col', isAgent ? 'items-end' : 'items-start')}>
                                            <div className={cn(
                                                'max-w-[70%] px-4 py-3 shadow-sm rounded-2xl text-sm leading-relaxed',
                                                isAgent 
                                                    ? 'bg-primary text-white rounded-tr-none' 
                                                    : 'bg-white border border-gray-100 text-text-main rounded-tl-none'
                                            )}>
                                                {m.text}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1.5 px-1 opacity-50">
                                                <span className="text-[8px] font-black uppercase tracking-[0.1em]">
                                                    {isAgent ? 'Support Team' : (activeChat.user?.name || 'Customer')}
                                                </span>
                                                <Clock size={8} />
                                                <span className="text-[8px] font-bold">
                                                    {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-5 border-t border-gray-100 bg-white">
                                <div className="flex items-end gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                                    <textarea
                                        rows={2}
                                        placeholder="Type your message..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        className="flex-1 bg-transparent resize-none border-none outline-none text-sm font-medium px-3 py-2 placeholder:text-gray-400"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendReply();
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={handleSendReply}
                                        disabled={!replyText.trim() || sendReplyMutation.isPending}
                                        className="size-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:bg-primary-hover hover:scale-105 transition-all transform active:scale-95 disabled:opacity-40"
                                    >
                                        {sendReplyMutation.isPending ? (
                                            <Loader2 className="animate-spin" size={20} />
                                        ) : (
                                            <Send size={20} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                            <div className="size-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                                <MessageCircle size={28} className="text-red-500" />
                            </div>
                            <h4 className="font-bold text-text-main mb-1">Conversation Not Found</h4>
                            <p className="text-xs text-text-secondary leading-relaxed max-w-[250px]">
                                This chat might have been reassigned or deleted.
                            </p>
                        </div>
                    )
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                        <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mb-6 border-2 border-dashed border-gray-200">
                            <CheckCircle2 size={42} className="text-gray-200" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-text-main uppercase tracking-tight">Inbox Focused</h3>
                        <p className="text-xs text-text-secondary mt-2 max-w-sm font-bold uppercase tracking-widest opacity-60 leading-relaxed">
                            No active chat selected. <br/> Pick one from the queue to start.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
