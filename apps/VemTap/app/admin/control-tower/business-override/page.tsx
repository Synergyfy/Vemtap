'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ShieldCheck, ArrowRightLeft, KeyRound, Power } from 'lucide-react';
import SudoActionPanel from '@/components/admin/control-tower/SudoActionPanel';
import {
    businessControlRecords,
    getBusinessSudoActions,
} from '@/components/admin/control-tower/mockControlTowerData';

export default function BusinessOverridePage() {
    const [query, setQuery] = useState('');
    const [selectedBusinessUid, setSelectedBusinessUid] = useState('biz_102');
    const [ticketId, setTicketId] = useState('');

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return businessControlRecords;
        return businessControlRecords.filter((biz) =>
            biz.name.toLowerCase().includes(term) ||
            biz.owner.toLowerCase().includes(term) ||
            biz.uid.toLowerCase().includes(term)
        );
    }, [query]);
    const visibleBusinesses = filtered.slice(0, 5);

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Control Tower</p>
                <h1 className="text-3xl font-display font-bold text-text-main mt-1">Business Override</h1>
                <p className="text-sm text-text-secondary font-medium mt-1">Search by business UID and run major business-dashboard workflows in admin mode.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Search business by name, owner, or UID..."
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Selected Business UID</label>
                    <input
                        value={selectedBusinessUid}
                        onChange={(e) => setSelectedBusinessUid(e.target.value)}
                        className="mt-1 w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="biz_102"
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

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Showing latest 5 businesses</p>
                </div>
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Business</th>
                            <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Users</th>
                            <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Status</th>
                            <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Admin Actions (Mock)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {visibleBusinesses.map((biz) => (
                            <tr key={biz.uid} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedBusinessUid(biz.uid)}>
                                <td className="py-4 px-6">
                                    <p className="font-bold text-sm text-text-main">{biz.name}</p>
                                    <p className="text-xs text-text-secondary">{biz.uid} - Owner: {biz.owner}</p>
                                </td>
                                <td className="py-4 px-6 text-sm font-bold text-text-main">{biz.users}</td>
                                <td className="py-4 px-6">
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${biz.status === 'Active' ? 'bg-green-50 text-green-600' : biz.status === 'Suspended' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700'}`}>
                                        {biz.status}
                                    </span>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="px-3 py-2 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary-hover flex items-center gap-1.5">
                                            <ArrowRightLeft size={14} />
                                            Assume Session
                                        </button>
                                        <button className="px-3 py-2 rounded-lg text-xs font-bold bg-gray-100 text-text-main hover:bg-gray-200 flex items-center gap-1.5">
                                            <KeyRound size={14} />
                                            Reset Access
                                        </button>
                                        <button className="px-3 py-2 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1.5">
                                            <Power size={14} />
                                            Pause
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <SudoActionPanel
                title="Business Sudo Actions"
                subtitle="Run business-level operations directly from admin without switching dashboards."
                subjectLabel="Business UID"
                subjectUid={selectedBusinessUid}
                ticketId={ticketId}
                actions={getBusinessSudoActions()}
            />

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-bold text-text-main">Optional modeling only:</p>
                <p className="text-xs text-text-secondary mt-1">If you need to reproduce UI behavior, open a scoped dashboard session.</p>
                <Link
                    href={`/dashboard?admin_mode=1&business_uid=${encodeURIComponent(selectedBusinessUid)}`}
                    className="inline-flex mt-3 text-xs font-bold text-primary hover:underline"
                >
                    Open Business Dashboard (Modeling)
                </Link>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck size={18} className="text-blue-600 mt-0.5" />
                <p className="text-xs text-blue-900 font-medium">This is a mock sudo surface: actions run in admin context on behalf of business users.</p>
            </div>
        </div>
    );
}
