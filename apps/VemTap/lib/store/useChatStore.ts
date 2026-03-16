'use client';

import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatContact {
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
    email?: string;
    isOnline: boolean;
    lastSeen?: number;
}

export type ChatMessageType = 'text' | 'image' | 'file';
export type ChatMessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'PENDING' | 'FAILED';

export interface ChatMessage {
    id: string;
    threadId: string;
    direction: 'INBOUND' | 'OUTBOUND';
    type: ChatMessageType;
    content: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
    timestamp: string | number;
    status: ChatMessageStatus;
}

export interface ChatConversation {
    id: string;
    contact: ChatContact;
    lastMessage: string;
    lastMessageTime: number;
    unreadCount: number;
    isTyping: boolean;
    channel: string;
}

export interface AutomatedReplyConfig {
    welcomeEnabled: boolean;
    welcomeMessage: string;
    offHoursEnabled: boolean;
    offHoursMessage: string;
    offHoursSchedule: string;
    faqEnabled: boolean;
    faqKeywords: Array<{ id: string; keywords: string[]; response: string; enabled: boolean }>;
}

export interface ChatCategory {
    id: string;
    name: string;
    routeTo: string;
    urgency: 'Low' | 'Medium' | 'High';
    teamAccess: string[];
    icon: string;
    slug: string;
}

interface ChatState {
    activeConversationId: string | null;
    searchQuery: string;

    // Actions
    setActiveConversation: (id: string | null) => void;
    setSearchQuery: (query: string) => void;
    markAsRead: (conversationId: string) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useChatStore = create<ChatState>()((set, get) => ({
    activeConversationId: null,
    searchQuery: '',

    setActiveConversation: (id) => {
        set({ activeConversationId: id });
    },

    setSearchQuery: (query) => set({ searchQuery: query }),

    markAsRead: (conversationId) => {
        // Implementation handled by TanStack Query invalidation in hooks
    },
}));
