'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useQrThriveStore } from '@/store/useQrThriveStore';
import { useProvisionQrThriveUser } from '@/services/qr-thrive/hooks';
import { api } from '@/lib/api';

/**
 * Hook to automatically handle QRThrive provisioning and sync
 * This ensures every VemTap user has a corresponding QRThrive account
 */
export function useQrThriveAuth() {
  const { user, isAuthenticated } = useAuthStore();
  const { 
    isProvisioned, 
    isProvisioning, 
    qrThriveUserId, 
    setQrThriveUser, 
    lastProvisionAttempt 
  } = useQrThriveStore();
  
  const provisionMutation = useProvisionQrThriveUser();
  const syncAttempted = useRef(false);

  useEffect(() => {
    const checkAndProvision = async () => {
      // Only proceed if authenticated and we haven't tried in this session/mount
      if (!isAuthenticated || !user || syncAttempted.current) {
        return;
      }

      // Skip QR-Thrive sync for customers and admins
      if (user.role === 'customer' || user.role === 'admin') {
        syncAttempted.current = true;
        return;
      }

      // If already provisioned in store, we're good
      if (isProvisioned && qrThriveUserId) {
        syncAttempted.current = true;
        return;
      }

      // Prevent multiple simultaneous attempts
      if (isProvisioning) return;

      syncAttempted.current = true;

      try {
        console.log('[QRThrive] Checking provisioning status for:', user.email);

        // 1. Check if the user already has a QRThrive ID in their VemTap profile
        if (user.qrThriveUserId) {
          console.log('[QRThrive] User already has ID in profile:', user.qrThriveUserId);
          setQrThriveUser(user.qrThriveUserId);
          return;
        }

        // 2. Try to fetch from backend dedicated endpoint (if exists)
        try {
          // This endpoint should return the mapped ID if it exists in the DB
          const response = await api.get('/users/me/qr-thrive');
          if (response?.qrThriveUserId) {
            console.log('[QRThrive] Found ID from status endpoint:', response.qrThriveUserId);
            setQrThriveUser(response.qrThriveUserId);
            return;
          }
        } catch (e) {
          // Endpoint might not exist yet or return 404, proceed to provision
          console.log('[QRThrive] Status check failed or endpoint missing, attempting provisioning');
        }

        // 3. Provision new user (the API handle deduplication by email)
        // Only attempt if we haven't failed recently (throttle attempts)
        const lastAttempt = lastProvisionAttempt ? new Date(lastProvisionAttempt).getTime() : 0;
        const now = new Date().getTime();
        const oneHour = 1000 * 60 * 60;

        if (now - lastAttempt > oneHour) {
          console.log('[QRThrive] Provisioning user...');
          await provisionMutation.mutateAsync();
        } else {
          console.warn('[QRThrive] Skipping provision attempt - throttled (last attempt too recent)');
        }

      } catch (error) {
        console.error('[QRThrive] Provisioning auto-flow failed:', error);
        // We'll retry on next mount or session
        syncAttempted.current = false;
      }
    };

    if (isAuthenticated && user) {
      checkAndProvision();
    }
  }, [isAuthenticated, user, isProvisioned, isProvisioning, qrThriveUserId]);

  return {
    isProvisioned,
    isProvisioning,
    qrThriveUserId,
    provision: provisionMutation.mutate,
  };
}
