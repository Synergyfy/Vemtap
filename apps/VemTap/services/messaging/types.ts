export type Channel = 'WHATSAPP' | 'SMS' | 'EMAIL' | 'IN_HOUSE';
export type AudienceType = 'ALL' | 'GROUP' | 'TAGGED' | 'RECENT';

export enum MessageDirection {
    INBOUND = 'INBOUND',   // From Customer to Business
    OUTBOUND = 'OUTBOUND', // From Business to Customer
}

export enum MessageStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    DELIVERED = 'DELIVERED',
    READ = 'READ',
    FAILED = 'FAILED',
}

export enum ThreadStatus {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED',
    RESOLVED = 'RESOLVED',
}

export interface ConversationThread {
    id: string;
    branchId: string;
    businessId: string;
    customerId: string;
    channel: Channel;
    status: ThreadStatus;
    lastActivityAt: string | Date;
    lastMessageContent: string;
    branchUnreadCount: number;
    customerUnreadCount: number;
    createdAt: string | Date;
    updatedAt: string | Date;
}

export interface Message {
    id: string;
    threadId: string;
    branchId: string;
    customerId: string;
    content: string;
    channel: Channel;
    direction: MessageDirection;
    status: MessageStatus;
    from: string; // Phone, Email, or Name
    to: string;
    replyToId?: string;
    replyTo?: Message; // Populated if quoting
    timestamp: string | Date;
}

export interface SendMessageRequest {
    channel: Channel;
    audienceType?: AudienceType;
    templateId?: string;
    content?: string;
    contactIds?: string[];
    branchId?: string;
}

// Keep legacy interfaces for compatibility
export interface InboxThread {
    id: string;
    contactName: string;
    contactPhone?: string;
    contactEmail?: string;
    lastMessage: string;
    channel: Channel | string;
    unread: number;
    updatedAt: string | Date;
}

export interface ThreadMessage {
    id: string;
    threadId: string;
    content: string;
    direction: MessageDirection | 'INBOUND' | 'OUTBOUND';
    createdAt: string | Date;
    replyTo?: Message;
}

export interface Template {
    id: string;
    name: string;
    channel: Channel | string;
    content: string;
    status?: 'pending' | 'approved' | 'rejected';
    isSystem?: boolean;
    businessId?: string | null;
    category?: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    language?: string;
    createdAt?: string;
}

export interface CreateTemplateRequest {
    name: string;
    channel: Channel;
    content: string;
    category?: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    language?: string;
    isSystem?: boolean;
}

export interface Campaign {
    id: string;
    name: string;
    channel: Channel | string;
    audienceSize: number;
    status: 'Completed' | 'Scheduled' | 'Draft' | 'Running';
    sentAt?: string;
    createdAt?: string;
    timestamp?: number;
}

export interface MessagingAnalytics {
    sent: number;
    delivered: number;
    failed: number;
    openRate?: number;
    deliveryRate?: number;
    revenue?: number;
    channelStats?: {
        whatsapp?: ChannelStat;
        sms?: ChannelStat;
        email?: ChannelStat;
    };
    globalStats?: {
        totalSent: number;
        totalDelivered: number;
        openRate: number;
        clickRate: number;
    };
    trafficTrend?: any[];
}

export interface ChannelStat {
    totalSent: number;
    deliveryRate: number;
    growth: number;
}

// ─── Automations ─────────────────────────────────────────────────────────────

export enum TriggerType {
    FIRST_TAG = 'first_tag',
    REPEAT_TAG = 'repeat_tag',
    REWARD_EARNED = 'reward_earned',
    SURVEY_COMPLETED = 'survey_completed',
    INACTIVE_CUSTOMER = 'inactive_customer',
}

export enum ActionType {
    SEND_SMS = 'send_sms',
    SEND_WHATSAPP = 'send_whatsapp',
    SEND_EMAIL = 'send_email',
    PUSH_REVIEW = 'push_review',
}

export interface AutomationRule {
    id: string;
    businessId: string;
    branchId?: string;
    name: string;
    triggerType: TriggerType;
    delaySeconds?: number;
    actionType: ActionType;
    actionConfig?: Record<string, any>;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateAutomationRequest {
    businessId: string;
    branchId?: string;
    name: string;
    triggerType: TriggerType;
    delaySeconds?: number;
    actionType: ActionType;
    actionConfig?: Record<string, any>;
    isActive?: boolean;
}

export interface UpdateAutomationRequest {
    name?: string;
    triggerType?: TriggerType;
    delaySeconds?: number;
    actionType?: ActionType;
    actionConfig?: Record<string, any>;
    isActive?: boolean;
}

export interface AutomationLog {
    id: string;
    sessionId: string;
    businessId: string;
    branchId?: string;
    automationId: string;
    automationName: string;
    visitorId: string;
    visitorName: string;
    visitorPhone?: string;
    status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'DELAYED';
    currentStep?: string;
    lastMessage?: string;
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AutomationPerformance {
    totalMessagesSent: number;
    totalReplies: number;
    replyRate: number;
    loyaltyPointsIssued: number;
    topAutomations: Array<{
        id: string;
        name: string;
        replies: number;
        replyRate: number;
    }>;
    dailyStats: Array<{
        date: string;
        sent: number;
        replies: number;
    }>;
}
