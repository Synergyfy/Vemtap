'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Modal from '@/components/ui/Modal';
import {
    CatalogueItem,
    useCreateCatalogueItem,
    useUpdateCatalogueItem,
    useCatalogueCategories,
} from '@/services/catalogue/hooks';
import toast from 'react-hot-toast';
import { Loader2, Save, X, Clock, MapPin, Globe, Phone, ChevronRight, ChevronLeft } from 'lucide-react';
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
                if (croppedImage) onCropComplete(croppedImage);
            } catch (e) { console.error(e); }
        }
    };

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden relative shadow-2xl">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Crop Image</h3>
                        <p className="text-xs text-slate-500 font-medium">Position your image for the best view</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all"><X size={20} /></button>
                </div>
                <div className="relative h-[400px] w-full bg-slate-200">
                    <Cropper image={image} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)} onZoomChange={setZoom} />
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
                        <button onClick={handleSave} className="flex-2 py-3 bg-primary text-white font-semibold text-xs uppercase tracking-widest rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all cursor-pointer">Apply Crop</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const DURATION_OPTIONS = [
    '15 minutes', '30 minutes', '45 minutes', '1 hour', '1.5 hours',
    '2 hours', '3 hours', '4 hours', 'Half day', 'Full day', 'Custom',
];

const SERVICE_MODES = [
    { value: 'location', label: 'At Business Location', icon: MapPin, description: 'Customer comes to you' },
    { value: 'customer', label: 'At Customer Location', icon: MapPin, description: 'You go to the customer' },
    { value: 'online', label: 'Online / Remote', icon: Globe, description: 'Delivered virtually' },
    { value: 'flexible', label: 'Multiple / Flexible', icon: Globe, description: 'Any of the above' },
];

const BOOKING_METHODS = [
    { value: 'vemtap', label: 'Book on VEMTAP' },
    { value: 'call', label: 'Call to Book' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'external', label: 'External Link' },
];

const serviceSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    price: z.coerce.number().min(0, 'Price must be positive'),
    description: z.string().min(1, 'Description is required'),
    categoryId: z.string().min(1, 'Category is required'),
    branchId: z.string().min(1, 'Branch is required'),
    priceType: z.enum(['fixed', 'starting_from', 'range', 'contact']).default('fixed'),
    priceRangeMin: z.coerce.number().min(0).optional(),
    priceRangeMax: z.coerce.number().min(0).optional(),
    duration: z.string().optional(),
    serviceMode: z.enum(['location', 'customer', 'online', 'flexible']).default('location'),
    isBookable: z.boolean().default(false),
    bookingMethod: z.enum(['vemtap', 'call', 'whatsapp', 'external']).optional(),
    externalBookingLink: z.string().optional(),
    shortDescription: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
    isOpen: boolean;
    onClose: () => void;
    service?: CatalogueItem | null;
    activeBranchId?: string;
}

const STEPS = [
    { title: 'Details', description: 'Basic service information' },
    { title: 'Pricing', description: 'Price & pricing type' },
    { title: 'Service Info', description: 'Duration, mode & booking' },
    { title: 'Images', description: 'Service photos' },
] as const;

export default function ServiceForm({ isOpen, onClose, service, activeBranchId }: ServiceFormProps) {
    const createMutation = useCreateCatalogueItem();
    const updateMutation = useUpdateCatalogueItem();
    const { data: categories = [] } = useCatalogueCategories();
    const [currentStep, setCurrentStep] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [localMainFile, setLocalMainFile] = useState<File | null>(null);
    const [localGalleryFiles, setLocalGalleryFiles] = useState<File[]>([]);
    const [mainImagePreview, setMainImagePreview] = useState<string>('');
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [croppingImage, setCroppingImage] = useState<{ url: string; isGallery?: boolean } | null>(null);
    const mainInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const { register, handleSubmit, reset, watch, setValue, trigger, formState: { errors } } = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceSchema) as any,
        defaultValues: {
            name: '',
            price: 0,
            description: '',
            categoryId: '',
            branchId: activeBranchId || '',
            priceType: 'fixed',
            priceRangeMin: 0,
            priceRangeMax: 0,
            duration: '',
            serviceMode: 'location',
            isBookable: false,
            bookingMethod: undefined,
            externalBookingLink: '',
            shortDescription: '',
        },
    });

    const priceType = watch('priceType');
    const isBookable = watch('isBookable');

    useEffect(() => {
        if (service) {
            reset({
                name: service.name || '',
                price: service.price || 0,
                description: service.description || '',
                categoryId: service.categoryId || '',
                branchId: activeBranchId || '',
                priceType: (service as any).priceType || 'fixed',
                priceRangeMin: (service as any).priceRangeMin || 0,
                priceRangeMax: (service as any).priceRangeMax || 0,
                duration: (service as any).duration || '',
                serviceMode: (service as any).serviceMode || 'location',
                isBookable: (service as any).isBookable || false,
                bookingMethod: (service as any).bookingMethod,
                externalBookingLink: (service as any).externalBookingLink || '',
                shortDescription: service.shortDescription || '',
            });
            if (service.mainImage) setMainImagePreview(service.mainImage);
            if (service.galleryImages) setGalleryPreviews(service.galleryImages);
        } else {
            reset({
                name: '', price: 0, description: '', categoryId: '', branchId: activeBranchId || '',
                priceType: 'fixed', priceRangeMin: 0, priceRangeMax: 0, duration: '',
                serviceMode: 'location', isBookable: false, bookingMethod: undefined,
                externalBookingLink: '', shortDescription: '',
            });
            setMainImagePreview('');
            setGalleryPreviews([]);
        }
        setCurrentStep(0);
    }, [service, activeBranchId, reset]);

    const handleCropComplete = async (croppedBlob: Blob) => {
        const file = new File([croppedBlob], 'service-image.jpg', { type: 'image/jpeg' });
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
        reader.readAsDataURL(croppedBlob);
    };

    const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setCroppingImage({ url, isGallery: false });
        }
    };

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            const url = URL.createObjectURL(files[0]);
            setCroppingImage({ url, isGallery: true });
        }
    };

    const removeGalleryImage = (index: number) => {
        setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
        setLocalGalleryFiles(prev => prev.filter((_, i) => i !== index));
    };

    const onSubmit = async (values: ServiceFormValues) => {
        // Guard: only allow submit on last step (Images) and after ghost-click debounce
        if (currentStep !== STEPS.length - 1 || !canSubmit) return;
        try {
            setIsUploading(true);
            let mainImageUrl = mainImagePreview;
            let finalGalleryUrls = [...galleryPreviews.filter(url => !url.startsWith('data:'))];

            if (localMainFile || localGalleryFiles.length > 0) {
                const toastId = toast.loading('Uploading images...');
                if (localMainFile) mainImageUrl = await uploadToCloudinary(localMainFile);
                if (localGalleryFiles.length > 0) {
                    const uploaded = await Promise.all(localGalleryFiles.map(f => uploadToCloudinary(f)));
                    finalGalleryUrls = [...finalGalleryUrls, ...uploaded];
                }
                toast.dismiss(toastId);
            }

            const submissionData = {
                ...values,
                shortDescription: values.description?.slice(0, 200) || '',
                itemType: 'service' as const,
                mainImage: mainImageUrl,
                galleryImages: finalGalleryUrls,
            };

            if (service) {
                await updateMutation.mutateAsync({ id: service.id, data: submissionData as any });
                toast.success('Service updated successfully');
            } else {
                await createMutation.mutateAsync(submissionData as any);
                toast.success('Service created successfully');
            }
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'An error occurred');
        } finally {
            setIsUploading(false);
        }
    };

    const nextStep = async () => {
        let fieldsToValidate: (keyof ServiceFormValues)[] = [];
        if (currentStep === 0) fieldsToValidate = ['name', 'description', 'categoryId', 'branchId'];
        if (currentStep === 1) {
            const pt = watch('priceType');
            if (pt === 'range') fieldsToValidate = ['priceRangeMin', 'priceRangeMax'];
            else if (pt === 'starting_from') fieldsToValidate = ['priceRangeMin'];
            else if (pt === 'contact') fieldsToValidate = [];
            else fieldsToValidate = ['price'];
        }
        // Step 2 (Service Info) has no required fields — just advance
        if (fieldsToValidate.length === 0) {
            setCurrentStep(s => Math.min(s + 1, STEPS.length - 1));
            return;
        }
        const valid = await trigger(fieldsToValidate as any);
        if (valid) setCurrentStep(s => Math.min(s + 1, STEPS.length - 1));
    };

    const prevStep = () => setCurrentStep(s => Math.max(0, s - 1));

    // Prevent ghost-click: when Next -> Create Service swaps under the cursor,
    // the mouseup can fire on the new button and auto-submit. Disable Create briefly.
    const [canSubmit, setCanSubmit] = useState(false);
    useEffect(() => {
        if (currentStep === STEPS.length - 1) {
            setCanSubmit(false);
            const t = setTimeout(() => setCanSubmit(true), 500);
            return () => clearTimeout(t);
        } else {
            setCanSubmit(false);
        }
    }, [currentStep]);

    return (
        <>
            <AnimatePresence>
                {croppingImage && (
                    <CropperModal image={croppingImage.url} onCropComplete={handleCropComplete} onClose={() => setCroppingImage(null)} />
                )}
            </AnimatePresence>

            <Modal isOpen={isOpen} onClose={onClose} title={service ? 'Edit Service' : 'Add Service'} size="2xl">
                <form onSubmit={handleSubmit(onSubmit)} onKeyDown={(e) => { if (e.key === 'Enter' && currentStep < STEPS.length - 1) e.preventDefault(); }}>
                    {/* Step Indicator */}
                    <div className="flex items-center justify-between mb-6">
                        {STEPS.map((step, idx) => (
                            <React.Fragment key={step.title}>
                                <div className="flex items-center gap-2">
                                    <div className={cn("size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all", idx <= currentStep ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400')}>
                                        {idx < currentStep ? '✓' : idx + 1}
                                    </div>
                                    <div className="hidden sm:block">
                                        <p className={cn("text-xs font-bold", idx <= currentStep ? 'text-primary' : 'text-slate-400')}>{step.title}</p>
                                        <p className="text-[10px] text-slate-400">{step.description}</p>
                                    </div>
                                </div>
                                {idx < STEPS.length - 1 && <div className={cn("flex-1 h-0.5 mx-2 rounded-full", idx < currentStep ? 'bg-primary' : 'bg-slate-100')} />}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Step 1: Details */}
                    {currentStep === 0 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Service Name *</label>
                                <input {...register('name')} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none" placeholder="e.g. Haircut, Massage, Consultation" />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Category *</label>
                                <select {...register('categoryId')} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none">
                                    <option value="">Select category</option>
                                    {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                                {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Description *</label>
                                <textarea {...register('description')} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none" placeholder="Describe your service..." />
                                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Pricing */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Pricing Type *</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: 'fixed', label: 'Fixed Price' },
                                        { value: 'starting_from', label: 'Starting From' },
                                        { value: 'range', label: 'Price Range' },
                                        { value: 'contact', label: 'Contact for Price' },
                                    ].map(opt => (
                                        <button key={opt.value} type="button" onClick={() => setValue('priceType', opt.value as any)}
                                            className={cn("p-3 rounded-xl border text-xs font-bold transition-all text-left", priceType === opt.value ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-500 hover:border-slate-300')}>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {priceType === 'contact' ? (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                                    <p className="text-sm font-medium text-slate-600">Customers will see "Contact for Price"</p>
                                </div>
                            ) : priceType === 'range' ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Min Price (₦)</label>
                                        <input type="number" {...register('priceRangeMin')} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Max Price (₦)</label>
                                        <input type="number" {...register('priceRangeMax')} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none" />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                        {priceType === 'starting_from' ? 'Starting Price (₦) *' : 'Price (₦) *'}
                                    </label>
                                    <input type="number" {...register('price')} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none" />
                                    {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Service Info */}
                    {currentStep === 2 && (
                        <div className="space-y-5">
                            {/* Duration */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Estimated Duration</label>
                                <div className="flex flex-wrap gap-2">
                                    {DURATION_OPTIONS.map(d => (
                                        <button key={d} type="button" onClick={() => setValue('duration', d)}
                                            className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                                                watch('duration') === d ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-500 hover:border-slate-300')}>
                                            <Clock size={12} className="inline mr-1" />{d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Service Mode */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Service Mode *</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {SERVICE_MODES.map(mode => {
                                        const Icon = mode.icon;
                                        return (
                                            <button key={mode.value} type="button" onClick={() => setValue('serviceMode', mode.value as any)}
                                                className={cn("p-3 rounded-xl border text-left transition-all", watch('serviceMode') === mode.value ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300')}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Icon size={14} className={watch('serviceMode') === mode.value ? 'text-primary' : 'text-slate-400'} />
                                                    <span className={cn("text-xs font-bold", watch('serviceMode') === mode.value ? 'text-primary' : 'text-slate-600')}>{mode.label}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-400">{mode.description}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Booking */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Booking</label>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <input type="checkbox" {...register('isBookable')} id="isBookable" className="w-4 h-4 accent-primary" />
                                    <label htmlFor="isBookable" className="text-sm font-medium text-slate-700">This service is bookable</label>
                                </div>
                                {isBookable && (
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        {BOOKING_METHODS.map(method => (
                                            <button key={method.value} type="button" onClick={() => setValue('bookingMethod', method.value as any)}
                                                className={cn("p-2.5 rounded-xl border text-xs font-bold transition-all",
                                                    watch('bookingMethod') === method.value ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-500 hover:border-slate-300')}>
                                                {method.value === 'call' && <Phone size={12} className="inline mr-1" />}
                                                {method.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {isBookable && watch('bookingMethod') === 'external' && (
                                    <input {...register('externalBookingLink')} placeholder="https://..." className="w-full h-10 px-4 mt-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none" />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Images */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Service Image</label>
                                <input type="file" ref={mainInputRef} accept="image/*" className="hidden" onChange={handleMainImageChange} />
                                {mainImagePreview ? (
                                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200">
                                        <img src={mainImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => { setMainImagePreview(''); setLocalMainFile(null); }} className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg hover:bg-white"><X size={14} /></button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => mainInputRef.current?.click()} className="w-full aspect-video rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer">
                                        <div className="size-12 bg-slate-100 rounded-xl flex items-center justify-center"><span className="text-2xl">+</span></div>
                                        <p className="text-xs font-bold text-slate-500">Upload Service Image</p>
                                    </button>
                                )}
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Additional Images</label>
                                <div className="flex flex-wrap gap-2">
                                    {galleryPreviews.map((url, idx) => (
                                        <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removeGalleryImage(idx)} className="absolute top-1 right-1 p-0.5 bg-white/90 rounded"><X size={10} /></button>
                                        </div>
                                    ))}
                                    {galleryPreviews.length < 5 && (
                                        <button type="button" onClick={() => galleryInputRef.current?.click()} className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center hover:border-primary/40 transition-all cursor-pointer">
                                            <span className="text-xl text-slate-400">+</span>
                                        </button>
                                    )}
                                </div>
                                <input type="file" ref={galleryInputRef} accept="image/*" className="hidden" onChange={handleGalleryChange} />
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                        {currentStep > 0 ? (
                            <button type="button" onClick={prevStep} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-primary transition-colors"><ChevronLeft size={14} /> Back</button>
                        ) : <div />}
                        {currentStep < STEPS.length - 1 ? (
                            <button type="button" onClick={nextStep} className="flex items-center gap-1 h-10 px-5 bg-primary text-white font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-primary-hover transition-all">
                                Next <ChevronRight size={14} />
                            </button>
                        ) : (
                            <button type="submit" disabled={isUploading || !canSubmit} className="flex items-center gap-2 h-10 px-6 bg-primary text-white font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-primary-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                                {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                {service ? 'Update Service' : 'Create Service'}
                            </button>
                        )}
                    </div>
                </form>
            </Modal>
        </>
    );
}
