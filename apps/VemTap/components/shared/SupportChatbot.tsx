'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { X, Send, Minimize2, Maximize2, MessageCircle, User, Headset, Loader2, Trash2, Mail, Info, CheckCircle2, Briefcase, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useEscalateChat, useSendSupportMessage, useSupportTicket, useUserSupportTickets } from '@/services/support/hooks';
import { useSupportSocket } from '@/hooks/useSupportSocket';
import { toast } from 'react-hot-toast';

type UserRole = 'business_owner' | 'customer' | null;

export default function SupportChatbot() {
    const pathname = usePathname();
    const { history, addMessage, clearHistory, isOpen, setIsOpen, isVisible, setIsVisible } = useChatStore();
    const { isAuthenticated, user } = useAuthStore();
    
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [contactForm, setContactForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        subject: '',
        message: ''
    });
    const [handedToAgent, setHandedToAgent] = useState(false);
    const [liveTicketId, setLiveTicketId] = useState<string | null>(null);
    const [isGuestIdentified, setIsGuestIdentified] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);

    const [userRole, setUserRole] = useState<UserRole>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('vemtap_user_role') as UserRole;
        }
        return null;
    });
    const [showRoleSelector, setShowRoleSelector] = useState(false);

    const storeUserRole = (role: UserRole) => {
        setUserRole(role);
        localStorage.setItem('vemtap_user_role', role || '');
        setShowRoleSelector(false);
    };
    
    // Hooks
    const escalateMutation = useEscalateChat();
    const { socket, isConnected } = useSupportSocket({ enabled: handedToAgent });
    const { data: ticketData, refetch: refetchTicket } = useSupportTicket(liveTicketId || '', false);
    const { data: userTicketsData } = useUserSupportTickets(1, 5, isAuthenticated);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatbotRef = useRef<HTMLDivElement>(null);
    const floatingButtonRef = useRef<HTMLDivElement>(null);
    
    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && chatbotRef.current && !chatbotRef.current.contains(event.target as Node)) {
                // Check if the click was not on the floating button either (to prevent double toggle)
                if (floatingButtonRef.current && !floatingButtonRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    
    // Initialize Session ID for Guests
    useEffect(() => {
        if (!isAuthenticated) {
            let storedId = localStorage.getItem('vemtap_support_session');
            if (!storedId) {
                storedId = `js_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
                localStorage.setItem('vemtap_support_session', storedId);
            }
            setSessionId(storedId);
        }
    }, [isAuthenticated]);

    // Auto-resume check
    useEffect(() => {
        const resumeActiveChat = async () => {
            if (isAuthenticated && userTicketsData?.data && !handedToAgent) {
                const activeChat = userTicketsData.data.find((t: any) => 
                    t.type === 'Chat' && (t.status === 'Pending' || t.status === 'In Progress')
                );
                if (activeChat) {
                    setLiveTicketId(activeChat.id);
                    setHandedToAgent(true);
                    
                    // Load history from backend if store is empty
                    if (history.length === 0) {
                        try {
                            const fullTicket = await api.get(`/support/tickets/${activeChat.id}`);
                            if (fullTicket.messages) {
                                fullTicket.messages.forEach((m: any) => {
                                    addMessage({
                                        role: !m.senderId ? 'assistant' : (m.senderId === user?.id ? 'user' : 'assistant'),
                                        content: m.message
                                    });
                                });
                            }
                        } catch (err) {
                            console.error("Failed to load history", err);
                        }
                    }
                }
            }
        };
        resumeActiveChat();
    }, [isAuthenticated, userTicketsData, handedToAgent, history.length, addMessage, user?.id]);

    // Socket listeners
    useEffect(() => {
        if (socket && handedToAgent && liveTicketId) {
            socket.emit('joinTicket', { ticketId: liveTicketId });

            const handleNewMessage = (msg: any) => {
                // To avoid duplication, we check if the message is already in our history
                // But since we are switching from Bot to Human, the bot history is local
                // while human history comes from the backend.
                // For simplicity, we'll just add the message if it's from the agent.
                if (msg.senderId !== user?.id) {
                    addMessage({
                        role: 'assistant',
                        content: msg.message
                    });
                }
            };

            const handleStatusUpdate = ({ status }: { status: string }) => {
                if (status === 'Resolved') {
                    addMessage({
                        role: 'assistant',
                        content: "This support session has been marked as resolved. Feel free to start a new chat if you need further assistance."
                    });
                    setHandedToAgent(false);
                    setLiveTicketId(null);
                }
            };

            socket.on('newSupportMessage', handleNewMessage);
            socket.on('ticketStatusUpdated', handleStatusUpdate);

            return () => {
                socket.off('newSupportMessage', handleNewMessage);
                socket.off('ticketStatusUpdated', handleStatusUpdate);
                socket.emit('leaveTicket', { ticketId: liveTicketId });
            };
        }
    }, [socket, handedToAgent, liveTicketId, addMessage, user?.id]);

    // Determine user role and show selector only for guests
    useEffect(() => {
        if (isOpen && history.length === 0) {
            if (isAuthenticated && user?.role) {
                const mappedRole: UserRole = ['owner', 'manager', 'staff', 'admin', 'agent'].includes(user.role) ? 'business_owner' : 'customer';
                setUserRole(mappedRole);
                localStorage.setItem('vemtap_user_role', mappedRole || '');
                if (mappedRole === 'business_owner') {
                    addMessage({ role: 'assistant', content: `Hi ${user.firstName || 'there'}! 👋 I'm the VemTap Support Bot. As a **Business Owner**, I can help you with managing your branches, catalogue, promotions, analytics, and more. How can I assist you today?` });
                } else {
                    addMessage({ role: 'assistant', content: `Hi ${user.firstName || 'there'}! 👋 I'm the VemTap Support Bot. As a **Customer**, I can help you with discovering deals, earning rewards, and using VemTap at your favorite businesses. How can I help you today?` });
                }
            } else {
                const stored = localStorage.getItem('vemtap_user_role');
                if (stored && !userRole) {
                    setUserRole(stored as UserRole);
                } else if (!userRole && !stored) {
                    setShowRoleSelector(true);
                }
            }
        }
    }, [isOpen, history.length, userRole, isAuthenticated, user?.role, addMessage, user?.firstName]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

    const getGuestDetails = () => {
        if (isAuthenticated) return { name: undefined, email: undefined };
        return { name: contactForm.name, email: contactForm.email };
    };

    const sendQuery = async (userText: string) => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            const guestDetails = getGuestDetails();
            const data = await api.post('/support/bot/query', {
                query: userText,
                context: getContext(),
                guestName: guestDetails.name,
                guestEmail: guestDetails.email,
                sessionId: sessionId || undefined,
                userRole: userRole || undefined,
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
                content: "Sorry, I can't answer this for now. Can I connect you to a human agent?",
                buttons: [
                    { label: 'Connect to Agent', action: 'action', value: 'escalate' },
                    { label: 'Try Again', action: 'action', value: userText },
                ],
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEscalate = async () => {
        setIsLoading(true);
        try {
            const lastUserMsg = history.filter(m => m.role === 'user').pop();
            const guestDetails = getGuestDetails();
            
            const ticket = await escalateMutation.mutateAsync({ 
                initialMessage: lastUserMsg?.content || "User requested live support",
                guestName: guestDetails.name,
                guestEmail: guestDetails.email,
                sessionId: sessionId || undefined
            });
            setLiveTicketId(ticket.id);
            setHandedToAgent(true);
            addMessage({
                role: 'assistant',
                content: "Transferring you to a human agent... please hold on while one of our team members joins the chat."
            });
        } catch (error) {
            toast.error("Failed to connect to agent. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userText = inputValue;
        setInputValue('');
        addMessage({ role: 'user', content: userText });
        
        if (handedToAgent && liveTicketId) {
            // Send to real support API
            setIsLoading(true);
            try {
                await api.post(`/support/tickets/${liveTicketId}/message`, { message: userText });
            } catch (error) {
                toast.error("Message not sent. Check your connection.");
            } finally {
                setIsLoading(false);
            }
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
            setIsGuestIdentified(true);
            setShowRoleSelector(true);
        }, 400);
    };

    const handleFollowUpClick = (question: string) => {
        addMessage({ role: 'user', content: question });
        sendQuery(question);
    };

    return (
        <div className="font-sans">
            <AnimatePresence>
                {!isOpen && isVisible && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-60 group focus:outline-none"
                        aria-label="Open chat"
                    >
                        <div className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping"></div>
                        <div className="relative w-16 h-16 rounded-full bg-linear-to-br from-blue-600 to-indigo-600 shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-blue-500/50 active:scale-95">
                            <MessageCircle className="text-white" size={28} />
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            </div>
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
                        className={`fixed z-60 pointer-events-none ${isFullScreen ? 'inset-0' : 'inset-x-0 bottom-0 sm:inset-auto sm:bottom-6 sm:right-6 flex items-end justify-end transition-all duration-500'}`}
                    >
                        <Draggable nodeRef={chatbotRef} handle=".chat-header" cancel="button" disabled={isFullScreen || isMobile} bounds="parent">
                            <div ref={chatbotRef} className={`bg-white shadow-3xl overflow-hidden flex flex-col pointer-events-auto border border-gray-100 transition-all duration-300 ${isFullScreen ? 'w-full h-full rounded-none' : 'w-full sm:w-[420px] h-[min(650px,calc(100dvh-0px))] sm:h-[min(650px,calc(100dvh-140px))] rounded-t-[2.5rem] sm:rounded-[2rem]'}`}
                                style={{
                                    maxWidth: isFullScreen ? '100%' : '100vw',
                                    maxHeight: isFullScreen ? '100%' : 'calc(100vh - 0px)'
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
                                                <span className={cn(
                                                    "w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse",
                                                    handedToAgent ? "bg-emerald-400" : "bg-blue-400"
                                                )}></span>
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-90 truncate">
                                                    {handedToAgent ? 'Human Agent • Online' : 'Automated Bot • Active'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => { clearHistory(); setIsSubmitted(false); setHandedToAgent(false); setLiveTicketId(null); }} className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-white/80 hover:text-white"><Trash2 size={18} /></button>
                                        <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-white/80 hover:text-white">{isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
                                        <button onClick={() => setIsOpen(false)} className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-white/80 hover:text-white"><X size={20} /></button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-hidden flex flex-col bg-gray-50/50">
                                    {showRoleSelector ? (
                                        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col">
                                                <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-6 shadow-sm">
                                                    <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                                                        <Info size={24} />
                                                    </div>
                                                    <h4 className="text-lg font-bold text-gray-900 mb-2">Welcome to VemTap Support!</h4>
                                                    <p className="text-sm text-gray-500 leading-relaxed">To give you the best experience, please tell us who you are:</p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        storeUserRole('business_owner');
                                                        addMessage({ role: 'assistant', content: `Hi${contactForm.name ? ' ' + contactForm.name : ''}! 👋 I'm the VemTap Support Bot. As a **Business Owner**, I can help you with managing your branches, catalogue, promotions, analytics, and more. How can I assist you today?` });
                                                    }}
                                                    className="w-full text-left bg-white border-2 border-transparent hover:border-blue-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group active:scale-[0.99] mb-3"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="size-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                                                            <Briefcase size={24} className="text-indigo-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h5 className="text-sm font-black text-gray-900 mb-1">Business Owner</h5>
                                                            <p className="text-[10px] font-medium text-gray-500 leading-relaxed">You own or manage a business and use VemTap to promote your services, engage customers, and grow your revenue.</p>
                                                        </div>
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        storeUserRole('customer');
                                                        addMessage({ role: 'assistant', content: `Hi${contactForm.name ? ' ' + contactForm.name : ''}! 👋 I'm the VemTap Support Bot. As a **Customer**, I can help you with discovering deals, earning rewards, and using VemTap at your favorite businesses. How can I help you today?` });
                                                    }}
                                                    className="w-full text-left bg-white border-2 border-transparent hover:border-blue-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group active:scale-[0.99]"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="size-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                                                            <Users size={24} className="text-emerald-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h5 className="text-sm font-black text-gray-900 mb-1">Customer / Consumer</h5>
                                                            <p className="text-[10px] font-medium text-gray-500 leading-relaxed">You visit businesses that use VemTap to discover deals, earn rewards, and enjoy personalized experiences.</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            </motion.div>
                                        </div>
                                    ) : (!isAuthenticated && !isGuestIdentified) ? (
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
                                                            <h4 className="font-bold text-sm text-blue-900 mb-1">Start a Conversation</h4>
                                                            <p className="text-blue-700 text-xs leading-relaxed">Tell us who you are so we can assist you better. You'll be able to chat with our bot and escalate to an agent if needed.</p>
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
                                                        <button type="submit" disabled={isLoading} className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
                                                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <>Start Chatting <Send size={18} /></>}
                                                        </button>
                                                    </form>
                                                    <p className="text-center text-[10px] text-gray-400">By starting a chat, you agree to our privacy policy.</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                                                    {history.map((message, idx) => (
                                                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`flex flex-col max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'} gap-2`}>
                                                            <div className={`flex ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3 items-end`}>
                                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${message.role === 'user' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white border-gray-100 text-indigo-600'}`}>
                                                                    {message.role === 'user' ? <User size={14} /> : <Headset size={14} />}
                                                                </div>
                                                                <div className={`rounded-2xl px-5 py-3.5 shadow-sm relative ${message.role === 'user' ? 'bg-linear-to-br from-indigo-600 to-indigo-500 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                                                                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                                                    <div className={`text-[9px] font-bold mt-1.5 flex items-center justify-between gap-1 uppercase tracking-tighter ${message.role === 'user' ? 'text-indigo-100/70' : 'text-gray-400'}`}>
                                                                        <span>{message.role === 'assistant' && !message.interactionId ? 'Support Bot' : ''}</span>
                                                                        <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {message.buttons && message.buttons.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 ml-11">
                                                                    {message.buttons.map((btn, bi) => (
                                                                        <button
                                                                            key={bi}
                                                                            onClick={() => {
                                                                                if (btn.action === 'url') window.open(btn.value, '_blank');
                                                                                else if (btn.action === 'action' && btn.value === 'escalate') handleEscalate();
                                                                                else if (btn.action === 'action') sendQuery(btn.value);
                                                                            }}
                                                                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 shadow-sm"
                                                                        >
                                                                            {btn.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {message.followUp && message.followUp.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 ml-11">
                                                                    {message.followUp.map((q, qi) => (
                                                                        <button
                                                                            key={qi}
                                                                            onClick={() => handleFollowUpClick(q)}
                                                                            className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl text-[10px] font-bold text-blue-600 hover:bg-blue-100 transition-all active:scale-95"
                                                                        >
                                                                            {q}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
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
                                                {!handedToAgent && history.length > 0 && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="flex justify-center py-2"
                                                    >
                                                        <button 
                                                            onClick={handleEscalate}
                                                            className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-200 transition-all active:scale-95 group"
                                                        >
                                                            <Headset size={16} className="group-hover:rotate-12 transition-transform" />
                                                            <span>Talk to a Human Agent</span>
                                                        </button>
                                                    </motion.div>
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
