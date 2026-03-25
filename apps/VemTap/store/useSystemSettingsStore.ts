import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { adminFlowEngineApi } from '@/lib/api/admin';

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
  
  // WhatsApp / Flow Engine Specific
  termiiApiKey?: string;
  webhookUrl?: string;
  webhookSecret?: string;

  setMessagingCosts: (costs: MessagingCosts) => void;
  updateSettings: (updates: Partial<SystemSettingsState>) => Promise<void>;
  fetchSettings: () => Promise<void>;
}

export const useSystemSettingsStore = create<SystemSettingsState>()(
  persist(
    (set: any, get: any) => ({
      messagingCosts: {
        sms: 15.0,
        whatsapp: 25.0
      },
      platformName: 'VemTap',
      supportEmail: 'support@VemTap.com',
      currency: 'NGN',
      timezone: 'Africa/Lagos',
      enforce2FA: true as boolean,
      passwordExpiry: false as boolean,

      setMessagingCosts: (costs: MessagingCosts) => set({ messagingCosts: costs }),
      updateSettings: async (updates: Partial<SystemSettingsState>) => {
        try {
          const currentState = get();
          const newState = { ...currentState, ...updates };
          
          // Only extract pure data fields for the API
          const { setMessagingCosts, updateSettings, fetchSettings, ...settingsData } = newState;
          
          await adminFlowEngineApi.updateSettings(settingsData);
          set(updates);
        } catch (error) {
          console.error('Failed to update system settings:', error);
          throw error;
        }
      },
      fetchSettings: async () => {
        try {
          const response = await adminFlowEngineApi.getSettings();
          const data = response.data || response;
          if (data) {
            set(data);
          }
        } catch (error) {
          console.error('Failed to fetch system settings:', error);
        }
      }
    }),
    {
      name: 'system-settings-storage'
    }
  )
);
