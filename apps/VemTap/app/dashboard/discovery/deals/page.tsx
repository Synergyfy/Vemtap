'use client';

import React, { useState, useRef } from 'react';
import {
    Tag, Plus, X, CheckCircle2, ArrowRight, Search, ChevronRight, Loader2, Trash2, Clock, Sparkles, Image as ImageIcon, AlertCircle, RefreshCw, Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useBranches } from '@/services/branches/hooks';
import { useCatalogueOffersAdmin, useUpdateCatalogueOffer, useDeleteCatalogueOffer, useCreateCatalogueOffer, useCatalogueItems } from '@/services/catalogue/hooks';
import { useGenerateDealTerms } from '@/services/deals/hooks';
import type { CatalogueOffer } from '@/services/catalogue/hooks';
import { uploadToCloudinary } from '@/lib/cloudinary';
import PartnershipVerificationGuard from '@/components/dashboard/partnership/PartnershipVerificationGuard';

const DeliveryRadiusMap = dynamic(() => import('@/components/dashboard/discovery/DeliveryRadiusMap'), { ssr: false });

function formatCurrency(value: number): string {
    return '₦' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="size-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <AlertCircle size={32} />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg mb-2">Something went wrong</h3>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            {onRetry && (
                <Button onClick={onRetry} variant="outline" className="rounded-full font-bold gap-2">
                    <RefreshCw size={16} /> Try Again
                </Button>
            )}
        </div>
    );
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="size-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Icon size={32} />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg mb-2">{title}</h3>
            <p className="text-gray-500 text-sm">{description}</p>
        </div>
    );
}

export default function DealsPage() {
    const [isCreatingPromo, setIsCreatingPromo] = useState(false);
    const [editingPromo, setEditingPromo] = useState<CatalogueOffer | null>(null);
    const { activeBranchId, isAllBranches } = useActiveBranch();

    return (
        <PartnershipVerificationGuard>
            <div className="relative p-4 md:p-8 pb-32 max-w-7xl mx-auto font-sans">
                <PageHeader
                    title="Deals"
                    description="Create and manage deals that attract new customers."
                    isSticky={false}
                />

                {!isCreatingPromo ? (
                    <>
                        {isAllBranches && (
                            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 mb-6 flex items-center gap-4">
                                <div className="size-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-amber-800">Select a branch to view deals</p>
                                    <p className="text-sm text-amber-600">Use the branch filter at the top of the page to choose a specific branch.</p>
                                </div>
                            </div>
                        )}

                        {!isAllBranches && (
                            <PromotionsTab
                                branchId={activeBranchId!}
                                onCreatePromo={() => setIsCreatingPromo(true)}
                                onEditPromo={(promo) => { setEditingPromo(promo); setIsCreatingPromo(true); }}
                            />
                        )}
                    </>
                ) : (
                    <CreatePromotionFlow branchId={activeBranchId!} editPromo={editingPromo} onCancel={() => { setIsCreatingPromo(false); setEditingPromo(null); }} />
                )}
            </div>
        </PartnershipVerificationGuard>
    );
}

function PromotionsTab({ branchId, onCreatePromo, onEditPromo }: { branchId: string; onCreatePromo: () => void; onEditPromo: (promo: CatalogueOffer) => void }) {
    const { data: promotions, isLoading, isError, error, refetch } = useCatalogueOffersAdmin({ branchId });
    const updateOffer = useUpdateCatalogueOffer();
    const deleteOffer = useDeleteCatalogueOffer();

    const handleToggleStatus = (promo: CatalogueOffer) => {
        updateOffer.mutate({
            id: promo.id,
            data: { status: promo.status === 'active' ? 'inactive' : 'active' },
        });
    };

    const handleDelete = (promo: CatalogueOffer) => {
        if (window.confirm(`Delete "${promo.name}"?`)) {
            deleteOffer.mutate(promo.id);
        }
    };

    const isExpired = (promo: CatalogueOffer) => {
        if (!promo.endDate) return false;
        return new Date(promo.endDate) < new Date();
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                    <div className="h-7 w-40 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-10 w-44 bg-gray-100 rounded-full animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(i => <div key={i} className="h-56 bg-gray-50 rounded-3xl animate-pulse"></div>)}
                </div>
            </div>
        );
    }

    if (isError) {
        return <ErrorState message={error?.message || 'Failed to load deals'} onRetry={() => refetch()} />;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">My Deals</h3>
                <Button onClick={onCreatePromo} className="rounded-full font-bold gap-2">
                    <Plus size={16} /> Create Deal
                </Button>
            </div>

            {!promotions || promotions.length === 0 ? (
                <EmptyState icon={Tag} title="Your first deal is ready to launch" description="Create a deal to attract new customers and bring them back again." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {promotions.map((promo) => {
                        const expired = isExpired(promo);
                        return (
                        <div key={promo.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
                            {expired && (
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-2xl">
                                    Expired
                                </div>
                            )}
                            {promo.status === 'inactive' && !expired && (
                                <div className="absolute top-0 right-0 bg-gray-400 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-2xl">
                                    Paused
                                </div>
                            )}
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-lg text-gray-800">{promo.name}</h4>
                                <span className={cn("px-3 py-1 rounded-full text-xs font-bold", promo.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-600")}>
                                    {promo.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-2xl">
                                <div>
                                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Views</div>
                                    <div className="font-bold text-gray-800">{(promo as any).views ?? '—'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Visits</div>
                                    <div className="font-bold text-gray-800">{(promo as any).visits ?? '—'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Revenue</div>
                                    <div className="font-bold text-emerald-600">{formatCurrency((promo as any).revenue ?? 0)}</div>
                                </div>
                            </div>

                            {(promo as any).quantity != null && (
                                <div className="mb-4 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-semibold text-gray-600">Remaining claims</span>
                                        <span className="font-bold text-blue-600">{Math.max(0, ((promo as any).quantity || 0) - ((promo as any).claimedCount || 0))} / {(promo as any).quantity}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={() => onEditPromo(promo)}>Edit</Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 rounded-xl font-bold"
                                    onClick={() => handleToggleStatus(promo)}
                                    disabled={updateOffer.isPending || expired}
                                >
                                    {promo.status === 'active' ? 'Pause' : 'Resume'}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl px-4"
                                    onClick={() => handleDelete(promo)}
                                    disabled={deleteOffer.isPending}
                                >
                                    <X size={16} />
                                </Button>
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function CreatePromotionFlow({ branchId, onCancel, editPromo }: { branchId: string; onCancel: () => void; editPromo?: CatalogueOffer | null }) {
    const isEditing = !!editPromo;
    const [step, setStep] = useState(1);
    const [offerType, setOfferType] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');
    const [audience, setAudience] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const startTimeRef = useRef<HTMLInputElement>(null);
    const endTimeRef = useRef<HTMLInputElement>(null);
    const createOffer = useCreateCatalogueOffer();
    const updateOffer = useUpdateCatalogueOffer();
    const { data: catalogueItems = [] } = useCatalogueItems({ branchId }, { enabled: !!branchId });

    // Type-specific fields
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState('');
    const [originalPrice, setOriginalPrice] = useState('');
    const [dealPrice, setDealPrice] = useState('');
    const [freeItemName, setFreeItemName] = useState('');
    const [freeItemValue, setFreeItemValue] = useState('');
    const [minOrderAmount, setMinOrderAmount] = useState('');

    // Advanced settings
    const [dealQuantity, setDealQuantity] = useState('');
    const [audienceTarget, setAudienceTarget] = useState<'all' | 'new_customers' | 'returning_customers'>('all');
    const [maxClaimsPerCustomer, setMaxClaimsPerCustomer] = useState('1');
    const [claimCodePrefix, setClaimCodePrefix] = useState('');
    const DEFAULT_TERMS = [
        'Valid during business hours',
        'Cannot be combined with other offers',
        'Valid for 7 days after claiming',
    ];
    const [dealTerms, setDealTerms] = useState<string[]>(DEFAULT_TERMS);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const generateTerms = useGenerateDealTerms();

    React.useEffect(() => {
        if (generateTerms.data?.terms) {
            setDealTerms(generateTerms.data.terms);
        }
    }, [generateTerms.data]);

    // Pre-populate fields when editing an existing promo
    React.useEffect(() => {
        if (!editPromo) return;
        setTitle(editPromo.name || '');
        setDescription(editPromo.description || '');
        setImages([editPromo.mainImage, ...(editPromo.galleryImages || [])].filter(Boolean));
        if (editPromo.startDate) {
            const sd = new Date(editPromo.startDate);
            setStartDate(sd.toISOString().split('T')[0]);
            setStartTime(sd.toTimeString().slice(0, 5));
        }
        if (editPromo.endDate) {
            const ed = new Date(editPromo.endDate);
            setEndDate(ed.toISOString().split('T')[0]);
            setEndTime(ed.toTimeString().slice(0, 5));
        }
        setOfferType(editPromo.offerType || '');
        setAudience(editPromo.audience || '');
        if (editPromo.quantity != null) setDealQuantity(String(editPromo.quantity));
        setAudienceTarget((editPromo.audienceTarget as any) || 'all');
        if (editPromo.maxClaimsPerCustomer != null) setMaxClaimsPerCustomer(String(editPromo.maxClaimsPerCustomer));
        if (editPromo.claimCodePrefix) setClaimCodePrefix(editPromo.claimCodePrefix);
        if (editPromo.terms && editPromo.terms.length > 0) setDealTerms(editPromo.terms);
        if (editPromo.pricingType === 'percentage_discount') {
            setDiscountType('percentage');
            if (editPromo.discountValue != null) setDiscountValue(String(editPromo.discountValue));
        } else if (editPromo.pricingType === 'fixed_discount_price') {
            setDiscountType('fixed');
            if (editPromo.discountValue != null) setDiscountValue(String(editPromo.discountValue));
            if (editPromo.fixedPrice != null) setDealPrice(String(editPromo.fixedPrice));
        }
    }, [editPromo]);

    // Delivery Scope (free_delivery)
    const [deliveryScope, setDeliveryScope] = useState<'same_area' | 'city_wide' | 'state_wide' | 'nation_wide' | 'custom_distance'>('same_area');
    const [deliveryRegion, setDeliveryRegion] = useState('');
    const [deliveryRadius, setDeliveryRadius] = useState(10);
    const [deliveryUnit, setDeliveryUnit] = useState<'km' | 'mi'>('km');

    // Branch lookup for delivery scope auto-fill
    const { data: branches = [] } = useBranches();
    const currentBranch = React.useMemo(
        () => branches.find((b: any) => b.id === branchId),
        [branches, branchId]
    );

    // Auto-fill delivery region based on scope and branch data
    React.useEffect(() => {
        if (!currentBranch) return;
        switch (deliveryScope) {
            case 'same_area':
                setDeliveryRegion(currentBranch.address || currentBranch.city || '');
                break;
            case 'city_wide':
                setDeliveryRegion(currentBranch.city || '');
                break;
            case 'state_wide':
                setDeliveryRegion(currentBranch.state || '');
                break;
            case 'nation_wide':
                setDeliveryRegion('Nigeria');
                break;
        }
    }, [deliveryScope, currentBranch]);

    // Auto-close time pickers on native change commit
    React.useEffect(() => {
        const start = startTimeRef.current;
        const end = endTimeRef.current;
        const onStartChange = () => start?.blur();
        const onEndChange = () => end?.blur();
        start?.addEventListener('change', onStartChange);
        end?.addEventListener('change', onEndChange);
        return () => {
            start?.removeEventListener('change', onStartChange);
            end?.removeEventListener('change', onEndChange);
        };
    }, []);

    // Special/Bundle Deal sub-type
    const [specialDealType, setSpecialDealType] = useState<'bundle' | 'custom'>('bundle');

    // Common product selection for all deal types
    const [productSource, setProductSource] = useState<'all' | 'select' | 'custom'>('all');
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [productSearch, setProductSearch] = useState('');

    const resetTypeFields = () => {
        setDiscountType('percentage');
        setDiscountValue('');
        setOriginalPrice('');
        setDealPrice('');
        setFreeItemName('');
        setFreeItemValue('');
        setMinOrderAmount('');
        setSpecialDealType('bundle');
        setProductSource('all');
        setSelectedProductIds([]);
        setProductSearch('');
        setDealQuantity('');
        setAudienceTarget('all');
        setMaxClaimsPerCustomer('1');
        setClaimCodePrefix('');
        setDealTerms(DEFAULT_TERMS);
    };

    const filteredCatalogueItems = catalogueItems.filter((item: any) =>
        item.name.toLowerCase().includes(productSearch.toLowerCase())
    );

    const toggleSelectedProduct = (itemId: string) => {
        setSelectedProductIds(prev =>
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const selectedItemsTotal = catalogueItems
        .filter((item: any) => selectedProductIds.includes(item.id))
        .reduce((sum: number, item: any) => sum + (item.price || 0), 0);

    const resolvedItemIds = productSource === 'all'
        ? catalogueItems.map((item: any) => item.id)
        : productSource === 'select' ? selectedProductIds : [];

    const resolvedItemCount = productSource === 'all'
        ? catalogueItems.length
        : productSource === 'select' ? selectedProductIds.length : 0;

    const handlePublish = () => {
        const payload: any = {
            name: title,
            description,
            mainImage: images[0] || undefined,
            galleryImages: images.length > 1 ? images.slice(1) : undefined,
            branchId,
            itemIds: resolvedItemIds,
            offerType: offerType.toLowerCase().replace(/\s+/g, '_'),
            audience: audience?.toLowerCase().replace(/\s+/g, '_'),
            startDate: startDate ? new Date(`${startDate}T${startTime || '00:00'}`).toISOString() : undefined,
            endDate: endDate ? new Date(`${endDate}T${endTime || '23:59'}`).toISOString() : undefined,
            quantity: dealQuantity ? Number(dealQuantity) : undefined,
            maxClaimsPerCustomer: maxClaimsPerCustomer ? Number(maxClaimsPerCustomer) : undefined,
            audienceTarget: audienceTarget,
            claimCodePrefix: claimCodePrefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || undefined,
            terms: dealTerms.length > 0 ? dealTerms : undefined,
        };

        switch (offerType) {
            case 'discount':
                payload.pricingType = discountType === 'percentage' ? 'percentage_discount' : 'fixed_discount_price';
                payload.discountValue = Number(discountValue) || 0;
                break;
            case 'free_item':
                payload.pricingType = 'sum';
                payload.discountValue = Number(freeItemValue) || 0;
                if (freeItemName) payload.description = `${freeItemName} - ${description}`.trim();
                break;
            case 'special_deal':
                if (specialDealType === 'bundle') {
                    payload.pricingType = 'fixed_discount_price';
                    payload.discountValue = (selectedItemsTotal - Number(dealPrice)) || 0;
                    payload.fixedPrice = Number(dealPrice) || 0;
                } else {
                    payload.pricingType = 'fixed_discount_price';
                    payload.discountValue = (Number(originalPrice) - Number(dealPrice)) || 0;
                    payload.fixedPrice = Number(dealPrice) || 0;
                }
                break;
            case 'free_delivery':
                payload.pricingType = 'sum';
                if (minOrderAmount) payload.description = `Free delivery on orders above ₦${Number(minOrderAmount).toLocaleString()}. ${description}`.trim();
                payload.deliveryScope = deliveryScope;
                if (deliveryScope === 'custom_distance') {
                    payload.deliveryRadius = deliveryRadius;
                    payload.deliveryUnit = deliveryUnit;
                } else {
                    payload.deliveryRegion = deliveryRegion;
                }
                break;
            default:
                payload.pricingType = 'sum';
        }

        if (isEditing) {
            delete payload.branchId;
            updateOffer.mutate({ id: editPromo.id, data: payload }, {
                onSuccess: () => {
                    alert('Deal updated successfully!');
                    onCancel();
                },
                onError: (err: any) => {
                    alert(err.message || 'Failed to update deal');
                },
            });
        } else {
            createOffer.mutate(payload, {
                onSuccess: () => {
                    alert('Deal published successfully!');
                    onCancel();
                },
                onError: (err: any) => {
                    alert(err.message || 'Failed to create deal');
                },
            });
        }
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;
        setIsUploading(true);
        try {
            const remaining = 4 - images.length;
            const batch = Array.from(files).slice(0, remaining);
            const urls = await Promise.all(batch.map(f => uploadToCloudinary(f)));
            setImages(prev => [...prev, ...urls].slice(0, 4));
        } catch {
            alert('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 min-h-[600px] animate-in slide-in-from-right-8 duration-300">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-50">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800">{isEditing ? 'Edit Deal' : 'Create Deal'}</h2>
                    <div className="text-sm font-bold text-gray-400 mt-1">Step {step} of 5</div>
                </div>
                <Button variant="ghost" onClick={onCancel} className="text-gray-400 hover:text-gray-800 rounded-full size-10 p-0"><X size={20} /></Button>
            </div>

            <div className="max-w-xl mx-auto pt-8">
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in">
                        <h3 className="text-xl font-semibold text-gray-800 text-center mb-8">What are you offering?</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { label: 'Discount', value: 'discount', description: 'Offer a percentage or fixed amount off your products' },
                                { label: 'Free Item', value: 'free_item', description: 'Give away a free item with purchase to attract new customers' },
                                { label: 'Special Deal', value: 'special_deal', description: 'Set an original price and a discounted deal price' },
                                { label: 'Free Delivery', value: 'free_delivery', description: 'Offer free delivery on orders above a minimum amount' },
                                { label: 'Custom Offer', value: 'custom', description: 'Create a custom offer with your own terms' }
                            ].map((offer, i) => (
                                <button key={i} onClick={() => { setOfferType(offer.value); }} className={cn("w-full p-6 text-left border-2 rounded-2xl transition-all group flex items-center justify-between", offerType === offer.value ? "border-primary bg-blue-50" : "border-gray-100 hover:border-primary hover:bg-blue-50")}>
                                    <div>
                                        <span className={cn("text-lg transition-all", offerType === offer.value ? "text-primary font-bold" : "font-semibold text-gray-700 group-hover:text-primary")}>{offer.label}</span>
                                        <p className="text-sm text-gray-400 mt-1">{offer.description}</p>
                                    </div>
                                    <div className={cn("size-7 rounded-full border-2 flex items-center justify-center shrink-0", offerType === offer.value ? "border-primary bg-primary text-white" : "border-gray-300 group-hover:border-primary")}>
                                        {offerType === offer.value && <CheckCircle2 size={14} />}
                                    </div>
                                </button>
                            ))}
                        </div>
                        {offerType && (
                            <div className="flex justify-center pt-4">
                                <Button onClick={() => setStep(2)} className="rounded-full px-10 font-bold">
                                    Continue <ArrowRight size={16} className="ml-2" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in">
                        <h3 className="text-xl font-semibold text-gray-800 mb-6">Deal Details</h3>
                        <div className="space-y-4">
                            <div className="mb-2">
                                <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full">
                                    {offerType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </span>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. 15% Lunch Discount"
                                    className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>

                            {/* Product Source — common for all deal types */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Products Included</label>
                                <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl">
                                    {[
                                        { label: 'All Products', value: 'all' as const },
                                        { label: 'Select Products', value: 'select' as const },
                                        { label: 'Custom', value: 'custom' as const }
                                    ].map(opt => (
                                        <button key={opt.value} type="button" onClick={() => setProductSource(opt.value)}
                                            className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all", productSource === opt.value ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-800")}>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                {productSource === 'all' && catalogueItems.length > 0 && (
                                    <p className="text-xs text-gray-400 mt-1.5 font-medium">Applied to all {catalogueItems.length} catalogue item{catalogueItems.length !== 1 ? 's' : ''}</p>
                                )}
                                {productSource === 'custom' && (
                                    <p className="text-xs text-gray-400 mt-1.5 font-medium">Not linked to any catalogue product</p>
                                )}
                            </div>

                            {productSource === 'select' && (
                                <div>
                                    <div className="relative mb-3">
                                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search your catalogue..." className="w-full p-3 pl-10 bg-gray-50 border-0 rounded-2xl font-medium focus:ring-2 focus:ring-primary outline-none text-sm" />
                                    </div>

                                    {catalogueItems.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-6">No catalogue items found. Add products to your catalogue first.</p>
                                    ) : filteredCatalogueItems.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-4">No items match your search.</p>
                                    ) : (
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {filteredCatalogueItems.map((item: any) => (
                                                <div key={item.id} onClick={() => toggleSelectedProduct(item.id)}
                                                    className={cn("flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all", selectedProductIds.includes(item.id) ? "border-primary bg-blue-50" : "border-gray-100 hover:border-gray-200")}>
                                                    <div className={cn("size-5 rounded-full border-2 flex items-center justify-center shrink-0", selectedProductIds.includes(item.id) ? "border-primary bg-primary text-white" : "border-gray-300")}>
                                                        {selectedProductIds.includes(item.id) && <CheckCircle2 size={12} />}
                                                    </div>
                                                    {item.mainImage && <img src={item.mainImage} alt={item.name} className="size-10 rounded-lg object-cover" />}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-sm text-gray-800 truncate">{item.name}</div>
                                                        <div className="text-xs text-gray-400">₦{Number(item.price).toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {selectedProductIds.length > 0 && (
                                        <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                            <div className="flex justify-between text-sm font-semibold">
                                                <span className="text-gray-600">{selectedProductIds.length} product{selectedProductIds.length > 1 ? 's' : ''} selected</span>
                                                <span className="text-primary">Total: ₦{selectedItemsTotal.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {offerType === 'discount' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Discount Type</label>
                                        <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl">
                                            {(['percentage', 'fixed'] as const).map(t => (
                                                <button key={t} type="button" onClick={() => setDiscountType(t)}
                                                    className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all", discountType === t ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-800")}>
                                                    {t === 'percentage' ? 'Percentage %' : 'Fixed Amount ₦'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Discount {discountType === 'percentage' ? 'Percentage' : 'Amount'} *</label>
                                        <div className="relative">
                                            <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder={discountType === 'percentage' ? 'e.g. 15' : 'e.g. 2000'} className="w-full p-4 pl-10 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" min="0" />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{discountType === 'percentage' ? '%' : '₦'}</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            {offerType === 'free_item' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Free Item Name *</label>
                                        <input type="text" value={freeItemName} onChange={e => setFreeItemName(e.target.value)} placeholder="e.g. Small Chips" className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Item Value (₦) *</label>
                                        <input type="number" value={freeItemValue} onChange={e => setFreeItemValue(e.target.value)} placeholder="e.g. 1500" className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" min="0" />
                                        <p className="text-xs text-gray-400 mt-1.5 font-medium">The price the customer would normally pay for this item</p>
                                    </div>
                                </>
                            )}

                            {offerType === 'special_deal' && (
                                <>
                                    <div className="mb-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Deal Type</label>
                                        <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl">
                                            {(['bundle', 'custom'] as const).map(t => (
                                                <button key={t} type="button" onClick={() => setSpecialDealType(t)}
                                                    className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all", specialDealType === t ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-800")}>
                                                    {t === 'bundle' ? 'Bundle Deal' : 'Custom Deal'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {specialDealType === 'bundle' && (
                                        <div>
                                            {resolvedItemCount > 0 && (
                                                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 mb-4">
                                                    <div className="flex justify-between text-sm font-semibold">
                                                        <span className="text-gray-600">{resolvedItemCount} product{resolvedItemCount > 1 ? 's' : ''}</span>
                                                        <span className="text-primary">Total: ₦{selectedItemsTotal.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Bundle Deal Price (₦) *</label>
                                                <input type="number" value={dealPrice} onChange={e => setDealPrice(e.target.value)} placeholder="e.g. 3500" className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" min="0" />
                                                {selectedItemsTotal > 0 && dealPrice && (
                                                    <p className="text-xs text-emerald-600 font-medium mt-1.5">Customers save ₦{(selectedItemsTotal - Number(dealPrice)).toLocaleString()}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {specialDealType === 'custom' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Original Price (₦) *</label>
                                                <input type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} placeholder="e.g. 5000" className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" min="0" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Deal Price (₦) *</label>
                                                <input type="number" value={dealPrice} onChange={e => setDealPrice(e.target.value)} placeholder="e.g. 3500" className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" min="0" />
                                                {originalPrice && dealPrice && (
                                                    <p className="text-xs text-emerald-600 font-medium mt-1.5">Customers save ₦{(Number(originalPrice) - Number(dealPrice)).toLocaleString()}</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}

                            {offerType === 'free_delivery' && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Order Amount (₦)</label>
                                        <input type="number" value={minOrderAmount} onChange={e => setMinOrderAmount(e.target.value)} placeholder="e.g. 3000 (leave empty for no minimum)" className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none" min="0" />
                                        <p className="text-xs text-gray-400 mt-1.5 font-medium">Orders above this amount qualify for free delivery</p>
                                    </div>

                                    {/* Delivery Scope */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Delivery Scope</label>

                                        {/* Segmented Control */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-gray-100 rounded-2xl">
                                            {[
                                                { key: 'same_area', label: 'Same Area', distance: '~2 km' },
                                                { key: 'city_wide', label: 'City Wide', distance: '~15 km' },
                                                { key: 'state_wide', label: 'State Wide', distance: '~50 km' },
                                                { key: 'custom_distance', label: 'Custom', distance: '' },
                                            ].map(({ key, label, distance }) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setDeliveryScope(key as typeof deliveryScope)}
                                                    className={cn(
                                                        'px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200',
                                                        deliveryScope === key
                                                            ? 'bg-white text-gray-900 shadow-sm'
                                                            : 'text-gray-500 hover:text-gray-700'
                                                    )}
                                                >
                                                    <div className="leading-tight">{label}</div>
                                                    {distance && <div className="text-[10px] font-medium text-gray-400">{distance}</div>}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Nation Wide quick button */}
                                        <button
                                            type="button"
                                            onClick={() => setDeliveryScope('nation_wide')}
                                            className={cn(
                                                'mt-2 w-full px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 border',
                                                deliveryScope === 'nation_wide'
                                                    ? 'bg-white text-gray-900 shadow-sm border-primary'
                                                    : 'bg-gray-50 text-gray-500 hover:text-gray-700 border-gray-100'
                                            )}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <span>🌍</span>
                                                <span>Nation Wide — covers all of Nigeria</span>
                                            </div>
                                        </button>

                                        {/* View A: Region + distance summary for preset scopes */}
                                        {(deliveryScope === 'same_area' || deliveryScope === 'city_wide' || deliveryScope === 'state_wide' || deliveryScope === 'nation_wide') && (
                                            <div className="mt-4 space-y-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Region</label>
                                                    <input
                                                        type="text"
                                                        value={deliveryRegion}
                                                        onChange={e => setDeliveryRegion(e.target.value)}
                                                        placeholder="Auto-filled from your business address"
                                                        className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none"
                                                    />
                                                </div>

                                                {/* Distance coverage card */}
                                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-semibold text-gray-500">Coverage Distance</span>
                                                        <span className="text-sm font-bold text-primary">
                                                            {deliveryScope === 'same_area' && '~2 km from your branch'}
                                                            {deliveryScope === 'city_wide' && '~15 km from your branch'}
                                                            {deliveryScope === 'state_wide' && '~50 km from your branch'}
                                                            {deliveryScope === 'nation_wide' && 'Entire country (Nigeria)'}
                                                        </span>
                                                    </div>
                                                    {deliveryScope !== 'nation_wide' && currentBranch?.latitude && currentBranch?.longitude && (
                                                        <div className="overflow-hidden rounded-xl border border-gray-100">
                                                            <DeliveryRadiusMap
                                                                center={{ lat: Number(currentBranch.latitude), lng: Number(currentBranch.longitude) }}
                                                                radiusMeters={
                                                                    deliveryScope === 'same_area' ? 2000 :
                                                                    deliveryScope === 'city_wide' ? 15000 :
                                                                    deliveryScope === 'state_wide' ? 50000 : 0
                                                                }
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <p className="text-xs text-gray-400 font-medium">
                                                    {deliveryScope === 'same_area' && 'Deliveries within your immediate neighborhood — walking distance from your branch'}
                                                    {deliveryScope === 'city_wide' && 'Deliveries across your entire city — a wider reach than just your immediate area'}
                                                    {deliveryScope === 'state_wide' && 'Deliveries across your entire state — maximum regional coverage'}
                                                    {deliveryScope === 'nation_wide' && 'Deliveries anywhere in Nigeria — the broadest possible coverage'}
                                                </p>
                                            </div>
                                        )}

                                        {/* View B: Custom Distance with slider and map */}
                                        {deliveryScope === 'custom_distance' && (
                                            <div className="mt-4 space-y-4">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Maximum Delivery Radius</label>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="50"
                                                        value={deliveryRadius}
                                                        onChange={e => setDeliveryRadius(Number(e.target.value))}
                                                        className="flex-1 accent-primary h-2"
                                                    />
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <input
                                                            type="number"
                                                            value={deliveryRadius}
                                                            onChange={e => setDeliveryRadius(Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
                                                            min="1"
                                                            max="50"
                                                            className="w-20 p-3 bg-gray-50 border-0 rounded-xl font-bold text-center focus:ring-2 focus:ring-primary outline-none"
                                                        />
                                                        <select
                                                            value={deliveryUnit}
                                                            onChange={e => setDeliveryUnit(e.target.value as 'km' | 'mi')}
                                                            className="p-3 bg-gray-50 border-0 rounded-xl font-semibold text-gray-700 focus:ring-2 focus:ring-primary outline-none"
                                                        >
                                                            <option value="km">km</option>
                                                            <option value="mi">mi</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Map preview */}
                                                {currentBranch?.latitude && currentBranch?.longitude && (
                                                    <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100">
                                                        <DeliveryRadiusMap
                                                            center={{ lat: Number(currentBranch.latitude), lng: Number(currentBranch.longitude) }}
                                                            radiusMeters={deliveryUnit === 'km' ? deliveryRadius * 1000 : deliveryRadius * 1609.34}
                                                        />
                                                    </div>
                                                )}
                                                {(!currentBranch?.latitude || !currentBranch?.longitude) && (
                                                    <div className="mt-4 h-[300px] rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
                                                        Set your branch location in settings to see the map preview
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Dynamic Summary */}
                                        <p className="text-sm text-gray-500 font-medium mt-4">
                                            {deliveryScope === 'same_area' && deliveryRegion && `Your deal will be visible to users within ~2 km of your branch in ${deliveryRegion}.`}
                                            {deliveryScope === 'city_wide' && deliveryRegion && `Your deal will be visible to users within ~15 km across ${deliveryRegion}.`}
                                            {deliveryScope === 'state_wide' && deliveryRegion && `Your deal will be visible to users within ~50 km across ${deliveryRegion} State.`}
                                            {deliveryScope === 'nation_wide' && `Your deal will be visible to users across the entire country (Nigeria).`}
                                            {deliveryScope === 'custom_distance' && `Your deal will be visible to users within a ${deliveryRadius} ${deliveryUnit} radius of your storefront.`}
                                            {(deliveryScope === 'same_area' || deliveryScope === 'city_wide' || deliveryScope === 'state_wide') && !deliveryRegion && 'Select a delivery scope to see the coverage summary.'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={3}
                                    placeholder="Describe your offer..."
                                    className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-medium focus:ring-2 focus:ring-primary resize-none outline-none"
                                ></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div onClick={e => (e.currentTarget.querySelector<HTMLInputElement>('input[type="date"]')?.showPicker())}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div onClick={e => (e.currentTarget.querySelector<HTMLInputElement>('input[type="time"]')?.showPicker())}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                                    <input
                                        ref={startTimeRef}
                                        type="time"
                                        value={startTime}
                                        onChange={e => setStartTime(e.target.value)}
                                        min={startDate === new Date().toISOString().split('T')[0] ? new Date().toTimeString().slice(0, 5) : undefined}
                                        className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div onClick={e => (e.currentTarget.querySelector<HTMLInputElement>('input[type="date"]')?.showPicker())}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        min={startDate || new Date().toISOString().split('T')[0]}
                                        className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div onClick={e => (e.currentTarget.querySelector<HTMLInputElement>('input[type="time"]')?.showPicker())}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                                    <input
                                        ref={endTimeRef}
                                        type="time"
                                        value={endTime}
                                        onChange={e => setEndTime(e.target.value)}
                                        min={endDate === startDate && startTime ? startTime : endDate === new Date().toISOString().split('T')[0] ? new Date().toTimeString().slice(0, 5) : undefined}
                                        className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Images ({images.length}/4)</label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageSelect}
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                />
                                <div className="grid grid-cols-4 gap-2">
                                    {images.map((url, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 group">
                                            <img src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button type="button" onClick={() => handleRemoveImage(idx)}
                                                    className="bg-white/90 text-red-500 p-2 rounded-full hover:bg-white transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            {idx === 0 && <span className="absolute top-1 left-1 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded">Cover</span>}
                                        </div>
                                    ))}
                                    {images.length < 4 && (
                                        <div onClick={() => fileInputRef.current?.click()}
                                            className="aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-primary/30 cursor-pointer transition-colors">
                                            {isUploading ? (
                                                <Loader2 size={18} className="animate-spin text-primary" />
                                            ) : (
                                                <ImageIcon size={18} />
                                            )}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-1.5 font-medium">Upload up to 4 images. First image is the cover.</p>
                            </div>

                            {/* ── Advanced Settings (Collapsible) ── */}
                            <div className="border-t border-gray-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="w-full flex items-center justify-between text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    <span>Advanced Settings</span>
                                    <ChevronRight size={16} className={cn("transition-transform", showAdvanced && "rotate-90")} />
                                </button>

                                {showAdvanced && (
                                    <div className="mt-4 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {/* Quantity */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Total Quantity Available</label>
                                            <input
                                                type="number"
                                                value={dealQuantity}
                                                onChange={e => setDealQuantity(e.target.value)}
                                                placeholder="Leave empty for unlimited"
                                                min="0"
                                                className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none"
                                            />
                                            <p className="text-xs text-gray-400 mt-1.5 font-medium">Once this many people claim the deal, it automatically closes.</p>
                                        </div>

                                        {/* Audience Target */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-3">Who can claim this deal?</label>
                                            <div className="flex gap-1 p-1 bg-gray-50 rounded-2xl">
                                                {[
                                                    { label: 'Everyone', value: 'all' as const },
                                                    { label: 'New', value: 'new_customers' as const },
                                                    { label: 'Returning', value: 'returning_customers' as const },
                                                ].map(opt => (
                                                    <button key={opt.value} type="button" onClick={() => setAudienceTarget(opt.value)}
                                                        className={cn("flex-1 py-2.5 px-1 rounded-xl text-[11px] md:text-sm font-bold transition-all leading-tight text-center", audienceTarget === opt.value ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-800")}>
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1.5 font-medium">
                                                {audienceTarget === 'all' && 'Anyone can claim this deal.'}
                                                {audienceTarget === 'new_customers' && 'Only customers who have never claimed a deal from your business can claim.'}
                                                {audienceTarget === 'returning_customers' && 'Only customers who have registered or patronized your business before can claim.'}
                                            </p>
                                        </div>

                                        {/* Max Claims Per Customer */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Max Claims Per Customer</label>
                                            <input
                                                type="number"
                                                value={maxClaimsPerCustomer}
                                                onChange={e => setMaxClaimsPerCustomer(e.target.value)}
                                                placeholder="1"
                                                min="0"
                                                className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none"
                                            />
                                            <p className="text-xs text-gray-400 mt-1.5 font-medium">How many times the same customer can claim this deal (0 = unlimited).</p>
                                        </div>

                                        {/* Claim Code Prefix */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Claim Code Prefix (Optional)</label>
                                            <input
                                                type="text"
                                                value={claimCodePrefix}
                                                onChange={e => setClaimCodePrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                                placeholder="VEM (Default)"
                                                maxLength={20}
                                                className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none uppercase tracking-wider font-mono"
                                            />
                                            <p className="text-xs text-gray-400 mt-1.5 font-medium">
                                                Custom prefix for claim codes (e.g. EASTER50). Leave empty for default &quot;VEM&quot;. Final code: <strong>{claimCodePrefix || 'VEM'}-BRANCH-XXXX</strong>
                                            </p>
                                        </div>

                                        {/* Terms & Conditions */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Terms & Conditions</label>
                                            <p className="text-xs text-gray-400 mb-3 font-medium">Add, edit, or remove terms for this deal. These will be shown to customers when they view the deal.</p>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!title && !description) {
                                                        alert('Please enter a deal title and description first so AI can generate relevant terms.');
                                                        return;
                                                    }
                                                    generateTerms.mutate({
                                                        description: `${title}. ${description}`,
                                                        offerType: offerType,
                                                    });
                                                }}
                                                disabled={generateTerms.isPending}
                                                className="mb-3 w-full h-10 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                                            >
                                                {generateTerms.isPending ? (
                                                    <><Loader2 size={14} className="animate-spin" /> Generating Terms...</>
                                                ) : (
                                                    <><Sparkles size={14} /> Generate with AI</>
                                                )}
                                            </button>

                                            {generateTerms.isError && (
                                                <p className="text-xs text-red-500 font-medium mb-2">Failed to generate terms. {generateTerms.error?.message || 'Please try again or add terms manually.'}</p>
                                            )}

                                            <div className="space-y-2">
                                                {dealTerms.map((term, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={term}
                                                            onChange={e => {
                                                                const updated = [...dealTerms];
                                                                updated[i] = e.target.value;
                                                                setDealTerms(updated);
                                                            }}
                                                            className="flex-1 p-3 bg-gray-50 border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setDealTerms(dealTerms.filter((_, idx) => idx !== i))}
                                                            className="size-9 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors shrink-0"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setDealTerms([...dealTerms, ''])}
                                                className="mt-2 text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                            >
                                                <Plus size={12} /> Add term
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-between pt-6">
                            <Button variant="ghost" onClick={() => { setStep(1); resetTypeFields(); }} className="font-bold">Back</Button>
                            <Button onClick={() => setStep(3)} disabled={!title} className="rounded-full px-8 font-bold">Next</Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in">
                        <h3 className="text-xl font-semibold text-gray-800 text-center mb-8">Show this deal to:</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { label: 'Nearby Customers', value: 'nearby_customers' },
                                { label: 'Nearby Businesses', value: 'nearby_businesses' },
                                { label: 'Everyone Nearby', value: 'everyone_nearby' }
                            ].map((item, i) => (
                                <button key={i} onClick={() => { setAudience(item.value); setStep(4); }} className="w-full p-6 text-left border-2 border-gray-100 rounded-2xl hover:border-primary hover:bg-blue-50 transition-all group flex items-center justify-between">
                                    <span className="font-semibold text-gray-700 group-hover:text-primary text-lg">{item.label}</span>
                                    <ChevronRight className="text-gray-300 group-hover:text-primary" />
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between pt-6">
                            <Button variant="ghost" onClick={() => setStep(2)} className="font-bold">Back</Button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in">
                        <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">Preview your Deal</h3>

                        {/* Card matching public PromotionCard design */}
                        <div className="max-w-sm mx-auto bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                            {/* Image */}
                            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                                {images[0] && (
                                    <img src={images[0]} alt={title} className="w-full h-full object-cover" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                {/* Discount badge */}
                                {offerType === 'discount' && discountType === 'percentage' && discountValue && (
                                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-lg">
                                        {discountValue}% OFF
                                    </div>
                                )}

                                {images.length > 1 && (
                                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-[9px] font-bold">
                                        1/{images.length}
                                    </div>
                                )}
                                {offerType === 'discount' && discountType === 'fixed' && discountValue && (
                                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-lg">
                                        SAVE ₦{Number(discountValue).toLocaleString()}
                                    </div>
                                )}
                                {offerType === 'special_deal' && specialDealType === 'bundle' && dealPrice && selectedItemsTotal > 0 && (
                                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-lg">
                                        SAVE ₦{(selectedItemsTotal - Number(dealPrice)).toLocaleString()}
                                    </div>
                                )}
                                {offerType === 'special_deal' && specialDealType === 'custom' && originalPrice && dealPrice && (
                                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-lg">
                                        SAVE ₦{(Number(originalPrice) - Number(dealPrice)).toLocaleString()}
                                    </div>
                                )}
                                {offerType === 'free_item' && freeItemName && (
                                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-lg">
                                        FREE
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                    {offerType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </p>

                                <h3 className="font-headline font-bold text-gray-900 text-base leading-tight line-clamp-1">
                                    {title || 'Your Deal Title'}
                                </h3>

                                <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
                                    {description || 'Deal description goes here.'}
                                </p>

                                {/* Price */}
                                {(offerType === 'special_deal' || offerType === 'discount' || offerType === 'free_item') && (
                                    <div className="flex items-baseline gap-2 pt-1">
                                        {offerType === 'special_deal' && specialDealType === 'bundle' && dealPrice && (
                                            <>
                                                <span className="text-lg font-bold text-primary font-display tracking-tight">
                                                    ₦{Number(dealPrice).toLocaleString()}
                                                </span>
                                                {selectedItemsTotal > 0 && (
                                                    <span className="text-xs text-gray-400 line-through font-bold">
                                                        ₦{selectedItemsTotal.toLocaleString()}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                        {offerType === 'special_deal' && specialDealType === 'custom' && dealPrice && (
                                            <>
                                                <span className="text-lg font-bold text-primary font-display tracking-tight">
                                                    ₦{Number(dealPrice).toLocaleString()}
                                                </span>
                                                {originalPrice && (
                                                    <span className="text-xs text-gray-400 line-through font-bold">
                                                        ₦{Number(originalPrice).toLocaleString()}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                        {offerType === 'discount' && (
                                            <>
                                                <span className="text-xs text-gray-400 font-medium">Discount applied at checkout</span>
                                            </>
                                        )}
                                        {offerType === 'free_item' && freeItemName && (
                                            <span className="text-lg font-bold text-primary font-display tracking-tight">
                                                Free
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Date range */}
                                {(startDate || endDate) && (
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                        <Clock size={10} className="text-gray-400" />
                                        <span className="text-[10px] text-gray-400 font-bold">
                                            {startDate ? `${new Date(startDate).toLocaleDateString()} ${startTime || ''}` : 'Start'} — {endDate ? `${new Date(endDate).toLocaleDateString()} ${endTime || ''}` : 'End'}
                                        </span>
                                    </div>
                                )}

                                {/* Audience */}
                                {audience && (
                                    <div className="flex items-center gap-1">
                                        <Users size={10} className="text-primary" />
                                        <span className="text-[10px] font-bold text-primary">
                                            For: {audience.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-[10px] text-gray-400 font-bold">Preview</span>
                                    <span className="flex items-center gap-1 text-xs font-bold text-primary">
                                        View Offer <ArrowRight size={12} />
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between pt-8">
                            <Button variant="ghost" onClick={() => setStep(3)} className="font-bold">Back</Button>
                            <Button onClick={() => setStep(5)} className="rounded-full px-8 font-bold">Looks Good</Button>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-6 animate-in fade-in text-center">
                        <div className="size-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={40} />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-800 mb-2">{isEditing ? 'Ready to Update!' : 'Ready to Publish!'}</h3>
                        <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">{isEditing ? 'Your deal changes will be saved and immediately visible to customers and businesses nearby.' : 'Your deal will immediately be visible to customers and businesses nearby.'}</p>

                        {/* Mini preview card */}
                        <div className="max-w-xs mx-auto bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 text-left">
                            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                                {images[0] && (
                                    <img src={images[0]} alt={title} className="w-full h-full object-cover" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                {offerType === 'discount' && discountType === 'percentage' && discountValue && (
                                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-lg">
                                        {discountValue}% OFF
                                    </div>
                                )}
                                {offerType === 'special_deal' && specialDealType === 'bundle' && dealPrice && selectedItemsTotal > 0 && (
                                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-lg">
                                        SAVE ₦{(selectedItemsTotal - Number(dealPrice)).toLocaleString()}
                                    </div>
                                )}
                                {images.length > 1 && (
                                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-[9px] font-bold">
                                        1/{images.length}
                                    </div>
                                )}
                                {offerType === 'special_deal' && specialDealType === 'custom' && originalPrice && dealPrice && (
                                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-lg">
                                        SAVE ₦{(Number(originalPrice) - Number(dealPrice)).toLocaleString()}
                                    </div>
                                )}
                            </div>
                            <div className="p-3 space-y-1.5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                    {offerType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </p>
                                <h3 className="font-headline font-bold text-gray-900 text-sm leading-tight line-clamp-1">
                                    {title || 'Your Deal Title'}
                                </h3>
                                {offerType === 'special_deal' && specialDealType === 'bundle' && dealPrice && (
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-base font-bold text-primary">₦{Number(dealPrice).toLocaleString()}</span>
                                        {selectedItemsTotal > 0 && <span className="text-xs text-gray-400 line-through font-bold">₦{selectedItemsTotal.toLocaleString()}</span>}
                                    </div>
                                )}
                                {offerType === 'special_deal' && specialDealType === 'custom' && dealPrice && (
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-base font-bold text-primary">₦{Number(dealPrice).toLocaleString()}</span>
                                        {originalPrice && <span className="text-xs text-gray-400 line-through font-bold">₦{Number(originalPrice).toLocaleString()}</span>}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-4 mt-6">
                            <Button variant="ghost" onClick={() => setStep(4)} className="font-bold">Back</Button>
                            <Button
                                onClick={handlePublish}
                                className="rounded-full px-12 py-6 text-lg font-bold bg-primary hover:bg-primary/90"
                                disabled={isEditing ? updateOffer.isPending : createOffer.isPending}
                            >
                                {isEditing
                                    ? (updateOffer.isPending ? 'Updating...' : 'Update Deal')
                                    : (createOffer.isPending ? 'Publishing...' : 'Publish Deal')
                                }
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
