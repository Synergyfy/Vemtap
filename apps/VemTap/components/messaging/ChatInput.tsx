'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Smile, Paperclip, Camera, Send, X } from 'lucide-react';
import { useSendReply } from '@/hooks/useMessaging';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useBranches } from '@/services/branches/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useChatStore } from '@/lib/store/useChatStore';

interface ChatInputProps {
    conversationId: string;
    isMock?: boolean;
}

const COMMON_EMOJIS = ['😊', '😂', '❤️', '👍', '🙏', '🔥', '✨', '🙌', '😮', '😢', '😍', '🤔', '🎉', '✅', '🚀', '👋'];

export default function ChatInput({ conversationId, isMock }: ChatInputProps) {
    const [text, setText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const user = useAuthStore(s => s.user);
    const { activeBranchId, setActiveBranch } = useActiveBranch();
    const { data: branches = [] } = useBranches();
    const addMockMessage = useChatStore(s => s.addMockMessage);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!user || user.role === 'customer') return;
        if (!activeBranchId && branches.length === 1) {
            setActiveBranch(branches[0].id);
        }
    }, [activeBranchId, branches, user, setActiveBranch]);

    const isCustomer = user?.role === 'customer';
    const branchId = isCustomer ? undefined : (activeBranchId || (branches.length === 1 ? branches[0]?.id : undefined));
    
    // Business reply mutation
    const businessReply = useSendReply();
    
    // Customer reply mutation (different endpoint)
    const customerReply = useMutation({
        mutationFn: ({ threadId, content }: { threadId: string; content: string }) =>
          api.post(`/customer/messaging/threads/${threadId}/reply`, { content }),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
          queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
        },
    });

    const handleSend = async () => {
        if (!text.trim()) return;

        if (isMock || conversationId.startsWith('mock-')) {
            addMockMessage(conversationId, {
                id: `mock-msg-${Date.now()}`,
                threadId: conversationId,
                direction: isCustomer ? 'INBOUND' : 'OUTBOUND',
                type: 'text',
                content: text.trim(),
                timestamp: new Date().toISOString(),
                status: 'SENT',
            });
            setText('');
            setShowEmojiPicker(false);
            if (textareaRef.current) {
                textareaRef.current.style.height = '';
            }
            return;
        }
        
        if (!isCustomer && !branchId) {
            toast.error('Please select a branch first');
            return;
        }

        try {
            if (isCustomer) {
                await customerReply.mutateAsync({ threadId: conversationId, content: text.trim() });
            } else {
                await businessReply.mutateAsync({ threadId: conversationId, content: text.trim(), branchId: branchId! });
            }
            setText('');
            setShowEmojiPicker(false);
            if (textareaRef.current) {
                textareaRef.current.style.height = '';
            }
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
        setText(prev => prev + emoji);
        textareaRef.current?.focus();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
        const file = e.target.files?.[0];
        if (!file) return;
        toast.error('File uploads are coming soon!');
        if (e.target) e.target.value = '';
    };

    const isSending = businessReply.isPending || customerReply.isPending;

    return (
        <footer className="p-4 bg-white border-t border-slate-200 shrink-0 relative">
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
                        onChange={e => setText(e.target.value)}
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
                    <Send size={18} className={`${isSending ? 'animate-pulse' : ''}`} />
                </button>
            </div>
        </footer>
    );
}
