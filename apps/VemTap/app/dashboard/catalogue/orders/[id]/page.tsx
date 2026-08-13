"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    OrderDetailsSummary, 
    OrderCustomerCard, 
    OrderItemsList, 
    OrderTimeline,
    OrderManagementActions
} from '@/components/dashboard/catalogue/OrderDetails';
import { useCatalogueOrderDetails, useUpdateCatalogueOrderStatus, OrderStatus } from '@/services/catalogue/hooks';
import CatalogueRefundModal from '@/components/dashboard/catalogue/CatalogueRefundModal';
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
    const [showRefundModal, setShowRefundModal] = useState(false);

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

    const handleRefund = async (reason: string, refundItems: { itemId: string; refundQuantity: number }[]) => {
        try {
            const allFull = order?.items?.every(item => {
                const found = refundItems.find(r => r.itemId === (item.itemId || item.offerId));
                return found && found.refundQuantity === item.quantity;
            });
            const status: OrderStatus = allFull ? 'refunded' : 'partial_refund';
            await updateStatusMutation.mutateAsync({
                id: orderId,
                status,
                reason: reason || undefined,
                refundItems,
            });
            toast.success('Refund processed successfully');
            setShowRefundModal(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to process refund');
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
            <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 max-w-md mx-auto mt-20 shadow-sm">
                <p className="text-gray-500 font-bold">Order not found</p>
                <Link href="/dashboard/catalogue/orders">
                    <Button className="mt-4 bg-gray-900 text-white rounded-xl">Back to Orders</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="pb-32 md:pb-20 max-w-5xl mx-auto p-4 md:p-8">
            <Link href="/dashboard/catalogue/orders" className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 hover:text-[#066CF4] transition-colors mb-6">
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
                    
                    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5 md:p-6">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-6">Internal Notes</h3>
                        <textarea 
                            placeholder="Add staff note..."
                            defaultValue={order.notes || ''}
                            className="w-full min-h-[100px] bg-white border border-gray-100 rounded-xl p-4 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                        />
                        <Button className="mt-4 w-full h-10 rounded-xl bg-gray-900 text-[9px] font-semibold uppercase tracking-wider text-white">Save Note</Button>
                    </div>
                </div>
            </div>

            <OrderManagementActions 
                status={order.status} 
                onStatusChange={handleStatusChange} 
                isPending={updateStatusMutation.isPending}
                onRefund={order.status === 'completed' ? () => setShowRefundModal(true) : undefined}
            />

            {order && (
                <CatalogueRefundModal
                    isOpen={showRefundModal}
                    onClose={() => setShowRefundModal(false)}
                    order={order}
                    onRefund={handleRefund}
                    isPending={updateStatusMutation.isPending}
                />
            )}
        </div>
    );
}
