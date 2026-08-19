import { api } from '@/lib/api';
import {
    BillingPeriod,
    CouponItem,
    CouponRedemptionItem,
    CouponStats,
    CreateCouponPayload,
    CreatePromoCodePayload,
    PromoCodeItem,
    ValidatePromoCodeResponse,
} from '@/types/subscriptions';

export const couponsApi = {
    // --- Customer: standalone promo code validation ---
    validatePromoCode: async (payload: {
        code: string;
        planId: string;
        billingPeriod: BillingPeriod;
        businessId?: string;
    }): Promise<ValidatePromoCodeResponse> => {
        return await api.post('/coupons/validate', payload);
    },

    // --- Admin: Coupons ---
    getCoupons: async (): Promise<CouponItem[]> => {
        return await api.get('/admin/coupons');
    },
    getCoupon: async (id: string): Promise<CouponItem> => {
        return await api.get(`/admin/coupons/${id}`);
    },
    createCoupon: async (payload: CreateCouponPayload): Promise<CouponItem> => {
        return await api.post('/admin/coupons', payload);
    },
    updateCoupon: async (id: string, payload: Partial<CreateCouponPayload>): Promise<CouponItem> => {
        return await api.patch(`/admin/coupons/${id}`, payload);
    },
    toggleCoupon: async (id: string, isActive?: boolean): Promise<CouponItem> => {
        return await api.patch(`/admin/coupons/${id}/toggle`, { isActive });
    },
    deleteCoupon: async (id: string): Promise<{ success: boolean; message: string }> => {
        return await api.delete(`/admin/coupons/${id}`);
    },

    // --- Admin: Promotion Codes ---
    getPromoCodes: async (params?: { couponId?: string; isActive?: boolean; search?: string }): Promise<PromoCodeItem[]> => {
        return await api.get('/admin/coupons/promo-codes/all', {
            params: {
                couponId: params?.couponId,
                isActive: params?.isActive === undefined ? undefined : String(params.isActive),
                search: params?.search,
            },
        });
    },
    getPromoCode: async (id: string): Promise<PromoCodeItem> => {
        return await api.get(`/admin/coupons/promo-codes/${id}`);
    },
    createPromoCode: async (couponId: string, payload: CreatePromoCodePayload): Promise<PromoCodeItem> => {
        return await api.post(`/admin/coupons/${couponId}/promo-codes`, payload);
    },
    updatePromoCode: async (id: string, payload: Partial<CreatePromoCodePayload>): Promise<PromoCodeItem> => {
        return await api.patch(`/admin/coupons/promo-codes/${id}`, payload);
    },
    togglePromoCode: async (id: string, isActive?: boolean): Promise<PromoCodeItem> => {
        return await api.patch(`/admin/coupons/promo-codes/${id}/toggle`, { isActive });
    },

    // --- Admin: Analytics & Audit Logs ---
    getStats: async (): Promise<CouponStats> => {
        return await api.get('/admin/coupons/analytics/stats');
    },
    getRedemptions: async (params?: {
        couponId?: string;
        promotionCodeId?: string;
        businessId?: string;
        planId?: string;
        search?: string;
    }): Promise<CouponRedemptionItem[]> => {
        return await api.get('/admin/coupons/analytics/redemptions', { params });
    },
};
