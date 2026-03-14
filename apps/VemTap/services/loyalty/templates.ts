"use client";

import { create } from 'zustand';
import { LoyaltyRule, RewardType } from '@/types/loyalty';

export type LoyaltyTemplateStatus = 'draft' | 'published';

export interface LoyaltyTemplate {
    id: string;
    name: string;
    description?: string;
    status: LoyaltyTemplateStatus;
    rewards: TemplateReward[];
    rules: Partial<LoyaltyRule>;
    createdAt: string;
}

export interface TemplateReward {
    id: string;
    name: string;
    description: string;
    rewardType: RewardType;
    pointCost: number;
    value: number;
    validityDays: number;
    usageLimitPerUser: number;
    totalAvailable?: number;
    isActive?: boolean;
    imageUrl?: string;
}

const seedTemplates: LoyaltyTemplate[] = [
    {
        id: 'tmpl-welcome-cafe',
        name: 'Cafe Welcome Boost',
        description: 'Great for cafés and casual dining. Small rewards + fast visits.',
        status: 'published',
        createdAt: '2026-03-10',
        rules: {
            ruleType: 'visit',
            visitPoints: 5,
            visitCooldownHours: 24,
            firstVisitBonus: 20,
            birthdayBonus: 30,
            referralBonus: 10,
            isActive: true,
        },
        rewards: [
            {
                id: 'r-1',
                name: 'Free Pastry',
                description: 'Enjoy a free pastry with any drink.',
                rewardType: 'free_item',
                pointCost: 60,
                value: 0,
                validityDays: 30,
                usageLimitPerUser: 1,
                totalAvailable: 0,
                isActive: true,
            },
            {
                id: 'r-2',
                name: '10% Off Next Visit',
                description: 'Discount applied on the next purchase.',
                rewardType: 'discount',
                pointCost: 120,
                value: 10,
                validityDays: 30,
                usageLimitPerUser: 1,
                totalAvailable: 0,
                isActive: true,
            },
        ],
    },
    {
        id: 'tmpl-premium-retail',
        name: 'Retail VIP Tier',
        description: 'Higher point cost rewards and spending-based earning.',
        status: 'published',
        createdAt: '2026-03-08',
        rules: {
            ruleType: 'spending',
            spendingBaseAmount: 1000,
            spendingBasePoints: 15,
            visitCooldownHours: 24,
            firstVisitBonus: 25,
            birthdayBonus: 50,
            referralBonus: 20,
            isActive: true,
        },
        rewards: [
            {
                id: 'r-3',
                name: '₦1,000 Voucher',
                description: 'Redeemable store credit.',
                rewardType: 'cashback',
                pointCost: 300,
                value: 1000,
                validityDays: 30,
                usageLimitPerUser: 1,
                totalAvailable: 0,
                isActive: true,
            },
            {
                id: 'r-4',
                name: 'Premium Gift',
                description: 'Exclusive gift for loyal customers.',
                rewardType: 'gift',
                pointCost: 500,
                value: 0,
                validityDays: 45,
                usageLimitPerUser: 1,
                totalAvailable: 50,
                isActive: true,
            },
        ],
    },
];

export const useLoyaltyTemplates = () => useLoyaltyTemplateStore((s) => s.templates);

interface LoyaltyTemplateStore {
    templates: LoyaltyTemplate[];
    addTemplate: (template: LoyaltyTemplate) => void;
    updateTemplate: (id: string, updates: Partial<LoyaltyTemplate>) => void;
    deleteTemplate: (id: string) => void;
}

export const useLoyaltyTemplateStore = create<LoyaltyTemplateStore>((set) => ({
    templates: seedTemplates,
    addTemplate: (template) => set((state) => ({ templates: [template, ...state.templates] })),
    updateTemplate: (id, updates) =>
        set((state) => ({
            templates: state.templates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
    deleteTemplate: (id) =>
        set((state) => ({
            templates: state.templates.filter((t) => t.id !== id),
        })),
}));
