import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MessagingCosts {
  sms: number;
  whatsapp: number;
}

export interface BundleDiscountTier {
  min: number;
  max: number | null;
  discountPercent: number;
  label: string;
}

export interface SystemSettingsState {
  messagingCosts: MessagingCosts;
  platformName: string;
  supportEmail: string;
  currency: string;
  timezone: string;
  enforce2FA: boolean;
  passwordExpiry: boolean;
  addOnBundleDiscounts: BundleDiscountTier[];
  onboardingVideoUrl: string;

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
      addOnBundleDiscounts: [],
      onboardingVideoUrl: '',

      setMessagingCosts: (costs) => set({ messagingCosts: costs }),
      updateSettings: (updates) => set((state) => ({ ...state, ...updates })),
      fetchSettings: async () => {
        try {
          const { adminSystemSettingsApi } = await import('@/lib/api/admin');
          const settings = await adminSystemSettingsApi.get();
          if (settings) {
            set({
              platformName: settings.platformName,
              supportEmail: settings.supportEmail,
              currency: settings.defaultCurrency,
              timezone: settings.timezone,
              enforce2FA: settings.enforce2FA,
              passwordExpiry: settings.passwordExpiry,
              messagingCosts: {
                sms: Number(settings.messagingCostSms),
                whatsapp: Number(settings.messagingCostWhatsapp)
              },
              addOnBundleDiscounts: settings.addOnBundleDiscounts || []
            });
          }
        } catch (error) {
          console.error('Failed to fetch settings:', error);
        }
      }
    }),
    {
      name: 'system-settings-storage'
    }
  )
);
