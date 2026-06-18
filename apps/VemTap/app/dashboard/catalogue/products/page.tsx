"use client";

import React from 'react';
import { 
    CatalogueOverviewHeader, 
    CatalogueStatsCards, 
    CatalogueActionCards 
} from '@/components/dashboard/products/ProductDashboard';
import { useProductStore } from '@/store/useProductStore';
import { useMyBusiness } from '@/services/businesses/hooks';
import { ShoppingBag, LayoutGrid, AlertCircle, Package, Plus } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ProductsPage() {
    const { data: business } = useMyBusiness();
    const { items, services } = useProductStore();

    const businessCategory = (typeof business?.category === 'string' ? business.category : business?.category?.name) || 'Retail';
    const isProductBased = !['salon', 'spa', 'gym', 'service'].includes(businessCategory.toLowerCase());
    const displayItems = isProductBased ? items : services;
    const isLoading = false; // Mock loading state

    const stats = [
        { label: `Total ${isProductBased ? 'Products' : 'Services'}`, value: displayItems.length || '48', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Active Items', value: displayItems.filter(i => i.status === 'available').length || '40', icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Low Stock', value: '12', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'Categories', value: '6', icon: LayoutGrid, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="pb-24 md:pb-10 max-w-6xl mx-auto p-4 md:p-8 space-y-12">
            
            <CatalogueOverviewHeader />
            
            <CatalogueStatsCards stats={stats} />
            
            <CatalogueActionCards isProductBased={isProductBased} />

            {/* PRODUCT LIST */}
            <div className="rounded-[40px] bg-white p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-gray-900">Recently Added</h3>
                    <Button variant="outline" className="rounded-xl border-gray-100 text-[10px] font-black uppercase tracking-widest">View All</Button>
                </div>

                {displayItems.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="size-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-6 text-gray-300">
                            <Plus size={40} />
                        </div>
                        <h4 className="text-lg font-black text-gray-900 mb-2">No items yet</h4>
                        <p className="text-sm font-medium text-gray-400 mb-8">Start adding your {isProductBased ? 'products' : 'services'} to grow.</p>
                        <Button className="bg-[#066CF4] rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs">Add First Item</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {displayItems.slice(0, 4).map((item: any) => (
                            <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                                <div className="size-14 rounded-2xl bg-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                                    {item.image ? <img src={item.image} className="size-full object-cover" /> : <ShoppingBag className="text-gray-300" />}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-900">{item.name}</h4>
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">₦{Number(item.price).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
