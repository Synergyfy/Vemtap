'use client';

import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { BASE_URL } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

const resolveSocketBaseUrl = () => {
    if (!BASE_URL) return '';
    return BASE_URL.replace(/\/api\/v1$/, '');
};

let socketSingleton: Socket | null = null;

const getSocketInstance = (token?: string | null) => {
    if (socketSingleton) return socketSingleton;
    const baseUrl = resolveSocketBaseUrl();
    socketSingleton = io(`${baseUrl}/messaging`, {
        autoConnect: false,
        transports: ['websocket'],
        auth: {
            token,
            Authorization: token ? `Bearer ${token}` : undefined,
        },
    });
    return socketSingleton;
};

export const useMessagingSocket = ({ enabled = true }: { enabled?: boolean } = {}) => {
    const token = useAuthStore((state) => state.access_token);
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!enabled) return;
        if (!token) {
            socketSingleton?.disconnect();
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
            socket.disconnect();
        };
    }, [enabled, token]);

    return useMemo(() => ({ socket, isConnected }), [isConnected, socket]);
};
