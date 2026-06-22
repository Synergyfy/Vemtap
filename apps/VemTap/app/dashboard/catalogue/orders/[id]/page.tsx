"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    OrderDetailsSummary, 
    OrderCustomerCard, 
    OrderItemsList, 
    OrderTimeline,
    OrderManagementActions
} from '@/components/dashboard/catalogue/OrderDetails';
import { useCatalogueOrderDetails, useUpdateCatalogueOrderStatus, OrderStatus } from '@/services/catalogue/hooks';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

export default function OrderDetailsPage() {
    const params = useParams<{ id: string }>();
    const orderId = params?.id || '';
    const { data: order, isLoading } = useCatalogueOrderDetails(orderId);
    const updateStatusMutation = useUpdateCatalogueOrderStatus();

    const handleStatusChange = async (newStatus: string) => {
        try {
            await updateStatusMutation.mutateAsync({
                id: orderId,
                status: newStatus as OrderStatus
            });
            toast.success('Order status updated successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update order status');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="p-8 text-center bg-white rounded-[32px] border border-gray-100 max-w-md mx-auto mt-20 shadow-sm">
                <p className="text-gray-500 font-bold">Order not found</p>
                <Link href="/dashboard/catalogue/orders">
                    <Button className="mt-4 bg-gray-900 text-white rounded-xl">Back to Orders</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="pb-32 md:pb-20 max-w-5xl mx-auto p-4 md:p-8">
            <Link href="/dashboard/catalogue/orders" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#066CF4] transition-colors mb-6">
                <ArrowLeft size={14} />
                Back to Orders
            </Link>

            <OrderDetailsSummary order={order} />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    <OrderItemsList items={order.items} />
                    <OrderTimeline status={order.status} orderCreatedAt={order.createdAt} />
                </div>
                
                <div className="lg:col-span-4 space-y-8">
                    <OrderCustomerCard customer={order.customer} />
                    
                    <div className="rounded-[40px] bg-gray-50 border border-gray-100 p-8">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Internal Notes</h3>
                        <textarea 
                            placeholder="Add staff note..."
                            defaultValue={order.notes || ''}
                            className="w-full min-h-[100px] bg-white border border-gray-100 rounded-2xl p-4 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                        />
                        <Button className="mt-4 w-full h-10 rounded-xl bg-gray-900 text-[9px] font-black uppercase tracking-widest text-white">Save Note</Button>
                    </div>
                </div>
            </div>

            <OrderManagementActions 
                status={order.status} 
                onStatusChange={handleStatusChange} 
                isPending={updateStatusMutation.isPending}
            />
        </div>
    );
}
