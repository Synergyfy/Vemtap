'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminProductsApi } from '@/lib/api/admin';
import { notify } from '@/lib/notify';
import {
    FileText, Search, Filter, MoreVertical, Eye, CheckCircle,
    XCircle, Clock, ArrowUpRight, MessageSquare, Building2, Package,
    Loader2
} from 'lucide-react';
import { TbCurrencyNaira } from 'react-icons/tb';
import Modal from '@/components/ui/Modal';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

export default function AdminQuotesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedQuote, setSelectedQuote] = useState<any>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [negotiationPrice, setNegotiationPrice] = useState<string>('');
    const [negotiationMessage, setNegotiationMessage] = useState<string>('');
    const [showNegotiationForm, setShowNegotiationForm] = useState(false);

    const queryClient = useQueryClient();

    const { data: quotes, isLoading } = useQuery({
        queryKey: ['admin-quotes'],
        queryFn: () => adminProductsApi.getAllQuotes(),
    });

    const negotiateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => adminProductsApi.negotiateQuote(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
            notify.success('Negotiation offer sent successfully');
            setShowNegotiationForm(false);
            setIsDetailsModalOpen(false);
        },
        onError: (err: any) => {
            notify.error(err.message || 'Failed to send negotiation');
        }
    });

    const formatValue = (value: number) => {
        return `₦${(value || 0).toLocaleString()}`;
    };

    const filteredQuotes = (quotes || []).filter((q: any) => {
        const matchesSearch =
            q.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.product?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleSendNegotiation = () => {
        if (!negotiationPrice || isNaN(parseFloat(negotiationPrice))) {
            notify.error('Please enter a valid price');
            return;
        }

        negotiateMutation.mutate({
            id: selectedQuote.id,
            data: {
                priceOffered: parseFloat(negotiationPrice),
                message: negotiationMessage,
                isNegotiable: true
            }
        });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 text-primary mb-2">
                        <FileText size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Marketplace Leads</span>
                    </div>
                    <h1 className="text-4xl font-display font-bold text-text-main">Quote Requests</h1>
                </div>
                <div className="flex gap-4">
                    <button className="h-12 px-6 bg-white border border-gray-200 text-text-main rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2">
                        <Filter size={18} /> Filters
                    </button>
                    <button
                        onClick={() => notify.info('Exporting quote data...')}
                        className="h-12 px-6 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <ArrowUpRight size={18} /> Export
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by ID, business or product..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold text-text-main outline-none focus:ring-4 focus:ring-primary/5 cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Admin_Offered">Negotiating</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] font-black uppercase tracking-widest text-text-secondary border-b border-gray-100 bg-gray-50/50">
                                <th className="px-8 py-6">Product</th>
                                <th className="px-8 py-6">Reference</th>
                                <th className="px-8 py-6">Business & Contact</th>
                                <th className="px-8 py-6">Quantity</th>
                                <th className="px-8 py-6">Offer Price</th>
                                <th className="px-8 py-6">Status</th>
                                <th className="px-8 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-8 py-8 h-20 bg-gray-50/20"></td>
                                    </tr>
                                ))
                            ) : filteredQuotes.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-8 py-20 text-center text-text-secondary font-bold">
                                        No quote requests found
                                    </td>
                                </tr>
                            ) : (
                                filteredQuotes.map((quote: any) => (
                                    <tr key={quote.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-50">
                                                    {quote.product?.image && (
                                                        <img src={quote.product.image} className="object-cover w-full h-full" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-text-main">{quote.product?.name || 'Hardware Product'}</span>
                                                    <span className="text-xs font-mono text-text-secondary">ID: {quote.productId?.split('-')[0]}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-mono font-bold text-slate-400">#{quote.id?.split('-')[0].toUpperCase()}</span>
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase mt-1">
                                                <Clock size={10} /> {formatDistanceToNow(new Date(quote.createdAt))} ago
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-text-main">{quote.businessName || 'N/A'}</span>
                                                <span className="text-xs font-medium text-text-secondary mt-0.5">{quote.location}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-bold text-text-main">
                                            {quote.quantity} units
                                        </td>
                                        <td className="px-8 py-6 text-sm font-black text-text-main">
                                            {quote.currentPrice ? formatValue(quote.currentPrice) : 'Pending Offer'}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${quote.status === 'Pending' ? 'bg-orange-50 text-orange-600' :
                                                quote.status === 'Admin_Offered' ? 'bg-blue-50 text-blue-600' :
                                                    quote.status === 'Approved' ? 'bg-green-50 text-green-600' :
                                                        'bg-gray-100 text-gray-500'
                                                }`}>
                                                {quote.status?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => { setSelectedQuote(quote); setIsDetailsModalOpen(true); }}
                                                className="p-2 hover:bg-white border-2 border-transparent hover:border-gray-100 rounded-xl transition-all text-slate-400 hover:text-text-main active:scale-95"
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

            {selectedQuote && (
                <Modal
                    isOpen={isDetailsModalOpen}
                    onClose={() => {
                        setIsDetailsModalOpen(false);
                        setShowNegotiationForm(false);
                    }}
                    title="Quote Details"
                    description={`Reference: #${selectedQuote.id}`}
                    size="2xl"
                >
                    <div className="space-y-8 py-4">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-white">
                                {selectedQuote.product?.image && (
                                    <img src={selectedQuote.product.image} className="object-cover w-full h-full" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-lg font-black text-text-main">{selectedQuote.product?.name}</p>
                                <p className="text-xs font-mono text-text-secondary">Product ID: {selectedQuote.productId}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2">
                                        <Building2 size={12} /> Entity Information
                                    </label>
                                    <p className="text-lg font-black text-text-main">{selectedQuote.businessName || 'N/A'}</p>
                                    <p className="text-sm font-medium text-text-secondary">Location: {selectedQuote.location}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2">
                                        <Package size={12} /> Order Details
                                    </label>
                                    <p className="text-sm font-medium text-text-secondary">Quantity: {selectedQuote.quantity} units</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col justify-center text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Current Offer</p>
                                <h4 className="text-4xl font-display font-black text-primary">
                                    {selectedQuote.currentPrice ? formatValue(selectedQuote.currentPrice) : 'N/A'}
                                </h4>
                                <p className="text-xs font-bold text-text-secondary mt-2">Negotiable: {selectedQuote.isNegotiable ? 'Yes' : 'No'}</p>
                            </div>
                        </div>

                        {selectedQuote.notes && (
                            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                                <h5 className="font-bold text-text-main mb-3 flex items-center gap-2">
                                    <MessageSquare size={18} className="text-primary" />
                                    Customer Notes
                                </h5>
                                <p className="text-sm text-text-secondary leading-relaxed font-medium">
                                    "{selectedQuote.notes}"
                                </p>
                            </div>
                        )}

                        {showNegotiationForm ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 p-6 bg-gray-50 rounded-2xl border border-gray-200">
                                <h5 className="font-bold text-text-main">Send Counter Offer</h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-text-secondary">Proposed Unit Price</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold"><TbCurrencyNaira /></span>
                                            <input
                                                type="number"
                                                value={negotiationPrice}
                                                onChange={(e) => setNegotiationPrice(e.target.value)}
                                                className="w-full pl-8 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                                                placeholder="e.g. 850"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-text-secondary">Message to Customer</label>
                                        <input
                                            type="text"
                                            value={negotiationMessage}
                                            onChange={(e) => setNegotiationMessage(e.target.value)}
                                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium"
                                            placeholder="Special bulk price for you..."
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSendNegotiation}
                                        disabled={negotiateMutation.isPending}
                                        className="flex-1 h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {negotiateMutation.isPending ? <Loader2 className="animate-spin" /> : 'Send Offer'}
                                    </button>
                                    <button
                                        onClick={() => setShowNegotiationForm(false)}
                                        className="px-6 h-12 bg-white border border-gray-200 text-text-main font-bold rounded-xl"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => {
                                        setNegotiationPrice(selectedQuote.currentPrice?.toString() || '');
                                        setShowNegotiationForm(true);
                                    }}
                                    className="flex-1 h-14 border border-gray-200 text-text-main font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <TbCurrencyNaira size={20} /> Send Counter Offer
                                </button>
                                <button
                                    onClick={() => notify.info('This feature is managed by the customer/owner')}
                                    className="flex-1 h-14 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={18} /> Await Customer Acceptance
                                </button>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}
