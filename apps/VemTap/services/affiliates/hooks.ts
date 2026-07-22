import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AffiliateStats, AffiliateActivity, AffiliatePerformance, LeaderboardEntry, AffiliateProfile, AffiliateReferral, UpdateProfileData, AdminAffiliateStats, AdminWithdrawalRequest, AdminAffiliateCommission, SystemSettings } from './types';

export const useAffiliateStats = () => {
  return useQuery<AffiliateStats, Error>({
    queryKey: ['affiliate-stats'],
    queryFn: () => api.get('/affiliates/stats'),
  });
};

export const useAffiliateActivity = () => {
  return useQuery<AffiliateActivity[], Error>({
    queryKey: ['affiliate-activity'],
    queryFn: () => api.get('/affiliates/activity'),
  });
};

export const useAffiliatePerformance = () => {
  return useQuery<AffiliatePerformance[], Error>({
    queryKey: ['affiliate-performance'],
    queryFn: () => api.get('/affiliates/performance'),
  });
};

export const useLeaderboard = () => {
  return useQuery<LeaderboardEntry[], Error>({
    queryKey: ['affiliate-leaderboard'],
    queryFn: () => api.get('/affiliates/leaderboard'),
  });
};

export const useReferrals = () => {
  return useQuery<AffiliateReferral[], Error>({
    queryKey: ['affiliate-referrals'],
    queryFn: () => api.get('/affiliates/referrals'),
  });
};

export const useAffiliateProfile = () => {
  return useQuery<AffiliateProfile, Error>({
    queryKey: ['affiliate-profile'],
    queryFn: () => api.get('/affiliates/profile'),
  });
};

export const useUpdateAffiliateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation<AffiliateProfile, Error, UpdateProfileData>({
    mutationFn: (data) => api.post('/affiliates/profile/update', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-profile'] });
    },
  });
};

export const useRequestWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { amount: number }>({
    mutationFn: (data) => api.post('/affiliates/withdraw', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-stats'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-activity'] });
    },
  });
};

export const useTrackReferralVisit = () => {
  return useMutation<void, Error, { referralCode: string }>({
    mutationFn: ({ referralCode }) => api.post(`/affiliates/track-visit`, { referralCode }),
  });
};

// --- Admin hooks ---

export const useAdminAffiliateStats = () => {
  return useQuery<AdminAffiliateStats, Error>({
    queryKey: ['admin-affiliate-stats'],
    queryFn: () => api.get('/affiliates/admin/stats'),
  });
};

export const useAdminAffiliateProfiles = () => {
  return useQuery<AffiliateProfile[], Error>({
    queryKey: ['admin-affiliate-profiles'],
    queryFn: () => api.get('/affiliates/admin/profiles'),
  });
};

export const useAdminAffiliateReferrals = () => {
  return useQuery<AffiliateReferral[], Error>({
    queryKey: ['admin-affiliate-referrals'],
    queryFn: () => api.get('/affiliates/admin/referrals'),
  });
};

export const useAdminAffiliateCommissions = () => {
  return useQuery<AdminAffiliateCommission[], Error>({
    queryKey: ['admin-affiliate-commissions'],
    queryFn: () => api.get('/affiliates/admin/commissions'),
  });
};

export const useAdminWithdrawals = () => {
  return useQuery<AdminWithdrawalRequest[], Error>({
    queryKey: ['admin-affiliate-withdrawals'],
    queryFn: () => api.get('/affiliates/admin/withdrawals'),
  });
};

export const useAdminFraudList = () => {
  return useQuery<AffiliateProfile[], Error>({
    queryKey: ['admin-affiliate-fraud'],
    queryFn: () => api.get('/affiliates/admin/fraud'),
  });
};

export const useProcessWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { id: string; action: 'approve' | 'reject' | 'pay' }>({
    mutationFn: ({ id, action }) => api.post(`/affiliates/admin/withdrawals/${id}/process`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate-stats'] });
    },
  });
};

export const useVerifyAffiliateKyc = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { id: string; status: 'verified' | 'rejected' }>({
    mutationFn: ({ id, status }) => api.post(`/affiliates/admin/profiles/${id}/verify-kyc`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate-profiles'] });
    },
  });
};

export const useFlagAffiliate = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { id: string; reason?: string }>({
    mutationFn: ({ id, reason }) => api.post(`/affiliates/admin/profiles/${id}/flag`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate-fraud'] });
    },
  });
};

export const useSystemSettings = () => {
  return useQuery<SystemSettings, Error>({
    queryKey: ['system-settings'],
    queryFn: () => api.get('/admin/settings'),
  });
};

export const useUpdateSystemSettings = () => {
  const queryClient = useQueryClient();
  return useMutation<SystemSettings, Error, Partial<SystemSettings>>({
    mutationFn: (data) => api.patch('/admin/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });
};
