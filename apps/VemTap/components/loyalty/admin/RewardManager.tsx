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
import Cropper, { Point, Area } from 'react-easy-crop';
import useEmblaCarousel from 'embla-carousel-react';
import { getCroppedImg } from '@/lib/image-utils';
import { Reward, RewardType, Redemption } from '@/types/loyalty';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/notify';
import Tooltip from '@/components/ui/Tooltip';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useRewardRedemptions } from '@/services/loyalty/hooks';
import { formatDistanceToNow } from 'date-fns';

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
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
                                Tracking customers for: <span className="text-primary font-bold uppercase">{reward.name}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-white hover:shadow-sm rounded-2xl transition-all border border-transparent hover:border-slate-200"
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
                <div className="p-8 bg-slate-50 border-t border-slate-100 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-white border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50 transition-all"
                    >
                        Close Overview
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const CropperModal: React.FC<{
    image: string;
    onCropComplete: (croppedImage: Blob) => void;
    onClose: () => void;
}> = ({ image, onCropComplete, onClose }) => {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropChange = (crop: Point) => setCrop(crop);
    const onZoomChange = (zoom: number) => setZoom(zoom);
    const onCropAreaChange = (croppedArea: Area, croppedAreaPixels: Area) => setCroppedAreaPixels(croppedAreaPixels);

    const handleSave = async () => {
        if (croppedAreaPixels) {
            try {
                const croppedImage = await getCroppedImg(image, croppedAreaPixels);
                if (croppedImage) {
                    onCropComplete(croppedImage);
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
                onClick={onClose}
            />
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden relative shadow-2xl"
            >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <h3 className="text-xl font-display font-black text-slate-900">Crop Reward Hero</h3>
                        <p className="text-xs text-slate-500 font-medium">Position your image for the best view on the card</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all"><X size={20} /></button>
                </div>
                
                <div className="relative h-[400px] w-full bg-slate-200">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={16 / 10}
                        onCropChange={onCropChange}
                        onCropComplete={onCropAreaChange}
                        onZoomChange={onZoomChange}
                    />
                </div>

                <div className="p-6 bg-white flex flex-col gap-6">
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                            <span>Zoom</span>
                            <span>{Math.round(zoom * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all">Cancel</button>
                        <button onClick={handleSave} className="flex-2 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all">Apply Crop</button>
                    </div>
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
    }
};

export const RewardManager: React.FC<RewardManagerProps> = ({ rewards, onCreate, onUpdate, onDelete, className, templates, onApplyTemplate, isApplyingTemplate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templateSearchQuery, setTemplateSearchQuery] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isTypeOpen, setIsTypeOpen] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingRewardForCustomers, setViewingRewardForCustomers] = useState<Reward | null>(null);
    const [croppingImage, setCroppingImage] = useState<{ url: string, isGallery?: boolean } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const [localImageFile, setLocalImageFile] = useState<File | null>(null);
    const [localGalleryFiles, setLocalGalleryFiles] = useState<File[]>([]);

    const [formData, setFormData] = useState<Partial<Reward>>({
        name: '',
        description: '',
        rewardType: 'free_item',
        pointCost: 100,
        validityDays: 30,
        value: 0,
        totalAvailable: 0,
        isActive: true,
        imageUrls: []
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
            imageUrls: []
        });
        setLocalImageFile(null);
        setLocalGalleryFiles([]);
        setIsAdding(false);
        setEditingId(null);
        setIsSubmitted(false);
        setIsTypeOpen(false);
        setIsUploading(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCroppingImage({ url: reader.result as string, isGallery: false });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            const file = files[0]; // Just crop the first one for now, or we can sequence them
            const reader = new FileReader();
            reader.onloadend = () => {
                setCroppingImage({ url: reader.result as string, isGallery: true });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (blob: Blob) => {
        const file = new File([blob], "cropped-reward.jpg", { type: 'image/jpeg' });
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            if (croppingImage?.isGallery) {
                setLocalGalleryFiles(prev => [...prev, file]);
                setFormData(prev => ({ 
                    ...prev, 
                    imageUrls: [...(prev.imageUrls || []), result] 
                }));
            } else {
                setLocalImageFile(file);
                setFormData(prev => {
                    const currentUrls = [...(prev.imageUrls || [])];
                    if (currentUrls.length > 0 && currentUrls[0].startsWith('data:')) {
                        currentUrls[0] = result;
                    } else {
                        currentUrls.unshift(result);
                    }
                    return { ...prev, imageUrls: currentUrls };
                });
            }
            setCroppingImage(null);
        };
        reader.readAsDataURL(blob);
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
            let finalImageUrls = [...(formData.imageUrls || [])];

            if (localImageFile || localGalleryFiles.length > 0) {
                toastId = notify.loading('Uploading reward images to Cloudinary...');
                
                // Filter out local data URLs
                let remoteUrls = finalImageUrls.filter(url => !url.startsWith('data:'));

                if (localImageFile) {
                    const uploadedMain = await uploadToCloudinary(localImageFile);
                    remoteUrls.unshift(uploadedMain);
                }

                if (localGalleryFiles.length > 0) {
                    const uploadedGallery = await Promise.all(localGalleryFiles.map(f => uploadToCloudinary(f)));
                    remoteUrls = [...remoteUrls, ...uploadedGallery];
                }

                finalImageUrls = remoteUrls;
                notify.dismiss(toastId);
            }

            const submissionData = { 
                ...formData, 
                imageUrls: finalImageUrls
            };

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
                    onClick={() => {
                        if (templates && templates.length > 0) {
                            setShowTemplateModal(true);
                        } else {
                            setIsAdding(true);
                        }
                    }}
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
                        const typeDetails = REWARD_TYPE_DETAILS[reward.rewardType] || REWARD_TYPE_DETAILS['free_item'];
                        const Icon = typeDetails.icon;
                        const redemptionsCount = reward.totalRedeemed || 0;
                        const pointsSpent = redemptionsCount * reward.pointCost;

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
                                    <RewardGallery 
                                        items={reward.imageUrls && reward.imageUrls.length > 0 ? reward.imageUrls : [reward.imageUrl].filter(Boolean) as string[]} 
                                        name={reward.name} 
                                    />
                                    
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
                                                    <span className="text-2xl font-black">{(reward.pointCost ?? 0).toLocaleString()}</span>
                                                </div>
                                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Pts Required</p>
                                            </div>
                                        </Tooltip>
                                        <Tooltip content={`Category: ${(REWARD_TYPE_DETAILS[reward.rewardType] || REWARD_TYPE_DETAILS['free_item']).label}`}>
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
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
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
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-4xl text-slate-900 relative shadow-2xl rounded-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                                <div>
                                    <h3 className="text-2xl font-display font-bold text-slate-900">Add a New Reward</h3>
                                    <p className="text-sm text-slate-500 font-medium mt-1">Choose a pre-made template to get started quickly, or create a new reward from scratch.</p>
                                </div>
                                <button
                                    onClick={() => setShowTemplateModal(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
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
                                            const previewUrl = templateImage ? (templateImage.imageUrl || templateImage.imageUrls[0]) : null;

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
                                                                {template.rewards?.length || 0} REWARDS
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
                                                                {template.rules?.ruleType || 'rules'}
                                                            </span>
                                                        </div>

                                                        <div className="mt-auto pt-4 border-t border-slate-100">
                                                            <button
                                                                onClick={() => {
                                                                    if (onApplyTemplate) {
                                                                        onApplyTemplate(template.id).then(() => setShowTemplateModal(false));
                                                                    }
                                                                }}
                                                                disabled={isApplyingTemplate}
                                                                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
                                                            >
                                                                {isApplyingTemplate ? <Loader2 size={14} className="animate-spin" /> : null}
                                                                Apply Template
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
                                <p className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-widest">Want full control?</p>
                                <button
                                    onClick={() => {
                                        setShowTemplateModal(false);
                                        setIsAdding(true);
                                    }}
                                    className="px-8 py-3 bg-white border-2 border-slate-200 hover:border-primary/40 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
                                >
                                    Create a Reward from Scratch
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {croppingImage && (
                    <CropperModal 
                        image={croppingImage.url} 
                        onCropComplete={handleCropComplete} 
                        onClose={() => setCroppingImage(null)} 
                    />
                )}
            </AnimatePresence>

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

                                {/* Progress Bar */}
                                    <div className="flex gap-1.5 mb-8">
                                        <div className={cn("h-1.5 flex-1 rounded-full transition-all", formData.name ? "bg-primary" : "bg-slate-100")} />
                                        <div className={cn("h-1.5 flex-1 rounded-full transition-all", (formData.pointCost ?? 0) > 0 ? "bg-primary" : "bg-slate-100")} />
                                        <div className={cn("h-1.5 flex-1 rounded-full transition-all", (formData.imageUrls?.length || 0) > 0 ? "bg-primary" : "bg-slate-100")} />
                                    </div>

                                <div className="space-y-8">
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
                                                                const MetaDetails = REWARD_TYPE_DETAILS[formData.rewardType as RewardType] || REWARD_TYPE_DETAILS['free_item'];
                                                                const MetaIcon = MetaDetails.icon;
                                                                return <MetaIcon size={16} className="text-primary" />;
                                                            })()}
                                                            <span>{(REWARD_TYPE_DETAILS[formData.rewardType as RewardType] || REWARD_TYPE_DETAILS['free_item']).label}</span>
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
                                            <label className="text-xs font-medium text-slate-700 ml-1">Visible Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={2}
                                                className="w-full p-5 bg-slate-50 border border-transparent rounded-xl font-bold text-sm focus:bg-white focus:border-primary/20 outline-none transition-all resize-none"
                                                placeholder="Tell customers what makes this reward special..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="text-sm font-semibold text-slate-600">Step 2: Economics & Expiry</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className={cn(
                                                "p-6 rounded-2xl border transition-all",
                                                isSubmitted && !formData.pointCost 
                                                    ? "bg-rose-50/30 border-rose-300" 
                                                    : "bg-primary/5 border-primary/10"
                                            )}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <label className="text-xs font-medium text-primary">Points Required <span className="text-rose-500">*</span></label>
                                                    <HelpCircle size={14} className="text-primary/40" />
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="number"
                                                        value={formData.pointCost}
                                                        onChange={(e) => setFormData({ ...formData, pointCost: parseInt(e.target.value) || 0 })}
                                                        className="bg-white/50 border-b-2 border-primary/10 focus:border-primary focus:bg-white px-2 py-1 outline-none transition-all font-display font-semibold text-3xl text-primary w-full rounded-t-lg"
                                                    />
                                                </div>
                                            </div>

                                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                <label className="text-xs font-medium text-slate-700 block mb-4">Lifespan (Days)</label>
                                                <input
                                                    type="number"
                                                    value={formData.validityDays}
                                                    onChange={(e) => setFormData({ ...formData, validityDays: parseInt(e.target.value) || 0 })}
                                                    className="bg-white/50 border-b-2 border-slate-200 focus:border-primary focus:bg-white px-2 py-1 outline-none transition-all font-display font-semibold text-3xl text-slate-900 w-full rounded-t-lg"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pb-4">
                                        <h4 className="text-sm font-semibold text-slate-600">Cover Image</h4>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageUpload}
                                            accept="image/*"
                                            className="hidden"
                                            disabled={isUploading}
                                        />
                                        <div
                                            className={cn(
                                                "relative h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden",
                                                (formData.imageUrls?.length || 0) > 0 ? "border-solid border-slate-200 bg-white" : "border-slate-200 bg-slate-50 hover:bg-white hover:border-primary/40",
                                                isUploading && "opacity-50 cursor-wait"
                                            )}
                                        >
                                            {isUploading ? (
                                                <div className="flex flex-col items-center gap-3">
                                                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                                    <p className="text-[10px] font-black uppercase text-primary">Uploading Image...</p>
                                                </div>
                                            ) : formData.imageUrls && formData.imageUrls.length > 0 ? (
                                                <div className="w-full h-full relative group">
                                                    <img src={formData.imageUrls[0]} alt="Reward Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
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
                                                                setFormData(prev => {
                                                                    const newUrls = [...(prev.imageUrls || [])];
                                                                    newUrls.shift(); // Remove the first image
                                                                    return { ...prev, imageUrls: newUrls };
                                                                });
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

                                    {/* Gallery Images */}
                                    <div className="space-y-4 pb-8">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-slate-600">Gallery Images</h4>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formData.imageUrls?.length || 0} Images</span>
                                        </div>
                                        <input
                                            type="file"
                                            ref={galleryInputRef}
                                            onChange={handleGalleryUpload}
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            disabled={isUploading}
                                        />
                                        <div className="grid grid-cols-4 gap-4">
                                            {(formData.imageUrls || []).map((url, idx) => (
                                                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-100 shadow-sm">
                                                    <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button
                                                            onClick={() => {
                                                                const newUrls = [...(formData.imageUrls || [])];
                                                                newUrls.splice(idx, 1);
                                                                setFormData({ ...formData, imageUrls: newUrls });
                                                                
                                                                // Also need to handle local files if it was a local upload
                                                                // For simplicity, we just filter the state in next submit
                                                            }}
                                                            className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => galleryInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-white hover:border-primary/40 transition-all text-slate-400 hover:text-primary gap-1"
                                            >
                                                <Plus size={20} />
                                                <span className="text-[9px] font-black uppercase">Add Image</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <button onClick={resetForm} className="text-sm font-semibold text-slate-400">Cancel</button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-10 py-4 bg-primary text-white font-semibold text-sm rounded-2xl shadow-xl shadow-primary/20"
                                >
                                    {editingId ? 'Update Reward' : 'Confirm & Launch'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
