'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ShieldCheck, LogIn } from 'lucide-react';
import { useControlTowerBusinesses } from '@/services/control-tower/hooks';
import { useDebounce } from '@/hooks/useDebounce';

export default function BusinessOverridePage() {
    const [businessQuery, setBusinessQuery] = useState('');
    const debouncedBusinessQuery = useDebounce(businessQuery, 500);
    const { data: businesses, isLoading: isLoadingBusinesses } = useControlTowerBusinesses({
        query: debouncedBusinessQuery,
        limit: 10,
    });

    return (
        <div className="p-4 md:p-8 space-y-10">
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Control Tower</p>
                <h1 className="text-3xl font-display font-bold text-text-main mt-1">Business Override</h1>
                <p className="text-sm text-text-secondary font-medium mt-1">Search and run major business workflows in admin mode.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                    <ShieldCheck size={18} className="text-blue-600 mt-0.5" />
                    <div>
                        <p className="text-xs text-blue-900 font-bold">Authorized Dashboard Access</p>
                        <p className="text-xs text-blue-800 font-medium mt-0.5">Logging into a business dashboard as sudo grants full access for 15 minutes. All actions are logged.</p>
                    </div>
                </div>
            </div>

            {/* Business Section */}
            <div className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                    <div className="flex-1">
                        <h2 className="text-xl font-display font-bold text-text-main">Search Businesses</h2>
                        <div className="relative mt-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                value={businessQuery}
                                onChange={(e) => setBusinessQuery(e.target.value)}
                                className="w-full h-12 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                placeholder="Search business by name, owner, or UID..."
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 border-b border-gray-200">
                            <tr>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Business Info</th>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Users</th>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Status</th>
                                <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoadingBusinesses ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-sm text-text-secondary italic">Loading businesses...</td>
                                </tr>
                            ) : businesses?.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-sm text-text-secondary italic">No businesses found</td>
                                </tr>
                            ) : (
                                businesses?.map((biz) => (
                                    <tr
                                        key={biz.uid}
                                        className="hover:bg-gray-50/50 transition-colors group"
                                    >
                                        <td className="py-4 px-6">
                                            <p className="font-bold text-sm text-text-main">{biz.name}</p>
                                            <p className="text-[10px] text-text-secondary font-mono mt-0.5">{biz.uid} • {biz.owner}</p>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-bold text-text-main">{biz.users}</td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${biz.status === 'active' ? 'bg-green-50 text-green-600' : biz.status === 'suspended' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700'}`}>
                                                {biz.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <Link
                                                href={`/dashboard?admin_mode=1&business_uid=${encodeURIComponent(biz.uid)}`}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-md shadow-primary/10 active:scale-95"
                                            >
                                                <LogIn size={14} />
                                                Sudo Login
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-gray-100/50 rounded-xl p-6 border border-dashed border-gray-200 mt-8">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest text-center">
                    Customer Overrides are managed separately in the Customer Control Tower.
                </p>
            </div>
        </div>
    );
}
