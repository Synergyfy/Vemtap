'use client';

import React, { useMemo, useState } from 'react';
import { useBusinessFormsStore } from '@/store/useBusinessFormsStore';
import { CheckCircle2, XCircle, Clock3 } from 'lucide-react';
import { notify } from '@/lib/notify';

export default function AdminFormsPage() {
    const forms = useBusinessFormsStore((state) => state.forms);
    const submissions = useBusinessFormsStore((state) => state.submissions);
    const setFormStatus = useBusinessFormsStore((state) => state.setFormStatus);

    const pendingForms = useMemo(() => forms.filter((form) => form.status === 'pending'), [forms]);
    const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'responses'>('pending');

    const scopedForms = activeTab === 'pending' ? pendingForms : forms;

    const approve = (id: string) => {
        setFormStatus(id, 'approved', 'Admin', 'Approved for business use');
        notify.success('Form approved');
    };

    const reject = (id: string) => {
        setFormStatus(id, 'rejected', 'Admin', 'Please adjust configuration and resubmit');
        notify.success('Form rejected');
    };

    const statusBadge = (status: string) => {
        if (status === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (status === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
        return 'bg-amber-50 text-amber-700 border-amber-200';
    };

    const statusIcon = (status: string) => {
        if (status === 'approved') return <CheckCircle2 size={14} />;
        if (status === 'rejected') return <XCircle size={14} />;
        return <Clock3 size={14} />;
    };

    return (
        <div className="p-8 space-y-8">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Administration</p>
                <h1 className="text-3xl font-display font-bold text-text-main">Business Form Approvals</h1>
                <p className="text-text-secondary font-medium mt-1">Approve/reject Survey, Complaint, and Social forms before they go live.</p>
            </div>

            <div className="flex gap-2">
                <button onClick={() => setActiveTab('pending')} className={`h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest ${activeTab === 'pending' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-text-secondary'}`}>Pending</button>
                <button onClick={() => setActiveTab('all')} className={`h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest ${activeTab === 'all' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-text-secondary'}`}>All Forms</button>
                <button onClick={() => setActiveTab('responses')} className={`h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest ${activeTab === 'responses' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-text-secondary'}`}>Responses</button>
            </div>

            {activeTab !== 'responses' && (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                <th className="px-5 py-4">Business</th>
                                <th className="px-5 py-4">Form</th>
                                <th className="px-5 py-4">Type</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {scopedForms.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-text-secondary font-medium">No forms in this view.</td>
                                </tr>
                            )}
                            {scopedForms.map((form) => (
                                <tr key={form.id}>
                                    <td className="px-5 py-4 text-sm font-bold text-text-main">{form.businessName}</td>
                                    <td className="px-5 py-4">
                                        <p className="text-sm font-bold text-text-main">{form.title}</p>
                                        <p className="text-xs text-text-secondary">{form.key}</p>
                                    </td>
                                    <td className="px-5 py-4 text-xs font-black uppercase tracking-widest text-text-secondary">
                                        {form.typeLabel || form.type}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusBadge(form.status)}`}>
                                            {statusIcon(form.status)}
                                            {form.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => approve(form.id)}
                                                className="h-9 px-3 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
                                                disabled={form.status === 'approved'}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => reject(form.id)}
                                                className="h-9 px-3 rounded-lg bg-red-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
                                                disabled={form.status === 'rejected'}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'responses' && (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                <th className="px-5 py-4">Business</th>
                                <th className="px-5 py-4">Customer</th>
                                <th className="px-5 py-4">Form</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4">Response</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {submissions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-text-secondary font-medium">No responses yet.</td>
                                </tr>
                            )}
                            {submissions.map((submission) => (
                                <tr key={submission.id}>
                                    <td className="px-5 py-4 text-sm font-bold text-text-main">{forms.find((f) => f.id === submission.formId)?.businessName || 'Business'}</td>
                                    <td className="px-5 py-4 text-sm font-medium text-text-main">{submission.customerName}</td>
                                    <td className="px-5 py-4 text-sm font-medium text-text-main">{submission.formTitle}</td>
                                    <td className="px-5 py-4 text-xs font-black uppercase tracking-widest text-text-secondary">{submission.status}</td>
                                    <td className="px-5 py-4 text-xs text-text-secondary font-medium">
                                        {submission.response ? `${submission.response.actor} via ${submission.response.channel}` : 'No response'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
