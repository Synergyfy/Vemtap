import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type MessageChannel = 'SMS' | 'WhatsApp' | 'Email';
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageDirection = 'inbound' | 'outbound';

export interface Wallet {
    credits: number;
    currency: 'POINTS'; // Changed currency type to literal 'POINTS'
    autoRecharge: boolean;
}

export interface Message {
    id: string;
    threadId: string;
    direction: MessageDirection;
    content: string;
    status: MessageStatus;
    timestamp: number;
    channel: MessageChannel;
    attachments?: string[];
    branchId: string;
}

export interface Thread {
    id: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    channel: MessageChannel;
    lastMessage: string;
    lastMessageTime: number;
    unreadCount: number;
    status: 'open' | 'resolved' | 'archived';
    tags: string[];
    branchId: string;
}

export interface Template {
    id: string;
    name: string;
    content: string; // Supports {Name} variables
    channel: MessageChannel | 'Any';
    status: 'approved' | 'pending' | 'rejected';
    branchId?: string; // Optional for global/system templates
}

export interface BroadcastLog {
    id: string;
    branchId: string;
    name: string;
    channel: MessageChannel;
    audienceSize: number;
    sent: number;
    delivered: number;
    status: 'Draft' | 'Scheduled' | 'Sending' | 'Completed';
    timestamp: number;
}

interface MessagingState {
    wallets: Record<MessageChannel, Wallet>;
    threads: Thread[];
    messages: Message[];
    templates: Template[];
    broadcasts: BroadcastLog[]; // Internal logging for broadcasts
    stats: Record<MessageChannel | 'Global', {
        totalSent: number;
        deliveryRate: number;
        growth: number;
    }>;

    // Actions
    deductCredits: (channel: MessageChannel, amount: number) => void;
    addRecharge: (channel: MessageChannel, amount: number) => void;
    
    addMessage: (message: Message) => void;
    updateMessageStatus: (id: string, status: MessageStatus) => void;
    
    addThread: (thread: Thread) => void;
    updateThread: (id: string, updates: Partial<Thread>) => void;
    
    addTemplate: (template: Template) => void;
    updateTemplate: (id: string, updates: Partial<Template>) => void;
    deleteTemplate: (id: string) => void;
    
    addBroadcast: (broadcast: BroadcastLog) => void;
    
    reset: () => void;
}

// Initial Mock Data
const initialThreads: Thread[] = [
    {
        id: 't1',
        customerName: 'Alice Freeman',
        customerPhone: '+234 801 111 2222',
        channel: 'WhatsApp',
        lastMessage: 'Is the venue open today?',
        lastMessageTime: Date.now() - 1000 * 60 * 5,
        unreadCount: 1,
        status: 'open',
        tags: ['inquiry'],
        branchId: 'head-office'
    },
    {
        id: 't2',
        customerName: 'Bob Smith',
        channel: 'SMS',
        customerPhone: '+234 809 999 8888',
        lastMessage: 'CONFIRM',
        lastMessageTime: Date.now() - 1000 * 60 * 60 * 2,
        unreadCount: 0,
        status: 'resolved',
        tags: ['rsvp'],
        branchId: 'ikeja-branch'
    },
    {
        id: 't3',
        customerName: 'Carol Danvers',
        channel: 'Email',
        customerEmail: 'carol@marvel.com',
        lastMessage: 'Thank you for the update.',
        lastMessageTime: Date.now() - 1000 * 60 * 60 * 24,
        unreadCount: 0,
        status: 'open',
        tags: ['vip'],
        branchId: 'abuja-branch'
    }
];

const initialMessages: Message[] = [
    { id: 'm1', threadId: 't1', direction: 'inbound', content: 'Hi, I wanted to ask about your opening hours.', status: 'read', timestamp: Date.now() - 1000 * 60 * 10, channel: 'WhatsApp', branchId: 'head-office' },
    { id: 'm2', threadId: 't1', direction: 'inbound', content: 'Is the venue open today?', status: 'read', timestamp: Date.now() - 1000 * 60 * 5, channel: 'WhatsApp', branchId: 'head-office' },
    { id: 'm3', threadId: 't2', direction: 'outbound', content: 'Please reply CONFIRM to secure your reservation.', status: 'delivered', timestamp: Date.now() - 1000 * 60 * 60 * 2.5, channel: 'SMS', branchId: 'ikeja-branch' },
    { id: 'm4', threadId: 't2', direction: 'inbound', content: 'CONFIRM', status: 'read', timestamp: Date.now() - 1000 * 60 * 60 * 2, channel: 'SMS', branchId: 'ikeja-branch' },
    { id: 'm5', threadId: 't3', direction: 'outbound', content: 'Your VIP pass is ready.', status: 'sent', timestamp: Date.now() - 1000 * 60 * 60 * 25, channel: 'Email', branchId: 'abuja-branch' },
    { id: 'm6', threadId: 't3', direction: 'inbound', content: 'Thank you for the update.', status: 'read', timestamp: Date.now() - 1000 * 60 * 60 * 24, channel: 'Email', branchId: 'abuja-branch' }
];

const initialTemplates: Template[] = [
    { id: 'tpl1', name: 'Welcome Message', content: 'Hi {Name}, welcome to VemTap! expecting you soon.', channel: 'SMS', status: 'approved', branchId: 'bistro_001' },
    { id: 'tpl2', name: 'Reservation Conf', content: 'Hello {Name}, your table is confirmed.', channel: 'WhatsApp', status: 'approved', branchId: 'bistro_001' },
    { id: 'tpl3', name: 'Weekly Newsletter', content: 'Check out our weekly updates...', channel: 'Email', status: 'approved', branchId: 'head-office' },
    { id: 'tpl4', name: 'Feedback Request', content: 'Hi {Name}, how was your experience with us today? We value your feedback.', channel: 'Email', status: 'approved', branchId: 'ikeja-branch' },
    { id: 'tpl5', name: 'Re-engagement', content: 'We haven\'t seen you in a while, {Name}! Here is a special 20% discount for your next visit.', channel: 'Email', status: 'approved', branchId: 'abuja-branch' }
];

export const useMessagingStore = create<MessagingState>()(
    persist(
        (set) => ({
            wallets: {
                WhatsApp: { credits: 2500, currency: 'POINTS', autoRecharge: false },
                SMS: { credits: 500, currency: 'POINTS', autoRecharge: false },
                Email: { credits: 12000, currency: 'POINTS', autoRecharge: false },
            },
            threads: initialThreads,
            messages: initialMessages,
            templates: initialTemplates,
            broadcasts: [],
            stats: {
                Global: { totalSent: 15420, deliveryRate: 98.2, growth: 12.5 },
                WhatsApp: { totalSent: 8500, deliveryRate: 99.1, growth: 18.2 },
                SMS: { totalSent: 3420, deliveryRate: 94.5, growth: -2.1 },
                Email: { totalSent: 3500, deliveryRate: 97.8, growth: 5.4 },
            },

            deductCredits: (channel, amount) => set((state) => ({
                wallets: {
                    ...state.wallets,
                    [channel]: {
                        ...state.wallets[channel],
                        credits: Math.max(0, state.wallets[channel].credits - amount)
                    }
                }
            })),
            
            addRecharge: (channel, amount) => set((state) => ({
                wallets: {
                    ...state.wallets,
                    [channel]: {
                        ...state.wallets[channel],
                        credits: state.wallets[channel].credits + amount
                    }
                }
            })),

            addMessage: (message) => set((state) => ({
                messages: [...state.messages, message]
            })),

            updateMessageStatus: (id, status) => set((state) => ({
                messages: state.messages.map(m => m.id === id ? { ...m, status } : m)
            })),

            addThread: (thread) => set((state) => ({
                threads: [thread, ...state.threads]
            })),

            updateThread: (id, updates) => set((state) => ({
                threads: state.threads.map(t => t.id === id ? { ...t, ...updates } : t)
            })),

            addTemplate: (template) => set((state) => ({
                templates: [...state.templates, template]
            })),

            updateTemplate: (id, updates) => set((state) => ({
                templates: state.templates.map(t => t.id === id ? { ...t, ...updates } : t)
            })),

            deleteTemplate: (id) => set((state) => ({
                templates: state.templates.filter(t => t.id !== id)
            })),

            addBroadcast: (broadcast) => set((state) => ({
                broadcasts: [broadcast, ...state.broadcasts]
            })),

            reset: () => set({
                threads: initialThreads,
                messages: initialMessages,
                templates: initialTemplates,
                broadcasts: []
            })
        }),
        {
            name: 'messaging-storage',
            storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
                getItem: () => null,
                setItem: () => {},
                removeItem: () => {},
            })),
        }
    )
);
