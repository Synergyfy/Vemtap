'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import EmptyState from '@/components/dashboard/EmptyState';
import { Eye, Clock, CheckCircle, XCircle, Calendar as CalendarIcon, Filter, ShoppingBag, QrCode } from 'lucide-react';
import { useCatalogueOrders, Order } from '@/services/catalogue/hooks';
import { useQrThriveSpecializedLeads } from '@/services/qr-thrive/hooks';
import { QrThriveLead } from '@/services/qr-thrive/types';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useAuthStore } from '@/store/useAuthStore';
import OrderDetailsModal from '@/components/dashboard/catalogue/OrderDetailsModal';
import QrThriveLeadModal from '@/components/dashboard/qr-thrive/QrThriveLeadModal';
import { formatOrderDate } from '@/lib/utils/date';
import { format } from 'date-fns';

export default function BookingsPage() {
    const { activeBranchId } = useActiveBranch();
    const [activeTab, setActiveTab] = useState<'vemtap' | 'qrthrive'>('vemtap');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Vemtap Bookings Logic
    const { data: ordersData, isLoading: isVemtapLoading } = useCatalogueOrders({ 
        branchId: activeBranchId ?? undefined, 
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: 'booking'
    });
    const bookings = ((ordersData as any)?.data as Order[]) || [];
    
    // QRThrive Leads Logic
    const { data: qrLeads, isLoading: isQrLoading } = useQrThriveSpecializedLeads(activeBranchId, { types: 'booking' });
    const filteredQrItems = (qrLeads?.items || []).filter((item: any) => {
        const currentStatus = item.localStatus || 'new';
        return statusFilter === 'all' || currentStatus === statusFilter;
    });

    const [isVemtapModalOpen, setIsVemtapModalOpen] = useState(false);
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
            header: 'Booking Info',
            accessor: (item: Order) => (
                <div className="flex flex-col">
                    <span className="font-bold text-text-main">#{item.id.slice(0, 8)}</span>
                    <span className="text-[10px] text-text-secondary uppercase">{item.items.length} Service(s)</span>
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
            header: 'Appointment',
            accessor: (item: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-primary flex items-center gap-1">
                        <CalendarIcon size={12} /> {item.bookingDate || 'N/A'}
                    </span>
                    <span className="text-[10px] text-text-secondary font-black uppercase">
                        <Clock size={10} className="inline mr-1" /> {item.bookingTime || 'N/A'}
                    </span>
                </div>
            )
        },
        {
            header: 'Status',
            accessor: (item: Order) => getStatusBadge(item.status)
        },
        {
            header: 'Booked On',
            accessor: (item: Order) => (
                <div className="flex flex-col">
                    <span className="text-xs text-text-main font-medium">
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
                    if (answers.serviceTitle) return String(answers.serviceTitle);
                    return 'Untitled Booking';
                };
                
                const primaryText = getPrimaryText();
                const subText = answers.serviceTitle && primaryText !== answers.serviceTitle 
                    ? answers.serviceTitle 
                    : (answers.date ? `${answers.date} ${answers.time || ''}` : (answers.details?.type || 'Booking Request'));
                
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
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
                title="Service Bookings"
                description="Manage appointments from your catalogue and QRThrive leads"
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
                    <ShoppingBag size={14} /> Vemtap Bookings
                </button>
                <button
                    onClick={() => {
                        setActiveTab('qrthrive');
                        setStatusFilter('all');
                    }}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        activeTab === 'qrthrive' 
                        ? 'bg-white text-emerald-600 shadow-sm' 
                        : 'text-text-secondary hover:text-text-main'
                    }`}
                >
                    <QrCode size={14} /> QRThrive Bookings
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
                                ? (activeTab === 'vemtap' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200')
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
                    data={bookings}
                    isLoading={isVemtapLoading}
                    onRowClick={handleViewVemtapDetails}
                    emptyState={
                        <EmptyState
                            icon="calendar"
                            title="No bookings yet"
                            description="Customer appointments for your services will appear here."
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
                            icon="calendar"
                            title="No booking leads yet"
                            description="Submissions from your booking QR codes will appear here."
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
        </div>
    );
}
