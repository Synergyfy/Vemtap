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
    DiscountType,
    CatalogueItemType
} from '@/services/catalogue/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import toast from 'react-hot-toast';
import { Loader2, Save, Plus, Trash2, Image as ImageIcon, X, Tag, Percent, Box, Cog, Coins, HelpCircle } from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';
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
    shortDescription: z.string().min(1, 'Short description is required'),
    description: z.string().min(1, 'Full description is required'),
    categoryId: z.string().min(1, 'Category is required'),
    branchId: z.string().min(1, 'Branch is required'),
    sku: z.string().optional(),
    itemType: z.enum(['product', 'service']).default('product'),
    discountType: z.enum(['none', 'percentage', 'fixed']).default('none'),
    discountValue: z.coerce.number().min(0, 'Value must be positive').optional(),
    stockQuantity: z.coerce.number().min(0, 'Stock must be positive').optional(),
    loyaltyPoints: z.coerce.number().min(0, 'Points must be positive').optional(),
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

export default function ProductModal({ isOpen, onClose, product, activeBranchId }: ProductModalProps) {
    const createMutation = useCreateCatalogueItem();
    const updateMutation = useUpdateCatalogueItem();
    const { data: categories = [] } = useCatalogueCategories();
    const { data: myBusiness } = useMyBusiness();
    const branches = myBusiness?.branches || [];

    const [isUploading, setIsUploading] = useState(false);
    const [localMainFile, setLocalMainFile] = useState<File | null>(null);
    const [localGalleryFiles, setLocalGalleryFiles] = useState<File[]>([]);
    const [mainImagePreview, setMainImagePreview] = useState<string>('');
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [croppingImage, setCroppingImage] = useState<{ url: string, isGallery?: boolean } | null>(null);

    const mainInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema) as any,
        defaultValues: {
            name: '',
            price: 0,
            shortDescription: '',
            description: '',
            categoryId: '',
            branchId: activeBranchId || '',
            sku: '',
            itemType: 'product',
            discountType: 'none',
            discountValue: 0,
            stockQuantity: 0,
            loyaltyPoints: 0,
            allowBackOrder: true,
            applyGlobally: false,
        },
    });

    const selectedDiscountType = watch('discountType');
    const selectedItemType = watch('itemType');

    useEffect(() => {
        if (isOpen) {
            if (product) {
                reset({
                    name: product.name,
                    price: product.price,
                    shortDescription: product.shortDescription || '',
                    description: product.description || '',
                    categoryId: product.categoryId,
                    branchId: activeBranchId || product.businessId,
                    sku: product.sku || '',
                    itemType: product.itemType || 'product',
                    discountType: product.discountType || 'none',
                    discountValue: product.discountValue || 0,
                    stockQuantity: product.stockQuantity || 0,
                    loyaltyPoints: product.loyaltyPoints || 0,
                    allowBackOrder: product.allowBackOrder,
                    applyGlobally: false,
                });
                setMainImagePreview(product.mainImage || '');
                setGalleryPreviews(product.galleryImages || []);
            } else {
                reset({
                    name: '',
                    price: 0,
                    shortDescription: '',
                    description: '',
                    categoryId: '',
                    branchId: activeBranchId || '',
                    sku: '',
                    itemType: 'product',
                    discountType: 'none',
                    discountValue: 0,
                    stockQuantity: 0,
                    loyaltyPoints: 0,
                    allowBackOrder: true,
                    applyGlobally: false,
                });
                setMainImagePreview('');
                setGalleryPreviews([]);
            }
            setLocalMainFile(null);
            setLocalGalleryFiles([]);
            setIsUploading(false);
        }
    }, [isOpen, product, reset, activeBranchId]);

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

    const onSubmit: SubmitHandler<ProductFormValues> = async (values) => {
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

            if (!mainImageUrl) {
                toast.error('Main product image is required');
                setIsUploading(false);
                return;
            }

            const { applyGlobally, ...restValues } = values;

            const submissionData = {
                ...restValues,
                mainImage: mainImageUrl,
                galleryImages: finalGalleryUrls
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
                size="lg"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Core Info */}
                        <div className="space-y-6 md:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Product Name *</label>
                                    <input {...register('name')} className={cn("w-full h-12 px-4 bg-gray-50 border rounded-xl font-bold text-sm outline-none transition-all", errors.name ? "border-red-500" : "border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20")} placeholder="e.g. Classic Burger" />
                                    {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.name.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Item Type *</label>
                                        <Tooltip content="Products are physical goods, while Services are time-based bookings.">
                                            <HelpCircle size={14} className="text-text-secondary cursor-help" />
                                        </Tooltip>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => setValue('itemType', 'product')}
                                            className={cn(
                                                "h-10 rounded-lg flex items-center justify-center gap-2 text-xs font-black uppercase transition-all",
                                                selectedItemType === 'product' ? "bg-white text-primary shadow-sm" : "text-text-secondary hover:text-text-main"
                                            )}
                                        >
                                            <Box size={14} />
                                            Product
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setValue('itemType', 'service')}
                                            className={cn(
                                                "h-10 rounded-lg flex items-center justify-center gap-2 text-xs font-black uppercase transition-all",
                                                selectedItemType === 'service' ? "bg-white text-primary shadow-sm" : "text-text-secondary hover:text-text-main"
                                            )}
                                        >
                                            <Cog size={14} />
                                            Service
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Original Price (₦) *</label>
                                    <input type="number" step="0.01" {...register('price')} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none" />
                                    <p className="text-[10px] text-text-secondary font-medium ml-1">Base price before any discounts are applied.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Category *</label>
                                    <select {...register('categoryId')} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none cursor-pointer">
                                        <option value="">Select Category</option>
                                        {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Discount Section */}
                            <div className="p-6 bg-primary/5 rounded-xl border border-primary/10 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Tag size={16} className="text-primary" />
                                    <h4 className="text-xs font-black text-primary uppercase tracking-widest">Pricing & Discounts</h4>
                                    <Tooltip content="Percentage Off (%) reduces price by a fraction, Fixed Price (₦) sets a specific discounted amount.">
                                        <HelpCircle size={14} className="text-primary cursor-help" />
                                    </Tooltip>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
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
                        </div>

                        {/* Images Section */}
                        <div className="space-y-4 md:col-span-2">
                            <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Main Product Image *</label>
                            <input type="file" ref={mainInputRef} onChange={handleMainUpload} accept="image/*" className="hidden" />
                            <div
                                onClick={() => mainInputRef.current?.click()}
                                className={cn(
                                    "relative h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden cursor-pointer",
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
                        </div>

                        <div className="space-y-4 md:col-span-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Gallery Images</label>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">{galleryPreviews.length} Images</span>
                            </div>
                            <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} accept="image/*" className="hidden" />
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

                        {/* Logistics */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Branch *</label>
                            <select {...register('branchId')} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none cursor-pointer">
                                <option value="">Select Branch</option>
                                {branches.map((branch: any) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:col-span-2">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Stock Quantity</label>
                                <input type="number" {...register('stockQuantity')} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                    <Coins size={14} className="text-amber-500" />
                                    Loyalty Points
                                    <Tooltip content="Customers earn these points upon successful order completion.">
                                        <HelpCircle size={14} className="text-text-secondary cursor-help" />
                                    </Tooltip>
                                </label>
                                <input type="number" {...register('loyaltyPoints')} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500/20" placeholder="Points on purchase" />
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Short Description *</label>
                            <input {...register('shortDescription')} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none" placeholder="One line summary" />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Full Description *</label>
                            <textarea {...register('description')} rows={3} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none resize-none" placeholder="Detailed product information..." />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
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

                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="flex-1 h-12 bg-gray-50 text-text-secondary font-bold text-sm rounded-xl hover:bg-gray-100 transition-all cursor-pointer">Cancel</button>
                        <button
                            type="submit"
                            disabled={isUploading}
                            className="flex-1 h-12 bg-primary text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                        >
                            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {product ? 'Update Changes' : 'Create Product'}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
