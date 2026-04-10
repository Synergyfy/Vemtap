'use client';

import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { BASE_URL } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

const resolveSocketBaseUrl = () => {
    if (!BASE_URL) return '';
    return BASE_URL.replace(/\/api\/v1$/, '');
};

let supportSocketSingleton: Socket | null = null;

const getSocketInstance = (token?: string | null) => {
    const baseUrl = resolveSocketBaseUrl();
    if (!supportSocketSingleton) {
        supportSocketSingleton = io(`${baseUrl}/support`, {
            autoConnect: false,
            transports: ['polling', 'websocket'],
            auth: {
                token,
                Authorization: token ? `Bearer ${token}` : undefined,
            },
        });
    } else {
        // Refresh token if singleton already exists
        supportSocketSingleton.auth = {
            token,
            Authorization: token ? `Bearer ${token}` : undefined,
        };
    }
    return supportSocketSingleton;
};

export const useSupportSocket = ({ enabled = true }: { enabled?: boolean } = {}) => {
    const token = useAuthStore((state) => state.access_token);
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!enabled) return;
        if (!token) {
            supportSocketSingleton?.disconnect();
            setIsConnected(false);
            setSocket(null);
            return;
        }

        const socket = getSocketInstance(token);
        socket.auth = {
            token,
            Authorization: token ? `Bearer ${token}` : undefined,
        };
        setSocket(socket);

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.connect();

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            // We don't necessarily want to disconnect the singleton if other components use it,
            // but for support chat, it's usually one instance anyway.
            socket.disconnect();
        };
    }, [enabled, token]);

    return useMemo(() => ({ socket, isConnected }), [isConnected, socket]);
};
