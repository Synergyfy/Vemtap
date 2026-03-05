'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/dashboard/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBusinessFormsStore, ResponseActor, ResponseChannel } from '@/store/useBusinessFormsStore';
import { ArrowLeft, Send, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SingleFormResponsesPage() {
    const { user } = useAuthStore();
    const { data: myBusiness } = useMyBusiness();
    const businessId = myBusiness?.id || user?.businessId || 'demo-business-id';
    const params = useParams<{ formId: string }>();
    const formId = params?.formId;

    const forms = useBusinessFormsStore((state) => state.forms);
    const submissions = useBusinessFormsStore((state) => state.submissions);
    const setSubmissionStatus = useBusinessFormsStore((state) => state.setSubmissionStatus);
    const respondToSubmission = useBusinessFormsStore((state) => state.respondToSubmission);

    const form = forms.find((f) => f.id === formId && f.businessId === businessId) || null;
    const formSubmissions = useMemo(
        () => submissions.filter((item) => item.formId === formId && item.businessId === businessId),
        [submissions, formId, businessId]
    );

    const [selectedId, setSelectedId] = useState<string | null>(formSubmissions[0]?.id || null);
    const selected = formSubmissions.find((item) => item.id === selectedId) || formSubmissions[0] || null;

    const [channel, setChannel] = useState<ResponseChannel>('email');
    const [actor, setActor] = useState<ResponseActor>('agent');
    const [message, setMessage] = useState('');

    const sendResponse = () => {
        if (!selected || !message.trim()) {
            toast.error('Select a response and enter a message');
            return;
        }

        respondToSubmission(selected.id, {
            channel,
            actor,
            message: message.trim(),
            responderName: user?.name || 'Business Team'
        });
        setSubmissionStatus(selected.id, 'responded');
        setMessage('');
        toast.success('Response sent');
    };

    const completionRate = formSubmissions.length
        ? Math.round((formSubmissions.filter((s) => s.status === 'responded' || s.status === 'closed').length / formSubmissions.length) * 100)
        : 0;

    if (!form) {
        return (
            <div className="p-8 space-y-4">
                <Link href="/dashboard/settings/engagement/forms/responses" className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                    <ArrowLeft size={14} /> Back to forms
                </Link>
                <p className="text-sm text-text-secondary">Form not found.</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <PageHeader
                title={form.title}
                description={`Viewing ${formSubmissions.length} submissions for this form.`}
            />

            <div className="flex items-center gap-3">
                <Link href="/dashboard/settings/engagement/forms/responses" className="px-4 h-10 rounded-xl bg-white border border-gray-200 text-sm font-bold text-text-secondary flex items-center gap-2">
                    <ArrowLeft size={14} />
                    Back
                </Link>
                <span className="px-4 h-10 rounded-xl bg-primary text-white text-sm font-black flex items-center">
                    {(form.typeLabel || form.type).toUpperCase()}
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <p className="text-sm text-text-secondary font-medium">Total Responses</p>
                    <p className="text-3xl font-black text-text-main mt-1">{formSubmissions.length}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <p className="text-sm text-text-secondary font-medium">Completion</p>
                    <p className="text-3xl font-black text-text-main mt-1">{completionRate}%</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <p className="text-sm text-text-secondary font-medium">Status</p>
                    <p className="text-3xl font-black text-text-main mt-1">{form.status}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8 bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <p className="text-sm font-black uppercase tracking-widest text-text-secondary">Submissions</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-widest text-text-secondary border-b border-gray-100">
                                    <th className="px-5 py-3 font-black">Respondent</th>
                                    <th className="px-5 py-3 font-black">Status</th>
                                    <th className="px-5 py-3 font-black">Rating</th>
                                    <th className="px-5 py-3 font-black">Submitted</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formSubmissions.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-6 text-sm text-text-secondary">No responses yet.</td>
                                    </tr>
                                )}
                                {formSubmissions.map((item) => {
                                    const rating = Object.values(item.answers).find((a) => typeof a === 'number') as number | undefined;
                                    const isSelected = selected?.id === item.id;
                                    return (
                                        <tr
                                            key={item.id}
                                            onClick={() => setSelectedId(item.id)}
                                            className={`cursor-pointer border-b border-gray-50 hover:bg-gray-50 ${isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                                        >
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-bold text-text-main">{item.customerName}</p>
                                                <p className="text-xs text-text-secondary">{item.customerEmail || item.customerPhone || 'No contact'}</p>
                                            </td>
                                            <td className="px-5 py-4 text-xs font-black uppercase tracking-wider">{item.status}</td>
                                            <td className="px-5 py-4">
                                                {rating ? (
                                                    <div className="flex items-center gap-0.5 text-amber-400">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <Star key={`${item.id}-s-${i}`} size={14} fill={i < rating ? 'currentColor' : 'none'} />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-text-secondary">No rating</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-xs text-text-secondary">{new Date(item.createdAt).toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="xl:col-span-4 bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <p className="text-sm font-black uppercase tracking-widest text-text-secondary">Response Detail</p>
                    </div>
                    <div className="p-5 space-y-4">
                        {!selected && <p className="text-sm text-text-secondary">Select a response.</p>}
                        {selected && (
                            <>
                                <div>
                                    <p className="text-xl font-display font-bold text-text-main">{selected.customerName}</p>
                                    <p className="text-sm text-text-secondary">{selected.customerEmail || 'No email'} · {selected.customerPhone || 'No phone'}</p>
                                </div>

                                <div className="border-t border-gray-100 pt-3 space-y-3 max-h-56 overflow-y-auto">
                                    {form.fields.map((field) => (
                                        <div key={field.id}>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{field.label}</p>
                                            <p className="text-sm font-medium text-text-main">
                                                {selected.answers[field.id] === undefined || selected.answers[field.id] === '' ? 'N/A' : String(selected.answers[field.id])}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-gray-100 pt-3 space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <select value={channel} onChange={(e) => setChannel(e.target.value as ResponseChannel)} className="h-10 rounded-xl border-gray-200 text-xs font-bold">
                                            <option value="email">Email</option>
                                            <option value="sms">SMS</option>
                                            <option value="whatsapp">WhatsApp</option>
                                        </select>
                                        <select value={actor} onChange={(e) => setActor(e.target.value as ResponseActor)} className="h-10 rounded-xl border-gray-200 text-xs font-bold">
                                            <option value="agent">Agent</option>
                                            <option value="bot">Bot</option>
                                        </select>
                                    </div>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Write response..."
                                        className="w-full min-h-24 rounded-xl border border-gray-200 px-3 py-3 text-sm font-medium"
                                    />
                                    <button onClick={sendResponse} className="w-full h-10 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                        <Send size={14} />
                                        Send Response
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
