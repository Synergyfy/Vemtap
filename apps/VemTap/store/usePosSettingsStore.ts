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

  updateSettings: (updates: Partial<Omit<POSSettingsState, 'updateSettings' | 'loadFromBusiness' | 'resetStore' | 'getPosSettingsPayload'>>) => void;
  loadFromBusiness: (business: {
    name?: string;
    address?: string;
    phone?: string;
    posSettings?: {
      currency?: string;
      receiptHeader?: string;
      receiptFooter?: string;
      autoPrintReceipt?: boolean;
      showLogo?: boolean;
      taxEnabled?: boolean;
      taxRate?: number;
      taxLabel?: string;
      pricesIncludeTax?: boolean;
      loyaltyEnabled?: boolean;
      loyaltyRedeemThreshold?: number;
      lowStockAlerts?: boolean;
      dailySalesSummary?: boolean;
      newOrderAlert?: boolean;
      staffActivityAlerts?: boolean;
    };
  }) => void;
  getPosSettingsPayload: () => {
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
  };
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
    (set, get) => ({
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
        ...(business.posSettings?.currency !== undefined ? { currency: business.posSettings.currency } : {}),
        ...(business.posSettings?.receiptHeader !== undefined ? { receiptHeader: business.posSettings.receiptHeader } : {}),
        ...(business.posSettings?.receiptFooter !== undefined ? { receiptFooter: business.posSettings.receiptFooter } : {}),
        ...(business.posSettings?.autoPrintReceipt !== undefined ? { autoPrintReceipt: business.posSettings.autoPrintReceipt } : {}),
        ...(business.posSettings?.showLogo !== undefined ? { showLogo: business.posSettings.showLogo } : {}),
        ...(business.posSettings?.taxEnabled !== undefined ? { taxEnabled: business.posSettings.taxEnabled } : {}),
        ...(business.posSettings?.taxRate !== undefined ? { taxRate: business.posSettings.taxRate } : {}),
        ...(business.posSettings?.taxLabel !== undefined ? { taxLabel: business.posSettings.taxLabel } : {}),
        ...(business.posSettings?.pricesIncludeTax !== undefined ? { pricesIncludeTax: business.posSettings.pricesIncludeTax } : {}),
        ...(business.posSettings?.loyaltyEnabled !== undefined ? { loyaltyEnabled: business.posSettings.loyaltyEnabled } : {}),
        ...(business.posSettings?.loyaltyRedeemThreshold !== undefined ? { loyaltyRedeemThreshold: business.posSettings.loyaltyRedeemThreshold } : {}),
        ...(business.posSettings?.lowStockAlerts !== undefined ? { lowStockAlerts: business.posSettings.lowStockAlerts } : {}),
        ...(business.posSettings?.dailySalesSummary !== undefined ? { dailySalesSummary: business.posSettings.dailySalesSummary } : {}),
        ...(business.posSettings?.newOrderAlert !== undefined ? { newOrderAlert: business.posSettings.newOrderAlert } : {}),
        ...(business.posSettings?.staffActivityAlerts !== undefined ? { staffActivityAlerts: business.posSettings.staffActivityAlerts } : {}),
      })),
      getPosSettingsPayload: () => {
        const s = get();
        return {
          currency: s.currency,
          receiptHeader: s.receiptHeader,
          receiptFooter: s.receiptFooter,
          autoPrintReceipt: s.autoPrintReceipt,
          showLogo: s.showLogo,
          taxEnabled: s.taxEnabled,
          taxRate: s.taxRate,
          taxLabel: s.taxLabel,
          pricesIncludeTax: s.pricesIncludeTax,
          loyaltyEnabled: s.loyaltyEnabled,
          loyaltyRedeemThreshold: s.loyaltyRedeemThreshold,
          lowStockAlerts: s.lowStockAlerts,
          dailySalesSummary: s.dailySalesSummary,
          newOrderAlert: s.newOrderAlert,
          staffActivityAlerts: s.staffActivityAlerts,
        };
      },
      resetStore: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: 'vemtap-pos-settings-storage',
    }
  )
);
