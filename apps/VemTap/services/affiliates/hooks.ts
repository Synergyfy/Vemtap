import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AffiliateStats, AffiliateActivity, AffiliatePerformance, LeaderboardEntry, AffiliateProfile, AffiliateReferral, UpdateProfileData } from './types';

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
