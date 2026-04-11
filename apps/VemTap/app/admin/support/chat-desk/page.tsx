'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
    Search, User, Send, MessageCircle, CheckCircle2, 
    Loader2, Clock, Filter, MoreVertical, Paperclip, 
    Smile, Shield, Mail, Phone, MapPin, ExternalLink,
    ChevronRight, ArrowLeft, History, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSupportTickets, useSupportTicket, useSendSupportMessage, useUpdateTicketStatus } from '@/services/support/hooks';
import { useSupportSocket } from '@/hooks/useSupportSocket';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

// Remove MOCK_CHATS and MOCK_MESSAGES constants as they are replaced by API hooks

export default function AdminChatDesk() {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [replyText, setReplyText] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    
    const { data: ticketsData, refetch: refetchTickets } = useSupportTickets({ type: 'Chat' });
    const { data: ticketDetail, refetch: refetchTicket } = useSupportTicket(activeId || '', true);
    
    const sendMutation = useSendSupportMessage(activeId || '', true);
    const resolveMutation = useUpdateTicketStatus(activeId || '');
    
    const { socket } = useSupportSocket();
    
    const chats = ticketsData?.data || [];
    const activeChat = ticketDetail;
    const messages = ticketDetail?.messages || [];
    
    // Socket integration
    useEffect(() => {
        if (socket && activeId) {
            socket.emit('joinTicket', { ticketId: activeId });
            
            const handleNewMessage = () => {
                refetchTicket();
                refetchTickets();
            };
            
            socket.on('newSupportMessage', handleNewMessage);

            // Listen for new escalations globally
            socket.on('newChatEscalated', () => {
                refetchTickets();
                toast.success('New live support request!');
            });

            return () => {
                socket.off('newSupportMessage', handleNewMessage);
                socket.off('newChatEscalated');
                socket.emit('leaveTicket', { ticketId: activeId });
            };
        }
    }, [socket, activeId, refetchTicket, refetchTickets]);

    useEffect(() => {
        if (!activeId && chats.length > 0) {
            setActiveId(chats[0].id);
        }
    }, [chats, activeId]);
    
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!replyText.trim()) return;
        setReplyText('');
    };

    return (
        <div className="h-[calc(100vh-64px)] p-4 lg:p-6 bg-gray-50">
            <div className="flex h-full bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
            
            {/* Conversations Sidebar (Left) */}
            <div className="w-96 bg-gray-50/50 border-r border-gray-100 flex flex-col pt-6">
                <div className="px-6 mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Inbox</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                            4 Agent Sessions Active
                        </p>
                    </div>
                    <button className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                        <Filter size={18} className="text-gray-500" />
                    </button>
                </div>

                <div className="px-6 mb-6">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Find a conversation..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-50 transition-all outline-none shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 px-3 pb-6">
                    {chats.map((chat: any) => (
                        <button
                            key={chat.id}
                            onClick={() => setActiveId(chat.id)}
                            className={cn(
                                'w-full p-4 flex gap-4 text-left transition-all rounded-[1.5rem] group relative',
                                activeId === chat.id 
                                    ? 'bg-white shadow-xl shadow-blue-500/5 ring-1 ring-blue-100' 
                                    : 'hover:bg-white/60'
                            )}
                        >
                            <div className="relative">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm border-2 transition-transform group-hover:scale-105",
                                    activeId === chat.id ? "bg-blue-600 border-blue-400 text-white" : "bg-white border-gray-100 text-gray-400"
                                )}>
                                    {chat.user 
                                        ? `${chat.user.firstName?.[0] || ''}${chat.user.lastName?.[0] || ''}`
                                        : (chat.guestName?.[0] || '?')}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-0.5">
                                    <p className="font-bold text-[15px] text-gray-900 truncate">
                                        {chat.user ? `${chat.user.firstName} ${chat.user.lastName}` : (chat.guestName || 'Anonymous Guest')}
                                    </p>
                                    <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap pt-0.5">
                                        {format(new Date(chat.createdAt), 'HH:mm')}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 truncate font-medium">{chat.subject}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                                        chat.status === 'In Progress' ? 'bg-blue-50 text-blue-600' : 
                                        chat.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                                    )}>
                                        {chat.status}
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Window (Center) */}
            <div className="flex-1 flex flex-col bg-white relative">
                {activeChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-24 px-8 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-blue-600 border border-gray-100 shadow-inner">
                                    <User size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-gray-900 text-lg leading-none">
                                            {activeChat.user ? `${activeChat.user.firstName} ${activeChat.user.lastName}` : (activeChat.guestName || 'Anonymous Guest')}
                                        </h3>
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">
                                        {activeChat.type} • {activeChat.priority} Priority
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Request Call">
                                    <Phone size={20} />
                                </button>
                                <button 
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    className={cn(
                                        "p-3 rounded-xl transition-all",
                                        isSidebarOpen ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:bg-gray-50"
                                    )} 
                                    title="Information"
                                >
                                    <Shield size={20} />
                                </button>
                                <button className="p-3 text-gray-400 hover:bg-gray-50 rounded-xl transition-all">
                                    <MoreVertical size={20} />
                                </button>
                                <div className="h-8 w-px bg-gray-100 mx-2" />
                                <button 
                                    onClick={() => resolveMutation.mutate('Resolved')}
                                    disabled={resolveMutation.isPending || activeChat.status === 'Resolved'}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                                >
                                    {resolveMutation.isPending ? 'Working...' : 'Resolve'}
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 bg-gray-50/20">
                            <div className="flex items-center justify-center mb-8">
                                <div className="px-4 py-1.5 bg-white border border-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 shadow-sm">
                                    Today, February 24th
                                </div>
                            </div>

                            {messages.map((m: any) => {
                                const isAgent = m.senderRole === 'AGENT' || m.senderRole === 'BOT' || m.senderRole === 'SYSTEM' || m.senderId !== activeChat.userId;
                                return (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={m.id} 
                                        className={cn('flex items-end gap-3', isAgent ? 'flex-row-reverse' : 'flex-row')}
                                    >
                                        <div className={cn(
                                            'w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border shadow-sm',
                                            isAgent ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white border-gray-200 text-gray-400'
                                        )}>
                                            {isAgent ? 'YOU' : (activeChat.user?.firstName?.[0] || activeChat.guestName?.[0] || '?')}
                                        </div>
                                        <div className={cn(
                                            'max-w-[60%] px-5 py-3.5 shadow-sm rounded-2xl text-[13px] leading-relaxed font-medium',
                                            isAgent 
                                                ? 'bg-white border border-gray-100 text-gray-800 rounded-br-none' 
                                                : 'bg-indigo-600 text-white rounded-bl-none shadow-indigo-200 shadow-xl'
                                        )}>
                                            {m.message}
                                            <p className={cn(
                                                "text-[9px] mt-2 font-bold uppercase tracking-tight opacity-50",
                                                isAgent ? "text-gray-400" : "text-white"
                                            )}>
                                                {format(new Date(m.createdAt), 'HH:mm')}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Input Area */}
                        <div className="p-8 border-t border-gray-50 bg-white">
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                if (!replyText.trim() || sendMutation.isPending) return;
                                sendMutation.mutate(replyText, {
                                    onSuccess: () => {
                                        setReplyText('');
                                        refetchTicket();
                                    }
                                });
                            }} className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-300">
                                    <button type="button" className="hover:text-blue-500 transition-colors"><Smile size={20} /></button>
                                    <button type="button" className="hover:text-blue-500 transition-colors"><Paperclip size={20} /></button>
                                </div>
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder={`Reply to ${activeChat.user?.firstName || activeChat.guestName || 'Guest'}...`}
                                    className="w-full pl-24 pr-32 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-medium focus:ring-8 focus:ring-blue-50 focus:bg-white transition-all outline-none resize-none shadow-inner min-h-[64px]"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            e.currentTarget.form?.requestSubmit();
                                        }
                                    }}
                                />
                                <div className="absolute right-3 top-3 flex items-center gap-2">
                                    <div className="text-[10px] font-black uppercase text-gray-300 px-3 hidden md:block">Cmd + Enter to send</div>
                                    <button
                                        type="submit"
                                        disabled={!replyText.trim() || sendMutation.isPending}
                                        className="size-12 bg-blue-600 text-white rounded-[1.2rem] flex items-center justify-center shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-105 transition-all transform active:scale-90 disabled:opacity-40 disabled:scale-100"
                                    >
                                        {sendMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center grayscale opacity-30">
                        <MessageCircle size={80} className="text-gray-200 mb-6" />
                        <h3 className="text-xl font-bold uppercase tracking-widest">Select a Conversation</h3>
                    </div>
                )}
            </div>

            {/* Context Sidebar (Right) */}
            <AnimatePresence>
                {isSidebarOpen && activeChat && (
                    <motion.div 
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 340, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="bg-gray-50/30 border-l border-gray-100 overflow-hidden flex flex-col"
                    >
                        <div className="p-8 space-y-8 overflow-y-auto">
                            <div className="text-center">
                                <div className="w-24 h-24 bg-white border-4 border-white rounded-[2rem] shadow-2xl mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-blue-600 shadow-blue-500/10">
                                    {activeChat.user ? activeChat.user.firstName?.[0] : (activeChat.guestName?.[0] || '?')}
                                </div>
                                <h4 className="text-lg font-bold text-gray-900 leading-tight">
                                    {activeChat.user ? `${activeChat.user.firstName} ${activeChat.user.lastName}` : (activeChat.guestName || 'Anonymous Guest')}
                                </h4>
                                <p className="text-xs text-gray-500 font-medium mb-1">
                                    {activeChat.user ? activeChat.user.email : (activeChat.guestEmail || 'N/A')}
                                </p>
                                <span className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-blue-100 inline-block mt-2">
                                    {activeChat.user ? activeChat.user.role : 'Guest'}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">User Details</p>
                                <div className="space-y-3">
                                    {[
                                        { icon: Mail, label: 'Email', value: activeChat.user?.email || activeChat.guestEmail || 'N/A' },
                                        { icon: Phone, label: 'Phone', value: activeChat.user?.phone || 'N/A' },
                                        { icon: MapPin, label: 'Location', value: 'N/A' },
                                        { icon: Clock, label: 'Joined', value: format(new Date(activeChat.user?.createdAt || activeChat.createdAt), 'PPP') }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                            <item.icon size={14} className="text-gray-400" />
                                            <div>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{item.label}</p>
                                                <p className="text-xs font-bold text-gray-700 leading-tight">{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Platform Activity</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight mb-1">Total Visits</p>
                                        <p className="text-xl font-bold text-blue-600 leading-none">128</p>
                                    </div>
                                    <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight mb-1">Devices</p>
                                        <p className="text-xl font-bold text-blue-600 leading-none">3</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-100">
                                <button className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <History size={16} className="text-gray-400" />
                                        <span className="text-xs font-bold text-gray-700">Audit Logs</span>
                                    </div>
                                    <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500" />
                                </button>
                                <button className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <ExternalLink size={16} className="text-gray-400" />
                                        <span className="text-xs font-bold text-gray-700">View Analytics</span>
                                    </div>
                                    <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            </div>
        </div>
    );
}
