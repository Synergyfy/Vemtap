import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Branch, CreateBranchRequest, UpdateBranchRequest } from './types';
import { useAuthStore } from '@/store/useAuthStore';

// ─── Fetch all branches for the authenticated user's business ─────────────────
export const useBranches = (enabled: boolean = true) => {
    const { user } = useAuthStore();
    const businessId = user?.businessId ?? user?.id;
    return useQuery<Branch[], Error>({
        // Scope the key to the current business so a stale cache entry from a
        // previous account can never be served on a different account.
        queryKey: ['branches', businessId],
        queryFn: async () => await api.get('/branches'),
        staleTime: 1000 * 60 * 5, // cache for 5 minutes
        enabled,
    });
};

// ─── Fetch a single branch ────────────────────────────────────────────────────
export const useBranch = (id: string) => {
    const { user } = useAuthStore();
    const businessId = user?.businessId ?? user?.id;
    return useQuery<Branch, Error>({
        queryKey: ['branch', businessId, id],
        queryFn: async () => await api.get(`/branches/${id}`),
        enabled: !!id,
    });
};

// ─── Create a branch ─────────────────────────────────────────────────────────
export const useCreateBranch = () => {
    const queryClient = useQueryClient();
    return useMutation<Branch, Error, CreateBranchRequest>({
        mutationFn: async (dto) => await api.post('/branches', dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['branches'] });
        },
    });
};

// ─── Update a branch ─────────────────────────────────────────────────────────
export const useUpdateBranch = () => {
    const queryClient = useQueryClient();
    return useMutation<Branch, Error, { id: string; updates: UpdateBranchRequest }>({
        mutationFn: async ({ id, updates }) => await api.patch(`/branches/${id}`, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['branches'] });
            queryClient.invalidateQueries({ queryKey: ['branch'] });
            queryClient.invalidateQueries({ queryKey: ['my-business'] });
        },
    });
};

export const useRequestDeleteBranchOtp = () => {
    return useMutation<{ success: boolean; message: string }, Error, string>({
        mutationFn: async (id: string) => await api.post(`/branches/${id}/request-delete-otp`, {}),
    });
};

// ─── Delete a branch ─────────────────────────────────────────────────────────
export const useDeleteBranch = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, { id: string; otp?: string }>({
        mutationFn: async ({ id, otp }) => {
            const params = otp ? `?otp=${encodeURIComponent(otp)}` : '';
            return await api.delete(`/branches/${id}${params}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['branches'] });
        },
    });
};
