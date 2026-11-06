import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
    DealOffer,
    PaginatedOffersResponse,
    DealsQueryParams,
    CheckPhoneResponse,
    ClaimRequestDto,
    ClaimRequestResponse,
    ClaimVerifyDto,
    ClaimVerifyResponse,
    SendDealGiftPayload,
    SendDealGiftResponse,
    GiftDealDetails,
    RejectDealGiftPayload,
    BranchGiftedDealsResponse,
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
        return result ?? { data: [], total: 0, page: 1, limit: params.limit || 10 };
    } catch {
        return { data: [], total: 0, page: 1, limit: params.limit || 10 };
    }
};

export const getPublicOfferDetails = async (id: string): Promise<DealOffer> => {
    return api.get(`/catalogue/offers/public/details/${id}`);
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

export const sendDealGift = async (data: SendDealGiftPayload): Promise<SendDealGiftResponse> => {
    return api.post('/catalogue/offers/claim/gift', data);
};

export const useSendDealGift = () => {
    return useMutation<SendDealGiftResponse, Error, SendDealGiftPayload>({
        mutationFn: sendDealGift,
    });
};

export const getGiftByToken = async (token: string): Promise<GiftDealDetails> => {
    return api.get(`/catalogue/offers/gift/${encodeURIComponent(token)}`);
};

export const useGiftByToken = (token: string) => {
    return useQuery<GiftDealDetails>({
        queryKey: ['deals', 'gift', token],
        queryFn: () => getGiftByToken(token),
        enabled: !!token,
        retry: false,
    });
};

export const rejectDealGift = async (payload: RejectDealGiftPayload): Promise<{ success: boolean; message: string }> => {
    return api.post(`/catalogue/offers/gift/${encodeURIComponent(payload.token)}/reject`, {
        reason: payload.reason,
    });
};

export const useRejectDealGift = () => {
    return useMutation<{ success: boolean; message: string }, Error, RejectDealGiftPayload>({
        mutationFn: rejectDealGift,
    });
};

export const getBranchGiftedDeals = async (
    branchId: string,
    params: { page?: number; limit?: number; search?: string } = {},
): Promise<BranchGiftedDealsResponse> => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.search?.trim()) qs.set('search', params.search.trim());
    const queryStr = qs.toString();
    return api.get(`/catalogue/offers/gifts/branch/${branchId}${queryStr ? `?${queryStr}` : ''}`);
};

export const useBranchGiftedDeals = (
    branchId: string,
    params: { page?: number; limit?: number; search?: string } = {},
    options?: { enabled?: boolean },
) => {
    return useQuery<BranchGiftedDealsResponse>({
        queryKey: ['deals', 'branch-gifts', branchId, params],
        queryFn: () => getBranchGiftedDeals(branchId, params),
        enabled: (options?.enabled ?? true) && !!branchId,
    });
};

