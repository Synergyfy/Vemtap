import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Reward } from '@/services/visitors/types';
import { X, Plus, Info, Loader2, ChevronDown, CheckCircle2, Gift, Trash2, ImageIcon as ImageIcon2, HelpCircle } from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';
import Modal from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Icons for reward types
const REWARD_TYPE_DETAILS = {
    free_item: { label: "Free Item", description: "Offer a specific item at no cost.", icon: Gift },
    percentage_discount: { label: "Percentage Discount", description: "Apply percentage reduction.", icon: Info },
    flat_discount: { label: "Flat Discount", description: "Fixed price reduction.", icon: Info },
};

export interface RewardFormData {
    name: string;
    description: string;
    pointCost: number;
    rewardType: 'free_item' | 'percentage_discount' | 'flat_discount';
    value: number;
    validityDays: number;
    usageLimitPerUser: number;
    audienceTarget: 'all' | 'new' | 'returning';
}

interface CreateRewardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: RewardFormData) => void;
    isLoading: boolean;
    initialData?: Reward | null;
    initialTarget?: 'all' | 'new' | 'returning';
}

export default function CreateRewardModal({ isOpen, onClose, onSubmit, isLoading, initialData, initialTarget = 'all' }: CreateRewardModalProps) {
    const [isTypeOpen, setIsTypeOpen] = useState(false);

    const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<RewardFormData>({
        defaultValues: {
            name: '',
            description: '',
            pointCost: 100,
            rewardType: 'free_item',
            value: 0,
            validityDays: 30,
            usageLimitPerUser: 1,
            audienceTarget: initialTarget
        }
    });

    const watchType = watch('rewardType');
    const watchName = watch('name');
    const watchPoints = watch('pointCost');

    // Reset form when initialData/initialTarget changes
    useEffect(() => {
        if (isOpen) {
            reset(initialData ? {
                name: initialData.name,
                description: initialData.description,
                pointCost: initialData.pointCost,
                rewardType: initialData.rewardType as any,
                value: initialData.value,
                validityDays: initialData.validityDays,
                usageLimitPerUser: initialData.usageLimitPerUser,
                audienceTarget: initialTarget
            } : {
                name: '',
                description: '',
                pointCost: 100,
                rewardType: 'free_item',
                value: 0,
                validityDays: 30,
                usageLimitPerUser: 1,
                audienceTarget: initialTarget
            });
        }
    }, [isOpen, initialData, initialTarget, reset]);

    const handleFormSubmit = (data: RewardFormData) => {
        onSubmit(data);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Edit Reward' : 'Create New Reward'}
            description={initialData ? 'Update the details of your loyalty reward' : 'Set up a new loyalty reward for your customers'}
            size="md"
        >
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto px-1 pr-2 custom-scrollbar">
                
                {/* Progress Bar */}
                <div className="flex gap-1.5 mb-6">
                    <div className={cn("h-1.5 flex-1 rounded-full transition-all", watchName ? "bg-primary" : "bg-slate-100")} />
                    <div className={cn("h-1.5 flex-1 rounded-full transition-all", watchPoints > 0 ? "bg-primary" : "bg-slate-100")} />
                    <div className={cn("h-1.5 flex-1 rounded-full transition-all", "bg-slate-100")} />
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-700 ml-1">Reward Name <span className="text-rose-500">*</span></label>
                        <input
                            {...register('name', { required: 'Name is required' })}
                            placeholder="e.g. Complimentary Cappuccino"
                            className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all text-sm font-bold"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-700 ml-1">Audience Target</label>
                        <select
                            {...register('audienceTarget', { required: 'Target audience is required' })}
                            className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all text-sm font-bold"
                        >
                            <option value="all">All Visitors</option>
                            <option value="new">New Visitors</option>
                            <option value="returning">Returning Visitors</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-700 ml-1">Reward Type</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsTypeOpen(!isTypeOpen)}
                                className="w-full h-12 px-5 bg-slate-50 border border-transparent rounded-xl flex items-center justify-between hover:bg-slate-100 transition-all font-bold text-sm"
                            >
                                <div className="flex items-center gap-3">
                                    {React.createElement(REWARD_TYPE_DETAILS[watchType].icon, { size: 16, className: 'text-primary' })}
                                    <span>{REWARD_TYPE_DETAILS[watchType].label}</span>
                                </div>
                                <ChevronDown size={16} className={cn("text-slate-400 transition-transform", isTypeOpen && "rotate-180")} />
                            </button>
                            {isTypeOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl z-20 p-2">
                                    {(Object.keys(REWARD_TYPE_DETAILS) as Array<keyof typeof REWARD_TYPE_DETAILS>).map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => { setValue('rewardType', type); setIsTypeOpen(false); }}
                                            className={cn("w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50", watchType === type ? "bg-primary/5" : "")}
                                        >
                                            {React.createElement(REWARD_TYPE_DETAILS[type].icon, { size: 16, className: 'text-slate-500' })}
                                            <span className="text-xs font-bold text-slate-900">{REWARD_TYPE_DETAILS[type].label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-700 ml-1">Description</label>
                        <textarea
                            {...register('description', { required: 'Description is required' })}
                            rows={2}
                            className="w-full p-5 bg-slate-50 border border-transparent rounded-xl font-bold text-sm focus:bg-white focus:border-primary/20 outline-none transition-all resize-none"
                            placeholder="Tell customers what makes this reward special..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-700 ml-1">Points Required</label>
                            <input
                                type="number"
                                {...register('pointCost', { required: true, min: 1, valueAsNumber: true })}
                                className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white transition-all text-sm font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-700 ml-1">Validity (Days)</label>
                            <input
                                type="number"
                                {...register('validityDays', { required: true, min: 1, valueAsNumber: true })}
                                className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white transition-all text-sm font-bold"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 h-12 flex items-center justify-center font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-[1.5] h-12 flex items-center justify-center gap-2 font-bold text-white bg-primary hover:bg-primary-hover rounded-xl transition-all text-sm shadow-xl shadow-primary/20 disabled:opacity-70"
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin text-white" /> : (initialData ? 'Update Reward' : 'Create Reward')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
