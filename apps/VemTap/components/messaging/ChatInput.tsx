'use client';

import React, { useState, useRef } from 'react';
import { useChatStore } from '@/lib/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Smile, Paperclip, Camera, Send } from 'lucide-react';

interface ChatInputProps {
    conversationId: string;
}

export default function ChatInput({ conversationId }: ChatInputProps) {
    const [text, setText] = useState('');
    const sendMessage = useChatStore(s => s.sendMessage);
    const user = useAuthStore(s => s.user);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isCustomer = user?.role === 'customer';

    const handleSend = () => {
        if (!text.trim()) return;
        const direction = isCustomer ? 'inbound' : 'outbound';
        sendMessage(conversationId, text.trim(), 'text', direction);
        setText('');
        if (textareaRef.current) {
            textareaRef.current.style.height = '';
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

    return (
        <footer className="p-4 bg-white border-t border-slate-200 shrink-0">
            <div className="flex items-end gap-2">
                {/* Tool Buttons */}
                <div className="flex items-center gap-0.5 text-slate-400 mb-1">
                    <button className="p-2 hover:text-primary hover:bg-slate-100 rounded-full transition-all" title="Emoji">
                        <Smile size={22} />
                    </button>
                    <button className="p-2 hover:text-primary hover:bg-slate-100 rounded-full transition-all" title="Attach">
                        <Paperclip size={22} />
                    </button>
                    <button className="p-2 hover:text-primary hover:bg-slate-100 rounded-full transition-all" title="Camera">
                        <Camera size={22} />
                    </button>
                </div>

                {/* Input */}
                <div className="flex-1 bg-slate-100 rounded-2xl px-4 py-2 border border-transparent focus-within:border-slate-200 focus-within:bg-white transition-all flex items-end">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onInput={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm max-h-32 resize-none py-1 outline-none"
                    />
                </div>

                {/* Send */}
                <button
                    onClick={handleSend}
                    disabled={!text.trim()}
                    className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-full shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed mb-1"
                >
                    <Send size={18} className="rotate-0" />
                </button>
            </div>
        </footer>
    );
}
