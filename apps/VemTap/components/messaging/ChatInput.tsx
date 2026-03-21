'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Smile, Paperclip, Camera, Send, X, CornerUpLeft } from 'lucide-react';
import { useSendReply, useChatTemplates } from '@/hooks/useMessaging';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useBranches } from '@/services/branches/hooks';
import toast from 'react-hot-toast';
import { useChatStore } from '@/lib/store/useChatStore';
import { useMemo } from 'react';

interface ChatInputProps {
    conversationId: string;
    isMock?: boolean;
    onTypingChange?: (isTyping: boolean) => void;
    replyTo?: { id?: string; content?: string };
    onCancelReply?: () => void;
}

const COMMON_EMOJIS = ['😊', '😂', '❤️', '👍', '🙏', '🔥', '✨', '🙌', '😮', '😢', '😍', '🤔', '🎉', '✅', '🚀', '👋'];

export default function ChatInput({ conversationId, isMock, onTypingChange, replyTo, onCancelReply }: ChatInputProps) {
    const [text, setText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);
    const [templateSearch, setTemplateSearch] = useState('');
    const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);

    const user = useAuthStore(s => s.user);
    const { activeBranchId, setActiveBranch } = useActiveBranch();
    const { data: branches = [] } = useBranches();
    
    // Fetch templates for the current branch
    const { data: templates = [] } = useChatTemplates(activeBranchId! || branches[0]?.id);
    const addMockMessage = useChatStore(s => s.addMockMessage);
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

    const isCustomer = user?.role === 'customer';
    const branchId = isCustomer ? undefined : (activeBranchId || (branches.length === 1 ? branches[0]?.id : undefined));
    
    // Unified reply mutation (handles both business and customer endpoints)
    const replyMutation = useSendReply(isCustomer);

    // Filter templates based on search string (text after / or @)
    const filteredTemplates = useMemo(() => {
        if (!templateSearch) return templates;
        return templates.filter((t: any) => 
            t.name.toLowerCase().includes(templateSearch.toLowerCase()) || 
            t.content.toLowerCase().includes(templateSearch.toLowerCase())
        );
    }, [templates, templateSearch]);

    // Handle slash commands and mentions
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const cursorPosition = e.target.selectionStart;
        setText(value);
        handleTypingActivity(value);

        // Check if cursor is after / or @
        const lastTrigger = value.lastIndexOf('/', cursorPosition - 1);
        const lastMention = value.lastIndexOf('@', cursorPosition - 1);
        const trigger = lastTrigger > lastMention ? lastTrigger : lastMention;

        if (trigger !== -1 && (trigger === 0 || value[trigger - 1] === ' ')) {
            const searchStr = value.substring(trigger + 1, cursorPosition);
            // Don't show if there's a space after the trigger
            if (!searchStr.includes(' ')) {
                setTemplateSearch(searchStr);
                setShowTemplatePicker(true);
                setSelectedTemplateIndex(0);
                return;
            }
        }
        setShowTemplatePicker(false);
    };

    const insertTemplate = (template: any) => {
        const cursorPosition = textareaRef.current?.selectionStart || text.length;
        const lastTrigger = text.lastIndexOf('/', cursorPosition - 1);
        const lastMention = text.lastIndexOf('@', cursorPosition - 1);
        const trigger = lastTrigger > lastMention ? lastTrigger : lastMention;

        if (trigger !== -1) {
            const before = text.substring(0, trigger);
            const after = text.substring(cursorPosition);
            
            // Replace placeholders in template content if possible
            let content = template.content;
            if (user?.name) content = content.replace(/{BusinessName}/g, user.businessName || 'Vemtap');
            
            setText(before + content + after);
            setShowTemplatePicker(false);
            
            // Focus and adjust height
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    handleInput();
                }
            }, 0);
        }
    };

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
                replyTo: replyTo?.id ? { id: replyTo.id, content: replyTo.content } : undefined,
            });
            setText('');
            setShowEmojiPicker(false);
            emitTyping(false);
            onCancelReply?.();
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
            await replyMutation.mutateAsync({ 
                threadId: conversationId, 
                content: text.trim(), 
                branchId,
                replyToId: replyTo?.id,
            });
            setText('');
            setShowEmojiPicker(false);
            emitTyping(false);
            onCancelReply?.();
            if (textareaRef.current) {
                textareaRef.current.style.height = '';
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to send message');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showTemplatePicker && filteredTemplates.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedTemplateIndex(prev => (prev + 1) % filteredTemplates.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedTemplateIndex(prev => (prev - 1 + filteredTemplates.length) % filteredTemplates.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                insertTemplate(filteredTemplates[selectedTemplateIndex]);
            } else if (e.key === 'Escape') {
                setShowTemplatePicker(false);
            }
            return;
        }

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

    const isSending = replyMutation.isPending;

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
            {/* Template Picker Popover */}
            {showTemplatePicker && filteredTemplates.length > 0 && (
                <div className="absolute bottom-full left-4 mb-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
                    <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Insert Template</span>
                        <span className="text-[9px] text-slate-300 font-bold">Use ↑↓ and ↵</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
                        {filteredTemplates.map((template: any, idx: number) => (
                            <button
                                key={template.id}
                                onClick={() => insertTemplate(template)}
                                onMouseEnter={() => setSelectedTemplateIndex(idx)}
                                className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1 ${
                                    idx === selectedTemplateIndex ? 'bg-primary/5 ring-1 ring-primary/10' : 'hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className={`text-[11px] font-bold ${idx === selectedTemplateIndex ? 'text-primary' : 'text-slate-700'}`}>
                                        {template.name}
                                    </span>
                                    {idx === selectedTemplateIndex && <CornerUpLeft size={10} className="text-primary opacity-40" />}
                                </div>
                                <p className="text-[10px] text-slate-400 line-clamp-1 italic">
                                    {template.content}
                                </p>
                            </button>
                        ))}
                    </div>
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
                        onChange={handleTextChange}
                        onInput={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message... (Use / or @ for templates)"
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
