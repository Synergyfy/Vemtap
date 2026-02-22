"use client";

import React, { useEffect } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { LoyaltySettings } from '@/components/loyalty/admin/LoyaltySettings';
import { useLoyaltyStore } from '@/store/loyaltyStore';
import { useBusinessStore } from '@/store/useBusinessStore';
import { LoyaltyRule } from '@/types/loyalty';

export default function LoyaltySettingsPage() {
    const { rules, fetchRules, updateRules, isLoading } = useLoyaltyStore();
    const { activeBranchId } = useBusinessStore();

    useEffect(() => {
        if (activeBranchId && activeBranchId !== 'all') {
            fetchRules(activeBranchId);
        }
    }, [activeBranchId, fetchRules]);

    const handleSave = async (updates: Partial<LoyaltyRule>) => {
        if (activeBranchId && activeBranchId !== 'all') {
            await updateRules(activeBranchId, updates);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <PageHeader
                title="Program Settings"
                description="Configure how your loyalty program operates"
            />

            {isLoading && !rules ? (
                <div className="flex items-center justify-center p-24">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : rules ? (
                <LoyaltySettings
                    rules={rules}
                    onSave={handleSave}
                />
            ) : null}
        </div>
    );
}
