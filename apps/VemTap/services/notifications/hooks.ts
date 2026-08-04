import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Notification, UnreadCountResponse } from './types';

export const useNotifications = () => {
    return useQuery<Notification[], Error>({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await api.get('/notifications');
            const data = Array.isArray(res) ? res : (res.data || []);
            return data.map((n: any) => ({
                id: n.id,
                title: n.title,
                message: n.message,
                type: n.type || 'info',
                read: n.isRead,
                timestamp: n.createdAt,
                actionUrl: n.actionUrl
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
