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

export const useRegisterVisitorPushToken = () => {
    return useMutation<void, Error, { pushToken: string }>({
        mutationFn: async ({ pushToken }) => {
            await api.post('/notifications/visitor-push-token', { pushToken });
        },
    });
};
