import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useQrThriveStore } from '@/store/useQrThriveStore';
import { useSyncQrThriveSubscription } from '@/services/qr-thrive/hooks';
import { useActiveSubscription } from '@/services/subscriptions/hooks';

export const useSubscriptionSync = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();
  const syncMutation = useSyncQrThriveSubscription();
  const { data: subscription } = useActiveSubscription();

  return useMutation({
    mutationFn: async () => {
      if (!qrThriveUserId || !isProvisioned) {
        throw new Error('QRThrive user not provisioned');
      }

      const planId = subscription?.planId || 'free';
      const status = subscription?.status || 'trialing';

      return syncMutation.mutateAsync({
        planId,
        status: status as any,
      });
    },
    onSuccess: () => {
      console.log('[QRThrive] Subscription synced successfully');
    },
    onError: (error) => {
      console.error('[QRThrive] Subscription sync failed:', error);
    },
  });
};

export const useSyncOnSubscriptionChange = () => {
  const subscriptionSync = useSubscriptionSync();
  const { isProvisioned } = useQrThriveStore();
  const { data: subscription } = useActiveSubscription();

  const syncIfNeeded = async () => {
    if (!isProvisioned) {
      console.log('[QRThrive] Skipping sync - not provisioned');
      return;
    }

    try {
      await subscriptionSync.mutateAsync();
    } catch (error) {
      console.error('[QRThrive] Auto-sync failed:', error);
    }
  };

  return {
    syncIfNeeded,
    isSyncing: subscriptionSync.isPending,
  };
};