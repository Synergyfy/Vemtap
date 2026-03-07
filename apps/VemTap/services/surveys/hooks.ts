import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Survey, CreateSurveyRequest, UpdateSurveyRequest } from './types';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';

export const useSurvey = (branchId?: string) => {
    const { activeBranchId: urlBranchId } = useActiveBranch();
    const businessId = useAuthStore((state) => state.user?.businessId);
    const resolvedBranchId = branchId || urlBranchId;

    return useQuery<Survey[], Error>({
        queryKey: ['survey', businessId, resolvedBranchId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (resolvedBranchId) params.append('branchId', (resolvedBranchId as string));
            const data = await api.get(`/business-forms?${params.toString()}`);
            return data;
        },
        enabled: !!businessId,
    });
};

export const useCreateOrUpdateSurvey = () => {
    const queryClient = useQueryClient();
    const { activeBranchId: urlBranchId } = useActiveBranch();
    const userBranchId = useAuthStore((state) => state.user?.branchId);

    return useMutation<Survey, Error, CreateSurveyRequest>({
        mutationFn: async (data: CreateSurveyRequest) => {
            const resolvedBranchId = data.branchId || urlBranchId || userBranchId;
            return await api.post('/business-forms', {
                ...data,
                branchId: resolvedBranchId || undefined,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['survey'] });
        },
    });
};

export const usePatchSurvey = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation<Survey, Error, UpdateSurveyRequest>({
        mutationFn: async (data: UpdateSurveyRequest) => {
            return await api.patch(`/business-forms/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['survey'] });
        },
    });
};
