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
    ActionType,
    AutomationLog,
    AutomationPerformance
} from './types';

const toUiChannel = (channel?: string): 'WhatsApp' | 'SMS' | 'Email' => {
    if (channel === 'WHATSAPP') return 'WhatsApp';
    if (channel === 'EMAIL') return 'Email';
    return 'SMS';
};

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
            const response = await api.get(`/messaging/analytics?${params.toString()}`);

            const totalSent = response?.totalSent ?? response?.sent ?? 0;
            const totalDelivered = response?.totalDelivered ?? response?.delivered ?? 0;
            const deliveryRate = response?.deliveryRate ?? 0;

            return {
                sent: totalSent,
                delivered: totalDelivered,
                failed: Math.max(0, totalSent - totalDelivered),
                deliveryRate,
                openRate: response?.openRate,
                channelStats: response?.channelStats,
                globalStats: response?.globalStats || {
                    totalSent,
                    totalDelivered,
                    openRate: response?.openRate ?? 0,
                    clickRate: response?.clickRate ?? 0,
                },
            } as MessagingAnalytics;
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
            const campaigns = await api.get(`/messaging/campaigns?${params.toString()}`);
            return (campaigns || []).map((campaign: any) => ({
                ...campaign,
                channel: campaign?.channel || 'SMS',
                status:
                    campaign?.status === 'SENT'
                        ? 'Completed'
                        : campaign?.status === 'PROCESSING'
                            ? 'Running'
                            : campaign?.status === 'FAILED'
                                ? 'Draft'
                                : campaign?.status || 'Draft',
            }));
        },
        enabled: !!branchId,
    });
};

// ─── Send Message ─────────────────────────────────────────────────────────────

export const useSendMessage = () => {
    const queryClient = useQueryClient();
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const userBranchId = useAuthStore((state) => state.user?.branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);
    return useMutation<any, Error, SendMessageRequest>({
        mutationFn: async (dto) => {
            const resolvedBranchId =
                dto.branchId || (activeBranchId && activeBranchId !== 'all' ? activeBranchId : userBranchId);

            const normalizedAudienceType =
                dto.audienceType === 'ALL_CUSTOMERS' ? 'ALL' : dto.audienceType;

            if (!businessId) {
                throw new Error('Missing businessId in user session');
            }

            return await api.post('/messaging/send', {
                ...dto,
                businessId,
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
    const role = useAuthStore((state) => state.user?.role);
    return useQuery<Template[], Error>({
        queryKey: ['messaging', 'templates', channel],
        queryFn: async () => {
            try {
                const templates =
                    role === 'admin'
                        ? await api.get('/messaging/admin/templates')
                        : [];
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
        queryFn: async () => {
            const response = await api.get(`/messaging/inbox/${channel}?${new URLSearchParams({ branchId: branchId || '' }).toString()}`);
            return (response || []).map((thread: any) => ({
                id: thread.id,
                contactName: thread?.contact?.name || 'Unknown Contact',
                contactPhone: thread?.contact?.phone,
                contactEmail: thread?.contact?.email,
                lastMessage: thread?.lastMessage || 'No messages yet',
                channel: toUiChannel(thread?.channel),
                unread: thread?.unreadCount || 0,
                updatedAt: thread?.lastActivityAt || thread?.updatedAt || thread?.createdAt,
            }));
        },
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
        queryFn: async () => {
            const response = await api.get(`/messaging/inbox/threads/${threadId}?${new URLSearchParams({ branchId: branchId || '' }).toString()}`);
            return (response || []).map((message: any) => ({
                id: message.id,
                threadId: message.threadId,
                content: message.content,
                direction: message.direction,
                createdAt: message.timestamp || message.createdAt,
            }));
        },
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

export const useAutomationLogs = (branchId?: string, limit = 50, offset = 0) => {
    const businessId = useAuthStore((state) => state.user?.businessId);
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const targetBranchId = branchId || (activeBranchId && activeBranchId !== 'all' ? activeBranchId : undefined);

    return useQuery<{ data: AutomationLog[]; total: number }, Error>({
        queryKey: ['messaging', 'automation-logs', businessId, targetBranchId, limit, offset],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (targetBranchId) params.append('branchId', targetBranchId);
            params.append('limit', limit.toString());
            params.append('offset', offset.toString());
            return await api.get(`/automations/logs?${params.toString()}`);
        },
        enabled: !!businessId,
    });
};

export const useAutomationLogDetails = (sessionId: string) => {
    const businessId = useAuthStore((state) => state.user?.businessId);
    return useQuery<AutomationLog, Error>({
        queryKey: ['messaging', 'automation-log-details', sessionId],
        queryFn: async () => await api.get(`/automations/logs/${sessionId}`),
        enabled: !!businessId && !!sessionId,
    });
};

export const useAutomationPerformance = (branchId?: string, startDate?: string, endDate?: string) => {
    const businessId = useAuthStore((state) => state.user?.businessId);
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const targetBranchId = branchId || (activeBranchId && activeBranchId !== 'all' ? activeBranchId : undefined);

    return useQuery<AutomationPerformance, Error>({
        queryKey: ['messaging', 'automation-performance', businessId, targetBranchId, startDate, endDate],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (targetBranchId) params.append('branchId', targetBranchId);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            return await api.get(`/automations/performance?${params.toString()}`);
        },
        enabled: !!businessId,
    });
};

export const useWhatsAppConnectionStatus = (branchId?: string) => {
    const businessId = useAuthStore((state) => state.user?.businessId);
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const targetBranchId = branchId || (activeBranchId && activeBranchId !== 'all' ? activeBranchId : undefined);

    return useQuery<{ status: string; provider: string; updatedAt: string }, Error>({
        queryKey: ['messaging', 'whatsapp-status', businessId, targetBranchId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (targetBranchId) params.append('branchId', targetBranchId);
            return await api.get(`/automations/connection-status?${params.toString()}`);
        },
        enabled: !!businessId,
    });
};
