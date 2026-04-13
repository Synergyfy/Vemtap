
'use client';

import React from 'react';
import Link from 'next/link';
import {
    Search, Plus, Package, Store, AlertTriangle, Filter, ArrowUpDown,
    MoreHorizontal, Edit, Copy, Trash2, ChevronLeft, ChevronRight, TrendingUp, AlertCircle
} from 'lucide-react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminProductsApi } from '@/lib/api/admin';
import { format } from 'date-fns';
import { useProductFormStore } from '@/store/useProductFormStore';
import { useRouter } from 'next/navigation';
import { Product } from '@/types/marketplace';

export default function ProductsPage() {
    const queryClient = useQueryClient();
    const { data: productsData, isLoading: isProductsLoading } = useQuery<Product[]>({
        queryKey: ['admin-products'],
        queryFn: () => adminProductsApi.getAll(),
    });

    const products = productsData || [];

    const { data: statsData, isLoading: isStatsLoading } = useQuery({
        queryKey: ['admin-product-stats'],
        queryFn: () => adminProductsApi.getStats(),
    });

    const { loadProductForEditing, resetForm } = useProductFormStore();
    const router = useRouter();

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminProductsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            queryClient.invalidateQueries({ queryKey: ['admin-product-stats'] });
        },
    });

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteMutation.mutateAsync(id);
            } catch (error) {
                console.error('Failed to delete product:', error);
                alert('Failed to delete product. Please try again.');
            }
        }
    };

    const handleEdit = (product: Product) => {
        loadProductForEditing(product);
        router.push('/admin/products/create');
    };

    const stats = [
        { label: 'Total Products', value: statsData?.total || 0, icon: Package, color: 'text-primary' },
        { label: 'Active Listings', value: statsData?.published || 0, icon: Store, color: 'text-green-500' },
        { label: 'Low Stock Alerts', value: statsData?.lowStock || 0, icon: AlertTriangle, color: 'text-yellow-500' },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200 px-6 sm:px-10 py-5">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="font-display text-2xl sm:text-3xl font-bold bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            Product Management
                        </h2>
                        <p className="text-text-secondary text-sm mt-1">Manage your hardware inventory and listings</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin/products/create"
                            onClick={() => resetForm()}
                            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            <Plus size={20} />
                            Add New Product
                        </Link>
                    </div>
                </div>
            </header>

            <div className="flex-1 p-6 sm:p-10 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <stat.icon size={96} className={stat.color} />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-text-secondary font-medium text-sm uppercase tracking-wide">{stat.label}</p>
                                    <h3 className="text-4xl font-display font-bold text-text-main mt-2">
                                        {isStatsLoading ? <div className="h-10 w-24 bg-gray-100 animate-pulse rounded" /> : stat.value.toLocaleString()}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Products Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="font-display font-bold text-lg px-2">All Products</span>
                                <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                    {isProductsLoading ? '...' : products.length}
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                                        <th className="px-6 py-4">Product</th>
                                        <th className="px-6 py-4">Category & Label</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {isProductsLoading ? (
                                        <tr>
                                            <td colSpan={4} className="py-20 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-text-secondary text-sm font-medium">Loading products...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : products.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-20 text-center text-text-secondary font-medium">No products found.</td>
                                        </tr>
                                    ) : (
                                        products.map((product: Product) => (
                                            <tr key={product.id} className="group relative hover:bg-gray-50/80 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="size-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">
                                                            {product.image ? (
                                                                <img alt={product.name} className="w-full h-full object-cover" src={product.image} />
                                                            ) : (
                                                                <Package className="text-gray-400" size={24} />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-text-main group-hover:text-primary transition-colors">{product.name}</div>
                                                            <div className="text-[10px] text-gray-400 font-mono">{product.sku}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className="px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                                                            {product.productType?.name || 'Uncategorized'}
                                                        </span>
                                                        {product.tag && (
                                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider text-white shadow-sm ${product.tagColor || 'bg-primary'}`}>
                                                                {product.tag}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border 
                                                            ${product.status === 'Published' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}
                                                        `}>
                                                        <span className={`size-1.5 rounded-full ${product.status === 'Published' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                        {product.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 transition-all duration-200">
                                                        <button
                                                            onClick={() => handleEdit(product)}
                                                            className="size-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-primary/10 hover:text-primary transition-colors"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(product.id)}
                                                            disabled={deleteMutation.isPending}
                                                            className="size-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>

                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
