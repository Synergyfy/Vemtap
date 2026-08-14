'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCatalogueItem, useDeleteCatalogueItem, CatalogueItem } from '@/services/catalogue/hooks';
import PageHeader from '@/components/dashboard/PageHeader';
import { 
    ChevronLeft, Edit2, Trash2, Package, Tag, 
    Layers, ShoppingBag, Info, CheckCircle2, XCircle, Clock, Percent, Box, Cog, Coins
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ProductModal from '@/components/dashboard/catalogue/ProductModal';
import toast from 'react-hot-toast';
import { useActiveBranch } from '@/hooks/useActiveBranch';

export default function ProductDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { activeBranchId } = useActiveBranch();
    const { data: item, isLoading } = useCatalogueItem(id as string, activeBranchId || undefined);
    const deleteMutation = useDeleteCatalogueItem();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!item) {
        return (
            <div className="p-8 text-center">
                <p className="text-text-secondary font-bold">Product not found</p>
                <button 
                    onClick={() => router.back()}
                    className="mt-4 text-primary font-black uppercase text-xs tracking-widest"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteMutation.mutateAsync({ id: item.id, params: { branchId: activeBranchId! } });
                toast.success('Product deleted successfully');
                router.push('/dashboard/catalogue/products');
            } catch (error) {
                toast.error('Failed to delete product');
            }
        }
    };

    const calculateDiscountedPrice = (item: CatalogueItem) => {
        if (!item.discountType || item.discountType === 'none' || !item.discountValue) return null;
        if (item.discountType === 'percentage') {
            return Number(item.price) - (Number(item.price) * (Number(item.discountValue) / 100));
        }
        return Number(item.price) - Number(item.discountValue);
    };

    const discountedPrice = calculateDiscountedPrice(item);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': 
                return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 w-fit"><CheckCircle2 size={12}/> ACTIVE</span>;
            case 'inactive': 
                return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 w-fit"><XCircle size={12}/> INACTIVE</span>;
            case 'out_of_stock': 
                return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 w-fit"><Clock size={12}/> OUT OF STOCK</span>;
            case 'suspended': 
                return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 w-fit"><XCircle size={12}/> SUSPENDED</span>;
            default: 
                return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-[10px] font-semibold uppercase tracking-wider w-fit">{status.toUpperCase()}</span>;
        }
    };

    return (
        <div className="p-4 md:p-8">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-6 font-bold text-sm"
            >
                <ChevronLeft size={18} />
                Back to Products
            </button>

            <PageHeader
                title={item.name}
                description={item.shortDescription}
                actions={
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsEditModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-text-main font-bold rounded-xl hover:bg-gray-50 transition-all text-sm shadow-sm cursor-pointer"
                        >
                            <Edit2 size={18} />
                            Edit Product
                        </button>
                        <button 
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all text-sm shadow-sm cursor-pointer"
                        >
                            <Trash2 size={18} />
                            Delete
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* Left Column: Media */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                            <img 
                                src={item.mainImage} 
                                alt={item.name} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {item.galleryImages && item.galleryImages.length > 0 && (
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Gallery</h4>
                            <div className="grid grid-cols-3 gap-3">
                                {item.galleryImages.map((img: string, idx: number) => (
                                    <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-gray-50">
                                        <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Details */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1">Pricing</p>
                                {discountedPrice ? (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-2xl md:text-3xl font-bold text-primary">₦{discountedPrice.toLocaleString()}</h3>
                                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-semibold">
                                                {item.discountType === 'percentage' ? `${item.discountValue}% OFF` : 'SPECIAL PRICE'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-text-secondary font-bold line-through">₦{Number(item.price).toLocaleString()}</p>
                                    </div>
                                ) : (
                                    <h3 className="text-2xl md:text-3xl font-bold text-text-main">₦{Number(item.price).toLocaleString()}</h3>
                                )}
                            </div>
                            <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                                <span className="text-xs font-bold text-text-secondary">Current Status</span>
                                {getStatusBadge(item.status)}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-4">Inventory &amp; Logistics</p>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Package size={16} />
                                        </div>
                                        <span className="text-sm font-bold text-text-main">Stock Level</span>
                                    </div>
                                    <span className={cn(
                                        "text-sm font-bold",
                                        item.itemType === 'service' ? "text-text-secondary" : ((item.stockQuantity || 0) <= 5 ? "text-red-500" : "text-text-main")
                                    )}>
                                        {item.itemType === 'service' ? 'N/A' : `${item.stockQuantity} Units`}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                                            <Tag size={16} />
                                        </div>
                                        <span className="text-sm font-bold text-text-main">SKU / Code</span>
                                    </div>
                                    <span className="text-sm font-bold text-text-secondary">
                                        {item.sku || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                            <ShoppingBag size={16} />
                                        </div>
                                        <span className="text-sm font-bold text-text-main">Backorders</span>
                                    </div>
                                    <span className={cn(
                                         "text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-lg",
                                         item.itemType === 'service' ? "bg-gray-50 text-text-secondary" : (item.allowBackOrder ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-text-secondary")
                                     )}>
                                         {item.itemType === 'service' ? 'N/A' : (item.allowBackOrder ? 'ENABLED' : 'DISABLED')}
                                     </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600">
                                            <Coins size={16} />
                                        </div>
                                        <span className="text-sm font-bold text-text-main">Loyalty Points</span>
                                    </div>
                                    <span className="text-sm font-bold text-text-main">
                                        {item.loyaltyPoints || 0} Points
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <Info size={18} className="text-primary" />
                            <h4 className="text-sm font-bold text-text-main uppercase tracking-wider">Product Information</h4>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider block mb-2">Category</label>
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl w-fit border border-gray-100">
                                    <Layers size={14} className="text-primary" />
                                    <span className="text-sm font-bold text-text-main">{item.category?.name || 'Uncategorized'}</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider block mb-2">Full Description</label>
                                <p className="text-sm text-text-secondary leading-relaxed font-medium">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ProductModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                product={item as any}
                activeBranchId={activeBranchId || undefined}
            />
        </div>
    );
}
