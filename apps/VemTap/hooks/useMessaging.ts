import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Channel } from '@/lib/store/useChatStore';

// --- Inbox Hooks ---

export const useChatThreads = (channel: string = 'IN_HOUSE', branchId?: string) => {
  return useQuery({
    queryKey: ['chat-threads', channel, branchId],
    queryFn: () => api.get(`/messaging/inbox/${channel}${branchId ? `?branchId=${branchId}` : ''}`),
  });
};

export const useThreadMessages = (threadId: string, branchId?: string) => {
  return useQuery({
    queryKey: ['chat-messages', threadId],
    queryFn: () => api.get(`/messaging/inbox/threads/${threadId}${branchId ? `?branchId=${branchId}` : ''}`),
    enabled: !!threadId,
  });
};

export const useSendReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, content, branchId }: { threadId: string; content: string; branchId?: string }) =>
      api.post(`/messaging/inbox/threads/${threadId}/reply`, { content, branchId }),
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

export const useChatAutomation = () => {
  return useQuery({
    queryKey: ['chat-automation'],
    queryFn: () => api.get('/messaging/chat/settings/automation'),
  });
};

export const useUpdateChatAutomation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.patch('/messaging/chat/settings/automation', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-automation'] });
    },
  });
};

export const useAddFaqKeyword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/messaging/chat/settings/automation/faq', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-automation'] });
    },
  });
};

export const useUpdateFaqKeyword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      api.patch(`/messaging/chat/settings/automation/faq/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-automation'] });
    },
  });
};

export const useDeleteFaqKeyword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/messaging/chat/settings/automation/faq/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-automation'] });
    },
  });
};

// --- Category Hooks ---

export const useChatCategories = () => {
  return useQuery({
    queryKey: ['chat-categories'],
    queryFn: () => api.get('/messaging/chat/settings/categories'),
  });
};

export const useCreateChatCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/messaging/chat/settings/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-categories'] });
    },
  });
};

export const useUpdateChatCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      api.patch(`/messaging/chat/settings/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-categories'] });
    },
  });
};

export const useDeleteChatCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/messaging/chat/settings/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-categories'] });
    },
  });
};
