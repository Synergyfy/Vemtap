
"use client";

import { Loader2 } from 'lucide-react';
import React from 'react';
import { RewardManager } from '@/components/loyalty/admin/RewardManager';
import { useRewards, useCreateReward, useUpdateReward, useDeleteReward, useLoyaltyTemplates, useApplyLoyaltyTemplate } from '@/services/loyalty/hooks';
import { Reward, CreateRewardRequest, UpdateRewardRequest } from '@/services/loyalty/types';
import { notify } from '@/lib/notify';
import { useActiveBranch } from '@/hooks/useActiveBranch';

export default function RewardManagementPage() {
    const { activeBranchId } = useActiveBranch();
    const { data: rewards, isLoading } = useRewards();
    const createMutation = useCreateReward();
    const updateMutation = useUpdateReward();
    const deleteMutation = useDeleteReward();
    const { data: templates = [] } = useLoyaltyTemplates();
    const applyTemplateMutation = useApplyLoyaltyTemplate();

    const handleCreate = async (reward: Partial<Reward>) => {
        const dto: CreateRewardRequest = {
            name: reward.name || '',
            description: reward.description || '',
            rewardType: reward.rewardType || 'free_item',
            pointCost: reward.pointCost || 100,
            value: reward.value || 0,
            validityDays: reward.validityDays || 30,
            usageLimitPerUser: reward.usageLimitPerUser || 1,
            totalAvailable: reward.totalAvailable || 0,
            imageUrls: reward.imageUrls,
            imageUrl: reward.imageUrl,
            branchId: activeBranchId || undefined,
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
            totalAvailable: updates.totalAvailable,
            isActive: updates.isActive,
            imageUrls: updates.imageUrls,
            imageUrl: updates.imageUrl,
            branchId: activeBranchId || undefined,
        };
        await updateMutation.mutateAsync({ id, updates: dto });
    };

    const handleDelete = async (id: string) => {
        await deleteMutation.mutateAsync(id);
    };

    const handleApplyTemplate = async (templateId: string) => {
        try {
            await applyTemplateMutation.mutateAsync(templateId);
            notify.success('Template applied successfully');
        } catch (error) {
            notify.error('Failed to apply template');
        }
    };

    return (
        <div className="p-8 space-y-8">
            {isLoading && !rewards ? (
                <div className="flex items-center justify-center p-24">
                    <Loader2 className="animate-spin text-primary" size={48} />
                </div>
            ) : (
                <RewardManager
                    rewards={rewards || []}
                    onCreate={handleCreate}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    templates={templates}
                    onApplyTemplate={handleApplyTemplate}
                    isApplyingTemplate={applyTemplateMutation.isPending}
                />
            )}
        </div>
    );
}

