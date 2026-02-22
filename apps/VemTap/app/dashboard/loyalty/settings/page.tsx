"use client";

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { LoyaltySettings } from '@/components/loyalty/admin/LoyaltySettings';
import { useLoyaltyRules, useUpdateLoyaltyRules } from '@/services/loyalty/hooks';
import { UpdateLoyaltyRuleRequest } from '@/services/loyalty/types';

export default function LoyaltySettingsPage() {
    const { data: rules, isLoading } = useLoyaltyRules();
    const updateMutation = useUpdateLoyaltyRules();

    const handleSave = async (updates: UpdateLoyaltyRuleRequest) => {
        await updateMutation.mutateAsync(updates);
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!rules) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <p className="text-slate-500">No loyalty rules configured for this branch.</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <PageHeader
                title="Program Settings"
                description="Configure how your loyalty program operates"
            />

            <LoyaltySettings
                rules={rules}
                onSave={handleSave}
            />
        </div>
    );
}
