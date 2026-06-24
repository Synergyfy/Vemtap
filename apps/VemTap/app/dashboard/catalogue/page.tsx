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
        <div className="pb-24 md:pb-10 max-w-6xl mx-auto p-4 md:p-8 space-y-12">
            {/* SCREEN 1: PRODUCTS / SERVICES SETUP */}
            
            <CatalogueOverviewHeader category={businessCategory} />

            {/* QUICK STATS */}
            <CatalogueStatsCards stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: Recent Activity */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-gray-900">Recently Added</h3>
                            <Link href="/dashboard/catalogue/products">
                                <Button variant="outline" className="rounded-xl border-gray-100 text-[10px] font-black uppercase tracking-widest">View All</Button>
                            </Link>
                        </div>

                        {items.length === 0 ? (
                            <div className="py-20 text-center">
                                <div className="size-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-6 text-gray-300">
                                    <Plus size={40} />
                                </div>
                                <h4 className="text-lg font-black text-gray-900 mb-2">No items yet</h4>
                                <p className="text-sm font-medium text-gray-400 mb-8">Start adding your {isProductBased ? 'products' : 'services'} to grow.</p>
                                <Link href="/dashboard/catalogue/products"><Button className="bg-[#066CF4] rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs">Add First Item</Button></Link>
                            </div>
                        ) : (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {items.slice(0, 4).map((item: any) => (
                                 <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                                    <div className="size-14 rounded-xl bg-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
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

                {/* RIGHT COLUMN: Tips & Promotion */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="rounded-[40px] bg-gray-900 p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#066CF4]/20 rounded-full blur-2xl -mr-16 -mt-16" />
                        <h3 className="text-2xl font-black mb-4 leading-tight">Generate <br /> Catalog QR</h3>
                        <p className="text-sm font-medium text-white/70 mb-8">Create a specialized QR code that opens your menu or service list, and customize it in Marketing Kit.</p>
                        <Button 
                            onClick={() => setIsQRModalOpen(true)}
                            className="w-full h-14 rounded-2xl bg-[#066CF4] text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl hover:bg-[#4293FF] transition-all"
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
