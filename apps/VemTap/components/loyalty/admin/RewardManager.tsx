"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Gift, Ticket, Tag, Clock, Save, X, Eye, ImageIcon, Upload, Image as ImageIcon2, HelpCircle } from 'lucide-react';
import { Reward, RewardType } from '@/types/loyalty';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/notify';
import Tooltip from '@/components/ui/Tooltip';

interface RewardManagerProps {
    rewards: Reward[];
    onCreate: (reward: Partial<Reward>) => Promise<void>;
    onUpdate: (id: string, updates: Partial<Reward>) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    className?: string;
}

const REWARD_TYPE_ICONS: Record<RewardType, any> = {
    discount: Tag,
    free_item: Gift,
    service: Ticket,
    cashback: Tag,
    gift: Gift
};

export const RewardManager: React.FC<RewardManagerProps> = ({ rewards, onCreate, onUpdate, className }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<Partial<Reward>>({
        name: '',
        description: '',
        rewardType: 'free_item',
        pointCost: 100,
        validityDays: 30,
        isActive: true,
        imageUrl: '' // New field for Section 11 of PRD
    });

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            rewardType: 'free_item',
            pointCost: 100,
            validityDays: 30,
            isActive: true,
            imageUrl: ''
        });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // In a real app, you'd upload to Supabase/S3 here. 
            // For mock/development, we use a Local Preview URL.
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEdit = (reward: Reward) => {
        setFormData(reward);
        setEditingId(reward.id);
        setIsAdding(true);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.pointCost) {
            notify.error('Please fill in all required fields');
            return;
        }

        try {
            if (editingId) {
                await onUpdate(editingId, formData);
                notify.success('Reward updated successfully');
            } else {
                await onCreate(formData);
                notify.success('Reward created successfully');
            }
            resetForm();
        } catch (error) {
            notify.error('Failed to save reward');
        }
    };

    return (
        <div className={cn("space-y-8", className)}>
            {/* Header & Add Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-display font-black text-slate-900">Reward Catalog</h3>
                    <p className="text-sm text-slate-500 font-medium">Manage the rewards available to your customers</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-primary text-white px-6 py-3 font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 rounded-2xl"
                >
                    <Plus className="w-4 h-4" />
                    Create New Reward
                </button>
            </div>

            <div className="space-y-4">
                {rewards.length === 0 ? (
                    <div className="py-20 bg-slate-50 border border-dashed border-slate-200 text-center rounded-2xl">
                        <Gift className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-sm text-slate-400 font-medium tracking-tight uppercase">No rewards in catalog yet</p>
                    </div>
                ) : (
                    rewards.map((reward) => {
                        const Icon = REWARD_TYPE_ICONS[reward.rewardType];
                        return (
                            <motion.div
                                layout
                                key={reward.id}
                                className={cn(
                                    "p-4 bg-white border transition-all flex items-center justify-between group hover:shadow-md hover:border-primary/20 rounded-2xl",
                                    reward.isActive ? "border-slate-200" : "border-slate-100 opacity-60"
                                )}
                            >
                                <div className="flex items-center gap-5">
                                    {/* THE NEW IMAGE SHAPE */}
                                    <div className="relative w-16 h-16 shrink-0 bg-slate-100 border border-slate-200 overflow-hidden rounded-xl">
                                        {reward.imageUrl ? (
                                            <img
                                                src={reward.imageUrl}
                                                alt={reward.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Icon className="w-6 h-6 text-slate-300" />
                                            </div>
                                        )}
                                        {/* Small Status Badge on Image */}
                                        {!reward.isActive && (
                                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                                <span className="text-[8px] font-black text-white uppercase tracking-tighter">Inactive</span>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm uppercase tracking-tight">{reward.name}</h4>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <div className="flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{reward.pointCost} Pts</span>
                                            </div>
                                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                                            <span className="text-[10px] font-medium text-slate-400 capitalize">{reward.rewardType.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(reward)}
                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Modal Overlay */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-8">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={resetForm}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-2xl text-slate-900 relative shadow-2xl rounded-3xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-8 overflow-y-auto scrollbar-hide">
                                <button
                                    onClick={resetForm}
                                    className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors z-10"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                        <Gift className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-display font-black tracking-tight uppercase text-slate-900">
                                            {editingId ? 'Edit Reward' : 'New Creation'}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Configure your loyalty gift</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {/* Section 1: Visual Identity */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Appearance</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Reward Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full h-12 px-5 bg-slate-50 border border-transparent rounded-xl font-bold text-sm focus:bg-white focus:border-primary/20 outline-none transition-all"
                                                    placeholder="e.g. Free Artisanal Coffee"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                    Reward Type
                                                    <Tooltip content="Categorize your reward for better reporting.">
                                                        <HelpCircle size={12} className="text-slate-300" />
                                                    </Tooltip>
                                                </label>
                                                <select
                                                    value={formData.rewardType}
                                                    onChange={(e) => setFormData({ ...formData, rewardType: e.target.value as RewardType })}
                                                    className="w-full h-12 px-5 bg-slate-50 border border-transparent rounded-xl font-bold text-sm focus:bg-white focus:border-primary/20 outline-none transition-all"
                                                >
                                                    <option value="discount">Custom Discount</option>
                                                    <option value="free_item">Free Product</option>
                                                    <option value="service">Service Upgrade</option>
                                                    <option value="gift">Instant Gift</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Deep Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={3}
                                                className="w-full p-5 bg-slate-50 border border-transparent rounded-xl font-bold text-sm focus:bg-white focus:border-primary/20 outline-none transition-all resize-none"
                                                placeholder="Describe the value of this reward..."
                                            />
                                        </div>
                                    </div>

                                    {/* Section 2: Economics & Validity */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Economics</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10">
                                                <label className="text-[10px] font-black text-primary uppercase tracking-widest block mb-3">Redemption Cost</label>
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-white p-2 rounded-lg shadow-sm">
                                                        <Ticket className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={formData.pointCost}
                                                        onChange={(e) => setFormData({ ...formData, pointCost: parseInt(e.target.value) })}
                                                        className="bg-transparent border-none outline-none font-display font-black text-2xl text-primary w-24"
                                                    />
                                                    <span className="text-xs font-black text-primary/50 uppercase">Points</span>
                                                </div>
                                            </div>

                                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Valid For</label>
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-white p-2 rounded-lg shadow-sm">
                                                        <Clock className="w-5 h-5 text-slate-400" />
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={formData.validityDays}
                                                        onChange={(e) => setFormData({ ...formData, validityDays: parseInt(e.target.value) })}
                                                        className="bg-transparent border-none outline-none font-display font-black text-2xl text-slate-900 w-20"
                                                    />
                                                    <span className="text-xs font-black text-slate-400 uppercase">Days</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 3: Media */}
                                    <div className="space-y-4 pb-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cover Image</h4>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                                            >
                                                Browse Library
                                            </button>
                                        </div>

                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageUpload}
                                            accept="image/*"
                                            className="hidden"
                                        />

                                        <div
                                            className={cn(
                                                "relative h-48 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden",
                                                formData.imageUrl ? "border-solid border-slate-200 bg-white" : "border-slate-200 bg-slate-50 hover:bg-white hover:border-primary/40"
                                            )}
                                        >
                                            {formData.imageUrl ? (
                                                <div className="w-full h-full relative group">
                                                    <img src={formData.imageUrl} alt="Reward Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="p-2 bg-white rounded-lg text-primary hover:bg-gray-50 transition-colors"
                                                            title="Change Image"
                                                        >
                                                            <Plus size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                                                            className="p-2 bg-white rounded-lg text-red-500 hover:bg-gray-50 transition-colors"
                                                            title="Remove Image"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    className="flex flex-col items-center gap-3 cursor-pointer p-8 w-full h-full"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                                                        <ImageIcon2 className="w-8 h-8 text-slate-300" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs font-black text-slate-900 uppercase">Click or Drag to Upload</p>
                                                        <p className="text-[10px] text-slate-400 font-medium mt-1">PNG, JPG or WebP (Max 2MB)</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sticky Footer */}
                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <button
                                    onClick={resetForm}
                                    className="px-6 py-3 font-black text-xs uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-10 py-4 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
                                >
                                    <Save size={18} />
                                    {editingId ? 'Save Changes' : 'Launch Reward'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
