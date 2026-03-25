import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MessagingCosts {
  sms: number;
  whatsapp: number;
}

export interface SystemSettingsState {
  messagingCosts: MessagingCosts;
  platformName: string;
  supportEmail: string;
  currency: string;
  timezone: string;
  enforce2FA: boolean;
  passwordExpiry: boolean;

  setMessagingCosts: (costs: MessagingCosts) => void;
  updateSettings: (updates: Partial<SystemSettingsState>) => void;
  fetchSettings: () => Promise<void>;
}

export const useSystemSettingsStore = create<SystemSettingsState>()(
  persist(
    (set) => ({
      messagingCosts: {
        sms: 15.0, // Default 15 credits
        whatsapp: 25.0 // Default 25 credits
      },
      platformName: 'VemTap',
      supportEmail: 'support@VemTap.com',
      currency: 'NGN',
      timezone: 'Africa/Lagos',
      enforce2FA: true,
      passwordExpiry: false,

      setMessagingCosts: (costs) => set({ messagingCosts: costs }),
      updateSettings: (updates) => set((state) => ({ ...state, ...updates })),
      fetchSettings: async () => {
        // In a real app, fetch from /admin/settings
        // For now, we rely on persistence
      }
    }),
    {
      name: 'system-settings-storage'
    }
  )
);
