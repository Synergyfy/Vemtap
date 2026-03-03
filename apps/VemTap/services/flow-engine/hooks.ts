import { useQuery } from '@tanstack/react-query';
import { adminFlowEngineApi } from '@/lib/api/admin';

export function useFlowEngineAnalytics(params?: {
    businessId?: string;
    branchId?: string;
    from?: string;
    to?: string;
    limit?: number;
}) {
    return useQuery({
        queryKey: ['flow-engine-analytics', params],
        queryFn: () => adminFlowEngineApi.getAnalytics(params),
    });
}

export function useFlowEngineTemplates() {
    return useQuery({
        queryKey: ['flow-engine-templates'],
        queryFn: () => adminFlowEngineApi.getTemplates(),
    });
}

export function useFlowEngineSessions(params?: { businessId?: string; branchId?: string; from?: string; to?: string; limit?: number }) {
    return useQuery({
        queryKey: ['flow-engine-sessions', params],
        queryFn: () => adminFlowEngineApi.getSessions(params),
    });
}

export function useFlowEngineLogs(params?: { businessId?: string; branchId?: string; from?: string; to?: string; limit?: number }) {
    return useQuery({
        queryKey: ['flow-engine-logs', params],
        queryFn: () => adminFlowEngineApi.getLogs(params),
    });
}

export function useFlowEngineTriggers() {
    return useQuery({
        queryKey: ['flow-engine-triggers'],
        queryFn: () => adminFlowEngineApi.getTriggers(),
    });
}

export function useFlowEngineSettings() {
    return useQuery({
        queryKey: ['flow-engine-settings'],
        queryFn: () => adminFlowEngineApi.getSettings(),
    });
}
