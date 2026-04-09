'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { X, Send, Minimize2, Maximize2, MessageCircle, User, Headset, Loader2, Trash2, Mail, Info, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Draggable from 'react-draggable';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';

export default function SupportChatbot() {
    const pathname = usePathname();
    const { history, addMessage, clearHistory, isOpen, setIsOpen, isVisible, setIsVisible } = useChatStore();
    const { isAuthenticated, user } = useAuthStore();
    
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [contactForm, setContactForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        subject: '',
        message: ''
    });
    const [handedToAgent, setHandedToAgent] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial greeting if history is empty and logged in
    useEffect(() => {
        if (history.length === 0 && isAuthenticated) {
            addMessage({
                role: 'assistant',
                content: `Hi ${user?.firstName || 'there'}! 👋 Welcome to VemTap Support. A member of our team is ready to help you.`
            });
        }
    }, [history.length, addMessage, isAuthenticated, user]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history, isLoading, isTyping]);

    const getContext = () => {
        let context = "General Dashboard";
        if (pathname?.includes('messaging')) context = "Message Management";
        if (pathname?.includes('contacts')) context = "Contact Management";
        if (pathname?.includes('settings')) context = "Account Settings";
        if (pathname?.includes('devices')) context = "Device Management";
        if (pathname?.includes('analytics')) context = "Analytics";
        if (pathname?.includes('loyalty')) context = "Loyalty Management";
        if (pathname?.includes('catalogue')) context = "Product Catalogue";
        return context;
    };

    const sendQuery = async (userText: string) => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            const data = await api.post('/support/bot/query', {
                query: userText,
                context: getContext(),
                history: history.slice(-5).map(m => ({ role: m.role, content: m.content }))
            });

            addMessage({
                role: 'assistant',
                content: data.content,
                source: data.source,
                interactionId: data.id,
                buttons: data.buttons,
                followUp: data.followUp,
            });

            if (data.content.toLowerCase().includes('connect you with a human') ||
                data.content.toLowerCase().includes('human agent') ||
                data.suggestedAction === 'escalate') {
                setHandedToAgent(true);
            }
        } catch (error) {
            addMessage({
                role: 'assistant',
                content: "I'm having trouble connecting right now. Please try again later.",
                buttons: [
                    { label: 'Try Again', action: 'action', value: userText },
                    { label: 'Chat on WhatsApp', action: 'url', value: 'https://wa.me/234XXXXXXXXXX' },
                ],
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userText = inputValue;
        setInputValue('');
        addMessage({ role: 'user', content: userText });
        
        if (handedToAgent) {
            // Mock agent interaction if already handed to agent
            setIsLoading(true);
            setTimeout(() => {
                setIsLoading(false);
                setIsTyping(true);
                setTimeout(() => {
                    setIsTyping(false);
                    addMessage({
                        role: 'assistant',
                        content: "Thanks for reaching out! I've received your message. One of our agents is reviewing it now and will get back to you shortly."
                    });
                }, 2000);
            }, 800);
        } else {
            await sendQuery(userText);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleContactSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setIsSubmitted(true);
        }, 1500);
    };

    const handleFollowUpClick = (question: string) => {
        addMessage({ role: 'user', content: question });
        sendQuery(question);
    };

    const nodeRef = useRef<HTMLDivElement>(null);
    const windowRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

    return (
        <div className="font-sans">
            <AnimatePresence>
                {!isOpen && isVisible && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="fixed bottom-24 lg:bottom-6 right-6 z-60"
                    >
                        <Draggable 
                            nodeRef={nodeRef}
                            onStart={(e, data) => {
                                setDragStartPos({ x: data.x, y: data.y });
                            }}
                            onDrag={(e, data) => {
                                const dx = Math.abs(data.x - dragStartPos.x);
                                const dy = Math.abs(data.y - dragStartPos.y);
                                if (dx > 5 || dy > 5) {
                                    setIsDragging(true);
                                }
                            }}
                            onStop={() => { 
                                setTimeout(() => setIsDragging(false), 100); 
                            }}
                        >
                            <div ref={nodeRef} className="group flex flex-col items-end gap-2 cursor-grab active:cursor-grabbing">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); if (!isDragging) setIsVisible(false); }}
                                    className="bg-white/90 hover:bg-white text-gray-500 p-1 rounded-full shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={14} />
                                </button>
                                <button
                                    onClick={() => {
                                        if (!isDragging) setIsOpen(true);
                                    }}
                                    className="relative transition-transform active:scale-90"
                                >
                                    <div className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping"></div>
                                    <div className="relative w-16 h-16 rounded-full bg-linear-to-br from-blue-600 to-indigo-600 shadow-2xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-blue-500/50">
                                        <MessageCircle className="text-white" size={28} />
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </Draggable>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
                        className={`fixed z-60 pointer-events-none ${isFullScreen ? 'inset-0' : 'inset-x-4 bottom-24 sm:inset-auto sm:bottom-6 sm:right-6 flex items-end justify-end transition-all duration-500'}`}
                    >
                        <Draggable nodeRef={windowRef} handle=".chat-header" disabled={isFullScreen}>
                            <div ref={windowRef} className={`bg-white shadow-3xl overflow-hidden flex flex-col pointer-events-auto border border-gray-100 transition-all duration-300 ${isFullScreen ? 'w-full h-full rounded-none' : 'w-full sm:w-[420px] h-[min(650px,calc(100dvh-140px))] rounded-[2rem]'}`}
                                style={{
                                    maxWidth: isFullScreen ? '100%' : '100vw',
                                    maxHeight: isFullScreen ? '100%' : 'calc(100vh - 40px)'
                                }}
                            >
                                <div className="chat-header cursor-grab active:cursor-grabbing h-20 bg-linear-to-r from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-between px-6 shrink-0 shadow-lg relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center relative border border-white/20 shadow-inner">
                                            <Headset className="text-white" size={24} />
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-blue-600 shadow-sm"></div>
                                        </div>
                                        <div className="text-white">
                                            <h3 className="font-bold text-lg leading-tight tracking-tight">VemTap Support</h3>
                                            <div className="flex items-center gap-1.5 overflow-hidden">
                                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0 animate-pulse"></span>
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-90 truncate">Human Agent • Online</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => { clearHistory(); setIsSubmitted(false); }} className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-white/80 hover:text-white"><Trash2 size={18} /></button>
                                        <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-white/80 hover:text-white">{isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
                                        <button onClick={() => setIsOpen(false)} className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-white/80 hover:text-white"><X size={20} /></button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-hidden flex flex-col bg-gray-50/50">
                                    {!isAuthenticated ? (
                                        <div className="flex-1 overflow-y-auto p-8 flex flex-col">
                                            {isSubmitted ? (
                                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center py-10">
                                                    <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mb-6 shadow-inner"><CheckCircle2 size={40} /></div>
                                                    <h4 className="text-2xl font-bold text-gray-900 mb-3">Message Sent!</h4>
                                                    <p className="text-gray-500 text-sm leading-relaxed max-w-[280px]">Thanks for reaching out. An agent will review your request and get back to you via email within 24 hours.</p>
                                                    <button onClick={() => setIsSubmitted(false)} className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95">Send Another</button>
                                                </motion.div>
                                            ) : (
                                                <div className="space-y-8">
                                                    <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex gap-4">
                                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm shrink-0"><Info size={20} /></div>
                                                        <div>
                                                            <h4 className="font-bold text-sm text-blue-900 mb-1">Quick Assistance</h4>
                                                            <p className="text-blue-700 text-xs leading-relaxed">Drop us a message and our team will get back to you. Log in for live real-time chat.</p>
                                                        </div>
                                                    </div>
                                                    <form onSubmit={handleContactSubmit} className="space-y-4">
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1.5 block">Full Name</label>
                                                            <input type="text" required value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} className="w-full h-14 px-5 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm" placeholder="Enter your name" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1.5 block">Email Address</label>
                                                            <input type="email" required value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} className="w-full h-14 px-5 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm" placeholder="hello@example.com" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-1.5 block">Message</label>
                                                            <textarea required rows={4} value={contactForm.message} onChange={e => setContactForm({...contactForm, message: e.target.value})} className="w-full p-5 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm resize-none" placeholder="How can we help today?" />
                                                        </div>
                                                        <button type="submit" disabled={isLoading} className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
                                                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> Send Message</>}
                                                        </button>
                                                    </form>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                                                {history.map((message, idx) => (
                                                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`flex max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3 items-end`}>
                                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${message.role === 'user' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white border-gray-100 text-indigo-600'}`}>
                                                                {message.role === 'user' ? <User size={14} /> : <Headset size={14} />}
                                                            </div>
                                                            <div className={`rounded-2xl px-5 py-3.5 shadow-sm relative ${message.role === 'user' ? 'bg-linear-to-br from-indigo-600 to-indigo-500 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                                                                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                                                <p className={`text-[9px] font-bold mt-1.5 flex items-center gap-1 uppercase tracking-tighter ${message.role === 'user' ? 'text-indigo-100/70' : 'text-gray-400'}`}>
                                                                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                                {(isLoading || isTyping) && (
                                                    <div className="flex justify-start">
                                                        <div className="flex gap-3 items-end">
                                                            <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm text-indigo-600">
                                                                <Headset size={14} />
                                                            </div>
                                                            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-5 py-3.5 shadow-sm">
                                                                <div className="flex gap-1.5">
                                                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                                                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div ref={messagesEndRef} />
                                            </div>
                                            <div className="px-6 py-6 bg-white border-t border-gray-100 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                                                <div className="flex items-end gap-3 bg-gray-50 border border-gray-100 rounded-[2rem] p-2 pr-3 focus-within:bg-white focus-within:border-indigo-200 focus-within:ring-4 focus-within:ring-indigo-50 transition-all duration-300">
                                                    <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyPress} placeholder="Message the team..." rows={1} disabled={isLoading} className="flex-1 px-4 py-3 bg-transparent border-none outline-none resize-none text-[13px] font-medium placeholder:text-gray-400 min-h-[48px] max-h-[120px]" />
                                                    <button onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading} className="w-12 h-12 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 active:scale-90 flex items-center justify-center shrink-0 disabled:opacity-30">
                                                        <Send size={20} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-center gap-2 mt-4 text-[9px] font-black uppercase tracking-widest text-gray-400">
                                                    <Info size={10} className="text-blue-500" /> Typically replies within 5 minutes
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Draggable>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
