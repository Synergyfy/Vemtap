'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import EmptyState from '@/components/dashboard/EmptyState';
import { Plus, Edit2, Trash2, Search, ShoppingBag, Eye, Coins, MoreVertical, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useCatalogueItems, useDeleteCatalogueItem, CatalogueItem } from '@/services/catalogue/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import toast from 'react-hot-toast';
import ProductModal from '@/components/dashboard/catalogue/ProductModal';
import AddProductMethodModal from '@/components/dashboard/catalogue/AddProductMethodModal';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function ProductsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { activeBranchId } = useActiveBranch();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
    const perPage = 10;
    
    const { data: items = [], isLoading } = useCatalogueItems({ 
        branchId: activeBranchId || undefined 
    });

    const deleteMutation = useDeleteCatalogueItem();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMethodOpen, setIsMethodOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<CatalogueItem | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    useEffect(() => {
        if (searchParams?.get('action') === 'add' || searchParams?.get('add') === 'true') {
            setIsMethodOpen(true);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!openMenuId) return;
        const handler = () => setOpenMenuId(null);
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [openMenuId]);

    const toggleMenu = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenMenuId(prev => (prev === id ? null : id));
    };

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
        if (activeTab === 'services') {
            setSelectedProduct(null);
            setIsModalOpen(true);
        } else {
            setIsMethodOpen(true);
        }
    };

    const handleSelectMethod = (method: 'manual' | 'bulk' | 'barcode') => {
        setIsMethodOpen(false);
        if (method === 'bulk') {
            router.push('/dashboard/catalogue/import');
            return;
        }
        setSelectedProduct(null);
        setIsModalOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': 
                return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-semibold uppercase tracking-wider w-fit">ACTIVE</span>;
            case 'inactive': 
                return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[9px] font-semibold uppercase tracking-wider w-fit">INACTIVE</span>;
            case 'out_of_stock': 
                return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-semibold uppercase tracking-wider w-fit">OUT OF STOCK</span>;
            case 'suspended': 
                return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-[9px] font-semibold uppercase tracking-wider w-fit">SUSPENDED</span>;
            default: 
                return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[9px] font-semibold uppercase tracking-wider w-fit">{status?.toUpperCase()}</span>;
        }
    };

    const filteredItems = items.filter(item => {
        const matchesType = activeTab === 'products' 
            ? (item.itemType || 'product') === 'product'
            : item.itemType === 'service';
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = activeCategory === 'all' || item.categoryId === activeCategory;
        return matchesType && matchesSearch && matchesCategory;
    });

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / perPage));
    const paginatedItems = filteredItems.slice((page - 1) * perPage, page * perPage);

    // Reset to page 1 when filters change
    useEffect(() => { setPage(1); }, [searchQuery, activeCategory]);

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
                        : Number(item.price) - Number(item.discountValue))
                    : Number(item.price);
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-primary text-sm">₦{finalPrice.toLocaleString()}</span>
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
                    item.itemType === 'service' ? "text-text-secondary italic" : ((item.stockQuantity || 0) <= (item.minStock || 5) ? "text-red-500 font-bold" : "text-text-main")
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
            header: 'Total Value',
            accessor: (item: CatalogueItem) => {
                const hasDiscount = item.discountType && item.discountType !== 'none' && item.discountValue;
                const finalPrice = hasDiscount
                    ? (item.discountType === 'percentage'
                        ? Number(item.price) - (Number(item.price) * (Number(item.discountValue) / 100))
                        : Number(item.price) - Number(item.discountValue))
                    : Number(item.price);
                const qty = item.itemType === 'service' ? 0 : (item.stockQuantity ?? 0);
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-text-main text-sm">₦{(finalPrice * qty).toLocaleString()}</span>
                        {hasDiscount && qty > 0 && (
                            <span className="text-[9px] text-text-secondary line-through font-bold">₦{(Number(item.price) * qty).toLocaleString()}</span>
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
            header: 'Actions',
            accessor: (item: CatalogueItem) => (
                <div className="relative">
                    <button
                        onClick={(e) => toggleMenu(item.id, e)}
                        className="p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all cursor-pointer"
                    >
                        <MoreVertical size={15} />
                    </button>
                    {openMenuId === item.id && (
                        <div
                            className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-slate-100 shadow-xl z-50 py-1 min-w-[140px] overflow-hidden"
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => { router.push(`/dashboard/catalogue/products/${item.id}`); setOpenMenuId(null); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-text-secondary hover:bg-slate-50 hover:text-primary transition-colors text-left"
                            >
                                <Eye size={14} />
                                View Details
                            </button>
                            <button
                                onClick={(e) => { handleEdit(e, item); setOpenMenuId(null); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-text-secondary hover:bg-slate-50 hover:text-primary transition-colors text-left"
                            >
                                <Edit2 size={14} />
                                Edit
                            </button>
                            <button
                                onClick={(e) => { handleDelete(e, item); setOpenMenuId(null); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-text-secondary hover:bg-red-50 hover:text-red-500 transition-colors text-left"
                            >
                                <Trash2 size={14} />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            )
        }
    ];

    const productCount = items.filter(i => (i.itemType || 'product') === 'product').length;
    const serviceCount = items.filter(i => i.itemType === 'service').length;

    return (
        <PageLockWrapper feature="catalogue" featureName="Catalogue">
            <div className="p-4 md:p-8 space-y-6">
                <PageHeader
                    title="Catalogue"
                    description="Manage your products and services"
                    isSticky={false}
                    actions={
                        <button 
                            onClick={handleAdd} 
                            className="flex items-center gap-2 h-10 px-5 bg-primary text-white font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-primary-hover transition-all shadow-sm shadow-primary/20 cursor-pointer"
                        >
                            <Plus size={16} />
                            Add {activeTab === 'services' ? 'Service' : 'Product'}
                        </button>
                    }
                />

                {/* Tab Switcher */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
                    <button
                        onClick={() => { setActiveTab('products'); setPage(1); }}
                        className={cn(
                            "px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                            activeTab === 'products' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        )}
                    >
                        Products ({productCount})
                    </button>
                    <button
                        onClick={() => { setActiveTab('services'); setPage(1); }}
                        className={cn(
                            "px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                            activeTab === 'services' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        )}
                    >
                        Services ({serviceCount})
                    </button>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative max-w-md flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab === 'services' ? 'services' : 'products'} by name...`}
                            className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-5 font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm text-slate-900"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <select
                        value={activeCategory}
                        onChange={(e) => setActiveCategory(e.target.value)}
                        className="h-12 px-4 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer w-full sm:w-56"
                    >
                        <option value="all">All Categories</option>
                        {categories.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <DataTable
                    columns={columns}
                    data={paginatedItems}
                    isLoading={isLoading}
                    emptyState={
                        <EmptyState
                            icon="shopping-bag"
                            title={activeTab === 'services' ? 'No services yet' : 'Your catalogue is ready for its first product'}
                            description={activeTab === 'services' 
                                ? 'Add the services your business provides so customers can discover and engage with them.'
                                : 'List your products so customers can discover what you offer.'}
                        />
                    }
                />

                {filteredItems.length > 0 && (
                    <div className="flex items-center justify-center gap-4 bg-white rounded-xl border border-slate-100 px-4 py-3">
                        <span className="text-xs font-bold text-text-secondary">
                            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredItems.length)} of {filteredItems.length}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="p-2 text-text-secondary hover:text-primary hover:bg-slate-50 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${p === page ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-slate-50'}`}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="p-2 text-text-secondary hover:text-primary hover:bg-slate-50 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                <AddProductMethodModal
                    isOpen={isMethodOpen}
                    onSelectMethod={handleSelectMethod}
                    onClose={() => setIsMethodOpen(false)}
                />

                <ProductModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    product={selectedProduct}
                    activeBranchId={activeBranchId || undefined}
                    itemType={activeTab === 'services' ? 'service' : 'product'}
                />
            </div>
        </PageLockWrapper>
    );
}
