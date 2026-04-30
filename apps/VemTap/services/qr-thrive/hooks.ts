import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useQrThriveStore } from '@/store/useQrThriveStore';
import { qrThriveApi, QrThriveApiError } from './api';
import type {
  QrThriveQRCode,
  CreateQrThriveQRDto,
  UpdateQrThriveQRDto,
  QrThriveScan,
  QrThriveFolder,
  CreateQrThriveFolderDto,
  QrThriveStats,
  QrThrivePlan,
  QrThriveListParams,
  ProvisionUserDto,
  MagicLinkResponse,
  QrThriveLead,
} from './types';

// ============================================
// USER PROVISIONING HOOKS
// ============================================

/**
 * Hook to provision a user in QR-Thrive via VemTap backend
 */
export const useProvisionQrThriveUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { setQrThriveUser, setProvisioning, setProvisionError, setLastProvisionAttempt } = useQrThriveStore();

  return useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      setProvisioning(true);
      setProvisionError(null);

      try {
        const response = await qrThriveApi.provisionUser();
        // The VemTap backend returns { qrThriveUserId: string }
        setQrThriveUser(response.qrThriveUserId, user.email);
        setLastProvisionAttempt(new Date().toISOString());
        
        return response;
      } catch (error) {
        const message = error instanceof Error 
          ? error.message 
          : 'Failed to provision user in QR-Thrive';
        setProvisionError(message);
        throw error;
      } finally {
        setProvisioning(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-user-mapping'] });
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-codes'] });
    },
  });
};

/**
 * Hook to check if current user is mapped to QR-Thrive
 */
export const useQrThriveMappingStatus = () => {
  const { isAuthenticated } = useAuthStore();
  const { setQrThriveUser, setProvisioned } = useQrThriveStore();

  return useQuery({
    queryKey: ['qr-thrive-user-mapping'],
    queryFn: async () => {
      const response = await qrThriveApi.getUserMapping();
      if (response.qrThriveUserId) {
        setQrThriveUser(response.qrThriveUserId);
      } else {
        setProvisioned(false);
      }
      return response;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Hook to check if user needs provisioning
 */
export const useQrThriveProvisioningStatus = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { isProvisioned, isProvisioning, qrThriveUserId, provisionError, needsProvision } = useQrThriveStore();
  
  // Use the mapping status hook to ensure store is up to date
  const { isLoading: isCheckingMapping } = useQrThriveMappingStatus();

  return {
    isAuthenticated,
    hasVemtapUser: !!user,
    isProvisioned,
    isProvisioning: isProvisioning || isCheckingMapping,
    qrThriveUserId,
    provisionError,
    needsProvision: needsProvision(),
  };
};
/**
 * Hook to generate a magic link for SSO into QR-Thrive
 */
export const useGenerateMagicLink = () => {
  const { setMagicLink, clearMagicLink } = useQrThriveStore();
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();

  return useMutation({
    mutationFn: async () => {
      if (!isProvisioned || !qrThriveUserId) {
        throw new Error('User not provisioned in QR-Thrive');
      }

      clearMagicLink();
      const response = await qrThriveApi.generateMagicLink(qrThriveUserId);
      setMagicLink(response.token, response.expiresAt, response.url);
      
      return response;
    },
  });
};

// ============================================
// QR CODES HOOKS
// ============================================

/**
 * Hook to fetch all QR codes for the current user
 */
export const useQrThriveCodes = (params?: QrThriveListParams) => {
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();

  return useQuery({
    queryKey: ['qr-thrive-codes', qrThriveUserId, params],
    queryFn: () => qrThriveApi.getQRCodes(qrThriveUserId!, params),
    enabled: !!qrThriveUserId && isProvisioned,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch a single QR code by ID
 */
export const useQrThriveCode = (qrId: string | null) => {
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();

  return useQuery({
    queryKey: ['qr-thrive-code', qrId],
    queryFn: () => qrThriveApi.getQRCode(qrThriveUserId!, qrId!),
    enabled: !!qrThriveUserId && isProvisioned && !!qrId,
  });
};

/**
 * Hook to create a new QR code
 */
export const useCreateQrThriveCode = () => {
  const queryClient = useQueryClient();
  const { qrThriveUserId } = useQrThriveStore();

  return useMutation({
    mutationFn: (data: CreateQrThriveQRDto) => {
      if (!qrThriveUserId) {
        throw new Error('User not provisioned in QR-Thrive');
      }
      return qrThriveApi.createQRCode(qrThriveUserId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-codes'] });
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-stats'] });
    },
  });
};

/**
 * Hook to update an existing QR code
 */
export const useUpdateQrThriveCode = () => {
  const queryClient = useQueryClient();
  const { qrThriveUserId } = useQrThriveStore();

  return useMutation({
    mutationFn: ({ qrId, data }: { qrId: string; data: UpdateQrThriveQRDto }) => {
      if (!qrThriveUserId) {
        throw new Error('User not provisioned in QR-Thrive');
      }
      return qrThriveApi.updateQRCode(qrThriveUserId, qrId, data);
    },
    onSuccess: (_, { qrId }) => {
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-codes'] });
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-code', qrId] });
    },
  });
};

/**
 * Hook to delete a QR code
 */
export const useDeleteQrThriveCode = () => {
  const queryClient = useQueryClient();
  const { qrThriveUserId } = useQrThriveStore();

  return useMutation({
    mutationFn: (qrId: string) => {
      if (!qrThriveUserId) {
        throw new Error('User not provisioned in QR-Thrive');
      }
      return qrThriveApi.deleteQRCode(qrThriveUserId, qrId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-codes'] });
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-stats'] });
    },
  });
};

/**
 * Hook to duplicate a QR code
 */
export const useDuplicateQrThriveCode = () => {
  const queryClient = useQueryClient();
  const { qrThriveUserId } = useQrThriveStore();

  return useMutation({
    mutationFn: (qrId: string) => {
      if (!qrThriveUserId) {
        throw new Error('User not provisioned in QR-Thrive');
      }
      return qrThriveApi.duplicateQRCode(qrThriveUserId, qrId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-codes'] });
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-stats'] });
    },
  });
};

/**
 * Hook to archive/unarchive a QR code
 */
export const useSetQrThriveCodeStatus = () => {
  const queryClient = useQueryClient();
  const { qrThriveUserId } = useQrThriveStore();

  return useMutation({
    mutationFn: ({ qrId, status }: { qrId: string; status: 'active' | 'archived' }) => {
      if (!qrThriveUserId) {
        throw new Error('User not provisioned in QR-Thrive');
      }
      return qrThriveApi.setQRCodeStatus(qrThriveUserId, qrId, status);
    },
    onSuccess: (_, { qrId }) => {
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-codes'] });
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-code', qrId] });
    },
  });
};

/**
 * Hook to toggle featured status on UBL
 */
export const useToggleUbl = () => {
  const queryClient = useQueryClient();
  const { qrThriveUserId } = useQrThriveStore();

  return useMutation({
    mutationFn: ({ qrId, isFeatured }: { qrId: string; isFeatured: boolean }) => {
      if (!qrThriveUserId) {
        throw new Error('User not provisioned in QR-Thrive');
      }
      return qrThriveApi.toggleUbl(qrThriveUserId, qrId, isFeatured);
    },
    onSuccess: (_, { qrId }) => {
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-codes'] });
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-code', qrId] });
    },
  });
};

// ============================================
// ANALYTICS HOOKS
// ============================================

/**
 * Hook to fetch scan analytics for a QR code
 */
export const useQrThriveScans = (qrId: string | null) => {
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();

  return useQuery({
    queryKey: ['qr-thrive-scans', qrId],
    queryFn: () => qrThriveApi.getScans(qrThriveUserId!, qrId!),
    enabled: !!qrThriveUserId && isProvisioned && !!qrId,
  });
};

/**
 * Hook to fetch form responses for a QR code
 */
export const useQrThriveResponses = (qrId: string | null) => {
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();

  return useQuery({
    queryKey: ['qr-thrive-responses', qrId],
    queryFn: () => qrThriveApi.getResponses(qrThriveUserId!, qrId!),
    enabled: !!qrThriveUserId && isProvisioned && !!qrId,
  });
};

/**
 * Hook to fetch all leads for a branch
 */
export const useQrThriveLeads = (branchId: string | null) => {
  return useQuery({
    queryKey: ['qr-thrive-leads', branchId],
    queryFn: () => qrThriveApi.getLeads(branchId!),
    enabled: !!branchId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch dashboard statistics
 */
export const useQrThriveStats = () => {
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();

  return useQuery({
    queryKey: ['qr-thrive-stats'],
    queryFn: () => qrThriveApi.getStats(qrThriveUserId!),
    enabled: !!qrThriveUserId && isProvisioned,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// ============================================
// FOLDERS HOOKS
// ============================================

/**
 * Hook to fetch all folders
 */
export const useQrThriveFolders = () => {
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();

  return useQuery({
    queryKey: ['qr-thrive-folders'],
    queryFn: () => qrThriveApi.getFolders(qrThriveUserId!),
    enabled: !!qrThriveUserId && isProvisioned,
  });
};

/**
 * Hook to create a new folder
 */
export const useCreateQrThriveFolder = () => {
  const queryClient = useQueryClient();
  const { qrThriveUserId } = useQrThriveStore();

  return useMutation({
    mutationFn: (data: CreateQrThriveFolderDto) => {
      if (!qrThriveUserId) {
        throw new Error('User not provisioned in QR-Thrive');
      }
      return qrThriveApi.createFolder(qrThriveUserId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-folders'] });
    },
  });
};

/**
 * Hook to delete a folder
 */
export const useDeleteQrThriveFolder = () => {
  const queryClient = useQueryClient();
  const { qrThriveUserId } = useQrThriveStore();

  return useMutation({
    mutationFn: (folderId: string) => {
      if (!qrThriveUserId) {
        throw new Error('User not provisioned in QR-Thrive');
      }
      return qrThriveApi.deleteFolder(qrThriveUserId, folderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-folders'] });
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-codes'] });
    },
  });
};

/**
 * Hook to update a folder
 */
export const useUpdateQrThriveFolder = () => {
  const queryClient = useQueryClient();
  const { qrThriveUserId } = useQrThriveStore();

  return useMutation({
    mutationFn: ({ folderId, data }: { folderId: string; data: Partial<CreateQrThriveFolderDto> }) => {
      if (!qrThriveUserId) {
        throw new Error('User not provisioned in QR-Thrive');
      }
      return qrThriveApi.updateFolder(qrThriveUserId, folderId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-folders'] });
    },
  });
};

// ============================================
// PLANS HOOKS
// ============================================

/**
 * Hook to fetch available QR-Thrive plans
 * This doesn't require authentication - available publicly
 */
export const useQrThrivePlans = () => {
  return useQuery({
    queryKey: ['qr-thrive-plans'],
    queryFn: () => qrThriveApi.getPlans(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// ============================================
// SUBSCRIPTION HOOKS
// ============================================

/**
 * Hook to sync subscription status with QR-Thrive
 */
export const useSyncQrThriveSubscription = () => {
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();

  return useMutation({
    mutationFn: (data: { planId: string; status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'non-renewing' }) => {
      if (!qrThriveUserId || !isProvisioned) {
        throw new Error('User not provisioned in QR-Thrive');
      }
      return qrThriveApi.syncSubscription(qrThriveUserId, data);
    },
  });
};

// ============================================
// PUBLIC HOOKS (No Auth Required)
// ============================================

/**
 * Hook to fetch public QR code data (for preview/scanning)
 */
export const usePublicQrThriveCode = (shortId: string | null) => {
  return useQuery({
    queryKey: ['qr-thrive-public', shortId],
    queryFn: () => qrThriveApi.getPublicQRCode(shortId!),
    enabled: !!shortId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};