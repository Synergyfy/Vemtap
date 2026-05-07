'use client';

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import { ShoppingBag, LayoutGrid, ClipboardList, Clock } from 'lucide-react';
import { useCatalogueItems, useCatalogueCategories, useCatalogueOrders, Order } from '@/services/catalogue/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import Link from 'next/link';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';

export default function CatalogueOverviewPage() {
    const { activeBranchId } = useActiveBranch();
    
    const { data: items = [] } = useCatalogueItems({ branchId: activeBranchId ?? undefined });
    const { data: categories = [] } = useCatalogueCategories();
    const { data: ordersData } = useCatalogueOrders({ branchId: activeBranchId ?? undefined });
    const orders = ((ordersData as any)?.data as Order[]) || [];
    
    const pendingOrders = orders.filter(o => o.status === 'new' || o.status === 'processing').length;

    const stats = [
        {
            label: 'Total Products',
            value: items.length.toString(),
            icon: ShoppingBag,
            color: 'blue' as const,
            href: '/dashboard/catalogue/products'
        },
        {
            label: 'Active Categories',
            value: categories.length.toString(),
            icon: LayoutGrid,
            color: 'purple' as const,
            href: '/dashboard/catalogue/categories'
        },
        {
            label: 'Pending Orders',
            value: pendingOrders.toString(),
            icon: Clock,
            color: 'amber' as const,
            href: '/dashboard/catalogue/orders'
        },
        {
            label: 'Total Orders',
            value: ((ordersData as any)?.total || orders.length).toString(),
            icon: ClipboardList,
            color: 'green' as const,
            href: '/dashboard/catalogue/orders'
        }
    ];

    return (
        <PageLockWrapper feature="catalogue" featureName="Catalogue">
            <div className="p-4 md:p-8 space-y-6 md:space-y-8">
                <PageHeader
                    title="Catalogue Overview"
                    description="Manage your product offerings and track customer orders"
                />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat, index) => (
                    <StatsCard key={index} {...(stat as any)} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200">
                    <h3 className="text-base md:text-lg font-bold text-text-main mb-4 uppercase tracking-tight">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link 
                            href="/dashboard/catalogue/products" 
                            className="p-4 rounded-xl bg-gray-50 hover:bg-primary/5 hover:text-primary transition-all group border border-transparent hover:border-primary/20 flex flex-row sm:flex-col items-center sm:items-start gap-4 sm:gap-0"
                        >
                            <div className="size-10 rounded-lg bg-white flex items-center justify-center shadow-sm sm:mb-2 group-hover:bg-primary group-hover:text-white transition-colors">
                                <ShoppingBag className="text-text-secondary group-hover:text-white transition-colors" size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Add Product</p>
                                <p className="text-[10px] text-text-secondary">Create new menu items</p>
                            </div>
                        </Link>
                        <Link 
                            href="/dashboard/catalogue/categories" 
                            className="p-4 rounded-xl bg-gray-50 hover:bg-primary/5 hover:text-primary transition-all group border border-transparent hover:border-primary/20 flex flex-row sm:flex-col items-center sm:items-start gap-4 sm:gap-0"
                        >
                            <div className="size-10 rounded-lg bg-white flex items-center justify-center shadow-sm sm:mb-2 group-hover:bg-primary group-hover:text-white transition-colors">
                                <LayoutGrid className="text-text-secondary group-hover:text-white transition-colors" size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Add Category</p>
                                <p className="text-[10px] text-text-secondary">Organize your menu</p>
                            </div>
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base md:text-lg font-bold text-text-main uppercase tracking-tight">Recent Orders</h3>
                        <Link href="/dashboard/catalogue/orders" className="text-[10px] md:text-xs font-bold text-primary hover:underline uppercase tracking-widest">View All</Link>
                    </div>
                    {orders.length === 0 ? (
                        <div className="py-12 text-center">
                            <ClipboardList className="size-12 text-gray-100 mx-auto mb-3" />
                            <p className="text-text-secondary text-sm font-medium">No orders yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {orders.slice(0, 5).map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-primary/20 transition-colors">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-bold text-sm text-text-main leading-tight">
                                            {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Guest'}
                                        </span>
                                        <span className="text-[10px] text-text-secondary font-black uppercase tracking-tight">
                                            {order.tableNumber ? `Table ${order.tableNumber}` : 'Walk-in'} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="font-black text-sm text-primary">₦{Number(order.totalAmount).toLocaleString()}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                            order.status === 'new' ? 'bg-amber-100 text-amber-700' : 
                                            order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                            order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-text-secondary'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
        </PageLockWrapper>
    );
}
