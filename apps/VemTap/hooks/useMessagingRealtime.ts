'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChatStore } from '@/lib/store/useChatStore';
import { useMessagingSocket } from '@/hooks/useMessagingSocket';

type UseMessagingRealtimeProps = {
    activeThreadId?: string | null;
    branchId?: string;
    isCustomer?: boolean;
    isMockThread?: boolean;
};

type MessagePayload = {
    id?: string;
    threadId?: string;
    conversationId?: string;
    createdAt?: string;
    timestamp?: string;
};

const resolveThreadId = (payload: MessagePayload | undefined) => {
    if (!payload) return '';
    return payload.threadId || payload.conversationId || (payload as any)?.thread?.id || '';
};

const appendToMessagesCache = (existing: any, message: any) => {
    if (!existing) return [message];
    if (Array.isArray(existing)) {
        if (existing.some((item) => item?.id === message?.id)) return existing;
        return [...existing, message];
    }
    if (Array.isArray(existing?.data)) {
        if (existing.data.some((item: any) => item?.id === message?.id)) return existing;
        return { ...existing, data: [...existing.data, message] };
    }
    return existing;
};

export const useMessagingRealtime = ({
    activeThreadId,
    branchId,
    isCustomer = false,
    isMockThread = false,
}: UseMessagingRealtimeProps) => {
    const { socket } = useMessagingSocket({ enabled: true });
    const queryClient = useQueryClient();
    const setTyping = useChatStore((state) => state.setTyping);
    const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    const invalidateThreads = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['chat-threads', 'IN_HOUSE', branchId, isCustomer] });
    }, [branchId, isCustomer, queryClient]);

    const upsertMessageCache = useCallback(
        (message: any) => {
            const threadId = resolveThreadId(message);
            if (!threadId) return;
            queryClient.setQueryData(
                ['chat-messages', threadId, branchId, isCustomer],
                (existing) => appendToMessagesCache(existing, message)
            );
        },
        [branchId, isCustomer, queryClient]
    );

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message: any) => {
            upsertMessageCache(message);
            invalidateThreads();
        };

        const handleInboxUpdate = (payload: any) => {
            if (payload?.message) {
                upsertMessageCache(payload.message);
            }
            invalidateThreads();
        };

        const handleUserTyping = (payload: any) => {
            const threadId = resolveThreadId(payload);
            if (!threadId) return;
            const next = Boolean(payload?.isTyping);
            setTyping(threadId, next);
            if (typingTimers.current[threadId]) {
                clearTimeout(typingTimers.current[threadId]);
            }
            if (next) {
                typingTimers.current[threadId] = setTimeout(() => {
                    setTyping(threadId, false);
                }, 4000);
            }
        };

        socket.on('newMessage', handleNewMessage);
        socket.on('inboxUpdate', handleInboxUpdate);
        socket.on('userTyping', handleUserTyping);
        socket.on('notification', handleInboxUpdate);

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('inboxUpdate', handleInboxUpdate);
            socket.off('userTyping', handleUserTyping);
            socket.off('notification', handleInboxUpdate);
        };
    }, [invalidateThreads, setTyping, socket, upsertMessageCache]);

    useEffect(() => {
        if (!socket || !activeThreadId || isMockThread) return;
        socket.emit('joinThread', { threadId: activeThreadId });
        return () => {
            socket.emit('leaveThread', { threadId: activeThreadId });
        };
    }, [activeThreadId, isMockThread, socket]);

    const emitTyping = useCallback(
        (threadId: string, isTyping: boolean) => {
            if (!socket) return;
            socket.emit('typing', { threadId, isTyping });
        },
        [socket]
    );

    return useMemo(
        () => ({
            emitTyping,
        }),
        [emitTyping]
    );
};
