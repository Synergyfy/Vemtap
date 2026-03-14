'use client';

import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatContact {
    id: string;
    name: string;
    avatar?: string; // URL or undefined (uses initials)
    phone?: string;
    email?: string;
    isOnline: boolean;
    lastSeen?: number;
}

export type ChatMessageType = 'text' | 'image' | 'file';
export type ChatMessageStatus = 'sent' | 'delivered' | 'read';

export interface ChatMessage {
    id: string;
    conversationId: string;
    direction: 'inbound' | 'outbound';
    type: ChatMessageType;
    content: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
    timestamp: number;
    status: ChatMessageStatus;
}

export interface ChatConversation {
    id: string;
    contact: ChatContact;
    lastMessage: string;
    lastMessageTime: number;
    unreadCount: number;
    isTyping: boolean;
}

export interface AutomatedReplyConfig {
    welcomeEnabled: boolean;
    welcomeMessage: string;
    offHoursEnabled: boolean;
    offHoursMessage: string;
    offHoursSchedule: string;
    faqEnabled: boolean;
    faqKeywords: Array<{ keywords: string[]; response: string; enabled: boolean }>;
}

export interface ChatTemplate {
    id: string;
    name: string;
    content: string;
    category: string;
    placeholders: string[];
    enabled: boolean;
    lastEditedAt: number;
    openRate?: number;
}

interface ChatState {
    conversations: ChatConversation[];
    messages: Record<string, ChatMessage[]>; // keyed by conversationId
    activeConversationId: string | null;
    searchQuery: string;
    automatedReplies: AutomatedReplyConfig;
    templates: ChatTemplate[];

    // Actions
    setActiveConversation: (id: string) => void;
    setSearchQuery: (query: string) => void;
    sendMessage: (conversationId: string, content: string, type?: ChatMessageType, direction?: 'inbound' | 'outbound') => void;
    markAsRead: (conversationId: string) => void;
    setTyping: (conversationId: string, isTyping: boolean) => void;
    updateAutomatedReplies: (updates: Partial<AutomatedReplyConfig>) => void;
    updateTemplate: (id: string, updates: Partial<ChatTemplate>) => void;
    addTemplate: (template: ChatTemplate) => void;
    deleteTemplate: (id: string) => void;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const now = Date.now();
const min = 60_000;
const hour = 3_600_000;

const mockContacts: ChatContact[] = [
    { id: 'c1', name: 'Alex Johnson', isOnline: true, phone: '+234 801 234 5678' },
    { id: 'c2', name: 'Sarah Miller', isOnline: false, lastSeen: now - 2 * hour, phone: '+234 809 876 5432' },
    { id: 'c3', name: 'David Kim', isOnline: true, email: 'david.kim@email.com' },
    { id: 'c4', name: 'Riley Thompson', isOnline: false, lastSeen: now - 24 * hour, phone: '+234 803 111 2222' },
    { id: 'c5', name: 'Jordan Smith', isOnline: true, email: 'jordan.smith@company.co' },
];

const mockConversations: ChatConversation[] = [
    { id: 'conv1', contact: mockContacts[0], lastMessage: 'Sounds good! I\'ll check the assets now...', lastMessageTime: now - 2 * min, unreadCount: 0, isTyping: false },
    { id: 'conv2', contact: mockContacts[1], lastMessage: 'Can we reschedule our demo call?', lastMessageTime: now - 3 * hour, unreadCount: 1, isTyping: false },
    { id: 'conv3', contact: mockContacts[2], lastMessage: 'Sent a photo', lastMessageTime: now - 24 * hour, unreadCount: 0, isTyping: false },
    { id: 'conv4', contact: mockContacts[3], lastMessage: 'Thank you for the quick support!', lastMessageTime: now - 26 * hour, unreadCount: 0, isTyping: false },
    { id: 'conv5', contact: mockContacts[4], lastMessage: 'Inquiry about refund policy', lastMessageTime: now - 48 * hour, unreadCount: 2, isTyping: false },
];

const mockMessages: Record<string, ChatMessage[]> = {
    conv1: [
        { id: 'm1', conversationId: 'conv1', direction: 'inbound', type: 'text', content: 'Hi there! I had a quick question about the new campaign assets we discussed yesterday.', timestamp: now - 12 * min, status: 'read' },
        { id: 'm2', conversationId: 'conv1', direction: 'outbound', type: 'text', content: 'Of course, Alex! I\'ve uploaded the final versions to your dashboard. Are you able to see them?', timestamp: now - 10 * min, status: 'read' },
        { id: 'm3', conversationId: 'conv1', direction: 'inbound', type: 'image', content: 'Is this the correct layout for the mobile banners?', fileUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop', timestamp: now - 4 * min, status: 'read' },
        { id: 'm4', conversationId: 'conv1', direction: 'outbound', type: 'text', content: 'Yes, that\'s exactly right. The typography works much better in this version.', timestamp: now - 2 * min, status: 'read' },
        { id: 'm5', conversationId: 'conv1', direction: 'inbound', type: 'text', content: 'Sounds good! I\'ll check the assets now...', timestamp: now - 1 * min, status: 'read' },
    ],
    conv2: [
        { id: 'm6', conversationId: 'conv2', direction: 'inbound', type: 'text', content: 'Hi, I wanted to check on the meeting schedule for next week.', timestamp: now - 4 * hour, status: 'read' },
        { id: 'm7', conversationId: 'conv2', direction: 'outbound', type: 'text', content: 'Sure, let me check the calendar and get back to you shortly.', timestamp: now - 3.5 * hour, status: 'delivered' },
        { id: 'm8', conversationId: 'conv2', direction: 'inbound', type: 'text', content: 'Can we reschedule our demo call?', timestamp: now - 3 * hour, status: 'delivered' },
    ],
    conv3: [
        { id: 'm9', conversationId: 'conv3', direction: 'inbound', type: 'text', content: 'Hi, I\'m having some trouble with my recent order invoice. Could you help me out?', timestamp: now - 25 * hour, status: 'read' },
        { id: 'm10', conversationId: 'conv3', direction: 'outbound', type: 'text', content: 'Hello David! Of course. I\'d be happy to check that for you. Could you please send over the invoice number?', timestamp: now - 25 * hour + 5 * min, status: 'read' },
        { id: 'm11', conversationId: 'conv3', direction: 'inbound', type: 'file', content: 'Here is the document.', fileName: 'Invoice_VMP_2024.pdf', fileSize: '245 KB', timestamp: now - 24.5 * hour, status: 'read' },
        { id: 'm12', conversationId: 'conv3', direction: 'outbound', type: 'image', content: 'Got it. I\'m looking at our records now. This screenshot shows the payment status on our end.', fileUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop', timestamp: now - 24 * hour, status: 'read' },
    ],
    conv4: [
        { id: 'm13', conversationId: 'conv4', direction: 'inbound', type: 'text', content: 'I need help setting up my loyalty card.', timestamp: now - 27 * hour, status: 'read' },
        { id: 'm14', conversationId: 'conv4', direction: 'outbound', type: 'text', content: 'I\'d be happy to help! Let me walk you through the process step by step.', timestamp: now - 26.5 * hour, status: 'read' },
        { id: 'm15', conversationId: 'conv4', direction: 'inbound', type: 'text', content: 'Thank you for the quick support!', timestamp: now - 26 * hour, status: 'read' },
    ],
    conv5: [
        { id: 'm16', conversationId: 'conv5', direction: 'inbound', type: 'text', content: 'What is your refund policy for digital services?', timestamp: now - 49 * hour, status: 'read' },
        { id: 'm17', conversationId: 'conv5', direction: 'outbound', type: 'text', content: 'Our refund policy covers all digital services within 14 days of purchase. Would you like more details?', timestamp: now - 48.5 * hour, status: 'delivered' },
        { id: 'm18', conversationId: 'conv5', direction: 'inbound', type: 'text', content: 'Inquiry about refund policy', timestamp: now - 48 * hour, status: 'delivered' },
    ],
};

const mockAutomatedReplies: AutomatedReplyConfig = {
    welcomeEnabled: true,
    welcomeMessage: 'Hi there! Thanks for reaching out to us. Our team usually responds within 10 minutes. How can we help you today?',
    offHoursEnabled: true,
    offHoursMessage: 'Thanks for your message! We\'re currently offline. Our business hours are Mon-Fri, 9am-6pm. We\'ll get back to you first thing in the morning!',
    offHoursSchedule: 'Outside Business Hours',
    faqEnabled: true,
    faqKeywords: [
        { keywords: ['pricing', 'cost', 'plans'], response: 'Our plans start at $29/mo. You can find our full pricing list here: vem-tap.com/pricing', enabled: true },
        { keywords: ['shipping'], response: 'We offer free shipping on orders over $50!', enabled: false },
    ],
};

const mockTemplates: ChatTemplate[] = [
    { id: 'tmpl1', name: 'Order Confirmation', content: 'Hi {{Customer Name}}, your order #{{Order ID}} has been received and is being prepared! Total: {{Order Total}}. Est. delivery: {{Delivery Date}}.', category: 'Transactional', placeholders: ['Customer Name', 'Order ID', 'Order Total', 'Delivery Date'], enabled: true, lastEditedAt: now - 2 * hour, openRate: 98 },
    { id: 'tmpl2', name: 'Order Shipped', content: 'Great news {{Customer Name}}! Your package is on its way to your address. Track it here: {{Tracking URL}}', category: 'Shipping', placeholders: ['Customer Name', 'Tracking URL'], enabled: true, lastEditedAt: now - 24 * hour },
    { id: 'tmpl3', name: 'Ticket Resolution', content: 'We have marked your ticket #{{Ticket ID}} as resolved. If you need further assistance, please reply to this message.', category: 'Support', placeholders: ['Ticket ID'], enabled: true, lastEditedAt: now - 72 * hour },
    { id: 'tmpl4', name: 'Thank You Message', content: 'Thanks for reaching out {{Customer Name}}. How else can we help?', category: 'General', placeholders: ['Customer Name'], enabled: true, lastEditedAt: now - 5 * 24 * hour },
    { id: 'tmpl5', name: 'Appointment Reminder', content: 'Reminder: Your appointment on {{Date}} is scheduled for {{Time}}. See you there!', category: 'Booking', placeholders: ['Date', 'Time'], enabled: true, lastEditedAt: now - 7 * 24 * hour },
];

// ─── Auto-reply messages (customer simulation) ──────────────────────────────

const autoReplyMessages = [
    'Thanks for the update! That makes sense.',
    'Great, I appreciate the quick response.',
    'Could you elaborate on that a bit?',
    'Sounds good! I\'ll follow up if I have more questions.',
    'Perfect, that\'s exactly what I needed.',
    'Got it, thank you so much for your help!',
    'Awesome, I\'ll give it a try now.',
];

// ─── Store ───────────────────────────────────────────────────────────────────

let messageCounter = 100;

export const useChatStore = create<ChatState>()((set, get) => ({
    conversations: mockConversations,
    messages: mockMessages,
    activeConversationId: 'conv1',
    searchQuery: '',
    automatedReplies: mockAutomatedReplies,
    templates: mockTemplates,

    setActiveConversation: (id) => {
        set({ activeConversationId: id });
        // Mark as read
        get().markAsRead(id);
    },

    setSearchQuery: (query) => set({ searchQuery: query }),

    sendMessage: (conversationId, content, type = 'text', direction = 'outbound') => {
        const msgId = `msg_${++messageCounter}`;
        const newMsg: ChatMessage = {
            id: msgId,
            conversationId,
            direction,
            type,
            content,
            timestamp: Date.now(),
            status: 'sent',
        };

        set((state) => {
            const convMsgs = [...(state.messages[conversationId] || []), newMsg];
            const updatedConvs = state.conversations.map((c) =>
                c.id === conversationId
                    ? { ...c, lastMessage: content, lastMessageTime: Date.now() }
                    : c
            );

            return {
                messages: { ...state.messages, [conversationId]: convMsgs },
                conversations: updatedConvs,
            };
        });

        // Only simulate delivery, read receipts, and auto-replies if the message was sent by the business (outbound)
        if (direction === 'outbound') {
            // Simulate delivery status
            setTimeout(() => {
                set((state) => ({
                    messages: {
                        ...state.messages,
                        [conversationId]: (state.messages[conversationId] || []).map((m) =>
                            m.id === msgId ? { ...m, status: 'delivered' as const } : m
                        ),
                    },
                }));
            }, 800);

            // Simulate read receipt
            setTimeout(() => {
                set((state) => ({
                    messages: {
                        ...state.messages,
                        [conversationId]: (state.messages[conversationId] || []).map((m) =>
                            m.id === msgId ? { ...m, status: 'read' as const } : m
                        ),
                    },
                }));
            }, 1500);

            // Simulate typing indicator then auto-reply
            setTimeout(() => {
                get().setTyping(conversationId, true);
            }, 2000);

            setTimeout(() => {
                get().setTyping(conversationId, false);
                const replyContent = autoReplyMessages[Math.floor(Math.random() * autoReplyMessages.length)];
                const replyId = `msg_${++messageCounter}`;
                const reply: ChatMessage = {
                    id: replyId,
                    conversationId,
                    direction: 'inbound',
                    type: 'text',
                    content: replyContent,
                    timestamp: Date.now(),
                    status: 'read',
                };

                set((state) => {
                    const convMsgs = [...(state.messages[conversationId] || []), reply];
                    const updatedConvs = state.conversations.map((c) =>
                        c.id === conversationId
                            ? {
                                ...c,
                                lastMessage: replyContent,
                                lastMessageTime: Date.now(),
                                unreadCount: state.activeConversationId === conversationId ? 0 : c.unreadCount + 1,
                            }
                            : c
                    );
                    return {
                        messages: { ...state.messages, [conversationId]: convMsgs },
                        conversations: updatedConvs,
                    };
                });
            }, 3500);
        }
    },

    markAsRead: (conversationId) => {
        set((state) => ({
            conversations: state.conversations.map((c) =>
                c.id === conversationId ? { ...c, unreadCount: 0 } : c
            ),
        }));
    },

    setTyping: (conversationId, isTyping) => {
        set((state) => ({
            conversations: state.conversations.map((c) =>
                c.id === conversationId ? { ...c, isTyping } : c
            ),
        }));
    },

    updateAutomatedReplies: (updates) => {
        set((state) => ({
            automatedReplies: { ...state.automatedReplies, ...updates },
        }));
    },

    updateTemplate: (id, updates) => {
        set((state) => ({
            templates: state.templates.map((t) =>
                t.id === id ? { ...t, ...updates, lastEditedAt: Date.now() } : t
            ),
        }));
    },

    addTemplate: (template) => {
        set((state) => ({ templates: [...state.templates, template] }));
    },

    deleteTemplate: (id) => {
        set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }));
    },
}));
