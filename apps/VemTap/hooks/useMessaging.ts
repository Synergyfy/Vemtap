import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useResolvedBranchParams, getReadContextParams, normalizeRole } from '@/services/visitors/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useMemo } from 'react';

// --- Helpers ---

const normalizeThread = (thread: any, isCustomer: boolean) => {
  if (!thread) return thread;
  if (thread.contact) return thread; // Already normalized or mock

  const contact = isCustomer
    ? {
        id: thread.branch?.id || thread.branchId,
        name: thread.branch?.business?.name || 'Business',
        avatar: thread.branch?.business?.logoUrl,
        phone: thread.branch?.phone || thread.branch?.business?.phone || thread.metadata?.phone,
        isOnline: false,
      }
    : {
        id: thread.customer?.id || thread.customerId,
        name: thread.customer?.firstName 
          ? `${thread.customer.firstName} ${thread.customer.lastName || ''}`.trim() 
          : (thread.customer?.name || 'Customer'),
        avatar: thread.customer?.avatar,
        phone: thread.customer?.phone || thread.customer?.phoneNumber || thread.metadata?.phone,
        isOnline: false,
      };

  return { ...thread, contact };
};

// --- Inbox Hooks ---

export const useChatThreads = (channel: string = 'IN_HOUSE', branchId?: string, isCustomer: boolean = false) => {
  const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
  const businessId = useAuthStore((state) => state.user?.businessId);
  const role = useAuthStore((state) => state.user?.role);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isStaff = ['owner', 'admin', 'manager', 'staff'].includes(normalizeRole(role));

  const contextParams = useMemo(() => 
    getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches }),
    [role, businessId, resolvedBranchId, allBranches]
  );

  return useQuery({
    queryKey: ['chat-threads', channel, businessId, role, resolvedBranchId, allBranches, isCustomer, contextParams.toString()],
    queryFn: async () => {
      let endpoint = isCustomer 
        ? `/customer/messaging/threads`
        : `/messaging/inbox/${channel}`;
      
      const searchParams = new URLSearchParams(isCustomer ? {} : contextParams);
      // For customers, if a branchId is provided, filter by it
      if (isCustomer && branchId) searchParams.append('branchId', branchId);
      
      const qs = searchParams.toString();
      const response = await api.get(`${endpoint}${qs ? `?${qs}` : ''}`);
      const data = Array.isArray(response) ? response : (response?.data || []);
      return (data as any[]).map(t => normalizeThread(t, isCustomer));
    },
    enabled: isAuthenticated && (isCustomer || isStaff),
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
    mutationFn: ({ threadId, content, branchId, replyToId, metadata }: { threadId: string; content: string; branchId?: string; replyToId?: string; metadata?: any }) => {
      const endpoint = isCustomer
        ? `/customer/messaging/threads/${threadId}/reply`
        : `/messaging/inbox/threads/${threadId}/reply${branchId ? `?branchId=${branchId}` : ''}`;
      return api.post(endpoint, { content, replyToId, metadata });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
    },
  });
};

export const useStartConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, content }: { branchId: string; content: string }) =>
      api.post('/customer/messaging/threads/start', { branchId, content }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
      if (data?.threadId) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', data.threadId] });
      }
    },
  });
};

export const useStartBranchConversation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ branchId, customerId, content, channel = 'IN_HOUSE' }: { branchId: string; customerId: string; content: string; channel?: string }) =>
            api.post('/messaging/send', { branchId, customerIds: [customerId], content, channel, audienceType: 'GROUP' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
        },
    });
};

export const useInitBranchConversation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ branchId, customerId }: { branchId: string; customerId: string }) =>
            api.post('/messaging/inbox/threads/init', { branchId, customerId }),
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
            if (data?.id) {
                queryClient.invalidateQueries({ queryKey: ['chat-messages', data.id] });
            }
        },
    });
};

export const useMarkThreadAsRead = (isCustomer: boolean = false) => {
  const queryClient = useQueryClient();
  const { activeBranchId } = useActiveBranch();
  
  return useMutation({
    mutationFn: ({ threadId, branchId }: { threadId: string; branchId?: string }) => {
      if (isCustomer) return Promise.resolve(null);
      
      const targetBranchId = branchId || activeBranchId;
      const qs = targetBranchId && targetBranchId !== 'all' ? `?branchId=${targetBranchId}` : '';
      
      return api.post(`/messaging/inbox/threads/${threadId}/read${qs}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
    },
  });
};

export const useDeleteThread = (isCustomer: boolean = false) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, branchId }: { threadId: string; branchId?: string }) => {
      const endpoint = isCustomer
        ? `/customer/messaging/threads/${threadId}`
        : `/messaging/inbox/threads/${threadId}${branchId ? `?branchId=${branchId}` : ''}`;
      return api.delete(endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
    },
  });
};

export const useDeleteMessage = (isCustomer: boolean = false) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId, threadId, branchId }: { messageId: string; threadId: string; branchId?: string }) => {
      // Mock deletion as requested: just delay 300ms to simulate network request
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true };
    },
    onSuccess: (_, variables) => {
      // Optimistically update the query cache to remove the message from the UI instantly
      queryClient.setQueryData(
        ['chat-messages', variables.threadId, variables.branchId, isCustomer], 
        (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData;
          return oldData.filter((msg: any) => msg.id !== variables.messageId);
        }
      );
    },
  });
};

// --- Template Hooks ---

export const useChatTemplates = (branchId?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['chat-templates', branchId],
    queryFn: () => api.get(`/messaging/templates${branchId ? `?branchId=${branchId}` : ''}`),
    enabled: !!branchId && enabled,
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
