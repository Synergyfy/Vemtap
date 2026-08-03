'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { cn } from '@/lib/utils';

interface SupportChatLauncherProps {
    className?: string;
    label?: string;
    variant?: 'solid' | 'outline';
}

export default function SupportChatLauncher({
    className,
    label = 'Support',
    variant = 'solid',
}: SupportChatLauncherProps) {
    const setIsOpen = useChatStore((s) => s.setIsOpen);
    const setIsVisible = useChatStore((s) => s.setIsVisible);

    const handleOpen = () => {
        setIsVisible(true);
        setIsOpen(true);
    };

    return (
        <button
            type="button"
            onClick={handleOpen}
            className={cn(
                'inline-flex items-center gap-2 rounded-full text-xs font-black uppercase tracking-widest transition-all active:scale-95',
                variant === 'solid'
                    ? 'bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-hover'
                    : 'bg-white text-primary border border-gray-100 shadow-sm hover:border-primary/30',
                className
            )}
            aria-label={`Open ${label} chat`}
        >
            <MessageCircle size={15} />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}
