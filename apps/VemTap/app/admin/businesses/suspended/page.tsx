'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Notification from '@/components/ui/Notification';
import { adminBusinessesApi } from '@/lib/api/admin';
import { notify } from '@/lib/notify';
import { Loader2, Search, Store, Ban, ShieldCheck, Info } from 'lucide-react';

export default function AdminSuspendedBusinessesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSuspendedBusinesses = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await adminBusinessesApi.getAll({
                search: searchQuery || undefined,
                status: 'Suspended',
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

    const handleReactivate = async (id: string, name: string) => {
        try {
            await adminBusinessesApi.reactivate(id);
            notify.success(`${name} has been reactivated.`);
            fetchSuspendedBusinesses();
        } catch (err: any) {
            notify.error(err.message || `Failed to reactivate ${name}`);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to PERMANENTLY delete ${name}? This action cannot be undone.`)) return;
        try {
            await adminBusinessesApi.delete(id);
            notify.success(`${name} deleted successfully`);
            fetchSuspendedBusinesses();
        } catch (err: any) {
            notify.error(err.message || `Failed to delete ${name}`);
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
                                                    <Ban size={16} />
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
        </div>
    );
}

