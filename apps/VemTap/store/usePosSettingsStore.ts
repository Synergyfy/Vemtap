import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface POSSettingsState {
  businessName: string;
  businessAddress: string;
  phoneNumber: string;
  currency: string;
  receiptHeader: string;
  receiptFooter: string;
  autoPrintReceipt: boolean;
  showLogo: boolean;
  taxEnabled: boolean;
  taxRate: number;
  taxLabel: string;
  pricesIncludeTax: boolean;
  loyaltyEnabled: boolean;
  loyaltyRedeemThreshold: number;
  lowStockAlerts: boolean;
  dailySalesSummary: boolean;
  newOrderAlert: boolean;
  staffActivityAlerts: boolean;

  updateSettings: (updates: Partial<Omit<POSSettingsState, 'updateSettings' | 'loadFromBusiness' | 'resetStore'>>) => void;
  loadFromBusiness: (business: { name?: string; address?: string; phone?: string; posSettings?: { loyaltyEnabled?: boolean; loyaltyRedeemThreshold?: number } }) => void;
  resetStore: () => void;
}

const DEFAULT_SETTINGS = {
  businessName: 'VemTap Retail Store',
  businessAddress: '123 Lagos Rd, Victoria Island, Lagos',
  phoneNumber: '+234 800 000 0000',
  currency: 'NGN',
  receiptHeader: 'Thank you for shopping with us!',
  receiptFooter: 'No returns after 7 days. Receipt required.',
  autoPrintReceipt: false,
  showLogo: true,
  taxEnabled: false,
  taxRate: 7.5,
  taxLabel: 'VAT',
  pricesIncludeTax: true,
  loyaltyEnabled: false,
  loyaltyRedeemThreshold: 100,
  lowStockAlerts: true,
  dailySalesSummary: true,
  newOrderAlert: false,
  staffActivityAlerts: false,
};

export const usePosSettingsStore = create<POSSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      updateSettings: (updates) => set((state) => {
        const merged = { ...state, ...updates };
        if ('taxEnabled' in updates && updates.taxEnabled) {
          merged.pricesIncludeTax = false;
        }
        if ('pricesIncludeTax' in updates && updates.pricesIncludeTax) {
          merged.taxEnabled = false;
        }
        return merged;
      }),
      loadFromBusiness: (business) => set((state) => ({
        ...state,
        ...(business.name ? { businessName: business.name } : {}),
        ...(business.address ? { businessAddress: business.address } : {}),
        ...(business.phone ? { phoneNumber: business.phone } : {}),
        ...(business.posSettings?.loyaltyEnabled !== undefined ? { loyaltyEnabled: business.posSettings.loyaltyEnabled } : {}),
        ...(business.posSettings?.loyaltyRedeemThreshold !== undefined ? { loyaltyRedeemThreshold: business.posSettings.loyaltyRedeemThreshold } : {}),
      })),
      resetStore: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: 'vemtap-pos-settings-storage',
    }
  )
);
