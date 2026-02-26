export type Channel = 'WHATSAPP' | 'SMS' | 'EMAIL';
export type AudienceType = 'ALL' | 'GROUP' | 'TAGGED' | 'RECENT' | 'ALL_CUSTOMERS';

export interface SendMessageRequest {
    channel: Channel;
    audienceType?: AudienceType;
    templateId?: string;
    content?: string;
    contactIds?: string[];
    branchId?: string;
}

export interface Template {
    id: string;
    name: string;
    channel: string;
    content: string;
    status?: 'pending' | 'approved' | 'rejected';
    createdAt?: string;
}

export interface CreateTemplateRequest {
    name: string;
    channel: Channel;
    content: string;
}

export interface Campaign {
    id: string;
    name: string;
    channel: string;
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
}

export interface ChannelStat {
    totalSent: number;
    deliveryRate: number;
    growth: number;
}

export interface InboxThread {
    id: string;
    contactName: string;
    contactPhone?: string;
    contactEmail?: string;
    lastMessage: string;
    channel: string;
    unread: number;
    updatedAt: string;
}

export interface ThreadMessage {
    id: string;
    threadId: string;
    content: string;
    direction: 'INBOUND' | 'OUTBOUND';
    createdAt: string;
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
