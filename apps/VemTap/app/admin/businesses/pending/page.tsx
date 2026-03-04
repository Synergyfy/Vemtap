'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { adminBusinessesApi } from '@/lib/api/admin';
import { notify } from '@/lib/notify';
import { Loader2, Store, Search, Calendar, FileText, ClipboardList, Clock, CheckCircle, Trash2, Ban, RotateCcw, XCircle } from 'lucide-react';

export default function AdminPendingBusinessesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        pendingCount: 0,
        approvedToday: 0,
        avgWaitTime: '—'
    });

    // Confirmation Modal State
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
    const [confirmReason, setConfirmReason] = useState('');
    const [selectedBusiness, setSelectedBusiness] = useState<{ id: string; name: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchPendingBusinesses = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await adminBusinessesApi.getAll({
                search: searchQuery || undefined,
                status: 'pending',
            });
            const bizList = Array.isArray(data) ? data : (data.data || []);
            setBusinesses(bizList);
            setStats(prev => ({
                ...prev,
                pendingCount: data.stats?.pending ?? bizList.length,
                approvedToday: data.stats?.approvedToday ?? 0,
                avgWaitTime: data.stats?.avgWaitTime ? `${data.stats.avgWaitTime} Hours` : prev.avgWaitTime
            }));
        } catch (err: any) {
            notify.error(err.message || 'Failed to load pending businesses');
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        fetchPendingBusinesses();
    }, [fetchPendingBusinesses]);

    const handleApprove = (id: string, name: string) => {
        setSelectedBusiness({ id, name });
        setConfirmAction('approve');
        setConfirmReason('');
        setIsConfirmModalOpen(true);
    };

    const handleReject = (id: string, name: string) => {
        setSelectedBusiness({ id, name });
        setConfirmAction('reject');
        setConfirmReason('');
        setIsConfirmModalOpen(true);
    };

    const executeAction = async () => {
        if (!selectedBusiness || !confirmAction) return;

        setIsSubmitting(true);
        try {
            if (confirmAction === 'approve') {
                await adminBusinessesApi.approve(selectedBusiness.id);
                notify.success(`${selectedBusiness.name} approved successfully`);
            } else if (confirmAction === 'reject') {
                await adminBusinessesApi.reject(selectedBusiness.id);
                notify.success(`${selectedBusiness.name} rejected`);
            }
            setIsConfirmModalOpen(false);
            fetchPendingBusinesses();
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
                    <h1 className="text-3xl font-display font-bold text-text-main mb-2">Pending Approvals</h1>
                    <p className="text-text-secondary font-medium">Review and verify new business registrations</p>
                </div>
            </div>

            {/* Queue Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                            <ClipboardList size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">In Queue</p>
                            <p className="text-2xl font-display font-bold text-text-main">{stats.pendingCount} Requests</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">Avg. Wait Time</p>
                            <p className="text-2xl font-display font-bold text-text-main">{stats.avgWaitTime}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">Approved Today</p>
                            <p className="text-2xl font-display font-bold text-text-main">{stats.approvedToday} Businesses</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search pending applications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-medium"
                    />
                </div>
            </div>

            {/* Applications List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100">
                        <Loader2 className="animate-spin text-primary mb-4" size={40} />
                        <p className="text-text-secondary font-medium">Loading pending applications...</p>
                    </div>
                ) : businesses.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                        <Store className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-text-secondary font-medium">No pending applications found</p>
                    </div>
                ) : (
                    businesses.map((biz) => (
                        <div key={biz.id} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Store className="text-primary" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-text-main">{biz.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-text-secondary mb-1">
                                        <span className="font-medium text-text-main">{biz.owner ? `${biz.owner.firstName} ${biz.owner.lastName}` : biz.email}</span>
                                        <span>•</span>
                                        <span>{biz.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-text-secondary bg-gray-100 px-2 py-1 rounded">
                                            {biz.category || 'Business'}
                                        </span>
                                        <span className="text-xs text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded flex items-center gap-1">
                                            <Calendar size={12} />
                                            Submitted {new Date(biz.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <p className="text-xs font-bold text-text-secondary mb-1">Required Documents</p>
                                <div className="flex gap-2">
                                    {/* Backend usually doesn't have documents array yet, so showing placeholders if empty */}
                                    {(biz.documents || ['Business License', 'ID Card']).map((doc: string, idx: number) => (
                                        <span key={idx} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold border border-blue-100 cursor-pointer hover:bg-blue-100">
                                            <FileText size={12} />
                                            {doc}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 w-full md:w-auto mt-4 md:mt-0 justify-end">
                                <button
                                    onClick={() => handleReject(biz.id, biz.name)}
                                    className="px-4 py-2 border border-red-200 text-red-600 font-bold rounded-lg text-sm hover:bg-red-50 transition-colors"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleApprove(biz.id, biz.name)}
                                    className="px-6 py-2 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
                                >
                                    Approve Application
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {/* Confirmation Modal */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => !isSubmitting && setIsConfirmModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${confirmAction === 'reject' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                }`}>
                                {confirmAction === 'reject' ? <XCircle size={24} /> : <CheckCircle size={24} />}
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-text-main capitalize">{confirmAction} Business</h2>
                                <p className="text-sm text-text-secondary font-medium">Please confirm this action</p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <p className="text-sm text-text-secondary leading-relaxed">
                                Are you sure you want to <span className="font-bold text-text-main italic">{confirmAction}</span> <strong>"{selectedBusiness?.name}"</strong>?
                            </p>

                            {confirmAction === 'reject' && (
                                <div className="mt-6">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">
                                        Reason for rejection
                                    </label>
                                    <textarea
                                        value={confirmReason}
                                        onChange={(e) => setConfirmReason(e.target.value)}
                                        placeholder={`Please state why you are rejecting this business...`}
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
                                disabled={isSubmitting}
                                className={`flex-1 h-12 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm active:scale-95 disabled:opacity-70 ${confirmAction === 'reject' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-primary hover:bg-primary-hover shadow-primary/20'
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

