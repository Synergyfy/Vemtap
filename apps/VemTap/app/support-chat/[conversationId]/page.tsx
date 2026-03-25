'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useThreadMessages, useChatThreads, useSendReply } from '@/hooks/useMessaging';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
    ArrowLeft, 
    Phone, 
    MoreVertical, 
    Smile, 
    Paperclip, 
    Send, 
    Settings,
    Search,
    X,
    Trash2,
    Pin,
    CheckCircle2
} from 'lucide-react';

function StandaloneChatContent() {
    const params = useParams();
    const router = useRouter();
    const conversationId = params.conversationId as string;
    const queryClient = useQueryClient();
    
    const { user } = useAuthStore();
    const { data: business } = useMyBusiness();
    const { activeBranchId } = useActiveBranch();
    
    const isCustomer = user?.role?.toLowerCase() === 'customer';
    const branchId = isCustomer ? undefined : activeBranchId;
    
    const {
        activeConversationId,
        setActiveConversation,
    } = useChatStore();

    const [text, setText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Queries
    const { data: threads = [] } = useChatThreads('IN_HOUSE', branchId || undefined, isCustomer);
    const activeConversation = (threads as any[]).find(c => c.id === conversationId);

    const { data: messages = [], isLoading: messagesLoading } = useQuery({
        queryKey: ['chat-messages', conversationId, branchId],
        queryFn: () => {
            const endpoint = isCustomer 
                ? `/customer/messaging/threads/${conversationId}` 
                : `/messaging/inbox/threads/${conversationId}${branchId ? `?branchId=${branchId}` : ''}`;
            return api.get(endpoint);
        },
        enabled: !!conversationId && conversationId !== 'default',
        refetchInterval: 5000,
    });

    // Mutations
    const businessReply = useSendReply(false);
    const customerReply = useSendReply(true);

    // Initial load
    useEffect(() => {
        if (conversationId && conversationId !== activeConversationId) {
            setActiveConversation(conversationId);
        }
    }, [conversationId, activeConversationId, setActiveConversation]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages?.length]);

    const handleSend = async () => {
        if (!text.trim()) return;
        
        try {
            if (isCustomer) {
                await customerReply.mutateAsync({ threadId: conversationId, content: text.trim() });
            } else {
                if (!branchId) {
                    toast.error('Please select a branch first');
                    return;
                }
                await businessReply.mutateAsync({ threadId: conversationId, content: text.trim(), branchId: branchId });
            }
            setText('');
            if (textareaRef.current) {
                textareaRef.current.style.height = '';
            }
            setShowEmojiPicker(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to send message');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        toast.error('File uploads are coming soon!');
    };

    const addEmoji = (emoji: string) => {
        setText(prev => prev + emoji);
        setShowEmojiPicker(false);
        textareaRef.current?.focus();
    };

    // Filter messages based on search
    const filteredMessages = (messages as any[]).filter(msg => 
        msg.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Determine header details
    const contactName = activeConversation?.contact?.name || 'User';
    const contactAvatar = activeConversation?.contact?.avatar;
    const isOnline = false;
    const logoUrl = contactAvatar || business?.logoUrl;
    
    const isTyping = false;

    if (!activeConversation && !messagesLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <X className="text-slate-300" size={32} />
                </div>
                <h3 className="font-bold text-slate-800">Conversation not found</h3>
                <p className="text-sm text-slate-500 mt-1 mb-6">This conversation might have been deleted or moved.</p>
                <button onClick={() => router.back()} className="px-6 py-2 bg-primary text-white rounded-xl font-bold">Go Back</button>
            </div>
        );
    }

    const isSending = businessReply.isPending || customerReply.isPending;

    return (
        <div className="bg-[#f8fafb] h-screen flex flex-col font-display text-slate-900 overflow-hidden relative">
            <style dangerouslySetInnerHTML={{__html: `
                .bubble-left { border-radius: 0 1.25rem 1.25rem 1.25rem; }
                .bubble-right { border-radius: 1.25rem 0 1.25rem 1.25rem; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />

            {/* Navigation Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-30 shrink-0">
                <div className="flex items-center space-x-3 overflow-hidden">
                    <button 
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-slate-600 active:bg-slate-100 rounded-full transition-colors hover:text-primary shrink-0"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    
                    <div className="flex items-center space-x-3 truncate">
                        <div className="relative shrink-0">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                                    {contactName?.charAt(0).toUpperCase() || '?'}
                                </div>
                            )}
                            {isOnline && (
                                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                            )}
                        </div>
                        <div className="flex flex-col truncate">
                            <h1 className="text-sm font-black leading-none text-slate-800 truncate tracking-tight">{contactName}</h1>
                            <p className="text-[11px] text-slate-500 mt-1 font-bold uppercase tracking-wider">
                                {isTyping ? (
                                    <span className="text-primary italic flex items-center gap-1">
                                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                                        typing...
                                    </span>
                                ) : (
                                    <span className={isOnline ? 'text-emerald-600' : 'text-slate-400'}>
                                        {isOnline ? 'Online now' : 'Offline'}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-1 text-slate-500">
                    <button 
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className={`p-2.5 rounded-xl transition-all ${isSearchOpen ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50'}`}
                    >
                        <Search size={22} />
                    </button>

                    <button 
                        className="p-2.5 hover:bg-slate-50 rounded-xl transition-all"
                        onClick={() => window.alert('Calling feature coming soon!')}
                    >
                        <Phone size={22} />
                    </button>
                    
                    {!isCustomer && (
                        <>
                            <button 
                                onClick={() => router.push(`/dashboard/messaging/chat/settings${branchId ? `?branchId=${branchId}` : ''}`)}
                                className="p-2.5 hover:bg-slate-50 rounded-xl transition-all"
                                title="Automated Messages Settings"
                            >
                                <Settings size={22} />
                            </button>
                            <div className="relative">
                                <button 
                                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                                    className={`p-2.5 rounded-xl transition-all ${showMoreMenu ? 'bg-slate-100 text-slate-800' : 'hover:bg-slate-50'}`}
                                >
                                    <MoreVertical size={22} />
                                </button>
                                
                                {showMoreMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                                        <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 zoom-in-95">
                                            <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700 transition-colors">
                                                <Pin size={18} /> Pin Conversation
                                            </button>
                                            <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700 transition-colors">
                                                <CheckCircle2 size={18} /> Resolve Ticket
                                            </button>
                                            <div className="my-1 border-t border-slate-50" />
                                            <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-rose-50 rounded-xl text-sm font-bold text-rose-600 transition-colors">
                                                <Trash2 size={18} /> Delete Chat
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </header>

            {/* Search Bar Overlay */}
            {isSearchOpen && (
                <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 animate-in slide-in-from-top-full duration-300 z-20">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            autoFocus
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search in conversation..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <button 
                        onClick={() => { setIsSearchOpen(false); setSearchTerm(''); }}
                        className="p-2 text-slate-400 hover:text-slate-600"
                    >
                        <X size={20} />
                    </button>
                </div>
            )}

            {/* Chat Thread */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 no-scrollbar bg-[#f1f4f9]" data-purpose="message-container">
                {messagesLoading && (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                )}
                
                {!messagesLoading && (
                    <>
                        <div className="flex justify-center my-6">
                            <span className="bg-white border border-slate-100 text-slate-400 text-[10px] px-4 py-1.5 rounded-full uppercase tracking-widest font-black shadow-sm">
                                Conversation History
                            </span>
                        </div>

                        {filteredMessages.map((msg: any, index) => {
                            const isMine = isCustomer 
                                ? msg.direction === 'INBOUND'
                                : msg.direction === 'OUTBOUND';

                            return (
                                <div 
                                    key={msg.id} 
                                    className={`flex flex-col group max-w-[85%] ${isMine ? 'items-end ml-auto' : 'items-start'}`}
                                >
                                    <div className={`
                                        p-4 shadow-sm text-[15px] leading-relaxed relative
                                        ${isMine ? 'bubble-right bg-primary text-white font-medium' : 'bubble-left bg-white text-slate-800 font-medium border border-white'}
                                    `}>
                                        <p>{msg.content}</p>
                                    </div>
                                    
                                    <div className={`flex items-center space-x-2 mt-2 ${isMine ? 'mr-1' : 'ml-1'}`}>
                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isMine && (
                                            <div className="flex items-center">
                                                <CheckCircle2 size={12} className={msg.status === 'READ' ? 'text-emerald-500' : 'text-slate-300'} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
                
                {filteredMessages.length === 0 && searchTerm && (
                    <div className="text-center py-20 text-slate-400 space-y-2">
                        <Search size={48} className="mx-auto opacity-10" />
                        <p className="font-bold">No messages matching "{searchTerm}"</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* Chat Input */}
            <footer className="bg-white border-t border-slate-100 p-4 pb-8 md:pb-6 shrink-0 relative z-30" data-purpose="input-bar">
                <div className="flex items-end gap-3 max-w-5xl mx-auto">
                    <div className="flex items-center mb-1 relative">
                        <button 
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`p-2.5 rounded-xl transition-all ${showEmojiPicker ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-primary'}`}
                        >
                            <Smile size={24} />
                        </button>
                        
                        {showEmojiPicker && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                                <div className="absolute bottom-14 left-0 bg-white border border-slate-100 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-bottom-2 grid grid-cols-6 gap-2 w-64">
                                    {['😊', '😍', '🤩', '🔥', '👍', '✅', '🙏', '🎉', '💡', '❤️', '📅', '🚧'].map(emoji => (
                                        <button 
                                            key={emoji} 
                                            onClick={() => addEmoji(emoji)}
                                            className="text-xl hover:scale-125 transition-transform"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2.5 text-slate-400 hover:text-primary transition-all"
                        >
                            <Paperclip size={24} />
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            className="hidden" 
                        />
                    </div>

                    <div className="flex-1 bg-slate-50 rounded-2xl px-5 py-3 border border-transparent focus-within:border-primary/20 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-primary/5 transition-all flex items-center min-h-[52px]">
                        <textarea 
                            ref={textareaRef}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-[15px] max-h-40 resize-none font-medium text-slate-700 outline-none"
                            placeholder="Write your message..."
                            disabled={isSending}
                            rows={1}
                            style={{ height: '24px' }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = '24px';
                                target.style.height = target.scrollHeight + 'px';
                            }}
                        />
                    </div>

                    <button 
                        onClick={handleSend}
                        disabled={!text.trim() || isSending}
                        className="bg-primary text-white size-12 rounded-2xl shadow-xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center shrink-0 mb-1 hover:brightness-110 disabled:opacity-50" 
                        data-purpose="send-message"
                    >
                        <Send size={24} className={`${isSending ? 'animate-pulse' : 'ml-1'}`} />
                    </button>
                </div>
            </footer>
        </div>
    );
}

export default function StandaloneChatPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#f8fafb]">Loading Chat...</div>}>
            <StandaloneChatContent />
        </Suspense>
    );
}
