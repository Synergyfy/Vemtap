import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface StatusSystem {
  name: string;
  status: string;
  statusColor?: string;
  uptime: string;
  load: string;
}

export interface StatusIncident {
  id: string;
  date: string;
  title: string;
  desc: string;
  type: string;
}

export interface PublicStatusPayload {
  overall: string;
  systems: StatusSystem[];
  incidents: StatusIncident[];
  uptime90d: string;
  lastUpdated: string;
}

export const usePublicStatus = () => {
  return useQuery<PublicStatusPayload, Error>({
    queryKey: ['public-status'],
    queryFn: () => api.get('/status'),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
};

export type SystemComponentStatus = 'operational' | 'degraded' | 'outage';

export interface SystemComponent {
  id: string;
  slug: string;
  name: string;
  status: SystemComponentStatus;
  latencyMs: number | null;
  uptime90d: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type IncidentSeverity = 'minor' | 'major' | 'critical';
export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';

export interface Incident {
  id: string;
  title: string;
  description: string;
  componentSlug: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  occurredAt: string;
  resolvedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const useAdminComponents = () => {
  return useQuery<SystemComponent[], Error>({
    queryKey: ['admin-status-components'],
    queryFn: () => api.get('/admin/status/components'),
  });
};

export const useAdminIncidents = () => {
  return useQuery<Incident[], Error>({
    queryKey: ['admin-status-incidents'],
    queryFn: () => api.get('/admin/status/incidents'),
  });
};

export const useCreateComponent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SystemComponent>) => api.post('/admin/status/components', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-status-components'] });
      queryClient.invalidateQueries({ queryKey: ['public-status'] });
    },
  });
};

export const useUpdateComponent = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SystemComponent>) => api.patch(`/admin/status/components/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-status-components'] });
      queryClient.invalidateQueries({ queryKey: ['public-status'] });
    },
  });
};

export const useDeleteComponent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/status/components/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-status-components'] });
      queryClient.invalidateQueries({ queryKey: ['public-status'] });
    },
  });
};

export const useCreateIncident = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Incident>) => api.post('/admin/status/incidents', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-status-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['public-status'] });
    },
  });
};

export const useUpdateIncident = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Incident>) => api.patch(`/admin/status/incidents/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-status-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['public-status'] });
    },
  });
};

export const useDeleteIncident = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/status/incidents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-status-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['public-status'] });
    },
  });
};
