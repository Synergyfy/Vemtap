import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  BusinessForm,
  BusinessFormResponseItem,
  CreateBusinessFormRequest,
  CreateFormTemplateRequest,
  FormTemplate,
  UpdateBusinessFormRequest,
} from './types';
import {
  createMockForm,
  createMockTemplate,
  deleteMockForm,
  getMockForm,
  getMockForms,
  getMockResponses,
  getMockTemplates,
  submitMockResponse,
  updateMockForm,
} from './mock';

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
      const businessId = useAuthStore.getState().user?.businessId;
      const branchId = useAuthStore.getState().activeBranchId;
      try {
        if (businessId) {
          const response = await api.get(`/visitor-forms/business/${businessId}`);
          const forms = toList<BusinessForm>(response);
          if (forms.length > 0) return forms;
        }
      } catch {
        return getMockForms().filter(
          (form) =>
            (!businessId || form.businessId === businessId) &&
            (!branchId || branchId === 'all' || form.branchId === branchId)
        );
      }

      return getMockForms().filter(
        (form) =>
          (!businessId || form.businessId === businessId) &&
          (!branchId || branchId === 'all' || form.branchId === branchId)
      );
    },
  });

export const useBusinessForm = (id?: string) =>
  useQuery<BusinessForm, Error>({
    queryKey: ['business-forms', id],
    queryFn: async () => {
      try {
        return await api.get(`/visitor-forms/${id}`);
      } catch {
        const form = getMockForm(id);
        if (!form) throw new Error('Form not found');
        return form;
      }
    },
    enabled: !!id,
  });

export const useCreateBusinessForm = () => {
  const queryClient = useQueryClient();
  return useMutation<BusinessForm, Error, CreateBusinessFormRequest>({
    mutationFn: async (payload) => createMockForm(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-forms'] });
    },
  });
};

export const useUpdateBusinessForm = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<BusinessForm, Error, UpdateBusinessFormRequest>({
    mutationFn: async (payload) => {
      const form = updateMockForm(id, payload);
      if (!form) throw new Error('Form not found');
      return form;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-forms'] });
      queryClient.invalidateQueries({ queryKey: ['business-forms', id] });
    },
  });
};

export const useDeleteBusinessForm = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => deleteMockForm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-forms'] });
    },
  });
};

export const useBusinessFormResponses = (id?: string) =>
  useQuery<BusinessFormResponseItem[], Error>({
    queryKey: ['business-forms', id, 'responses'],
    queryFn: async () => {
      try {
        const response = await api.get(`/visitor-forms/${id}`);
        const candidate =
          response && typeof response === 'object'
            ? (response as { responses?: unknown }).responses
            : undefined;
        const rows = toList<BusinessFormResponseItem>(candidate);
        if (rows.length > 0) return rows;
      } catch {
        return getMockResponses(id);
      }

      try {
        const response = await api.get(`/business-forms/${id}/responses`);
        return toList<BusinessFormResponseItem>(response);
      } catch {
        return getMockResponses(id);
      }
    },
    enabled: !!id,
  });

export const useSubmitBusinessFormResponse = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<
    BusinessFormResponseItem,
    Error,
    Pick<BusinessFormResponseItem, 'customerName' | 'customerEmail' | 'customerPhone' | 'answers'>
  >({
    mutationFn: async (payload) => {
      try {
        return await api.post(`/visitor-forms/${id}/responses`, payload);
      } catch {
        return submitMockResponse(id, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-forms', id, 'responses'] });
    },
  });
};

export const useFormTemplates = () =>
  useQuery<FormTemplate[], Error>({
    queryKey: ['form-templates'],
    queryFn: async () => getMockTemplates(),
  });

export const useCreateFormTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation<FormTemplate, Error, CreateFormTemplateRequest>({
    mutationFn: async (payload) => createMockTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
    },
  });
};
