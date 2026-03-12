import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  BusinessForm,
  BusinessFormResponseItem,
  CreateBusinessFormRequest,
  CreateFormTemplateRequest,
  FormTemplate,
  SubmitBusinessFormResponseRequest,
  UpdateBusinessFormRequest,
} from './types';

const toList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const objectPayload = payload as {
      data?: unknown;
      items?: unknown;
      forms?: unknown;
      results?: unknown;
    };
    if (Array.isArray(objectPayload.data)) return objectPayload.data as T[];
    if (Array.isArray(objectPayload.items)) return objectPayload.items as T[];
    if (Array.isArray(objectPayload.forms)) return objectPayload.forms as T[];
    if (Array.isArray(objectPayload.results)) return objectPayload.results as T[];
  }
  return [];
};

type BusinessFormsQuery = {
  branchId?: string;
  allBranches?: boolean;
};

export const useBusinessForms = (params: BusinessFormsQuery = {}) =>
  useQuery<BusinessForm[], Error>({
    queryKey: ['business-forms', params.branchId || 'all', params.allBranches ? 'all-branches' : 'scoped'],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (params.branchId) query.set('branchId', params.branchId);
      if (params.allBranches) query.set('allBranches', 'true');
      const suffix = query.toString();
      const response = await api.get(`/business-forms${suffix ? `?${suffix}` : ''}`);
      return toList<BusinessForm>(response);
    },
  });

export const useBusinessForm = (id?: string, params: BusinessFormsQuery = {}) =>
  useQuery<BusinessForm, Error>({
    queryKey: ['business-forms', id, params.branchId || 'all', params.allBranches ? 'all-branches' : 'scoped'],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (params.branchId) query.set('branchId', params.branchId);
      if (params.allBranches) query.set('allBranches', 'true');
      const suffix = query.toString();
      return await api.get(`/business-forms/${id}${suffix ? `?${suffix}` : ''}`);
    },
    enabled: !!id,
  });

export const usePublicBusinessForm = (id?: string) =>
  useQuery<BusinessForm, Error>({
    queryKey: ['public-business-form', id],
    queryFn: async () => {
      return await api.get(`/visitor-forms/code/${id}`);
    },
    enabled: !!id,
  });

export const useCreateBusinessForm = () => {
  const queryClient = useQueryClient();
  return useMutation<BusinessForm, Error, CreateBusinessFormRequest>({
    mutationFn: async (payload) => {
      return await api.post('/business-forms', payload);
    },
    onSuccess: (created) => {
      queryClient.setQueryData<BusinessForm[]>(['business-forms'], (previous) => {
        if (!previous) return created ? [created] : [];
        if (!created?.id) return previous;
        if (previous.some((item) => item.id === created.id)) return previous;
        return [created, ...previous];
      });
      queryClient.invalidateQueries({ queryKey: ['business-forms'] });
    },
  });
};

export const useUpdateBusinessForm = (id?: string) => {
  const queryClient = useQueryClient();
  return useMutation<BusinessForm, Error, { id?: string; payload: UpdateBusinessFormRequest }>({
    mutationFn: async ({ id: mutationId, payload }) => {
      const targetId = mutationId || id;
      if (!targetId) throw new Error('No form ID provided');
      return await api.patch(`/business-forms/${targetId}`, payload);
    },
    onSuccess: (_, { id: mutationId }) => {
      const targetId = mutationId || id;
      queryClient.invalidateQueries({ queryKey: ['business-forms'] });
      if (targetId) queryClient.invalidateQueries({ queryKey: ['business-forms', targetId] });
    },
  });
};

export const useDeleteBusinessForm = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; branchId?: string }>({
    mutationFn: async ({ id, branchId }) => {
      const query = new URLSearchParams();
      if (branchId) query.set('branchId', branchId);
      const suffix = query.toString();
      await api.delete(`/business-forms/${id}${suffix ? `?${suffix}` : ''}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-forms'] });
    },
  });
};

export const useBusinessFormResponses = (id?: string, branchId?: string) =>
  useQuery<BusinessFormResponseItem[], Error>({
    queryKey: ['business-forms', id, 'responses', branchId || 'any'],
    queryFn: async () => {
      try {
        const response = await api.get(`/business-forms/${id}/responses${branchId ? `?branchId=${branchId}` : ''}`);
        return toList<BusinessFormResponseItem>(response);
      } catch (err) {
        // Fallback to visitor-forms responses if business-forms fails
        const response = await api.get(`/visitor-forms/code/${id}`);
        const candidate =
          response && typeof response === 'object'
            ? (response as { responses?: unknown }).responses
            : undefined;
        return toList<BusinessFormResponseItem>(candidate);
      }
    },
    enabled: !!id,
  });

export const useSubmitBusinessFormResponse = () => {
  const queryClient = useQueryClient();
  return useMutation<BusinessFormResponseItem, Error, { id: string; payload: SubmitBusinessFormResponseRequest }>({
    mutationFn: async ({ id, payload }) => {
      return await api.post(`/visitor-forms/${id}/responses`, payload);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['business-forms', id, 'responses'] });
    },
  });
};

export const useFormTemplates = () =>
  useQuery<FormTemplate[], Error>({
    queryKey: ['form-templates'],
    queryFn: async () => {
      const response = await api.get('/form-templates');
      return toList<FormTemplate>(response);
    },
  });

export const useFormsByDevice = (deviceCode: string) =>
  useQuery<BusinessForm[], Error>({
    queryKey: ['forms-by-device', deviceCode],
    queryFn: async () => {
      return await api.get(`/visitor-forms/device/${deviceCode}`);
    },
    enabled: !!deviceCode,
  });

export const useCreateFormTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation<FormTemplate, Error, CreateFormTemplateRequest>({
    mutationFn: async (payload) => {
      return await api.post('/form-templates', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
    },
  });
};

