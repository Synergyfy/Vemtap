'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Notification from '@/components/ui/Notification';
import { adminBusinessesApi } from '@/lib/api/admin';
import { notify } from '@/lib/notify';
import { Loader2, Search, Store, Ban, ShieldCheck, Info, Trash2, CheckCircle, RotateCcw, XCircle } from 'lucide-react';

export default function AdminSuspendedBusinessesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Confirmation Modal State
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'reactivate' | 'delete' | null>(null);
    const [confirmReason, setConfirmReason] = useState('');
    const [selectedBusiness, setSelectedBusiness] = useState<{ id: string; name: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchSuspendedBusinesses = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await adminBusinessesApi.getAll({
                search: searchQuery || undefined,
                status: 'suspended',
            });
            const bizList = Array.isArray(data) ? data : (data.data || data.businesses || []);
            setBusinesses(bizList);
        } catch (err: any) {
            notify.error(err.message || 'Failed to load suspended businesses');
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        fetchSuspendedBusinesses();
    }, [fetchSuspendedBusinesses]);

    const handleReactivate = (id: string, name: string) => {
        setSelectedBusiness({ id, name });
        setConfirmAction('reactivate');
        setConfirmReason('');
        setIsConfirmModalOpen(true);
    };

    const handleDelete = (id: string, name: string) => {
        setSelectedBusiness({ id, name });
        setConfirmAction('delete');
        setConfirmReason('');
        setIsConfirmModalOpen(true);
    };

    const executeAction = async () => {
        if (!selectedBusiness || !confirmAction) return;

        setIsSubmitting(true);
        try {
            if (confirmAction === 'reactivate') {
                await adminBusinessesApi.reactivate(selectedBusiness.id);
                notify.success(`${selectedBusiness.name} has been reactivated.`);
            } else if (confirmAction === 'delete') {
                await adminBusinessesApi.delete(selectedBusiness.id);
                notify.success(`${selectedBusiness.name} deleted successfully`);
            }
            setIsConfirmModalOpen(false);
            fetchSuspendedBusinesses();
        } catch (err: any) {
            notify.error(err.message || 'Action failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-text-main mb-2">Suspended Businesses</h1>
                    <p className="text-text-secondary font-medium">Manage accounts with restricted access</p>
                </div>
            </div>

            {/* Warning Banner using Notification Component */}
            <Notification
                type="error"
                title="Action Required"
                message="These businesses are currently blocked from accessing the platform. Resolving their status will restore their access immediately."
                className="mb-8"
            />

            {/* Search */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6 font-medium">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search suspended businesses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none"
                    />
                </div>
            </div>

            {/* Suspended List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr className="text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                <th className="py-4 px-6">Business</th>
                                <th className="py-4 px-6">Owner</th>
                                <th className="py-4 px-6">Reason</th>
                                <th className="py-4 px-6">Balance</th>
                                <th className="py-4 px-6">Date</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <Loader2 className="animate-spin text-primary mx-auto mb-4" size={40} />
                                        <p className="text-text-secondary font-medium">Loading suspended businesses...</p>
                                    </td>
                                </tr>
                            ) : businesses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <Store className="mx-auto text-gray-300 mb-4" size={48} />
                                        <p className="text-text-secondary font-medium">No suspended businesses found</p>
                                    </td>
                                </tr>
                            ) : (
                                businesses.map((biz) => (
                                    <tr key={biz.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                                                    <Ban size={18} />
                                                </div>
                                                <span className="font-bold text-sm text-text-main line-clamp-1">{biz.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm">
                                                <p className="font-bold text-text-main truncate max-w-[150px]">{biz.owner ? `${biz.owner.firstName} ${biz.owner.lastName}` : biz.email}</p>
                                                <p className="text-text-secondary text-xs truncate max-w-[150px]">{biz.email}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700">
                                                {biz.suspensionReason || 'Violation'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 font-mono font-bold text-sm text-text-main">
                                            ₦0
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="text-sm font-bold text-text-main">{new Date(biz.updatedAt).toLocaleDateString()}</p>
                                            <p className="text-[10px] text-text-secondary font-black uppercase tracking-tight">Last Updated</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => handleReactivate(biz.id, biz.name)}
                                                    className="px-4 py-2 bg-green-500 text-white font-black uppercase tracking-widest text-[10px] rounded-lg hover:bg-green-600 transition-all shadow-lg shadow-green-100 flex items-center gap-1.5"
                                                >
                                                    <ShieldCheck size={14} />
                                                    Reactivate
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(biz.id, biz.name)}
                                                    className="p-2 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-gray-100"
                                                    title="Delete Permanently"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Confirmation Modal */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => !isSubmitting && setIsConfirmModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${confirmAction === 'delete' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                }`}>
                                {confirmAction === 'delete' ? <Trash2 size={24} /> : <RotateCcw size={24} />}
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-text-main capitalize">{confirmAction} Business</h2>
                                <p className="text-sm text-text-secondary font-medium">Please confirm this action</p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <p className="text-sm text-text-secondary leading-relaxed">
                                Are you sure you want to <span className="font-bold text-text-main italic">{confirmAction}</span> <strong>"{selectedBusiness?.name}"</strong>?
                                {confirmAction === 'delete' && " This action cannot be undone."}
                            </p>

                            {confirmAction === 'delete' && (
                                <div className="mt-6">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">
                                        Reason for deletion
                                    </label>
                                    <textarea
                                        value={confirmReason}
                                        onChange={(e) => setConfirmReason(e.target.value)}
                                        placeholder={`Please state why you are deleting this business...`}
                                        className="w-full h-24 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all resize-none"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsConfirmModalOpen(false)}
                                disabled={isSubmitting}
                                className="flex-1 h-12 bg-gray-100 text-text-secondary font-bold rounded-xl hover:bg-gray-200 transition-all text-sm disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeAction}
                                disabled={isSubmitting || (confirmAction === 'delete' && !confirmReason.trim())}
                                className={`flex-1 h-12 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm active:scale-95 disabled:opacity-70 ${confirmAction === 'delete' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-primary hover:bg-primary-hover shadow-primary/20'
                                    }`}
                            >
                                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                Confirm {confirmAction}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

