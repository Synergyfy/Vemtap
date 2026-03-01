'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ShieldCheck } from 'lucide-react';
import SudoActionPanel from '@/components/admin/control-tower/SudoActionPanel';
import {
    customerControlRecords,
    getCustomerSudoActions,
} from '@/components/admin/control-tower/mockControlTowerData';

export default function CustomerOverridePage() {
    const [query, setQuery] = useState('');
    const [customerUid, setCustomerUid] = useState('cus_8801');
    const [businessUid, setBusinessUid] = useState('biz_102');
    const [ticketId, setTicketId] = useState('');

    const filteredCustomers = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return customerControlRecords;
        return customerControlRecords.filter((customer) =>
            customer.uid.toLowerCase().includes(term) ||
            customer.name.toLowerCase().includes(term) ||
            customer.businessUid.toLowerCase().includes(term) ||
            customer.businessName.toLowerCase().includes(term)
        );
    }, [query]);
    const visibleCustomers = filteredCustomers.slice(0, 5);

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Control Tower</p>
                <h1 className="text-3xl font-display font-bold text-text-main mt-1">Customer Override</h1>
                <p className="text-sm text-text-secondary font-medium mt-1">Run customer-level support actions as sudo from admin using customer UID and ticket reference.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Search customer by UID, name, or business..."
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Customer UID</label>
                        <input
                            value={customerUid}
                            onChange={(e) => setCustomerUid(e.target.value)}
                            className="mt-1 w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Business UID</label>
                        <input
                            value={businessUid}
                            onChange={(e) => setBusinessUid(e.target.value)}
                            className="mt-1 w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Ticket / Complaint Ref</label>
                        <input
                            value={ticketId}
                            onChange={(e) => setTicketId(e.target.value)}
                            className="mt-1 w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="e.g. TKT-9912"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Showing latest 5 customers</p>
                </div>
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Customer</th>
                            <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Business UID</th>
                            <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Tier</th>
                            <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Visits</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {visibleCustomers.map((customer) => (
                            <tr
                                key={customer.uid}
                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => {
                                    setCustomerUid(customer.uid);
                                    setBusinessUid(customer.businessUid);
                                }}
                            >
                                <td className="py-4 px-6">
                                    <p className="font-bold text-sm text-text-main">{customer.name}</p>
                                    <p className="text-xs text-text-secondary">{customer.uid}</p>
                                </td>
                                <td className="py-4 px-6 text-sm font-bold text-text-main">{customer.businessUid}</td>
                                <td className="py-4 px-6 text-sm text-text-main font-medium">{customer.tier}</td>
                                <td className="py-4 px-6 text-sm text-text-main font-bold">{customer.visits}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <SudoActionPanel
                title="Customer Sudo Actions"
                subtitle="Run customer-side operations from admin for support resolution."
                subjectLabel="Customer UID"
                subjectUid={customerUid}
                ticketId={ticketId}
                actions={getCustomerSudoActions()}
            />

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-bold text-text-main">Optional modeling only:</p>
                <p className="text-xs text-text-secondary mt-1">Open customer dashboard to reproduce UI flow if needed.</p>
                <Link
                    href={`/customer/dashboard?admin_mode=1&customer_uid=${encodeURIComponent(customerUid)}&business_uid=${encodeURIComponent(businessUid)}`}
                    className="inline-flex mt-3 text-xs font-bold text-primary hover:underline"
                >
                    Open Customer Dashboard (Modeling)
                </Link>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck size={18} className="text-blue-600 mt-0.5" />
                <p className="text-xs text-blue-900 font-medium">This is a mock sudo surface: actions run in admin context on behalf of customers.</p>
            </div>
        </div>
    );
}
