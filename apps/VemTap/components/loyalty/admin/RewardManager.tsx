"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Trash2, Edit2, Gift, Ticket, Tag, Clock, Save, X, 
    Eye, ImageIcon, Upload, Image as ImageIcon2, HelpCircle, 
    Wallet, Package, Percent, ChevronDown, CheckCircle2, 
    AlertCircle, Star, Search, Users, Calendar, LucideIcon, Loader2, Zap, LayoutTemplate,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { Point, Area } from 'react-easy-crop';
import useEmblaCarousel from 'embla-carousel-react';
import { Reward, RewardType, Redemption } from '@/types/loyalty';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/notify';
import Tooltip from '@/components/ui/Tooltip';
import { useRewardRedemptions } from '@/services/loyalty/hooks';
import { formatDistanceToNow } from 'date-fns';
import { RewardCreationModal } from './RewardCreationModal';

interface RewardManagerProps {
    rewards: Reward[];
    onCreate: (reward: Partial<Reward>) => Promise<void>;
    onUpdate: (id: string, updates: Partial<Reward>) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    className?: string;
    templates?: any[];
    onApplyTemplate?: (templateId: string) => Promise<void>;
    isApplyingTemplate?: boolean;
}

const RedemptionsModal: React.FC<{ 
    reward: Reward; 
    onClose: () => void 
}> = ({ reward, onClose }) => {
    const { data: redemptions, isLoading } = useRewardRedemptions(reward.id);

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-8">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 100 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 100 }}
                className="bg-white w-full max-w-3xl text-slate-900 relative shadow-2xl rounded-t-[2.5rem] md:rounded-2xl border border-slate-200 overflow-hidden flex flex-col h-[92vh] md:h-auto md:max-h-[85vh]"
            >
                {/* Modal Header */}
                <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4 md:gap-5">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 ring-4 ring-primary/5 shrink-0">
                            <Users className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-lg md:text-xl font-display font-bold text-slate-900 truncate">Reward Redemptions</h3>
                            <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-0.5 truncate">
                                For: <span className="text-primary font-bold uppercase">{reward.name}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 md:p-3 hover:bg-white hover:shadow-sm rounded-xl md:rounded-2xl transition-all border border-transparent hover:border-slate-200"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex-grow overflow-y-auto p-8 scrollbar-hide min-h-[300px]">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Customers...</p>
                        </div>
                    ) : redemptions && redemptions.length > 0 ? (
                        <div className="space-y-6">
                            {redemptions.map((redemption) => {
                                const profile = (redemption as any).loyaltyProfile;
                                const user = profile?.user;
                                const firstName = user?.firstName || 'Unknown';
                                const lastName = user?.lastName || 'Customer';
                                const initials = `${firstName[0]}${lastName[0]}`;

                                return (
                                    <div key={redemption.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary/10 hover:shadow-sm transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 group-hover:bg-primary/5 group-hover:text-primary transition-colors uppercase">
                                                {initials}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{firstName} {lastName}</p>
                                                <p className="text-xs text-slate-400 font-medium">{user?.email || 'No email'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                <Calendar size={12} className="text-slate-300" />
                                                <span className="text-xs font-bold text-slate-500">
                                                    {formatDistanceToNow(new Date(redemption.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">
                                                -{redemption.pointsSpent} Pts
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl p-12">
                            <Users className="w-12 h-12 text-slate-200 mb-4" />
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No redemptions yet</p>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full h-12 bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50 transition-all"
                    >
                        Close Overview
                    </button>
                </div>
            </motion.div>
        </div>
    );
};


const RewardGallery: React.FC<{ items: string[], name: string }> = ({ items, name }) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
    
    return (
        <div className="relative w-full aspect-video overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 shadow-inner group/gallery">
            <div className="overflow-hidden h-full" ref={emblaRef}>
                <div className="flex h-full">
                    {items.map((url, index) => (
                        <div className="flex-[0_0_100%] min-w-0 h-full relative" key={index}>
                            <img
                                src={url}
                                alt={`${name} - ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {items.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); emblaApi?.scrollPrev(); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-900 opacity-0 group-hover/gallery:opacity-100 transition-all hover:bg-white shadow-lg"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); emblaApi?.scrollNext(); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-900 opacity-0 group-hover/gallery:opacity-100 transition-all hover:bg-white shadow-lg"
                    >
                        <ChevronRight size={16} />
                    </button>
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[8px] font-black text-white uppercase tracking-tighter">
                        {items.length} Images
                    </div>
                </>
            )}
        </div>
    );
};

const REWARD_TYPE_DETAILS: Record<RewardType, { label: string, description: string, icon: LucideIcon }> = {
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
    },
    // New types mapping to existing UI categories
    custom_discount: {
        label: "Custom Discount",
        description: "Apply percentage or fixed price reduction on checkout.",
        icon: Percent
    },
    free_product: {
        label: "Free Product",
        description: "Offer a specific item at no cost to the customer.",
        icon: Package
    },
    service_upgrade: {
        label: "Service Upgrade",
        description: "Complimentary services or feature upgrades.",
        icon: Ticket
    },
    tangible_gifts: {
        label: "Tangible Gift",
        description: "A surprise physical reward or gift package.",
        icon: Gift
    }
};

export const RewardManager: React.FC<RewardManagerProps> = ({ rewards, onCreate, onUpdate, onDelete, className, templates, onApplyTemplate, isApplyingTemplate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templateSearchQuery, setTemplateSearchQuery] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingRewardForCustomers, setViewingRewardForCustomers] = useState<Reward | null>(null);
    const [editingReward, setEditingReward] = useState<Reward | null>(null);

    const resetForm = () => {
        setIsAdding(false);
        setEditingReward(null);
    };


    const handleEdit = (reward: Reward) => {
        setEditingReward(reward);
        setIsAdding(true);
    };

    return (
        <div className={cn("space-y-8", className)}>
            {/* Header & Add Button */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h3 className="text-2xl md:text-xl font-display font-black text-slate-900">Reward Catalog</h3>
                    <p className="text-sm text-slate-500 font-medium">Manage the rewards available to your customers</p>
                </div>
                <button
                    onClick={() => {
                        if (templates && templates.length > 0) {
                            setShowTemplateModal(true);
                        } else {
                            setIsAdding(true);
                        }
                    }}
                    className="w-full md:w-auto bg-primary text-white px-6 h-12 md:h-12 font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 rounded-2xl"
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
                        const r = reward as any;
                        const category = r.category || r.rewardType || 'free_product';
                        const pointsReq = r.pointsRequired ?? r.pointCost ?? 0;
                        const redemptionsCount = r.redemptionCount ?? r.totalRedeemed ?? 0;
                        const typeDetails = REWARD_TYPE_DETAILS[category as RewardType] || REWARD_TYPE_DETAILS['free_product'];
                        const Icon = typeDetails.icon;
                        const pointsSpent = redemptionsCount * pointsReq;

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
                                    {/* Prominent Image Section */}
                                    {(() => {
                                        const r = reward as any;
                                        const images = r.galleryImages && r.galleryImages.length > 0
                                            ? r.galleryImages
                                            : [r.coverImage || r.imageUrl].filter(Boolean) as string[];
                                        return <RewardGallery items={images} name={r.name} />;
                                    })()}
                                    
                                    <div className="relative mb-5">
                                        {/* Tag overlay */}
                                        <div className="absolute -top-12 left-3 flex gap-2">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-widest font-black shadow-sm backdrop-blur-md",
                                                reward.isActive ? "bg-emerald-500/90 text-white" : "bg-slate-800/90 text-slate-300"
                                            )}>
                                                {reward.isActive ? 'Active' : 'Disabled'}
                                            </span>
                                        </div>

                                        {/* Edit Button overlay */}
                                        <div className="absolute -top-12 right-3">
                                            <button
                                                onClick={() => handleEdit(reward)}
                                                className="p-2.5 bg-white/90 backdrop-blur-md text-slate-900 rounded-xl shadow-lg hover:bg-white transition-colors border border-white/20"
                                                title="Edit Reward"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-display font-black text-slate-900 text-xl line-clamp-1">{reward.name}</h4>
                                            <p className="text-sm text-slate-500 font-medium mt-1 line-clamp-2 min-h-[40px]">
                                                {reward.description || 'No description provided for this reward.'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stats grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-5">
                                        <Tooltip content="Points required to unlock this.">
                                            <div className="p-3 bg-primary/5 rounded-2xl text-center border border-primary/10 h-full flex flex-col justify-center">
                                                <div className="flex items-center justify-center gap-1.5 text-primary">
                                                    <Star className="w-5 h-5 fill-primary/20" />
                                                    <span className="text-2xl font-black">{pointsReq.toLocaleString()}</span>
                                                </div>
                                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Pts Required</p>
                                            </div>
                                        </Tooltip>
                                        <Tooltip content={`Category: ${typeDetails.label}`}>
                                            <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100 h-full flex flex-col justify-center">
                                                <div className="flex justify-center mb-1">
                                                    <Icon className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Type</p>
                                            </div>
                                        </Tooltip>
                                    </div>

                                    {/* Real Analytics Footer */}
                                    <div className="mt-auto pt-4 border-t border-slate-100">
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <Tooltip content="Total redemptions for this reward.">
                                                <div className="text-center p-3 bg-purple-50 rounded-xl border border-purple-100/50">
                                                    <span className="text-xl font-black text-purple-600">{redemptionsCount.toLocaleString()}</span>
                                                    <p className="text-[9px] uppercase tracking-widest font-black text-purple-400 mt-1">Redemptions</p>
                                                </div>
                                            </Tooltip>
                                            <Tooltip content="Total points burned on this reward.">
                                                <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-100/50">
                                                    <span className="text-xl font-black text-amber-600">{pointsSpent.toLocaleString()}</span>
                                                    <p className="text-[9px] uppercase tracking-widest font-black text-amber-400 mt-1">Pts Spent</p>
                                                </div>
                                            </Tooltip>
                                        </div>

                                        <div className="grid grid-cols-5 gap-2">
                                            <button
                                                onClick={() => setViewingRewardForCustomers(reward)}
                                                className="col-span-4 flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all font-bold text-xs uppercase tracking-widest group/btn shadow-lg shadow-slate-900/10"
                                            >
                                                <Users className="w-4 h-4 text-slate-400 group-hover/btn:text-primary transition-colors" />
                                                View Customers
                                            </button>
                                            {onDelete && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm('Are you sure you want to delete this reward?')) {
                                                            onDelete(reward.id);
                                                        }
                                                    }}
                                                    className="flex items-center justify-center p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-500 rounded-xl transition-all"
                                                    title="Delete Reward"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                }
                </div>
            )}

            {/* Template Selection Modal */}
            <AnimatePresence>
                {showTemplateModal && (
                    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-8">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowTemplateModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 100 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 100 }}
                            className="bg-white w-full max-w-4xl text-slate-900 relative shadow-2xl rounded-t-[2.5rem] md:rounded-2xl border border-slate-200 overflow-hidden flex flex-col h-[92vh] md:h-auto md:max-h-[90vh]"
                        >
                            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                                <div className="min-w-0">
                                    <h3 className="text-xl md:text-2xl font-display font-bold text-slate-900 truncate">Add a New Reward</h3>
                                    <p className="text-[10px] md:text-sm text-slate-500 font-medium mt-1 line-clamp-1">Blueprint templates for quick creation.</p>
                                </div>
                                <button
                                    onClick={() => setShowTemplateModal(false)}
                                    className="p-2.5 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="p-6 bg-slate-50 border-b border-slate-100 shrink-0">
                                <div className="relative max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search templates..."
                                        value={templateSearchQuery}
                                        onChange={(e) => setTemplateSearchQuery(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl h-10 pl-10 pr-4 text-sm font-medium outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex-grow overflow-y-auto p-6 scrollbar-hide min-h-[300px] bg-slate-50/50">
                                {templates && templates.filter(t => t.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) || (t.description || '').toLowerCase().includes(templateSearchQuery.toLowerCase())).length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {templates.filter(t => t.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) || (t.description || '').toLowerCase().includes(templateSearchQuery.toLowerCase())).map((template) => {
                                            // Correctly resolve preview image from rewards
                                            const templateImage = template.rewards?.find((r: any) => r.imageUrl || (r.imageUrls && r.imageUrls.length > 0));
                                            const previewUrl = templateImage ? (templateImage.imageUrl || templateImage.imageUrls[0]) : (template.coverImage || (template.galleryImages && template.galleryImages[0]));

                                            return (
                                                <div
                                                    key={template.id}
                                                    className="border border-slate-200 rounded-3xl overflow-hidden bg-white hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col group cursor-pointer"
                                                >
                                                    {/* Template Hero Image */}
                                                    <div className="w-full aspect-[16/10] bg-slate-100 border-b border-slate-100 relative">
                                                        {previewUrl ? (
                                                            <img
                                                                src={previewUrl}
                                                                alt={template.name}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                                                <LayoutTemplate className="w-10 h-10 mb-2 opacity-20" />
                                                                <span className="text-[10px] font-black uppercase tracking-tighter opacity-40">Preset Template</span>
                                                            </div>
                                                        )}
                                                        <div className="absolute top-3 left-3">
                                                            <span className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-primary border border-primary/10 shadow-sm">
                                                                {template.rewards?.length || 1} {template.rewards?.length === 1 ? 'REWARD' : 'REWARDS'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="p-5 flex flex-col flex-grow">
                                                        <div className="mb-4">
                                                            <p className="text-lg font-display font-black text-slate-900 leading-tight">{template.name}</p>
                                                            <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-1 min-h-[32px]">{template.description || 'Professional loyalty blueprint'}</p>
                                                        </div>

                                                        <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-widest font-black text-slate-400 mb-5">
                                                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1.5">
                                                                <Zap className="w-3 h-3 text-amber-500" />
                                                                {template.category || template.rules?.ruleType || 'rules'}
                                                            </span>
                                                        </div>

                                                        <div className="mt-auto pt-4 border-t border-slate-100">
                                                            <button
                                                                onClick={() => {
                                                                    const prefill: any = {
                                                                        name: template.name,
                                                                        description: template.description || '',
                                                                        rewardType: template.category || 'free_product',
                                                                        pointCost: template.pointsRequired || 100,
                                                                        imageUrls: template.galleryImages || (template.coverImage ? [template.coverImage] : []),
                                                                        templateId: template.id
                                                                    };
                                                                    setEditingReward(prefill);
                                                                    setIsAdding(true);
                                                                    setShowTemplateModal(false);
                                                                }}
                                                                className="w-full h-12 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
                                                            >
                                                                Customize & Apply
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-[200px]">
                                        <Search className="w-12 h-12 text-slate-200 mb-4" />
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No templates found</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-white border-t border-slate-100 flex flex-col items-center shrink-0">
                                <p className="text-xs font-black text-slate-400 mb-3 uppercase tracking-[0.2em]">Want full control?</p>
                                <button
                                    onClick={() => {
                                        setShowTemplateModal(false);
                                        setIsAdding(true);
                                    }}
                                    className="w-full md:w-auto px-8 h-12 bg-white border-2 border-slate-200 hover:border-primary/40 hover:bg-slate-50 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                                >
                                    Create from Scratch
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <RewardCreationModal 
                isOpen={isAdding} 
                onClose={resetForm} 
                onCreate={onCreate} 
                onUpdate={onUpdate}
                initialData={editingReward}
            />

            <AnimatePresence>
                {viewingRewardForCustomers && (
                    <RedemptionsModal 
                        reward={viewingRewardForCustomers} 
                        onClose={() => setViewingRewardForCustomers(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
