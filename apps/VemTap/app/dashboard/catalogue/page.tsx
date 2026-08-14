"use client";

import React from 'react';
import { 
    CatalogueOverviewHeader, 
    CatalogueStatsCards
} from '@/components/dashboard/catalogue/CatalogueDashboard';
import { CatalogueQRModal } from '@/components/dashboard/catalogue/CatalogueQRModal';
import { useCatalogueItems, useCatalogueCategories, useCatalogueOrders } from '@/services/catalogue/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import { ShoppingBag, LayoutGrid, Clock, ClipboardList, Plus } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CatalogueOverviewPage() {
    const [isQRModalOpen, setIsQRModalOpen] = React.useState(false);
    const { data: business } = useMyBusiness();
    const { data: items = [], isLoading: isLoadingItems } = useCatalogueItems();
    const { data: categories = [], isLoading: isLoadingCats } = useCatalogueCategories();
    const { data: ordersData, isLoading: isLoadingOrders } = useCatalogueOrders();

    const isLoading = isLoadingItems || isLoadingCats || isLoadingOrders;
    const businessCategory = (typeof business?.category === 'string' ? business.category : (business?.category as any)?.name) || 'Restaurant';
    const isProductBased = !['salon', 'spa', 'gym', 'service'].includes(businessCategory.toLowerCase());

    const pendingRequestsCount = (ordersData?.data || []).filter(
        (order: any) => order.status === 'new' || order.status === 'processing'
    ).length;

    const stats = [
        { label: 'Total Items', value: items.length.toString(), icon: ShoppingBag, href: '/dashboard/catalogue/products' },
        { label: 'Categories', value: categories.length.toString(), icon: LayoutGrid, href: '/dashboard/catalogue/categories' },
        { label: 'Pending Requests', value: pendingRequestsCount.toString(), icon: Clock, href: '/dashboard/catalogue/orders' },
        { label: 'Total Transactions', value: (ordersData?.total || 0).toString(), icon: ClipboardList, href: '/dashboard/catalogue/orders' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="pb-24 md:pb-10 max-w-6xl mx-auto p-4 md:p-6 space-y-8">
            {/* SCREEN 1: PRODUCTS / SERVICES SETUP */}
            
            <CatalogueOverviewHeader category={businessCategory} />

            {/* QUICK STATS */}
            <CatalogueStatsCards stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                {/* LEFT COLUMN: Recent Activity */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                            <h3 className="text-base md:text-lg font-bold text-gray-900">Recently Added</h3>
                            <Link href="/dashboard/catalogue/products">
                                <Button variant="outline" className="rounded-lg h-9 border-gray-200 text-xs font-semibold text-gray-600 px-3">View All</Button>
                            </Link>
                        </div>

                        {items.length === 0 ? (
                            <div className="py-12 md:py-16 text-center px-6">
                                <div className="size-14 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-4 text-gray-300">
                                    <Plus size={26} />
                                </div>
                                <h4 className="text-base font-bold text-gray-900 mb-1">Your first {isProductBased ? 'product' : 'service'} is waiting to be listed</h4>
                                <p className="text-sm text-gray-400 mb-6">Start showing customers what you offer. Every listing brings you closer to your next sale.</p>
                                <Link href="/dashboard/catalogue/products"><Button className="bg-[#066CF4] rounded-xl h-11 px-5 font-bold text-xs text-white">Add First Item</Button></Link>
                            </div>
                        ) : (
                           <div className="p-4 md:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {items.slice(0, 4).map((item: any) => (
                                 <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/60 border border-gray-100">
                                    <div className="size-11 rounded-lg bg-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                                       {(item.mainImage || item.image) ? <img src={item.mainImage || item.image} className="size-full object-cover" /> : <ShoppingBag className="text-gray-300" size={18} />}
                                    </div>
                                    <div className="min-w-0">
                                       <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                                       <p className="text-xs font-bold text-[#066CF4] mt-0.5">₦{Number(item.price).toLocaleString()}</p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Tips & Promotion */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="rounded-2xl bg-gray-900 p-7 text-white relative overflow-hidden shadow-lg">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#066CF4]/20 rounded-full blur-2xl -mr-16 -mt-16" />
                        <h3 className="text-xl font-bold mb-2 leading-tight">Generate Catalog QR</h3>
                        <p className="text-sm text-white/70 mb-6">Create a specialized QR code that opens your menu or service list, and customize it in Marketing Kit.</p>
                        <Button 
                            onClick={() => setIsQRModalOpen(true)}
                            className="w-full h-11 rounded-xl bg-[#066CF4] text-xs font-bold text-white shadow-lg hover:bg-[#4293FF] transition-all"
                        >
                            Generate QR
                        </Button>
                    </div>
                </div>
            </div>

            <CatalogueQRModal 
                isOpen={isQRModalOpen} 
                onClose={() => setIsQRModalOpen(false)} 
                businessCode={business?.id || 'demo'} 
                businessName={business?.name || 'My Business'} 
                logoUrl={business?.logoUrl} 
            />
        </div>
    );
}
