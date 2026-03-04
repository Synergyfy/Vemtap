'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/dashboard/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBusinessFormsStore, ResponseActor, ResponseChannel } from '@/store/useBusinessFormsStore';
import { Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function EngagementFormResponsesPage() {
    const { user } = useAuthStore();
    const { data: myBusiness } = useMyBusiness();
    const businessId = myBusiness?.id || user?.businessId || 'demo-business-id';

    const submissions = useBusinessFormsStore((state) => state.submissions);
    const forms = useBusinessFormsStore((state) => state.forms);
    const setSubmissionStatus = useBusinessFormsStore((state) => state.setSubmissionStatus);
    const respondToSubmission = useBusinessFormsStore((state) => state.respondToSubmission);

    const scopedSubmissions = useMemo(
        () => submissions.filter((item) => item.businessId === businessId),
        [submissions, businessId]
    );

    const [selectedId, setSelectedId] = useState<string | null>(scopedSubmissions[0]?.id || null);
    const selected = scopedSubmissions.find((item) => item.id === selectedId) || null;
    const selectedForm = forms.find((form) => form.id === selected?.formId);

    const [channel, setChannel] = useState<ResponseChannel>('email');
    const [actor, setActor] = useState<ResponseActor>('agent');
    const [message, setMessage] = useState('');

    const sendResponse = () => {
        if (!selected || !message.trim()) {
            toast.error('Select a submission and enter a response message');
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

    return (
        <div className="p-8 space-y-8">
            <PageHeader
                title="Form Responses"
                description="View customer details, answers, and respond to complaints via SMS, WhatsApp, or Email."
            />

            <div className="flex items-center gap-3">
                <Link href="/dashboard/settings/engagement/socials" className="px-4 h-10 rounded-xl bg-white border border-gray-200 text-sm font-bold text-text-secondary flex items-center">Socials</Link>
                <Link href="/dashboard/settings/engagement/forms" className="px-4 h-10 rounded-xl bg-white border border-gray-200 text-sm font-bold text-text-secondary flex items-center">Form Creator</Link>
                <span className="px-4 h-10 rounded-xl bg-primary text-white text-sm font-black flex items-center">Form Responses</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <p className="text-sm font-black uppercase tracking-widest text-text-secondary">Incoming Submissions</p>
                    </div>
                    <div className="max-h-[560px] overflow-y-auto p-3 space-y-2">
                        {scopedSubmissions.length === 0 && (
                            <p className="text-sm text-text-secondary font-medium p-3">No form submissions yet.</p>
                        )}
                        {scopedSubmissions.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedId(item.id)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedId === item.id ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white hover:border-primary/30'
                                    }`}
                            >
                                <p className="text-sm font-bold text-text-main">{item.customerName}</p>
                                <p className="text-xs text-text-secondary font-medium">{item.formTitle}</p>
                                <p className="text-[10px] text-text-secondary uppercase tracking-widest font-black mt-2">{item.status}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                        {!selected && <p className="text-sm text-text-secondary font-medium">Select a submission to view details.</p>}
                        {selected && (
                            <div className="space-y-5">
                                <div>
                                    <p className="text-2xl font-display font-bold text-text-main">{selected.customerName}</p>
                                    <p className="text-sm text-text-secondary font-medium">{selected.customerEmail || 'No email'} - {selected.customerPhone || 'No phone'}</p>
                                    <p className="text-xs text-text-secondary font-black uppercase tracking-widest mt-2">{selected.formType.toUpperCase()} - {selected.formTitle}</p>
                                </div>

                                <div className="border-t border-gray-100 pt-4 space-y-3">
                                    {selectedForm?.fields.map((field) => (
                                        <div key={field.id}>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{field.label}</p>
                                            <p className="text-sm font-medium text-text-main">
                                                {selected.answers[field.id] === undefined || selected.answers[field.id] === '' ? 'N/A' : String(selected.answers[field.id])}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                        <p className="text-sm font-black uppercase tracking-widest text-text-secondary">Respond to Submission</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <select value={channel} onChange={(e) => setChannel(e.target.value as ResponseChannel)} className="h-11 rounded-xl border-gray-200 text-sm font-bold">
                                <option value="email">Email</option>
                                <option value="sms">SMS</option>
                                <option value="whatsapp">WhatsApp</option>
                            </select>
                            <select value={actor} onChange={(e) => setActor(e.target.value as ResponseActor)} className="h-11 rounded-xl border-gray-200 text-sm font-bold">
                                <option value="agent">Agent</option>
                                <option value="bot">Bot</option>
                            </select>
                        </div>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Write response to the customer..."
                            className="w-full min-h-28 rounded-xl border border-gray-200 px-3 py-3 text-sm font-medium"
                        />
                        <div className="flex justify-end">
                            <button onClick={sendResponse} className="h-11 px-5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <Send size={14} />
                                Send Response
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
