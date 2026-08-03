'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChatStore } from '@/lib/store/useChatStore';
import { useMessagingSocket } from '@/hooks/useMessagingSocket';

type UseMessagingRealtimeProps = {
    activeThreadId?: string | null;
    branchId?: string;
    isCustomer?: boolean;
    isPendingThread?: boolean;
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

const patchMessageStatusInCache = (existing: any, messageId: string, status: string) => {
    if (!existing) return existing;
    const patch = (item: any) =>
        item?.id === messageId ? { ...item, status } : item;
    if (Array.isArray(existing)) return existing.map(patch);
    if (Array.isArray((existing as any)?.data)) {
        return { ...existing, data: (existing as any).data.map(patch) };
    }
    return existing;
};

export const useMessagingRealtime = ({
    activeThreadId,
    branchId,
    isCustomer = false,
    isPendingThread = false,
}: UseMessagingRealtimeProps) => {
    const { socket } = useMessagingSocket({ enabled: true });
    const queryClient = useQueryClient();
    const setTyping = useChatStore((state) => state.setTyping);
    const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    const lastInvalidateTime = useRef<number>(0);

    const invalidateThreads = useCallback(() => {
        const now = Date.now();
        // Throttle to once every 2 seconds
        if (now - lastInvalidateTime.current < 2000) return;
        lastInvalidateTime.current = now;
        
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

    const patchMessageStatus = useCallback(
        (threadId: string, messageId: string, status: string) => {
            if (!threadId || !messageId) return;
            queryClient.setQueryData(
                ['chat-messages', threadId, branchId, isCustomer],
                (existing) => patchMessageStatusInCache(existing, messageId, status)
            );
        },
        [branchId, isCustomer, queryClient]
    );

    const patchMessagesStatus = useCallback(
        (threadId: string, messageIds: string[], status: string) => {
            if (!threadId || !messageIds?.length) return;
            const idSet = new Set(messageIds);
            queryClient.setQueryData(
                ['chat-messages', threadId, branchId, isCustomer],
                (existing) => {
                    if (!existing) return existing;
                    const patch = (item: any) =>
                        item?.id && idSet.has(item.id) ? { ...item, status } : item;
                    if (Array.isArray(existing)) return existing.map(patch);
                    if (Array.isArray((existing as any)?.data)) {
                        return { ...existing, data: (existing as any).data.map(patch) };
                    }
                    return existing;
                }
            );
        },
        [branchId, isCustomer, queryClient]
    );

    const activeThreadRef = useRef(activeThreadId);
    useEffect(() => {
        activeThreadRef.current = activeThreadId;
    }, [activeThreadId]);

    const ackReceivedMessage = useCallback(
        (message: any) => {
            const threadId = resolveThreadId(message);
            if (!threadId || !socket) return;
            const messageId = message?.id;
            // Only ack messages sent by the other side (not our own)
            const isOwn = isCustomer
                ? message?.direction === 'INBOUND'
                : message?.direction === 'OUTBOUND';
            if (isOwn || !messageId) return;

            socket.emit('markDelivered', { messageId, threadId });
            if (activeThreadRef.current === threadId) {
                socket.emit('markRead', { threadId, messageIds: [messageId] });
            }
        },
        [isCustomer, socket]
    );

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message: any) => {
            upsertMessageCache(message);
            ackReceivedMessage(message);
            invalidateThreads();
        };

        const handleInboxUpdate = (payload: any) => {
            if (payload?.message) {
                upsertMessageCache(payload.message);
                ackReceivedMessage(payload.message);
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

        const handleMessageStatus = (payload: any) => {
            patchMessageStatus(
                payload?.threadId,
                payload?.messageId,
                payload?.status
            );
        };

        const handleMessageRead = (payload: any) => {
            patchMessagesStatus(
                payload?.threadId,
                payload?.messageIds,
                payload?.status || 'READ'
            );
        };

        socket.on('newMessage', handleNewMessage);
        socket.on('inboxUpdate', handleInboxUpdate);
        socket.on('userTyping', handleUserTyping);
        socket.on('notification', handleInboxUpdate);
        socket.on('messageStatus', handleMessageStatus);
        socket.on('messageRead', handleMessageRead);

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('inboxUpdate', handleInboxUpdate);
            socket.off('userTyping', handleUserTyping);
            socket.off('notification', handleInboxUpdate);
            socket.off('messageStatus', handleMessageStatus);
            socket.off('messageRead', handleMessageRead);
        };
    }, [
        ackReceivedMessage,
        invalidateThreads,
        patchMessageStatus,
        patchMessagesStatus,
        setTyping,
        socket,
        upsertMessageCache,
    ]);

    useEffect(() => {
        if (!socket || !activeThreadId || isPendingThread) return;
        socket.emit('joinThread', { threadId: activeThreadId });
        socket.emit('markRead', { threadId: activeThreadId });
        return () => {
            socket.emit('leaveThread', { threadId: activeThreadId });
        };
    }, [activeThreadId, isPendingThread, socket]);

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
