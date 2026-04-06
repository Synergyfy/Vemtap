'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import EmptyState from '@/components/dashboard/EmptyState';
import { Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useCatalogueOrders, Order } from '@/services/catalogue/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import OrderDetailsModal from '@/components/dashboard/catalogue/OrderDetailsModal';
import ManualOrderModal from '@/components/dashboard/catalogue/ManualOrderModal';
import { formatOrderDate } from '@/lib/utils/date';
import { Plus } from 'lucide-react';

export default function OrdersPage() {
    const { activeBranchId } = useActiveBranch();
    const [statusFilter, setStatusFilter] = useState('all');
    
    const { data: ordersData, isLoading } = useCatalogueOrders({ 
        branchId: activeBranchId ?? undefined, 
        status: statusFilter !== 'all' ? statusFilter : undefined
    });
    const orders = ((ordersData as any)?.data as Order[]) || [];
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    const handleViewDetails = (order: Order) => {
        setSelectedOrderId(order.id);
        setIsModalOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new': 
                return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit"><Clock size={12}/> NEW</span>;
            case 'processing': 
                return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit"><Clock size={12}/> PROCESSING</span>;
            case 'completed': 
                return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit"><CheckCircle size={12}/> COMPLETED</span>;
            case 'cancelled': 
                return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit"><XCircle size={12}/> CANCELLED</span>;
            default: 
                return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-[10px] font-black uppercase tracking-wider w-fit">{status.toUpperCase()}</span>;
        }
    };

    const columns: Column<Order>[] = [
        {
            header: 'Order Info',
            accessor: (item: Order) => (
                <div className="flex flex-col">
                    <span className="font-bold text-text-main">#{item.id.slice(0, 8)}</span>
                    <span className="text-[10px] text-text-secondary uppercase">{item.tableNumber ? `Table ${item.tableNumber}` : 'Walk-in'}</span>
                </div>
            )
        },
        {
            header: 'Customer',
            accessor: (item: Order) => (
                <div className="flex flex-col">
                    <span className="font-medium text-text-main">
                        {item.customer ? `${item.customer.firstName} ${item.customer.lastName}` : 'Guest'}
                    </span>
                    <span className="text-[10px] text-text-secondary">{item.customer?.phone || 'No phone'}</span>
                </div>
            )
        },
        {
            header: 'Items',
            accessor: (item: Order) => (
                <span className="text-sm font-medium text-text-secondary">{item.items.reduce((acc, curr) => acc + curr.quantity, 0)} items</span>
            )
        },
        {
            header: 'Total',
            accessor: (item: Order) => (
                <span className="font-bold text-primary">₦{Number(item.totalAmount).toLocaleString()}</span>
            )
        },
        {
            header: 'Status',
            accessor: (item: Order) => getStatusBadge(item.status)
        },
        {
            header: 'Date & Time',
            accessor: (item: Order) => (
                <div className="flex flex-col">
                    <span className="text-xs text-text-main font-bold">
                        {formatOrderDate(item.createdAt)}
                    </span>
                    <span className="text-[10px] text-text-secondary uppercase">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )
        },
        {
            header: 'Actions',
            accessor: (item: Order) => (
                <button
                    onClick={() => handleViewDetails(item)}
                    className="p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all cursor-pointer"
                    title="View Details"
                >
                    <Eye size={16} />
                </button>
            )
        }
    ];

    return (
        <div className="p-4 md:p-8">
            <PageHeader
                title="Customer Orders"
                description="Monitor and fulfill QR menu orders"
                actions={
                    <button
                        onClick={() => setIsManualOrderModalOpen(true)}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 cursor-pointer"
                    >
                        <Plus size={16} strokeWidth={3} /> Create Manual Order
                    </button>
                }
            />

            <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex items-center gap-2 text-sm font-black text-text-secondary uppercase tracking-widest mr-4">
                    Filter Status
                </div>
                <div className="flex flex-wrap gap-2">
                    {['all', 'new', 'processing', 'completed', 'cancelled'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                statusFilter === status 
                                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                : 'bg-gray-50 text-text-secondary hover:bg-gray-100 border border-transparent hover:border-gray-200'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <DataTable
                columns={columns}
                data={orders}
                isLoading={isLoading}
                onRowClick={handleViewDetails}
                emptyState={
                    <EmptyState
                        icon="layout"
                        title="No orders yet"
                        description="Customer orders from your QR menu will appear here."
                    />
                }
            />

            <OrderDetailsModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedOrderId(null);
                }}
                orderId={selectedOrderId}
            />

            {activeBranchId && (
                <ManualOrderModal
                    isOpen={isManualOrderModalOpen}
                    onClose={() => setIsManualOrderModalOpen(false)}
                    branchId={activeBranchId}
                />
            )}
        </div>
    );
}
