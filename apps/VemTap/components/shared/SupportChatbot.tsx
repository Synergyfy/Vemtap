'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X, Send, Minimize2, Maximize2, MessageCircle, User, Bot, Loader2, Headset, Trash2, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Draggable from 'react-draggable';
import { useChatStore } from '@/store/chatStore';
import { api } from '@/lib/api';

interface SupportChatbotProps {
    onRequestConsultation?: () => void;
}

export default function SupportChatbot({ onRequestConsultation }: SupportChatbotProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { history, addMessage, updateMessage, clearHistory, isOpen, setIsOpen, isVisible, setIsVisible } = useChatStore();
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [handedToAgent, setHandedToAgent] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial greeting if history is empty
    useEffect(() => {
        if (history.length === 0) {
            addMessage({
                role: 'assistant',
                content: 'Hi! 👋 I\'m your VemTap AI assistant. How can I help you today?'
            });
        }
    }, [history.length, addMessage]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history, isLoading]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userText = inputValue;
        setInputValue('');

        addMessage({ role: 'user', content: userText });
        setIsLoading(true);

        try {
            let context = "General Dashboard";
            if (pathname?.includes('messaging')) context = "Message Management";
            if (pathname?.includes('contacts')) context = "Contact Management";
            if (pathname?.includes('settings')) context = "Account Settings";
            if (pathname?.includes('devices')) context = "Device Management";

            let data;
            try {
                data = await api.post('/support/bot/query', {
                    query: userText,
                    context,
                    history: history.slice(-5).map(m => ({ role: m.role, content: m.content }))
                });
            } catch (e) {
                // Legacy Fallback
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: history.concat({ role: 'user', content: userText, timestamp: Date.now() } as any).map(m => ({
                            role: m.role,
                            content: m.content
                        })),
                        context
                    })
                });
                data = await response.json();
            }

            addMessage({
                role: 'assistant',
                content: data.content,
                source: data.source,
                interactionId: data.id // Interaction ID from backend
            });

            if (data.content.toLowerCase().includes('connect you with a human') ||
                data.content.toLowerCase().includes('agent')) {
                setHandedToAgent(true);
            }
        } catch (error) {
            addMessage({
                role: 'assistant',
                content: "I'm having trouble connecting right now. Please try again later."
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFeedback = async (idx: number, interactionId: string, wasHelpful: boolean) => {
        try {
            updateMessage(idx, { wasHelpful });
            if (interactionId) {
                await api.patch(`/support/bot/interaction/${interactionId}`, { wasHelpful });
            }
        } catch (e) {
            console.error('Feedback failed', e);
        }
    };

    const renderMessageContent = (content: string) => {
        // Simple Markdown-to-HTML for links: [Text](URL)
        const parts = content.split(/(\[.*?\]\(.*?\))/g);
        return parts.map((part, i) => {
            const match = part.match(/\[(.*?)\]\((.*?)\)/);
            if (match) {
                const [_, text, url] = match;
                const isExternal = url.startsWith('http');
                return (
                    <button
                        key={i}
                        onClick={() => isExternal ? window.open(url, '_blank') : router.push(url)}
                        className="text-blue-200 underline hover:text-white font-bold inline-flex items-center gap-1"
                    >
                        {text} <ExternalLink size={12} />
                    </button>
                );
            }
            return part;
        });
    };

    const handleQuickAction = (action: string) => {
        setInputValue(action);
        handleQuickActionSend(action);
    };

    const handleQuickActionSend = async (text: string) => {
        if (isLoading) return;
        addMessage({ role: 'user', content: text });
        setIsLoading(true);
        try {
            const data = await api.post('/support/bot/query', {
                query: text,
                history: history.slice(-5).map(m => ({ role: m.role, content: m.content }))
            });
            addMessage({
                role: 'assistant',
                content: data.content,
                source: data.source,
                interactionId: data.id
            });
        } catch (e) {
            addMessage({ role: 'assistant', content: "Network error. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    const nodeRef = useRef<HTMLDivElement>(null);
    const windowRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    return (
        <div className="font-sans">
            {/* Floating Chat Button */}
            <AnimatePresence>
                {!isOpen && isVisible && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="fixed bottom-24 lg:bottom-6 right-6 z-50"
                    >
                        <Draggable 
                            nodeRef={nodeRef}
                            onDrag={() => setIsDragging(true)}
                            onStop={() => { setTimeout(() => setIsDragging(false), 50); }}
                        >
                            <div ref={nodeRef} className="group flex flex-col items-end gap-2 cursor-grab active:cursor-grabbing">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); if (!isDragging) setIsVisible(false); }}
                                    className="bg-white/90 hover:bg-white text-gray-500 p-1 rounded-full shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={14} />
                                </button>
                                <button onClick={() => { if (!isDragging) setIsOpen(true); }} aria-label="Open support chat">
                                    <div className="relative">
                                        <div className="absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-pulse blur-md pointer-events-none"></div>
                                        <div className="relative w-16 h-16 rounded-full bg-linear-to-br from-blue-600 to-blue-500 shadow-2xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-active:scale-95">
                                            <MessageCircle className="text-white pointer-events-none" size={28} />
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </Draggable>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        className={`fixed z-50 pointer-events-none ${isFullScreen ? 'inset-0' : 'bottom-24 lg:bottom-6 right-6 flex items-end justify-end'}`}
                    >
                        <Draggable nodeRef={windowRef} handle=".chat-header" disabled={isFullScreen}>
                            <div ref={windowRef} className={`bg-white shadow-2xl overflow-hidden flex flex-col pointer-events-auto ${isFullScreen ? 'w-full h-full rounded-none' : 'w-[400px] h-[600px] rounded-2xl'}`}>
                                {/* Header */}
                                <div className="chat-header cursor-grab active:cursor-grabbing relative h-16 bg-linear-to-r from-blue-600 to-blue-500 flex items-center justify-between px-4 shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center relative">
                                            {handedToAgent ? <Headset className="text-white" size={20} /> : <Bot className="text-white" size={20} />}
                                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-blue-600"></div>
                                        </div>
                                        <div className="text-white">
                                            <h3 className="font-bold text-base leading-tight">{handedToAgent ? 'Support' : 'VemTap Assistant'}</h3>
                                            <p className="text-xs opacity-80">{handedToAgent ? 'Human Support' : 'AI Assistant'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => clearHistory()} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"><Trash2 size={18} /></button>
                                        <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">{isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
                                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"><X size={18} /></button>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                    {history.map((message, idx) => (
                                        <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${message.role === 'user' ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                                    {message.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-gray-600" />}
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className={`rounded-2xl px-4 py-3 shadow-sm ${message.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                                                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{renderMessageContent(message.content)}</div>
                                                        <div className={`text-[10px] mt-1 text-right ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                                                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {message.source === 'rule' && <span className="ml-2 opacity-50">• Rule Engine</span>}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Assistant Feedback & Actions */}
                                                    {message.role === 'assistant' && idx !== 0 && (
                                                        <div className="flex items-center gap-2 px-1">
                                                            {message.wasHelpful === undefined ? (
                                                                <>
                                                                    <button onClick={() => handleFeedback(idx, message.interactionId!, true)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-green-500 transition-colors"><ThumbsUp size={12} /></button>
                                                                    <button onClick={() => handleFeedback(idx, message.interactionId!, false)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500 transition-colors"><ThumbsDown size={12} /></button>
                                                                </>
                                                            ) : (
                                                                <span className="text-[10px] text-gray-400 font-medium">{message.wasHelpful ? '✅ Helpful' : '❌ Not helpful'}</span>
                                                            )}
                                                            
                                                            {(message.content.toLowerCase().includes('human') || message.content.toLowerCase().includes('agent')) && (
                                                                <button onClick={() => router.push('/dashboard/support')} className="text-[10px] font-bold text-blue-600 hover:underline">Open Ticket</button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && <div className="flex justify-start items-center gap-2"><Loader2 size={14} className="animate-spin text-gray-400" /><span className="text-xs text-gray-400">Assistant is thinking...</span></div>}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-white border-t border-gray-100">
                                    <div className="flex gap-2">
                                        <textarea
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                            placeholder="Ask me anything..."
                                            rows={1}
                                            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                                        />
                                        <button onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"><Send size={18} /></button>
                                    </div>
                                </div>
                            </div>
                        </Draggable>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
