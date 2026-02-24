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
    AutomationRule,
    CreateAutomationRequest,
    UpdateAutomationRequest,
    TriggerType,
    ActionType
} from './types';

// ─── Analytics ───────────────────────────────────────────────────────────────

export const useMessagingAnalytics = (channel?: Channel) => {
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const branchId = useAuthStore((state) =>
        activeBranchId && activeBranchId !== 'all' ? activeBranchId : state.user?.branchId
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
        activeBranchId && activeBranchId !== 'all' ? activeBranchId : state.user?.branchId
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
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const userBranchId = useAuthStore((state) => state.user?.branchId);
    return useMutation<any, Error, SendMessageRequest>({
        mutationFn: async (dto) => {
            const resolvedBranchId =
                dto.branchId || (activeBranchId && activeBranchId !== 'all' ? activeBranchId : userBranchId);

            const normalizedAudienceType =
                dto.audienceType === 'ALL_CUSTOMERS' ? 'ALL' : dto.audienceType;

            return await api.post('/messaging/send', {
                ...dto,
                branchId: resolvedBranchId,
                audienceType: normalizedAudienceType,
            });
        },
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
            // Listing endpoint is admin-scoped in current backend.
            try {
                const templates = await api.get('/messaging/admin/templates');
                if (!channel) {
                    return templates;
                }
                return (templates as Template[]).filter((t) => t.channel === channel);
            } catch {
                return [];
            }
        },
        enabled: !!businessId,
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
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const branchId = useAuthStore((state) =>
        activeBranchId && activeBranchId !== 'all' ? activeBranchId : state.user?.branchId
    );
    return useQuery<InboxThread[], Error>({
        queryKey: ['messaging', 'inbox', channel, branchId],
        queryFn: async () =>
            await api.get(`/messaging/inbox/${channel}?${new URLSearchParams({ branchId: branchId || '' }).toString()}`),
        enabled: !!branchId && !!channel,
    });
};

export const useThreadMessages = (threadId: string) => {
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const branchId = useAuthStore((state) =>
        activeBranchId && activeBranchId !== 'all' ? activeBranchId : state.user?.branchId
    );
    return useQuery<ThreadMessage[], Error>({
        queryKey: ['messaging', 'thread', threadId, branchId],
        queryFn: async () =>
            await api.get(`/messaging/inbox/threads/${threadId}?${new URLSearchParams({ branchId: branchId || '' }).toString()}`),
        enabled: !!branchId && !!threadId,
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

// ─── Automations ─────────────────────────────────────────────────────────────

export const useAutomations = (branchId?: string) => {
    const businessId = useAuthStore((state) => state.user?.businessId);
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const targetBranchId = branchId || (activeBranchId && activeBranchId !== 'all' ? activeBranchId : undefined);

    return useQuery<AutomationRule[], Error>({
        queryKey: ['messaging', 'automations', businessId, targetBranchId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (targetBranchId) params.append('branchId', targetBranchId);
            return await api.get(`/automations?${params.toString()}`);
        },
        enabled: !!businessId,
    });
};

export const useCreateAutomation = () => {
    const queryClient = useQueryClient();
    return useMutation<AutomationRule, Error, CreateAutomationRequest>({
        mutationFn: async (dto) => await api.post('/automations', dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messaging', 'automations'] });
        },
    });
};

export const useUpdateAutomation = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation<AutomationRule, Error, UpdateAutomationRequest>({
        mutationFn: async (dto) => await api.patch(`/automations/${id}`, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messaging', 'automations'] });
        },
    });
};

export const useDeleteAutomation = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: async (id) => await api.delete(`/automations/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messaging', 'automations'] });
        },
    });
};
