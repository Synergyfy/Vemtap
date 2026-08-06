'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useQuoteStore, Quote } from '@/store/quoteStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ShieldCheck, Plus, Search, Building2, Package, Hash, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { adminNfcGrantsApi } from '@/lib/api/admin';

export default function AdminNfcGrantsPage() {
    const { user } = useAuthStore();
    const { quotes, addQuote, updateQuoteStatus } = useQuoteStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddingGrant, setIsAddingGrant] = useState(false);
    const [grantLoading, setGrantLoading] = useState(false);

    // Form state
    const [grantForm, setGrantForm] = useState({
        businessId: '',
        businessName: '',
        quantity: 10,
        grantType: 'MANUAL_GRANT',
        notes: '',
    });

    const handleAddGrant = async (e: React.FormEvent) => {
        e.preventDefault();
        setGrantLoading(true);
        try {
            const result = await adminNfcGrantsApi.grant({
                businessId: grantForm.businessId,
                quantity: grantForm.quantity,
                grantType: grantForm.grantType || undefined,
                notes: grantForm.notes || undefined,
            });

            const newQuote: Quote = {
                id: result?.auditLogId || `GRANT-${Date.now()}`,
                businessId: grantForm.businessId,
                businessName: grantForm.businessName,
                productId: 'nfc-credit',
                productName: 'NFC Asset Credit',
                productImage: '',
                firstName: 'Admin',
                lastName: 'Grant',
                email: 'admin@vemtap.com',
                phone: '',
                company: grantForm.businessName,
                quantity: grantForm.quantity,
                message: grantForm.notes || 'Manual Administrative Grant',
                estimatedValue: 0,
                status: 'Approved',
                createdAt: new Date(result?.timestamp || Date.now()),
                nfcLinksGenerated: 0
            };

            addQuote(newQuote);
            toast.success(`Granted ${grantForm.quantity} NFC units to ${grantForm.businessName}`);
            setIsAddingGrant(false);
            setGrantForm({ businessId: '', businessName: '', quantity: 10, grantType: 'MANUAL_GRANT', notes: '' });
        } catch (err: any) {
            toast.error(err.message || 'Failed to grant NFC quota');
        } finally {
            setGrantLoading(false);
        }
    };

    const adminQuotes = quotes.filter(q =>
        (q.businessName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (q.businessId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <PageHeader
                title="Admin NFC Quota Management"
                description="Manually grant or manage NFC asset quotas for businesses."
            />

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by business name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 bg-white border border-gray-200 rounded-xl pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
                <button
                    onClick={() => setIsAddingGrant(true)}
                    className="h-12 px-6 bg-primary text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus size={18} />
                    New Quota Grant
                </button>
            </div>

            <AnimatePresence>
                {isAddingGrant && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white border border-primary/20 rounded-3xl p-8 shadow-xl"
                    >
                        <form onSubmit={handleAddGrant} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Business Name</label>
                                <div className="relative">
                                    <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        required
                                        type="text"
                                        value={grantForm.businessName}
                                        onChange={(e) => setGrantForm({ ...grantForm, businessName: e.target.value })}
                                        className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/20"
                                        placeholder="e.g. Acme Corp"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Business ID</label>
                                <div className="relative">
                                    <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        required
                                        type="text"
                                        value={grantForm.businessId}
                                        onChange={(e) => setGrantForm({ ...grantForm, businessId: e.target.value })}
                                        className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/20"
                                        placeholder="UUID"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Quantity</label>
                                <div className="relative">
                                    <Package size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        value={grantForm.quantity}
                                        onChange={(e) => setGrantForm({ ...grantForm, quantity: parseInt(e.target.value) || 1 })}
                                        className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Notes</label>
                                <input
                                    type="text"
                                    value={grantForm.notes}
                                    onChange={(e) => setGrantForm({ ...grantForm, notes: e.target.value })}
                                    className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/20"
                                    placeholder="Optional memo"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={grantLoading}
                                    className="flex-1 h-12 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {grantLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                    Confirm
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingGrant(false)}
                                    className="h-12 px-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <th className="px-8 py-5">Business</th>
                            <th className="px-8 py-5">Product/Source</th>
                            <th className="px-8 py-5">Allocation</th>
                            <th className="px-8 py-5">Status</th>
                            <th className="px-8 py-5">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {adminQuotes.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center gap-3 text-gray-400">
                                        <AlertCircle size={40} strokeWidth={1.5} />
                                        <p className="font-medium">No quota allocations found matching your search.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            adminQuotes.map((quote) => (
                                <tr key={quote.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div>
                                            <p className="font-bold text-slate-900">{quote.businessName}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">{quote.businessId}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">{quote.productName}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">Ref: {quote.id}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-slate-900">{quote.quantity} units</span>
                                            <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full"
                                                    style={{ width: `${Math.min(((quote.nfcLinksGenerated || 0) / quote.quantity) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400">{quote.nfcLinksGenerated || 0} used</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${quote.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            <ShieldCheck size={12} />
                                            {quote.status}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-slate-500 text-xs font-medium">
                                        {new Date(quote.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
