import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  BusinessForm,
  BusinessFormResponseItem,
  CreateBusinessFormRequest,
  UpdateBusinessFormRequest,
} from './types';

const toList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const maybeData = (payload as { data?: unknown }).data;
    if (Array.isArray(maybeData)) return maybeData as T[];
  }
  return [];
};

export const useBusinessForms = () =>
  useQuery<BusinessForm[], Error>({
    queryKey: ['business-forms'],
    queryFn: async () => {
      const response = await api.get('/business-forms');
      return toList<BusinessForm>(response);
    },
  });

export const useBusinessForm = (id?: string) =>
  useQuery<BusinessForm, Error>({
    queryKey: ['business-forms', id],
    queryFn: async () => api.get(`/business-forms/${id}`),
    enabled: !!id,
  });

export const useCreateBusinessForm = () => {
  const queryClient = useQueryClient();
  return useMutation<BusinessForm, Error, CreateBusinessFormRequest>({
    mutationFn: async (payload) => api.post('/business-forms', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-forms'] });
    },
  });
};

export const useUpdateBusinessForm = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<BusinessForm, Error, UpdateBusinessFormRequest>({
    mutationFn: async (payload) => api.patch(`/business-forms/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-forms'] });
      queryClient.invalidateQueries({ queryKey: ['business-forms', id] });
    },
  });
};

export const useDeleteBusinessForm = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => api.delete(`/business-forms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-forms'] });
    },
  });
};

export const useBusinessFormResponses = (id?: string) =>
  useQuery<BusinessFormResponseItem[], Error>({
    queryKey: ['business-forms', id, 'responses'],
    queryFn: async () => {
      const response = await api.get(`/business-forms/${id}/responses`);
      return toList<BusinessFormResponseItem>(response);
    },
    enabled: !!id,
  });
