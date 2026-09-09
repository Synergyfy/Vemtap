import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getDemoDealsPage, getDemoDeal } from '@/lib/mock/demoDeals';
import type {
    DealOffer,
    PaginatedOffersResponse,
    DealsQueryParams,
    CheckPhoneResponse,
    ClaimRequestDto,
    ClaimRequestResponse,
    ClaimVerifyDto,
    ClaimVerifyResponse,
} from './types';

export const getPublicOffers = async (params: DealsQueryParams = {}): Promise<PaginatedOffersResponse> => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            qs.set(key, String(value));
        }
    });
    const queryStr = qs.toString();
    try {
        const result = await api.get(`/catalogue/offers/public${queryStr ? `?${queryStr}` : ''}`);
        // If the API returns empty data, fall back to demo deals
        const items = result?.data ?? [];
        if (items.length > 0) return result;
        return { ...result, data: getDemoDealsPage(params).data };
    } catch {
        // API failed — return demo deals so the UI still works
        return getDemoDealsPage(params);
    }
};

export const getPublicOfferDetails = async (id: string): Promise<DealOffer> => {
    try {
        return await api.get(`/catalogue/offers/public/details/${id}`);
    } catch {
        const demo = getDemoDeal(id);
        if (demo) return demo;
        throw new Error('Deal not found');
    }
};

export const checkPhone = async (phone: string): Promise<CheckPhoneResponse> => {
    return api.get(`/users/public/check-phone?phone=${encodeURIComponent(phone)}`);
};

export const requestClaimOtp = async (data: ClaimRequestDto): Promise<ClaimRequestResponse> => {
    return api.post('/catalogue/offers/claim/request', data);
};

export const verifyClaimOtp = async (data: ClaimVerifyDto): Promise<ClaimVerifyResponse> => {
    return api.post('/catalogue/offers/claim/verify', data);
};

export const usePublicOffers = (params: DealsQueryParams = {}, options?: { enabled?: boolean }) => {
    return useQuery<PaginatedOffersResponse>({
        queryKey: ['deals', 'public', params],
        queryFn: () => getPublicOffers(params),
        enabled: options?.enabled ?? true,
    });
};

export const usePublicOfferDetails = (id: string) => {
    return useQuery<DealOffer>({
        queryKey: ['deals', 'details', id],
        queryFn: () => getPublicOfferDetails(id),
        enabled: !!id,
    });
};

export const useRequestClaimOtp = () => {
    return useMutation<ClaimRequestResponse, Error, ClaimRequestDto>({
        mutationFn: requestClaimOtp,
    });
};

export const useVerifyClaimOtp = () => {
    return useMutation<ClaimVerifyResponse, Error, ClaimVerifyDto>({
        mutationFn: verifyClaimOtp,
    });
};

export const useGenerateDealTerms = () => {
    return useMutation<{ terms: string[] }, Error, { description: string; offerType?: string; businessName?: string }>({
        mutationFn: async (payload) => {
            return api.post('/catalogue/offers/generate-terms', payload);
        },
    });
};
