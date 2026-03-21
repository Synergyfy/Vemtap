import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// --- Helpers ---

const normalizeThread = (thread: any, isCustomer: boolean) => {
  if (!thread) return thread;
  if (thread.contact) return thread; // Already normalized or mock

  const contact = isCustomer
    ? {
        id: thread.branch?.id || thread.branchId,
        name: thread.branch?.business?.name || 'Business',
        avatar: thread.branch?.business?.logoUrl,
        isOnline: false,
      }
    : {
        id: thread.customer?.id || thread.customerId,
        name: thread.customer?.firstName 
          ? `${thread.customer.firstName} ${thread.customer.lastName || ''}`.trim() 
          : (thread.customer?.name || 'Customer'),
        avatar: thread.customer?.avatar,
        isOnline: false,
      };

  return { ...thread, contact };
};

// --- Inbox Hooks ---

export const useChatThreads = (channel: string = 'IN_HOUSE', branchId?: string, isCustomer: boolean = false) => {
  return useQuery({
    queryKey: ['chat-threads', channel, branchId, isCustomer],
    queryFn: async () => {
      const endpoint = isCustomer 
        ? `/customer/messaging/threads`
        : `/messaging/inbox/${channel}${branchId ? `?branchId=${branchId}` : ''}`;
      const data = await api.get(endpoint);
      return (data as any[]).map(t => normalizeThread(t, isCustomer));
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
    enabled: !!threadId && threadId !== 'default',
  });
};

export const useSendReply = (isCustomer: boolean = false) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, content, branchId, replyToId }: { threadId: string; content: string; branchId?: string; replyToId?: string }) => {
      const endpoint = isCustomer
        ? `/customer/messaging/threads/${threadId}/reply`
        : `/messaging/inbox/reply/${threadId}${branchId ? `?branchId=${branchId}` : ''}`;
      return api.post(endpoint, { content, replyToId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
    },
  });
};

export const useMarkThreadAsRead = (isCustomer: boolean = false) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, branchId }: { threadId: string; branchId?: string }) => {
      if (isCustomer) return Promise.resolve(null);
      if (!branchId) return Promise.resolve(null);
      return api.post(`/messaging/inbox/threads/${threadId}/read?branchId=${branchId}`, {});
    },
    onSuccess: () => {
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
