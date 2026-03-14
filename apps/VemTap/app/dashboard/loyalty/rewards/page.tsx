
"use client";

import { Loader2, LayoutTemplate, Info } from 'lucide-react';
import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { RewardManager } from '@/components/loyalty/admin/RewardManager';
import { useRewards, useCreateReward, useUpdateReward, useUpdateLoyaltyRules } from '@/services/loyalty/hooks';
import { Reward, CreateRewardRequest, UpdateRewardRequest } from '@/services/loyalty/types';
import { useLoyaltyTemplates } from '@/services/loyalty/templates';
import Tooltip from '@/components/ui/Tooltip';
import { notify } from '@/lib/notify';

export default function RewardManagementPage() {
    const { data: rewards, isLoading } = useRewards();
    const createMutation = useCreateReward();
    const updateMutation = useUpdateReward();
    const updateRulesMutation = useUpdateLoyaltyRules();
    const templates = useLoyaltyTemplates();
    const [isApplying, setIsApplying] = useState<string | null>(null);

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
            imageUrl: reward.imageUrl,
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
        };
        await updateMutation.mutateAsync({ id, updates: dto });
    };

    const handleApplyTemplate = async (templateId: string) => {
        const template = templates.find((t) => t.id === templateId);
        if (!template) return;

        setIsApplying(templateId);
        try {
            if (template.rules) {
                const { ruleType, ...ruleUpdates } = template.rules;
                await updateRulesMutation.mutateAsync(ruleUpdates);
            }
            for (const reward of template.rewards) {
                const dto: CreateRewardRequest = {
                    name: reward.name,
                    description: reward.description || '',
                    rewardType: reward.rewardType || 'free_item',
                    pointCost: reward.pointCost || 100,
                    value: reward.value || 0,
                    validityDays: reward.validityDays || 30,
                    usageLimitPerUser: reward.usageLimitPerUser || 1,
                    totalAvailable: reward.totalAvailable || 0,
                    imageUrl: reward.imageUrl,
                };
                await createMutation.mutateAsync(dto);
            }
            notify.success('Template applied to your loyalty program');
        } catch (error) {
            notify.error('Failed to apply template. Please try again.');
        } finally {
            setIsApplying(null);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <PageHeader
                title="Reward Catalog"
                description="Create and manage what your customers can redeem"
            />

            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Admin Templates</p>
                        <h3 className="text-xl font-display font-black text-slate-900">Use Admin Template</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                            Apply rewards + earning rules in one click
                        </p>
                    </div>
                    <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <LayoutTemplate size={20} />
                    </div>
                </div>

                {templates.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                        No templates available yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                className="border border-slate-200 rounded-3xl p-5 bg-gradient-to-br from-white to-primary/5 hover:shadow-lg transition-all"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="text-lg font-display font-black text-slate-900">{template.name}</p>
                                        <p className="text-xs text-slate-500 font-medium">{template.description || 'No description'}</p>
                                    </div>
                                    <Tooltip content="Applies rewards and earning rules from this template.">
                                        <Info className="w-4 h-4 text-slate-300" />
                                    </Tooltip>
                                </div>
                                <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-widest font-black text-slate-400 mb-4">
                                    <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                                        {template.rewards.length} rewards
                                    </span>
                                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                        {template.rules?.ruleType || 'rules'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleApplyTemplate(template.id)}
                                    disabled={isApplying === template.id}
                                    className="w-full h-11 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest disabled:opacity-60"
                                >
                                    {isApplying === template.id ? 'Applying...' : 'Use Template'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isLoading && !rewards ? (
                <div className="flex items-center justify-center p-24">
                    <Loader2 className="animate-spin text-primary" size={48} />
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

