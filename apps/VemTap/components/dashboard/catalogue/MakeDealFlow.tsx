'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
    X, Flame, Tag, Gift, Truck, Package, Zap, Percent, 
    ChevronRight, ChevronLeft, Loader2, Save, Image as ImageIcon,
    ShoppingBag, AlertCircle, CheckCircle2
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { 
    CatalogueItem, 
    CatalogueOfferPricingType,
    useCreateCatalogueOffer,
} from '@/services/catalogue/hooks';
import toast from 'react-hot-toast';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { cn } from '@/lib/utils';
import Cropper, { Point, Area } from 'react-easy-crop';
import { getCroppedImg } from '@/lib/image-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

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
                if (croppedImage) onCropComplete(croppedImage);
            } catch (e) { console.error(e); }
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden relative shadow-2xl z-10">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Crop Image</h3>
                        <p className="text-xs text-slate-500 font-medium">Position your image for the best view</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all"><X size={20} /></button>
                </div>
                <div className="relative h-[400px] w-full bg-slate-200">
                    <Cropper image={image} crop={crop} zoom={zoom} aspect={16/9} onCropChange={setCrop} onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)} onZoomChange={setZoom} />
                </div>
                <div className="p-6 bg-white flex flex-col gap-6">
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-semibold uppercase tracking-widest text-slate-400">
                            <span>Zoom</span><span>{Math.round(zoom * 100)}%</span>
                        </div>
                        <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary" />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 font-semibold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all cursor-pointer">Cancel</button>
                        <button onClick={handleSave} className="flex-[2] py-3 bg-primary text-white font-semibold text-xs uppercase tracking-widest rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all cursor-pointer">Apply Crop</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const DEAL_TYPES = [
    { value: 'discount', label: 'Discount', icon: Percent, description: 'Lower the price for a limited time' },
    { value: 'free_item', label: 'Free Gift', icon: Gift, description: 'Buy one get one free' },
    { value: 'free_delivery', label: 'Free Delivery', icon: Truck, description: 'No delivery fees' },
    { value: 'flash', label: 'Flash Deal', icon: Zap, description: 'Limited time offer' },
    { value: 'special', label: 'Special Price', icon: Tag, description: 'Set a special deal price' },
    { value: 'bundle', label: 'Bundle', icon: Package, description: 'Package with other items' },
];

interface MakeDealFlowProps {
    isOpen: boolean;
    onClose: () => void;
    product: CatalogueItem;
    activeBranchId?: string;
}

export default function MakeDealFlow({ isOpen, onClose, product, activeBranchId }: MakeDealFlowProps) {
    const router = useRouter();
    const createMutation = useCreateCatalogueOffer();
    const [currentStep, setCurrentStep] = useState(0);
    const [dealType, setDealType] = useState('');
    const [dealTitle, setDealTitle] = useState('');
    const [dealDescription, setDealDescription] = useState('');
    const [dealPrice, setDealPrice] = useState<number>(0);
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [dealImage, setDealImage] = useState('');
    const [useProductImage, setUseProductImage] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [localMainFile, setLocalMainFile] = useState<File | null>(null);
    const [croppingImage, setCroppingImage] = useState<string | null>(null);
    const mainInputRef = useRef<HTMLInputElement>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [terms, setTerms] = useState<string[]>([]);

    useEffect(() => {
        if (product) {
            setDealTitle(`${product.name} Special Offer`);
            setDealDescription(product.description || product.shortDescription || '');
            setDealPrice(product.price);
            setDealImage(product.mainImage || '');
        }
    }, [product]);

    const handleCropComplete = async (croppedBlob: Blob) => {
        setDealImage(URL.createObjectURL(croppedBlob));
        setLocalMainFile(croppedBlob as any);
        setUseProductImage(false);
        setCroppingImage(null);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setCroppingImage(url);
        }
    };

    const getCalculatedPrice = () => {
        if (dealType === 'discount' || dealType === 'flash') {
            return product.price - discountValue;
        }
        return dealPrice;
    };

    const getPricingType = (): CatalogueOfferPricingType => {
        if (dealType === 'discount' || dealType === 'flash') return 'percentage_discount';
        if (dealType === 'special') return 'fixed_discount_price';
        return 'sum';
    };

    const handlePublish = async () => {
        try {
            setIsUploading(true);
            
            let finalImageUrl = dealImage;
            if (useProductImage) {
                finalImageUrl = product.mainImage || '';
            } else if (localMainFile) {
                const toastId = toast.loading('Uploading image...');
                finalImageUrl = await uploadToCloudinary(localMainFile);
                toast.dismiss(toastId);
            }

            const calculatedPrice = getCalculatedPrice();

            const payload = {
                name: dealTitle,
                description: dealDescription || `${dealTitle} - Limited time offer`,
                pricingType: getPricingType(),
                branchId: activeBranchId || '',
                itemIds: [product.id],
                mainImage: finalImageUrl,
                offerType: dealType,
                discountValue: dealType === 'discount' || dealType === 'flash' ? discountValue : undefined,
                fixedPrice: dealType === 'special' ? dealPrice : undefined,
                terms,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                audience: 'both',
            };

            await createMutation.mutateAsync(payload);
            toast.success('Deal created successfully!');
            onClose();
            router.push('/dashboard/discovery/deals');
        } catch (error: any) {
            toast.error(error.message || 'Failed to create deal');
        } finally {
            setIsUploading(false);
        }
    };

    const STEPS = [
        { title: 'Deal Type', description: 'What kind of deal?' },
        { title: 'Deal Details', description: 'Customize your deal' },
        { title: 'Preview', description: 'Review before publishing' },
    ];

    const canProceed = () => {
        if (currentStep === 0) return !!dealType;
        if (currentStep === 1) return dealTitle && dealPrice > 0;
        return true;
    };

    return (
        <>
            <AnimatePresence>
                {croppingImage && (
                    <CropperModal image={croppingImage} onCropComplete={handleCropComplete} onClose={() => setCroppingImage(null)} />
                )}
            </AnimatePresence>

            <Modal isOpen={isOpen} onClose={onClose} title="Make this a Deal" size="2xl">
                {/* Step Indicator */}
                <div className="flex items-center justify-between mb-6">
                    {STEPS.map((step, idx) => (
                        <React.Fragment key={step.title}>
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                                    idx < currentStep ? 'bg-emerald-500 text-white' :
                                    idx === currentStep ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'
                                )}>
                                    {idx < currentStep ? '✓' : idx + 1}
                                </div>
                                <div className="hidden sm:block">
                                    <p className={cn("text-xs font-bold", idx <= currentStep ? 'text-primary' : 'text-slate-400')}>{step.title}</p>
                                    <p className="text-[10px] text-slate-400">{step.description}</p>
                                </div>
                            </div>
                            {idx < STEPS.length - 1 && (
                                <div className={cn("flex-1 h-0.5 mx-2 rounded-full", idx < currentStep ? 'bg-emerald-500' : 'bg-slate-100')} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Product Info Banner */}
                <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {product.mainImage ? (
                                <img src={product.mainImage} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <ShoppingBag className="text-slate-300" size={20} />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500 font-medium">Creating deal from product</p>
                            <p className="text-sm font-bold text-slate-900 truncate">{product.name}</p>
                            <p className="text-xs text-slate-500">Current price: ₦{Number(product.price).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Step 1: Deal Type */}
                {currentStep === 0 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-900">What kind of deal do you want to create?</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {DEAL_TYPES.map(type => {
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setDealType(type.value)}
                                        className={cn(
                                            "p-4 rounded-xl border text-left transition-all",
                                            dealType === type.value 
                                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                                : 'border-slate-200 hover:border-slate-300'
                                        )}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Icon size={18} className={dealType === type.value ? 'text-primary' : 'text-slate-400'} />
                                            <span className={cn("text-sm font-bold", dealType === type.value ? 'text-primary' : 'text-slate-700')}>
                                                {type.label}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500">{type.description}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Step 2: Deal Details */}
                {currentStep === 1 && (
                    <div className="space-y-5">
                        {/* Deal Title */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Deal Title *</label>
                            <input
                                type="text"
                                value={dealTitle}
                                onChange={(e) => setDealTitle(e.target.value)}
                                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                                placeholder="e.g. Nike Air Max Special Offer"
                            />
                        </div>

                        {/* Deal Description */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Deal Description</label>
                            <textarea
                                value={dealDescription}
                                onChange={(e) => setDealDescription(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                placeholder="Describe your deal..."
                            />
                        </div>

                        {/* Deal Price */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                {dealType === 'discount' || dealType === 'flash' ? 'Discount Amount (₦) *' : 'Deal Price (₦) *'}
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₦</span>
                                <input
                                    type="number"
                                    value={dealType === 'discount' || dealType === 'flash' ? discountValue : dealPrice}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (dealType === 'discount' || dealType === 'flash') {
                                            setDiscountValue(val);
                                        } else {
                                            setDealPrice(val);
                                        }
                                    }}
                                    className="w-full h-11 pl-8 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                            <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-xs text-amber-700">
                                    <strong>This price is only for this deal.</strong> It will not change the price of your product.
                                </p>
                                <div className="mt-2 flex items-center gap-4 text-xs">
                                    <span className="text-slate-500">Product price: <strong className="text-slate-900">₦{Number(product.price).toLocaleString()}</strong></span>
                                    <span className="text-slate-500">Deal price: <strong className="text-primary">₦{getCalculatedPrice().toLocaleString()}</strong></span>
                                </div>
                            </div>
                        </div>

                        {/* Deal Image */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Deal Image</label>
                            <div className="flex items-center gap-3 mb-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={useProductImage}
                                        onChange={(e) => {
                                            setUseProductImage(e.target.checked);
                                            if (e.target.checked) setDealImage(product.mainImage || '');
                                        }}
                                        className="w-4 h-4 accent-primary"
                                    />
                                    <span className="text-xs font-medium text-slate-600">Use product image</span>
                                </label>
                            </div>
                            <input type="file" ref={mainInputRef} accept="image/*" className="hidden" onChange={handleImageChange} />
                            {dealImage ? (
                                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200">
                                    <img src={dealImage} alt="Deal preview" className="w-full h-full object-cover" />
                                    {!useProductImage && (
                                        <button
                                            type="button"
                                            onClick={() => { setDealImage(''); setLocalMainFile(null); }}
                                            className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg hover:bg-white"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => mainInputRef.current?.click()}
                                    className="w-full aspect-video rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer"
                                >
                                    <div className="size-12 bg-slate-100 rounded-xl flex items-center justify-center">
                                        <ImageIcon size={20} className="text-slate-400" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-500">Upload Deal Image</p>
                                </button>
                            )}
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Preview */}
                {currentStep === 2 && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            {/* Deal Image */}
                            <div className="relative aspect-video bg-slate-100">
                                {dealImage ? (
                                    <img src={dealImage} alt={dealTitle} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ShoppingBag size={40} className="text-slate-300" />
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 flex gap-2">
                                    <span className="px-2.5 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                                        {DEAL_TYPES.find(t => t.value === dealType)?.label || 'Deal'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5">
                                <h3 className="text-lg font-bold text-slate-900 mb-1">{dealTitle}</h3>
                                <p className="text-sm text-slate-500 mb-4">{dealDescription}</p>
                                
                                <div className="flex items-baseline gap-3 mb-4">
                                    <span className="text-2xl font-black text-primary">₦{getCalculatedPrice().toLocaleString()}</span>
                                    {getCalculatedPrice() < product.price && (
                                        <span className="text-sm text-slate-400 line-through">₦{Number(product.price).toLocaleString()}</span>
                                    )}
                                </div>

                                {startDate && endDate && (
                                    <p className="text-xs text-slate-500">
                                        Valid: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Reassurance */}
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 size={18} className="text-emerald-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-emerald-800">Changes will only apply to this deal</p>
                                    <p className="text-xs text-emerald-600 mt-1">
                                        Your original product ({product.name}) will remain unchanged at ₦{Number(product.price).toLocaleString()}.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                    {currentStep > 0 ? (
                        <button
                            type="button"
                            onClick={() => setCurrentStep(s => s - 1)}
                            className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-primary transition-colors"
                        >
                            <ChevronLeft size={14} /> Back
                        </button>
                    ) : <div />}
                    
                    {currentStep < STEPS.length - 1 ? (
                        <button
                            type="button"
                            onClick={() => setCurrentStep(s => s + 1)}
                            disabled={!canProceed()}
                            className="flex items-center gap-1 h-10 px-5 bg-primary text-white font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50 disabled:pointer-events-none"
                        >
                            Next <ChevronRight size={14} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handlePublish}
                            disabled={isUploading}
                            className="flex items-center gap-2 h-10 px-6 bg-primary text-white font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-primary-hover transition-all disabled:opacity-60"
                        >
                            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Flame size={14} />}
                            Publish Deal
                        </button>
                    )}
                </div>
            </Modal>
        </>
    );
}
