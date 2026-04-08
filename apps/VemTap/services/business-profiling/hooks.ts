import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessProfilingApi, BusinessProfile, BusinessProfileFormData } from '@/lib/api/business-profiling';

const KEYS = {
  all: ['business-profiles'] as const,
  list: (filters: any) => [...KEYS.all, 'list', filters] as const,
  detail: (id: string) => [...KEYS.all, 'detail', id] as const,
};

export const useBusinessProfiles = (filters: { search?: string; priority?: string; status?: string } = {}) => {
  return useQuery({
    queryKey: KEYS.list(filters),
    queryFn: () => businessProfilingApi.getAll(filters),
  });
};

export const useBusinessProfile = (id: string) => {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => businessProfilingApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateBusinessProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BusinessProfileFormData) => businessProfilingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
};

export const useUpdateBusinessProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BusinessProfileFormData> }) => businessProfilingApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
      queryClient.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
};
