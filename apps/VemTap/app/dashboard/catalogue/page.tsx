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
            <div className="p-4 md:p-8">
                <PageHeader
                    title="Catalogue Overview"
                    description="Manage your product offerings and track customer orders"
                />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <StatsCard key={index} {...(stat as any)} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-text-main mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link 
                            href="/dashboard/catalogue/products" 
                            className="p-4 rounded-xl bg-gray-50 hover:bg-primary/5 hover:text-primary transition-all group border border-transparent hover:border-primary/20"
                        >
                            <ShoppingBag className="mb-2 text-text-secondary group-hover:text-primary" size={24} />
                            <p className="font-bold text-sm">Add Product</p>
                            <p className="text-[10px] text-text-secondary">Create new menu items</p>
                        </Link>
                        <Link 
                            href="/dashboard/catalogue/categories" 
                            className="p-4 rounded-xl bg-gray-50 hover:bg-primary/5 hover:text-primary transition-all group border border-transparent hover:border-primary/20"
                        >
                            <LayoutGrid className="mb-2 text-text-secondary group-hover:text-primary" size={24} />
                            <p className="font-bold text-sm">Add Category</p>
                            <p className="text-[10px] text-text-secondary">Organize your menu</p>
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-text-main">Recent Orders</h3>
                        <Link href="/dashboard/catalogue/orders" className="text-xs font-bold text-primary hover:underline">View All</Link>
                    </div>
                    {orders.length === 0 ? (
                        <div className="py-8 text-center text-text-secondary text-sm">
                            No orders yet
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.slice(0, 5).map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-text-main">
                                            {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Guest'}
                                        </span>
                                        <span className="text-[10px] text-text-secondary uppercase">{order.tableNumber ? `Table ${order.tableNumber}` : 'Walk-in'}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="font-bold text-sm text-primary">₦{Number(order.totalAmount).toLocaleString()}</span>
                                        <span className={`text-[10px] font-bold uppercase ${
                                            order.status === 'new' ? 'text-amber-600' : 
                                            order.status === 'processing' ? 'text-blue-600' :
                                            order.status === 'completed' ? 'text-emerald-600' : 'text-text-secondary'
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
