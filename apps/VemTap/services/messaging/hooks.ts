import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import {
    Campaign,
    Channel,
    CreateTemplateRequest,
    InboxThread,
    MessagingAnalytics,
    SendMessageRequest,
    Template,
    ThreadMessage,
} from './types';

// ─── Analytics ───────────────────────────────────────────────────────────────

export const useMessagingAnalytics = (channel?: Channel) => {
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const branchId = useAuthStore((state) =>
        activeBranchId && activeBranchId !== 'all' ? activeBranchId : (state.user?.branchId || state.user?.businessId)
    );

    return useQuery<MessagingAnalytics, Error>({
        queryKey: ['messaging', 'analytics', branchId, channel],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (branchId) params.append('branchId', branchId);
            if (channel) params.append('channel', channel);
            return await api.get(`/messaging/analytics?${params.toString()}`);
        },
        enabled: !!branchId,
    });
};

// ─── Campaigns / History ──────────────────────────────────────────────────────

export const useMessagingCampaigns = () => {
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const branchId = useAuthStore((state) =>
        activeBranchId && activeBranchId !== 'all' ? activeBranchId : (state.user?.branchId || state.user?.businessId)
    );

    return useQuery<Campaign[], Error>({
        queryKey: ['messaging', 'campaigns', branchId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (branchId) params.append('branchId', branchId);
            return await api.get(`/messaging/campaigns?${params.toString()}`);
        },
        enabled: !!branchId,
    });
};

// ─── Send Message ─────────────────────────────────────────────────────────────

export const useSendMessage = () => {
    const queryClient = useQueryClient();
    return useMutation<any, Error, SendMessageRequest>({
        mutationFn: async (dto) => await api.post('/messaging/send', dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messaging', 'campaigns'] });
            queryClient.invalidateQueries({ queryKey: ['messaging', 'analytics'] });
        },
    });
};

// ─── Templates ────────────────────────────────────────────────────────────────

export const useMessagingTemplates = (channel?: Channel) => {
    const businessId = useAuthStore((state) => state.user?.businessId);
    return useQuery<Template[], Error>({
        queryKey: ['messaging', 'templates', channel],
        queryFn: async () => {
            // Note: template listing not exposed as GET currently; falls back gracefully
            return await api.get(`/messaging/templates${channel ? `?channel=${channel}` : ''}`);
        },
        enabled: !!businessId,
        // Return empty array if endpoint not found yet
        placeholderData: [] as Template[],
    });
};

export const useCreateTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation<Template, Error, CreateTemplateRequest>({
        mutationFn: async (dto) => await api.post('/messaging/templates', dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messaging', 'templates'] });
        },
    });
};

// ─── Inbox / Threads ─────────────────────────────────────────────────────────

export const useInboxThreads = (channel: Channel) => {
    const businessId = useAuthStore((state) => state.user?.businessId);
    return useQuery<InboxThread[], Error>({
        queryKey: ['messaging', 'inbox', channel],
        queryFn: async () => await api.get(`/messaging/inbox/${channel}`),
        enabled: !!businessId && !!channel,
    });
};

export const useThreadMessages = (threadId: string) => {
    const businessId = useAuthStore((state) => state.user?.businessId);
    return useQuery<ThreadMessage[], Error>({
        queryKey: ['messaging', 'thread', threadId],
        queryFn: async () => await api.get(`/messaging/inbox/threads/${threadId}`),
        enabled: !!businessId && !!threadId,
    });
};

export const useReplyToThread = (threadId: string) => {
    const queryClient = useQueryClient();
    return useMutation<any, Error, { content: string }>({
        mutationFn: async (dto) =>
            await api.post(`/messaging/inbox/threads/${threadId}/reply`, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messaging', 'thread', threadId] });
        },
    });
};
