'use client';

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Search, User, Send, MessageCircle, CheckCircle2 } from 'lucide-react';
import { assignedChats, statusOptions } from '@/components/agent/mockData';

export default function AgentChatDesk() {
    const [searchQuery, setSearchQuery] = useState('');
    const [chats, setChats] = useState(assignedChats);
    const [activeId, setActiveId] = useState<string | null>(assignedChats[0]?.id || null);
    const [replyText, setReplyText] = useState('');

    const activeChat = chats.find((chat) => chat.id === activeId) || null;

    const filtered = useMemo(() => {
        return chats.filter((chat) => {
            const name = chat.user.name.toLowerCase();
            const subject = chat.subject.toLowerCase();
            const query = searchQuery.toLowerCase();
            return name.includes(query) || subject.includes(query) || chat.id.toLowerCase().includes(query);
        });
    }, [chats, searchQuery]);

    const updateStatus = (status: (typeof statusOptions)[number]) => {
        if (!activeChat) return;
        setChats((prev) => prev.map((chat) =>
            chat.id === activeChat.id
                ? {
                    ...chat,
                    status,
                    updatedAt: 'Just now',
                    activity: [...chat.activity, { action: `Status -> ${status}`, by: 'Agent', time: 'Just now' }],
                }
                : chat
        ));
    };

    const sendReply = () => {
        if (!replyText.trim() || !activeChat) return;
        setChats((prev) => prev.map((chat) =>
            chat.id === activeChat.id
                ? {
                    ...chat,
                    updatedAt: 'Just now',
                    messages: [...chat.messages, { sender: 'agent', text: replyText.trim(), time: 'Just now' }],
                    activity: [...chat.activity, { action: 'Reply sent', by: 'Agent', time: 'Just now' }],
                }
                : chat
        ));
        setReplyText('');
    };

    return (
        <div className="flex h-[calc(100vh-220px)] bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Assigned Chats</p>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search assigned chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                    {filtered.length === 0 ? (
                        <div className="p-10 text-center">
                            <MessageCircle className="w-8 h-8 mx-auto text-gray-200 mb-2" />
                            <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest">No assigned chats</p>
                        </div>
                    ) : filtered.map((chat) => (
                        <button
                            key={chat.id}
                            onClick={() => setActiveId(chat.id)}
                            className={cn(
                                'w-full p-4 flex gap-3 text-left hover:bg-white transition-colors',
                                activeId === chat.id ? 'bg-white border-l-4 border-primary' : ''
                            )}
                        >
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-gray-100">
                                <User size={18} className="text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="font-bold text-sm text-text-main truncate">{chat.user.name}</p>
                                    <p className="text-[10px] text-text-secondary font-bold">{chat.updatedAt}</p>
                                </div>
                                <p className="text-xs text-text-secondary truncate font-medium">{chat.subject}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border bg-blue-50 text-blue-600 border-blue-100">
                                        {chat.status}
                                    </span>
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{chat.priority}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-white">
                {activeChat ? (
                    <>
                        <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                    <User size={20} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-text-main">{activeChat.user.name}</p>
                                    <p className="text-xs text-text-secondary font-medium">
                                        {activeChat.subject} • {activeChat.channel}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {statusOptions.map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => updateStatus(status)}
                                        className={cn(
                                            'px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border',
                                            activeChat.status === status
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
                            {activeChat.messages.map((m, idx) => {
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
                                                    {isAgent ? 'Agent' : activeChat.user.name}
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
                            <CheckCircle2 size={48} className="text-gray-200" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-text-main uppercase tracking-tight">All Clear</h3>
                        <p className="text-xs text-text-secondary mt-2 max-w-sm font-bold uppercase tracking-widest opacity-60">
                            No active chat selected.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
