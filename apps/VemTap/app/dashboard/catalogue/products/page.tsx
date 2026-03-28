'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import EmptyState from '@/components/dashboard/EmptyState';
import { Plus, Edit2, Trash2, Search, Filter, Image as ImageIcon } from 'lucide-react';
import { useCatalogueItems, useDeleteCatalogueItem, CatalogueItem, useCatalogueCategories } from '@/services/catalogue/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import toast from 'react-hot-toast';
import ProductModal from '@/components/dashboard/catalogue/ProductModal';

import { useRouter } from 'next/navigation';

export default function ProductsPage() {
    const { activeBranchId } = useActiveBranch();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    
    const { data: items = [], isLoading } = useCatalogueItems({ 
        branchId: activeBranchId, 
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
                        <p className="font-bold text-text-main group-hover:text-primary transition-colors">{item.name}</p>
                        <p className="text-[10px] text-text-secondary uppercase">{item.category?.name || 'Uncategorized'}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Price',
            accessor: (item: CatalogueItem) => (
                <span className="font-medium">₦{item.price.toLocaleString()}</span>
            )
        },
        {
            header: 'Stock',
            accessor: (item: CatalogueItem) => (
                <div className="flex flex-col">
                    <span className={`font-medium ${item.stockQuantity <= 5 ? 'text-red-500' : 'text-text-main'}`}>
                        {item.stockQuantity} in stock
                    </span>
                    {item.allowBackOrder && (
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">Backorder enabled</span>
                    )}
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
        <div className="p-4 md:p-8">
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
                    {categories.map((cat: any) => (
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
    );
}
