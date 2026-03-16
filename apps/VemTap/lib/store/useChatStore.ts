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
    lastActivityAt?: string;
    updatedAt?: string;
    status?: string;
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
    mockThreads: ChatConversation[];
    mockMessages: Record<string, ChatMessage[]>;

    // Actions
    setActiveConversation: (id: string | null) => void;
    setSearchQuery: (query: string) => void;
    markAsRead: (conversationId: string) => void;
    addMockThread: (contact: ChatContact) => string;
    addMockMessage: (threadId: string, message: ChatMessage) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useChatStore = create<ChatState>()((set, get) => ({
    activeConversationId: null,
    searchQuery: '',
    mockThreads: [],
    mockMessages: {},

    setActiveConversation: (id) => {
        set({ activeConversationId: id });
    },

    setSearchQuery: (query) => set({ searchQuery: query }),

    markAsRead: (conversationId) => {
        // Implementation handled by TanStack Query invalidation in hooks
    },
    addMockThread: (contact) => {
        const existing = get().mockThreads.find(thread => thread.contact.id === contact.id);
        if (existing) {
            set({ activeConversationId: existing.id });
            return existing.id;
        }

        const now = new Date().toISOString();
        const threadId = `mock-${contact.id}`;
        const newThread: ChatConversation = {
            id: threadId,
            contact,
            lastMessage: '',
            lastMessageTime: Date.now(),
            unreadCount: 0,
            isTyping: false,
            channel: 'IN_HOUSE',
            lastActivityAt: now,
            updatedAt: now,
            status: 'New conversation',
        };

        set(state => ({
            mockThreads: [newThread, ...state.mockThreads],
            activeConversationId: threadId,
        }));
        return threadId;
    },
    addMockMessage: (threadId, message) => {
        set(state => {
            const prevMessages = state.mockMessages[threadId] || [];
            const updatedMessages = [...prevMessages, message];
            const updatedThreads = state.mockThreads.map(thread => {
                if (thread.id !== threadId) return thread;
                return {
                    ...thread,
                    lastMessage: message.content,
                    lastMessageTime: Date.now(),
                    lastActivityAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    status: 'Active conversation',
                };
            });

            return {
                mockMessages: { ...state.mockMessages, [threadId]: updatedMessages },
                mockThreads: updatedThreads,
            };
        });
    },
}));
