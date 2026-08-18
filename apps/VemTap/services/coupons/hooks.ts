import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponsApi } from '@/lib/api/coupons';
import {
    CouponItem,
    CouponRedemptionItem,
    CouponStats,
    CreateCouponPayload,
    CreatePromoCodePayload,
    PromoCodeItem,
    ValidatePromoCodeResponse,
    BillingPeriod,
} from '@/types/subscriptions';

const COUPONS_KEY = ['admin', 'coupons'] as const;
const PROMO_CODES_KEY = ['admin', 'coupons', 'promo-codes'] as const;
const REDEMPTIONS_KEY = ['admin', 'coupons', 'redemptions'] as const;
const STATS_KEY = ['admin', 'coupons', 'stats'] as const;

// --- Customer: Validate promo code ---
export const useValidatePromoCode = () =>
    useMutation<ValidatePromoCodeResponse, Error, {
        code: string;
        planId: string;
        billingPeriod: BillingPeriod;
        businessId?: string;
    }>({
        mutationFn: (payload) => couponsApi.validatePromoCode(payload),
    });

// --- Admin: Coupons ---
export const useAdminCoupons = () =>
    useQuery<CouponItem[], Error>({
        queryKey: [...COUPONS_KEY],
        queryFn: () => couponsApi.getCoupons(),
    });

export const useAdminCoupon = (id?: string) =>
    useQuery<CouponItem, Error>({
        queryKey: [...COUPONS_KEY, id],
        queryFn: () => couponsApi.getCoupon(id as string),
        enabled: !!id,
    });

export const useCreateCoupon = () => {
    const queryClient = useQueryClient();
    return useMutation<CouponItem, Error, CreateCouponPayload>({
        mutationFn: (payload) => couponsApi.createCoupon(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...COUPONS_KEY] });
            queryClient.invalidateQueries({ queryKey: [...STATS_KEY] });
        },
    });
};

export const useUpdateCoupon = () => {
    const queryClient = useQueryClient();
    return useMutation<CouponItem, Error, { id: string; data: Partial<CreateCouponPayload> }>({
        mutationFn: ({ id, data }) => couponsApi.updateCoupon(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...COUPONS_KEY] });
        },
    });
};

export const useToggleCoupon = () => {
    const queryClient = useQueryClient();
    return useMutation<CouponItem, Error, { id: string; isActive?: boolean }>({
        mutationFn: ({ id, isActive }) => couponsApi.toggleCoupon(id, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...COUPONS_KEY] });
            queryClient.invalidateQueries({ queryKey: [...STATS_KEY] });
        },
    });
};

export const useDeleteCoupon = () => {
    const queryClient = useQueryClient();
    return useMutation<{ success: boolean; message: string }, Error, string>({
        mutationFn: (id) => couponsApi.deleteCoupon(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...COUPONS_KEY] });
            queryClient.invalidateQueries({ queryKey: [...STATS_KEY] });
        },
    });
};

// --- Admin: Promotion Codes ---
export const useAdminPromoCodes = (params?: { couponId?: string; isActive?: boolean; search?: string }) =>
    useQuery<PromoCodeItem[], Error>({
        queryKey: [...PROMO_CODES_KEY, params?.couponId ?? 'all', params?.isActive?.toString() ?? 'all', params?.search ?? ''],
        queryFn: () => couponsApi.getPromoCodes(params),
    });

export const useCreatePromoCode = () => {
    const queryClient = useQueryClient();
    return useMutation<PromoCodeItem, Error, { couponId: string; data: CreatePromoCodePayload }>({
        mutationFn: ({ couponId, data }) => couponsApi.createPromoCode(couponId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...COUPONS_KEY] });
            queryClient.invalidateQueries({ queryKey: [...PROMO_CODES_KEY] });
            queryClient.invalidateQueries({ queryKey: [...STATS_KEY] });
        },
    });
};

export const useUpdatePromoCode = () => {
    const queryClient = useQueryClient();
    return useMutation<PromoCodeItem, Error, { id: string; data: Partial<CreatePromoCodePayload> }>({
        mutationFn: ({ id, data }) => couponsApi.updatePromoCode(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...PROMO_CODES_KEY] });
        },
    });
};

export const useTogglePromoCode = () => {
    const queryClient = useQueryClient();
    return useMutation<PromoCodeItem, Error, { id: string; isActive?: boolean }>({
        mutationFn: ({ id, isActive }) => couponsApi.togglePromoCode(id, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...PROMO_CODES_KEY] });
            queryClient.invalidateQueries({ queryKey: [...COUPONS_KEY] });
            queryClient.invalidateQueries({ queryKey: [...STATS_KEY] });
        },
    });
};

// --- Admin: Analytics & Audit Logs ---
export const useCouponStats = () =>
    useQuery<CouponStats, Error>({
        queryKey: [...STATS_KEY],
        queryFn: () => couponsApi.getStats(),
    });

export const useCouponRedemptions = (params?: {
    couponId?: string;
    promotionCodeId?: string;
    businessId?: string;
    planId?: string;
    search?: string;
}) =>
    useQuery<CouponRedemptionItem[], Error>({
        queryKey: [...REDEMPTIONS_KEY, params?.couponId ?? 'all', params?.promotionCodeId ?? 'all', params?.search ?? ''],
        queryFn: () => couponsApi.getRedemptions(params),
    });
