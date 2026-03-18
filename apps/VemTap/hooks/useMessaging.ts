import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// --- Inbox Hooks ---

export const useChatThreads = (channel: string = 'IN_HOUSE', branchId?: string, isCustomer: boolean = false) => {
  return useQuery({
    queryKey: ['chat-threads', channel, branchId, isCustomer],
    queryFn: () => {
      const endpoint = isCustomer 
        ? `/customer/messaging/threads`
        : `/messaging/inbox/${channel}${branchId ? `?branchId=${branchId}` : ''}`;
      return api.get(endpoint);
    },
    enabled: isCustomer || !!branchId || channel === 'IN_HOUSE',
  });
};

export const useThreadMessages = (threadId: string, branchId?: string, isCustomer: boolean = false) => {
  return useQuery({
    queryKey: ['chat-messages', threadId, branchId, isCustomer],
    queryFn: () => {
      const endpoint = isCustomer
        ? `/customer/messaging/threads/${threadId}`
        : `/messaging/inbox/threads/${threadId}${branchId ? `?branchId=${branchId}` : ''}`;
      return api.get(endpoint);
    },
    enabled: !!threadId,
  });
};

export const useSendReply = (isCustomer: boolean = false) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, content, branchId }: { threadId: string; content: string; branchId?: string }) => {
      const endpoint = isCustomer
        ? `/customer/messaging/threads/${threadId}/reply`
        : `/messaging/inbox/threads/${threadId}/reply${branchId ? `?branchId=${branchId}` : ''}`;
      return api.post(endpoint, { content, branchId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
    },
  });
};

// --- Template Hooks ---

export const useChatTemplates = (branchId?: string) => {
  return useQuery({
    queryKey: ['chat-templates', branchId],
    queryFn: () => api.get(`/messaging/templates${branchId ? `?branchId=${branchId}` : ''}`),
    enabled: !!branchId,
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/messaging/templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-templates'] });
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/messaging/templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-templates'] });
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/messaging/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-templates'] });
    },
  });
};

// --- Settings Hooks ---

export const useChatAutomation = (branchId?: string) => {
  return useQuery({
    queryKey: ['chat-automation', branchId],
    queryFn: () => api.get(`/messaging/chat/settings/automation${branchId ? `?branchId=${branchId}` : ''}`),
    enabled: !!branchId,
  });
};

export const useUpdateChatAutomation = (branchId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.patch(`/messaging/chat/settings/automation${branchId ? `?branchId=${branchId}` : ''}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-automation', branchId] });
    },
  });
};

export const useAddFaqKeyword = (branchId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post(`/messaging/chat/settings/automation/faq${branchId ? `?branchId=${branchId}` : ''}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-automation', branchId] });
    },
  });
};

export const useUpdateFaqKeyword = (branchId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      api.patch(`/messaging/chat/settings/automation/faq/${id}${branchId ? `?branchId=${branchId}` : ''}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-automation', branchId] });
    },
  });
};

export const useDeleteFaqKeyword = (branchId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/messaging/chat/settings/automation/faq/${id}${branchId ? `?branchId=${branchId}` : ''}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-automation', branchId] });
    },
  });
};

// --- Category Hooks ---

export const useChatCategories = (branchId?: string) => {
  return useQuery({
    queryKey: ['chat-categories', branchId],
    queryFn: () => api.get(`/messaging/chat/settings/categories${branchId ? `?branchId=${branchId}` : ''}`),
    enabled: !!branchId,
  });
};

export const useCreateChatCategory = (branchId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post(`/messaging/chat/settings/categories${branchId ? `?branchId=${branchId}` : ''}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-categories', branchId] });
    },
  });
};

export const useUpdateChatCategory = (branchId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      api.patch(`/messaging/chat/settings/categories/${id}${branchId ? `?branchId=${branchId}` : ''}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-categories', branchId] });
    },
  });
};

export const useDeleteChatCategory = (branchId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/messaging/chat/settings/categories/${id}${branchId ? `?branchId=${branchId}` : ''}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-categories', branchId] });
    },
  });
};
