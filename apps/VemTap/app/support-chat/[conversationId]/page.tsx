'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { useMyBusiness } from '@/services/businesses/hooks';
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

export default function StandaloneChatPage() {
    const params = useParams();
    const router = useRouter();
    const conversationId = params.conversationId as string;
    
    const { user } = useAuthStore();
    const { data: business } = useMyBusiness();
    const isCustomer = user?.role === 'customer';
    
    const {
        conversations,
        messages,
        activeConversationId,
        setActiveConversation,
        sendMessage,
        markAsRead,
    } = useChatStore();

    const [text, setText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial load
    useEffect(() => {
        if (conversationId && conversationId !== activeConversationId) {
            setActiveConversation(conversationId);
            markAsRead(conversationId);
        }
    }, [conversationId, activeConversationId, setActiveConversation, markAsRead]);

    // Scroll to bottom when messages change
    const conversationMessages = messages[conversationId] || [];
    
    // Filter messages based on search
    const filteredMessages = conversationMessages.filter(msg => 
        msg.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [filteredMessages.length]);

    const handleSend = () => {
        if (!text.trim()) return;
        const direction = isCustomer ? 'inbound' : 'outbound';
        sendMessage(conversationId, text.trim(), 'text', direction);
        setText('');
        if (textareaRef.current) {
            textareaRef.current.style.height = '';
        }
        setShowEmojiPicker(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Simulate file upload message
            const direction = isCustomer ? 'inbound' : 'outbound';
            sendMessage(conversationId, `Uploaded file: ${file.name}`, 'text', direction);
        }
    };

    const addEmoji = (emoji: string) => {
        setText(prev => prev + emoji);
        setShowEmojiPicker(false);
        textareaRef.current?.focus();
    };

    const activeConversation = conversations.find(c => c.id === conversationId);
    
    // Determine header details
    const contactName = activeConversation?.contact?.name;
    const contactAvatar = activeConversation?.contact?.avatar;
    const isOnline = activeConversation?.contact?.isOnline;
    const logoUrl = isCustomer ? (contactAvatar || business?.logoUrl) : (business?.logoUrl || contactAvatar);
    
    const isTyping = activeConversation?.isTyping;

    if (!activeConversation) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vemtap"></div>
            </div>
        );
    }

    return (
        <div className="bg-[#f8fafb] h-screen flex flex-col font-display text-slate-900 overflow-hidden relative">
            {/* Custom styles mimicking the template */}
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
                        className="p-2 -ml-2 text-slate-600 active:bg-slate-100 rounded-full transition-colors hover:text-vemtap shrink-0"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    
                    <div className="flex items-center space-x-3 truncate">
                        <div className="relative shrink-0">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-vemtap/10 flex items-center justify-center text-vemtap font-bold border border-vemtap/20">
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
                                    <span className="text-vemtap italic flex items-center gap-1">
                                        <span className="w-1 h-1 bg-vemtap rounded-full animate-bounce" />
                                        <span className="w-1 h-1 bg-vemtap rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <span className="w-1 h-1 bg-vemtap rounded-full animate-bounce [animation-delay:0.4s]" />
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
                        className={`p-2.5 rounded-xl transition-all ${isSearchOpen ? 'bg-vemtap/10 text-vemtap' : 'hover:bg-slate-50'}`}
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
                                onClick={() => router.push('/dashboard/support/automations')}
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
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-vemtap/20 transition-all"
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
                <div className="flex justify-center my-6">
                    <span className="bg-white border border-slate-100 text-slate-400 text-[10px] px-4 py-1.5 rounded-full uppercase tracking-widest font-black shadow-sm">
                        Conversation Started
                    </span>
                </div>

                {filteredMessages.map((msg, index) => {
                    const isOutbound = msg.direction === 'outbound';
                    const isMyMessage = isCustomer ? !isOutbound : isOutbound;

                    return (
                        <div 
                            key={msg.id} 
                            className={`flex flex-col group max-w-[85%] ${isMyMessage ? 'items-end ml-auto' : 'items-start'}`}
                        >
                            <div className={`
                                p-4 shadow-sm text-[15px] leading-relaxed relative
                                ${isMyMessage ? 'bubble-right bg-vemtap text-white font-medium' : 'bubble-left bg-white text-slate-800 font-medium border border-white'}
                            `}>
                                <p>{msg.content}</p>
                            </div>
                            
                            <div className={`flex items-center space-x-2 mt-2 ${isMyMessage ? 'mr-1' : 'ml-1'}`}>
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isMyMessage && (
                                    <div className="flex items-center">
                                        <CheckCircle2 size={12} className={msg.status === 'read' ? 'text-emerald-500' : 'text-slate-300'} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
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
                            className={`p-2.5 rounded-xl transition-all ${showEmojiPicker ? 'bg-vemtap/10 text-vemtap' : 'text-slate-400 hover:text-vemtap'}`}
                        >
                            <Smile size={24} />
                        </button>
                        
                        {showEmojiPicker && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                                <div className="absolute bottom-14 left-0 bg-white border border-slate-100 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-bottom-2 grid grid-cols-6 gap-2 w-64">
                                    {['ðŸ˜Š', 'ðŸ˜', 'ðŸ¤©', 'ðŸ”¥', 'ðŸ‘', 'âœ…', 'ðŸ™', 'ðŸŽ‰', 'ðŸ’¡', 'â¤ï¸', 'ðŸ—³ï¸', 'ðŸš§'].map(emoji => (
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
                            className="p-2.5 text-slate-400 hover:text-vemtap transition-all"
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

                    <div className="flex-1 bg-slate-50 rounded-2xl px-5 py-3 border border-transparent focus-within:border-vemtap/20 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-vemtap/5 transition-all flex items-center min-h-[52px]">
                        <textarea 
                            ref={textareaRef}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-[15px] max-h-40 resize-none font-medium text-slate-700"
                            placeholder="Write your message..."
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
                        className="bg-vemtap text-white size-12 rounded-2xl shadow-xl shadow-vemtap/30 active:scale-95 transition-all flex items-center justify-center shrink-0 mb-1 hover:brightness-110" 
                        data-purpose="send-message"
                    >
                        <Send size={24} className="ml-1" />
                    </button>
                </div>
            </footer>
        </div>
    );
}
