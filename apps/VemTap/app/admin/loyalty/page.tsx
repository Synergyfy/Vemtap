"use client";

import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Gift, Ticket, Tag, Clock, Save, X, Eye, ImageIcon, Upload, Image as ImageIcon2, HelpCircle, Wallet, Package, Percent, ChevronDown, CheckCircle2, AlertCircle, Star, Search, Users, Calendar, LucideIcon, Loader2, LayoutTemplate, Info, BadgeCheck, Crown, Sparkles, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLoyaltyTemplates, useCreateLoyaltyTemplate, useUpdateLoyaltyTemplate, useDeleteLoyaltyTemplate } from '@/services/loyalty/hooks';
import { LoyaltyTemplate, TemplateReward, TemplateStatus } from '@/services/loyalty/types';
import { LoyaltyRule, RewardType } from '@/types/loyalty';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/notify';
import Tooltip from '@/components/ui/Tooltip';
import { uploadToCloudinary } from '@/lib/cloudinary';
import Cropper, { Point, Area } from 'react-easy-crop';
import useEmblaCarousel from 'embla-carousel-react';
import { getCroppedImg } from '@/lib/image-utils';

// ─── Reward Type Details (same as business) ─────────────────────────────────────
const REWARD_TYPE_DETAILS: Record<RewardType, { label: string; description: string; icon: LucideIcon }> = {
    discount: { label: "Custom Discount", description: "Apply percentage or fixed price reduction on checkout.", icon: Percent },
    free_item: { label: "Free Product", description: "Offer a specific item at no cost to the customer.", icon: Package },
    service: { label: "Service Upgrade", description: "Complimentary services or feature upgrades.", icon: Ticket },
    cashback: { label: "Wallet Cashback", description: "Points convertible to spendable store credit.", icon: Wallet },
    gift: { label: "Tangible Gift", description: "A surprise physical reward or gift package.", icon: Gift },
};

type WizardStep = 1 | 2 | 3;

type DraftTemplate = Partial<LoyaltyTemplate> & {
    localPendingImages?: string[];
};

const emptyTemplate: DraftTemplate = {
    name: '',
    description: '',
    pointsRequired: 0,
    category: 'custom_discount' as RewardType,
    coverImage: '',
    galleryImages: [],
};

// ─── Delete Confirmation Modal ──────────────────────────────────────────────────
const DeleteConfirmModal: React.FC<{
    open: boolean;
    templateName?: string;
    onCancel: () => void;
    onConfirm: () => void;
}> = ({ open, templateName, onCancel, onConfirm }) =>
    open ? (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-110" onClick={onCancel} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl"
            >
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirm Delete</p>
                        <h3 className="text-lg font-black text-slate-900">Delete this reward?</h3>
                        {templateName && (
                            <p className="text-xs text-slate-500 mt-1">
                                "{templateName}" will be permanently removed.
                            </p>
                        )}
                    </div>
                    <button onClick={onCancel} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
                        <X size={16} />
                    </button>
                </div>
                <div className="flex items-center justify-end gap-3">
                    <button onClick={onCancel} className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl">Cancel</button>
                    <button onClick={onConfirm} className="px-5 py-2 bg-rose-500 text-white text-xs font-black uppercase tracking-widest rounded-xl">Delete</button>
                </div>
            </motion.div>
        </div>
    ) : null;

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
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
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
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <div>
                            <h3 className="text-xl font-display font-black text-slate-900">Crop Reward Hero</h3>
                            <p className="text-xs text-slate-500 font-medium">Position your image for the best view on the card</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all"><X size={20} /></button>
                    </div>
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


export default function AdminLoyaltyPage() {
    const { data: templates = [], isLoading } = useLoyaltyTemplates();
    const createMutation = useCreateLoyaltyTemplate();
    const updateMutation = useUpdateLoyaltyTemplate();
    const deleteMutation = useDeleteLoyaltyTemplate();

    // ── State ────────────────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [wizardStep, setWizardStep] = useState<WizardStep>(1);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [croppingImage, setCroppingImage] = useState<{ url: string, rewardId: string } | null>(null);

    // Draft template for create/edit
    const [draft, setDraft] = useState<DraftTemplate>(
        JSON.parse(JSON.stringify(emptyTemplate))
    );

    const filteredTemplates = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return templates;
        return templates.filter(t =>
            `${t.name} ${t.description || ''}`.toLowerCase().includes(q)
        );
    }, [templates, searchQuery]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const openCreate = () => {
        setDraft(JSON.parse(JSON.stringify(emptyTemplate)));
        setEditingId(null);
        setWizardStep(1);
        setIsModalOpen(true);
    };

    const openEdit = (template: LoyaltyTemplate) => {
        setDraft(JSON.parse(JSON.stringify(template)));
        setEditingId(template.id);
        setWizardStep(1);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setWizardStep(1);
    };

    const updateDraft = (updates: Partial<DraftTemplate>) => {
        setDraft((prev: DraftTemplate) => ({ ...prev, ...updates }));
    };

    const uploadImage = async (base64: string): Promise<string> => {
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: base64 }),
        });
        const data = await response.json();
        if (!response.ok || !data.url) {
            throw new Error(data.error || 'Image upload failed');
        }
        return data.url;
    };

    const handleSaveTemplate = async () => {
        if (!draft.name) {
            notify.error('Reward name is required.');
            setWizardStep(1);
            return;
        }
        setIsSubmitting(true);
        try {
            const pendingBase64s = (draft as any).localPendingImages || [];

            let uploadedUrls: string[] = [];
            if (pendingBase64s.length > 0) {
                uploadedUrls = await Promise.all(pendingBase64s.map((b64: string) => uploadImage(b64)));
            }
            
            const payload: Partial<LoyaltyTemplate> = {
                name: draft.name,
                description: draft.description,
                pointsRequired: draft.pointsRequired,
                category: (draft.category || 'custom_discount') as RewardType,
                coverImage: uploadedUrls[0] || draft.coverImage,
                galleryImages: [...(draft.galleryImages || []), ...uploadedUrls.slice(1)],
            };

            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, updates: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            notify.success(editingId ? 'Reward updated successfully' : 'Reward created successfully');
            closeModal();
        } catch (error: any) {
            notify.error(error.message || 'Failed to save reward');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id: string) => setConfirmDeleteId(id);
    const confirmDelete = () => {
        if (!confirmDeleteId) return;
        deleteMutation.mutate(confirmDeleteId);
        setConfirmDeleteId(null);
    };

    // ── Image Handling ───────────────────────────────────────────────────────
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            setCroppingImage({ url: result, rewardId: draft.rewards?.[0]?.id || 'main' });
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result as string;
            setDraft((prev: DraftTemplate) => {
                const newDraft = { ...prev };
                if (newDraft.rewards?.[0]) {
                    const r = newDraft.rewards[0] as any;
                    r.localPendingImages = [...(r.localPendingImages || []), base64data];
                }
                return newDraft;
            });
            setCroppingImage(null);
        };
        reader.readAsDataURL(croppedBlob);
    };

    // ── Loading State ─────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-24 min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <LayoutTemplate className="text-primary animate-pulse" size={24} />
                        </div>
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Rewards...</p>
                </div>
            </div>
        );
    }

    const publishedCount = templates.filter(t => t.status === 'published').length;
    const totalRewardsCount = templates.reduce((acc, t) => acc + (t.rewards?.length || 0), 0);

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-linear-to-br from-primary to-primary-hover rounded-2xl shadow-lg shadow-primary/25">
                                <Gift className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-display font-black text-slate-900">
                                    Reward Management
                                </h1>
                                <p className="text-slate-500 font-medium text-sm mt-1">
                                    Create and manage point-based rewards for your loyalty network
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={openCreate}
                        className="bg-primary text-white px-6 py-3 font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center gap-2 rounded-2xl"
                    >
                        <Plus className="w-5 h-5" />
                        Create New Reward
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-100 rounded-xl">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900">{publishedCount}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">Published</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-100 rounded-xl">
                                <Sparkles className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900">{templates.length - publishedCount}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">Drafts</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-100 rounded-xl">
                                <Gift className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900">{totalRewardsCount}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">Total Rewards</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-100 rounded-xl">
                                <LayoutTemplate className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900">{templates.length}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">Total Items</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search rewards by name or description..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl h-12 pl-12 pr-4 font-medium text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                {filteredTemplates.length === 0 ? (
                    <div className="bg-white rounded-2xl border-0 shadow-sm py-16 text-center">
                        <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <Gift className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            No rewards found
                        </h3>
                        <p className="text-slate-500 mb-4 text-sm font-medium">
                            {searchQuery ? 'Try adjusting your search.' : 'Create your first reward to get started.'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={openCreate}
                                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Create Your First Reward
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredTemplates.map((template) => {
                            return (
                                <motion.div
                                    layout
                                    key={template.id}
                                    className={cn(
                                        "group relative flex flex-col hover:shadow-2xl transition-all duration-300 rounded-2xl border bg-linear-to-br from-white to-primary/5",
                                        template.status === 'published' ? "border-primary/20 hover:border-primary/40" : "border-slate-200 bg-slate-50 opacity-90"
                                    )}
                                >
                                    {/* Top accent bar */}
                                    <div className={cn(
                                        "absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl",
                                        template.status === 'published' ? "bg-linear-to-r from-primary via-primary-hover to-primary" : "bg-slate-300"
                                    )} />

                                    <div className="p-6 flex flex-col grow">
                                        <div className="flex items-start justify-between mb-5">
                                            <div className="flex items-center space-x-4">
                                                <div className="relative w-full h-full overflow-hidden rounded-2xl">
                                                    <RewardGallery 
                                                        items={template.rewards.flatMap(r => (r as any).imageUrls || [])} 
                                                        name={template.name} 
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-display font-bold text-slate-900 text-lg line-clamp-1">{template.name}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={cn(
                                                            "px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-black",
                                                            template.status === 'published' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                                                        )}>
                                                            {template.status === 'published' ? 'Published' : 'Draft'}
                                                        </span>
                                                        <span className={cn(
                                                            "px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-black",
                                                            template.rewards[0]?.isActive !== false ? "bg-blue-100 text-blue-600" : "bg-rose-100 text-rose-600"
                                                        )}>
                                                            {template.rewards[0]?.isActive !== false ? 'Active' : 'Inactive'}
                                                        </span>
                                                        <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[9px] uppercase tracking-widest font-black border border-primary/20 flex items-center gap-1">
                                                            <Gift className="w-3 h-3" />
                                                            Reward
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                <button
                                                    onClick={() => openEdit(template)}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                    title="Edit Reward"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-sm text-slate-500 font-medium mb-4 line-clamp-2 min-h-[40px]">
                                            {template.description || 'No description provided for this reward.'}
                                        </p>

                                        {/* Preview Images */}
                                        {(() => {
                                            const allImages = template.rewards.flatMap(r => (r as any).imageUrls || []).slice(0, 4);
                                            return allImages.length > 0 ? (
                                                <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
                                                    {allImages.map((url: string, i: number) => (
                                                        <div key={i} className="size-12 rounded-xl overflow-hidden border border-slate-100 shrink-0 shadow-sm ring-2 ring-white">
                                                            <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : null;
                                        })()}

                                        {/* Stats grid */}
                                        <div className="grid grid-cols-2 gap-3 mb-5">
                                            <Tooltip content="Total times this reward has been redeemed.">
                                                <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100 h-full flex flex-col justify-center">
                                                    <div className="flex items-center justify-center gap-1.5 text-slate-700">
                                                        <Sparkles className="w-5 h-5 fill-slate-200" />
                                                        <span className="text-2xl font-black">{Math.floor(Math.random() * 200) + 10}</span>
                                                    </div>
                                                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Redemptions</p>
                                                </div>
                                            </Tooltip>
                                            <Tooltip content="Points required to redeem this reward.">
                                                <div className="text-center p-3 bg-purple-50 rounded-xl border border-purple-100/50">
                                                    <span className="text-xl font-black text-purple-600">{template.pointsRequired || 0}</span>
                                                    <p className="text-[9px] uppercase tracking-widest font-black text-purple-400 mt-1">Points Cost</p>
                                                </div>
                                            </Tooltip>
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-auto pt-4 border-t border-slate-100">
                                            <button
                                                onClick={() => handleDelete(template.id)}
                                                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 rounded-xl transition-all font-bold text-xs uppercase tracking-widest group/btn"
                                            >
                                                <Trash2 className="w-4 h-4 text-slate-400 group-hover/btn:text-rose-500 transition-colors" />
                                                Delete Reward
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Wizard Modal (same modal style as business RewardManager) ──────── */}
            <AnimatePresence>
                {croppingImage && (
                    <CropperModal 
                        image={croppingImage.url} 
                        onCropComplete={handleCropComplete} 
                        onClose={() => setCroppingImage(null)} 
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100 p-4 overflow-y-auto">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeModal}
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
                                    onClick={closeModal}
                                    className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors z-10"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Modal Header */}
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                                        <Gift className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-2xl font-display font-semibold tracking-tight text-slate-900 truncate">
                                            {editingId ? 'Edit Reward' : 'New Reward'}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">Configure your point-based reward offer</p>
                                    </div>
                                </div>

                                {/* Step Progress */}
                                <div className="flex gap-1.5 mb-8">
                                    <div className={cn("h-1.5 flex-1 rounded-full transition-all cursor-pointer", wizardStep >= 1 ? "bg-primary" : "bg-slate-100")} onClick={() => setWizardStep(1)} />
                                    <div className={cn("h-1.5 flex-1 rounded-full transition-all cursor-pointer", wizardStep >= 2 ? "bg-primary" : "bg-slate-100")} onClick={() => setWizardStep(2)} />
                                    <div className={cn("h-1.5 flex-1 rounded-full transition-all cursor-pointer", wizardStep >= 3 ? "bg-primary" : "bg-slate-100")} onClick={() => setWizardStep(3)} />
                                </div>

                                {/* ── STEP 1: Reward Basics ───────────────────────────────────── */}
                                {wizardStep === 1 && (
                                    <div className="space-y-8">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-semibold text-slate-600">Step 1: Identity & Category</h4>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-slate-700 ml-1">Reward Name <span className="text-rose-500">*</span></label>
                                                    <input
                                                        type="text"
                                                        value={draft.name}
                                                        onChange={(e) => setDraft((prev: DraftTemplate) => ({ ...prev, name: e.target.value }))}
                                                        className="w-full h-12 px-5 bg-slate-50 border border-transparent rounded-xl font-bold text-sm outline-none transition-all focus:bg-white focus:border-primary/20"
                                                        placeholder="e.g. $10 Coffee Voucher"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-slate-700 ml-1">Category / Type</label>
                                                    <select
                                                        value={draft.category}
                                                        onChange={(e) => setDraft((prev: DraftTemplate) => ({ ...prev, category: e.target.value as any }))}
                                                        className="w-full h-12 px-5 bg-slate-50 border border-transparent rounded-xl font-bold text-sm outline-none transition-all focus:bg-white focus:border-primary/20 appearance-none"
                                                    >
                                                        <option value="custom_discount">Discount Voucher</option>
                                                        <option value="free_product">Free Product</option>
                                                        <option value="service_upgrade">Service Upgrade</option>
                                                        <option value="tangible_gifts">Physical Gift</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-slate-700 ml-1">Description</label>
                                                <textarea
                                                    value={draft.description || ''}
                                                    onChange={(e) => setDraft((prev: DraftTemplate) => ({ ...prev, description: e.target.value }))}
                                                    rows={3}
                                                    className="w-full p-5 bg-slate-50 border border-transparent rounded-xl font-bold text-sm focus:bg-white focus:border-primary/20 outline-none transition-all resize-none"
                                                    placeholder="Describe the reward..."
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <label className="text-xs font-medium text-slate-700 ml-1">Reward Images</label>
                                                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                                    {draft.coverImage && (
                                                        <div className="relative size-24 rounded-2xl overflow-hidden border-2 border-primary group shrink-0">
                                                            <img src={draft.coverImage} className="w-full h-full object-cover" />
                                                            <button onClick={() => setDraft((prev: DraftTemplate) => ({ ...prev, coverImage: '' }))} className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {draft.galleryImages?.map((url: string, idx: number) => (
                                                        <div key={idx} className="relative size-24 rounded-2xl overflow-hidden border-2 border-slate-100 group shrink-0">
                                                            <img src={url} className="w-full h-full object-cover" />
                                                            <button onClick={() => setDraft((prev: DraftTemplate) => ({ ...prev, galleryImages: prev.galleryImages?.filter((_item: string, i: number) => i !== idx) }))} className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <label className="size-24 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-slate-50 transition-colors shrink-0">
                                                        <ImageIcon className="w-6 h-6 text-slate-400" />
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Add Photo</span>
                                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── STEP 2: Points ────────────────────────────────────────── */}
                                {wizardStep === 2 && (
                                    <div className="space-y-8">
                                        <div className="space-y-6">
                                            <h4 className="text-sm font-semibold text-slate-600">Step 2: Redemption Rules</h4>
                                            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 space-y-4 text-center">
                                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Points Required for Redemption</label>
                                                <div className="flex items-center justify-center gap-4">
                                                    <button onClick={() => setDraft((prev: DraftTemplate) => ({ ...prev, pointsRequired: Math.max(0, (prev.pointsRequired || 0) - 100) }))} className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all shadow-sm">-</button>
                                                    <input
                                                        type="number"
                                                        value={draft.pointsRequired || 0}
                                                        onChange={(e) => setDraft((prev: DraftTemplate) => ({ ...prev, pointsRequired: Number(e.target.value) }))}
                                                        className="bg-transparent border-none text-center outline-none font-display font-black text-5xl text-slate-900 w-48"
                                                    />
                                                    <button onClick={() => setDraft((prev: DraftTemplate) => ({ ...prev, pointsRequired: (prev.pointsRequired || 0) + 100 }))} className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-200">+</button>
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Customers will need these many points to redeem this reward.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between mt-auto">
                                <button
                                    onClick={() => setWizardStep(prev => Math.max(1, prev - 1) as WizardStep)}
                                    disabled={wizardStep === 1}
                                    className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all"
                                >
                                    Back
                                </button>

                                <div className="flex items-center gap-3">
                                    {wizardStep < 2 ? (
                                        <button
                                            onClick={() => setWizardStep(prev => Math.min(2, prev + 1) as WizardStep)}
                                            className="px-8 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                                        >
                                            Next Step
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSaveTemplate}
                                            disabled={isSubmitting || !draft.name}
                                            className="px-10 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {editingId ? 'Update Reward' : 'Create Reward'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Processing Overlay */}
            <AnimatePresence>
                {isSubmitting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-200 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center space-y-4"
                    >
                        <div className="relative">
                            <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Save className="text-primary animate-pulse" size={24} />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-black text-slate-900">Saving Reward...</p>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                Please wait while we finalize your changes
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirm */}
            <DeleteConfirmModal
                open={!!confirmDeleteId}
                templateName={filteredTemplates.find(t => t.id === confirmDeleteId)?.name}
                onCancel={() => setConfirmDeleteId(null)}
                onConfirm={confirmDelete}
            />
        </div>
    );
}
