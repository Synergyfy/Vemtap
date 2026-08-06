'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import { 
    Order, 
    OrderItem,
    useUpdateCatalogueOrderStatus,
    useCatalogueOrderDetails 
} from '@/services/catalogue/hooks';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatOrderDate } from '@/lib/utils/date';

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string | null;
}

export default function OrderDetailsModal({ isOpen, onClose, orderId }: OrderDetailsModalProps) {
    const { data: order, isLoading } = useCatalogueOrderDetails(orderId as string);
    const updateStatusMutation = useUpdateCatalogueOrderStatus();

    if (!orderId) return null;

    const handleUpdateStatus = async (status: Order['status']) => {
        try {
            await updateStatusMutation.mutateAsync({ id: orderId, status });
            toast.success(`Order marked as ${status}`);
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update status');
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'new': return 'bg-amber-100 text-amber-700';
            case 'processing': return 'bg-blue-100 text-blue-700';
            case 'completed': return 'bg-emerald-100 text-emerald-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={order ? `Order #${order.id.slice(0, 8)}` : 'Order Details'}
            size="md"
        >
            {isLoading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : order ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Status</p>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusStyles(order.status)}`}>
                                {order.status}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Total Amount</p>
                            <p className="text-lg font-black text-primary">₦{Number(order.totalAmount).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">Customer Info</p>
                            <p className="font-bold text-text-main text-sm">
                                {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Guest'}
                            </p>
                            <p className="text-xs text-text-secondary">{order.customer?.phone || 'No phone'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">Order Info</p>
                            <p className="font-bold text-text-main text-sm">{order.tableNumber ? `Table ${order.tableNumber}` : 'Walk-in'}</p>
                            {order.attendedByUser && (
                                <p className="text-xs text-text-secondary mt-1">
                                    Attended by: {order.attendedByUser.name || `${order.attendedByUser.firstName} ${order.attendedByUser.lastName}`}
                                </p>
                            )}
                            {(order as any).bookingDate && (
                                <p className="text-xs text-primary font-black mt-1 uppercase tracking-wider flex items-center gap-1">
                                    <Clock size={12}/> Appointment: {(order as any).bookingDate} @ {(order as any).bookingTime}
                                </p>
                            )}
                            <p className="text-xs text-text-secondary">
                                {formatOrderDate(order.createdAt)} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3">Order Items</p>
                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-black text-text-secondary uppercase text-[10px] tracking-wider">Item</th>
                                        <th className="px-4 py-3 text-center font-black text-text-secondary uppercase text-[10px] tracking-wider">Qty</th>
                                        <th className="px-4 py-3 text-right font-black text-text-secondary uppercase text-[10px] tracking-wider">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {order.items.map((item: OrderItem) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-3 font-bold text-text-main">
                                                {item.offer?.name || item.item?.name || 'Unknown Item'}
                                            </td>
                                            <td className="px-4 py-3 text-center font-medium text-text-secondary">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right font-bold text-text-main">₦{(Number(item.priceAtOrder) * item.quantity).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                        {order.status === 'new' && (
                            <button 
                                className="w-full h-12 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 cursor-pointer" 
                                onClick={() => handleUpdateStatus('processing')}
                                disabled={updateStatusMutation.isPending}
                            >
                                {updateStatusMutation.isPending ? <Loader2 className="animate-spin" size={18}/> : <Clock size={18}/>}
                                Start Processing
                            </button>
                        )}
                        {order.status === 'processing' && (
                            <button 
                                className="w-full h-12 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 cursor-pointer" 
                                onClick={() => handleUpdateStatus('completed')}
                                disabled={updateStatusMutation.isPending}
                            >
                                {updateStatusMutation.isPending ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle size={18}/>}
                                Mark as Completed
                            </button>
                        )}
                        {(order.status === 'new' || order.status === 'processing') && (
                            <button 
                                className="w-full h-12 bg-white border border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                onClick={() => handleUpdateStatus('cancelled')}
                                disabled={updateStatusMutation.isPending}
                            >
                                <XCircle size={18}/>
                                Cancel Order
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="w-full h-12 bg-gray-50 text-text-secondary font-bold rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-8 text-center text-text-secondary">Order not found</div>
            )}
        </Modal>
    );
}
