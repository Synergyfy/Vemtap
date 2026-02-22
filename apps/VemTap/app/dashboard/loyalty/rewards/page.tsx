"use client";

import React, { useEffect } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { RewardManager } from '@/components/loyalty/admin/RewardManager';
import { useLoyaltyStore } from '@/store/loyaltyStore';
import { Reward } from '@/types/loyalty';
import { exportToCSV } from '@/lib/utils/export';
import { Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useBusinessStore } from '@/store/useBusinessStore';

export default function RewardManagementPage() {
    const { availableRewards, fetchRewards, createReward, updateReward, isLoading } = useLoyaltyStore();
    const { activeBranchId } = useBusinessStore();

    // Business ID is hardcoded for demo
    const businessId = 'bistro_001';

    useEffect(() => {
        fetchRewards(businessId);
    }, [activeBranchId]);

    const handleCreate = async (reward: Partial<Reward>) => {
        await createReward(businessId, reward);
    };

    const handleUpdate = async (id: string, updates: Partial<Reward>) => {
        await updateReward(businessId, id, updates);
    };

    const handleExportRewards = () => {
        if (!availableRewards.length) return;

        const exportData = availableRewards.map(r => ({
            Name: r.name,
            Type: r.rewardType,
            Cost: r.pointCost,
            'Validity Days': r.validityDays,
            Status: r.isActive ? 'Active' : 'Inactive'
        }));

        exportToCSV(exportData, `loyalty_rewards_${new Date().toISOString().split('T')[0]}`);
        toast.success('Rewards catalog exported');
    };

    return (
        <div className="p-8 space-y-8">
            <PageHeader
                title="Reward Catalog"
                description="Create and manage what your customers can redeem"
                actions={
                    <button
                        onClick={handleExportRewards}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-text-main font-bold rounded-xl hover:bg-gray-50 transition-all text-sm shadow-sm"
                    >
                        <Download size={18} />
                        Export
                    </button>
                }
            />

            {isLoading && availableRewards.length === 0 ? (
                <div className="flex items-center justify-center p-24">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                <RewardManager
                    rewards={availableRewards}
                    onCreate={handleCreate}
                    onUpdate={handleUpdate}
                />
            )}
        </div>
    );
}
