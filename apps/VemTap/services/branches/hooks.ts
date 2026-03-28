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

// ─── Delete a branch ─────────────────────────────────────────────────────────
export const useDeleteBranch = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: async (id) => await api.delete(`/branches/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['branches'] });
        },
    });
};
