"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Trash2, Gift, Ticket, Save, X, 
    Image as ImageIcon2, HelpCircle, 
    Wallet, Package, Percent, ChevronDown, CheckCircle2, 
    LucideIcon, Loader2, ChevronLeft, ChevronRight, Users, Zap, Search
} from 'lucide-react';
import Cropper, { Point, Area } from 'react-easy-crop';
import useEmblaCarousel from 'embla-carousel-react';
import { getCroppedImg } from '@/lib/image-utils';
import { Reward, RewardType } from '@/types/loyalty';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/notify';
import Tooltip from '@/components/ui/Tooltip';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useCatalogueOffersAdmin } from '@/services/catalogue/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';

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
    custom_discount: {
        label: "Custom Discount",
        description: "Apply percentage or fixed price reduction on checkout.",
        icon: Percent
    },
    free_item: {
        label: "Free Product",
        description: "Offer a specific item at no cost to the customer.",
        icon: Package
    },
    free_product: {
        label: "Free Product",
        description: "Offer a specific item at no cost to the customer.",
        icon: Package
    },
    service: {
        label: "Service Upgrade",
        description: "Complimentary services or feature upgrades.",
        icon: Ticket
    },
    service_upgrade: {
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
    tangible_gifts: {
        label: "Tangible Gift",
        description: "A surprise physical reward or gift package.",
        icon: Gift
    }
};

const CREATABLE_REWARD_TYPES: RewardType[] = ['custom_discount', 'free_product', 'service_upgrade', 'tangible_gifts'];

const AUDIENCE_OPTIONS = [
    { value: 'all', label: 'All Visitors', description: 'Target everyone visiting your business.' },
    { value: 'new', label: 'New Visitors', description: 'Focus on capturing new customers.' },
    { value: 'returning', label: 'Returning Visitors', description: 'Reward and retain your loyal base.' }
];

interface RewardCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (reward: Partial<Reward>) => Promise<void>;
    onUpdate?: (id: string, updates: Partial<Reward>) => Promise<void>;
    initialData?: Reward | null;
    defaultAudience?: 'all' | 'new' | 'returning';
}

export const RewardCreationModal: React.FC<RewardCreationModalProps> = ({ 
    isOpen, 
    onClose, 
    onCreate, 
    onUpdate, 
    initialData, 
    defaultAudience = 'all' 
}) => {
    const { activeBranchId } = useActiveBranch();
    const { data: availableOffers = [] } = useCatalogueOffersAdmin({ branchId: activeBranchId || undefined });

    const [isTypeOpen, setIsTypeOpen] = useState(false);
    const [isAudienceOpen, setIsAudienceOpen] = useState(false);
    const [isOfferOpen, setIsOfferOpen] = useState(false);
    const [offerSearchQuery, setOfferSearchQuery] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [croppingImage, setCroppingImage] = useState<{ url: string, isGallery?: boolean } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const [localImageFile, setLocalImageFile] = useState<File | null>(null);
    const [localGalleryFiles, setLocalGalleryFiles] = useState<File[]>([]);

    const [formData, setFormData] = useState<Partial<Reward>>({
        name: '',
        description: '',
        rewardType: 'free_product',
        pointCost: 100,
        validityDays: 30,
        value: 0,
        totalAvailable: 0,
        isActive: true,
        imageUrls: [],
        audienceTarget: defaultAudience,
        offerId: undefined
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData(initialData);
            } else {
                setFormData({
                    name: '',
                    description: '',
                    rewardType: 'free_product',
                    pointCost: 100,
                    validityDays: 30,
                    value: 0,
                    totalAvailable: 0,
                    isActive: true,
                    imageUrls: [],
                    audienceTarget: defaultAudience,
                    offerId: undefined
                });
            }
            setIsSubmitted(false);
            setOfferSearchQuery('');
            setLocalImageFile(null);
            setLocalGalleryFiles([]);
            setIsUploading(false);
        }
    }, [isOpen, initialData, defaultAudience]);

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
            const file = files[0];
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
                imageUrls: finalImageUrls,
                offerId: formData.offerId || undefined
            };

            if (initialData?.id && onUpdate) {
                await onUpdate(initialData.id, submissionData);
                notify.success('Reward updated successfully');
            } else {
                await onCreate(submissionData);
                notify.success('Reward created successfully');
            }
            onClose();
        } catch (error) {
            if (toastId) notify.dismiss(toastId);
            notify.error((error as any)?.message || 'Failed to save reward');
            console.error('Submit error:', error);
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <AnimatePresence>
                {croppingImage && (
                    <CropperModal 
                        image={croppingImage.url} 
                        onCropComplete={handleCropComplete} 
                        onClose={() => setCroppingImage(null)} 
                    />
                )}
            </AnimatePresence>

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
                    className="bg-white w-full max-w-2xl text-slate-900 relative shadow-2xl rounded-t-[2.5rem] md:rounded-3xl border border-slate-200 overflow-hidden flex flex-col h-[92vh] md:h-auto md:max-h-[90vh]"
                >
                    <div className="p-6 md:p-8 overflow-y-auto scrollbar-hide">
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2.5 hover:bg-slate-100 rounded-full transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                                <Gift className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl md:text-2xl font-display font-black text-slate-900 truncate">
                                    {initialData ? 'Edit Reward' : 'New Creation'}
                                </h3>
                                <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-0.5">Configure your loyalty gift</p>
                            </div>
                        </div>

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
                                                                {CREATABLE_REWARD_TYPES.map((type) => {
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

                                {/* Audience Target Field */}
                                <div className="space-y-2 relative">
                                    <label className="text-xs font-medium text-slate-700 ml-1">Audience Target</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsAudienceOpen(!isAudienceOpen)}
                                            className="w-full h-12 px-5 bg-slate-50 border border-transparent rounded-xl flex items-center justify-between group hover:bg-slate-100 transition-all font-bold text-sm"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Users size={16} className="text-primary" />
                                                <span>{AUDIENCE_OPTIONS.find(o => o.value === formData.audienceTarget)?.label || 'Select Audience'}</span>
                                            </div>
                                            <ChevronDown size={16} className={cn("text-slate-400 transition-transform", isAudienceOpen && "rotate-180")} />
                                        </button>

                                        <AnimatePresence>
                                            {isAudienceOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setIsAudienceOpen(false)} />
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-20"
                                                    >
                                                        <div className="p-2">
                                                            {AUDIENCE_OPTIONS.map((option) => (
                                                                <button
                                                                    key={option.value}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setFormData({ ...formData, audienceTarget: option.value as any });
                                                                        setIsAudienceOpen(false);
                                                                    }}
                                                                    className={cn(
                                                                        "w-full flex items-start gap-4 p-3 rounded-xl transition-all text-left group",
                                                                        formData.audienceTarget === option.value ? "bg-primary/5 border border-primary/10" : "hover:bg-slate-50 border border-transparent"
                                                                    )}
                                                                >
                                                                    <div className={cn(
                                                                        "size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                                                        formData.audienceTarget === option.value ? "bg-primary text-white" : "bg-slate-100 text-slate-400 group-hover:text-slate-600 shadow-sm"
                                                                    )}>
                                                                        <Users size={14} />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className={cn(
                                                                            "text-[11px] font-black uppercase tracking-tight",
                                                                            formData.audienceTarget === option.value ? "text-primary" : "text-slate-900"
                                                                        )}>
                                                                            {option.label}
                                                                        </p>
                                                                        <p className="text-[10px] font-medium text-slate-400 leading-tight mt-0.5">
                                                                            {option.description}
                                                                        </p>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
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
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step 2: Economics & Expiry</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                    <div className={cn(
                                        "p-5 md:p-6 rounded-2xl border transition-all",
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
                                                className="bg-transparent border-b-2 border-primary/10 focus:border-primary px-2 py-1 outline-none transition-all font-display font-black text-3xl text-primary w-full"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-5 md:p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <label className="text-xs font-medium text-slate-700 block mb-4">Lifespan (Days)</label>
                                        <input
                                            type="number"
                                            value={formData.validityDays}
                                            onChange={(e) => setFormData({ ...formData, validityDays: parseInt(e.target.value) || 0 })}
                                            className="bg-transparent border-b-2 border-slate-200 focus:border-primary px-2 py-1 outline-none transition-all font-display font-black text-3xl text-slate-900 w-full"
                                        />
                                    </div>
                                </div>

                                <div className="p-5 md:p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-medium text-slate-700">Total Quantity Available</label>
                                            <Tooltip content="Maximum number of times this reward can be redeemed. Use -1 for unlimited.">
                                                <HelpCircle size={14} className="text-slate-400" />
                                            </Tooltip>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({ ...formData, totalAvailable: formData.totalAvailable === -1 ? 100 : -1 })}
                                            className={cn(
                                                "w-full sm:w-auto px-4 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                formData.totalAvailable === -1 
                                                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                                                    : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                                            )}
                                        >
                                            {formData.totalAvailable === -1 ? 'Unlimited Active' : 'Set Unlimited'}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {formData.totalAvailable === -1 ? (
                                            <div className="flex items-center gap-2 text-primary">
                                                <Zap className="w-8 h-8" />
                                                <span className="text-3xl font-display font-black uppercase tracking-tighter">Infinity</span>
                                            </div>
                                        ) : (
                                            <input
                                                type="number"
                                                min="1"
                                                value={formData.totalAvailable}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    setFormData({ ...formData, totalAvailable: isNaN(val) ? 1 : Math.max(1, val) });
                                                }}
                                                className="bg-transparent border-b-2 border-slate-200 focus:border-primary px-2 py-1 outline-none transition-all font-display font-black text-3xl text-slate-900 w-full"
                                                placeholder="e.g. 100"
                                            />
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium mt-3">
                                        {formData.totalAvailable === -1 
                                            ? "This reward will never run out of stock unless disabled manually." 
                                            : `Customers can redeem this a total of ${formData.totalAvailable} times.`}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step 3: Linked Offer (optional)</h4>
                                <div className="space-y-2 relative">
                                    <label className="text-xs font-medium text-slate-700 ml-1">
                                        Attach a promotion offer
                                        <span className="text-slate-400 font-normal ml-1">(from Discovery / Promotions)</span>
                                    </label>
                                    {formData.offerId ? (
                                        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/10 rounded-xl">
                                            {(() => {
                                                const selected = availableOffers.find(o => o.id === formData.offerId);
                                                return (
                                                    <>
                                                        {selected?.mainImage ? (
                                                            <img src={selected.mainImage} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                                                <Zap className="w-5 h-5 text-slate-400" />
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-slate-900 truncate">{selected?.name || 'Unknown Offer'}</p>
                                                            <p className="text-[10px] text-slate-500 font-medium">{selected?.calculatedPrice ? `$${selected.calculatedPrice}` : ''}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setFormData({ ...formData, offerId: undefined });
                                                                setOfferSearchQuery('');
                                                            }}
                                                            className="p-2 hover:bg-white rounded-lg transition-colors"
                                                        >
                                                            <X size={16} className="text-slate-400" />
                                                        </button>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setIsOfferOpen(!isOfferOpen)}
                                                className="w-full h-12 px-5 bg-slate-50 border border-transparent rounded-xl flex items-center justify-between group hover:bg-slate-100 transition-all font-bold text-sm"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Zap size={16} className="text-primary" />
                                                    <span className="text-slate-500">Search and attach an offer...</span>
                                                </div>
                                                <ChevronDown size={16} className={cn("text-slate-400 transition-transform", isOfferOpen && "rotate-180")} />
                                            </button>

                                            <AnimatePresence>
                                                {isOfferOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => { setIsOfferOpen(false); setOfferSearchQuery(''); }} />
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-20"
                                                        >
                                                            <div className="p-3 border-b border-slate-100">
                                                                <div className="relative">
                                                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                                    <input
                                                                        type="text"
                                                                        value={offerSearchQuery}
                                                                        onChange={(e) => setOfferSearchQuery(e.target.value)}
                                                                        placeholder="Type to filter offers..."
                                                                        className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="p-2 max-h-56 overflow-y-auto custom-scrollbar">
                                                                {availableOffers.filter(o =>
                                                                    o.name.toLowerCase().includes(offerSearchQuery.toLowerCase()) ||
                                                                    (o.description || '').toLowerCase().includes(offerSearchQuery.toLowerCase())
                                                                ).length > 0 ? (
                                                                    availableOffers.filter(o =>
                                                                        o.name.toLowerCase().includes(offerSearchQuery.toLowerCase()) ||
                                                                        (o.description || '').toLowerCase().includes(offerSearchQuery.toLowerCase())
                                                                    ).map((offer) => (
                                                                        <button
                                                                            key={offer.id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setFormData({ ...formData, offerId: offer.id });
                                                                                setIsOfferOpen(false);
                                                                                setOfferSearchQuery('');
                                                                            }}
                                                                            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group hover:bg-slate-50 border border-transparent"
                                                                        >
                                                                            {offer.mainImage ? (
                                                                                <img src={offer.mainImage} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                                                                            ) : (
                                                                                <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                                                                    <Zap size={14} className="text-slate-400" />
                                                                                </div>
                                                                            )}
                                                                            <div className="min-w-0 flex-1">
                                                                                <p className="text-xs font-bold text-slate-900 truncate">{offer.name}</p>
                                                                                <p className="text-[10px] text-slate-400 font-medium truncate">{offer.description || 'No description'}</p>
                                                                            </div>
                                                                            {offer.calculatedPrice ? (
                                                                                <span className="text-[10px] font-black text-primary uppercase tracking-widest shrink-0">
                                                                                    ${offer.calculatedPrice}
                                                                                </span>
                                                                            ) : null}
                                                                        </button>
                                                                    ))
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center py-8">
                                                                        <Zap size={24} className="text-slate-200 mb-2" />
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No offers found</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-slate-400 font-medium ml-1">
                                        Linking an offer lets customers claim this reward alongside a specific promotion. Backend field <code className="text-primary bg-primary/5 px-1 rounded">offerId</code> must be added to the Reward entity first.
                                    </p>
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
                                                            newUrls.shift();
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

                    <div className="p-6 md:p-8 bg-white border-t border-slate-100 flex gap-3 sticky bottom-0 z-20">
                        <button
                            onClick={onClose}
                            className="flex-1 h-12 bg-slate-100 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isUploading}
                            className="flex-[2] h-12 bg-primary text-white rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                        >
                            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {initialData ? 'Update Reward' : 'Confirm Creation'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </>
    );
};
