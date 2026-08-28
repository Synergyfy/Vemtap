import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    Notification,
    UnreadCountResponse,
    BroadcastNotification,
    BroadcastHistoryResponse,
    SendBroadcastPayload,
    BroadcastQueryParams,
    SubscriptionReminderTemplate,
    ReminderPlaceholder,
    CreateReminderTemplatePayload,
    UpdateReminderTemplatePayload,
    PreviewTemplatePayload,
    PreviewTemplateResponse,
} from './types';

// ============================================================================
// General User Notifications
// ============================================================================

export const useNotifications = () => {
    return useQuery<Notification[], Error>({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await api.get('/notifications');
            const data = Array.isArray(res) ? res : res.data || [];
            return data.map((n: any) => ({
                id: n.id,
                title: n.title,
                message: n.message,
                type: n.type || 'info',
                read: n.read ?? n.isRead ?? false,
                timestamp: n.createdAt || n.timestamp || new Date().toISOString(),
                actionUrl: n.actionUrl,
            }));
        },
    });
};

export const useUnreadCount = () => {
    return useQuery<UnreadCountResponse, Error>({
        queryKey: ['notifications', 'unread-count'],
        queryFn: async () => {
            const res = await api.get('/notifications/unread-count');
            if (typeof res === 'number') return { count: res };
            return { count: parseInt(res?.count || res || 0, 10) };
        },
    });
};

export const useMarkAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: async (id) => {
            await api.patch(`/notifications/${id}/read`, {});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        },
    });
};

export const useMarkAllAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, void>({
        mutationFn: async () => {
            await api.post('/notifications/mark-all-read', {});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        },
    });
};

export const useRegisterPushToken = () => {
    return useMutation<void, Error, { token: string }>({
        mutationFn: async ({ token }) => {
            await api.post('/notifications/push-token', { token });
        },
    });
};

export const useClearPushToken = () => {
    return useMutation<void, Error, void>({
        mutationFn: async () => {
            await api.delete('/notifications/push-token');
        },
    });
};

export const useRegisterVisitorPushToken = () => {
    return useMutation<void, Error, { token: string }>({
        mutationFn: async ({ token }) => {
            await api.post('/notifications/visitor/push-token', { token });
        },
    });
};

export interface NotificationPreferences {
    push: boolean;
    email: boolean;
    sms: boolean;
    marketing: boolean;
    orderUpdates: boolean;
    loyalty: boolean;
    support: boolean;
    rewardAlerts: boolean;
    activityDigest: boolean;
    smsSecurity: boolean;
}

export const useNotificationPreferences = () => {
    return useQuery<NotificationPreferences, Error>({
        queryKey: ['notification-preferences'],
        queryFn: async () => {
            const res = await api.get('/notifications/preferences');
            return {
                push: true,
                email: true,
                sms: true,
                marketing: true,
                orderUpdates: true,
                loyalty: true,
                support: true,
                rewardAlerts: true,
                activityDigest: true,
                smsSecurity: false,
                ...(res || {}),
            };
        },
    });
};

export const useUpdateNotificationPreferences = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, Partial<NotificationPreferences>>({
        mutationFn: async (prefs) => {
            await api.patch('/notifications/preferences', prefs);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
        },
    });
};

// ============================================================================
// Admin Broadcast & Push Notifications
// ============================================================================

export const useAdminBroadcasts = (params: BroadcastQueryParams = {}) => {
    return useQuery<BroadcastHistoryResponse, Error>({
        queryKey: ['admin-broadcasts', params],
        queryFn: async () => {
            const q = new URLSearchParams();
            if (params.page) q.set('page', String(params.page));
            if (params.limit) q.set('limit', String(params.limit));
            if (params.targetAudience) q.set('targetAudience', params.targetAudience);
            if (params.search) q.set('search', params.search);
            const res = await api.get(`/notifications/admin/broadcasts?${q.toString()}`);
            return res as BroadcastHistoryResponse;
        },
    });
};

export const useAdminBroadcast = (id?: string) => {
    return useQuery<BroadcastNotification, Error>({
        queryKey: ['admin-broadcast', id],
        queryFn: async () => {
            const res = await api.get(`/notifications/admin/broadcasts/${id}`);
            return res as BroadcastNotification;
        },
        enabled: Boolean(id),
    });
};

export const useSendAdminBroadcast = () => {
    const queryClient = useQueryClient();

    return useMutation<BroadcastNotification, Error, SendBroadcastPayload>({
        mutationFn: async (payload) => {
            return (await api.post('/notifications/admin/broadcast', payload)) as BroadcastNotification;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-broadcasts'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

// ============================================================================
// Admin Subscription Reminder Templates
// ============================================================================

export const useReminderPlaceholders = () => {
    return useQuery<ReminderPlaceholder[], Error>({
        queryKey: ['subscription-reminder-placeholders'],
        queryFn: async () => {
            const res = await api.get('/subscription-reminders/admin/placeholders');
            return (Array.isArray(res) ? res : (res?.data || [])) as ReminderPlaceholder[];
        },
    });
};

export const useReminderTemplates = () => {
    return useQuery<SubscriptionReminderTemplate[], Error>({
        queryKey: ['subscription-reminder-templates'],
        queryFn: async () => {
            const res = await api.get('/subscription-reminders/admin/templates');
            return (Array.isArray(res) ? res : (res?.data || [])) as SubscriptionReminderTemplate[];
        },
    });
};

export const useReminderTemplate = (id?: string) => {
    return useQuery<SubscriptionReminderTemplate, Error>({
        queryKey: ['subscription-reminder-template', id],
        queryFn: async () => {
            const res = await api.get(`/subscription-reminders/admin/templates/${id}`);
            return res as SubscriptionReminderTemplate;
        },
        enabled: Boolean(id),
    });
};

export const useCreateReminderTemplate = () => {
    const queryClient = useQueryClient();

    return useMutation<SubscriptionReminderTemplate, Error, CreateReminderTemplatePayload>({
        mutationFn: async (payload) => {
            return (await api.post(
                '/subscription-reminders/admin/templates',
                payload,
            )) as SubscriptionReminderTemplate;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-reminder-templates'] });
        },
    });
};

export const useUpdateReminderTemplate = () => {
    const queryClient = useQueryClient();

    return useMutation<
        SubscriptionReminderTemplate,
        Error,
        { id: string; data: UpdateReminderTemplatePayload }
    >({
        mutationFn: async ({ id, data }) => {
            return (await api.patch(
                `/subscription-reminders/admin/templates/${id}`,
                data,
            )) as SubscriptionReminderTemplate;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-reminder-templates'] });
        },
    });
};

export const useResetReminderTemplate = () => {
    const queryClient = useQueryClient();

    return useMutation<SubscriptionReminderTemplate, Error, string>({
        mutationFn: async (id) => {
            return (await api.post(
                `/subscription-reminders/admin/templates/${id}/reset`,
                {},
            )) as SubscriptionReminderTemplate;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-reminder-templates'] });
        },
    });
};

export const usePreviewReminderTemplate = () => {
    return useMutation<PreviewTemplateResponse, Error, PreviewTemplatePayload>({
        mutationFn: async (payload) => {
            return (await api.post(
                '/subscription-reminders/admin/templates/preview',
                payload,
            )) as PreviewTemplateResponse;
        },
    });
};

export const useRunRemindersNow = () => {
    return useMutation<{ message: string; result: any }, Error, void>({
        mutationFn: async () => {
            return (await api.post('/subscription-reminders/admin/run-now', {})) as {
                message: string;
                result: any;
            };
        },
    });
};
