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
    replyTo?: { id?: string; content?: string } | null;
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
    linkedThreadId?: string;
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
    /** Local-only threads created when staff opens a new chat before sending the first message */
    pendingThreads: ChatConversation[];
    pendingMessages: Record<string, ChatMessage[]>;
    typingByThread: Record<string, boolean>;
    drafts: Record<string, string>;

    // Actions
    setActiveConversation: (id: string | null) => void;
    setSearchQuery: (query: string) => void;
    markAsRead: (conversationId: string) => void;
    /** Creates a local pending thread (prefixed `pending-`) for a visitor and sets it as active */
    addPendingThread: (contact: ChatContact) => string;
    addPendingMessage: (threadId: string, message: ChatMessage) => void;
    removePendingThread: (threadId: string) => void;
    linkPendingThread: (pendingId: string, realId: string) => void;
    setTyping: (threadId: string, isTyping: boolean) => void;
    setDraft: (threadId: string, text: string) => void;
    clearDraft: (threadId: string) => void;
    reset: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useChatStore = create<ChatState>()(
    (set, get) => ({
        activeConversationId: null,
        searchQuery: '',
        pendingThreads: [],
        pendingMessages: {},
        typingByThread: {},
        drafts: {},

        setActiveConversation: (id) => {
            set({ activeConversationId: id });
        },

        setSearchQuery: (query) => set({ searchQuery: query }),

        markAsRead: (_conversationId) => {
            // Implementation handled by TanStack Query invalidation in hooks
        },

        addPendingThread: (contact) => {
            const existing = get().pendingThreads.find(thread => thread.contact.id === contact.id);
            if (existing) {
                set({ activeConversationId: existing.id });
                return existing.id;
            }

            const now = new Date().toISOString();
            const threadId = `pending-${contact.id}`;
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
                pendingThreads: [newThread, ...state.pendingThreads],
                activeConversationId: threadId,
            }));
            return threadId;
        },

        addPendingMessage: (threadId, message) => {
            set(state => {
                const prevMessages = state.pendingMessages[threadId] || [];
                const updatedMessages = [...prevMessages, message];
                const updatedThreads = state.pendingThreads.map(thread => {
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
                    pendingMessages: { ...state.pendingMessages, [threadId]: updatedMessages },
                    pendingThreads: updatedThreads,
                };
            });
        },

        removePendingThread: (threadId) => {
            set(state => {
                const { [threadId]: _, ...restMessages } = state.pendingMessages;
                return {
                    pendingThreads: state.pendingThreads.filter(t => t.id !== threadId),
                    pendingMessages: restMessages,
                };
            });
        },

        linkPendingThread: (pendingId, realId) => {
            set(state => ({
                pendingThreads: state.pendingThreads.map(t =>
                    t.id === pendingId ? { ...t, linkedThreadId: realId } : t
                ),
            }));
        },

        setTyping: (threadId, isTyping) => {
            set(state => ({
                typingByThread: {
                    ...state.typingByThread,
                    [threadId]: isTyping,
                },
            }));
        },

        setDraft: (threadId, text) => {
            set(state => ({
                drafts: {
                    ...state.drafts,
                    [threadId]: text,
                },
            }));
        },

        clearDraft: (threadId) => {
            set(state => {
                const newDrafts = { ...state.drafts };
                delete newDrafts[threadId];
                return { drafts: newDrafts };
            });
        },

        reset: () => {
            set({
                activeConversationId: null,
                searchQuery: '',
                pendingThreads: [],
                pendingMessages: {},
                typingByThread: {},
                drafts: {},
            });
        },
    })
);
