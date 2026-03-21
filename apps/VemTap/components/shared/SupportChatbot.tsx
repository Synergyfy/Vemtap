'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { X, Send, Minimize2, Maximize2, MessageCircle, User, Bot, Loader2, Headset, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Draggable from 'react-draggable';
import { useChatStore } from '@/store/chatStore';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot' | 'agent';
    timestamp: Date;
}

interface SupportChatbotProps {
    onRequestConsultation?: () => void;
}

export default function SupportChatbot({ onRequestConsultation }: SupportChatbotProps) {
    const pathname = usePathname();
    const { history, addMessage, clearHistory, isOpen, setIsOpen, isVisible, setIsVisible } = useChatStore();
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

        addMessage({
            role: 'user',
            content: userText
        });
        setIsLoading(true);

        try {
            // Prepare context based on current page
            let context = "General Dashboard";
            if (pathname?.includes('messaging')) context = "Message Management";
            if (pathname?.includes('contacts')) context = "Contact Management";
            if (pathname?.includes('settings')) context = "Account Settings";
            if (pathname?.includes('devices')) context = "Device Management";

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: history.concat({ role: 'user', content: userText, timestamp: Date.now() }).map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    context
                })
            });

            const data = await response.json();

            if (data.error) throw new Error(data.error);

            addMessage({
                role: 'assistant',
                content: data.content
            });

            // Check for escalation triggers in response (simple heuristic)
            if (data.content.toLowerCase().includes('connect you with a human') ||
                data.content.toLowerCase().includes('agent')) {
                setHandedToAgent(true);
            }

        } catch (error) {
            console.error(error);
            addMessage({
                role: 'assistant',
                content: "I'm having trouble connecting right now. Please try again or contact support if the issue persists."
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const quickActions = [
        { label: '💰 Pricing', action: 'Tell me about pricing plans' },
        { label: '🚀 Get Started', action: 'How do I get started?' },
        { label: '📱 NFC Devices', action: 'Tell me about NFC devices' },
        { label: '👤 Agent', action: 'I need to speak to an agent' },
    ];

    const handleQuickAction = (action: string) => {
        setInputValue(action);
        // Small timeout to allow state update before sending
        setTimeout(() => {
            // We can't easily call handleSendMessage here because it relies on the *current* inputValue state 
            // which hasn't updated in this closure. 
            // Instead, we manually trigger the flow or likely just set input and let user press enter, 
            // BUT for better UX, we want auto-send.
            // Let's modify handleSendMessage to accept text optionally, or just re-implement:
        }, 0);

        // Better approach for Quick Actions:
        handleQuickActionSend(action);
    };

    const handleQuickActionSend = async (text: string) => {
        if (isLoading) return;

        addMessage({
            role: 'user',
            content: text
        });
        setIsLoading(true);

        try {
            let context = "General";
            if (pathname?.includes('messaging')) context = "Message Management";

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: history.concat({ role: 'user', content: text, timestamp: Date.now() }).map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    context
                })
            });
            const data = await response.json();
            addMessage({
                role: 'assistant',
                content: data.content || "Sorry, I couldn't understand that."
            });
        } catch (e) {
            addMessage({
                role: 'assistant',
                content: "Network error. Please try again."
            });
        } finally {
            setIsLoading(false);
        }
    }


    const nodeRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const windowRef = useRef<HTMLDivElement>(null);

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
                            onStop={() => {
                                setTimeout(() => setIsDragging(false), 50);
                            }}
                        >
                            <div ref={nodeRef} className="group flex flex-col items-end gap-2 cursor-grab active:cursor-grabbing">
                                {/* Remove Button (Small X above the bubble) */}
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isDragging) setIsVisible(false);
                                    }}
                                    className="bg-white/90 hover:bg-white text-gray-500 p-1 rounded-full shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove Support Chat"
                                >
                                    <X size={14} />
                                </button>

                                <button
                                    onClick={() => {
                                        if (!isDragging) setIsOpen(true);
                                    }}
                                    aria-label="Open support chat"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-pulse blur-md pointer-events-none"></div>
                                        <div className="relative w-16 h-16 rounded-full bg-linear-to-br from-blue-600 to-blue-500 shadow-2xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-active:scale-95">
                                            <MessageCircle className="text-white pointer-events-none" size={28} />
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white pointer-events-none">
                                                <span className="text-white text-xs font-bold">1</span>
                                            </div>
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
                        className={`fixed z-50 pointer-events-none ${isFullScreen
                            ? 'inset-0'
                            : 'bottom-24 lg:bottom-6 right-6 flex items-end justify-end'
                            }`}
                    >
                        <Draggable
                            nodeRef={windowRef}
                            handle=".chat-header"
                            disabled={isFullScreen}
                        >
                            <div ref={windowRef} className={`bg-white shadow-2xl overflow-hidden flex flex-col pointer-events-auto ${isFullScreen
                                ? 'w-full h-full rounded-none'
                                : 'w-[400px] h-[600px] rounded-2xl'
                                }`}
                                style={{
                                    maxWidth: isFullScreen ? '100%' : '100vw',
                                    maxHeight: isFullScreen ? '100%' : 'auto'
                                }}
                            >
                                {/* Header */}
                                <div className="chat-header cursor-grab active:cursor-grabbing relative h-16 bg-linear-to-r from-blue-600 to-blue-500 flex items-center justify-between px-4 shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center relative">
                                    {handedToAgent ? <Headset className="text-white" size={20} /> : <Bot className="text-white" size={20} />}
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-blue-600"></div>
                                </div>
                                <div className="text-white">
                                    <h3 className="font-bold text-base leading-tight">{handedToAgent ? 'Agent Sarah' : 'VemTap Support'}</h3>
                                    <p className="text-xs opacity-80">{handedToAgent ? 'Human Support • Online' : 'AI Assistant • Online'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => clearHistory()}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                                    title="Clear Chat"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button
                                    onClick={() => setIsFullScreen(!isFullScreen)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                                >
                                    {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {history.map((message, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={idx}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${message.role === 'user' ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                            {message.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-gray-600" />}
                                        </div>
                                        <div
                                            className={`rounded-2xl px-4 py-3 shadow-sm ${message.role === 'user'
                                                ? 'bg-blue-600 text-white rounded-tr-none'
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                                }`}
                                        >
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                            <p className={`text-[10px] mt-1 text-right ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                                                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                    <div className="flex gap-2 items-center">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                            <Loader2 size={14} className="text-gray-600 animate-spin" />
                                        </div>
                                        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions */}
                        {!isLoading && history.length < 4 && (
                            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 overflow-x-auto">
                                <div className="flex gap-2">
                                    {quickActions.map((qa, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleQuickAction(qa.action)}
                                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all whitespace-nowrap shadow-sm"
                                        >
                                            {qa.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                            <div className="flex items-end gap-2">
                                <div className="flex-1 relative">
                                    <textarea
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        placeholder="Type your message..."
                                        rows={1}
                                        disabled={isLoading}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ maxHeight: '100px', minHeight: '44px' }}
                                    />
                                </div>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputValue.trim() || isLoading}
                                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center w-[44px] h-[44px]"
                                    aria-label="Send message"
                                >
                                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                </button>
                            </div>
                            <div className="text-center mt-2">
                                <p className="text-[10px] text-gray-400">Powered by VemTap AI</p>
                            </div>
                        </div>
                        </div>
                        </Draggable>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
}
