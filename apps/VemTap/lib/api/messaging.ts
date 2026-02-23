import { useMessagingStore, Message, Thread, Template, MessageChannel } from '@/lib/store/useMessagingStore';

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const messagingApi = {
    // Analytics & Stats
    fetchOverviewStats: async () => {
        await delay(600);
        return useMessagingStore.getState().stats;
    },

    // Threads / Inbox
    fetchThreads: async (channel: MessageChannel) => {
        await delay(500);
        const allThreads = useMessagingStore.getState().threads;
        return allThreads.filter(t => t.channel === channel);
    },

    fetchThreadMessages: async (threadId: string) => {
        await delay(300);
        return useMessagingStore.getState().messages.filter(m => m.threadId === threadId);
    },

    sendMessage: async (threadId: string, content: string, channel: MessageChannel) => {
        await delay(400);

        // 1. Check Credits
        const store = useMessagingStore.getState();
        const cost = channel === 'SMS' ? 2.5 : channel === 'WhatsApp' ? 4.0 : 0.5;

        if (store.wallets[channel].credits < cost) {
            throw new Error('Insufficient credits');
        }

        // 2. Deduct Credits
        store.deductCredits(channel, cost);

        // 3. Create Message
        const thread = store.threads.find(t => t.id === threadId);
        const branchId = thread?.branchId || 'head-office';

        const newMessage: Message = {
            id: `msg_${Date.now()}`,
            threadId,
            direction: 'outbound',
            content,
            status: 'sent',
            timestamp: Date.now(),
            channel,
            branchId
        };

        store.addMessage(newMessage);

        // 4. Update Thread
        store.updateThread(threadId, {
            lastMessage: content,
            lastMessageTime: Date.now(),
            unreadCount: 0
        });

        // 5. Mock Auto-Reply after 3 seconds
        setTimeout(() => {
            const reply: Message = {
                id: `msg_reply_${Date.now()}`,
                threadId,
                direction: 'inbound',
                content: "Thanks for reaching out! We'll get back to you shortly.",
                status: 'delivered',
                timestamp: Date.now(),
                channel,
                branchId
            };
            store.addMessage(reply);
            store.updateThread(threadId, {
                lastMessage: reply.content,
                lastMessageTime: Date.now(),
                unreadCount: 1
            });
        }, 3000);

        return newMessage;
    },

    // Templates
    fetchTemplates: async () => {
        await delay(400);
        return useMessagingStore.getState().templates;
    },

    createTemplate: async (template: Omit<Template, 'id' | 'status'>) => {
        await delay(500);
        const newTemplate: Template = {
            ...template,
            id: `tpl_${Date.now()}`,
            status: 'approved'
        };
        useMessagingStore.getState().addTemplate(newTemplate);
        return newTemplate;
    },

    // Broadcasts (Internal logic)
    sendBroadcast: async (name: string, channel: MessageChannel, audienceSize: number, content: string) => {
        await delay(1500);
        const store = useMessagingStore.getState();
        const costPerMsg = channel === 'SMS' ? 2.5 : channel === 'WhatsApp' ? 4.0 : 0.5;
        const totalCost = costPerMsg * audienceSize;

        if (store.wallets[channel].credits < totalCost) {
            throw new Error(`Insufficient credits. Need ${totalCost}, have ${store.wallets[channel].credits}`);
        }

        store.deductCredits(channel, totalCost);

        // Log the Broadcast internally
        const broadcastId = `brd_${Date.now()}`;
        store.addBroadcast({
            id: broadcastId,
            branchId: 'head-office',
            name,
            channel,
            audienceSize,
            sent: audienceSize,
            delivered: Math.floor(audienceSize * 0.95),
            status: 'Completed',
            timestamp: Date.now()
        });

        return broadcastId;
    }
};
