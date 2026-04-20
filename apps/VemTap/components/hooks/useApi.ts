import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, foldersApi, qrCodesApi, statsApi, paymentsApi } from '../services/api';
import type { CreateFolderDto, BackendQRCode, CreateQRCodeDto } from '../types/api';
import toast from 'react-hot-toast';

// --- AUTH HOOKS ---

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getMe,
    retry: false, // Do not retry if unauthorized
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data);
    },
  });
};

export const useSignup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.signup,
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(['currentUser'], null);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
};

// --- FOLDERS HOOKS ---

export const useFolders = () => {
  return useQuery({
    queryKey: ['folders'],
    queryFn: foldersApi.getFolders,
  });
};

export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFolderDto) => foldersApi.createFolder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => foldersApi.deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['qrCodes'] }); // since qrs might be moved or orphaned
    },
  });
};

// --- QR CODES HOOKS ---

export const useQRCodes = (params?: any) => {
  return useQuery({
    queryKey: ['qrCodes', params],
    queryFn: () => qrCodesApi.getQRCodes(params),
  });
};

export const useQRCode = (id: string) => {
  return useQuery({
    queryKey: ['qrCode', id],
    queryFn: () => qrCodesApi.getQRCode(id),
    enabled: !!id,
  });
};

export const useScans = (id: string) => {
  return useQuery({
    queryKey: ['scans', id],
    queryFn: () => qrCodesApi.getScans(id),
    enabled: !!id,
  });
};

export const useCreateQRCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateQRCodeDto) => qrCodesApi.createQRCode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qrCodes'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
};

export const useUpdateQRCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BackendQRCode> }) => qrCodesApi.updateQRCode(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['qrCodes'] });
      queryClient.invalidateQueries({ queryKey: ['qrCode', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
};

export const useDuplicateQRCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => qrCodesApi.duplicateQRCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qrCodes'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useDeleteQRCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => qrCodesApi.deleteQRCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qrCodes'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
};

// --- STATS HOOKS ---

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['stats'],
    queryFn: statsApi.getDashboardStats,
  });
};

// --- PAYMENTS HOOKS ---

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => paymentsApi.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Subscription cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
    },
  });
};
export const useInitializePayment = () => {
  return useMutation({
    mutationFn: (data: { planId: string; interval: string }) => paymentsApi.initialize(data),
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to initialize payment');
    },
  });
};
