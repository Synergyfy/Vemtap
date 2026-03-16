"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Gift, Ticket, Tag, Clock, Save, X, Eye, ImageIcon, Upload, Image as ImageIcon2, HelpCircle, Wallet, Package, Percent, ChevronDown, CheckCircle2, AlertCircle, Star, Search, Users, Calendar, Loader2 } from 'lucide-react';
import { Reward, RewardType } from '@/types/loyalty';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/notify';
import Tooltip from '@/components/ui/Tooltip';
import { uploadToCloudinary } from '@/lib/cloudinary';

interface RewardManagerProps {
    rewards: Reward[];
    onCreate: (reward: Partial<Reward>) => Promise<void>;
    onUpdate: (id: string, updates: Partial<Reward>) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    className?: string;
}

const REWARD_TYPE_DETAILS: Record<RewardType, { label: string, description: string, icon: any }> = {
    discount: {
        label: "Custom Discount",
        description: "Apply percentage or fixed price reduction on checkout.",
        icon: Percent
    },
    free_item: {
        label: "Free Product",
        description: "Offer a specific item at no cost to the customer.",
        icon: Package
    },
    service: {
        label: "Service Upgrade",
        description: "Complimentary services or feature upgrades.",
        icon: Ticket
    },
    cashback: {
        label: "Wallet Cashback",
        description: "Points convertible to spendable store credit.",
        icon: Wallet
    },
    gift: {
        label: "Tangible Gift",
        description: "A surprise physical reward or gift package.",
        icon: Gift
    }
};

export const RewardManager: React.FC<RewardManagerProps> = ({ rewards, onCreate, onUpdate, className }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isTypeOpen, setIsTypeOpen] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingRewardForCustomers, setViewingRewardForCustomers] = useState<Reward | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [localImageFile, setLocalImageFile] = useState<File | null>(null);

    const [formData, setFormData] = useState<Partial<Reward>>({
        name: '',
        description: '',
        rewardType: 'free_item',
        pointCost: 100,
        validityDays: 30,
        value: 0,
        totalAvailable: 0,
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
            value: 0,
            totalAvailable: 0,
            isActive: true,
            imageUrl: ''
        });
        setLocalImageFile(null);
        setIsAdding(false);
        setEditingId(null);
        setIsSubmitted(false);
        setIsTypeOpen(false);
        setIsUploading(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLocalImageFile(file);
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
        setIsSubmitted(true);
        if (!formData.name || !formData.pointCost) {
            notify.error('Required fields are missing. Please check the highlighted inputs.');
            return;
        }

        setIsUploading(true);
        let toastId: string | undefined;

        try {
            let finalImageUrl = formData.imageUrl;

            if (localImageFile) {
                toastId = notify.loading('Uploading reward image to Cloudinary...');
                finalImageUrl = await uploadToCloudinary(localImageFile);
                notify.dismiss(toastId);
            }

            const submissionData = { ...formData, imageUrl: finalImageUrl };

            if (editingId) {
                await onUpdate(editingId, submissionData);
                notify.success('Reward updated successfully');
            } else {
                await onCreate(submissionData);
                notify.success('Reward created successfully');
            }
            resetForm();
        } catch (error) {
            if (toastId) notify.dismiss(toastId);
            notify.error('Failed to save reward');
            console.error('Submit error:', error);
        } finally {
            setIsUploading(false);
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

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search rewards by name or description..."
                    className="w-full bg-white border border-slate-200 rounded-2xl h-14 pl-12 pr-4 font-medium text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                />
            </div>

            {rewards.length === 0 ? (
                <div className="py-20 bg-slate-50 border border-dashed border-slate-200 text-center rounded-2xl">
                    <Gift className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-sm text-slate-400 font-medium tracking-tight uppercase">No rewards in catalog yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {rewards.filter(r => 
                        r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        r.description.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((reward) => {
                        const Icon = REWARD_TYPE_DETAILS[reward.rewardType].icon;
                        
                        // Mock Analytics
                        const mockRedemptions = Math.floor(Math.random() * 50) + 10; 
                        const mockPointsRedeemed = mockRedemptions * reward.pointCost;

                        return (
                            <motion.div
                                layout
                                key={reward.id}
                                className={cn(
                                    "group relative flex flex-col hover:shadow-2xl transition-all duration-300 rounded-2xl border bg-gradient-to-br from-white to-primary/5",
                                    reward.isActive ? "border-primary/20 hover:border-primary/40" : "border-slate-200 bg-slate-50 opacity-80"
                                )}
                            >
                                {/* Top accent bar */}
                                <div className={cn(
                                    "absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl",
                                    reward.isActive ? "bg-gradient-to-r from-primary via-primary-hover to-primary" : "bg-slate-300"
                                )} />
                                
                                <div className="p-6 flex flex-col flex-grow">
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="flex items-center space-x-4">
                                            <div className="relative w-16 h-16 shrink-0 bg-white border border-primary/10 overflow-hidden rounded-2xl flex items-center justify-center p-2 shadow-sm ring-4 ring-primary/5">
                                                {reward.imageUrl ? (
                                                    <img
                                                        src={reward.imageUrl}
                                                        alt={reward.name}
                                                        className="w-full h-full object-cover rounded-xl"
                                                    />
                                                ) : (
                                                    <Icon className="w-8 h-8 text-primary" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-display font-bold text-slate-900 text-lg line-clamp-1">{reward.name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={cn(
                                                        "px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-black",
                                                        reward.isActive ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500"
                                                    )}>
                                                        {reward.isActive ? 'Active' : 'Disabled'}
                                                    </span>
                                                    <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[9px] uppercase tracking-widest font-black border border-primary/20 flex items-center gap-1">
                                                        <Gift className="w-3 h-3" />
                                                        Points
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <button
                                                onClick={() => handleEdit(reward)}
                                                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                title="Edit Reward"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-500 font-medium mb-6 line-clamp-2 min-h-[40px]">
                                        {reward.description || 'No description provided for this reward.'}
                                    </p>

                                    {/* Stats grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-5">
                                        <Tooltip content="The exact number of points a user needs to earn to claim this reward.">
                                            <div className="p-3 bg-primary/5 rounded-2xl text-center border border-primary/10 h-full flex flex-col justify-center">
                                                <div className="flex items-center justify-center gap-1.5 text-primary">
                                                    <Star className="w-5 h-5 fill-primary/20" />
                                                    <span className="text-2xl font-black">{reward.pointCost.toLocaleString()}</span>
                                                </div>
                                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Pts Required</p>
                                            </div>
                                        </Tooltip>
                                        <Tooltip content={`This is a ${REWARD_TYPE_DETAILS[reward.rewardType].label} reward.`}>
                                            <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100 h-full flex flex-col justify-center">
                                                <span className="text-lg font-black text-slate-700 capitalize truncate px-2">
                                                    {reward.rewardType.replace('_', ' ')}
                                                </span>
                                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Type</p>
                                            </div>
                                        </Tooltip>
                                    </div>

                                    {/* Mock Analytics Footer */}
                                    <div className="mt-auto pt-4 border-t border-slate-100">
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <Tooltip content="Total number of times this reward has been successfully claimed by customers.">
                                                <div className="text-center p-3 bg-purple-50 rounded-xl border border-purple-100/50">
                                                    <span className="text-xl font-black text-purple-600">{mockRedemptions.toLocaleString()}</span>
                                                    <p className="text-[9px] uppercase tracking-widest font-black text-purple-400 mt-1">Redemptions</p>
                                                </div>
                                            </Tooltip>
                                            <Tooltip content="Total volume of points that customers have burned on this specific reward.">
                                                <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-100/50">
                                                    <span className="text-xl font-black text-amber-600">{mockPointsRedeemed.toLocaleString()}</span>
                                                    <p className="text-[9px] uppercase tracking-widest font-black text-amber-400 mt-1">Pts Spent</p>
                                                </div>
                                            </Tooltip>
                                        </div>

                                        <button
                                            onClick={() => setViewingRewardForCustomers(reward)}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-all font-bold text-xs uppercase tracking-widest group/btn"
                                        >
                                            <Users className="w-4 h-4 text-slate-400 group-hover/btn:text-primary transition-colors" />
                                            View Customers
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                }
                </div>
            )}

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
                            className="bg-white w-full max-w-2xl text-slate-900 relative shadow-2xl rounded-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-8 overflow-y-auto scrollbar-hide">
                                <button
                                    onClick={resetForm}
                                    className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors z-10"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                                        <Gift className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-2xl font-display font-semibold tracking-tight text-slate-900 truncate">
                                            {editingId ? 'Edit Reward' : 'New Creation'}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">Configure your loyalty gift</p>
                                    </div>
                                </div>

                                {/* Progress Bar - Idiot Proofing */}
                                <div className="flex gap-1.5 mb-8">
                                    <div className={cn("h-1.5 flex-1 rounded-full transition-all", formData.name ? "bg-primary" : "bg-slate-100")} />
                                    <div className={cn("h-1.5 flex-1 rounded-full transition-all", (formData.pointCost ?? 0) > 0 ? "bg-primary" : "bg-slate-100")} />
                                    <div className={cn("h-1.5 flex-1 rounded-full transition-all", formData.imageUrl ? "bg-primary" : "bg-slate-100")} />
                                </div>

                                <div className="space-y-8">
                                    {/* Section 1: Core Configuration */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-slate-600">Step 1: Core Details</h4>
                                            {formData.name && (formData.pointCost ?? 0) > 0 && (
                                                <span className="flex items-center gap-1 text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-lg">
                                                    <CheckCircle2 size={10} /> Valid
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Name Input */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between ml-1">
                                                    <label className="text-xs font-medium text-slate-700">Reward Name <span className="text-rose-500">*</span></label>
                                                    {isSubmitted && !formData.name && <span className="text-[8px] font-bold text-rose-500 uppercase">Required</span>}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className={cn(
                                                        "w-full h-12 px-5 bg-slate-50 border rounded-xl font-bold text-sm outline-none transition-all",
                                                        isSubmitted && !formData.name 
                                                            ? "border-rose-400 bg-rose-50/30 focus:bg-white" 
                                                            : "border-transparent focus:bg-white focus:border-primary/20"
                                                    )}
                                                    placeholder="e.g. Complimentary Cappuccino"
                                                />
                                            </div>

                                            {/* Custom Dropdown for Reward Type */}
                                            <div className="space-y-2 relative">
                                                <label className="text-xs font-medium text-slate-700 ml-1">Category & Behavior</label>
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsTypeOpen(!isTypeOpen)}
                                                        className="w-full h-12 px-5 bg-slate-50 border border-transparent rounded-xl flex items-center justify-between group hover:bg-slate-100 transition-all font-bold text-sm"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {(() => {
                                                                const MetaIcon = REWARD_TYPE_DETAILS[formData.rewardType as RewardType].icon;
                                                                return <MetaIcon size={16} className="text-primary" />;
                                                            })()}
                                                            <span>{REWARD_TYPE_DETAILS[formData.rewardType as RewardType].label}</span>
                                                        </div>
                                                        <ChevronDown size={16} className={cn("text-slate-400 transition-transform", isTypeOpen && "rotate-180")} />
                                                    </button>

                                                    <AnimatePresence>
                                                        {isTypeOpen && (
                                                            <>
                                                                <div className="fixed inset-0 z-10" onClick={() => setIsTypeOpen(false)} />
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-20"
                                                                >
                                                                    <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
                                                                        {(Object.keys(REWARD_TYPE_DETAILS) as RewardType[]).map((type) => {
                                                                            const details = REWARD_TYPE_DETAILS[type];
                                                                            const Icon = details.icon;
                                                                            const isSelected = formData.rewardType === type;
                                                                            return (
                                                                                <button
                                                                                    key={type}
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setFormData({ ...formData, rewardType: type });
                                                                                        setIsTypeOpen(false);
                                                                                    }}
                                                                                    className={cn(
                                                                                        "w-full flex items-start gap-4 p-3 rounded-xl transition-all text-left group",
                                                                                        isSelected ? "bg-primary/5 border border-primary/10" : "hover:bg-slate-50 border border-transparent"
                                                                                    )}
                                                                                >
                                                                                    <div className={cn(
                                                                                        "size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                                                                        isSelected ? "bg-primary text-white" : "bg-slate-100 text-slate-400 group-hover:text-slate-600 shadow-sm"
                                                                                    )}>
                                                                                        <Icon size={14} />
                                                                                    </div>
                                                                                    <div className="min-w-0">
                                                                                        <p className={cn(
                                                                                            "text-[11px] font-black uppercase tracking-tight",
                                                                                            isSelected ? "text-primary" : "text-slate-900"
                                                                                        )}>
                                                                                            {details.label}
                                                                                        </p>
                                                                                        <p className="text-[10px] font-medium text-slate-400 leading-tight mt-0.5">
                                                                                            {details.description}
                                                                                        </p>
                                                                                    </div>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </motion.div>
                                                            </>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-slate-700 ml-1">Visible Description <span className="text-slate-400 font-normal">(Optional but Recommended)</span></label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={2}
                                                className="w-full p-5 bg-slate-50 border border-transparent rounded-xl font-bold text-sm focus:bg-white focus:border-primary/20 outline-none transition-all resize-none"
                                                placeholder="Tell customers what makes this reward special..."
                                            />
                                        </div>
                                    </div>

                                    {/* Section 2: Economics & Validity */}
                                    <div className="space-y-6">
                                        <h4 className="text-sm font-semibold text-slate-600">Step 2: Economics & Expiry</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Point Cost */}
                                            <div className={cn(
                                                "p-6 rounded-2xl border transition-all",
                                                isSubmitted && !formData.pointCost 
                                                    ? "bg-rose-50/30 border-rose-300" 
                                                    : "bg-primary/5 border-primary/10"
                                            )}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <label className="text-xs font-medium text-primary">Points Required <span className="text-rose-500">*</span></label>
                                                    <Tooltip content="How many points must a user earn to unlock this?">
                                                        <HelpCircle size={14} className="text-primary/40" />
                                                    </Tooltip>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="number"
                                                        value={formData.pointCost}
                                                        onChange={(e) => setFormData({ ...formData, pointCost: parseInt(e.target.value) || 0 })}
                                                        className="bg-white/50 border-b-2 border-primary/10 focus:border-primary focus:bg-white px-2 py-1 outline-none transition-all font-display font-semibold text-3xl text-primary w-full rounded-t-lg"
                                                        placeholder="0"
                                                    />
                                                    <span className="text-xs font-bold text-primary/50 uppercase whitespace-nowrap">Pts to Redeem</span>
                                                </div>
                                                {isSubmitted && !formData.pointCost && (
                                                    <p className="text-[9px] font-bold text-rose-500 uppercase mt-2 flex items-center gap-1">
                                                        <AlertCircle size={10} /> Cost cannot be zero
                                                    </p>
                                                )}
                                                <p className="text-[10px] font-medium text-primary/70 mt-3 pt-3 border-t border-primary/10 leading-relaxed">
                                                    Ensure you set a reasonable point cost. For example, if you offer 10 default points on every visit, a 100-point cost takes 10 visits.
                                                </p>
                                            </div>

                                            {/* Reward Value */}
                                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="flex items-center justify-between mb-4">
                                                    <label className="text-xs font-medium text-slate-700">Reward Value</label>
                                                    <Tooltip content="Monetary value of this reward">
                                                        <HelpCircle size={14} className="text-slate-400" />
                                                    </Tooltip>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl font-bold text-slate-400">₦</span>
                                                    <input
                                                        type="number"
                                                        value={formData.value}
                                                        onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) || 0 })}
                                                        className="bg-white/50 border-b-2 border-slate-200 focus:border-primary focus:bg-white px-2 py-1 outline-none transition-all font-display font-semibold text-3xl text-slate-900 w-full rounded-t-lg"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <p className="text-[10px] font-medium text-slate-400 mt-2 italic">Actual monetary value to the customer.</p>
                                            </div>

                                            {/* Total Quantity */}
                                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="flex items-center justify-between mb-4">
                                                    <label className="text-xs font-medium text-slate-700">Total Quantity</label>
                                                    <Tooltip content="How many of this reward are available in total? Leave 0 for unlimited.">
                                                        <HelpCircle size={14} className="text-slate-400" />
                                                    </Tooltip>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="number"
                                                        value={formData.totalAvailable || ''}
                                                        onChange={(e) => setFormData({ ...formData, totalAvailable: parseInt(e.target.value) || 0 })}
                                                        className="bg-white/50 border-b-2 border-slate-200 focus:border-primary focus:bg-white px-2 py-1 outline-none transition-all font-display font-semibold text-3xl text-slate-900 w-full rounded-t-lg"
                                                        placeholder="0 (Unlimited)"
                                                    />
                                                </div>
                                                <p className="text-[10px] font-medium text-slate-400 mt-2 italic">Leave as 0 for unlimited stock.</p>
                                            </div>

                                            {/* Validity */}
                                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="flex items-center justify-between mb-4">
                                                    <label className="text-xs font-medium text-slate-700">Lifespan</label>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={12} className="text-slate-400" />
                                                        <span className="text-xs font-semibold text-slate-400">Days</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="number"
                                                        value={formData.validityDays}
                                                        onChange={(e) => setFormData({ ...formData, validityDays: parseInt(e.target.value) || 0 })}
                                                        className="bg-white/50 border-b-2 border-slate-200 focus:border-primary focus:bg-white px-2 py-1 outline-none transition-all font-display font-semibold text-3xl text-slate-900 w-full rounded-t-lg"
                                                    />
                                                </div>
                                                <p className="text-[10px] font-medium text-slate-400 mt-2 italic">Must use within {formData.validityDays || 0} days.</p>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                                                <HelpCircle size={18} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Business Tip</p>
                                                <p className="text-xs text-amber-900/70 font-medium leading-relaxed">
                                                    Higher point costs (e.g. 500+) drive deeper loyalty but can discourage new users. 
                                                    Try starting with a "Welcome Reward" at 100-200 points.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 3: Media */}
                                    <div className="space-y-4 pb-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-slate-600">Cover Image</h4>
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
                                                "relative h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden",
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
                                                            onClick={() => {
                                                                setFormData(prev => ({ ...prev, imageUrl: '' }));
                                                                setLocalImageFile(null);
                                                            }}
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

                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between sticky bottom-0 z-30">
                                <button
                                    onClick={resetForm}
                                    disabled={isUploading}
                                    className="px-6 py-3 font-semibold text-sm text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-50"
                                >
                                    Go Back
                                </button>
                                <div className="flex items-center gap-4">
                                    {(!formData.name || !formData.pointCost) && isSubmitted && !isUploading && (
                                        <span className="text-xs font-semibold text-rose-500 animate-pulse">
                                            Basics Required
                                        </span>
                                    )}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isUploading || !formData.name || !formData.pointCost}
                                        className={cn(
                                            "px-10 py-4 font-semibold text-sm rounded-2xl transition-all flex items-center gap-2",
                                            (isUploading || !formData.name || !formData.pointCost) 
                                                ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                                                : "bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95"
                                        )}
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                {editingId ? 'Update Reward' : 'Confirm & Launch'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Redemptions Modal - Mocked */}
            <AnimatePresence>
                {viewingRewardForCustomers && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setViewingRewardForCustomers(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-3xl text-slate-900 relative shadow-2xl rounded-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 ring-4 ring-primary/5 shrink-0">
                                        <Users className="w-7 h-7 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-display font-bold text-slate-900">Reward Redemptions</h3>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                                            Tracking customers for: <span className="text-primary font-bold uppercase">{viewingRewardForCustomers.name}</span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setViewingRewardForCustomers(null)}
                                    className="p-3 hover:bg-white hover:shadow-sm rounded-2xl transition-all border border-transparent hover:border-slate-200"
                                >
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            {/* Modal Content - Mock List */}
                            <div className="flex-grow overflow-y-auto p-8 scrollbar-hide">
                                <div className="space-y-6">
                                    {/* Mock Redemption List */}
                                    {[
                                        { name: "Chidi Okafor", email: "chidi.o@gmail.com", date: "2 mins ago", points: viewingRewardForCustomers.pointCost, status: "Verified" },
                                        { name: "Fatima Yusuf", email: "f.yusuf@yahoo.com", date: "1 hour ago", points: viewingRewardForCustomers.pointCost, status: "Verified" },
                                        { name: "Bolaji Adeyemi", email: "adeyemi.b@icloud.com", date: "Yesterday, 4:30 PM", points: viewingRewardForCustomers.pointCost, status: "Verified" },
                                        { name: "Ngozi Obi", email: "ngozi@ngozi.com", date: "March 11, 2024", points: viewingRewardForCustomers.pointCost, status: "Verified" },
                                        { name: "Emeka John", email: "emeka.j@gmail.com", date: "March 10, 2024", points: viewingRewardForCustomers.pointCost, status: "Verified" },
                                    ].map((redemption, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary/10 hover:shadow-sm transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 group-hover:bg-primary/5 group-hover:text-primary transition-colors uppercase">
                                                    {redemption.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{redemption.name}</p>
                                                    <p className="text-xs text-slate-400 font-medium">{redemption.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-2 justify-end">
                                                    <Calendar size={12} className="text-slate-300" />
                                                    <span className="text-xs font-bold text-slate-500">{redemption.date}</span>
                                                </div>
                                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">
                                                    -{redemption.points} Pts
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="py-4 text-center">
                                        <p className="text-xs text-slate-400 font-medium italic">Showing the 5 most recent redemptions</p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-8 bg-slate-50 border-t border-slate-100 shrink-0">
                                <button
                                    onClick={() => setViewingRewardForCustomers(null)}
                                    className="w-full py-4 bg-white border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50 transition-all"
                                >
                                    Close Overview
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
