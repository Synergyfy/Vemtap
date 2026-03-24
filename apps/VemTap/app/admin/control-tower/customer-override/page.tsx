'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ShieldCheck, LogIn } from 'lucide-react';
import { useControlTowerCustomers } from '@/services/control-tower/hooks';
import { useDebounce } from '@/hooks/useDebounce';

export default function CustomerOverridePage() {
    const [query, setQuery] = useState('');
    const { data: customers, isLoading } = useControlTowerCustomers({
        query: query,
        limit: 10,
    });

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Control Tower</p>
                <h1 className="text-3xl font-display font-bold text-text-main mt-1">Customer Override</h1>
                <p className="text-sm text-text-secondary font-medium mt-1">Run customer-level support actions as sudo from admin using customer UID and ticket reference.</p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck size={18} className="text-blue-600 mt-0.5" />
                <div>
                    <p className="text-xs text-blue-900 font-bold">Authorized Customer Access</p>
                    <p className="text-xs text-blue-800 font-medium mt-0.5">Logging into a customer dashboard as sudo grants full visibility for 15 minutes. All actions are logged.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Search customer by UID, name, or business..."
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Showing latest 5 customers</p>
                    {isLoading && <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Loading...</p>}
                </div>
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Customer</th>
                            <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Business UID</th>
                            <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Tier</th>
                            <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Visits</th>
                            <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {customers?.map((customer) => (
                            <tr
                                key={customer.uid}
                                className="hover:bg-gray-50 transition-colors group"
                            >
                                <td className="py-4 px-6">
                                    <p className="font-bold text-sm text-text-main">{customer.name}</p>
                                    <p className="text-xs text-text-secondary font-mono mt-0.5">{customer.uid}</p>
                                </td>
                                <td className="py-4 px-6 text-sm font-bold text-text-main">{customer.businessUid}</td>
                                <td className="py-4 px-6">
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                                        {customer.tier}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-sm text-text-main font-bold">{customer.visits}</td>
                                <td className="py-4 px-6 text-right">
                                    <Link
                                        href={`/customer/dashboard?admin_mode=1&customer_uid=${encodeURIComponent(customer.uid)}&business_uid=${encodeURIComponent(customer.businessUid)}`}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-md shadow-primary/10 active:scale-95"
                                    >
                                        <LogIn size={14} />
                                        Sudo Login
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-gray-100/50 rounded-xl p-6 border border-dashed border-gray-200">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest text-center">
                    All administrative actions performed during a sudo session are logged for audit purposes.
                </p>
            </div>
        </div>
    );
}
