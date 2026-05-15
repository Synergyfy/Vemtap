'use client';

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { BASE_URL, api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { notify } from '@/lib/notify';

const resolveSocketBaseUrl = () => {
    if (!BASE_URL) return '';
    return BASE_URL.replace(/\/api\/v1$/, '');
};

let socketSingleton: Socket | null = null;

const getSocketInstance = (token?: string | null) => {
    if (socketSingleton?.connected) return socketSingleton;
    const baseUrl = resolveSocketBaseUrl();
    socketSingleton = io(baseUrl, {
        autoConnect: false,
        transports: ['polling', 'websocket'],
        auth: {
            token,
            Authorization: token ? `Bearer ${token}` : undefined,
        },
    });
    return socketSingleton;
};

export const useEventsSocket = ({ enabled = true }: { enabled?: boolean } = {}) => {
    const token = useAuthStore((state) => state.access_token);

    useEffect(() => {
        if (!enabled) return;
        if (!token) {
            socketSingleton?.disconnect();
            socketSingleton = null;
            return;
        }

        const socket = getSocketInstance(token);
        socket.auth = {
            token,
            Authorization: token ? `Bearer ${token}` : undefined,
        };

        const handleUserUpdated = async (data: { permissions?: string[]; role?: string }) => {
            try {
                const freshUser = await api.get('/users/profile');
                const currentUser = useAuthStore.getState().user;
                if (currentUser) {
                    useAuthStore.setState({ user: { ...currentUser, ...freshUser } });
                }
                notify.info('Your account permissions have been updated');
            } catch {
                // Silently fail — permissions will refresh on next page load
            }
        };

        socket.on('user_updated', handleUserUpdated);
        socket.connect();

        return () => {
            socket.off('user_updated', handleUserUpdated);
            socket.disconnect();
            socketSingleton = null;
        };
    }, [enabled, token]);
};
