'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    X, Plus, Trash2, Image as ImageIcon, 
    Calculator, Gift, ShoppingBag, Info, Loader2, Save, HelpCircle,
    Sparkles, Users, CalendarDays, Hash, FileText
} from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';
import { 
    CatalogueOffer, 
    CatalogueOfferPricingType, 
    useCreateCatalogueOffer, 
    useUpdateCatalogueOffer, 
    useCatalogueItems,
    CatalogueItem
} from '@/services/catalogue/hooks';
import { useRewards } from '@/services/loyalty/hooks';
import toast from 'react-hot-toast';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { cn } from '@/lib/utils';
import Cropper, { Point, Area } from 'react-easy-crop';
import { getCroppedImg } from '@/lib/image-utils';
import { motion, AnimatePresence } from 'framer-motion';

const CropperModal: React.FC<{
    image: string;
    onCropComplete: (croppedImage: Blob) => void;
    onClose: () => void;
}> = ({ image, onCropComplete, onClose }) => {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

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
                onClick={onClose}
            />
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden relative shadow-2xl"
            >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <h3 className="text-xl font-display font-black text-slate-900">Crop Offer Image</h3>
                        <p className="text-xs text-slate-500 font-medium">Position your image for the best view</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all"><X size={20} /></button>
                </div>

                <div className="relative h-[400px] w-full bg-slate-200">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={16 / 9}
                        onCropChange={setCrop}
                        onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                        onZoomChange={setZoom}
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
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all cursor-pointer">Cancel</button>
                        <button onClick={handleSave} className="flex-2 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all cursor-pointer">Apply Crop</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

interface OfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    offer?: CatalogueOffer | null;
    activeBranchId?: string;
}

export default function OfferModal({ isOpen, onClose, offer, activeBranchId }: OfferModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        terms: [] as string[],
        quantity: null as number | null,
        pricingType: 'sum' as CatalogueOfferPricingType,
        discountValue: null as number | null,
        fixedPrice: null as number | null,
        loyaltyPoints: null as number | null,
        rewardId: null as string | null,
        itemIds: [] as string[],
        audience: 'both' as string,
        maxClaimsPerCustomer: null as number | null,
        claimCodePrefix: '' as string,
        startDate: '' as string,
        endDate: '' as string,
    });

    const [termsInput, setTermsInput] = useState('');
    const [generatingTerms, setGeneratingTerms] = useState(false);

    const [isUploading, setIsUploading] = useState(false);
    const [localMainFile, setLocalMainFile] = useState<File | null>(null);
    const [localGalleryFiles, setLocalGalleryFiles] = useState<File[]>([]);
    const [mainImagePreview, setMainImagePreview] = useState<string>('');
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [croppingImage, setCroppingImage] = useState<{ url: string, isGallery?: boolean } | null>(null);

    const mainInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const { data: allItems = [] } = useCatalogueItems({ branchId: activeBranchId });
    const { data: allRewards = [] } = useRewards(activeBranchId);
    const createMutation = useCreateCatalogueOffer();
    const updateMutation = useUpdateCatalogueOffer();

    useEffect(() => {
        if (isOpen) {
            if (offer) {
                setFormData({
                    name: offer.name,
                    description: offer.description,
                    terms: offer.terms || [],
                    quantity: offer.quantity,
                    pricingType: offer.pricingType,
                    discountValue: offer.discountValue,
                    fixedPrice: offer.fixedPrice,
                    loyaltyPoints: offer.loyaltyPoints,
                    rewardId: offer.rewardId,
                    itemIds: offer.items?.map(i => i.id) || [],
                    audience: offer.audience || 'both',
                    maxClaimsPerCustomer: offer.maxClaimsPerCustomer ?? null,
                    claimCodePrefix: offer.claimCodePrefix || '',
                    startDate: offer.startDate ? offer.startDate.split('T')[0] : '',
                    endDate: offer.endDate ? offer.endDate.split('T')[0] : '',
                });
                setTermsInput('');
                setMainImagePreview(offer.mainImage || '');
                setGalleryPreviews(offer.galleryImages || []);
            } else {
                setFormData({
                    name: '',
                    description: '',
                    terms: [],
                    quantity: null,
                    pricingType: 'sum',
                    discountValue: null,
                    fixedPrice: null,
                    loyaltyPoints: null,
                    rewardId: null,
                    itemIds: [],
                    audience: 'both',
                    maxClaimsPerCustomer: null,
                    claimCodePrefix: '',
                    startDate: '',
                    endDate: '',
                });
                setTermsInput('');
                setMainImagePreview('');
                setGalleryPreviews([]);
            }
            setLocalMainFile(null);
            setLocalGalleryFiles([]);
            setIsUploading(false);
        }
    }, [offer, isOpen]);

    const handleMainUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setCroppingImage({ url: reader.result as string, isGallery: false });
            reader.readAsDataURL(file);
        }
    };

    const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setCroppingImage({ url: reader.result as string, isGallery: true });
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (blob: Blob) => {
        const file = new File([blob], "offer-image.jpg", { type: 'image/jpeg' });
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            if (croppingImage?.isGallery) {
                setLocalGalleryFiles(prev => [...prev, file]);
                setGalleryPreviews(prev => [...prev, result]);
            } else {
                setLocalMainFile(file);
                setMainImagePreview(result);
            }
            setCroppingImage(null);
        };
        reader.readAsDataURL(blob);
    };

    const selectedItems = useMemo(() => {
        return allItems.filter((item: CatalogueItem) => formData.itemIds.includes(item.id));
    }, [allItems, formData.itemIds]);

    const calculatedBasePrice = useMemo(() => {
        return selectedItems.reduce((sum: number, item: CatalogueItem) => sum + Number(item.price), 0);
    }, [selectedItems]);

    const finalPrice = useMemo(() => {
        switch (formData.pricingType) {
            case 'sum': return calculatedBasePrice;
            case 'percentage_discount': 
                return calculatedBasePrice * (1 - (formData.discountValue || 0) / 100);
            case 'fixed_discount_price': 
                return formData.fixedPrice || calculatedBasePrice;
            default: return calculatedBasePrice;
        }
    }, [formData.pricingType, formData.discountValue, formData.fixedPrice, calculatedBasePrice]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeBranchId) return toast.error('No active branch selected');
        if (formData.itemIds.length === 0) return toast.error('Please select at least one item');

        setIsUploading(true);
        let toastId: string | undefined;

        try {
            let mainImageUrl = mainImagePreview;
            let finalGalleryUrls = galleryPreviews.filter(url => !url.startsWith('data:'));

            // Upload new images to Cloudinary
            if (localMainFile || localGalleryFiles.length > 0) {
                toastId = toast.loading('Uploading images...');

                if (localMainFile) {
                    mainImageUrl = await uploadToCloudinary(localMainFile);
                }

                if (localGalleryFiles.length > 0) {
                    const uploadedGallery = await Promise.all(localGalleryFiles.map(f => uploadToCloudinary(f)));
                    finalGalleryUrls = [...finalGalleryUrls, ...uploadedGallery];
                }

                toast.dismiss(toastId);
            }

            const basePayload = {
                ...formData,
                terms: formData.terms.length > 0 ? formData.terms : undefined,
                mainImage: mainImageUrl,
                galleryImages: finalGalleryUrls,
                quantity: formData.quantity === null ? undefined : formData.quantity,
                discountValue: formData.discountValue === null ? undefined : formData.discountValue,
                fixedPrice: formData.fixedPrice === null ? undefined : formData.fixedPrice,
                loyaltyPoints: formData.loyaltyPoints === null ? undefined : formData.loyaltyPoints,
                rewardId: formData.rewardId === null ? undefined : formData.rewardId,
                maxClaimsPerCustomer: formData.maxClaimsPerCustomer === null ? undefined : formData.maxClaimsPerCustomer,
                claimCodePrefix: formData.claimCodePrefix.trim() || undefined,
                startDate: formData.startDate || undefined,
                endDate: formData.endDate || undefined,
            };

            if (offer) {
                await updateMutation.mutateAsync({ id: offer.id, data: basePayload as any });
                toast.success('Offer updated successfully');
            } else {
                const createPayload = {
                    ...basePayload,
                    branchId: activeBranchId,
                };
                await createMutation.mutateAsync(createPayload as any);
                toast.success('Offer created successfully');
            }
            onClose();
        } catch (error: any) {
            if (toastId) toast.dismiss(toastId);
            toast.error(error.response?.data?.message || 'Failed to save offer');
        } finally {
            setIsUploading(false);
        }
    };

    const toggleItem = (itemId: string) => {
        setFormData(prev => ({
            ...prev,
            itemIds: prev.itemIds.includes(itemId)
                ? prev.itemIds.filter(id => id !== itemId)
                : [...prev.itemIds, itemId]
        }));
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

            <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <ShoppingBag size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-text-main">
                                    {offer ? 'Edit Offer' : 'Create New Offer'}
                                </h2>
                                <p className="text-xs text-text-secondary font-medium">Bundle items together for special deals</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                            <X size={20} className="text-text-secondary" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column: Basic Info & Media */}
                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-sm font-black text-text-main mb-4 flex items-center gap-2">
                                        <Info size={16} className="text-primary" />
                                        General Information
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-text-secondary mb-1.5 ml-1 uppercase tracking-widest">Offer Name *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Summer Combo Deal"
                                                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-text-secondary mb-1.5 ml-1 uppercase tracking-widest">Description *</label>
                                            <textarea
                                                required
                                                rows={3}
                                                placeholder="What makes this deal special?"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-text-secondary mb-1.5 ml-1 uppercase tracking-widest flex items-center gap-1.5">
                                                <Users size={12} />
                                                Max Claims
                                                <Tooltip content="Total number of times this deal can be claimed (across all customers). Leave empty for unlimited.">
                                                    <HelpCircle size={12} className="text-gray-400 cursor-help" />
                                                </Tooltip>
                                            </label>
                                                <input
                                                    type="number"
                                                    placeholder="Unlimited"
                                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                                    value={formData.quantity || ''}
                                                    onChange={e => setFormData({ ...formData, quantity: e.target.value ? Number(e.target.value) : null })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-text-secondary mb-1.5 ml-1 uppercase tracking-widest text-amber-600 flex items-center gap-2">
                                                    Loyalty Points
                                                    <Tooltip content="Bonus points awarded to the customer for purchasing this entire bundle.">
                                                        <HelpCircle size={14} className="text-amber-500 cursor-help" />
                                                    </Tooltip>
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-amber-500/20 outline-none"
                                                    value={formData.loyaltyPoints || ''}
                                                    onChange={e => setFormData({ ...formData, loyaltyPoints: e.target.value ? Number(e.target.value) : null })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Terms & Conditions */}
                                <section>
                                    <h3 className="text-sm font-black text-text-main mb-4 flex items-center gap-2">
                                        <FileText size={16} className="text-violet-500" />
                                        Terms &amp; Conditions
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={termsInput}
                                                onChange={e => setTermsInput(e.target.value)}
                                                placeholder="Add a term (e.g. Valid until Dec 2026)"
                                                className="flex-1 h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (termsInput.trim()) {
                                                            setFormData(prev => ({ ...prev, terms: [...prev.terms, termsInput.trim()] }));
                                                            setTermsInput('');
                                                        }
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (termsInput.trim()) {
                                                        setFormData(prev => ({ ...prev, terms: [...prev.terms, termsInput.trim()] }));
                                                        setTermsInput('');
                                                    }
                                                }}
                                                className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all"
                                            >
                                                <Plus size={18} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setGeneratingTerms(true);
                                                    setTimeout(() => {
                                                        const generated = [
                                                            'Offer valid for a limited time only',
                                                            'Cannot be combined with other promotions',
                                                            'Valid for the specified products/services only',
                                                            'Management reserves the right to modify or cancel this offer',
                                                            'Standard terms and conditions apply',
                                                        ];
                                                        setFormData(prev => ({ ...prev, terms: [...new Set([...prev.terms, ...generated])] }));
                                                        setGeneratingTerms(false);
                                                        toast.success('Terms & Conditions generated');
                                                    }, 800);
                                                }}
                                                disabled={generatingTerms}
                                                className="size-12 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white flex items-center justify-center hover:from-violet-600 hover:to-purple-600 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
                                                title="Auto-generate T&C"
                                            >
                                                {generatingTerms ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                            </button>
                                        </div>
                                        {formData.terms.length > 0 && (
                                            <div className="space-y-1.5">
                                                {formData.terms.map((term, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100 group">
                                                        <span className="size-5 rounded-full bg-violet-100 text-violet-600 text-[9px] font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                                                        <span className="flex-1 text-sm font-medium text-gray-700">{term}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({ ...prev, terms: prev.terms.filter((_, i) => i !== idx) }))}
                                                            className="size-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {formData.terms.length === 0 && (
                                            <p className="text-[10px] text-gray-400 italic ml-1">No terms added yet. Type above or use AI to generate.</p>
                                        )}
                                    </div>
                                </section>

                                {/* Deal Configuration */}
                                <section>
                                    <h3 className="text-sm font-black text-text-main mb-4 flex items-center gap-2">
                                        <CalendarDays size={16} className="text-cyan-500" />
                                        Deal Configuration
                                    </h3>
                                    <div className="space-y-4 p-4 bg-cyan-50/30 rounded-2xl border border-cyan-100/50">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-text-secondary mb-1.5 ml-1 uppercase tracking-widest">Start Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                                    value={formData.startDate}
                                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-text-secondary mb-1.5 ml-1 uppercase tracking-widest">End Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                                    value={formData.endDate}
                                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-secondary mb-1.5 ml-1 uppercase tracking-widest">Target Audience</label>
                                            <select
                                                className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                                                value={formData.audience}
                                                onChange={e => setFormData({ ...formData, audience: e.target.value })}
                                            >
                                                <option value="both">All Customers (New &amp; Returning)</option>
                                                <option value="new">New Customers Only</option>
                                                <option value="returning">Returning Customers Only</option>
                                            </select>
                                            <p className="text-[9px] font-bold text-gray-400 mt-1 ml-1">
                                                {formData.audience === 'new' && 'Only customers who have never visited before can claim'}
                                                {formData.audience === 'returning' && 'Only customers who have visited before can claim'}
                                                {formData.audience === 'both' && 'Any customer can claim this deal'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-secondary mb-1.5 ml-1 uppercase tracking-widest flex items-center gap-1.5">
                                                <Hash size={12} />
                                                Max Claims Per Customer
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                placeholder="Unlimited"
                                                className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                                value={formData.maxClaimsPerCustomer || ''}
                                                onChange={e => setFormData({ ...formData, maxClaimsPerCustomer: e.target.value ? Number(e.target.value) : null })}
                                            />
                                            <p className="text-[9px] font-bold text-gray-400 mt-1 ml-1">How many times the same customer can claim this deal</p>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-secondary mb-1.5 ml-1 uppercase tracking-widest flex items-center gap-1.5">
                                                <Users size={12} />
                                                Custom Claim Code Prefix
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="e.g. EASTER50, SUMMER2026 (leave empty for auto-generated)"
                                                    className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none uppercase"
                                                    value={formData.claimCodePrefix}
                                                    onChange={e => setFormData({ ...formData, claimCodePrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                                                />
                                            </div>
                                            <p className="text-[9px] font-bold text-gray-400 mt-1 ml-1">If set, this prefix replaces the branch code in the claim code (e.g. EASTER50-XXXX)</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="text-sm font-black text-text-main mb-4 flex items-center gap-2 uppercase tracking-widest">
                                        <ImageIcon size={16} className="text-primary" />
                                        Media
                                    </h3>
                                    
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Main Image *</label>
                                        <input type="file" ref={mainInputRef} onChange={handleMainUpload} accept="image/*" className="hidden" />
                                        <div
                                            onClick={() => mainInputRef.current?.click()}
                                            className={cn(
                                                "relative h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden cursor-pointer",
                                                mainImagePreview ? "border-solid border-gray-200 bg-white" : "border-gray-200 bg-gray-50 hover:bg-white hover:border-primary/40"
                                            )}
                                        >
                                            {mainImagePreview ? (
                                                <div className="w-full h-full relative group">
                                                    <img src={mainImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <p className="text-white text-[10px] font-black uppercase">Change Image</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-300">
                                                        <ImageIcon size={20} />
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase text-gray-400">Main Banner</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Gallery</label>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase">{galleryPreviews.length} Images</span>
                                        </div>
                                        <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} accept="image/*" className="hidden" />
                                        <div className="grid grid-cols-4 gap-2">
                                            {galleryPreviews.map((url, idx) => (
                                                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 shadow-sm group">
                                                    <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newPreviews = [...galleryPreviews];
                                                                newPreviews.splice(idx, 1);
                                                                setGalleryPreviews(newPreviews);
                                                                if (url.startsWith('blob:') || url.startsWith('data:')) {
                                                                    setLocalGalleryFiles(prev => prev.filter((_, i) => i !== (idx - (galleryPreviews.length - localGalleryFiles.length))));
                                                                }
                                                            }}
                                                            className="p-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all cursor-pointer"
                                                        >
                                                            <Trash2 size={10} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => galleryInputRef.current?.click()}
                                                className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-white hover:border-primary/40 transition-all text-gray-400 hover:text-primary cursor-pointer"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-sm font-black text-text-main mb-4 flex items-center gap-2 uppercase tracking-widest">
                                        <Gift size={16} className="text-emerald-500" />
                                        Instant Reward
                                        <Tooltip content="A loyalty reward (coupon, gift, etc.) that the customer receives immediately upon completing this purchase.">
                                            <HelpCircle size={14} className="text-emerald-500 cursor-help" />
                                        </Tooltip>
                                    </h3>
                                    <select
                                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none cursor-pointer"
                                        value={formData.rewardId || ''}
                                        onChange={e => setFormData({ ...formData, rewardId: e.target.value || null })}
                                    >
                                        <option value="">No Reward Attached</option>
                                        {allRewards.map(reward => (
                                            <option key={reward.id} value={reward.id}>{reward.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-text-secondary mt-2 ml-1 italic">Automatically issued to customer upon completion.</p>
                                </section>
                            </div>

                            {/* Right Column: Pricing & Items */}
                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-sm font-black text-text-main mb-4 flex items-center gap-2 uppercase tracking-widest">
                                        <Calculator size={16} className="text-primary" />
                                        Pricing Strategy
                                    </h3>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                                        <div className="flex p-1 bg-white border border-gray-200 rounded-xl">
                                            {['sum', 'percentage_discount', 'fixed_discount_price'].map((type) => (
                                                 <Tooltip 
                                                     key={type} 
                                                     content={
                                                         type === 'sum' ? "Total price is simply the combined price of all items." :
                                                         type === 'percentage_discount' ? "Apply a custom percentage discount to the bundle total." :
                                                         "Set a specific fixed price for this entire bundle."
                                                     }
                                                 >
                                                     <button
                                                         type="button"
                                                         onClick={() => setFormData({ ...formData, pricingType: type as any })}
                                                         className={`w-full py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                                             formData.pricingType === type 
                                                                 ? 'bg-primary text-white shadow-md' 
                                                                 : 'text-text-secondary hover:bg-gray-50'
                                                         }`}
                                                     >
                                                         {type.split('_')[0]}
                                                     </button>
                                                 </Tooltip>
                                            ))}
                                        </div>

                                        {formData.pricingType === 'percentage_discount' && (
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                                <label className="block text-[10px] font-black text-text-secondary mb-1.5 ml-1 uppercase tracking-widest">Discount Percentage (%)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                                    value={formData.discountValue || ''}
                                                    onChange={e => setFormData({ ...formData, discountValue: e.target.value ? Number(e.target.value) : null })}
                                                />
                                            </div>
                                        )}

                                        {formData.pricingType === 'fixed_discount_price' && (
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                                <label className="block text-[10px] font-black text-text-secondary mb-1.5 ml-1 uppercase tracking-widest">Fixed Offer Price (₦)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                                    value={formData.fixedPrice || ''}
                                                    onChange={e => setFormData({ ...formData, fixedPrice: e.target.value ? Number(e.target.value) : null })}
                                                />
                                            </div>
                                        )}

                                        <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                                            <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Final Price</span>
                                            <div className="text-right">
                                                {formData.pricingType !== 'sum' && (
                                                    <div className="text-[10px] text-text-secondary line-through font-medium">₦{calculatedBasePrice.toLocaleString()}</div>
                                                )}
                                                <div className="text-lg font-black text-primary font-display">₦{finalPrice.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-black text-text-main flex items-center gap-2 uppercase tracking-widest">
                                            <Plus size={16} className="text-primary" />
                                            Bundle Items *
                                        </h3>
                                        <span className="text-[10px] font-black text-primary px-2 py-1 bg-primary/5 rounded-full uppercase">
                                            {formData.itemIds.length} Selected
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-text-secondary font-medium mb-3 ml-1 italic">Select at least one product or service to include in this bundle.</p>
                                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-2xl p-2 space-y-1 custom-scrollbar">
                                        {allItems.map((item: CatalogueItem) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => toggleItem(item.id)}
                                                className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all border ${
                                                    formData.itemIds.includes(item.id)
                                                        ? 'bg-primary/5 border-primary/20'
                                                        : 'border-transparent hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="size-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                                                    {item.mainImage ? (
                                                        <img src={item.mainImage} alt={item.name} className="size-full object-cover" />
                                                    ) : (
                                                        <div className="size-full flex items-center justify-center text-gray-400">
                                                            <ShoppingBag size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="text-xs font-bold text-text-main truncate">{item.name}</p>
                                                    <p className="text-[10px] text-text-secondary font-black">₦{Number(item.price).toLocaleString()}</p>
                                                </div>
                                                {formData.itemIds.includes(item.id) && (
                                                    <div className="size-5 rounded-full bg-primary text-white flex items-center justify-center">
                                                        <Save size={10} />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                        {allItems.length === 0 && (
                                            <div className="py-8 text-center text-text-secondary text-xs italic">
                                                This branch hasn't added items yet. Add products or services to get started.
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-bold text-text-secondary hover:bg-gray-100 rounded-xl transition-all cursor-pointer uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isUploading || createMutation.isPending || updateMutation.isPending}
                            className="px-8 py-2.5 bg-primary text-white text-sm font-black rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 cursor-pointer flex items-center gap-2 uppercase tracking-widest"
                        >
                            {isUploading || createMutation.isPending || updateMutation.isPending ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>{offer ? 'Update Offer' : 'Create Offer'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
