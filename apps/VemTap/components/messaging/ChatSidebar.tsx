'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/lib/store/useChatStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, MoreVertical, FileText, MessageSquare, Check, CheckCircle2, Trash2, Settings, Megaphone, Users, Tag, ArrowLeft } from 'lucide-react';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatThreads, useInitBranchConversation, useDeleteThread } from '@/hooks/useMessaging';
import { useMessagingBranch } from '@/hooks/useMessagingBranch';
import { useMessagingVisitorsByBranch, useNewVisitors, useReturningVisitors, useUpdateVisitor } from '@/services/visitors/hooks';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useCustomerGlobalHistory } from '@/services/customer/hooks';
import SendMessageModal from '@/components/dashboard/SendMessageModal';
import CreateSegmentModal from '@/components/dashboard/CreateSegmentModal';
import { useSegments, useCreateSegment, useAddSegmentMembers } from '@/services/messaging/hooks';


const AVATAR_COLORS = [
    'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
];

// type MessagingTab = 'INTERNAL' | 'WHATSAPP';

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
const SidebarSkeleton = () => (
    <div className="space-y-1 p-2">
        {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl animate-pulse">
                <div className="size-12 bg-slate-100 rounded-full" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded-full w-24" />
                    <div className="h-2 bg-slate-50 rounded-full w-32" />
                </div>
            </div>
        ))}
    </div>
);

export default function ChatSidebar() {
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
    const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
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
     
     const { data: newVisitorsData } = useNewVisitors(branchId || undefined, { limit: 1 }, !isCustomer);
     const { data: returningVisitorsData } = useReturningVisitors(branchId || undefined, { limit: 1 }, !isCustomer);
     const { data: segments = [] } = useSegments(branchId || undefined, !isCustomer);
     const createSegment = useCreateSegment();
     const addSegmentMembers = useAddSegmentMembers();
     const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
     const [broadcastAudience, setBroadcastAudience] = useState<any[] | null>(null);
     const [showSendMessageModal, setShowSendMessageModal] = useState(false);
     const [showCreateSegment, setShowCreateSegment] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const allThreads = useMemo(() => {
        const real = threads as any[];
        
        // Build a lookup of visitors by ID so we can enrich thread contact names
        const visitorMap = new Map<string, any>();
        (visitors as any[]).forEach(v => { if (v.id) visitorMap.set(v.id, v); });
        
        // Enrich threads: if a thread's contact has a generic name ('Unknown', 'Customer'),
        // try to resolve their real name from the visitors list or pending threads
        const enrichedReal = real.map(t => {
            const hasGenericName = !t.contact?.name || t.contact.name === 'Unknown' || t.contact.name === 'Customer';
            if (!hasGenericName) return t;
            
            // Try to find a better name from the visitors list
            const visitor = t.contact?.id ? visitorMap.get(t.contact.id) : null;
            if (visitor) {
                const resolvedName = visitor.name || 
                    (visitor.firstName || visitor.lastName 
                        ? `${visitor.firstName || ''} ${visitor.lastName || ''}`.trim() 
                        : null);
                if (resolvedName) {
                    return { ...t, contact: { ...t.contact, name: resolvedName, phone: visitor.phone || t.contact?.phone, email: visitor.email || t.contact?.email } };
                }
            }
            
            // Try to find a better name from pending threads
            const pending = pendingThreads.find(p => 
                (p.linkedThreadId === t.id || (p.contact?.id === t.contact?.id && !!t.contact?.id)) && p.contact?.name
            );
            if (pending?.contact?.name) {
                return { ...t, contact: { ...t.contact, name: pending.contact.name } };
            }
            
            // Keep the thread even with a generic name — never hide real conversations
            return t;
        });

        const realIds = new Set(enrichedReal.map(t => t.id));
        const realContactIds = new Set(enrichedReal.map(t => t.contact?.id).filter(Boolean));
        
        // Filter pending: hide if its real counterpart is in the list
        const filteredPending = pendingThreads.filter(t => 
            !realIds.has(t.linkedThreadId || '') && 
            !realContactIds.has(t.contact?.id)
        );
        
        const combined = [...filteredPending, ...enrichedReal];
        
        // Sort by most recent activity
        return combined.sort((a, b) => {
            const timeA = new Date(a.lastActivityAt || a.updatedAt || 0).getTime();
            const timeB = new Date(b.lastActivityAt || b.updatedAt || 0).getTime();
            return timeB - timeA; // Newest first (Standard for sidebar)
        });
    }, [threads, pendingThreads, visitors]);

    const activeConv = allThreads.find(c => c.id === activeConversationId);
    
    const { data: customerHistory = [] } = useCustomerGlobalHistory();
    
    // For customers, get list of branches from history
    const customerAvailableBranches = useMemo(() => {
        if (!isCustomer) return [];
        const branchesMap = new Map();
        const logs = Array.isArray(customerHistory) ? customerHistory : ((customerHistory as any)?.data || []);
        logs.forEach((log: any) => {
            const loyaltyProfile = log.loyaltyProfile;
            const branch = loyaltyProfile?.branch || log.branch;
            const business = loyaltyProfile?.business || log.business;
            if (branch && branch.id && !branchesMap.has(branch.id)) {
                branchesMap.set(branch.id, {
                    ...branch,
                    business,
                    name: business?.name || branch.name || 'Business',
                    avatar: business?.logoUrl || branch.avatar
                });
            }
        });
        return Array.from(branchesMap.values()).filter(b => 
            b.name.toLowerCase().includes(customerQuery.toLowerCase())
        );
    }, [customerHistory, isCustomer, customerQuery]);

    const headerName = isCustomer 
        ? (activeConv?.contact?.name || 'Customer Chat') 
        : (business?.name || user?.businessName || 'Vemtap');
        
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
        const q = customerQuery?.toLowerCase() || '';
        return (visitors as any[]).filter(v => {
            const name = v.name || `${v.firstName || ''} ${v.lastName || ''}`.trim() || 'Visitor';
            return name.toLowerCase().includes(q);
        });
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

    // Auto-select thread if businessId or branchId is in URL (for Customers)
    useEffect(() => {
        const targetBranchId = searchParams.get('branchId') || searchParams.get('businessId');
        if (isCustomer && targetBranchId && allThreads.length > 0 && !activeConversationId) {
            const thread = allThreads.find(t => 
                t.branchId === targetBranchId || 
                t.contact?.id === targetBranchId ||
                t.branch?.id === targetBranchId
            );
            
            if (thread) {
                if (thread.id !== activeConversationId) {
                    setActiveConversation(thread.id);
                }
            } else if (customerAvailableBranches.length > 0) {
                // If no existing thread, but we found the branch in history, start a pending one
                const branch = customerAvailableBranches.find(b => b.id === targetBranchId);
                if (branch) {
                    const threadId = addPendingThread({
                        id: branch.id,
                        name: branch.name,
                        avatar: branch.avatar,
                        isOnline: false,
                    });
                    setActiveConversation(threadId);
                }
            }
        }
    }, [isCustomer, searchParams, allThreads, activeConversationId, setActiveConversation, customerAvailableBranches, addPendingThread]);

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
            toast.error('Select customers from the list first to create a segment.');
            return;
        }

        const name = newTagName.trim();
        const toastId = toast.loading(`Creating segment "${name}"...`);
        try {
            const segment = await createSegment.mutateAsync({
                name,
                branchId: branchId || undefined
            });

            await addSegmentMembers.mutateAsync({
                segmentId: segment.id,
                userIds: selectedList.map(v => v.id)
            });

            toast.success(`Segment "${name}" created with ${selectedList.length} members`, { id: toastId });
            setNewTagName('');
            setSelectedContacts(new Set());
        } catch (err) {
            console.error('Create segment error:', err);
            toast.error('Failed to create segment. Please try again.', { id: toastId });
        }
    };

    const handleBroadcastToTag = (tagName: string) => {
        setShowCampaigns(false);
        const audience = (visitors as any[]).filter(v => {
            const tags = Array.isArray(v.tags) ? v.tags : [];
            return tags.includes(tagName);
        });
        
        if (audience.length > 0) {
            toast.success(`Broadcasting to ${audience.length} customers with tag "${tagName}"`);
        } else {
            toast.error(`No customers found for tag "${tagName}"`);
        }
    };

    const handleBroadcastToSegment = (segmentId: string) => {
        setShowCampaigns(false);
        setSelectedSegmentId(segmentId);
        setShowSendMessageModal(true);
    };

    const handleBroadcastClick = async (type: 'new' | 'returning') => {
        setShowCampaigns(false);
        const toastId = toast.loading(`Fetching ${type} visitors...`);
        try {
            const params = new URLSearchParams();
            if (branchId && branchId !== 'all') {
                params.append('branchId', branchId);
            } else {
                params.append('allBranches', 'true');
            }
            
            const endpoint = type === 'new' ? '/visitors/new' : '/visitors/returning';
            const response = await api.get(`${endpoint}?${params.toString()}`);
            const audience = response?.data || [];
            
            if (audience.length > 0) {
                toast.success(`Found ${audience.length} ${type} visitors`, { id: toastId });
                setBroadcastAudience(audience);
                setSelectedSegmentId(null);
                setShowSendMessageModal(true);
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
            toast.success(`${selectedList.length} customers selected for action.`);
        }
        setSelectedContacts(new Set());
    };

    return (
        <aside className="w-full md:w-80 lg:w-96 h-full glass-sidebar flex flex-col border-r border-slate-200 shrink-0 overflow-hidden pt-[env(safe-area-inset-top)]">
            {/* Top Fixed Section: Header, Tabs, Search */}
            <div className="flex flex-col shrink-0 bg-white z-30 relative border-b border-slate-200">
                {/* Header */}
                <header className="p-4 flex justify-between items-center bg-white/95 backdrop-blur-sm z-40 sticky top-0 border-b border-slate-100">
                    <div className="flex items-center gap-2 min-w-0">
                        {isCustomer && (
                            <Link href="/customer/dashboard" className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg" title="Back to Dashboard">
                                <ArrowLeft size={20} />
                            </Link>
                        )}
                        {mounted && headerLogo ? (
                            <img src={headerLogo} alt={headerName} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                        ) : (
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {headerName.charAt(0)}
                            </div>
                        )}
                        <h1 className="font-bold text-lg text-slate-800 tracking-tight truncate">{headerName}</h1>
                    </div>
                    <div className="flex gap-2 text-slate-400 shrink-0 ml-2">
                        <div className="relative" ref={newChatRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowNewChat(prev => !prev)}
                                    className={`p-1.5 rounded-lg transition-colors ${branchId || isCustomer ? 'hover:text-primary hover:bg-slate-100' : 'text-slate-300'}`}
                                    title={isCustomer ? "Start Chat with Business" : "New Chat"}
                                >
                                    <Plus size={18} />
                                </button>

                                {showNewChat && (
                                    <div className="absolute right-[-1rem] sm:right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50">
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
                                            {isCustomer ? (
                                                customerAvailableBranches.length === 0 ? (
                                                    <div className="px-4 py-4 text-xs text-slate-400">No businesses found in your visit history.</div>
                                                ) : (
                                                    customerAvailableBranches.map(branch => (
                                                        <button
                                                            key={branch.id}
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                // Check if we already have a conversation with this branch
                                                                const existingConv = allThreads.find(t => t.contact?.id === branch.id);
                                                                if (existingConv) {
                                                                    setActiveConversation(existingConv.id);
                                                                } else {
                                                                    addPendingThread({
                                                                        id: branch.id,
                                                                        name: branch.name,
                                                                        avatar: branch.avatar,
                                                                        isOnline: false,
                                                                    });
                                                                }
                                                                setShowNewChat(false);
                                                                setCustomerQuery('');
                                                            }}
                                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left"
                                                        >
                                                            <div className={`w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-white text-xs font-bold ${getAvatarColor(branch.id)}`}>
                                                                {branch.avatar ? (
                                                                    <img src={branch.avatar} alt={branch.name} className="w-full h-full rounded-full object-cover" />
                                                                ) : (
                                                                    getInitials(branch.name)
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-semibold text-slate-900 truncate">{branch.name}</p>
                                                                <p className="text-xs text-slate-400 truncate">VemTap Partner</p>
                                                            </div>
                                                        </button>
                                                    ))
                                                )
                                            ) : !branchId ? (
                                                <div className="px-4 py-4 text-xs text-amber-600">Select a branch to start a chat.</div>
                                            ) : visitorsLoading ? (
                                                <div className="px-4 py-4 text-xs text-slate-400">Loading visitors...</div>
                                            ) : availableVisitors.length === 0 ? (
                                                <div className="px-4 py-4 text-xs text-slate-400">Your first customer is waiting. Let's capture them today.</div>
                                            ) : (
                                                availableVisitors.map(visitor => {
                                                    const visitorDisplayName = visitor.name || 
                                                        (visitor.firstName || visitor.lastName 
                                                            ? `${visitor.firstName || ''} ${visitor.lastName || ''}`.trim() 
                                                            : 'Unknown Visitor');
                                                    return (
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
                                                                    name: visitorDisplayName,
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
                                                        <div className={`w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-white text-xs font-bold ${getAvatarColor(visitor.id)}`}>
                                                            {getInitials(visitorDisplayName)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-slate-900 truncate">{visitorDisplayName}</p>
                                                            <p className="text-xs text-slate-400 truncate">{visitor.phone || visitor.email}</p>
                                                        </div>
                                                    </button>
                                                    );
                                                })
                                            )}
                                            
                                        </div>
                                    </div>
                                )}
                            </div>
                            {!isCustomer && (
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
                                        <div className="absolute right-[-1rem] sm:right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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

                                                {/* Backend Segments */}
                                                {segments.map((segment: any) => (
                                                    <button 
                                                        key={segment.id}
                                                        onClick={() => handleBroadcastToSegment(segment.id)}
                                                        className="w-full flex items-center justify-between p-3 hover:bg-emerald-50 rounded-xl transition-colors group text-left"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                                                                <Users size={16} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-700">{segment.name}</p>
                                                                <p className="text-[10px] text-slate-400">{segment.description || 'Customer Segment'}</p>
                                                            </div>
                                                        </div>
                                                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                            {segment._count?.users || segment.users?.length || segment.customerCount || 0}
                                                        </span>
                                                    </button>
                                                ))}

                                                {/* Legacy Custom Tags (Keep for transition) */}
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
                                                                <p className="text-[10px] text-slate-400">Visitor Tag</p>
                                                            </div>
                                                        </div>
                                                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                            {count}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Create Segment Button */}
                                            <div className="mx-2 mt-2 pt-3 border-t border-slate-50">
                                                <button 
                                                    onClick={() => {
                                                        setShowCampaigns(false);
                                                        setShowCreateSegment(true);
                                                    }}
                                                    className="w-full flex items-center justify-center gap-2 p-3 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl transition-all group"
                                                >
                                                    <div className="size-8 bg-primary text-white rounded-lg flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-110 transition-transform">
                                                        <Plus size={18} />
                                                    </div>
                                                    <span className="text-sm font-bold">Create New Segment</span>
                                                </button>
                                                <p className="mt-2 text-[10px] text-center text-slate-400 font-medium px-4 italic leading-tight">
                                                    Group customers from your entire database into targeted segments
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!isCustomer && (
                                <Link 
                                    href={`/dashboard/messaging/chat/settings${branchId ? `?branchId=${branchId}` : ''}`}
                                    className="p-1.5 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Chat Settings"
                                >
                                    <Settings size={18} />
                                </Link>
                            )}
                </div>
            </header>

                {/* Tabs removed as WhatsApp moved to its own page */}

                {/* Search */}
                <div className="p-4 bg-white">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border-none bg-slate-100 rounded-xl text-sm placeholder-slate-500 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Conversations / Contacts - Scrollable Area */}
            <nav className="flex-1 overflow-y-auto custom-scrollbar">
                {!isCustomer && !branchId ? (
                    <div className="p-8 text-center text-amber-500 text-sm font-medium">Please select a branch first</div>
                ) : (
                    <>
                        {threadsLoading ? (
                            <SidebarSkeleton />
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
                )}
            </nav>
            {showSendMessageModal && (selectedSegmentId || broadcastAudience) && (
                <SendMessageModal
                    isOpen={showSendMessageModal}
                    onClose={() => {
                        setShowSendMessageModal(false);
                        setSelectedSegmentId(null);
                        setBroadcastAudience(null);
                    }}
                    segmentId={selectedSegmentId || undefined}
                    visitors={broadcastAudience || undefined}
                    recipientName={broadcastAudience ? `${broadcastAudience.length} visitors` : undefined}
                    initialChannel="In-App"
                    allowedChannels={['In-App']}
                    type="general"
                />
            )}
            {showCreateSegment && (
                <CreateSegmentModal
                    isOpen={showCreateSegment}
                    onClose={() => setShowCreateSegment(false)}
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
            <div className="pl-2 md:pl-4">
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

            <div
                role="button"
                tabIndex={0}
                onClick={onClick}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClick();
                    }
                }}
                className="flex-1 flex items-center gap-3 p-3 md:p-4 pl-2 md:pl-3 transition-colors text-left overflow-hidden relative group cursor-pointer"
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
                <div className="flex-1 min-w-0 pr-12">
                    <div className="flex justify-between items-baseline">
                        <h3 className={`text-sm truncate ${isActive ? 'font-semibold text-slate-900' : 'font-medium text-slate-900'}`}>
                            {name}
                        </h3>
                        <span className="text-xs text-slate-400 shrink-0 ml-2">
                            {formatTime(conversation.lastActivityAt || conversation.updatedAt)}
                        </span>
                    </div>
                    {(customer?.phone || conversation.contact?.phone) && (
                        <p className="text-[10px] font-bold text-slate-400 -mt-0.5 mb-0.5 ml-0.5">
                            {customer?.phone || conversation.contact?.phone}
                        </p>
                    )}
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
                    </div>
                </div>

                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="p-2 text-slate-400 hover:text-rose-500 transition-colors disabled:opacity-50"
                            title="Delete Conversation"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
            </div>
        </div>
    );
}
