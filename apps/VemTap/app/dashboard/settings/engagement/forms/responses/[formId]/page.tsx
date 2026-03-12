'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Mail, MessageCircle, Star, X } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import {
    useBusinessForm,
    useBusinessFormResponses,
} from '@/services/business-forms/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import type { BusinessFormResponseItem } from '@/services/business-forms/types';

type ContactInfo = {
  name: string;
  email?: string;
  phone?: string;
};

const resolveContact = (response: BusinessFormResponseItem): ContactInfo => {
  const email =
    response.customerEmail ||
    response.respondent?.email ||
    (typeof response.email === 'string' ? response.email : undefined);

  const phone =
    response.customerPhone ||
    response.respondent?.phone ||
    (typeof response.phone === 'string' ? response.phone : undefined);

  const name =
    response.customerName ||
    response.respondent?.name ||
    (typeof response.name === 'string' ? response.name : undefined) ||
    'Anonymous';

  return {
    email: typeof email === 'string' ? email : undefined,
    phone: typeof phone === 'string' ? phone : undefined,
    name: typeof name === 'string' ? name : 'Anonymous',
  };
};

const resolveAnswer = (response: BusinessFormResponseItem, fieldId: string, question?: string) => {
    const answers = response.answers;

    if (Array.isArray(answers)) {
        const match =
            answers.find((entry) => entry.fieldId === fieldId) ||
            (question ? answers.find((entry) => entry.question === question) : undefined);
        return match?.value;
    }

    if (answers && typeof answers === 'object') {
        const byFieldId = (answers as Record<string, unknown>)[fieldId];
        if (byFieldId !== undefined) return byFieldId;
        if (question) return (answers as Record<string, unknown>)[question];
    }

    return undefined;
};

const resolveRating = (response: BusinessFormResponseItem, fieldIds: string[]) => {
    if (Array.isArray(response.answers)) {
        const fromArray = response.answers.find((entry) => typeof entry.value === 'number')?.value;
        return typeof fromArray === 'number' ? fromArray : undefined;
    }

    if (!response.answers || typeof response.answers !== 'object') return undefined;
    const values = Object.entries(response.answers as Record<string, unknown>)
        .filter(([key, value]) => fieldIds.includes(key) || typeof value === 'number')
        .map(([, value]) => value)
        .find((value) => typeof value === 'number');

    return typeof values === 'number' ? values : undefined;
};

export default function SingleFormResponsesPage() {
    const params = useParams<{ formId: string }>();
    const formId = params?.formId;
    const searchParams = useSearchParams();
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const userBranchId = useAuthStore((state) => state.user?.branchId);
    const user = useAuthStore((state) => state.user);
    const branchIdParam = searchParams?.get('branchId') || undefined;
    const allBranches = activeBranchId === 'all';
    const branchId = branchIdParam || (!allBranches ? (activeBranchId || userBranchId || undefined) : undefined);
    const { data: myBusiness } = useMyBusiness();

    const { data: form, isLoading: formLoading } = useBusinessForm(formId, { branchId, allBranches });
    const { data: responses = [], isLoading: responsesLoading } = useBusinessFormResponses(formId, { branchId, allBranches });

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const sortedResponses = useMemo(
        () =>
            [...responses].sort(
                (a, b) =>
                    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            ),
        [responses]
    );

    const selected = useMemo(
        () =>
            sortedResponses.find((item) => item.id === selectedId) ||
            sortedResponses[0] ||
            null,
        [sortedResponses, selectedId]
    );

    if (formLoading) {
        return (
            <div className="p-8">
                <PageHeader title="Form Responses" description="Loading form..." />
            </div>
        );
    }

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
                description={`Viewing ${sortedResponses.length} responses for this form.`}
            />

            <div className="flex items-center gap-3">
                <Link href="/dashboard/settings/engagement/forms/responses" className="px-4 h-10 rounded-xl bg-white border border-gray-200 text-sm font-bold text-text-secondary flex items-center gap-2">
                    <ArrowLeft size={14} />
                    Back
                </Link>
                <span className="px-4 h-10 rounded-xl bg-primary text-white text-sm font-black flex items-center">
                    {myBusiness?.name || user?.businessName || form.businessName || 'Business'}
                </span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-sm font-black uppercase tracking-widest text-text-secondary">Responses</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-widest text-text-secondary border-b border-gray-100">
                                <th className="px-5 py-3 font-black">Respondent</th>
                                <th className="px-5 py-3 font-black">Contact</th>
                                <th className="px-5 py-3 font-black">Rating</th>
                                <th className="px-5 py-3 font-black">Submitted</th>
                                <th className="px-5 py-3 font-black text-right">User</th>
                            </tr>
                        </thead>
                        <tbody>
                            {responsesLoading && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-6 text-sm text-text-secondary">Loading responses...</td>
                                </tr>
                            )}
                            {!responsesLoading && sortedResponses.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-6 text-sm text-text-secondary">No responses yet.</td>
                                </tr>
                            )}
                            {sortedResponses.map((item) => {
                                const contact = resolveContact(item);
                                const ratingFieldIds = form.fields
                                    .filter((field) => field.type === 'number')
                                    .map((field) => field.id || '');
                                const rating = resolveRating(item, ratingFieldIds);
                                const isSelected = selected?.id === item.id;

                                return (
                                    <tr
                                        key={item.id}
                                        onClick={() => {
                                            setSelectedId(item.id);
                                            setIsSidebarOpen(true);
                                        }}
                                        className={`cursor-pointer border-b border-gray-50 hover:bg-gray-50 ${isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                                    >
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-bold text-text-main">{contact.name}</p>
                                            <p className="text-xs text-text-secondary">{item.id}</p>
                                        </td>
                                        <td className="px-5 py-4 text-xs text-text-secondary">
                                            {contact.email || contact.phone || 'No contact'}
                                        </td>
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
                                        <td className="px-5 py-4 text-xs text-text-secondary">{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown'}</td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setSelectedId(item.id);
                                                    setIsSidebarOpen(true);
                                                }}
                                                className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary text-white hover:bg-primary/90 inline-flex items-center justify-center"
                                            >
                                                User
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {isSidebarOpen && selected && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setIsSidebarOpen(false)} />
                    <aside className="absolute top-0 right-0 h-full w-full max-w-md bg-white border-l border-gray-200 shadow-2xl overflow-y-auto">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <p className="text-sm font-black uppercase tracking-widest text-text-secondary">Response Detail</p>
                            <button onClick={() => setIsSidebarOpen(false)} className="text-text-secondary">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <p className="text-xl font-display font-bold text-text-main">{resolveContact(selected).name}</p>
                                <p className="text-sm text-text-secondary">{resolveContact(selected).email || 'No email'} · {resolveContact(selected).phone || 'No phone'}</p>
                            </div>

                            <div className="border-t border-gray-100 pt-3 space-y-3">
                                {form.fields
                                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                    .map((field) => {
                                        const answer = resolveAnswer(selected, field.id || '', field.question);
                                        return (
                                            <div key={field.id || `${field.question}-fallback`}>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{field.question}</p>
                                                {field.type === 'number' && typeof answer === 'number' && answer >= 1 && answer <= 5 ? (
                                                    <div className="flex items-center gap-0.5 text-amber-400 mt-1">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <Star key={`${field.id}-detail-${i}`} size={14} fill={i < answer ? 'currentColor' : 'none'} />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-medium text-text-main">
                                                        {answer === undefined || answer === '' ? 'N/A' : String(answer)}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>

                            <div className="border-t border-gray-100 pt-3 space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                    Respond Through Channels
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    <a
                                        href={resolveContact(selected).email ? `mailto:${resolveContact(selected).email}` : undefined}
                                        className={`h-10 rounded-xl border text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1 ${resolveContact(selected).email ? 'border-gray-200 text-text-secondary' : 'border-gray-100 text-gray-300 pointer-events-none'}`}
                                    >
                                        <Mail size={12} />
                                        Email
                                    </a>
                                    <a
                                        href={resolveContact(selected).phone ? `sms:${resolveContact(selected).phone}` : undefined}
                                        className={`h-10 rounded-xl border text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1 ${resolveContact(selected).phone ? 'border-gray-200 text-text-secondary' : 'border-gray-100 text-gray-300 pointer-events-none'}`}
                                    >
                                        <MessageCircle size={12} />
                                        SMS
                                    </a>
                                    <a
                                        href={resolveContact(selected).phone ? `https://wa.me/${String(resolveContact(selected).phone).replace(/\D/g, '')}` : undefined}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`h-10 rounded-xl border text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1 ${resolveContact(selected).phone ? 'border-gray-200 text-text-secondary' : 'border-gray-100 text-gray-300 pointer-events-none'}`}
                                    >
                                        <MessageCircle size={12} />
                                        WhatsApp
                                    </a>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}
