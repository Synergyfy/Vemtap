import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useQrThriveStore } from '@/store/useQrThriveStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
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
  SpecializedLeadsQuery,
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

      if (user.role === 'customer') {
        throw new Error('This role cannot be provisioned in QR-Thrive');
      }

      setProvisioning(true);
      setProvisionError(null);

      try {
        const response = await qrThriveApi.provisionUser();
        // The VemTap backend returns { qrThriveUserId: string }
        setQrThriveUser(response.qrThriveUserId);
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
  const { user, isAuthenticated } = useAuthStore();
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
    enabled: isAuthenticated && user?.role !== 'customer',
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
    needsProvision,
  };
};

/**
 * Hook to check if user's subscription includes QR-Thrive
 */
export const useSubscriptionIncludesQrThrive = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['subscription-includes-qrthrive'],
    queryFn: async () => {
      return qrThriveApi.checkSubscriptionIncludesQrThrive();
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
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
      setMagicLink(response.token);
      
      return response;
    },
  });
};

// ============================================
// QR CODES HOOKS
// ============================================

/**
 * Hook to fetch all QR codes for the current branch
 */
export const useQrThriveCodes = (branchId?: string, params?: QrThriveListParams) => {
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();
  const { activeBranchId } = useActiveBranch();
  const resolvedBranchId = branchId || activeBranchId;

  return useQuery({
    queryKey: ['qr-thrive-codes', resolvedBranchId, params],
    queryFn: () => qrThriveApi.getQRCodes(resolvedBranchId!, params),
    enabled: !!qrThriveUserId && isProvisioned && !!resolvedBranchId && resolvedBranchId !== 'all',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch a single QR code by ID
 */
export const useQrThriveCode = (qrId: string | null, branchId?: string) => {
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();
  const { activeBranchId } = useActiveBranch();
  const resolvedBranchId = branchId || activeBranchId;

  return useQuery({
    queryKey: ['qr-thrive-code', qrId, resolvedBranchId],
    queryFn: () => qrThriveApi.getQRCode(resolvedBranchId!, qrId!),
    enabled: !!qrThriveUserId && isProvisioned && !!qrId && !!resolvedBranchId && resolvedBranchId !== 'all',
  });
};

/**
 * Hook to create a new QR code
 */
export const useCreateQrThriveCode = () => {
  const queryClient = useQueryClient();
  const { qrThriveUserId } = useQrThriveStore();
  const { activeBranchId } = useActiveBranch();

  return useMutation({
    mutationFn: ({ data, branchId }: { data: CreateQrThriveQRDto; branchId?: string }) => {
      if (!qrThriveUserId) {
        throw new Error('User not provisioned in QR-Thrive');
      }
      const resolvedBranchId = branchId || activeBranchId;
      if (!resolvedBranchId || resolvedBranchId === 'all') {
        throw new Error('Please select a specific branch to create a QR code');
      }
      return qrThriveApi.createQRCode(resolvedBranchId, data);
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
  const { activeBranchId } = useActiveBranch();

  return useMutation({
    mutationFn: ({ qrId, data, branchId }: { qrId: string; data: UpdateQrThriveQRDto; branchId?: string }) => {
      if (!qrThriveUserId) {
        throw new Error('User not provisioned in QR-Thrive');
      }
      const resolvedBranchId = branchId || activeBranchId;
      if (!resolvedBranchId || resolvedBranchId === 'all') {
        throw new Error('Branch required to update QR code');
      }
      return qrThriveApi.updateQRCode(resolvedBranchId, qrId, data);
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
  const { activeBranchId } = useActiveBranch();

  return useMutation({
    mutationFn: async ({ qrId, branchId }: { qrId: string; branchId?: string }) => {
      console.log('useDeleteQrThriveCode called', { qrId, branchId });
      const resolvedBranchId = branchId || activeBranchId;
      console.log('Resolved branchId:', resolvedBranchId);
      if (!resolvedBranchId || resolvedBranchId === 'all') {
        throw new Error('Branch required to delete QR code');
      }
      return qrThriveApi.deleteQRCode(resolvedBranchId, qrId);
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
  const { activeBranchId } = useActiveBranch();

  return useMutation({
    mutationFn: ({ qrId, branchId }: { qrId: string; branchId?: string }) => {
      if (!qrThriveUserId) {
        throw new Error('User not provisioned in QR-Thrive');
      }
      const resolvedBranchId = branchId || activeBranchId;
      if (!resolvedBranchId || resolvedBranchId === 'all') {
        throw new Error('Branch required to duplicate QR code');
      }
      return qrThriveApi.duplicateQRCode(resolvedBranchId, qrId);
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
  const { activeBranchId } = useActiveBranch();

  return useMutation({
    mutationFn: ({ qrId, status, branchId }: { qrId: string; status: 'active' | 'archived'; branchId?: string }) => {
      if (!qrThriveUserId) {
        throw new Error('User not provisioned in QR-Thrive');
      }
      const resolvedBranchId = branchId || activeBranchId;
      if (!resolvedBranchId || resolvedBranchId === 'all') {
        throw new Error('Branch required to update status');
      }
      return qrThriveApi.setQRCodeStatus(resolvedBranchId, qrId, status);
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
export const useQrThriveScans = (qrId: string | null, branchId?: string) => {
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();
  const { activeBranchId } = useActiveBranch();
  const resolvedBranchId = branchId || activeBranchId;

  return useQuery({
    queryKey: ['qr-thrive-scans', qrId, resolvedBranchId],
    queryFn: () => qrThriveApi.getScans(resolvedBranchId!, qrId!),
    enabled: !!qrThriveUserId && isProvisioned && !!qrId && !!resolvedBranchId && resolvedBranchId !== 'all',
  });
};

/**
 * Hook to fetch form responses for a QR code
 */
export const useQrThriveResponses = (qrId: string | null, branchId?: string) => {
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();
  const { activeBranchId } = useActiveBranch();
  const resolvedBranchId = branchId || activeBranchId;

  return useQuery({
    queryKey: ['qr-thrive-responses', qrId, resolvedBranchId],
    queryFn: () => qrThriveApi.getResponses(resolvedBranchId!, qrId!),
    enabled: !!qrThriveUserId && isProvisioned && !!qrId && !!resolvedBranchId && resolvedBranchId !== 'all',
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
 * Hook to fetch specialized leads (bookings, menus) for a branch
 */
export const useQrThriveSpecializedLeads = (branchId: string | null, params?: SpecializedLeadsQuery) => {
  return useQuery({
    queryKey: ['qr-thrive-specialized-leads', branchId, params],
    queryFn: () => qrThriveApi.getSpecializedLeads(branchId!, params),
    enabled: !!branchId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to update the status of a lead
 */
export const useUpdateQrThriveLeadStatus = () => {
  const queryClient = useQueryClient();
  const { activeBranchId } = useActiveBranch();

  return useMutation({
    mutationFn: ({ leadId, status, notes, branchId }: { leadId: string; status: string; notes?: string; branchId?: string }) => {
      const resolvedBranchId = branchId || activeBranchId;
      if (!resolvedBranchId) throw new Error('Branch ID required');
      return qrThriveApi.updateLeadStatus(resolvedBranchId, leadId, status, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-specialized-leads'] });
    },
  });
};

/**
 * Hook to fetch dashboard statistics
 */
export const useQrThriveStats = (branchId?: string) => {
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();
  const { activeBranchId } = useActiveBranch();
  const resolvedBranchId = branchId || activeBranchId;

  return useQuery({
    queryKey: ['qr-thrive-stats', resolvedBranchId],
    queryFn: () => qrThriveApi.getStats(resolvedBranchId!),
    enabled: !!qrThriveUserId && isProvisioned && !!resolvedBranchId && resolvedBranchId !== 'all',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// ============================================
// FOLDERS HOOKS
// ============================================

/**
 * Hook to fetch all folders
 */
export const useQrThriveFolders = (branchId?: string) => {
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();
  const { activeBranchId } = useActiveBranch();
  const resolvedBranchId = branchId || activeBranchId;

  return useQuery({
    queryKey: ['qr-thrive-folders', resolvedBranchId],
    queryFn: () => qrThriveApi.getFolders(resolvedBranchId!),
    enabled: !!qrThriveUserId && isProvisioned && !!resolvedBranchId && resolvedBranchId !== 'all',
  });
};

/**
 * Hook to create a new folder
 */
export const useCreateQrThriveFolder = () => {
  const queryClient = useQueryClient();
  const { qrThriveUserId } = useQrThriveStore();
  const { activeBranchId } = useActiveBranch();

  return useMutation({
    mutationFn: ({ data, branchId }: { data: CreateQrThriveFolderDto; branchId?: string }) => {
      if (!qrThriveUserId) {
        throw new Error('User not provisioned in QR-Thrive');
      }
      const resolvedBranchId = branchId || activeBranchId;
      if (!resolvedBranchId || resolvedBranchId === 'all') {
        throw new Error('Branch required to create folder');
      }
      return qrThriveApi.createFolder(resolvedBranchId, data);
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
  const { activeBranchId } = useActiveBranch();

  return useMutation({
    mutationFn: ({ folderId, branchId }: { folderId: string; branchId?: string }) => {
      if (!qrThriveUserId) {
        throw new Error('User not provisioned in QR-Thrive');
      }
      const resolvedBranchId = branchId || activeBranchId;
      if (!resolvedBranchId || resolvedBranchId === 'all') {
        throw new Error('Branch required to delete folder');
      }
      return qrThriveApi.deleteFolder(resolvedBranchId, folderId);
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
  const { activeBranchId } = useActiveBranch();

  return useMutation({
    mutationFn: ({ folderId, data, branchId }: { folderId: string; data: Partial<CreateQrThriveFolderDto>; branchId?: string }) => {
      if (!qrThriveUserId) {
        throw new Error('User not provisioned in QR-Thrive');
      }
      const resolvedBranchId = branchId || activeBranchId;
      if (!resolvedBranchId || resolvedBranchId === 'all') {
        throw new Error('Branch required to update folder');
      }
      return qrThriveApi.updateFolder(resolvedBranchId, folderId, data);
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

/**
 * Hook to reset the QR-Thrive integration for the current user.
 * This deletes the mapping and allows re-provisioning.
 */
/**
 * Hook to get or create the main business link QR code for a branch.
 */
export const useMainQrCode = (branchId: string | null) => {
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();

  return useQuery({
    queryKey: ['qr-thrive-main-qr', branchId],
    queryFn: () => qrThriveApi.getMainQRCode(branchId!),
    enabled: !!qrThriveUserId && isProvisioned && !!branchId && branchId !== 'all',
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};

/**
 * Hook to recreate the main QR code for a branch.
 */
/**
 * Hook to update the main QR code and detach it from the branch.
 */
export const useUpdateMainQrCode = () => {
  const queryClient = useQueryClient();
  const { qrThriveUserId } = useQrThriveStore();
  const { activeBranchId } = useActiveBranch();

  return useMutation({
    mutationFn: async (params: { qrId: string; data: UpdateQrThriveQRDto; branchId?: string }) => {
      if (!qrThriveUserId) {
        throw new Error('User not provisioned in QR-Thrive');
      }
      const resolvedBranchId = params.branchId || activeBranchId;
      if (!resolvedBranchId || resolvedBranchId === 'all') {
        throw new Error('Branch required');
      }
      return qrThriveApi.updateMainQRCode(resolvedBranchId, params.qrId, params.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-main-qr'] });
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-codes'] });
    },
  });
};

export const useRecreateMainQrCode = () => {
  const queryClient = useQueryClient();
  const { qrThriveUserId } = useQrThriveStore();
  const { activeBranchId } = useActiveBranch();

  return useMutation({
    mutationFn: async (branchId?: string) => {
      if (!qrThriveUserId) {
        throw new Error('User not provisioned in QR-Thrive');
      }
      const resolvedBranchId = branchId || activeBranchId;
      if (!resolvedBranchId || resolvedBranchId === 'all') {
        throw new Error('Branch required');
      }
      return qrThriveApi.recreateMainQRCode(resolvedBranchId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-main-qr'] });
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-codes'] });
    },
  });
};

/**
 * Hook to set an existing QR code as the branch's main QR code.
 */
export const useSetQRCodeAsMain = () => {
  const queryClient = useQueryClient();
  const { qrThriveUserId } = useQrThriveStore();
  const { activeBranchId } = useActiveBranch();

  return useMutation({
    mutationFn: async (params: { qrId: string; branchId?: string }) => {
      if (!qrThriveUserId) {
        throw new Error('User not provisioned in QR-Thrive');
      }
      const resolvedBranchId = params.branchId || activeBranchId;
      if (!resolvedBranchId || resolvedBranchId === 'all') {
        throw new Error('Branch required');
      }
      return qrThriveApi.setQRCodeAsMain(resolvedBranchId, params.qrId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-main-qr'] });
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-codes'] });
    },
  });
};

export const useResetQrThriveMapping = () => {
  const queryClient = useQueryClient();
  const { clearQrThriveData } = useQrThriveStore();

  return useMutation({
    mutationFn: () => qrThriveApi.resetMapping(),
    onSuccess: () => {
      clearQrThriveData();
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-user-mapping'] });
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-provisioning-status'] });
    },
  });
};