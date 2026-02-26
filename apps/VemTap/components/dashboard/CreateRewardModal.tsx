import React from 'react';
import { useForm } from 'react-hook-form';
import { Reward } from '@/services/visitors/types';
import { X, Plus, Info } from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';
import Modal from '@/components/ui/Modal';

interface CreateRewardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: RewardFormData) => void;
    isLoading: boolean;
    initialData?: Reward | null;
}

export interface RewardFormData {
    name: string;
    description: string;
    pointCost: number;
    rewardType: 'free_item' | 'percentage_discount' | 'flat_discount';
    value: number;
    validityDays: number;
    usageLimitPerUser: number;
}

export default function CreateRewardModal({ isOpen, onClose, onSubmit, isLoading, initialData }: CreateRewardModalProps) {
    const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<RewardFormData>({
        defaultValues: {
            name: '',
            description: '',
            pointCost: 1,
            rewardType: 'free_item',
            value: 0,
            validityDays: 30,
            usageLimitPerUser: 1
        }
    });

    const rewardType = watch('rewardType');

    // Reset form when initialData changes
    React.useEffect(() => {
        if (isOpen) {
            reset(initialData ? {
                name: initialData.name,
                description: initialData.description,
                pointCost: initialData.pointCost,
                rewardType: initialData.rewardType as any,
                value: initialData.value,
                validityDays: initialData.validityDays,
                usageLimitPerUser: initialData.usageLimitPerUser
            } : {
                name: '',
                description: '',
                pointCost: 1,
                rewardType: 'free_item',
                value: 0,
                validityDays: 30,
                usageLimitPerUser: 1
            });
        }
    }, [isOpen, initialData, reset]);

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
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1 pr-2 custom-scrollbar">
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                        Reward Name
                        <Tooltip content="The name of the reward visible to customers." side="right">
                            <Info size={12} className="text-slate-400 hover:text-primary transition-colors cursor-help" />
                        </Tooltip>
                    </label>
                    <input
                        {...register('name', { required: 'Name is required' })}
                        placeholder="e.g. Free Coffee"
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all text-sm font-bold"
                    />
                    {errors.name && <span className="text-xs text-red-500 mt-1 ml-1 font-bold">{errors.name.message}</span>}
                </div>

                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                        Description
                        <Tooltip content="Brief explanation of the reward." side="right">
                            <Info size={12} className="text-slate-400 hover:text-primary transition-colors cursor-help" />
                        </Tooltip>
                    </label>
                    <textarea
                        {...register('description', { required: 'Description is required' })}
                        placeholder="Describe what the customer gets..."
                        rows={2}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all text-sm font-bold resize-none"
                    ></textarea>
                    {errors.description && <span className="text-xs text-red-500 mt-1 ml-1 font-bold">{errors.description.message}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                            Point Cost
                        </label>
                        <input
                            type="number"
                            {...register('pointCost', { required: 'Point cost is required', min: 1, valueAsNumber: true })}
                            placeholder="e.g. 500"
                            className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all text-sm font-bold"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                            Reward Type
                        </label>
                        <select
                            {...register('rewardType', { required: 'Type is required' })}
                            className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all text-sm font-bold"
                        >
                            <option value="free_item">Free Item</option>
                            <option value="percentage_discount">Percentage Discount</option>
                            <option value="flat_discount">Flat Discount</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                            Reward Value {rewardType === 'percentage_discount' ? '(%)' : '($)'}
                        </label>
                        <input
                            type="number"
                            {...register('value', { required: 'Value is required', min: 0, valueAsNumber: true })}
                            className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all text-sm font-bold"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                            Validity (Days)
                        </label>
                        <input
                            type="number"
                            {...register('validityDays', { required: true, min: 1, valueAsNumber: true })}
                            className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all text-sm font-bold"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                        Usage Limit Per User
                    </label>
                    <input
                        type="number"
                        {...register('usageLimitPerUser', { required: true, min: 1, valueAsNumber: true })}
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all text-sm font-bold"
                    />
                </div>

                <div className="pt-4 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 h-12 flex items-center justify-center font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-sm active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-[1.5] h-12 flex items-center justify-center gap-2 font-bold text-white bg-primary hover:bg-primary-hover rounded-xl transition-all text-sm shadow-xl shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                {!initialData && <Plus size={18} />}
                                {initialData ? 'Update Reward' : 'Create Reward'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

