import { api } from '../api';

export interface CreditPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    smsAmount: number;
    emailAmount: number;
    whatsappAmount: number;
    aiAmount: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface BusinessCredit {
    id: string;
    businessId: string;
    smsCredits: number;
    emailCredits: number;
    whatsappCredits: number;
    aiCredits: number;
    createdAt: string;
    updatedAt: string;
}

export const fetchCreditPlans = async (): Promise<CreditPlan[]> => {
    return await api.get('/credit-plans');
};

export interface CreditRates {
    creditPriceSms: number;
    creditPriceWhatsapp: number;
    creditPriceEmail: number;
    creditPriceAi: number;
}

export const fetchCreditRates = async (): Promise<CreditRates> => {
    return await api.get('/credit-plans/rates');
};

export const fetchCreditPlan = async (id: string): Promise<CreditPlan> => {
    return await api.get(`/credit-plans/${id}`);
};

export const fetchMyCredits = async (branchId?: string): Promise<BusinessCredit> => {
    const url = branchId ? `/credit-plans/my-credits?branchId=${branchId}` : '/credit-plans/my-credits';
    return await api.get(url);
};

export interface PurchaseCreditPlanRequest {
    branchId: string;
    reference: string;
}

export const purchaseCreditPlan = async (planId: string, data: PurchaseCreditPlanRequest): Promise<BusinessCredit> => {
    return await api.post(`/credit-plans/${planId}/purchase`, data);
};

export interface PurchaseCustomCreditsRequest {
    branchId: string;
    reference: string;
    smsAmount: number;
    whatsappAmount: number;
    emailAmount: number;
    aiAmount?: number;
}

export const purchaseCustomCredits = async (data: PurchaseCustomCreditsRequest): Promise<BusinessCredit> => {
    return await api.post('/credit-plans/custom/purchase', data);
};
