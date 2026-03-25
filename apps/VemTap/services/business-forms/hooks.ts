import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import type {
  BusinessForm,
  BusinessFormResponseItem,
  CreateBusinessFormRequest,
  CreateFormTemplateRequest,
  FormTemplate,
  SubmitBusinessFormResponseRequest,
  UpdateBusinessFormRequest,
} from './types';

const mapBusinessForm = (f: any): BusinessForm => {
  if (!f) return f;
  return {
    ...f,
    uniqueCode: f.uniqueCode || f.key || f.slug || f.formCode || '',
  };
};

const toList = <T,>(payload: unknown): T[] => {
  let items: T[] = [];
  if (Array.isArray(payload)) {
    items = payload as T[];
  } else if (payload && typeof payload === 'object') {
    const objectPayload = payload as {
      data?: unknown;
      items?: unknown;
      forms?: unknown;
      results?: unknown;
    };
    if (Array.isArray(objectPayload.data)) items = objectPayload.data as T[];
    else if (Array.isArray(objectPayload.items)) items = objectPayload.items as T[];
    else if (Array.isArray(objectPayload.forms)) items = objectPayload.forms as T[];
    else if (Array.isArray(objectPayload.results)) items = objectPayload.results as T[];
  }

  // Specifically map BusinessForm objects if T is BusinessForm
  return items.map((item) => {
    if (item && typeof item === 'object' && ('title' in item || 'uniqueCode' in item)) {
      return mapBusinessForm(item) as unknown as T;
    }
    return item;
  });
};

type BusinessFormsQuery = {
  branchId?: string;
  allBranches?: boolean;
};

export const useBusinessForms = (params: BusinessFormsQuery = {}) => {
  const { activeBranchId, isAllBranches } = useActiveBranch();
  const resolvedBranchId = params.branchId || activeBranchId;
  const resolvedAllBranches = params.allBranches !== undefined ? params.allBranches : (params.branchId ? false : isAllBranches);

  return useQuery<BusinessForm[], Error>({
    queryKey: ['business-forms', resolvedBranchId || 'all', resolvedAllBranches ? 'all-branches' : 'scoped'],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (resolvedBranchId) query.set('branchId', resolvedBranchId);
      if (resolvedAllBranches) query.set('allBranches', 'true');
      const suffix = query.toString();
      const response = await api.get(`/business-forms${suffix ? `?${suffix}` : ''}`);
      return toList<BusinessForm>(response);
    },
  });
};

export const useBusinessForm = (id?: string, params: BusinessFormsQuery = {}) => {
  const { activeBranchId, isAllBranches } = useActiveBranch();
  const resolvedBranchId = params.branchId || activeBranchId;
  const resolvedAllBranches = params.allBranches !== undefined ? params.allBranches : (params.branchId ? false : isAllBranches);

  return useQuery<BusinessForm, Error>({
    queryKey: ['business-forms', id, resolvedBranchId || 'all', resolvedAllBranches ? 'all-branches' : 'scoped'],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (resolvedBranchId) query.set('branchId', resolvedBranchId);
      if (resolvedAllBranches) query.set('allBranches', 'true');
      const suffix = query.toString();
      const response = await api.get(`/business-forms/${id}${suffix ? `?${suffix}` : ''}`);
      return mapBusinessForm(response);
    },
    enabled: !!id,
  });
};

export const usePublicBusinessForm = (id?: string) =>
  useQuery<BusinessForm, Error>({
    queryKey: ['public-business-form', id],
    queryFn: async () => {
      try {
        const response = await api.get(`/visitor-forms/code/${id}`);
        return mapBusinessForm(response);
      } catch {
        const response = await api.get(`/visitor-forms/public/${id}`);
        return mapBusinessForm(response);
      }
    },
    enabled: !!id,
  });

/** Fetch public business info (name, logo, branches) by businessId */
export interface PublicBusinessInfo {
  id: string;
  name: string;
  logoUrl?: string;
  branches?: Array<{ id: string; name: string; logoUrl?: string; address?: string }>;
}

export const usePublicBusinessInfo = (businessId?: string) =>
  useQuery<PublicBusinessInfo | null, Error>({
    queryKey: ['public-business-info', businessId],
    queryFn: async (): Promise<PublicBusinessInfo | null> => {
      if (!businessId) return null;
      // Try public endpoint first, then fallback
      const endpoints = [
        `/businesses/${businessId}/public`,
        `/businesses/${businessId}`,
      ];
      for (const endpoint of endpoints) {
        try {
          const data = await api.get(endpoint);
          if (data && typeof data === 'object' && (data as any).name) {
            return data as PublicBusinessInfo;
          }
        } catch {
          // try next endpoint
        }
      }
      return null;
    },
    enabled: !!businessId,
    staleTime: 1000 * 60 * 10,
    retry: false,
  });

/** Fetch public branch info by branchId */
export interface PublicBranchInfo {
  id: string;
  name: string;
  logoUrl?: string;
  address?: string;
}

export const usePublicBranchInfo = (branchId?: string) =>
  useQuery<PublicBranchInfo | null, Error>({
    queryKey: ['public-branch-info', branchId],
    queryFn: async (): Promise<PublicBranchInfo | null> => {
      if (!branchId) return null;
      const endpoints = [
        `/branches/${branchId}/public`,
        `/branches/${branchId}`,
      ];
      for (const endpoint of endpoints) {
        try {
          const data = await api.get(endpoint);
          if (data && typeof data === 'object' && (data as any).name) {
            return data as PublicBranchInfo;
          }
        } catch {
          // try next
        }
      }
      return null;
    },
    enabled: !!branchId,
    staleTime: 1000 * 60 * 10,
    retry: false,
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

export const useBusinessFormResponses = (id?: string, params: BusinessFormsQuery = {}) => {
  const { activeBranchId, isAllBranches } = useActiveBranch();
  const resolvedBranchId = params.branchId || activeBranchId;
  const resolvedAllBranches = params.allBranches !== undefined ? params.allBranches : (params.branchId ? false : isAllBranches);

  return useQuery<BusinessFormResponseItem[], Error>({
    queryKey: ['business-forms', id, 'responses', resolvedBranchId || 'any', resolvedAllBranches ? 'all' : 'scoped'],
    queryFn: async () => {
      try {
        const query = new URLSearchParams();
        if (resolvedBranchId) query.set('branchId', resolvedBranchId);
        if (resolvedAllBranches) query.set('allBranches', 'true');
        const suffix = query.toString();
        const response = await api.get(`/business-forms/${id}/responses${suffix ? `?${suffix}` : ''}`);
        return toList<BusinessFormResponseItem>(response);
      } catch (err) {
        // Fallback to visitor-forms responses if business-forms fails
        try {
          const response = await api.get(`/visitor-forms/code/${id}`);
          const candidate =
            response && typeof response === 'object'
              ? (response as { responses?: unknown }).responses
              : undefined;
          return toList<BusinessFormResponseItem>(candidate);
        } catch {
          const response = await api.get(`/visitor-forms/${id}`);
          const candidate =
            response && typeof response === 'object'
              ? (response as { responses?: unknown }).responses
              : undefined;
          return toList<BusinessFormResponseItem>(candidate);
        }
      }
    },
    enabled: !!id,
  });
};

export const useSubmitBusinessFormResponse = () => {
  const queryClient = useQueryClient();
  return useMutation<BusinessFormResponseItem, Error, { id: string; payload: SubmitBusinessFormResponseRequest }>({
    mutationFn: async ({ id, payload }) => {
      try {
        return await api.post(`/visitor-forms/code/${id}/responses`, payload);
      } catch {
        return await api.post(`/visitor-forms/${id}/responses`, payload);
      }
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
      const response = await api.get(`/visitor-forms/device/${deviceCode}`);
      return toList<BusinessForm>(response);
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
export const useUpdateBranchFormSettings = (branchId?: string) => {
  const queryClient = useQueryClient();
  const { activeBranchId } = useActiveBranch();
  const targetBranchId = branchId || activeBranchId;

  return useMutation<any, Error, any>({
    mutationFn: async (payload) => {
      if (!targetBranchId) throw new Error('No branch ID provided');
      return await api.patch(`/business-forms/branch-settings/${targetBranchId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      if (targetBranchId) {
        queryClient.invalidateQueries({ queryKey: ['branches', targetBranchId] });
        queryClient.invalidateQueries({ queryKey: ['public-branch-info', targetBranchId] });
      }
    },
  });
};
