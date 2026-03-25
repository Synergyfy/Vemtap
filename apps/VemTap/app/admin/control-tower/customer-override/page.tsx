'use client';

import React, { useMemo, useState } from 'react';
import { Search, ShieldCheck, LogIn } from 'lucide-react';
import { useControlTowerCustomers, useExecuteCustomerSudoAction } from '@/services/control-tower/hooks';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CustomerOverridePage() {
    const [query, setQuery] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [uid, setUid] = useState('');

    const debouncedQuery = useDebounce(query, 500);
    const debouncedName = useDebounce(name, 500);
    const debouncedEmail = useDebounce(email, 500);
    const debouncedUid = useDebounce(uid, 500);

    const { data: customers, isLoading } = useControlTowerCustomers({
        query: debouncedQuery,
        limit: 10,
    });

    const executeSudo = useExecuteCustomerSudoAction();
    const startImpersonation = useAuthStore(s => s.startImpersonation);
    const router = useRouter();

    const handleSudoLogin = async (customer: any) => {
        try {
            // Use direct UID-based impersonation via headers as requested
            startImpersonation(customer.uid, 'customer');
            router.push(`/customer/dashboard?admin_mode=1&customer_uid=${encodeURIComponent(customer.uid)}&business_uid=${encodeURIComponent(customer.businessUid)}`);
            toast.success(`Successfully impersonating ${customer.name} via header auth`);
        } catch (err: any) {
            toast.error(err.message || 'Sudo login failed');
        }
    };

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

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-display"
                        placeholder="Search by Name, Email, UUID, or Phone..."
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Recent Customer Records</p>
                    {isLoading && <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Filtering...</p>}
                </div>
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Customer Info</th>
                            <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Email</th>
                            <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Business UID</th>
                            <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Visits</th>
                            <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {customers?.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-sm text-text-secondary italic">No customers found matching your search</td>
                            </tr>
                        ) : (
                            customers?.map((customer) => (
                                <tr
                                    key={customer.uid}
                                    className="hover:bg-gray-50 transition-colors group"
                                >
                                    <td className="py-4 px-6">
                                        <p className="font-bold text-sm text-text-main">{customer.name}</p>
                                        <p className="text-[10px] text-text-secondary font-mono mt-0.5">{customer.uid}</p>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-text-secondary truncate max-w-[150px]">{customer.email || 'N/A'}</td>
                                    <td className="py-4 px-6 text-[10px] font-bold text-text-secondary font-mono">{customer.businessUid}</td>
                                    <td className="py-4 px-6 text-sm text-text-main font-bold">{customer.visits}</td>
                                    <td className="py-4 px-6 text-right">
                                        <button
                                            onClick={() => handleSudoLogin(customer)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-md shadow-primary/10 active:scale-95 disabled:opacity-50"
                                        >
                                            <LogIn size={14} />
                                            Sudo Login
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
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
