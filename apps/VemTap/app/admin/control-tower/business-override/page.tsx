'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ShieldCheck, ArrowRightLeft, KeyRound, Power } from 'lucide-react';
import SudoActionPanel from '@/components/admin/control-tower/SudoActionPanel';
import {
    getBusinessSudoActions,
    getCustomerSudoActions,
} from '@/lib/constants/controlTowerActions';
import { useControlTowerBusinesses, useExecuteBusinessSudoAction, useControlTowerCustomers, useExecuteCustomerSudoAction } from '@/services/control-tower/hooks';
import { notify } from '@/lib/notify';
import { useDebounce } from '@/hooks/useDebounce';


export default function BusinessOverridePage() {
    const [businessQuery, setBusinessQuery] = useState('');
    const debouncedBusinessQuery = useDebounce(businessQuery, 500);
    const [selectedBusinessUid, setSelectedBusinessUid] = useState('');
    const [customerQuery, setCustomerQuery] = useState('');
    const debouncedCustomerQuery = useDebounce(customerQuery, 500);
    const [selectedCustomerUid, setSelectedCustomerUid] = useState('');
    const [ticketId, setTicketId] = useState('');

    const { data: businesses, isLoading: isLoadingBusinesses } = useControlTowerBusinesses({
        query: debouncedBusinessQuery,
        limit: 10,
    });

    const { data: customers, isLoading: isLoadingCustomers } = useControlTowerCustomers({
        query: debouncedCustomerQuery,
        limit: 10,
    });

    const executeBusinessSudo = useExecuteBusinessSudoAction();
    const executeCustomerSudo = useExecuteCustomerSudoAction();

    const handleBusinessAction = async (action: any, payload: any) => {
        if (!selectedBusinessUid) {
            notify.error('Please select a business first');
            return;
        }
        try {
            await executeBusinessSudo.mutateAsync({
                businessUid: selectedBusinessUid,
                ticketRef: ticketId || undefined,
                actionKey: action.key,
                payload,
            });
            notify.success(`Action ${action.label} executed successfully`);
        } catch (error: any) {
            notify.error(error.message || 'Action failed');
            throw error;
        }
    };

    const handleCustomerAction = async (action: any, payload: any) => {
        if (!selectedCustomerUid) {
            notify.error('Please select a customer first');
            return;
        }
        const customer = customers?.find(c => c.uid === selectedCustomerUid);
        if (!customer) return;

        try {
            await executeCustomerSudo.mutateAsync({
                customerUid: selectedCustomerUid,
                businessUid: customer.businessUid,
                ticketRef: ticketId || undefined,
                actionKey: action.key,
                payload,
            });
            notify.success(`Action ${action.label} executed successfully`);
        } catch (error: any) {
            notify.error(error.message || 'Action failed');
            throw error;
        }
    };



    return (
        <div className="p-4 md:p-8 space-y-10">
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Control Tower</p>
                <h1 className="text-3xl font-display font-bold text-text-main mt-1">Override Dashboard</h1>
                <p className="text-sm text-text-secondary font-medium mt-1">Search and run major business or customer workflows in admin mode.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Execution Context</label>
                    <div>
                        <label className="text-[10px] font-medium text-text-secondary mb-1 block">Ticket / Complaint Ref</label>
                        <input
                            value={ticketId}
                            onChange={(e) => setTicketId(e.target.value)}
                            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="e.g. TKT-9912"
                        />
                    </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                    <ShieldCheck size={18} className="text-blue-600 mt-0.5" />
                    <div>
                        <p className="text-xs text-blue-900 font-bold">Authorized Sudo Surface</p>
                        <p className="text-xs text-blue-800 font-medium mt-0.5">Actions run in admin context on behalf of customers/businesses. All changes are logged.</p>
                    </div>
                </div>
            </div>

            {/* Business Section */}
            <div className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                    <div className="flex-1">
                        <h2 className="text-xl font-display font-bold text-text-main">Business Override</h2>
                        <div className="relative mt-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                value={businessQuery}
                                onChange={(e) => setBusinessQuery(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="Search business by name, owner, or UID..."
                            />
                        </div>
                    </div>
                    <div className="w-64">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Selected Business</label>
                        <input
                            readOnly
                            value={selectedBusinessUid || 'None Selected'}
                            className="mt-1 w-full h-11 px-3 bg-gray-100 border border-gray-200 rounded-lg text-sm font-mono"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden h-fit">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-3 px-5 text-[10px] font-black uppercase tracking-wider text-text-secondary">Business</th>
                                    <th className="text-left py-3 px-5 text-[10px] font-black uppercase tracking-wider text-text-secondary">Users</th>
                                    <th className="text-left py-3 px-5 text-[10px] font-black uppercase tracking-wider text-text-secondary">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoadingBusinesses ? (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-sm text-text-secondary italic">Loading businesses...</td>
                                    </tr>
                                ) : businesses?.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-sm text-text-secondary italic">No businesses found</td>
                                    </tr>
                                ) : (
                                    businesses?.map((biz) => (
                                        <tr
                                            key={biz.uid}
                                            className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedBusinessUid === biz.uid ? 'bg-primary/5' : ''}`}
                                            onClick={() => setSelectedBusinessUid(biz.uid)}
                                        >
                                            <td className="py-3 px-5">
                                                <p className="font-bold text-sm text-text-main">{biz.name}</p>
                                                <p className="text-[10px] text-text-secondary font-mono">{biz.uid} • {biz.owner}</p>
                                            </td>
                                            <td className="py-3 px-5 text-sm font-bold text-text-main">{biz.users}</td>
                                            <td className="py-3 px-5">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${biz.status === 'active' ? 'bg-green-50 text-green-600' : biz.status === 'suspended' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700'}`}>
                                                    {biz.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="lg:col-span-1">
                        <SudoActionPanel
                            title="Business Sudo Actions"
                            subtitle="Run business-level operations directly."
                            subjectLabel="Business UID"
                            subjectUid={selectedBusinessUid}
                            ticketId={ticketId}
                            actions={getBusinessSudoActions()}
                            onAction={handleBusinessAction}
                            isLoading={executeBusinessSudo.isPending}
                        />
                    </div>
                </div>
            </div>

            <hr className="border-gray-100" />

            {/* Customer Section */}
            <div className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                    <div className="flex-1">
                        <h2 className="text-xl font-display font-bold text-text-main">Customer Override</h2>
                        <div className="relative mt-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                value={customerQuery}
                                onChange={(e) => setCustomerQuery(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="Search customer by name, email, or UID..."
                            />
                        </div>
                    </div>
                    <div className="w-64">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Selected Customer</label>
                        <input
                            readOnly
                            value={selectedCustomerUid || 'None Selected'}
                            className="mt-1 w-full h-11 px-3 bg-gray-100 border border-gray-200 rounded-lg text-sm font-mono"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden h-fit">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-3 px-5 text-[10px] font-black uppercase tracking-wider text-text-secondary">Customer</th>
                                    <th className="text-left py-3 px-5 text-[10px] font-black uppercase tracking-wider text-text-secondary">Business</th>
                                    <th className="text-left py-3 px-5 text-[10px] font-black uppercase tracking-wider text-text-secondary">Tier</th>
                                    <th className="text-left py-3 px-5 text-[10px] font-black uppercase tracking-wider text-text-secondary">Visits</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoadingCustomers ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-sm text-text-secondary italic">Loading customers...</td>
                                    </tr>
                                ) : customers?.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-sm text-text-secondary italic">No customers found</td>
                                    </tr>
                                ) : (
                                    customers?.map((cus) => (
                                        <tr
                                            key={cus.uid}
                                            className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedCustomerUid === cus.uid ? 'bg-primary/5' : ''}`}
                                            onClick={() => setSelectedCustomerUid(cus.uid)}
                                        >
                                            <td className="py-3 px-5">
                                                <p className="font-bold text-sm text-text-main">{cus.name}</p>
                                                <p className="text-[10px] text-text-secondary font-mono">{cus.uid}</p>
                                            </td>
                                            <td className="py-3 px-5">
                                                <p className="text-xs font-medium text-text-main">{cus.businessName}</p>
                                                <p className="text-[9px] text-text-secondary font-mono">{cus.businessUid}</p>
                                            </td>
                                            <td className="py-3 px-5">
                                                <span className="text-[10px] font-bold text-text-main">{cus.tier}</span>
                                            </td>
                                            <td className="py-3 px-5 text-sm font-bold text-text-main">{cus.visits}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="lg:col-span-1">
                        <SudoActionPanel
                            title="Customer Sudo Actions"
                            subtitle="Run customer-level operations directly."
                            subjectLabel="Customer UID"
                            subjectUid={selectedCustomerUid}
                            ticketId={ticketId}
                            actions={getCustomerSudoActions()}
                            onAction={handleCustomerAction}
                            isLoading={executeCustomerSudo.isPending}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-bold text-text-main">Support Links:</p>
                <div className="flex flex-wrap gap-4 mt-3">
                    <Link
                        href={`/dashboard?admin_mode=1&business_uid=${encodeURIComponent(selectedBusinessUid)}`}
                        className={`text-xs font-bold text-primary hover:underline ${!selectedBusinessUid ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        Open Business Dashboard
                    </Link>
                    <Link
                        href={`/customer/dashboard?admin_mode=1&customer_uid=${encodeURIComponent(selectedCustomerUid)}&business_uid=${encodeURIComponent(customers?.find(c => c.uid === selectedCustomerUid)?.businessUid || '')}`}
                        className={`text-xs font-bold text-primary hover:underline ${!selectedCustomerUid ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        Open Customer Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}

