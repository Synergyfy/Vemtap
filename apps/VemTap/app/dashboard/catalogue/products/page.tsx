'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import EmptyState from '@/components/dashboard/EmptyState';
import { Plus, Edit2, Trash2, Search, Filter, Image as ImageIcon, Box, Cog } from 'lucide-react';
import { useCatalogueItems, useDeleteCatalogueItem, CatalogueItem, useCatalogueCategories, Category } from '@/services/catalogue/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import toast from 'react-hot-toast';
import ProductModal from '@/components/dashboard/catalogue/ProductModal';

import { useRouter } from 'next/navigation';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';
import UsageIndicator from '@/components/dashboard/UsageIndicator';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';

export default function ProductsPage() {
    const { activeBranchId } = useActiveBranch();
    const router = useRouter();
    const { capabilities } = useSubscriptionStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    
    const { data: items = [], isLoading } = useCatalogueItems({ 
        branchId: activeBranchId || '', 
        categoryId: selectedCategoryId,
        search: searchQuery 
    });
    const { data: categories = [] } = useCatalogueCategories();
    
    const deleteMutation = useDeleteCatalogueItem();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<CatalogueItem | null>(null);

    const handleEdit = (e: React.MouseEvent, product: CatalogueItem) => {
        e.stopPropagation();
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteMutation.mutateAsync({ id, params: { branchId: activeBranchId! } });
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

    const handleRowClick = (item: CatalogueItem) => {
        router.push(`/dashboard/catalogue/products/${item.id}`);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': 
                return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit">ACTIVE</span>;
            case 'inactive': 
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit">INACTIVE</span>;
            case 'out_of_stock': 
                return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit">OUT OF STOCK</span>;
            case 'suspended': 
                return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit">SUSPENDED</span>;
            default: 
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-black uppercase tracking-wider w-fit">{status.toUpperCase()}</span>;
        }
    };

    const calculateDiscountedPrice = (item: CatalogueItem) => {
        if (!item.discountType || item.discountType === 'none' || !item.discountValue) return null;
        if (item.discountType === 'percentage') {
            return Number(item.price) - (Number(item.price) * (Number(item.discountValue) / 100));
        }
        return Number(item.discountValue);
    };

    const columns: Column<CatalogueItem>[] = [
        {
            header: 'Product',
            accessor: (item: CatalogueItem) => (
                <div className="flex items-center gap-3">
                    {item.mainImage ? (
                        <img src={item.mainImage} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                            <ImageIcon size={20} />
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-1.5">
                            <p className="font-bold text-text-main group-hover:text-primary transition-colors">{item.name}</p>
                            {item.itemType === 'service' ? (
                                <span className="p-1 bg-blue-50 text-blue-600 rounded-md" title="Service">
                                    <Cog size={10} />
                                </span>
                            ) : (
                                <span className="p-1 bg-amber-50 text-amber-600 rounded-md" title="Product">
                                    <Box size={10} />
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-text-secondary font-black uppercase tracking-tighter">{item.sku || 'NO SKU'}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Category',
            accessor: (item: CatalogueItem) => (
                <span className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-text-main">
                    {item.category?.name || 'Uncategorized'}
                </span>
            )
        },
        {
            header: 'Price',
            accessor: (item: CatalogueItem) => {
                const discountedPrice = calculateDiscountedPrice(item);
                return (
                    <div className="flex flex-col">
                        {discountedPrice ? (
                            <>
                                <span className="text-xs text-text-secondary line-through">₦{Number(item.price).toLocaleString()}</span>
                                <span className="font-black text-primary">₦{discountedPrice.toLocaleString()}</span>
                            </>
                        ) : (
                            <span className="font-black text-text-main">₦{Number(item.price).toLocaleString()}</span>
                        )}
                    </div>
                );
            }
        },
        {
            header: 'Status',
            accessor: (item: CatalogueItem) => getStatusBadge(item.status)
        },
        {
            header: 'Stock',
            accessor: (item: CatalogueItem) => (
                <div className="flex flex-col">
                    {item.itemType === 'product' ? (
                        <>
                            <span className={`text-xs font-black ${(item.stockQuantity ?? 0) <= 5 ? 'text-red-500' : 'text-text-main'}`}>
                                {item.stockQuantity ?? 0} In Stock
                            </span>
                            {item.allowBackOrder && (
                                <span className="text-[9px] text-emerald-600 font-black uppercase tracking-tighter">Backorder</span>
                            )}
                        </>
                    ) : (
                        <span className="text-[10px] text-text-secondary font-black uppercase tracking-widest">N/A (Service)</span>
                    )}
                </div>
            )
        },
        {
            header: 'Created',
            accessor: (item: CatalogueItem) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-text-main">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                    <span className="text-[10px] text-text-secondary font-medium uppercase">
                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                </div>
            )
        },
        {
            header: 'Actions',
            accessor: (item: CatalogueItem) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => handleEdit(e, item)}
                        className="p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all cursor-pointer"
                        title="Edit"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={(e) => handleDelete(e, item.id)}
                        className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <PageLockWrapper feature="catalogue" featureName="Catalogue">
            <div className="p-4 md:p-8">
                <div className="mb-6">
                    <UsageIndicator
                        label="Products Limit"
                        usage={capabilities?.capabilities?.catalogueItems}
                        icon={<Box size={18} />}
                    />
                </div>

                <PageHeader
                title="Products & Menu"
                description="Manage your items and their availability"
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

            <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-5 font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    className="h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-text-main outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {categories.map((cat: Category) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            <DataTable
                columns={columns}
                data={items}
                isLoading={isLoading}
                onRowClick={handleRowClick}
                emptyState={
                    <EmptyState
                        icon="layout"
                        title="No products found"
                        description="Start by adding items to your menu."
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
