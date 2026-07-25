import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Branch, CreateBranchRequest, UpdateBranchRequest } from './types';

// ─── Fetch all branches for the authenticated user's business ─────────────────
export const useBranches = (enabled: boolean = true) => {
    return useQuery<Branch[], Error>({
        queryKey: ['branches'],
        queryFn: async () => await api.get('/branches'),
        staleTime: 1000 * 60 * 5, // cache for 5 minutes
        enabled,
    });
};

// ─── Fetch a single branch ────────────────────────────────────────────────────
export const useBranch = (id: string) => {
    return useQuery<Branch, Error>({
        queryKey: ['branches', id],
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
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['branches'] });
            queryClient.invalidateQueries({ queryKey: ['branches', id] });
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
