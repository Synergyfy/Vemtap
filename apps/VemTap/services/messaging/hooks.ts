import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
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

import { fetchMyCredits, BusinessCredit } from '@/lib/api/credit-plans';

// ─── Credits ─────────────────────────────────────────────────────────────

export const useMyCredits = () => {
    const { branchId: resolvedBranchId } = useResolvedBranchParams();
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);

    return useQuery<BusinessCredit, Error>({
        queryKey: ['my-credits', businessId, role, resolvedBranchId],
        queryFn: async () => await fetchMyCredits(resolvedBranchId === 'all' ? undefined : resolvedBranchId),
        refetchInterval: 60000,
        enabled: !!businessId,
    });
};

const toUiChannel = (channel?: string): 'WhatsApp' | 'SMS' | 'Email' => {
    if (channel === 'WHATSAPP') return 'WhatsApp';
    if (channel === 'EMAIL') return 'Email';
    return 'SMS';
};

const UUID_V4_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuidV4 = (value?: string | null): value is string =>
    !!value && UUID_V4_REGEX.test(value);

const normalizeRole = (role?: string | null) => String(role || '').toLowerCase();

const getReadContextParams = ({
    role,
    businessId,
    branchId,
    allBranches,
}: {
    role?: string | null;
    businessId?: string | null;
    branchId?: string | null;
    allBranches?: boolean;
}) => {
    const params = new URLSearchParams();
    const normalizedRole = normalizeRole(role);
    const hasBranchId = isUuidV4(branchId);

    if (normalizedRole === 'owner') {
        if (hasBranchId && branchId) {
            params.append('branchId', branchId);
        } else {
            params.append('allBranches', 'true');
        }
        return params;
    }

    if (normalizedRole === 'admin') {
        if (hasBranchId && branchId) {
            params.append('branchId', branchId);
            return params;
        }
        params.append('allBranches', 'true');
        if (isUuidV4(businessId)) {
            params.append('businessId', businessId);
        }
        return params;
    }

    // Staff/Manager are branch-locked by backend token context.
    return params;
};

/**
 * Helper hook to resolve which branchId to use.
 */
function useResolvedBranchParams(branchId?: string): { branchId?: string; allBranches?: boolean } {
    const { activeBranchId: urlBranchId } = useActiveBranch();
    const resolvedBranchId = branchId || urlBranchId;
    
    if (resolvedBranchId === 'all' || !resolvedBranchId) {
        return { allBranches: true };
    }
    return { branchId: resolvedBranchId };
}

const getWriteBranchId = ({
    role,
    dtoBranchId,
    activeBranchId,
    userBranchId,
}: {
    role?: string | null;
    dtoBranchId?: string;
    activeBranchId?: string | null;
    userBranchId?: string;
}) => {
    const normalizedRole = normalizeRole(role);

    if (normalizedRole === 'manager' || normalizedRole === 'staff') {
        return undefined;
    }

    const candidate = dtoBranchId || activeBranchId || userBranchId;
    if (!isUuidV4(candidate)) {
        throw new Error('A valid branchId (UUID v4) is required for this action.');
    }
    return candidate;
};

// ─── Analytics ───────────────────────────────────────────────────────────────

export const useMessagingAnalytics = (channel?: Channel) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams();
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const contextParams = getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches });

    return useQuery<MessagingAnalytics, Error>({
        queryKey: ['messaging', 'analytics', businessId, role, resolvedBranchId, allBranches, channel, contextParams.toString()],
        queryFn: async () => {
            const params = new URLSearchParams(contextParams);
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
                trafficTrend: response?.trafficTrend
            } as MessagingAnalytics;
        },
        enabled: !!businessId,
    });
};

// ─── Campaigns / History ──────────────────────────────────────────────────────

export const useMessagingCampaigns = () => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams();
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const contextParams = getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches });

    return useQuery<Campaign[], Error>({
        queryKey: ['messaging', 'campaigns', businessId, role, resolvedBranchId, allBranches, contextParams.toString()],
        queryFn: async () => {
            const params = new URLSearchParams(contextParams);
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
        enabled: !!businessId,
    });
};

// ─── Send Message ─────────────────────────────────────────────────────────────

export const useSendMessage = () => {
    const queryClient = useQueryClient();
    const { activeBranchId: urlBranchId } = useActiveBranch();
    const userBranchId = useAuthStore((state) => state.user?.branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    return useMutation<any, Error, SendMessageRequest>({
        mutationFn: async (dto) => {
            const normalizedActiveBranchId =
                !urlBranchId || urlBranchId === 'all' ? undefined : urlBranchId;
            const resolvedBranchId = getWriteBranchId({
                role,
                dtoBranchId: dto.branchId,
                activeBranchId: normalizedActiveBranchId,
                userBranchId,
            });

            return await api.post('/messaging/send', {
                ...dto,
                businessId: businessId || undefined,
                branchId: resolvedBranchId || undefined,
                audienceType: dto.audienceType,
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
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams();
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const isAdmin = String(role || '').toLowerCase() === 'admin';
    const contextParams = getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches });

    return useQuery<Template[], Error>({
        queryKey: ['messaging', 'templates', businessId, role, resolvedBranchId, allBranches, channel, contextParams.toString()],
        queryFn: async () => {
            try {
                const params = new URLSearchParams(contextParams);
                if (channel) params.append('channel', channel);

                const templates = isAdmin
                    ? await api.get('/messaging/admin/templates')
                    : await api.get(`/messaging/templates?${params.toString()}`);
                
                if (!channel) {
                    return templates;
                }
                // Backend already filters by branch, but we might still want to filter by channel if not done by backend
                // Actually, MessagingController.getTemplates doesn't take channel as a query param currently.
                return (templates as Template[]).filter((t) => t.channel === channel);
            } catch {
                return [];
            }
        },
        enabled: isAdmin || !!businessId,
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
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams();
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const contextParams = getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches });

    return useQuery<InboxThread[], Error>({
        queryKey: ['messaging', 'inbox', channel, businessId, role, resolvedBranchId, allBranches, contextParams.toString()],
        queryFn: async () => {
            const params = new URLSearchParams(contextParams);
            const response = await api.get(`/messaging/inbox/${channel}?${params.toString()}`);
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
        enabled: !!businessId && !!channel,
    });
};

export const useThreadMessages = (threadId: string) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams();
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const contextParams = getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches });

    return useQuery<ThreadMessage[], Error>({
        queryKey: ['messaging', 'thread', threadId, businessId, role, resolvedBranchId, allBranches, contextParams.toString()],
        queryFn: async () => {
            const params = new URLSearchParams(contextParams);
            const response = await api.get(`/messaging/inbox/threads/${threadId}?${params.toString()}`);
            return (response || []).map((message: any) => ({
                id: message.id,
                threadId: message.threadId,
                content: message.content,
                direction: message.direction,
                createdAt: message.timestamp || message.createdAt,
            }));
        },
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

// ─── Automations ─────────────────────────────────────────────────────────────

export const useAutomations = (branchId?: string) => {
    const { branchId: targetBranchId, allBranches } = useResolvedBranchParams(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const contextParams = getReadContextParams({ role, businessId, branchId: targetBranchId, allBranches });

    return useQuery<AutomationRule[], Error>({
        queryKey: ['messaging', 'automations', businessId, role, targetBranchId, allBranches, contextParams.toString()],
        queryFn: async () => {
            const params = new URLSearchParams(contextParams);
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
    const { branchId: targetBranchId, allBranches } = useResolvedBranchParams(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const contextParams = getReadContextParams({ role, businessId, branchId: targetBranchId, allBranches });

    return useQuery<{ data: AutomationLog[]; total: number }, Error>({
        queryKey: ['messaging', 'automation-logs', businessId, role, targetBranchId, allBranches, limit, offset, contextParams.toString()],
        queryFn: async () => {
            const params = new URLSearchParams(contextParams);
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
    const { branchId: targetBranchId, allBranches } = useResolvedBranchParams(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const contextParams = getReadContextParams({ role, businessId, branchId: targetBranchId, allBranches });

    return useQuery<AutomationPerformance, Error>({
        queryKey: ['messaging', 'automation-performance', businessId, role, targetBranchId, allBranches, startDate, endDate, contextParams.toString()],
        queryFn: async () => {
            const params = new URLSearchParams(contextParams);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            return await api.get(`/automations/performance?${params.toString()}`);
        },
        enabled: !!businessId,
    });
};

export const useWhatsAppConnectionStatus = (branchId?: string) => {
    const { branchId: targetBranchId, allBranches } = useResolvedBranchParams(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const contextParams = getReadContextParams({ role, businessId, branchId: targetBranchId, allBranches });

    return useQuery<{ status: string; provider: string; updatedAt: string }, Error>({
        queryKey: ['messaging', 'whatsapp-status', businessId, role, targetBranchId, allBranches, contextParams.toString()],
        queryFn: async () => {
            const params = new URLSearchParams(contextParams);
            return await api.get(`/automations/connection-status?${params.toString()}`);
        },
        enabled: !!businessId,
    });
};
