'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Smile, Paperclip, Camera, Send, X } from 'lucide-react';
import { useSendReply, useStartConversation, useStartBranchConversation, useInitBranchConversation } from '@/hooks/useMessaging';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useBranches } from '@/services/branches/hooks';
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
    const [isStarting, setIsStarting] = useState(false);
    const user = useAuthStore(s => s.user);
    const { activeBranchId, setActiveBranch } = useActiveBranch();
    const { data: branches = [] } = useBranches();
    const addPendingMessage = useChatStore(s => s.addPendingMessage);
    const linkPendingThread = useChatStore(s => s.linkPendingThread);
    const setActiveConversation = useChatStore(s => s.setActiveConversation);
    const drafts = useChatStore(s => s.drafts);
    const setDraft = useChatStore(s => s.setDraft);
    const clearDraft = useChatStore(s => s.clearDraft);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTypingRef = useRef(false);

    useEffect(() => {
        if (!user || user.role === 'customer') return;
        if (!activeBranchId && branches.length === 1) {
            setActiveBranch(branches[0].id);
        }
    }, [activeBranchId, branches, user, setActiveBranch]);

    useEffect(() => {
        if (conversationId && drafts[conversationId]) {
            setText(drafts[conversationId]);
        } else {
            setText('');
        }
        // Small delay to allow value to mount
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.style.height = '';
                textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
            }
        }, 10);
    }, [conversationId]);

    const isCustomer = user?.role === 'customer';
    const branchId = isCustomer ? undefined : (activeBranchId || (branches.length === 1 ? branches[0]?.id : undefined));
    
    // Unified reply mutation (handles both business and customer endpoints)
    const replyMutation = useSendReply(isCustomer);
    const startConversationMutation = useStartConversation();
    const initBranchConvMutation = useInitBranchConversation();
    const canStartConversation = isCustomer && !!startBranchId && !conversationId;
    const canBranchStartConversation = !isCustomer && !!conversationId && conversationId.startsWith('pending-');

    const emitTyping = (next: boolean) => {
        if (!onTypingChange) return;
        if (isTypingRef.current === next) return;
        isTypingRef.current = next;
        onTypingChange(next);
    };

    const handleTypingActivity = (nextValue: string) => {
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
    };

    const handleSend = async () => {
        if (!text.trim() || isStarting) return;

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
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInput = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
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
        <footer className="p-4 bg-white border-t border-slate-200 shrink-0 relative">
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
            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
                <div className="absolute bottom-full left-4 mb-2 p-3 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
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
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`p-2 hover:text-primary hover:bg-slate-100 rounded-full transition-all ${showEmojiPicker ? 'text-primary bg-primary/10' : ''}`} 
                        title="Emoji"
                    >
                        <Smile size={22} />
                    </button>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 hover:text-primary hover:bg-slate-100 rounded-full transition-all" 
                        title="Attach File"
                    >
                        <Paperclip size={22} />
                    </button>
                    <button 
                        onClick={() => imageInputRef.current?.click()}
                        className="p-2 hover:text-primary hover:bg-slate-100 rounded-full transition-all" 
                        title="Take Photo"
                    >
                        <Camera size={22} />
                    </button>
                </div>

                <div className="flex-1 bg-slate-100 rounded-2xl px-4 py-2 border border-transparent focus-within:border-slate-200 focus-within:bg-white transition-all flex items-end">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={text}
                        onChange={e => {
                            const nextValue = e.target.value;
                            setText(nextValue);
                            if (conversationId) setDraft(conversationId, nextValue);
                            handleTypingActivity(nextValue);
                        }}
                        onInput={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        disabled={isSending}
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm max-h-32 resize-none py-1 outline-none"
                    />
                </div>

                <button
                    onClick={handleSend}
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
