"use client";

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { RewardManager } from '@/components/loyalty/admin/RewardManager';
import { useRewards, useCreateReward, useUpdateReward } from '@/services/loyalty/hooks';
import { Reward, CreateRewardRequest, UpdateRewardRequest } from '@/services/loyalty/types';

export default function RewardManagementPage() {
    const { data: rewards, isLoading } = useRewards();
    const createMutation = useCreateReward();
    const updateMutation = useUpdateReward();

    const handleCreate = async (reward: Partial<Reward>) => {
        const dto: CreateRewardRequest = {
            name: reward.name || '',
            description: reward.description || '',
            rewardType: reward.rewardType || 'free_item',
            pointCost: reward.pointCost || 100,
            value: reward.value || 0,
            validityDays: reward.validityDays || 30,
            usageLimitPerUser: reward.usageLimitPerUser || 1,
        };
        await createMutation.mutateAsync(dto);
    };

    const handleUpdate = async (id: string, updates: Partial<Reward>) => {
        const dto: UpdateRewardRequest = {
            name: updates.name,
            description: updates.description,
            pointCost: updates.pointCost,
            value: updates.value,
            validityDays: updates.validityDays,
            usageLimitPerUser: updates.usageLimitPerUser,
            isActive: updates.isActive,
        };
        await updateMutation.mutateAsync({ id, updates: dto });
    };

    return (
        <div className="p-8 space-y-8">
            <PageHeader
                title="Reward Catalog"
                description="Create and manage what your customers can redeem"
            />

            {isLoading && !rewards ? (
                <div className="flex items-center justify-center p-24">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                <RewardManager
                    rewards={rewards || []}
                    onCreate={handleCreate}
                    onUpdate={handleUpdate}
                />
            )}
        </div>
    );
}
