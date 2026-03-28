'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Smile, Paperclip, Camera, Send, X, CornerUpLeft, MoreHorizontal, Gift } from 'lucide-react';
import { useSendReply, useChatTemplates, useStartConversation, useStartBranchConversation, useInitBranchConversation } from '@/hooks/useMessaging';
import { useRewards } from '@/services/loyalty/hooks';
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
    const { activeBranchId, setActiveBranch } = useActiveBranch();
    const searchParams = useSearchParams();
    const { data: branches = [] } = useBranches();
    const addPendingMessage = useChatStore(s => s.addPendingMessage);
    const linkPendingThread = useChatStore(s => s.linkPendingThread);
    const setActiveConversation = useChatStore(s => s.setActiveConversation);
    const drafts = useChatStore(s => s.drafts);
    const setDraft = useChatStore(s => s.setDraft);
    const clearDraft = useChatStore(s => s.clearDraft);

    // Command selection states
    const [showTemplates, setShowTemplates] = useState(false);
    const [showRewards, setShowRewards] = useState(false);
    const [triggerChar, setTriggerChar] = useState(''); // / or @ or #
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [commandSearch, setCommandSearch] = useState('');
    const [triggerPosition, setTriggerPosition] = useState<{ top: number; left: number } | null>(null);

    // Fetch templates and rewards for the current branch
    const effectiveBranchId = activeBranchId! || branches[0]?.id;
    const { data: templates = [] } = useChatTemplates(effectiveBranchId);
    const { data: rewards = [] } = useRewards(effectiveBranchId);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTypingRef = useRef(false);
    const emojiRef = useRef<HTMLDivElement>(null);
    const templateRef = useRef<HTMLDivElement>(null);
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
        // Small delay to allow value to mount
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.style.height = '';
                textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
            }
        }, 10);
    }, [conversationId]);

    const isCustomer = user?.role?.toLowerCase() === 'customer';
    const branchId = isCustomer ? undefined : (activeBranchId || (branches.length === 1 ? branches[0]?.id : undefined));
    
    // Unified reply mutation (handles both business and customer endpoints)
    const replyMutation = useSendReply(isCustomer);
    const startConversationMutation = useStartConversation();
    const initBranchConvMutation = useInitBranchConversation();
    const canStartConversation = isCustomer && !!startBranchId && !conversationId;
    const canBranchStartConversation = !isCustomer && !!conversationId && conversationId.startsWith('pending-');

    // Filter templates based on command search
    const filteredTemplates = useMemo(() => {
        if (!commandSearch) return templates;
        return templates.filter((t: any) => 
            t.name.toLowerCase().includes(commandSearch.toLowerCase()) || 
            t.content.toLowerCase().includes(commandSearch.toLowerCase())
        );
    }, [templates, commandSearch]);

    // Filter rewards based on search
    const filteredRewards = useMemo(() => {
        if (!commandSearch) return rewards;
        return rewards.filter((r: any) => 
            r.name.toLowerCase().includes(commandSearch.toLowerCase()) || 
            r.description.toLowerCase().includes(commandSearch.toLowerCase())
        );
    }, [rewards, commandSearch]);

    const handleInput = useCallback(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, []);

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
            if (user?.name) content = content.replace(/{BusinessName}/g, (user as any).businessName || 'Vemtap');
            
            const newValue = text.slice(0, startPos) + content + text.slice(cursorPosition);
            setText(newValue);
            if (conversationId) setDraft(conversationId, newValue);
            setShowTemplates(false);
            
            // Focus and adjust height
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.style.height = '';
                    textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
                    
                    // Set cursor position after the inserted content
                    const newPos = startPos + content.length;
                    textareaRef.current.setSelectionRange(newPos, newPos);
                }
            }, 0);
        }
    }, [text, user, conversationId, setDraft]);

    const insertReward = useCallback((reward: any) => {
        const cursorPosition = textareaRef.current?.selectionStart || text.length;
        const textBeforeCursor = text.slice(0, cursorPosition);
        const match = textBeforeCursor.match(/(?:^|\s)#\w*$/);

        if (match) {
            const startPos = match.index! + (match[0].startsWith(' ') ? 1 : 0);
            
            const content = `${reward.name}: ${reward.description || ''}`;
            const newValue = text.slice(0, startPos) + content + text.slice(cursorPosition);
            setText(newValue);
            if (conversationId) setDraft(conversationId, newValue);
            setShowRewards(false);
            
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
    }, [text, conversationId, setDraft]);

    // Handle slash commands and mentions
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const cursorPosition = e.target.selectionStart;
        setText(value);
        if (conversationId) setDraft(conversationId, value);
        handleTypingActivity(value);

        // Check if cursor is after / or @ or #
        const textBeforeCursor = value.slice(0, cursorPosition);
        const match = textBeforeCursor.match(/(?:^|\s)([@\/#])(\w*)$/);
        
        if (match) {
            const char = match[1];
            setTriggerChar(char);
            setCommandSearch(match[2]);
            if (char === '#') {
                setShowRewards(true);
                setShowTemplates(false);
            } else {
                setShowTemplates(true);
                setShowRewards(false);
            }
            setSelectedIndex(0);
        } else {
            setShowTemplates(false);
            setShowRewards(false);
            setTriggerChar('');
        }
    };

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
                if (threadId) {
                    onConversationStarted?.(threadId);
                }
                if (conversationId) clearDraft(conversationId);
                setText('');
                setShowEmojiPicker(false);
                emitTyping(false);
                onCancelReply?.();
                if (textareaRef.current) textareaRef.current.style.height = '';
            } catch (error: any) {
                toast.error(error.message || 'Failed to start conversation');
            } finally {
                setIsStarting(false);
            }
            return;
        }

        // Staff sending first message on a pending (local) thread → create real thread
        if (canBranchStartConversation && conversationId) {
            if (!branchId) {
                toast.error('Please select a branch first');
                return;
            }
            setIsStarting(true);
            // Extract the visitor ID from the pending thread ID format: pending-{visitorId}
            const customerId = conversationId.replace('pending-', '');
            try {
                // 1. Initialize the thread first to get a 1-on-1 Inbox thread ID
                const initResponse: any = await initBranchConvMutation.mutateAsync({
                    branchId,
                    customerId,
                });
                
                // Get the real thread ID from the response
                const realThreadId = initResponse?.threadId || initResponse?.thread?.id || initResponse?.id;
                
                if (realThreadId) {
                    // 2. Send the message as a regular reply to this new real thread
                    await replyMutation.mutateAsync({
                        threadId: realThreadId,
                        content: text.trim(),
                        branchId,
                    });

                    // 3. Switch to the real thread ID.
                    setActiveConversation(realThreadId);
                    linkPendingThread(conversationId, realThreadId); // Link it instead of removing
                    onConversationStarted?.(realThreadId);
                } else {
                    throw new Error('Could not obtain a thread ID');
                }
                
                setText('');
                if (conversationId) clearDraft(conversationId);
                setShowEmojiPicker(false);
                emitTyping(false);
                onCancelReply?.();
                if (textareaRef.current) textareaRef.current.style.height = '';
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

        if (!isCustomer && !branchId) {
            toast.error('Please select a branch first');
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
            setShowEmojiPicker(false);
            emitTyping(false);
            onCancelReply?.();
            if (textareaRef.current) textareaRef.current.style.height = '';
        } catch (error: any) {
            toast.error(error.message || 'Failed to send message');
        }
    }, [
        text,
        isStarting,
        canStartConversation,
        startConversationMutation,
        startBranchId,
        onConversationStarted,
        conversationId,
        clearDraft,
        emitTyping,
        onCancelReply,
        canBranchStartConversation,
        branchId,
        initBranchConvMutation,
        replyMutation,
        setActiveConversation,
        linkPendingThread,
        isCustomer,
        replyTo?.id
    ]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const isPopperOpen = (showTemplates && filteredTemplates.length > 0) || (showRewards && filteredRewards.length > 0);
        const currentList = showRewards ? filteredRewards : filteredTemplates;

        if (isPopperOpen && currentList.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % currentList.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + currentList.length) % currentList.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                if (showRewards) insertReward(currentList[selectedIndex]);
                else insertTemplate(currentList[selectedIndex]);
            } else if (e.key === 'Escape') {
                setShowTemplates(false);
                setShowRewards(false);
            }
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isSending) handleSend();
        }
    };


    const addEmoji = (emoji: string) => {
        setText(prev => {
            const next = prev + emoji;
            handleTypingActivity(next);
            return next;
        });
        textareaRef.current?.focus();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
        const file = e.target.files?.[0];
        if (!file) return;
        toast.error('File uploads are coming soon!');
        if (e.target) e.target.value = '';
    };

    const isSending = replyMutation.isPending || startConversationMutation.isPending || initBranchConvMutation.isPending || isStarting;

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            emitTyping(false);
        };
    }, []);

    return (
        <footer className="p-4 bg-white md:border-t md:border-slate-200 shrink-0 relative">
            {replyTo?.content && (
                <div className="mb-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Replying to</p>
                        <p className="truncate">{replyTo.content}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancelReply}
                        className="size-7 rounded-lg border border-slate-200 text-slate-400 hover:bg-white flex items-center justify-center"
                        title="Cancel reply"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Reward Selection Popper */}
            {showRewards && filteredRewards.length > 0 && (
                <div 
                    className="absolute bottom-full left-4 mb-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                    <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Reward</p>
                        <span className="text-[9px] text-slate-300 font-bold">Use ↑↓ and ↵</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
                        {filteredRewards.map((reward: any, index: number) => (
                            <button
                                key={reward.id}
                                onClick={() => insertReward(reward)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={`w-full flex flex-col items-start px-4 py-3 rounded-xl transition-all ${index === selectedIndex ? 'bg-primary/5 ring-1 ring-primary/10' : 'hover:bg-slate-50'}`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1 rounded-lg ${index === selectedIndex ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                                            <Gift size={12} />
                                        </div>
                                        <span className={`text-sm font-bold ${index === selectedIndex ? 'text-primary' : 'text-slate-700'}`}>{reward.name}</span>
                                    </div>
                                    {index === selectedIndex && <CornerUpLeft size={10} className="text-primary opacity-40" />}
                                </div>
                                <span className="text-xs text-slate-400 truncate w-full italic mt-1">{reward.description || 'No description'}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Media Options Popover */}
            {showMediaOptions && (
                <div 
                    ref={mediaOptionsRef}
                    className="absolute bottom-full left-4 mb-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 overflow-hidden"
                >
                    <button 
                        type="button"
                        onClick={() => { setShowMediaOptions(false); setShowEmojiPicker(true); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-slate-600 text-left"
                    >
                        <Smile size={18} className="text-primary" />
                        <span className="text-sm font-bold">Emoji</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => { setShowMediaOptions(false); imageInputRef.current?.click(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-slate-600 text-left"
                    >
                        <Camera size={18} className="text-primary" />
                        <span className="text-sm font-bold">Camera</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => { setShowMediaOptions(false); fileInputRef.current?.click(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-slate-600 text-left"
                    >
                        <Paperclip size={18} className="text-primary" />
                        <span className="text-sm font-bold">Other Media</span>
                    </button>
                </div>
            )}
            
            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
                <div 
                    ref={emojiRef}
                    className="absolute bottom-full left-4 mb-2 p-3 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                    <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quick Emojis</span>
                        <button onClick={() => setShowEmojiPicker(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={14} />
                        </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {COMMON_EMOJIS.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => addEmoji(emoji)}
                                className="text-xl p-2 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Hidden Inputs */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={e => handleFileChange(e, 'file')}
                accept=".pdf,.doc,.docx,.txt"
            />
            <input 
                type="file" 
                ref={imageInputRef} 
                className="hidden" 
                onChange={e => handleFileChange(e, 'image')}
                accept="image/*"
                capture="environment"
            />

            <div className="flex items-end gap-2">
                <div className="flex items-center gap-0.5 text-slate-400 mb-1">
                    <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMediaOptions(!showMediaOptions); }}
                        className={`p-2 hover:text-primary hover:bg-slate-100 rounded-full transition-all ${showMediaOptions ? 'text-primary bg-primary/10' : ''}`} 
                        title="More options"
                    >
                        <MoreHorizontal size={26} />
                    </button>
                </div>

                <div className="flex-1 bg-slate-100 rounded-2xl px-4 py-2 border border-transparent focus-within:border-slate-200 focus-within:bg-white transition-all flex items-end">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={text}
                        onChange={handleTextChange}
                        onInput={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message... (Use / or @ for templates)"
                        disabled={isSending}
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm max-h-32 resize-none py-1 outline-none"
                    />
                </div>

                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSend(); }}
                    disabled={!text.trim() || isSending}
                    className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-full shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed mb-1"
                >
                    {isSending ? (
                        <Spinner size="sm" color="white" />
                    ) : (
                        <Send size={18} />
                    )}
                </button>
            </div>
        </footer>
    );
}
