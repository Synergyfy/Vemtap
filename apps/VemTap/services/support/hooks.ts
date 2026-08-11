import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface FaqPage {
  id: string;
  title: string;
  path: string;
  summary: string;
  thumbnail: string | null;
  order: number;
}

export interface FaqSection {
  id: string;
  title: string;
  order: number;
  pages: FaqPage[];
}

export interface FaqCategory {
  id: string;
  title: string;
  order: number;
  sections: FaqSection[];
}

export const useSupportFaqs = () => {
  return useQuery<{ categories: FaqCategory[] }, Error>({
    queryKey: ['support-faqs'],
    queryFn: () => api.get('/support/faqs'),
  });
};

export const useSupportTickets = (params?: { type?: string; isAssigned?: boolean; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['support-tickets', params],
    queryFn: () => api.get('/support/admin/tickets', { params }),
  });
};

export const useUserSupportTickets = (page: number = 1, limit: number = 10, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['user-support-tickets', page, limit],
    queryFn: () => api.get('/support/tickets', { params: { page, limit } }),
    enabled,
  });
};

export const useSupportTicket = (id: string, isAdmin: boolean = false) => {
  return useQuery({
    queryKey: ['support-ticket', id],
    queryFn: () => api.get(isAdmin ? `/support/admin/tickets/${id}` : `/support/tickets/${id}`),
    enabled: !!id,
  });
};

export const useEscalateChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { initialMessage?: string; guestName?: string; guestEmail?: string; sessionId?: string }) => 
      api.post('/support/escalate', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-support-tickets'] });
    },
  });
};

export const useSendSupportMessage = (ticketId: string, isAdmin: boolean = false) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => 
      api.post(isAdmin ? `/support/admin/tickets/${ticketId}/message` : `/support/tickets/${ticketId}/message`, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
    },
  });
};

export interface TicketAttachmentInput {
  url: string;
  name: string;
  mimeType: string;
  size: number;
}

export const useAddTicketAttachments = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { attachments: TicketAttachmentInput[]; message?: string }) =>
      api.post(`/support/tickets/${ticketId}/attachments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['user-support-tickets'] });
    },
  });
};

export const useUpdateTicketStatus = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => api.post(`/support/admin/tickets/${ticketId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
};

export const useAssignTicket = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => api.post(`/support/admin/tickets/${ticketId}/assign`, { agentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
};

export const useCreateSupportTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { subject: string; message: string; category?: string; priority?: string }) =>
      api.post('/support/tickets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
};

