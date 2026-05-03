'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import EmptyState from '@/components/dashboard/EmptyState';
import { Eye, Filter, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useQrThriveSpecializedLeads } from '@/services/qr-thrive/hooks';
import { QrThriveLead } from '@/services/qr-thrive/types';
import { useAuthStore } from '@/store/useAuthStore';
import { format } from 'date-fns';
import QrThriveLeadModal from '@/components/dashboard/qr-thrive/QrThriveLeadModal';

export default function BookingsLeadsPage() {
    const { activeBranchId } = useAuthStore();
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedLead, setSelectedLead] = useState<QrThriveLead | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const { data: leads, isLoading } = useQrThriveSpecializedLeads(activeBranchId, { types: 'booking' });

    const handleViewDetails = (lead: QrThriveLead) => {
        setSelectedLead(lead);
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
                return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black uppercase tracking-wider w-fit">{status.toUpperCase()}</span>;
        }
    };

    const filteredItems = (leads?.items || []).filter((item: any) => {
        const currentStatus = item.localStatus || 'new';
        return statusFilter === 'all' || currentStatus === statusFilter;
    });

    const columns: Column<QrThriveLead>[] = [
        {
            header: 'Lead / Submission',
            accessor: (item: QrThriveLead) => {
                const answers = item.answers || {};
                const fields = item.form.fields || [];
                const nameField = fields.find(f => f.label.toLowerCase().includes('name'))?.id;
                
                const getPrimaryText = () => {
                    // 1. Try explicit name from form
                    if (nameField && answers[nameField]) return String(answers[nameField]);
                    
                    // 2. Try specialized details object
                    if (answers.details?.name) return String(answers.details.name);
                    
                    // 3. Fallback to Service Title
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
                title="Booking Leads"
                description="Leads and submissions from your booking and appointment QR codes"
            />

            <div className="bg-white rounded-2xl p-6 border border-slate-100 mb-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                <div className="flex items-center gap-3 text-sm font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 pr-6">
                    <Filter size={16} /> Filter Status
                </div>
                <div className="flex flex-wrap gap-2">
                    {['all', 'new', 'processing', 'completed', 'cancelled'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                statusFilter === status 
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-transparent'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredItems}
                isLoading={isLoading}
                onRowClick={handleViewDetails}
                emptyState={
                    <EmptyState
                        icon="calendar"
                        title="No booking leads yet"
                        description="Submissions from your booking QR codes will appear here."
                    />
                }
            />

            <QrThriveLeadModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedLead(null);
                }}
                lead={selectedLead}
            />
        </div>
    );
}
