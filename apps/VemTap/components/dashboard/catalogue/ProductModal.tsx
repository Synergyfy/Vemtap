'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Modal from '@/components/ui/Modal';
import {
    CatalogueItem,
    useCreateCatalogueItem,
    useUpdateCatalogueItem,
    useCatalogueCategories,
    useCreateCatalogueCategory,
    DiscountType,
} from '@/services/catalogue/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import toast from 'react-hot-toast';
import { Loader2, Save, Plus, Trash2, Image as ImageIcon, X, Tag, Percent, Coins, HelpCircle, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { generateBarcodeValue, isValidBarcode } from '@/lib/barcode';
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
                        <h3 className="text-xl font-display font-black text-slate-900">Crop Product Image</h3>
                        <p className="text-xs text-slate-500 font-medium">Position your image for the best view</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all"><X size={20} /></button>
                </div>

                <div className="relative h-[400px] w-full bg-slate-200">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
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

const productSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    price: z.coerce.number().min(0, 'Price must be positive'),
    description: z.string().min(1, 'Description is required'),
    categoryId: z.string().min(1, 'Category is required'),
    branchId: z.string().min(1, 'Branch is required'),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    weight: z.string().optional(),
    dimensions: z.string().optional(),
    discountType: z.enum(['none', 'percentage', 'fixed']).default('none'),
    discountValue: z.coerce.number().min(0, 'Value must be positive').optional(),
    stockQuantity: z.coerce.number().min(0, 'Stock must be positive').optional(),
    enableLoyaltyPoints: z.boolean().default(false),
    loyaltyPointsValue: z.coerce.number().min(0, 'Value must be positive').optional(),
    allowBackOrder: z.boolean().default(true),
    applyGlobally: z.boolean().default(false),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product?: CatalogueItem | null;
    activeBranchId?: string;
}

const STEPS = [
    { title: 'Details', description: 'Basic product information' },
    { title: 'Pricing', description: 'Price, stock & logistics' },
    { title: 'Images', description: 'Product photos' },
] as const;

export default function ProductModal({ isOpen, onClose, product, activeBranchId }: ProductModalProps) {
    const createMutation = useCreateCatalogueItem();
    const updateMutation = useUpdateCatalogueItem();
    const createCategoryMutation = useCreateCatalogueCategory();
    const { data: categories = [] } = useCatalogueCategories();
    const { data: myBusiness } = useMyBusiness();
    const branches = myBusiness?.branches || [];

    const [currentStep, setCurrentStep] = useState(0);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const [isUploading, setIsUploading] = useState(false);
    const [localMainFile, setLocalMainFile] = useState<File | null>(null);
    const [localGalleryFiles, setLocalGalleryFiles] = useState<File[]>([]);
    const [mainImagePreview, setMainImagePreview] = useState<string>('');
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [croppingImage, setCroppingImage] = useState<{ url: string, isGallery?: boolean } | null>(null);

    // Weight & Dimension state for segmented inputs
    const [weightValue, setWeightValue] = useState('');
    const [weightUnit, setWeightUnit] = useState('kg');
    const [dimLength, setDimLength] = useState('');
    const [dimWidth, setDimWidth] = useState('');
    const [dimHeight, setDimHeight] = useState('');
    const [dimUnit, setDimUnit] = useState('cm');
    const weightUnits = ['kg', 'g', 'lb', 'oz'];
    const dimUnits = ['cm', 'm', 'in', 'ft'];

    const mainInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
    const [barcodePreview, setBarcodePreview] = useState<string>('');

    const { register, handleSubmit, reset, watch, setValue, trigger, formState: { errors } } = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema) as any,
        defaultValues: {
            name: '',
            price: 0,
            description: '',
            categoryId: '',
            branchId: activeBranchId || '',
            sku: '',
            barcode: '',
            weight: '',
            dimensions: '',
            discountType: 'none',
            discountValue: 0,
            stockQuantity: 0,
            enableLoyaltyPoints: false,
            loyaltyPointsValue: 0,
            allowBackOrder: true,
            applyGlobally: false,
        },
    });

    const selectedDiscountType = watch('discountType');

    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
            if (product) {
                reset({
                    name: product.name,
                    price: product.price,
                    description: product.description || '',
                    categoryId: product.categoryId,
                    branchId: activeBranchId || product.businessId,
                    sku: product.sku || '',
                    barcode: product.barcode || '',
                    weight: product.weight || '',
                    dimensions: product.dimensions || '',
                    discountType: product.discountType || 'none',
                    discountValue: product.discountValue || 0,
                    stockQuantity: product.stockQuantity || 0,
                    enableLoyaltyPoints: product.enableLoyaltyPoints || false,
                    loyaltyPointsValue: product.loyaltyPointsValue || product.loyaltyPoints || 0,
                    allowBackOrder: product.allowBackOrder,
                    applyGlobally: false,
                });
                setMainImagePreview(product.mainImage || '');
                setGalleryPreviews(product.galleryImages || []);
            } else {
                reset({
                    name: '',
                    price: 0,
                    description: '',
                    categoryId: '',
                    branchId: activeBranchId || '',
                    sku: '',
                    barcode: '',
                    weight: '',
                    dimensions: '',
                    discountType: 'none',
                    discountValue: 0,
                    stockQuantity: 0,
                    enableLoyaltyPoints: false,
                    loyaltyPointsValue: 0,
                    allowBackOrder: true,
                    applyGlobally: false,
                });
                setMainImagePreview('');
                setGalleryPreviews([]);
            }
            setLocalMainFile(null);
            setLocalGalleryFiles([]);
            setBarcodePreview('');
            setIsUploading(false);
        }
    }, [isOpen, product, reset, activeBranchId]);

    // Sync weight/dimension segmented state from product data
    useEffect(() => {
        if (product?.weight) {
            const match = product.weight.match(/^([\d.]+)\s*(kg|g|lb|oz)$/i);
            if (match) {
                setWeightValue(match[1]);
                setWeightUnit(match[2].toLowerCase());
            }
        }
        if (product?.dimensions) {
            const match = product.dimensions.match(/^([\d.]+)x([\d.]+)x([\d.]+)\s*(cm|m|in|ft)$/i);
            if (match) {
                setDimLength(match[1]);
                setDimWidth(match[2]);
                setDimHeight(match[3]);
                setDimUnit(match[4].toLowerCase());
            }
        }
    }, [product]);

    useEffect(() => {
        setValue('weight', weightValue ? `${weightValue} ${weightUnit}` : '');
    }, [weightValue, weightUnit, setValue]);

    useEffect(() => {
        const parts = [dimLength, dimWidth, dimHeight].filter(Boolean);
        setValue('dimensions', parts.length > 0 ? `${parts.join('x')} ${dimUnit}` : '');
    }, [dimLength, dimWidth, dimHeight, dimUnit, setValue]);

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
        const file = new File([blob], "product-image.jpg", { type: 'image/jpeg' });
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

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim() || !activeBranchId) return;
        try {
            await createCategoryMutation.mutateAsync({ name: newCategoryName.trim() });
            toast.success('Category created');
            setNewCategoryName('');
            setIsCreatingCategory(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to create category');
        }
    };

    const handleGenerateBarcode = () => {
        const barcode = generateBarcodeValue(activeBranchId || 'product', watch('name'));
        setValue('barcode', barcode, { shouldValidate: true });
    };

    const watchedBarcode = watch('barcode');

    useEffect(() => {
        if (watchedBarcode && barcodeCanvasRef.current) {
            try {
                const JsBarcode = require('jsbarcode');
                JsBarcode(barcodeCanvasRef.current, watchedBarcode, {
                    format: 'CODE128',
                    width: 2,
                    height: 50,
                    displayValue: true,
                    fontSize: 12,
                    margin: 5,
                    background: '#ffffff',
                });
                setBarcodePreview(barcodeCanvasRef.current.toDataURL('image/png'));
            } catch { }
        } else {
            setBarcodePreview('');
        }
    }, [watchedBarcode]);

    const validateStep = async (step: number) => {
        switch (step) {
            case 0:
                return await trigger(['name', 'categoryId', 'description']);
            case 1:
                return await trigger(['price', 'discountType', 'discountValue', 'stockQuantity', 'branchId', 'loyaltyPointsValue']);
            default:
                return true;
        }
    };

    const handleNext = async () => {
        const valid = await validateStep(currentStep);
        if (valid) setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const onSubmit: SubmitHandler<ProductFormValues> = async (values) => {
        if (currentStep < STEPS.length - 1) {
            handleNext();
            return;
        }

        setIsUploading(true);
        let toastId: string | undefined;

        try {
            let mainImageUrl = mainImagePreview;
            let finalGalleryUrls = galleryPreviews.filter(url => !url.startsWith('data:'));

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

            const { applyGlobally, ...restValues } = values;

            if (!restValues.barcode) {
                restValues.barcode = generateBarcodeValue(activeBranchId || 'product', restValues.name);
            }

            const submissionData = {
                ...restValues,
                shortDescription: restValues.description?.slice(0, 200) || '',
                itemType: 'product' as const,
                mainImage: mainImageUrl,
                galleryImages: finalGalleryUrls,
                loyaltyPoints: restValues.enableLoyaltyPoints ? (restValues.loyaltyPointsValue || 0) : 0,
            };

            if (product) {
                await updateMutation.mutateAsync({
                    id: product.id,
                    data: { ...submissionData, applyGlobally } as any
                });
                toast.success('Product updated successfully');
            } else {
                await createMutation.mutateAsync(submissionData as any);
                toast.success('Product created successfully');
            }
            onClose();
        } catch (error: any) {
            if (toastId) toast.dismiss(toastId);
            toast.error(error.message || 'An error occurred');
        } finally {
            setIsUploading(false);
        }
    };

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

            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={product ? 'Edit Product' : 'Add Product'}
                size="2xl"
            >
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Step Indicator */}
                    <div className="flex items-center justify-between mb-8">
                        {STEPS.map((step, idx) => (
                            <React.Fragment key={idx}>
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "size-10 rounded-full flex items-center justify-center text-sm font-black transition-all shrink-0",
                                        idx < currentStep ? "bg-[#066CF4] text-white" :
                                        idx === currentStep ? "bg-[#066CF4] text-white ring-4 ring-[#066CF4]/20" :
                                        "bg-gray-100 text-gray-400"
                                    )}>
                                        {idx < currentStep ? <Check size={18} /> : idx + 1}
                                    </div>
                                    <div className="hidden sm:block">
                                        <p className={cn(
                                            "text-xs font-black uppercase tracking-widest",
                                            idx <= currentStep ? "text-gray-900" : "text-gray-400"
                                        )}>{step.title}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">{step.description}</p>
                                    </div>
                                </div>
                                {idx < STEPS.length - 1 && (
                                    <div className={cn(
                                        "flex-1 h-px mx-4",
                                        idx < currentStep ? "bg-[#066CF4]" : "bg-gray-200"
                                    )} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Step Content */}
                    <div className="min-h-[320px]">
                        {currentStep === 0 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-5"
                            >
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Product Name *</label>
                                    <input {...register('name')} className={cn("w-full h-14 px-4 bg-gray-50 border rounded-2xl font-bold text-sm outline-none transition-all", errors.name ? "border-red-500" : "border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20")} placeholder="e.g. Classic Burger" />
                                    <p className="text-[10px] text-text-secondary font-medium ml-1">The name customers will see on your menu and receipts.</p>
                                    {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.name.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Category *</label>
                                        <button type="button" onClick={() => setIsCreatingCategory(!isCreatingCategory)} className="text-[10px] text-primary font-bold uppercase tracking-widest hover:underline flex items-center gap-1">
                                            <Plus size={10} /> {isCreatingCategory ? 'Cancel' : 'New Category'}
                                        </button>
                                    </div>
                                    {isCreatingCategory ? (
                                        <div className="flex gap-2">
                                            <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="flex-1 h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none" placeholder="Category Name" />
                                            <button type="button" onClick={handleCreateCategory} disabled={!newCategoryName || createCategoryMutation.isPending} className="h-12 px-4 bg-primary text-white rounded-xl font-bold text-sm disabled:opacity-50">Add</button>
                                        </div>
                                    ) : (
                                        <select {...register('categoryId')} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none cursor-pointer">
                                            <option value="">Select Category</option>
                                            {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                        </select>
                                    )}
                                    {errors.categoryId && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.categoryId.message}</p>}
                                    <p className="text-[10px] text-text-secondary font-medium ml-1">Group this product under a category for easier browsing.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Weight</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                step="any"
                                                min={0}
                                                value={weightValue}
                                                onChange={e => setWeightValue(e.target.value)}
                                                className="w-24 h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                placeholder="0"
                                            />
                                            <select
                                                value={weightUnit}
                                                onChange={e => setWeightUnit(e.target.value)}
                                                className="flex-1 h-12 px-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none cursor-pointer"
                                            >
                                                {weightUnits.map(u => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                        </div>
                                        <p className="text-[10px] text-text-secondary font-medium ml-1">Enter a number and select the unit.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Dimensions (L × W × H)</label>
                                        <div className="flex flex-row items-center gap-2">
                                            <div className="grid grid-cols-3 flex-1 gap-1">
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        min={0}
                                                        value={dimLength}
                                                        onChange={e => setDimLength(e.target.value)}
                                                        className="w-full h-12 px-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                        placeholder="L"
                                                    />
                                                    <span className="absolute -top-1.5 left-2 bg-gray-50 px-1 text-[8px] font-black text-gray-400">L</span>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        min={0}
                                                        value={dimWidth}
                                                        onChange={e => setDimWidth(e.target.value)}
                                                        className="w-full h-12 px-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                        placeholder="W"
                                                    />
                                                    <span className="absolute -top-1.5 left-2 bg-gray-50 px-1 text-[8px] font-black text-gray-400">W</span>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        min={0}
                                                        value={dimHeight}
                                                        onChange={e => setDimHeight(e.target.value)}
                                                        className="w-full h-12 px-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                        placeholder="H"
                                                    />
                                                    <span className="absolute -top-1.5 left-2 bg-gray-50 px-1 text-[8px] font-black text-gray-400">H</span>
                                                </div>
                                            </div>
                                            <select
                                                value={dimUnit}
                                                onChange={e => setDimUnit(e.target.value)}
                                                className="w-16 sm:w-20 h-12 px-1 sm:px-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-[10px] sm:text-xs outline-none cursor-pointer shrink-0"
                                            >
                                                {dimUnits.map(u => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                        </div>
                                        <p className="text-[10px] text-text-secondary font-medium ml-1">Length, Width, and Height with unit selector.</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Description *</label>
                                    <textarea {...register('description')} rows={3} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none resize-none" placeholder="Detailed product information about ingredients, preparation, or usage..." />
                                    <p className="text-[10px] text-text-secondary font-medium ml-1">Detailed information about ingredients, preparation, or usage.</p>
                                    {errors.description && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.description.message}</p>}
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-5"
                            >
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Original Price (₦) *</label>
                                    <input type="number" step="0.01" {...register('price')} className={cn("w-full h-14 px-4 bg-gray-50 border rounded-2xl font-bold text-sm outline-none transition-all", errors.price ? "border-red-500" : "border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20")} />
                                    <p className="text-[10px] text-text-secondary font-medium ml-1">Base price before any discounts are applied.</p>
                                    {errors.price && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.price.message}</p>}
                                </div>

                                <div className="p-6 bg-primary/5 rounded-xl border border-primary/10 space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <Tag size={16} className="text-primary" />
                                            <h4 className="text-xs font-black text-primary uppercase tracking-widest">Pricing & Discounts</h4>
                                        </div>
                                        <p className="text-[10px] text-primary/70 font-bold">Percentage Off reduces price by a fraction, Fixed Price sets a specific discounted amount.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Barcode</label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input {...register('barcode')} className="w-full sm:flex-1 h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none font-mono tracking-wider" placeholder="e.g. VT000001A1B2C3" />
                                        <button type="button" onClick={handleGenerateBarcode} className="w-full sm:w-auto h-12 px-5 bg-[#066CF4]/10 text-[#066CF4] rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#066CF4]/20 transition-all whitespace-nowrap">
                                            Auto-Generate
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-text-secondary font-medium ml-1">Unique barcode for this product. Scanned at POS to auto-add to cart. Leave empty to auto-generate on save.</p>
                                    <canvas ref={barcodeCanvasRef} className="hidden" />
                                    {barcodePreview && (
                                        <div className="mt-2 p-3 bg-white border border-gray-100 rounded-xl flex items-center justify-center">
                                            <img src={barcodePreview} alt="Barcode" className="h-14" />
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Discount Type</label>
                                            <select
                                                {...register('discountType')}
                                                className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none cursor-pointer"
                                            >
                                                <option value="none">No Discount</option>
                                                <option value="percentage">Percentage Off (%)</option>
                                                <option value="fixed">Fixed Price (₦)</option>
                                            </select>
                                        </div>

                                        {selectedDiscountType !== 'none' && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">
                                                    {selectedDiscountType === 'percentage' ? 'Percentage (%)' : 'Discounted Price (₦)'}
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        {...register('discountValue')}
                                                        className="w-full h-12 pl-10 pr-4 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none"
                                                    />
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                                                        {selectedDiscountType === 'percentage' ? <Percent size={14} /> : <span className="text-xs font-bold">₦</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-text-secondary uppercase tracking-widest">SKU</label>
                                        <input {...register('sku')} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none" placeholder="Optional" />
                                        <p className="text-[10px] text-text-secondary font-medium ml-1">Stock Keeping Unit — your internal product reference code.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Branch *</label>
                                        <select {...register('branchId')} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none cursor-pointer">
                                            <option value="">Select Branch</option>
                                            {branches.map((branch: any) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                                        </select>
                                        {errors.branchId && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.branchId.message}</p>}
                                        <p className="text-[10px] text-text-secondary font-medium ml-1">The branch where this product will be available for sale.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Stock Quantity</label>
                                        <input type="number" {...register('stockQuantity')} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none" placeholder="0" />
                                        <p className="text-[10px] text-text-secondary font-medium ml-1">Current inventory count. Leave at 0 for unlimited or digital products.</p>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input type="checkbox" {...register('enableLoyaltyPoints')} className="size-5 accent-amber-500 cursor-pointer" />
                                            <div>
                                                <p className="text-sm font-bold text-text-main group-hover:text-amber-600 transition-colors flex items-center gap-2">
                                                    <Coins size={14} className="text-amber-500" />
                                                    Enable Loyalty Points
                                                </p>
                                                <p className="text-[10px] text-text-secondary font-medium">Award points to customers when this product is purchased</p>
                                            </div>
                                        </label>
                                        {watch('enableLoyaltyPoints') && (
                                            <div className="pl-8 space-y-2">
                                                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Points to Award</label>
                                                <input type="number" {...register('loyaltyPointsValue')} className="w-full h-12 px-4 bg-amber-50 border border-amber-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500/20" placeholder="e.g. 10" />
                                                <p className="text-[10px] text-amber-700 font-medium ml-1">Points awarded per unit sold. Customer earns this × quantity.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 pt-2">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" {...register('allowBackOrder')} className="size-5 accent-primary cursor-pointer" />
                                        <div>
                                            <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">Allow Back Order</p>
                                            <p className="text-[10px] text-text-secondary font-medium">Customers can order even if out of stock</p>
                                        </div>
                                    </label>

                                    {product && (
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input type="checkbox" {...register('applyGlobally')} className="size-5 accent-primary cursor-pointer" />
                                            <div>
                                                <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">Apply Globally</p>
                                                <p className="text-[10px] text-text-secondary font-medium">Update this product across all branches</p>
                                                <p className="text-[9px] text-amber-600 font-bold uppercase mt-1 italic">Note: Loyalty points will also be applied globally.</p>
                                            </div>
                                        </label>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Main Product Image</label>
                                    <input type="file" ref={mainInputRef} onChange={handleMainUpload} accept="image/*" className="hidden" />
                                    <div
                                        onClick={() => mainInputRef.current?.click()}
                                        className={cn(
                                            "relative h-52 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden cursor-pointer",
                                            mainImagePreview ? "border-solid border-gray-200 bg-white" : "border-gray-200 bg-gray-50 hover:bg-white hover:border-primary/40"
                                        )}
                                    >
                                        {mainImagePreview ? (
                                            <div className="w-full h-full relative group">
                                                <img src={mainImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <p className="text-white text-xs font-black uppercase">Change Image</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                                                    <ImageIcon className="w-6 h-6 text-gray-300" />
                                                </div>
                                                <p className="text-[10px] font-black uppercase text-gray-400">Click to Upload</p>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-text-secondary font-medium ml-1">Upload a square image. This will be the primary photo displayed on your menu.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Gallery Images</label>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">{galleryPreviews.length} Images</span>
                                    </div>
                                    <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} accept="image/*" className="hidden" />
                                    <p className="text-[10px] text-text-secondary font-medium -mt-2 ml-1">Additional photos to showcase your product from different angles.</p>
                                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
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
                                                        }}
                                                        className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all cursor-pointer"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => galleryInputRef.current?.click()}
                                            className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-white hover:border-primary/40 transition-all text-gray-400 hover:text-primary cursor-pointer"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-3 pt-6 border-t border-gray-100 mt-6">
                        {currentStep > 0 ? (
                            <button type="button" onClick={handleBack} className="flex items-center justify-center gap-2 h-12 px-6 bg-gray-50 text-text-secondary font-bold text-sm rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
                                <ChevronLeft size={16} />
                                Back
                            </button>
                        ) : (
                            <button type="button" onClick={onClose} className="flex items-center justify-center gap-2 h-12 px-6 bg-gray-50 text-text-secondary font-bold text-sm rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
                                Cancel
                            </button>
                        )}

                        <div className="flex-1" />

                        {currentStep < STEPS.length - 1 ? (
                            <button key="next-btn" type="button" onClick={handleNext} className="flex items-center justify-center gap-2 h-12 px-8 bg-[#066CF4] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer">
                                Next
                                <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button
                                key="submit-btn"
                                type="submit"
                                disabled={isUploading}
                                className="flex items-center justify-center gap-2 h-12 px-8 bg-[#066CF4] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
                            >
                                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {product ? 'Update Changes' : 'Create Product'}
                            </button>
                        )}
                    </div>
                </form>
            </Modal>
        </>
    );
}
