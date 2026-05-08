'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import EmptyState from '@/components/dashboard/EmptyState';
import { Eye, Clock, CheckCircle, XCircle, Plus, Filter, ShoppingBag, QrCode } from 'lucide-react';
import { useCatalogueOrders, Order } from '@/services/catalogue/hooks';
import { useQrThriveSpecializedLeads } from '@/services/qr-thrive/hooks';
import { QrThriveLead } from '@/services/qr-thrive/types';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useAuthStore } from '@/store/useAuthStore';
import OrderDetailsModal from '@/components/dashboard/catalogue/OrderDetailsModal';
import ManualOrderModal from '@/components/dashboard/catalogue/ManualOrderModal';
import QrThriveLeadModal from '@/components/dashboard/qr-thrive/QrThriveLeadModal';
import { formatOrderDate } from '@/lib/utils/date';
import { format } from 'date-fns';

export default function OrdersPage() {
    const { activeBranchId } = useActiveBranch();
    const [activeTab, setActiveTab] = useState<'vemtap' | 'qrthrive'>('vemtap');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Vemtap Orders Logic
    const { data: ordersData, isLoading: isVemtapLoading } = useCatalogueOrders({ 
        branchId: activeBranchId ?? undefined, 
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: 'order'
    });
    const orders = ((ordersData as any)?.data as Order[]) || [];
    
    // QRThrive Leads Logic
    const { data: qrLeads, isLoading: isQrLoading } = useQrThriveSpecializedLeads(activeBranchId, { types: 'menu' });
    const filteredQrItems = (qrLeads?.items || []).filter((item: any) => {
        const currentStatus = item.localStatus || 'new';
        return statusFilter === 'all' || currentStatus === statusFilter;
    });

    const [isVemtapModalOpen, setIsVemtapModalOpen] = useState(false);
    const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    const [selectedQrLead, setSelectedQrLead] = useState<QrThriveLead | null>(null);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);

    const handleViewVemtapDetails = (order: Order) => {
        setSelectedOrderId(order.id);
        setIsVemtapModalOpen(true);
    };

    const handleViewQrDetails = (lead: QrThriveLead) => {
        setSelectedQrLead(lead);
        setIsQrModalOpen(true);
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

    const vemtapColumns: Column<Order>[] = [
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
                    onClick={() => handleViewVemtapDetails(item)}
                    className="p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all cursor-pointer"
                    title="View Details"
                >
                    <Eye size={16} />
                </button>
            )
        }
    ];

    const qrThriveColumns: Column<QrThriveLead>[] = [
        {
            header: 'Lead / Submission',
            accessor: (item: QrThriveLead) => {
                const answers = item.answers || {};
                const fields = item.form.fields || [];
                const nameField = fields.find(f => f.label.toLowerCase().includes('name'))?.id;
                
                const getPrimaryText = () => {
                    if (nameField && answers[nameField]) return String(answers[nameField]);
                    if (answers.details?.name) return String(answers.details.name);
                    
                    const internalKeys = ['ip', 'mac', 'userAgent', 'fingerprint', 'browser', 'os', 'device', 'details', 'cart', 'type', 'totalPrice', 'currency', 'totalItems'];
                    for (const [key, value] of Object.entries(answers)) {
                        if (!internalKeys.includes(key) && typeof value === 'string' && value.length > 0) return value;
                    }
                    
                    return 'Untitled Order';
                };
                
                const primaryText = getPrimaryText();
                const subText = item.answers.tableNumber 
                    ? `Table #${item.answers.tableNumber}` 
                    : (item.answers.cart?.length 
                        ? `${item.answers.cart.length} items ordered` 
                        : (item.answers.type?.replace('_', ' ') || 'Form Submission'));

                return (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {String(primaryText).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-text-main truncate max-w-[200px]">{primaryText}</span>
                            <span className="text-[10px] text-text-secondary truncate max-w-[200px]">
                                {subText}
                            </span>
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Form Source',
            accessor: (item: QrThriveLead) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-text-main">{item.form.title}</span>
                    <span className="text-[10px] text-text-secondary uppercase tracking-wider">{item.form.qrCode.name}</span>
                </div>
            )
        },
        {
            header: 'Data Points',
            accessor: (item: QrThriveLead) => (
                <span className="text-sm font-black text-text-main">{Object.keys(item.answers || {}).length} fields</span>
            )
        },
        {
            header: 'Total',
            accessor: (item: QrThriveLead) => {
                const price = item.answers.totalPrice || 0;
                return <span className="font-bold text-blue-600">₦{Number(price).toLocaleString()}</span>;
            }
        },
        {
            header: 'Status',
            accessor: (item: QrThriveLead) => getStatusBadge(item.localStatus || 'new')
        },
        {
            header: 'Date & Time',
            accessor: (item: QrThriveLead) => (
                <div className="flex flex-col">
                    <span className="text-xs text-text-main font-bold">
                        {format(new Date(item.createdAt), 'MMM d, yyyy')}
                    </span>
                    <span className="text-[10px] text-text-secondary uppercase">
                        {format(new Date(item.createdAt), 'h:mm a')}
                    </span>
                </div>
            )
        },
        {
            header: 'Actions',
            accessor: (item: QrThriveLead) => (
                <button
                    onClick={() => handleViewQrDetails(item)}
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
                title="Catalogue Orders"
                description="Manage orders from your catalogue and QRThrive leads"
                actions={
                    activeTab === 'vemtap' && (
                        <button
                            onClick={() => setIsManualOrderModalOpen(true)}
                            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 cursor-pointer"
                        >
                            <Plus size={16} strokeWidth={3} /> Create Manual Order
                        </button>
                    )
                }
            />

            {/* Tab Switcher */}
            <div className="flex bg-gray-100/50 p-1 rounded-2xl w-fit mb-8 border border-gray-200 shadow-sm">
                <button
                    onClick={() => {
                        setActiveTab('vemtap');
                        setStatusFilter('all');
                    }}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        activeTab === 'vemtap' 
                        ? 'bg-white text-primary shadow-sm' 
                        : 'text-text-secondary hover:text-text-main'
                    }`}
                >
                    <ShoppingBag size={14} /> Vemtap Orders
                </button>
                <button
                    onClick={() => {
                        setActiveTab('qrthrive');
                        setStatusFilter('all');
                    }}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        activeTab === 'qrthrive' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-text-secondary hover:text-text-main'
                    }`}
                >
                    <QrCode size={14} /> QRThrive Orders
                </button>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-black text-text-secondary uppercase tracking-widest mr-4">
                    <Filter size={16} /> Filter Status
                </div>
                <div className="flex flex-wrap gap-2">
                    {['all', 'new', 'processing', 'completed', 'cancelled'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                statusFilter === status 
                                ? (activeTab === 'vemtap' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-200')
                                : 'bg-gray-50 text-text-secondary hover:bg-gray-100 border border-transparent hover:border-gray-200'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'vemtap' ? (
                <DataTable
                    columns={vemtapColumns}
                    data={orders}
                    isLoading={isVemtapLoading}
                    onRowClick={handleViewVemtapDetails}
                    emptyState={
                        <EmptyState
                            icon="layout"
                            title="No orders yet"
                            description="Customer orders from your QR menu will appear here."
                        />
                    }
                />
            ) : (
                <DataTable
                    columns={qrThriveColumns}
                    data={filteredQrItems}
                    isLoading={isQrLoading}
                    onRowClick={handleViewQrDetails}
                    emptyState={
                        <EmptyState
                            icon="layout"
                            title="No order leads yet"
                            description="Submissions from your menu QR codes will appear here."
                        />
                    }
                />
            )}

            <OrderDetailsModal
                isOpen={isVemtapModalOpen}
                onClose={() => {
                    setIsVemtapModalOpen(false);
                    setSelectedOrderId(null);
                }}
                orderId={selectedOrderId}
            />

            <QrThriveLeadModal
                isOpen={isQrModalOpen}
                onClose={() => {
                    setIsQrModalOpen(false);
                    setSelectedQrLead(null);
                }}
                lead={selectedQrLead}
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
