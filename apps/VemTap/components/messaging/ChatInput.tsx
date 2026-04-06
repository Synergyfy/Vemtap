'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Smile, Paperclip, Camera, Send, X, CornerUpLeft, MoreHorizontal, Gift, ShoppingBag, Tag } from 'lucide-react';
import { useSendReply, useChatTemplates, useStartConversation, useInitBranchConversation } from '@/hooks/useMessaging';
import { useRewards } from '@/services/loyalty/hooks';
import { useCatalogueItems, useCatalogueOffersAdmin } from '@/services/catalogue/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useBranches } from '@/services/branches/hooks';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useChatStore } from '@/lib/store/useChatStore';
import Spinner from '../ui/Spinner';

interface ChatInputProps {
    conversationId?: string;
    onTypingChange?: (isTyping: boolean) => void;
    replyTo?: { id?: string; content?: string };
    onCancelReply?: () => void;
    startBranchId?: string;
    onConversationStarted?: (threadId: string) => void;
}

const COMMON_EMOJIS = ['😊', '😂', '❤️', '👍', '🙏', '🔥', '✨', '🙌', '😮', '😢', '😍', '🤔', '🎉', '✅', '🚀', '👋'];

export default function ChatInput({
    conversationId,
    onTypingChange,
    replyTo,
    onCancelReply,
    startBranchId,
    onConversationStarted,
}: ChatInputProps) {
    const [text, setText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMediaOptions, setShowMediaOptions] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const user = useAuthStore(s => s.user);
    const isCustomer = user?.role?.toLowerCase() === 'customer';
    const { activeBranchId, setActiveBranch } = useActiveBranch();
    const searchParams = useSearchParams();
    const { data: branches = [] } = useBranches(!isCustomer);
    const linkPendingThread = useChatStore(s => s.linkPendingThread);
    const setActiveConversation = useChatStore(s => s.setActiveConversation);
    const drafts = useChatStore(s => s.drafts);
    const setDraft = useChatStore(s => s.setDraft);
    const clearDraft = useChatStore(s => s.clearDraft);

    // Command selection states
    const [showTemplates, setShowTemplates] = useState(false);
    const [showRewards, setShowRewards] = useState(false);
    const [showCatalogue, setShowCatalogue] = useState(false);
    const [triggerChar, setTriggerChar] = useState(''); // / or @ or # or !
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [commandSearch, setCommandSearch] = useState('');

    // Fetch data
    const effectiveBranchId = activeBranchId! || branches[0]?.id;
    const { data: templates = [] } = useChatTemplates(effectiveBranchId, !isCustomer && !!effectiveBranchId);
    const { data: rewards = [] } = useRewards(effectiveBranchId, !isCustomer && !!effectiveBranchId);
    const { data: catalogueItems = [] } = useCatalogueItems({ branchId: effectiveBranchId }, { enabled: !isCustomer && !!effectiveBranchId });
    const { data: catalogueOffers = [] } = useCatalogueOffersAdmin({ branchId: effectiveBranchId }, { enabled: !isCustomer && !!effectiveBranchId });

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTypingRef = useRef(false);
    const emojiRef = useRef<HTMLDivElement>(null);
    const mediaOptionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user || user?.role?.toLowerCase() === 'customer') return;
        if (!activeBranchId && branches.length === 1) {
            setActiveBranch(branches[0].id);
        }
    }, [activeBranchId, branches, user, setActiveBranch]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mediaOptionsRef.current && !mediaOptionsRef.current.contains(event.target as Node)) {
                setShowMediaOptions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (conversationId && drafts[conversationId]) {
            setText(drafts[conversationId]);
        } else {
            const orderId = searchParams.get('orderId');
            if (orderId && !conversationId) {
                setText(`Inquiry regarding order #${orderId.slice(0, 8)}`);
            } else {
                setText('');
            }
        }
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.style.height = '';
                textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
            }
        }, 10);
    }, [conversationId]);

    const branchId = isCustomer ? undefined : (activeBranchId || (branches.length === 1 ? branches[0]?.id : undefined));
    
    const replyMutation = useSendReply(isCustomer);
    const startConversationMutation = useStartConversation();
    const initBranchConvMutation = useInitBranchConversation();
    const canStartConversation = isCustomer && !!startBranchId && !conversationId;
    const canBranchStartConversation = !isCustomer && !!conversationId && conversationId.startsWith('pending-');

    const filteredTemplates = useMemo(() => {
        if (!commandSearch) return templates;
        return templates.filter((t: any) => 
            t.name.toLowerCase().includes(commandSearch.toLowerCase()) || 
            t.content.toLowerCase().includes(commandSearch.toLowerCase())
        );
    }, [templates, commandSearch]);

    const filteredRewards = useMemo(() => {
        if (!commandSearch) return rewards;
        return rewards.filter((r: any) => 
            r.name.toLowerCase().includes(commandSearch.toLowerCase()) || 
            (r.description && r.description.toLowerCase().includes(commandSearch.toLowerCase()))
        );
    }, [rewards, commandSearch]);

    const filteredCatalogue = useMemo(() => {
        const items = (catalogueItems || []).map(i => ({ ...i, type: 'item' }));
        const offers = (catalogueOffers || []).map(o => ({ ...o, type: 'offer' }));
        const combined = [...items, ...offers];
        if (!commandSearch) return combined;
        return combined.filter((c: any) => 
            c.name.toLowerCase().includes(commandSearch.toLowerCase()) || 
            (c.description && c.description.toLowerCase().includes(commandSearch.toLowerCase()))
        );
    }, [catalogueItems, catalogueOffers, commandSearch]);

    const emitTyping = useCallback((next: boolean) => {
        if (!onTypingChange) return;
        if (isTypingRef.current === next) return;
        isTypingRef.current = next;
        onTypingChange(next);
    }, [onTypingChange]);

    const handleTypingActivity = useCallback((nextValue: string) => {
        if (!onTypingChange) return;
        if (!nextValue.trim()) {
            emitTyping(false);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
            return;
        }

        emitTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            emitTyping(false);
        }, 1500);
    }, [onTypingChange, emitTyping]);

    const insertTemplate = useCallback((template: any) => {
        const cursorPosition = textareaRef.current?.selectionStart || text.length;
        const textBeforeCursor = text.slice(0, cursorPosition);
        const match = textBeforeCursor.match(/(?:^|\s)[@\/]\w*$/);

        if (match) {
            const startPos = match.index! + (match[0].startsWith(' ') ? 1 : 0);
            
            // Replace placeholders in template content if possible
            let content = template.content;
            
            // Try to resolve common placeholders
            const contactName = (useChatStore.getState().pendingThreads.find(p => p.id === conversationId)?.contact?.name) || 'Customer';
            const businessName = (user as any)?.businessName || (branches[0]?.name) || 'Vemtap';
            
            content = content
                .replace(/{CustomerName}/g, contactName)
                .replace(/{BusinessName}/g, businessName)
                .replace(/{BranchName}/g, (branches.find(b => b.id === effectiveBranchId)?.name) || businessName);

            const newValue = text.slice(0, startPos) + content + text.slice(cursorPosition);
            setText(newValue);
            if (conversationId) setDraft(conversationId, newValue);
            setShowTemplates(false);
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.style.height = '';
                    textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
                    const newPos = startPos + content.length;
                    textareaRef.current.setSelectionRange(newPos, newPos);
                }
            }, 0);
        }
    }, [text, conversationId, setDraft, user, branches, effectiveBranchId]);

    const sendReward = useCallback(async (reward: any) => {
        if (!conversationId) return;
        try {
            await replyMutation.mutateAsync({ 
                threadId: conversationId, 
                content: `🎁 Reward: ${reward.name}`, 
                branchId,
                metadata: { rewardId: reward.id }
            });
            setText('');
            if (conversationId) clearDraft(conversationId);
            setShowRewards(false);
        } catch (error: any) {
            toast.error('Failed to send reward');
        }
    }, [conversationId, branchId, replyMutation, clearDraft]);

    const sendCatalogueItem = useCallback(async (item: any) => {
        if (!conversationId) return;
        try {
            const isOffer = item.type === 'offer';
            await replyMutation.mutateAsync({ 
                threadId: conversationId, 
                content: isOffer ? `🏷️ Offer: ${item.name}` : `🛍️ Item: ${item.name}`, 
                branchId,
                metadata: isOffer ? { offerId: item.id } : { itemId: item.id }
            });
            setText('');
            if (conversationId) clearDraft(conversationId);
            setShowCatalogue(false);
        } catch (error: any) {
            toast.error('Failed to send catalogue item');
        }
    }, [conversationId, branchId, replyMutation, clearDraft]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const cursorPosition = e.target.selectionStart;
        setText(value);
        if (conversationId) setDraft(conversationId, value);
        handleTypingActivity(value);

        const textBeforeCursor = value.slice(0, cursorPosition);
        const match = textBeforeCursor.match(/(?:^|\s)([@\/#!])(\w*)$/);
        
        if (match) {
            const char = match[1];
            setTriggerChar(char);
            setCommandSearch(match[2]);
            if (char === '#') {
                setShowRewards(true);
                setShowTemplates(false);
                setShowCatalogue(false);
            } else if (char === '!') {
                setShowCatalogue(true);
                setShowRewards(false);
                setShowTemplates(false);
            } else {
                setShowTemplates(true);
                setShowRewards(false);
                setShowCatalogue(false);
            }
            setSelectedIndex(0);
        } else {
            setShowTemplates(false);
            setShowRewards(false);
            setShowCatalogue(false);
            setTriggerChar('');
        }
    };

    const isSending = replyMutation.isPending || startConversationMutation.isPending || initBranchConvMutation.isPending || isStarting;

    const handleSend = useCallback(async () => {
        if (!text.trim() || isSending || isStarting) return;

        if (canStartConversation) {
            setIsStarting(true);
            try {
                const response: any = await startConversationMutation.mutateAsync({
                    branchId: startBranchId!,
                    content: text.trim(),
                });
                const threadId = response?.threadId || response?.thread?.id || response?.id;
                if (threadId) onConversationStarted?.(threadId);
                if (conversationId) clearDraft(conversationId);
                setText('');
                setShowEmojiPicker(false);
                emitTyping(false);
                onCancelReply?.();
            } catch (error: any) {
                toast.error(error.message || 'Failed to start conversation');
            } finally {
                setIsStarting(false);
            }
            return;
        }

        if (canBranchStartConversation && conversationId) {
            if (!branchId) {
                toast.error('Please select a branch first');
                return;
            }
            setIsStarting(true);
            const customerId = conversationId.replace('pending-', '');
            try {
                const initResponse: any = await initBranchConvMutation.mutateAsync({ branchId, customerId });
                const realThreadId = initResponse?.threadId || initResponse?.thread?.id || initResponse?.id;
                if (realThreadId) {
                    await replyMutation.mutateAsync({ threadId: realThreadId, content: text.trim(), branchId });
                    setActiveConversation(realThreadId);
                    linkPendingThread(conversationId, realThreadId);
                    onConversationStarted?.(realThreadId);
                }
                setText('');
                if (conversationId) clearDraft(conversationId);
                onCancelReply?.();
            } catch (error: any) {
                toast.error(error.message || 'Failed to start conversation');
            } finally {
                setIsStarting(false);
            }
            return;
        }

        if (!conversationId) {
            toast.error('Select a conversation first');
            return;
        }

        try {
            await replyMutation.mutateAsync({ 
                threadId: conversationId, 
                content: text.trim(), 
                branchId,
                replyToId: replyTo?.id,
            });
            setText('');
            if (conversationId) clearDraft(conversationId);
            onCancelReply?.();
            if (textareaRef.current) textareaRef.current.style.height = '';
        } catch (error: any) {
            toast.error(error.message || 'Failed to send message');
        }
    }, [text, isSending, isStarting, canStartConversation, startConversationMutation, startBranchId, onConversationStarted, conversationId, clearDraft, emitTyping, onCancelReply, canBranchStartConversation, branchId, initBranchConvMutation, replyMutation, setActiveConversation, linkPendingThread, replyTo?.id]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const isPopperOpen = (showTemplates && filteredTemplates.length > 0) || (showRewards && filteredRewards.length > 0) || (showCatalogue && filteredCatalogue.length > 0);
        const currentList = showRewards ? filteredRewards : showCatalogue ? filteredCatalogue : filteredTemplates;

        if (isPopperOpen && currentList.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % currentList.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + currentList.length) % currentList.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                if (showRewards) sendReward(currentList[selectedIndex]);
                else if (showCatalogue) sendCatalogueItem(currentList[selectedIndex]);
                else insertTemplate(currentList[selectedIndex]);
            } else if (e.key === 'Escape') {
                setShowTemplates(false);
                setShowRewards(false);
                setShowCatalogue(false);
            }
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            const isMobileOrTablet = typeof window !== 'undefined' && window.innerWidth < 1024;
            if (isMobileOrTablet) return;
            e.preventDefault();
            if (!isSending) handleSend();
        }
    };

    const addEmoji = (emoji: string) => {
        setText(prev => prev + emoji);
        textareaRef.current?.focus();
    };

    return (
        <footer className="p-4 bg-white md:border-t md:border-slate-200 shrink-0 relative">
            {replyTo?.content && (
                <div className="mb-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Replying to</p>
                        <p className="truncate">{replyTo.content}</p>
                    </div>
                    <button type="button" onClick={onCancelReply} className="size-7 rounded-lg border border-slate-200 text-slate-400 hover:bg-white flex items-center justify-center">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Selection Poppers */}
            {showTemplates && filteredTemplates.length > 0 && (
                <div className="absolute bottom-full left-4 mb-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Template</p>
                        <span className="text-[9px] text-slate-300 font-bold">Use ↑↓ and ↵</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
                        {filteredTemplates.map((t: any, i: number) => (
                            <button key={t.id} onClick={() => insertTemplate(t)} onMouseEnter={() => setSelectedIndex(i)} className={`w-full flex flex-col items-start px-4 py-3 rounded-xl transition-all ${i === selectedIndex ? 'bg-primary/5 ring-1 ring-primary/10' : 'hover:bg-slate-50'}`}>
                                <span className={`text-sm font-bold ${i === selectedIndex ? 'text-primary' : 'text-slate-700'}`}>{t.name}</span>
                                <span className="text-xs text-slate-500 truncate w-full mt-1">{t.content}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {showRewards && filteredRewards.length > 0 && (
                <div className="absolute bottom-full left-4 mb-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Send Reward</p>
                        <span className="text-[9px] text-slate-300 font-bold">Use ↑↓ and ↵</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
                        {filteredRewards.map((r: any, i: number) => (
                            <button key={r.id} onClick={() => sendReward(r)} onMouseEnter={() => setSelectedIndex(i)} className={`w-full flex flex-col items-start px-4 py-3 rounded-xl transition-all ${i === selectedIndex ? 'bg-primary/5 ring-1 ring-primary/10' : 'hover:bg-slate-50'}`}>
                                <div className="flex items-center gap-2">
                                    <div className={`p-1 rounded-lg ${i === selectedIndex ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-400'}`}><Gift size={12} /></div>
                                    <span className={`text-sm font-bold ${i === selectedIndex ? 'text-primary' : 'text-slate-700'}`}>{r.name}</span>
                                </div>
                                <span className="text-xs text-slate-400 truncate w-full italic mt-1">{r.description || 'No description'}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {showCatalogue && filteredCatalogue.length > 0 && (
                <div className="absolute bottom-full left-4 mb-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Send Item/Offer</p>
                        <span className="text-[9px] text-slate-300 font-bold">Use ↑↓ and ↵</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto p-1 custom-scrollbar">
                        {filteredCatalogue.map((c: any, i: number) => (
                            <button key={c.id} onClick={() => sendCatalogueItem(c)} onMouseEnter={() => setSelectedIndex(i)} className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all ${i === selectedIndex ? 'bg-primary/5 ring-1 ring-primary/10' : 'hover:bg-slate-50'}`}>
                                <div className="size-12 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                                    {c.mainImage ? (
                                        <img src={c.mainImage} alt="" className="size-full object-cover" />
                                    ) : (
                                        <div className="size-full flex items-center justify-center text-slate-400">
                                            {c.type === 'offer' ? <Tag size={20} /> : <ShoppingBag size={20} />}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`text-sm font-bold truncate ${i === selectedIndex ? 'text-primary' : 'text-slate-700'}`}>{c.name}</span>
                                        <span className="text-xs font-black text-primary whitespace-nowrap">₦{(c.price || c.calculatedPrice || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-tight">{c.type}</span>
                                        {c.loyaltyPoints > 0 && (
                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 uppercase tracking-tight flex items-center gap-0.5">
                                                <Gift size={8} /> +{c.loyaltyPoints} Points
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-400 truncate mt-1">{c.description || c.shortDescription || 'No description'}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex items-end gap-2">
                <button type="button" onClick={() => setShowMediaOptions(!showMediaOptions)} className={`p-2 hover:text-primary hover:bg-slate-100 rounded-full transition-all ${showMediaOptions ? 'text-primary bg-primary/10' : 'text-slate-400'} mb-1`}>
                    <MoreHorizontal size={26} />
                </button>

                <div className="flex-1 bg-slate-100 rounded-2xl px-4 py-2 border border-transparent focus-within:border-slate-200 focus-within:bg-white transition-all flex items-end">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={text}
                        onChange={handleTextChange}
                        placeholder={isCustomer ? "Type a message..." : "Type a message... (Use / for templates, # for rewards, ! for items)"}
                        disabled={isSending}
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm max-h-32 resize-none py-1 outline-none"
                    />
                </div>

                <button type="button" onClick={handleSend} disabled={!text.trim() || isSending} className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-all transform active:scale-95 disabled:opacity-40 mb-1">
                    {isSending ? <Spinner size="sm" color="white" /> : <Send size={18} />}
                </button>
            </div>
        </footer>
    );
}
