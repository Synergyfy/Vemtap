import { api } from '@/lib/api';
import { SubscriptionCapabilities, Subscription, SubscriptionTaxConfig, PricePreviewResponse, UpdateSubscriptionTaxPayload, ToggleSubscriptionTaxPayload, BillingPeriod } from '@/types/subscriptions';

export const subscriptionsApi = {
  getCapabilities: async (): Promise<SubscriptionCapabilities> => {
    return await api.get('/subscriptions/capabilities');
  },
  getActiveSubscription: async (): Promise<Subscription> => {
    return await api.get('/subscriptions/active');
  },
  // --- Subscription VAT / Tax (Public) ---
  getTaxConfig: async (): Promise<SubscriptionTaxConfig> => {
    return await api.get('/subscriptions/tax-config');
  },
  // --- Subscription VAT / Tax (Admin) ---
  getTaxHistory: async (): Promise<SubscriptionTaxConfig[]> => {
    return await api.get('/subscriptions/admin/tax-config/history');
  },
  updateTaxConfig: async (payload: UpdateSubscriptionTaxPayload): Promise<SubscriptionTaxConfig> => {
    return await api.put('/subscriptions/admin/tax-config', payload);
  },
  toggleTaxConfig: async (payload: ToggleSubscriptionTaxPayload): Promise<SubscriptionTaxConfig> => {
    return await api.patch('/subscriptions/admin/tax-config/toggle', payload);
  },
};

export const previewSubscriptionPrice = async (
  params: { planId: string; billingPeriod: BillingPeriod; addonIds?: string[]; addonQuantities?: number[] },
): Promise<PricePreviewResponse> => {
  return await api.get('/subscriptions/price-preview', { params });
};
