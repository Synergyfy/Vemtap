
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

    const handleCreate = async (reward: any) => {
        const expiryDateStr = new Date(Date.now() + (reward.validityDays || 30) * 24 * 60 * 60 * 1000).toISOString();
        const mainImage = reward.imageUrls && reward.imageUrls.length > 0 ? reward.imageUrls[0] : '';
        const gallery = reward.imageUrls && reward.imageUrls.length > 1 ? reward.imageUrls.slice(1) : [];
        
        const dto: any = {
            name: reward.name || '',
            description: reward.description || '',
            category: reward.rewardType || 'free_product',
            pointsRequired: reward.pointCost || 100,
            expiryDate: expiryDateStr,
            totalQuantity: reward.totalAvailable || 999,
            audienceType: reward.audienceTarget || 'all',
            branchId: activeBranchId || "GLOBAL",
        };
        
        if (reward.templateId) dto.templateId = reward.templateId;
        if (mainImage) dto.coverImage = mainImage;
        if (gallery.length > 0) dto.galleryImages = gallery;
        if (reward.offerId) dto.offerId = reward.offerId;

        await createMutation.mutateAsync(dto);
        notify.success('Reward structured successfully');
    };

    const handleUpdate = async (id: string, updates: any) => {
        const expiryDateStr = updates.validityDays 
            ? new Date(Date.now() + updates.validityDays * 24 * 60 * 60 * 1000).toISOString()
            : undefined;
        const mainImage = updates.imageUrls && updates.imageUrls.length > 0 ? updates.imageUrls[0] : '';
        const gallery = updates.imageUrls && updates.imageUrls.length > 1 ? updates.imageUrls.slice(1) : [];

        const dto: any = {};
        if (updates.name !== undefined) dto.name = updates.name;
        if (updates.description !== undefined) dto.description = updates.description;
        if (updates.rewardType !== undefined) dto.category = updates.rewardType;
        if (updates.pointCost !== undefined) dto.pointsRequired = updates.pointCost;
        if (updates.totalAvailable !== undefined) dto.totalQuantity = updates.totalAvailable || 999;
        if (expiryDateStr) dto.expiryDate = expiryDateStr;
        if (updates.audienceTarget !== undefined) dto.audienceType = updates.audienceTarget;
        if (mainImage) dto.coverImage = mainImage;
        if (gallery.length > 0) dto.galleryImages = gallery;
        if (activeBranchId) dto.branchId = activeBranchId;
        if (updates.offerId !== undefined) dto.offerId = updates.offerId || null;

        await updateMutation.mutateAsync({ id, updates: dto });
        notify.success('Reward updated successfully');
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
        <div className="p-4 md:p-8 space-y-8">
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

