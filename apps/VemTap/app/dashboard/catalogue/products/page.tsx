'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import EmptyState from '@/components/dashboard/EmptyState';
import { Plus, Edit2, Trash2, Search, ShoppingBag, Eye, LayoutGrid, Coins, AlertCircle } from 'lucide-react';
import { useCatalogueItems, useDeleteCatalogueItem, CatalogueItem } from '@/services/catalogue/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import toast from 'react-hot-toast';
import ProductModal from '@/components/dashboard/catalogue/ProductModal';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';
import UsageIndicator from '@/components/dashboard/UsageIndicator';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function ProductsPage() {
    const router = useRouter();
    const { activeBranchId } = useActiveBranch();
    const { capabilities } = useSubscriptionStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');
    
    const { data: items = [], isLoading } = useCatalogueItems({ 
        branchId: activeBranchId || undefined 
    });

    const deleteMutation = useDeleteCatalogueItem();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<CatalogueItem | null>(null);

    const handleEdit = (e: React.MouseEvent, item: CatalogueItem) => {
        e.stopPropagation();
        setSelectedProduct(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (e: React.MouseEvent, item: CatalogueItem) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
            try {
                await deleteMutation.mutateAsync({ 
                    id: item.id, 
                    params: { branchId: activeBranchId || '', applyGlobally: false } 
                });
                toast.success('Product deleted successfully');
            } catch (error) {
                toast.error('Failed to delete product');
            }
        }
    };

    const handleAdd = () => {
        setSelectedProduct(null);
        setIsModalOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': 
                return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-wider w-fit">ACTIVE</span>;
            case 'inactive': 
                return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-wider w-fit">INACTIVE</span>;
            case 'out_of_stock': 
                return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-wider w-fit">OUT OF STOCK</span>;
            case 'suspended': 
                return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-[9px] font-black uppercase tracking-wider w-fit">SUSPENDED</span>;
            default: 
                return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-wider w-fit">{status?.toUpperCase()}</span>;
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = activeCategory === 'all' || item.categoryId === activeCategory;
        return matchesSearch && matchesCategory;
    });

    // Extract unique categories from items for simple filtering
    const categories = Array.from(new Map(
        items.filter(item => item.category).map(item => [item.category?.id, item.category])
    ).values());

    const columns: Column<CatalogueItem>[] = [
        {
            header: 'Product',
            accessor: (item: CatalogueItem) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                        {item.mainImage ? (
                            <img src={item.mainImage} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                            <ShoppingBag className="text-slate-300" size={18} />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-text-main truncate max-w-[220px]">{item.name}</p>
                        <p className="text-[10px] text-text-secondary truncate max-w-[220px]">{item.shortDescription}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Category',
            accessor: (item: CatalogueItem) => (
                <span className="text-xs font-bold text-text-main">
                    {item.category?.name || 'Uncategorized'}
                </span>
            )
        },
        {
            header: 'Price',
            accessor: (item: CatalogueItem) => {
                const hasDiscount = item.discountType && item.discountType !== 'none' && item.discountValue;
                const finalPrice = hasDiscount
                    ? (item.discountType === 'percentage'
                        ? Number(item.price) - (Number(item.price) * (Number(item.discountValue) / 100))
                        : Number(item.discountValue))
                    : Number(item.price);
                return (
                    <div className="flex flex-col">
                        <span className="font-black text-primary text-sm">₦{finalPrice.toLocaleString()}</span>
                        {hasDiscount && (
                            <span className="text-[9px] text-text-secondary line-through font-bold">₦{Number(item.price).toLocaleString()}</span>
                        )}
                    </div>
                );
            }
        },
        {
            header: 'Stock',
            accessor: (item: CatalogueItem) => (
                <span className={cn(
                    "text-xs font-bold",
                    item.itemType === 'service' ? "text-text-secondary italic" : ((item.stockQuantity || 0) <= (item.minStock || 5) ? "text-red-500 font-black" : "text-text-main")
                )}>
                    {item.itemType === 'service' ? 'Service' : `${item.stockQuantity ?? 0} units`}
                </span>
            )
        },
        {
            header: 'Loyalty Points',
            accessor: (item: CatalogueItem) => (
                <div className="flex items-center gap-1.5 text-amber-600 font-bold">
                    <Coins size={12} />
                    <span className="text-xs">{item.loyaltyPoints || 0} pts</span>
                </div>
            )
        },
        {
            header: 'Status',
            accessor: (item: CatalogueItem) => getStatusBadge(item.status)
        },
        {
            header: 'Actions',
            accessor: (item: CatalogueItem) => (
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => router.push(`/dashboard/catalogue/products/${item.id}`)}
                        className="p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all cursor-pointer"
                        title="View Details"
                    >
                        <Eye size={15} />
                    </button>
                    <button
                        onClick={(e) => handleEdit(e, item)}
                        className="p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all cursor-pointer"
                        title="Edit"
                    >
                        <Edit2 size={15} />
                    </button>
                    <button
                        onClick={(e) => handleDelete(e, item)}
                        className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="Delete"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <PageLockWrapper feature="catalogue" featureName="Catalogue">
            <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
                <div>
                    <UsageIndicator
                        label="Products Limit"
                        usage={capabilities?.capabilities?.catalogueItems}
                        icon={<ShoppingBag size={18} />}
                    />
                </div>

                <PageHeader
                    title="Products & Services"
                    description="Configure your active menu and services"
                    isSticky={false}
                    actions={
                        <button 
                            onClick={handleAdd} 
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm shadow-lg shadow-primary/20 cursor-pointer"
                        >
                            <Plus size={18} />
                            Add Product
                        </button>
                    }
                />

                <div className="bg-white rounded-2xl p-6 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative max-w-md flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search products by name or SKU..."
                            className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-5 font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm text-slate-900"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border cursor-pointer",
                                activeCategory === 'all'
                                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                    : "bg-white text-slate-600 border-slate-100 hover:border-slate-300"
                            )}
                        >
                            All Categories
                        </button>
                        {categories.map((cat: any) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border cursor-pointer",
                                    activeCategory === cat.id
                                        ? "bg-primary text-white border-primary shadow-sm"
                                        : "bg-white text-slate-600 border-slate-100 hover:border-slate-300"
                                )}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredItems}
                    isLoading={isLoading}
                    emptyState={
                        <EmptyState
                            icon="shopping-bag"
                            title="Your catalogue is ready for its first product"
                            description="List your products so customers can discover what you offer."
                        />
                    }
                />

                <ProductModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    product={selectedProduct}
                    activeBranchId={activeBranchId || undefined}
                />
            </div>
        </PageLockWrapper>
    );
}
