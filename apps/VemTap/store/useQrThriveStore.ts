import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface QrThriveState {
  qrThriveUserId: string | null;
  qrThriveUserEmail: string | null;
  magicLinkToken: string | null;
  magicLinkExpiresAt: string | null;
  magicLinkUrl: string | null;
  isProvisioned: boolean;
  isProvisioning: boolean;
  provisionError: string | null;
  lastProvisionAttempt: string | null;

  setQrThriveUser: (userId: string, email?: string) => void;
  setMagicLink: (token: string, expiresAt: string, url: string) => void;
  clearMagicLink: () => void;
  setProvisioned: (status: boolean) => void;
  setProvisioning: (status: boolean) => void;
  setProvisionError: (error: string | null) => void;
  setLastProvisionAttempt: (timestamp: string) => void;
  clear: () => void;
  clearQrThriveData: () => void;

  isMagicLinkValid: () => boolean;
  needsProvision: () => boolean;
}

const initialState = {
  qrThriveUserId: null,
  qrThriveUserEmail: null,
  magicLinkToken: null,
  magicLinkExpiresAt: null,
  magicLinkUrl: null,
  isProvisioned: false,
  isProvisioning: false,
  provisionError: null,
  lastProvisionAttempt: null,
};

export const useQrThriveStore = create<QrThriveState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setQrThriveUser: (userId: string, email?: string) => set({
        qrThriveUserId: userId,
        qrThriveUserEmail: email || null,
        isProvisioned: true,
        isProvisioning: false,
        provisionError: null,
      }),

      setMagicLink: (token: string, expiresAt: string, url: string) => set({
        magicLinkToken: token,
        magicLinkExpiresAt: expiresAt,
        magicLinkUrl: url,
      }),

      clearMagicLink: () => set({
        magicLinkToken: null,
        magicLinkExpiresAt: null,
        magicLinkUrl: null,
      }),

      setProvisioned: (status: boolean) => set({
        isProvisioned: status,
        isProvisioning: false,
      }),

      setProvisioning: (status: boolean) => set({
        isProvisioning: status,
        ...(status ? { provisionError: null } : {}),
      }),

      setProvisionError: (error: string | null) => set({
        provisionError: error,
        isProvisioning: false,
      }),

      setLastProvisionAttempt: (timestamp: string) => set({
        lastProvisionAttempt: timestamp,
      }),

      clear: () => set(initialState),

      clearQrThriveData: () => set({
        qrThriveUserId: null,
        qrThriveUserEmail: null,
        isProvisioned: false,
        isProvisioning: false,
        provisionError: null,
      }),

      isMagicLinkValid: () => {
        const state = get();
        if (!state.magicLinkToken || !state.magicLinkExpiresAt) {
          return false;
        }
        const expiresAt = new Date(state.magicLinkExpiresAt);
        return expiresAt > new Date();
      },

      needsProvision: () => {
        const state = get();
        return !state.isProvisioned && !state.qrThriveUserId;
      },
    }),
    {
      name: 'qr-thrive-storage',
      partialize: (state) => ({
        qrThriveUserId: state.qrThriveUserId,
        qrThriveUserEmail: state.qrThriveUserEmail,
        isProvisioned: state.isProvisioned,
        lastProvisionAttempt: state.lastProvisionAttempt,
      }),
    }
  )
);

export type { QrThriveState };