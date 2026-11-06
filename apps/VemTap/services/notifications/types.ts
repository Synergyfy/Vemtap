export type TargetAudience = 'ALL' | 'BUSINESSES' | 'CUSTOMERS' | 'AGENTS';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'announcement' | 'promo';
    read: boolean;
    timestamp: string;
    actionUrl?: string;
}

export interface UnreadCountResponse {
    count: number;
}

export interface BroadcastNotification {
    id: string;
    senderId?: string | null;
    sender?: {
        id: string;
        firstName?: string;
        lastName?: string;
        email?: string;
    } | null;
    title: string;
    message: string;
    targetAudience: TargetAudience;
    type: string;
    actionUrl?: string | null;
    channels: string[];
    totalRecipients: number;
    pushRecipients: number;
    status: 'SENT' | 'FAILED' | 'PROCESSING';
    createdAt: string;
    updatedAt: string;
}

export interface BroadcastHistoryResponse {
    items: BroadcastNotification[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface SendBroadcastPayload {
    title: string;
    message: string;
    targetAudience: TargetAudience;
    type?: string;
    actionUrl?: string;
    sendPush?: boolean;
    sendInApp?: boolean;
}

export interface BroadcastQueryParams {
    page?: number;
    limit?: number;
    targetAudience?: TargetAudience | '';
    search?: string;
}

export interface SubscriptionReminderTemplate {
    id: string;
    stage: number;
    name: string;
    description?: string | null;
    titleTemplate: string;
    messageTemplate: string;
    type: string;
    actionUrl: string;
    isEnabled: boolean;
    sendPush: boolean;
    sendInApp: boolean;
    sendEmail: boolean;
    emailSubjectTemplate?: string | null;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ReminderPlaceholder {
    placeholder: string;
    description: string;
}

export interface CreateReminderTemplatePayload {
    stage: number;
    name: string;
    description?: string;
    titleTemplate: string;
    messageTemplate: string;
    type?: string;
    actionUrl?: string;
    isEnabled?: boolean;
    sendPush?: boolean;
    sendInApp?: boolean;
    sendEmail?: boolean;
    emailSubjectTemplate?: string;
}

export interface UpdateReminderTemplatePayload {
    name?: string;
    description?: string;
    titleTemplate?: string;
    messageTemplate?: string;
    type?: string;
    actionUrl?: string;
    isEnabled?: boolean;
    sendPush?: boolean;
    sendInApp?: boolean;
    sendEmail?: boolean;
    emailSubjectTemplate?: string;
}

export interface PreviewTemplatePayload {
    titleTemplate: string;
    messageTemplate: string;
    variables?: Record<string, any>;
}

export interface PreviewTemplateResponse {
    title: string;
    message: string;
    variablesUsed: Record<string, any>;
}
