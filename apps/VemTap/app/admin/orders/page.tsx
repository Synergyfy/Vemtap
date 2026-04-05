'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminProductsApi } from '@/lib/api/admin';
import {
    Package, Search, Filter, Clock, CheckCircle,
    AlertCircle, MoreVertical, Eye, Truck, X,
    Calendar, Building2, User, ArrowUpRight, MessageSquare
} from 'lucide-react';
import { TbCurrencyNaira } from 'react-icons/tb';
import { format } from 'date-fns';
import { notify } from '@/lib/notify';
import Modal from '@/components/ui/Modal';

export default function AdminOrdersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: orders, isLoading } = useQuery({
        queryKey: ['admin-orders'],
        queryFn: () => adminProductsApi.getAllOrders(),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: string }) => adminProductsApi.updateOrderStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            notify.success('Order status updated successfully');
            setIsDetailsModalOpen(false);
        },
        onError: () => {
            notify.error('Failed to update order status');
        }
    });

    const filteredOrders = (orders || []).filter((order: any) => {
        const matchesSearch =
            order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.business?.name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'Processing': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Ready': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'Completed': return 'bg-green-50 text-green-600 border-green-100';
            case 'Cancelled': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-3 text-primary mb-2">
                        <Package size={20} />
                        <span className="text-xs font-black uppercase tracking-widest text-primary">Fulfillment</span>
                    </div>
                    <h1 className="text-3xl font-display font-bold text-text-main">Hardware Orders</h1>
                    <p className="text-text-secondary text-sm mt-1 font-medium">Manage marketplace orders and production status</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="h-11 px-5 bg-white border border-gray-200 text-text-main rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2">
                        <Calendar size={18} /> Schedule
                    </button>
                    <button className="h-11 px-5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                        Bulk Export
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Order ID, Product or Business..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 pl-12 pr-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter size={18} className="text-gray-400 hidden md:block" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-11 px-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-text-main outline-none focus:bg-white transition-all cursor-pointer min-w-[140px]"
                    >
                        <option value="all">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Ready">Ready</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Order & Date</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Customer</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Product</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Quantity</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Amount</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-6 py-8 h-20 bg-gray-50/20"></td>
                                    </tr>
                                ))
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center">
                                        <Package className="mx-auto text-gray-200 mb-4" size={48} />
                                        <p className="text-text-secondary font-bold">No orders found matching your filters</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order: any) => (
                                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-xs font-bold text-primary">#{order.id.split('-')[0].toUpperCase()}</span>
                                                <span className="text-[10px] text-gray-400 font-bold mt-1 flex items-center gap-1">
                                                    <Clock size={10} /> {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-text-main">{order.business?.name || 'Individual'}</span>
                                                <span className="text-[10px] text-text-secondary font-medium">ID: {order.businessId?.split('-')[0]}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                                    {order.product?.image ? (
                                                        <img src={order.product.image} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package size={14} className="text-gray-400" />
                                                    )}
                                                </div>
                                                <span className="text-sm font-bold text-text-main">{order.product?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm font-black text-text-main">
                                            {order.quantity} <span className="text-[10px] text-gray-400 uppercase ml-1">Units</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-text-main flex items-center gap-0.5">
                                                    <TbCurrencyNaira /> {order.totalPrice?.toLocaleString()}
                                                </span>
                                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded w-fit mt-1 ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {order.paymentStatus}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button
                                                onClick={() => { setSelectedOrder(order); setIsDetailsModalOpen(true); }}
                                                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                            >
                                                <Eye size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <Modal
                    isOpen={isDetailsModalOpen}
                    onClose={() => setIsDetailsModalOpen(false)}
                    title="Order Fulfillment"
                    description={`Order ID: #${selectedOrder.id}`}
                    size="xl"
                >
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2 mb-2">
                                        <Building2 size={12} /> Business Info
                                    </label>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <p className="font-bold text-text-main">{selectedOrder.business?.name || 'N/A'}</p>
                                        <p className="text-xs text-text-secondary mt-1">ID: {selectedOrder.businessId}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2 mb-2">
                                        <CheckCircle size={12} /> Payment Verified
                                    </label>
                                    <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Reference</p>
                                            <p className="text-xs font-mono font-bold text-green-800">{selectedOrder.paymentReference || 'N/A'}</p>
                                        </div>
                                        <p className="text-lg font-black text-green-700 flex items-center gap-1"><TbCurrencyNaira /> {selectedOrder.totalPrice?.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2 mb-2">
                                        <Package size={12} /> Product Details
                                    </label>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded border border-gray-200 overflow-hidden bg-white shrink-0">
                                                <img src={selectedOrder.product?.image} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-text-main">{selectedOrder.product?.name}</p>
                                                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Qty: {selectedOrder.quantity} units</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2 mb-2">
                                        <Truck size={12} /> Current Workflow
                                    </label>
                                    <div className={`p-4 rounded-xl border flex items-center justify-between ${getStatusStyle(selectedOrder.status)}`}>
                                        <span className="text-xs font-black uppercase tracking-wider">{selectedOrder.status}</span>
                                        <Clock size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary block mb-4">Update Order Status</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { id: 'Processing', label: 'Processing', icon: Clock, color: 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200' },
                                    { id: 'Ready', label: 'Mark Ready', icon: Truck, color: 'hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200' },
                                    { id: 'Completed', label: 'Complete & Paid', icon: CheckCircle, color: 'hover:bg-green-50 hover:text-green-600 hover:border-green-200' },
                                    { id: 'Cancelled', label: 'Cancel Order', icon: X, color: 'hover:bg-red-50 hover:text-red-600 hover:border-red-200' },
                                ].map((btn) => (
                                    <button
                                        key={btn.id}
                                        disabled={selectedOrder.status === btn.id || updateStatusMutation.isPending}
                                        onClick={() => updateStatusMutation.mutate({ id: selectedOrder.id, status: btn.id })}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-100 bg-white transition-all font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed ${btn.color}`}
                                    >
                                        <btn.icon size={20} />
                                        {btn.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-gray-100 flex gap-3">
                            <button className="flex-1 h-12 bg-gray-50 border border-gray-200 text-text-main font-bold rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                                <MessageSquare size={18} /> Contact Business
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
