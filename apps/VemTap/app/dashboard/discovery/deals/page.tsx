'use client';

import React, { useState, useRef } from 'react';
import {
    Tag, Plus, X, CheckCircle2, ArrowRight, Search, ChevronRight, Loader2, Trash2, Clock, Sparkles, Image as ImageIcon, AlertCircle, RefreshCw, Users, BadgeCheck, ShoppingBag, Flame,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useBranches } from '@/services/branches/hooks';
import { useCatalogueOffersAdmin, useUpdateCatalogueOffer, useDeleteCatalogueOffer, useCreateCatalogueOffer, useCatalogueItems } from '@/services/catalogue/hooks';
import type { CatalogueItem } from '@/services/catalogue/hooks';
import { useGenerateDealTerms } from '@/services/deals/hooks';
import { getPromoDaysLeft } from '@/lib/mock/promotions';
import type { CatalogueOffer } from '@/services/catalogue/hooks';
import { uploadToCloudinary } from '@/lib/cloudinary';
import PartnershipVerificationGuard from '@/components/dashboard/partnership/PartnershipVerificationGuard';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import DealEngagementBadge from '@/components/deals/DealEngagementBadge';
import MakeDealFlow from '@/components/dashboard/catalogue/MakeDealFlow';
import { motion } from 'framer-motion';

const DeliveryRadiusMap = dynamic(() => import('@/components/dashboard/discovery/DeliveryRadiusMap'), { ssr: false });

function formatCurrency(value: number): string {
    return '₦' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function DaysLeftLabel({ daysLeft }: { daysLeft: number }) {
    if (daysLeft <= 0) {
        return <span className="text-primary font-black">Last day</span>;
    }
    if (daysLeft === 1) {
        return <span className="text-primary font-black">1 day left</span>;
    }
    return <span className="text-primary font-black">{daysLeft} days left</span>;
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-12 text-center">
            <div className="size-14 md:size-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 text-red-500">
                <AlertCircle size={28} />
            </div>
            <h3 className="font-semibold text-gray-800 text-base md:text-lg mb-1.5 md:mb-2">Something went wrong</h3>
            <p className="text-gray-500 text-xs md:text-sm mb-4 md:mb-6">{message}</p>
            {onRetry && (
                <Button onClick={onRetry} variant="outline" className="rounded-full font-bold gap-2 text-xs md:text-sm">
                    <RefreshCw size={14} /> Try Again
                </Button>
            )}
        </div>
    );
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-12 text-center">
            <div className="size-14 md:size-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 text-gray-400">
                <Icon size={28} />
            </div>
            <h3 className="font-semibold text-gray-800 text-base md:text-lg mb-1.5 md:mb-2">{title}</h3>
            <p className="text-gray-500 text-xs md:text-sm">{description}</p>
        </div>
    );
}

export default function DealsPage() {
    const [isCreatingPromo, setIsCreatingPromo] = useState(false);
    const [editingPromo, setEditingPromo] = useState<CatalogueOffer | null>(null);
    const [importProduct, setImportProduct] = useState<CatalogueItem | null>(null);
    const { activeBranchId, isAllBranches } = useActiveBranch();

    return (
        <PartnershipVerificationGuard>
            <div className="max-w-7xl mx-auto flex flex-col pb-28 font-sans">
                {/* NATIVE APP HEADER SECTION */}
                {!isCreatingPromo && (
                    <section className="relative bg-[#066CF4] -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 px-5 sm:px-8 pt-10 pb-20 rounded-b-[2.5rem] shadow-lg mb-6">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <Tag size={120} />
                        </div>
                        
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <p className="text-blue-100 text-[10px] font-bold uppercase tracking-wider mb-1">
                                        Marketplace
                                    </p>
                                    <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                                        Deals
                                    </h1>
                                </div>
                                <button
                                    onClick={() => setIsCreatingPromo(true)}
                                    className="size-12 rounded-2xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center active:scale-95 transition-all"
                                >
                                    <Plus size={22} />
                                </button>
                            </div>
                            
                            <div className="pt-2 pb-4">
                                <p className="text-blue-100 text-xs font-semibold mb-1 flex items-center gap-1.5">
                                    <Flame size={14} /> Attract Customers
                                </p>
                                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">
                                    Create and manage deals.
                                </h2>
                            </div>
                        </div>

                        {/* Search Bar - Overlapping the Header */}
                        <div className="absolute left-0 right-0 -bottom-6 px-5 sm:px-8">
                            <div className="relative shadow-lg shadow-black/5 rounded-2xl overflow-hidden flex bg-white">
                                <div className="flex-1 relative">
                                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search deals..."
                                        className="w-full h-14 pl-12 pr-4 bg-transparent border-0 text-sm font-bold outline-none text-gray-900 placeholder:text-gray-400"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                <div className={cn("px-5 sm:px-8", !isCreatingPromo && "pt-12")}>
                {!isCreatingPromo ? (
                    <>
                        {isAllBranches && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl md:rounded-3xl p-4 md:p-6 mb-4 md:mb-6 flex items-center gap-3 md:gap-4">
                                <div className="size-9 md:size-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                                    <AlertCircle size={18} />
                                </div>
                                <div>
                                    <p className="font-semibold text-amber-800 text-sm md:text-base">Select a branch to view deals</p>
                                    <p className="text-xs md:text-sm text-amber-600">Use the branch filter at the top of the page to choose a specific branch.</p>
                                </div>
                            </div>
                        )}

                        {!isAllBranches && (
                            <PromotionsTab
                                branchId={activeBranchId!}
                                onCreatePromo={() => setIsCreatingPromo(true)}
                                onEditPromo={(promo) => { setEditingPromo(promo); setIsCreatingPromo(true); }}
                                onImportProduct={(product) => setImportProduct(product)}
                            />
                        )}
                    </>
                ) : (
                    <CreatePromotionFlow branchId={activeBranchId!} editPromo={editingPromo} onCancel={() => { setIsCreatingPromo(false); setEditingPromo(null); }} />
                )}

                )}

                {importProduct && (
                    <MakeDealFlow
                        isOpen={!!importProduct}
                        onClose={() => setImportProduct(null)}
                        product={importProduct}
                        activeBranchId={activeBranchId || undefined}
                    />
                )}
                </div>
            </div>
        </PartnershipVerificationGuard>
    );
}

function PromotionsTab({ branchId, onCreatePromo, onEditPromo, onImportProduct }: { branchId: string; onCreatePromo: () => void; onEditPromo: (promo: CatalogueOffer) => void; onImportProduct: (product: CatalogueItem) => void }) {
    const { data: promotions, isLoading, isError, error, refetch } = useCatalogueOffersAdmin({ branchId });
    const { data: catalogueItems = [] } = useCatalogueItems({ branchId });
    const updateOffer = useUpdateCatalogueOffer();
    const deleteOffer = useDeleteCatalogueOffer();
    const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'expired' | 'inactive'>('active');
    const [itemTypeFilter, setItemTypeFilter] = useState<'all' | 'product' | 'service'>('all');
    const [showImportModal, setShowImportModal] = useState(false);
    const [importSearch, setImportSearch] = useState('');

    const isExpired = (promo: CatalogueOffer) => {
        if (!promo.endDate) return false;
        return new Date(promo.endDate) < new Date();
    };

    const filteredPromotions = React.useMemo(() => {
        if (!promotions) return [];
        let filtered = promotions;
        
        // Status filter
        switch (statusFilter) {
            case 'active':
                filtered = filtered.filter((p) => !isExpired(p) && p.status === 'active');
                break;
            case 'expired':
                filtered = filtered.filter((p) => isExpired(p));
                break;
            case 'inactive':
                filtered = filtered.filter((p) => p.status === 'inactive' && !isExpired(p));
                break;
            case 'all':
            default:
                break;
        }

        // Item type filter
        if (itemTypeFilter !== 'all') {
            filtered = filtered.filter((p) => {
                const items = p.items || [];
                if (itemTypeFilter === 'service') {
                    return items.some((item: any) => item.itemType === 'service');
                } else {
                    return items.some((item: any) => (item.itemType || 'product') === 'product');
                }
            });
        }

        return filtered;
    }, [promotions, statusFilter, itemTypeFilter]);

    const statusCounts = React.useMemo(() => {
        if (!promotions) return { active: 0, expired: 0, inactive: 0, all: 0 };
        let active = 0, expired = 0, inactive = 0;
        for (const p of promotions) {
            if (isExpired(p)) expired++;
            else if (p.status === 'inactive') inactive++;
            else active++;
        }
        return { active, expired, inactive, all: promotions.length };
    }, [promotions]);

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

    if (isLoading) {
        return (
            <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                    <div className="h-5 md:h-7 w-28 md:w-40 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-9 md:h-10 w-20 md:w-44 bg-gray-100 rounded-full animate-pulse"></div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-5">
                    {[1, 2, 3, 4].map(i => <div key={i} className="aspect-square bg-gray-50 rounded-xl md:rounded-2xl animate-pulse"></div>)}
                </div>
            </div>
        );
    }

    if (isError) {
        return <ErrorState message={error?.message || 'Failed to load deals'} onRetry={() => refetch()} />;
    }

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800">My Deals</h3>
                <div className="flex items-center gap-2">
                    <Button 
                        onClick={() => setShowImportModal(true)} 
                        variant="outline"
                        className="rounded-full font-bold gap-1.5 md:gap-2 text-xs md:text-sm h-9 md:h-10 px-3 md:px-4 border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                        <Flame size={14} /> <span className="hidden sm:inline">Import Product</span><span className="sm:hidden">Import</span>
                    </Button>
                    <Button onClick={onCreatePromo} className="rounded-full font-bold gap-1.5 md:gap-2 text-xs md:text-sm h-9 md:h-10 px-3 md:px-4">
                        <Plus size={14} /> <span className="hidden sm:inline">Create Deal</span><span className="sm:hidden">New</span>
                    </Button>
                </div>
            </div>

            {promotions && promotions.length > 0 && (
                <div className="flex items-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-white border border-gray-200 hover:border-gray-300 transition-all">
                                <span className="text-gray-500">Status:</span>
                                <span className="text-gray-800">{statusFilter === 'active' ? 'Active' : statusFilter === 'all' ? 'All' : statusFilter === 'expired' ? 'Expired' : 'Paused'}</span>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><polyline points="6 9 12 15 18 9"/></svg>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-[140px]">
                            {[
                                { key: 'active' as const, label: 'Active', count: statusCounts.active },
                                { key: 'all' as const, label: 'All', count: statusCounts.all },
                                { key: 'expired' as const, label: 'Expired', count: statusCounts.expired },
                                { key: 'inactive' as const, label: 'Paused', count: statusCounts.inactive },
                            ].map((tab) => (
                                <DropdownMenuItem key={tab.key} onClick={() => setStatusFilter(tab.key)}>
                                    <span className="flex-1">{tab.label}</span>
                                    <span className="text-[10px] font-black text-gray-400">{tab.count}</span>
                                    {statusFilter === tab.key && <span className="text-primary">✓</span>}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-white border border-gray-200 hover:border-gray-300 transition-all">
                                <span className="text-gray-500">Type:</span>
                                <span className="text-gray-800">{itemTypeFilter === 'all' ? 'All' : itemTypeFilter === 'product' ? 'Products' : 'Services'}</span>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><polyline points="6 9 12 15 18 9"/></svg>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-[140px]">
                            {[
                                { key: 'all' as const, label: 'All Types' },
                                { key: 'product' as const, label: 'Has Products' },
                                { key: 'service' as const, label: 'Has Services' },
                            ].map((tab) => (
                                <DropdownMenuItem key={tab.key} onClick={() => setItemTypeFilter(tab.key)}>
                                    <span className="flex-1">{tab.label}</span>
                                    {itemTypeFilter === tab.key && <span className="text-primary">✓</span>}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}

            {!promotions || promotions.length === 0 ? (
                <EmptyState icon={Tag} title="Your first deal is ready to launch" description="Create a deal to attract new customers and bring them back again." />
            ) : filteredPromotions.length === 0 ? (
                <EmptyState
                    icon={Tag}
                    title={`No ${statusFilter === 'all' ? '' : statusFilter === 'active' ? 'active ' : statusFilter === 'expired' ? 'expired ' : 'paused '}deals found`}
                    description="Try a different filter or create a new deal."
                />
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-5">
                    {filteredPromotions.map((promo) => {
                        const expired = isExpired(promo);
                        const claimedCount = (promo as any).claimedCount ?? 0;
                        const maxClaims = promo.quantity ?? 0;
                        const discountPercent = promo.pricingType === 'percentage_discount' ? (promo.discountValue ?? 0) : undefined;
                        const discountAmount = promo.pricingType === 'fixed_discount_price' ? (promo.discountValue ?? 0) : undefined;
                        const calcPrice = Number(promo.fixedPrice) || Number(promo.calculatedPrice) || 0;
                        const originalPrice = discountPercent && discountPercent > 0
                            ? Math.round(calcPrice / (1 - discountPercent / 100))
                            : discountAmount && discountAmount > 0
                                ? calcPrice + discountAmount
                                : calcPrice;
                        const dealPrice = Number(promo.fixedPrice) || Number(promo.calculatedPrice) || 0;
                        const daysLeft = promo.endDate ? getPromoDaysLeft(promo.endDate) : 0;
                        const claimPct = maxClaims > 0 ? Math.min((claimedCount / maxClaims) * 100, 100) : 0;
                        const isStarSeller = claimedCount >= 5;

                        return (
                            <div key={promo.id} className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-primary/20 hover:shadow-lg transition-all duration-300 flex flex-col">
                                {/* Image */}
                                <div className="relative aspect-square overflow-hidden bg-gray-50">
                                    {promo.mainImage ? (
                                        <img
                                            src={promo.mainImage}
                                            alt={promo.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                                            <span className="text-3xl font-headline font-bold text-gray-200">
                                                {promo.name.charAt(0)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Deal badge — top left */}
                                    {(discountPercent || discountAmount) && (
                                        <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 bg-primary text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm">
                                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                                            Deal
                                        </span>
                                    )}

                                    {/* Status badge — top right */}
                                    {expired ? (
                                        <span className="absolute top-2.5 right-2.5 bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
                                            Expired
                                        </span>
                                    ) : promo.status === 'inactive' ? (
                                        <span className="absolute top-2.5 right-2.5 bg-gray-400 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
                                            Paused
                                        </span>
                                    ) : null}
                                </div>

                                {/* Content */}
                                <div className="p-2 md:p-3 space-y-1.5 md:space-y-2 flex-1">
                                    <h3 className="font-semibold text-gray-800 text-[13px] leading-snug line-clamp-2 min-h-[2.5rem]">
                                        {promo.name}
                                    </h3>

                                    {/* Price row */}
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                        <span className="text-[15px] font-black text-primary tracking-tight">
                                            {formatCurrency(dealPrice)}
                                        </span>
                                        {originalPrice > dealPrice && (
                                            <span className="text-[11px] text-gray-400 line-through font-medium">
                                                {formatCurrency(originalPrice)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Days left */}
                                    {promo.endDate && (
                                        <div className="flex items-center gap-1">
                                            <Clock size={10} className="text-primary/60" />
                                            <span className="text-[10px] font-bold">
                                                <DaysLeftLabel daysLeft={daysLeft} />
                                            </span>
                                        </div>
                                    )}

                                    {/* Claims */}
                                    {maxClaims > 0 && (
                                        <div className="space-y-1">
                                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${claimPct}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-0.5">
                                                    <span className="text-orange-400">🔥</span>
                                                    {claimedCount > 1
                                                        ? `${claimedCount >= 1000
                                                            ? `${(claimedCount / 1000).toFixed(0)}K`
                                                            : claimedCount}+`
                                                        : claimedCount}{' '}
                                                    claimed
                                                </span>
                                                <span className="text-[10px] font-bold text-amber-500">
                                                    {Math.round(claimPct)}%
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-1 pt-1">
                                        <div className="text-center">
                                            <div className="text-[10px] font-bold text-gray-800">{(promo as any).views ?? '—'}</div>
                                            <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Views</div>
                                        </div>
                                        <div className="text-center border-x border-gray-100">
                                            <div className="text-[10px] font-bold text-gray-800">{(promo as any).visits ?? '—'}</div>
                                            <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Visits</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[10px] font-bold text-emerald-600">{formatCurrency((promo as any).revenue ?? 0)}</div>
                                            <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Revenue</div>
                                        </div>
                                    </div>

                                    {/* Star seller */}
                                    {isStarSeller && (
                                        <div className="flex items-center gap-1 pt-0.5">
                                            <BadgeCheck size={12} className="text-primary fill-primary/10" />
                                            <span className="text-[10px] font-bold text-primary">Star seller</span>
                                        </div>
                                    )}

                                    {/* Engagement stats */}
                                    <DealEngagementBadge offerId={promo.id} />
                                </div>

                                {/* Admin actions */}
                                <div className="p-2 md:p-3 pt-0 space-y-1.5 md:space-y-2">
                                    <div className="flex gap-1.5 md:gap-2">
                                        <Button variant="outline" className="flex-1 min-w-0 rounded-xl font-bold text-[10px] md:text-xs h-8 md:h-9 px-1.5 md:px-2" onClick={() => onEditPromo(promo)}>
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 min-w-0 rounded-xl font-bold text-[10px] md:text-xs h-8 md:h-9 px-1.5 md:px-2"
                                            onClick={() => handleToggleStatus(promo)}
                                            disabled={updateOffer.isPending || expired}
                                        >
                                            {promo.status === 'active' ? 'Pause' : 'Resume'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="min-w-0 rounded-xl px-2 md:px-3 h-8 md:h-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDelete(promo)}
                                            disabled={deleteOffer.isPending}
                                        >
                                            <X size={13} />
                                        </Button>
                                    </div>
                                    <Button
                                        asChild
                                        className="w-full rounded-xl font-bold text-[10px] md:text-xs h-8 md:h-9 transition-colors"
                                    >
                                        <Link href={`/promotions/${promo.id}`} className="flex items-center justify-center gap-2">
                                            <ArrowRight size={13} className="text-[#066CF4]" />
                                            View Deal on Site
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Import Product Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowImportModal(false)} className="absolute inset-0 bg-black/50" />
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-3xl overflow-hidden relative shadow-2xl z-10">
                        <div className="p-6 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Import a Product</h3>
                                    <p className="text-xs text-slate-500 mt-1">Select a product to turn into a deal</p>
                                </div>
                                <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={importSearch}
                                    onChange={(e) => setImportSearch(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                            <div className="max-h-80 overflow-y-auto space-y-2">
                                {catalogueItems
                                    .filter(item => (item.itemType || 'product') === 'product')
                                    .filter(item => item.name.toLowerCase().includes(importSearch.toLowerCase()))
                                    .map(item => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => {
                                                onImportProduct(item);
                                                setShowImportModal(false);
                                            }}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all text-left"
                                        >
                                            <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                                                {item.mainImage ? (
                                                    <img src={item.mainImage} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ShoppingBag size={18} className="text-slate-300" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                                                <p className="text-xs text-slate-500">₦{Number(item.price).toLocaleString()}</p>
                                            </div>
                                            <Flame size={16} className="text-amber-500" />
                                        </button>
                                    ))}
                                {catalogueItems.filter(item => (item.itemType || 'product') === 'product').length === 0 && (
                                    <div className="py-8 text-center text-slate-400">
                                        <ShoppingBag size={24} className="mx-auto mb-2" />
                                        <p className="text-sm">No products found. Add products first.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
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
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 md:p-8 min-h-[600px] animate-in slide-in-from-right-8 duration-300">
            <div className="flex items-center justify-between mb-4 md:mb-8 pb-4 md:pb-6 border-b border-gray-50">
                <div>
                    <h2 className="text-lg md:text-2xl font-semibold text-gray-800">{isEditing ? 'Edit Deal' : 'Create Deal'}</h2>
                    <div className="text-xs md:text-sm font-bold text-gray-400 mt-0.5 md:mt-1">Step {step} of 5</div>
                </div>
                <Button variant="ghost" onClick={onCancel} className="text-gray-400 hover:text-gray-800 rounded-full size-9 md:size-10 p-0"><X size={18} /></Button>
            </div>

            <div className="max-w-xl mx-auto pt-2 md:pt-8">
                {step === 1 && (
                    <div className="space-y-4 md:space-y-6 animate-in fade-in">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-800 text-center mb-4 md:mb-8">What are you offering?</h3>
                        <div className="grid grid-cols-1 gap-2.5 md:gap-4">
                            {[
                                { label: 'Discount', value: 'discount', description: 'Offer a percentage or fixed amount off your products' },
                                { label: 'Free Item', value: 'free_item', description: 'Give away a free item with purchase to attract new customers' },
                                { label: 'Special Deal', value: 'special_deal', description: 'Set an original price and a discounted deal price' },
                                { label: 'Free Delivery', value: 'free_delivery', description: 'Offer free delivery on orders above a minimum amount' },
                                { label: 'Custom Offer', value: 'custom', description: 'Create a custom offer with your own terms' }
                            ].map((offer, i) => (
                                <button key={i} onClick={() => { setOfferType(offer.value); }} className={cn("w-full p-3.5 md:p-6 text-left border-2 rounded-xl md:rounded-2xl transition-all group flex items-center justify-between", offerType === offer.value ? "border-primary bg-blue-50" : "border-gray-100 hover:border-primary hover:bg-blue-50")}>
                                    <div>
                                        <span className={cn("text-sm md:text-lg transition-all", offerType === offer.value ? "text-primary font-bold" : "font-semibold text-gray-700 group-hover:text-primary")}>{offer.label}</span>
                                        <p className="text-xs md:text-sm text-gray-400 mt-0.5 md:mt-1">{offer.description}</p>
                                    </div>
                                    <div className={cn("size-6 md:size-7 rounded-full border-2 flex items-center justify-center shrink-0", offerType === offer.value ? "border-primary bg-primary text-white" : "border-gray-300 group-hover:border-primary")}>
                                        {offerType === offer.value && <CheckCircle2 size={12} />}
                                    </div>
                                </button>
                            ))}
                        </div>
                        {offerType && (
                            <div className="flex justify-center pt-2 md:pt-4">
                                <Button onClick={() => setStep(2)} className="w-full md:w-auto rounded-full px-10 font-bold">
                                    Continue <ArrowRight size={16} className="ml-2" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 md:space-y-6 animate-in fade-in">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 md:mb-6">Deal Details</h3>
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
                        <div className="flex justify-between pt-4 md:pt-6">
                            <Button variant="ghost" onClick={() => { setStep(1); resetTypeFields(); }} className="font-bold text-xs md:text-sm">Back</Button>
                            <Button onClick={() => setStep(3)} disabled={!title} className="rounded-full px-6 md:px-8 font-bold text-xs md:text-sm">Next</Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4 md:space-y-6 animate-in fade-in">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-800 text-center mb-4 md:mb-8">Show this deal to:</h3>
                        <div className="grid grid-cols-1 gap-2.5 md:gap-4">
                            {[
                                { label: 'Nearby Customers', value: 'nearby_customers' },
                                { label: 'Nearby Businesses', value: 'nearby_businesses' },
                                { label: 'Everyone Nearby', value: 'everyone_nearby' }
                            ].map((item, i) => (
                                <button key={i} onClick={() => { setAudience(item.value); setStep(4); }} className="w-full p-3.5 md:p-6 text-left border-2 border-gray-100 rounded-xl md:rounded-2xl hover:border-primary hover:bg-blue-50 transition-all group flex items-center justify-between">
                                    <span className="font-semibold text-gray-700 group-hover:text-primary text-sm md:text-lg">{item.label}</span>
                                    <ChevronRight className="text-gray-300 group-hover:text-primary" size={18} />
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between pt-4 md:pt-6">
                            <Button variant="ghost" onClick={() => setStep(2)} className="font-bold text-xs md:text-sm">Back</Button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-4 md:space-y-6 animate-in fade-in">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 md:mb-6 text-center">Preview your Deal</h3>

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

                        <div className="flex justify-between pt-4 md:pt-8">
                            <Button variant="ghost" onClick={() => setStep(3)} className="font-bold text-xs md:text-sm">Back</Button>
                            <Button onClick={() => setStep(5)} className="rounded-full px-6 md:px-8 font-bold text-xs md:text-sm">Looks Good</Button>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-4 md:space-y-6 animate-in fade-in text-center">
                        <div className="size-16 md:size-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-1.5 md:mb-2">{isEditing ? 'Ready to Update!' : 'Ready to Publish!'}</h3>
                        <p className="text-gray-500 text-xs md:text-sm mb-4 md:mb-6 max-w-md mx-auto">{isEditing ? 'Your deal changes will be saved and immediately visible to customers and businesses nearby.' : 'Your deal will immediately be visible to customers and businesses nearby.'}</p>

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

                        <div className="flex items-center justify-center gap-3 md:gap-4 mt-4 md:mt-6">
                            <Button variant="ghost" onClick={() => setStep(4)} className="font-bold text-xs md:text-sm">Back</Button>
                            <Button
                                onClick={handlePublish}
                                className="rounded-full px-8 md:px-12 py-4 md:py-6 text-sm md:text-lg font-bold bg-primary hover:bg-primary/90"
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
