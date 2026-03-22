'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/lib/store/useChatStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, MoreVertical, FileText, MessageSquare, Check, CheckCircle2, Trash2, Settings, Megaphone, Users, Tag } from 'lucide-react';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatThreads, useInitBranchConversation, useDeleteThread } from '@/hooks/useMessaging';
import { useMessagingBranch } from '@/hooks/useMessagingBranch';
import { useMessagingVisitorsByBranch, useNewVisitors, useReturningVisitors, useUpdateVisitor } from '@/services/visitors/hooks';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import WhatsAppTemplateModal from './WhatsAppTemplateModal';

// Inline WhatsApp SVG icon for consistent branding
function WhatsAppIcon({ size = 14, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    );
}

const AVATAR_COLORS = [
    'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
];

type MessagingTab = 'INTERNAL' | 'WHATSAPP';

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatTime(timestamp: string | number | Date) {
    const time = new Date(timestamp).getTime();
    const diff = Date.now() - time;
    const hours = diff / 3_600_000;
    if (hours < 24) {
        return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (hours < 48) return 'Yesterday';
    return new Date(time).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ChatSidebar({ mode }: { mode?: 'INTERNAL' | 'WHATSAPP' }) {
    const activeConversationId = useChatStore(s => s.activeConversationId);
    const searchQuery = useChatStore(s => s.searchQuery);
    const setSearchQuery = useChatStore(s => s.setSearchQuery);
    const setActiveConversation = useChatStore(s => s.setActiveConversation);
    const pendingThreads = useChatStore(s => s.pendingThreads);
    const addPendingThread = useChatStore(s => s.addPendingThread);
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const { data: business } = useMyBusiness(isAuthenticated);
    const user = useAuthStore(s => s.user);
    const { branchId, isCustomer } = useMessagingBranch();
    const [showNewChat, setShowNewChat] = useState(false);
    const [customerQuery, setCustomerQuery] = useState('');
    const [activeTab, setActiveTab] = useState<MessagingTab>(mode || 'INTERNAL');
    const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
    const [whatsappModalVisitors, setWhatsappModalVisitors] = useState<any[]>([]);
    const [showCampaigns, setShowCampaigns] = useState(false);
    const newChatRef = useRef<HTMLDivElement>(null);
    const [newTagName, setNewTagName] = useState('');
    const updateVisitor = useUpdateVisitor();
    const campaignsRef = useRef<HTMLDivElement>(null);

    const searchParams = useSearchParams();
    const businessIdFromUrl = searchParams.get('businessId');

    const { data: threads = [], isLoading: threadsLoading } = useChatThreads('IN_HOUSE', branchId || undefined, isCustomer);
     const { data: visitors = [], isLoading: visitorsLoading } = useMessagingVisitorsByBranch(branchId || undefined, {
         search: customerQuery || searchQuery,
     });
     
     const { data: newVisitorsData } = useNewVisitors(branchId || undefined, { limit: 1 });
     const { data: returningVisitorsData } = useReturningVisitors(branchId || undefined, { limit: 1 });

    const allThreads = useMemo(() => {
        const real = threads as any[];
        
        // Filter out real threads that are "Unknown" and not matched by a pending thread (local cache)
        const visibleReal = real.filter(t => {
            const hasName = t.contact?.name && t.contact.name !== 'Unknown' && t.contact.name !== 'Customer';
            if (hasName) return true;
            // If no name, check if it's linked to a pending thread which might have a name
            return pendingThreads.some(p => (p.linkedThreadId === t.id || (p.contact?.id === t.contact?.id && !!t.contact?.id)) && p.contact?.name);
        });

        const realIds = new Set(visibleReal.map(t => t.id));
        const realContactIds = new Set(visibleReal.map(t => t.contact?.id).filter(Boolean));
        
        // Filter pending: hide if its real counterpart is in the list
        const filteredPending = pendingThreads.filter(t => 
            !realIds.has(t.linkedThreadId || '') && 
            !realContactIds.has(t.contact?.id)
        );
        
        const combined = [...filteredPending, ...visibleReal];
        
        // Sort by most recent activity
        return combined.sort((a, b) => {
            const timeA = new Date(a.lastActivityAt || a.updatedAt || 0).getTime();
            const timeB = new Date(b.lastActivityAt || b.updatedAt || 0).getTime();
            return timeB - timeA; // Newest first (Standard for sidebar)
        });
    }, [threads, pendingThreads]);

    const activeConv = allThreads.find(c => c.id === activeConversationId);
    
    const headerName = isCustomer 
        ? (activeConv?.contact?.name || 'Business Chat') 
        : (mode === 'WHATSAPP' ? 'WhatsApp' : (business?.name || user?.businessName || 'Vemtap'));
        
    const headerLogo = isCustomer 
        ? (activeConv?.contact?.avatar) 
        : (business?.logoUrl || user?.businessLogo);


    const filteredThreads = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return allThreads;
        return allThreads.filter(c =>
            c.contact?.name?.toLowerCase().includes(q)
        );
    }, [allThreads, searchQuery]);

    const availableVisitors = useMemo(() => {
        return (visitors as any[]).filter(v => v.name.toLowerCase().includes(customerQuery.toLowerCase()));
    }, [visitors, customerQuery]);

    useEffect(() => {
        if (!showNewChat) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (newChatRef.current && !newChatRef.current.contains(event.target as Node)) {
                setShowNewChat(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showNewChat]);

    // Auto-select thread if businessId is in URL (for Customers)
    useEffect(() => {
        if (isCustomer && businessIdFromUrl && allThreads.length > 0 && !activeConversationId) {
            const thread = allThreads.find(t => t.business?.uniqueCode === businessIdFromUrl || t.business?.id === businessIdFromUrl);
            if (thread && thread.id !== activeConversationId) {
                setActiveConversation(thread.id);
            }
        }
    }, [isCustomer, businessIdFromUrl, allThreads, activeConversationId, setActiveConversation]);

    // Auto-select thread if visitorId is in URL (for Businesses)
    useEffect(() => {
        const visitorIdFromUrl = searchParams.get('visitorId');
        if (!isCustomer && visitorIdFromUrl && visitors.length > 0 && !activeConversationId) {
            const visitor = (visitors as any[]).find(v => v.id === visitorIdFromUrl);
            if (visitor) {
                const threadId = addPendingThread(visitor);
                setActiveConversation(threadId);
            }
        }
    }, [isCustomer, searchParams, visitors, activeConversationId, setActiveConversation, addPendingThread]);

    const customTagsWithCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        const visitorList = Array.isArray(visitors) ? visitors : [];
        
        visitorList.forEach((v: any) => {
            let itemTags = v.tags || [];
            if (typeof itemTags === 'string') {
                try {
                    itemTags = JSON.parse(itemTags);
                } catch {
                    itemTags = [itemTags];
                }
            }
            if (Array.isArray(itemTags)) {
                itemTags.forEach((tag: string) => {
                    const normalized = tag.trim();
                    if (normalized) {
                        counts[normalized] = (counts[normalized] || 0) + 1;
                    }
                });
            }
        });
        return Object.entries(counts).map(([name, count]) => ({ name, count }));
    }, [visitors]);

    // Handle click outside for campaigns
    useEffect(() => {
        if (!showCampaigns) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (campaignsRef.current && !campaignsRef.current.contains(event.target as Node)) {
                setShowCampaigns(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showCampaigns]);

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;
        const selectedList = (visitors as any[]).filter(v => selectedContacts.has(v.id));
        
        if (selectedList.length === 0) {
            toast.error('Select customers from the list first to tag them.');
            return;
        }

        const tag = newTagName.trim();
        const toastId = toast.loading(`Adding tag "${tag}"...`);
        try {
            await Promise.all(selectedList.map(v => {
                const currentTags = Array.isArray(v.tags) ? v.tags : [];
                if (!currentTags.includes(tag)) {
                    return updateVisitor.mutateAsync({
                        id: v.id,
                        data: { tags: [...currentTags, tag] }
                    });
                }
                return Promise.resolve();
            }));
            toast.success(`Tag "${tag}" added to ${selectedList.length} customers`, { id: toastId });
            setNewTagName('');
            setSelectedContacts(new Set());
        } catch (err) {
            toast.error('Failed to update tags.', { id: toastId });
        }
    };

    const handleBroadcastToTag = (tagName: string) => {
        setShowCampaigns(false);
        const audience = (visitors as any[]).filter(v => {
            const tags = Array.isArray(v.tags) ? v.tags : [];
            return tags.includes(tagName);
        });
        
        if (audience.length > 0) {
            setWhatsappModalVisitors(audience);
            toast.success(`Broadcasting to ${audience.length} customers with tag "${tagName}"`);
        } else {
            toast.error(`No customers found for tag "${tagName}"`);
        }
    };

    const handleBroadcastClick = async (type: 'new' | 'returning') => {
        setShowCampaigns(false);
        const toastId = toast.loading(`Fetching ${type} visitors...`);
        try {
            const endpoint = type === 'new' ? '/visitors/new' : '/visitors/returning';
            const response = await api.get(endpoint);
            const audience = response?.data || [];
            
            if (audience.length > 0) {
                toast.success(`Found ${audience.length} ${type} visitors`, { id: toastId });
                setWhatsappModalVisitors(audience);
            } else {
                toast.error(`No ${type} visitors found in this segment.`, { id: toastId });
            }
        } catch (err) {
            console.error('Broadcast fetch error:', err);
            toast.error('Failed to fetch audience segment. Please try again.', { id: toastId });
        }
    };


    const toggleContactSelection = (id: string) => {
        setSelectedContacts(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleBulkWhatsApp = () => {
        const selectedList = visitors.filter((v: any) => selectedContacts.has(v.id));
        if (selectedList.length > 0) {
            setWhatsappModalVisitors(selectedList);
        }
        setSelectedContacts(new Set());
    };

    return (
        <aside className="w-full md:w-80 lg:w-96 h-full glass-sidebar flex flex-col border-r border-slate-200 shrink-0 overflow-hidden pt-[env(safe-area-inset-top)]">
            {/* Top Fixed Section: Header, Tabs, Search */}
            <div className="flex flex-col shrink-0 bg-white z-30 relative border-b border-slate-200">
                {/* Header */}
                <header className="p-4 flex justify-between items-center bg-white/95 backdrop-blur-sm z-40 sticky top-0 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        {headerLogo ? (
                            <img src={headerLogo} alt={headerName} className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                {headerName.charAt(0)}
                            </div>
                        )}
                        <h1 className="font-bold text-lg text-slate-800 tracking-tight">{headerName}</h1>
                    </div>
                    {!isCustomer && activeTab === 'INTERNAL' && (
                        <div className="flex gap-2 text-slate-400">
                            <div className="relative" ref={newChatRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowNewChat(prev => !prev)}
                                    className={`p-1.5 rounded-lg transition-colors ${branchId ? 'hover:text-primary hover:bg-slate-100' : 'text-slate-300'}`}
                                    title="New Chat"
                                >
                                    <Plus size={18} />
                                </button>

                                {showNewChat && (
                                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50">
                                        <div className="px-4 pb-2 border-b border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start new chat</p>
                                            <input
                                                type="text"
                                                placeholder="Search customers..."
                                                value={customerQuery}
                                                onChange={e => setCustomerQuery(e.target.value)}
                                                className="mt-2 w-full h-9 rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                            {!branchId ? (
                                                <div className="px-4 py-4 text-xs text-amber-600">Select a branch to start a chat.</div>
                                            ) : visitorsLoading ? (
                                                <div className="px-4 py-4 text-xs text-slate-400">Loading visitors...</div>
                                            ) : availableVisitors.length === 0 ? (
                                                <div className="px-4 py-4 text-xs text-slate-400">No visitors available.</div>
                                            ) : (
                                                availableVisitors.map(visitor => (
                                                    <button
                                                        key={visitor.id}
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            // Check if we already have a conversation with this visitor
                                                            const existingConv = allThreads.find(t => t.contact?.id === visitor.id);
                                                            if (existingConv) {
                                                                setActiveConversation(existingConv.id);
                                                            } else {
                                                                addPendingThread({
                                                                    id: visitor.id,
                                                                    name: visitor.name,
                                                                    phone: visitor.phone,
                                                                    email: visitor.email,
                                                                    isOnline: false,
                                                                });
                                                            }
                                                            setShowNewChat(false);
                                                            setCustomerQuery('');
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left"
                                                    >
                                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${getAvatarColor(visitor.id)}`}>
                                                            {getInitials(visitor.name)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-slate-900 truncate">{visitor.name}</p>
                                                            <p className="text-xs text-slate-400 truncate">{visitor.phone || visitor.email}</p>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                            
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="relative" ref={campaignsRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowCampaigns(prev => !prev)}
                                    className={`p-1.5 rounded-lg transition-colors ${showCampaigns ? 'text-primary bg-primary/10' : 'hover:text-primary hover:bg-slate-100'}`}
                                    title="Campaigns & Broadcast"
                                >
                                    <Megaphone size={18} />
                                </button>

                                {showCampaigns && (
                                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-4 pb-2 border-b border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Audience Segments</p>
                                        </div>
                                        <div className="p-2 space-y-1">
                                            <button 
                                                onClick={() => handleBroadcastClick('new')}
                                                className="w-full flex items-center justify-between p-3 hover:bg-blue-50 rounded-xl transition-colors group text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                                        <Plus size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700">New Visitors</p>
                                                        <p className="text-[10px] text-slate-400">Recently joined</p>
                                                    </div>
                                                </div>
                                                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    {newVisitorsData?.total || 0}
                                                </span>
                                            </button>

                                            <button 
                                                onClick={() => handleBroadcastClick('returning')}
                                                className="w-full flex items-center justify-between p-3 hover:bg-purple-50 rounded-xl transition-colors group text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                                                        <Users size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700">Returning Visitors</p>
                                                        <p className="text-[10px] text-slate-400">Visited &gt; 1 time</p>
                                                    </div>
                                                </div>
                                                <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    {returningVisitorsData?.total || 0}
                                                </span>
                                            </button>

                                            {/* Custom Tags */}
                                            {customTagsWithCounts.map(({ name, count }) => (
                                                <button 
                                                    key={name}
                                                    onClick={() => handleBroadcastToTag(name)}
                                                    className="w-full flex items-center justify-between p-3 hover:bg-emerald-50 rounded-xl transition-colors group text-left"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                                                            <Tag size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-700">{name}</p>
                                                            <p className="text-[10px] text-slate-400">Custom Category</p>
                                                        </div>
                                                    </div>
                                                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                        {count}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Create Tag Flow */}
                                        <div className="mx-2 mt-2 pt-3 border-t border-slate-50">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Create New Segment</p>
                                            <div className="flex items-center gap-2 px-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Tag Name (e.g. VIP)"
                                                    value={newTagName}
                                                    onChange={e => setNewTagName(e.target.value)}
                                                    className="flex-1 h-9 rounded-xl bg-slate-50 border border-slate-100 px-3 text-[11px] font-semibold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                                                />
                                                <button 
                                                    onClick={handleCreateTag}
                                                    disabled={!newTagName.trim() || selectedContacts.size === 0}
                                                    className="size-9 bg-primary text-white rounded-xl flex items-center justify-center shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-30 disabled:shadow-none transition-all"
                                                    title={selectedContacts.size === 0 ? "Select customers first" : "Create tag"}
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                            <div className="mt-2 px-2">
                                                <p className="text-[9px] text-center text-slate-400 italic font-medium leading-relaxed">
                                                    {selectedContacts.size > 0 
                                                        ? `Apply tag "${newTagName || '...'}" to ${selectedContacts.size} selected`
                                                        : "Select customers below to create a tag"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Link 
                                href={`/dashboard/messaging/chat/settings${branchId ? `?branchId=${branchId}` : ''}`}
                                className="p-1.5 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                                title="Chat Settings"
                            >
                                <Settings size={18} />

                            </Link>
                        </div>
                    )}
                </header>

                {/* Tabs - only show if no mode is forced */}
                {!mode && (
                    <div className="flex border-b border-slate-100 bg-slate-50/50">
                        <button
                            onClick={() => setActiveTab('INTERNAL')}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeTab === 'INTERNAL' ? 'text-primary border-b-2 border-primary bg-white' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <MessageSquare size={14} />
                            Inbox
                        </button>
                        <button
                            onClick={() => setActiveTab('WHATSAPP')}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeTab === 'WHATSAPP' ? 'text-emerald-500 border-b-2 border-emerald-500 bg-white' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <WhatsAppIcon size={14} />
                            WhatsApp
                        </button>
                    </div>
                )}

                {/* Search */}
                <div className="p-4 bg-white">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder={activeTab === 'INTERNAL' ? "Search conversations..." : "Search contacts..."}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border-none bg-slate-100 rounded-xl text-sm placeholder-slate-500 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Bulk Actions for WhatsApp */}
                {activeTab === 'WHATSAPP' && selectedContacts.size > 0 && (
                    <div className="px-4 py-3 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between animate-in slide-in-from-top-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Selected</span>
                            <span className="text-xs font-bold text-slate-700">{selectedContacts.size} Recipients</span>
                        </div>
                        <button
                            onClick={handleBulkWhatsApp}
                            className="px-4 py-2 bg-emerald-500 text-white text-[11px] font-bold rounded-xl hover:bg-emerald-600 shadow-md shadow-emerald-200 transition-all flex items-center gap-2"
                        >
                            <WhatsAppIcon size={14} />
                            Send Message
                        </button>
                    </div>
                )}
            </div>

            {/* Conversations / Contacts - Scrollable Area */}
            <nav className="flex-1 overflow-y-auto custom-scrollbar">
                {!isCustomer && !branchId ? (
                    <div className="p-8 text-center text-amber-500 text-sm font-medium">Please select a branch first</div>
                ) : activeTab === 'INTERNAL' ? (
                    <>
                        {threadsLoading ? (
                             <div className="p-8 text-center text-slate-400 text-sm">Loading conversations...</div>
                        ) : filteredThreads.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">No conversations found.</div>
                        ) : (
                        <AnimatePresence initial={false} mode="popLayout">
                            {filteredThreads.map(conv => (
                                <motion.div
                                    key={conv.id}
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30, mass: 1 }}
                                >
                                    <ConversationItem
                                        conversation={conv}
                                        isActive={conv.id === activeConversationId}
                                        isSelected={conv.contact?.id ? selectedContacts.has(conv.contact.id) : false}
                                        isCustomer={isCustomer}
                                        onSelect={() => {
                                            if (conv.contact?.id) toggleContactSelection(conv.contact.id);
                                        }}
                                        onClick={() => setActiveConversation(conv.id)}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        )}
                    </>
                ) : (
                    <>
                        {visitorsLoading ? (
                            <div className="p-8 text-center text-slate-400 text-sm">Loading contacts...</div>
                        ) : availableVisitors.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">No contacts found.</div>
                        ) : (
                            availableVisitors.map(visitor => (
                                <WhatsAppContactItem
                                    key={visitor.id}
                                    visitor={visitor}
                                    isSelected={selectedContacts.has(visitor.id)}
                                    onSelect={() => toggleContactSelection(visitor.id)}
                                    businessName={business?.name || 'Vemtap'}
                                    onChat={() => setWhatsappModalVisitors([visitor])}
                                />
                            ))
                        )}
                    </>
                )}
            </nav>

            {/* WhatsApp Template Modal */}
            {whatsappModalVisitors.length > 0 && (
                <WhatsAppTemplateModal
                    isOpen={whatsappModalVisitors.length > 0}
                    onClose={() => setWhatsappModalVisitors([])}
                    visitors={whatsappModalVisitors}
                    businessName={business?.name || 'Vemtap'}
                    businessCode={(business as any)?.branches?.find((b: any) => b.id === branchId)?.uniqueCode || (business as any)?.uniqueCode || branchId || 'business'}
                />
            )}
        </aside>
    );
}

function ConversationItem({
    conversation,
    isActive,
    isSelected,
    onSelect,
    onClick,
    isCustomer,
}: {
    conversation: any;
    isActive: boolean;
    isSelected: boolean;
    isCustomer: boolean;
    onSelect: () => void;
    onClick: () => void;
}) {
    const isTyping = useChatStore(s => s.typingByThread[conversation.id]);
    const draftText = useChatStore(s => s.drafts[conversation.id]);
    const { mutate: deleteThread, isPending: isDeleting } = useDeleteThread(isCustomer);
    const { branchId } = useMessagingBranch();
    
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this conversation?')) {
            deleteThread({ threadId: conversation.id, branchId: branchId || undefined });
        }
    };

    const customer = conversation.customer;
    const name = customer?.firstName 
        ? `${customer.firstName} ${customer.lastName || ''}`.trim() 
        : (conversation.contact?.name || 'Unknown');

    return (
        <div className={`w-full group/item flex items-center transition-colors border-r-4 ${
            isActive ? 'bg-primary/10 border-primary' : 'hover:bg-slate-50 border-transparent'
        }`}>
            {/* Selection Checkbox */}
            <div className="pl-4">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect();
                    }}
                    className={`size-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'bg-primary border-primary text-white' : 'border-slate-200 bg-white opacity-0 group-hover/item:opacity-100'
                    } ${isSelected ? 'opacity-100' : ''}`}
                >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                </button>
            </div>

            <button
                onClick={onClick}
                className="flex-1 flex items-center gap-3 p-4 pl-3 transition-colors text-left overflow-hidden relative group"
            >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    {(customer?.avatar || conversation.contact?.avatar) ? (
                        <img src={customer?.avatar || conversation.contact?.avatar} alt={name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(conversation.id)}`}>
                            {getInitials(name)}
                        </div>
                    )}
                    {conversation.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm ring-2 ring-white animate-in zoom-in">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 pr-6">
                    <div className="flex justify-between items-baseline">
                        <h3 className={`text-sm truncate ${isActive ? 'font-semibold text-slate-900' : 'font-medium text-slate-900'}`}>
                            {name}
                        </h3>
                        <span className="text-xs text-slate-400 shrink-0 ml-2">
                            {formatTime(conversation.lastActivityAt || conversation.updatedAt)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-xs truncate flex-1 text-slate-500">
                            {isTyping ? (
                                <span className="text-primary font-medium animate-pulse">
                                    {isCustomer ? 'Business typing...' : 'Customer typing...'}
                                </span>
                            ) : draftText ? (
                                <span className="text-amber-500 font-medium truncate">
                                    Draft: <span className="text-slate-500 font-normal">{draftText}</span>
                                </span>
                            ) : (
                                conversation.lastMessageContent || conversation.status || 'Active conversation'
                            )}
                        </p>
                        {Array.isArray(customer?.tags) && customer.tags.length > 0 && (
                            <div className="flex gap-1 shrink-0 ml-1">
                                {customer.tags.slice(0, 1).map((t: string) => (
                                    <span key={t} className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 text-[9px] font-bold rounded-md whitespace-nowrap">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-rose-500 opacity-40 md:opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                    title="Delete Conversation"
                >
                    <Trash2 size={16} />
                </button>
            </button>
        </div>
    );
}

function WhatsAppContactItem({
    visitor,
    isSelected,
    onSelect,
    onChat,
    businessName
}: {
    visitor: any;
    isSelected: boolean;
    onSelect: () => void;
    onChat: () => void;
    businessName: string;
}) {
    const name = visitor.name || (visitor.firstName ? `${visitor.firstName} ${visitor.lastName || ''}`.trim() : 'Unknown');
    const hasPhone = !!visitor.phone;

    return (
        <div className={`w-full flex items-center gap-3 p-4 transition-all border-b border-slate-50 ${isSelected ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                }}
                className={`shrink-0 size-5 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white'}`}
            >
                {isSelected && <Check size={12} strokeWidth={3} />}
            </button>

            <div className="relative shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(visitor.id)}`}>
                    {getInitials(name)}
                </div>
                {hasPhone && (
                    <div className="absolute -right-1 -bottom-1 size-5 bg-[#25d366] rounded-full border-2 border-white flex items-center justify-center text-white">
                        <WhatsAppIcon size={10} />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {name}
                    </h3>
                </div>
                <div className="flex items-center gap-1.5 overflow-hidden">
                    <p className="text-xs text-slate-500 truncate flex-1">
                        {visitor.phone || visitor.email || 'No contact info'}
                    </p>
                    {Array.isArray(visitor.tags) && visitor.tags.length > 0 && (
                        <div className="flex gap-1 shrink-0">
                            {visitor.tags.slice(0, 1).map((t: string) => (
                                <span key={t} className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 text-[9px] font-bold rounded-md">
                                    {t}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {hasPhone && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onChat();
                    }}
                    className="p-2.5 bg-[#25d366]/10 text-[#25d366] rounded-xl hover:bg-[#25d366]/20 transition-colors"
                    title="Chat on WhatsApp"
                >
                    <WhatsAppIcon size={16} />
                </button>
            )}
        </div>
    );
}
