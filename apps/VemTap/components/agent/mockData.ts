'use client';

export type ChatMessage = {
    sender: 'user' | 'agent' | 'bot';
    text: string;
    time: string;
};

export type ActivityItem = {
    action: string;
    by: string;
    time: string;
};

export type AssignedChat = {
    id: string;
    user: { name: string; email: string; business: string };
    channel: string;
    status: string;
    priority: string;
    updatedAt: string;
    subject: string;
    messages: ChatMessage[];
    activity: ActivityItem[];
};

export type SupportTicket = {
    id: string;
    title: string;
    requester: string;
    business: string;
    channel: string;
    status: string;
    updatedAt: string;
    messages: ChatMessage[];
    activity: ActivityItem[];
};

export const assignedChats: AssignedChat[] = [
    {
        id: 'conv-2001',
        user: { name: 'Samuel O.', email: 'samuel@crestline.com', business: 'Crestline Foods' },
        channel: 'Chatbot',
        status: 'In Progress',
        priority: 'High',
        updatedAt: '2 min ago',
        subject: 'SMS credits not reflecting',
        messages: [
            { sender: 'user', text: 'My SMS credits did not update after top-up.', time: '2 min ago' },
            { sender: 'bot', text: 'I can connect you to an agent. Please confirm.', time: '2 min ago' },
        ],
        activity: [
            { action: 'Assigned', by: 'Admin', time: '5 min ago' },
        ],
    },
    {
        id: 'conv-2002',
        user: { name: 'Chioma A.', email: 'chioma@tapi.io', business: 'Tapi Retail' },
        channel: 'Chatbot',
        status: 'Pending',
        priority: 'Normal',
        updatedAt: '12 min ago',
        subject: 'Need help setting WhatsApp integration',
        messages: [
            { sender: 'user', text: 'How do I connect WhatsApp for my business?', time: '12 min ago' },
        ],
        activity: [
            { action: 'Assigned', by: 'Admin', time: '15 min ago' },
        ],
    },
];

export const supportTickets: SupportTicket[] = [
    {
        id: 'TCK-3101',
        title: 'Business account locked',
        requester: 'Mariam K.',
        business: 'Kora Events',
        channel: 'Customer',
        status: 'Pending',
        updatedAt: '5 min ago',
        messages: [
            { sender: 'user', text: 'My business account is locked after password reset.', time: '6 min ago' },
        ],
        activity: [
            { action: 'Ticket created', by: 'Customer', time: '7 min ago' },
        ],
    },
    {
        id: 'TCK-3102',
        title: 'Device sync failure',
        requester: 'Ibrahim M.',
        business: 'BrightPay',
        channel: 'Business',
        status: 'In Progress',
        updatedAt: '18 min ago',
        messages: [
            { sender: 'user', text: 'Our NFC device is not syncing visits.', time: '20 min ago' },
            { sender: 'agent', text: 'Checking device logs now.', time: '18 min ago' },
        ],
        activity: [
            { action: 'Assigned to Agent', by: 'Admin', time: '22 min ago' },
            { action: 'Reply sent', by: 'Agent', time: '18 min ago' },
        ],
    },
];

export const statusOptions = ['Pending', 'In Progress', 'Resolved', 'Cancelled'] as const;
