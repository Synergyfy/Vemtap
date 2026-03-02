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
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface BusinessCredit {
    id: string;
    businessId: string;
    smsBalance: number;
    emailBalance: number;
    whatsappBalance: number;
    createdAt: string;
    updatedAt: string;
}

export const fetchCreditPlans = async (): Promise<CreditPlan[]> => {
    return await api.get('/credit-plans');
};

export const fetchCreditPlan = async (id: string): Promise<CreditPlan> => {
    return await api.get(`/credit-plans/${id}`);
};

export const fetchMyCredits = async (): Promise<BusinessCredit> => {
    return await api.get('/credit-plans/my-credits');
};

export interface PurchaseCreditPlanRequest {
    businessId: string;
    reference: string;
}

export const purchaseCreditPlan = async (planId: string, data: PurchaseCreditPlanRequest): Promise<BusinessCredit> => {
    return await api.post(`/credit-plans/${planId}/purchase`, data);
};
