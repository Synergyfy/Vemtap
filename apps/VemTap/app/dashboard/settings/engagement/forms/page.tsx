'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/dashboard/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import {
    useBusinessFormsStore,
    BusinessFormType,
    FormFieldType,
    ResponseActor,
    ResponseChannel
} from '@/store/useBusinessFormsStore';
import { useMyBusiness } from '@/services/businesses/hooks';
import { Copy, Plus, Trash2, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

type DraftField = {
    id: string;
    label: string;
    type: FormFieldType;
    required: boolean;
    optionsText: string;
};

const FIELD_TYPES: Array<{ label: string; value: FormFieldType }> = [
    { label: 'Short Text', value: 'short_text' },
    { label: 'Long Text', value: 'long_text' },
    { label: 'Multiple Choice', value: 'choice' },
    { label: 'Rating (1-5)', value: 'rating' },
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' },
    { label: 'URL', value: 'url' }
];

const TYPE_OPTIONS: Array<{ label: string; value: BusinessFormType }> = [
    { label: 'Survey', value: 'survey' },
    { label: 'Complaint', value: 'complaint' },
    { label: 'Social Media', value: 'social' }
];

export default function EngagementFormsBuilderPage() {
    const { user } = useAuthStore();
    const { data: myBusiness } = useMyBusiness();
    const createForm = useBusinessFormsStore((state) => state.createForm);
    const forms = useBusinessFormsStore((state) => state.forms);
    const businessId = myBusiness?.id || user?.businessId || 'demo-business-id';
    const businessName = myBusiness?.name || user?.businessName || 'My Business';

    const [formType, setFormType] = useState<BusinessFormType>('survey');
    const [title, setTitle] = useState('');
    const [key, setKey] = useState('');
    const [responseActor, setResponseActor] = useState<ResponseActor>('agent');
    const [channels, setChannels] = useState<ResponseChannel[]>(['email']);
    const [fields, setFields] = useState<DraftField[]>([
        {
            id: `fld-${Date.now()}`,
            label: 'How was your experience?',
            type: 'rating',
            required: true,
            optionsText: ''
        }
    ]);

    const businessForms = useMemo(
        () => forms.filter((f) => f.businessId === businessId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        [forms, businessId]
    );

    const addField = () => {
        setFields((prev) => [
            ...prev,
            {
                id: `fld-${Date.now()}-${prev.length}`,
                label: '',
                type: 'short_text',
                required: false,
                optionsText: ''
            }
        ]);
    };

    const updateField = (id: string, updates: Partial<DraftField>) => {
        setFields((prev) => prev.map((field) => (field.id === id ? { ...field, ...updates } : field)));
    };

    const removeField = (id: string) => {
        setFields((prev) => prev.filter((field) => field.id !== id));
    };

    const toggleChannel = (channel: ResponseChannel) => {
        setChannels((prev) => (prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]));
    };

    const buildKey = (raw: string) => raw.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');

    const handleCreateForm = () => {
        if (!title.trim()) {
            toast.error('Form title is required');
            return;
        }
        if (!fields.length || fields.some((field) => !field.label.trim())) {
            toast.error('All fields must have a label');
            return;
        }

        const mappedFields = fields.map((field) => ({
            id: field.id,
            label: field.label.trim(),
            type: field.type,
            required: field.required,
            options:
                field.type === 'choice'
                    ? field.optionsText
                        .split(',')
                        .map((opt) => opt.trim())
                        .filter(Boolean)
                    : undefined
        }));

        const payloadKey = buildKey(key || title);
        createForm({
            businessId,
            businessName,
            type: formType,
            title,
            key: payloadKey,
            fields: mappedFields,
            responseChannels: channels,
            responseActor
        });

        setTitle('');
        setKey('');
        setFormType('survey');
        setResponseActor('agent');
        setChannels(['email']);
        setFields([{ id: `fld-${Date.now()}`, label: '', type: 'short_text', required: false, optionsText: '' }]);
        toast.success('Form submitted for admin approval');
    };

    const copyFormLink = async (formKey: string) => {
        const link = `${window.location.origin}/user-step?form=${formKey}`;
        await navigator.clipboard.writeText(link);
        toast.success('Form link copied');
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
            <PageHeader
                title="Engagement Form Creator"
                description="Create Survey, Complaint, or Social forms. Every new form is sent to admin for approval."
            />

            <div className="flex items-center gap-3">
                <Link href="/dashboard/settings/engagement/socials" className="px-4 h-10 rounded-xl bg-white border border-gray-200 text-sm font-bold text-text-secondary flex items-center">Socials</Link>
                <span className="px-4 h-10 rounded-xl bg-primary text-white text-sm font-black flex items-center">Form Creator</span>
                <Link href="/dashboard/settings/engagement/forms/responses" className="px-4 h-10 rounded-xl bg-white border border-gray-200 text-sm font-bold text-text-secondary flex items-center">Form Responses</Link>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Form Type</label>
                        <select value={formType} onChange={(e) => setFormType(e.target.value as BusinessFormType)} className="mt-2 w-full h-11 rounded-xl border-gray-200 text-sm font-bold">
                            {TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Form Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Customer Satisfaction Survey"
                            className="mt-2 w-full h-11 rounded-xl border border-gray-200 px-3 text-sm font-medium"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Form Key (Link ID)</label>
                        <input
                            value={key}
                            onKeyDown={(e) => {
                                if (formType === 'survey' && e.key === ' ') e.preventDefault();
                            }}
                            onChange={(e) => {
                                const value = formType === 'survey' ? e.target.value.replace(/\s+/g, '') : e.target.value;
                                setKey(value);
                            }}
                            placeholder="customer-survey"
                            className="mt-2 w-full h-11 rounded-xl border border-gray-200 px-3 text-sm font-medium"
                        />
                        {formType === 'survey' && (
                            <p className="mt-1 text-[10px] text-amber-600 font-bold">Survey key does not allow spaces.</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Response Owner</label>
                        <select value={responseActor} onChange={(e) => setResponseActor(e.target.value as ResponseActor)} className="mt-2 w-full h-11 rounded-xl border-gray-200 text-sm font-bold">
                            <option value="agent">Agent</option>
                            <option value="bot">Bot</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Respond Via</label>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {(['sms', 'whatsapp', 'email'] as ResponseChannel[]).map((channel) => (
                                <button
                                    key={channel}
                                    onClick={() => toggleChannel(channel)}
                                    className={`h-10 px-4 rounded-xl border text-xs font-black uppercase tracking-widest ${channels.includes(channel)
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white text-text-secondary border-gray-200'
                                        }`}
                                >
                                    {channel}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary">Form Fields</h3>
                        <button onClick={addField} className="h-10 px-4 rounded-xl border border-primary/30 text-primary text-xs font-black uppercase tracking-widest flex items-center gap-1">
                            <Plus size={14} /> Add Field
                        </button>
                    </div>

                    {fields.map((field) => (
                        <div key={field.id} className="border border-gray-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-3">
                            <div className="md:col-span-5">
                                <input
                                    value={field.label}
                                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                                    placeholder="Field label"
                                    className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <select value={field.type} onChange={(e) => updateField(field.id, { type: e.target.value as FormFieldType })} className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm">
                                    {FIELD_TYPES.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-3 flex items-center gap-2">
                                <input
                                    id={`required-${field.id}`}
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                    className="rounded border-gray-300"
                                />
                                <label htmlFor={`required-${field.id}`} className="text-xs font-bold text-text-secondary uppercase tracking-widest">Required</label>
                            </div>
                            <div className="md:col-span-1 flex items-center justify-end">
                                <button onClick={() => removeField(field.id)} className="size-9 rounded-lg border border-gray-200 text-red-500 flex items-center justify-center">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            {field.type === 'choice' && (
                                <div className="md:col-span-12">
                                    <input
                                        value={field.optionsText}
                                        onChange={(e) => updateField(field.id, { optionsText: e.target.value })}
                                        placeholder="Options separated by comma: Good, Average, Poor"
                                        className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex justify-end">
                    <button onClick={handleCreateForm} className="h-12 px-6 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest">
                        Save for Approval
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary mb-4">Your Forms</h3>
                <div className="space-y-3">
                    {businessForms.length === 0 && (
                        <p className="text-sm font-medium text-text-secondary">No forms created yet.</p>
                    )}
                    {businessForms.map((form) => (
                        <div key={form.id} className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                                <p className="text-sm font-bold text-text-main">{form.title}</p>
                                <p className="text-xs text-text-secondary font-medium">
                                    {form.type.toUpperCase()} - /user-step?form={form.key}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusBadge(form.status)}`}>
                                    {statusIcon(form.status)}
                                    {form.status}
                                </span>
                                <button onClick={() => copyFormLink(form.key)} className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-black uppercase tracking-widest text-text-secondary flex items-center gap-1">
                                    <Copy size={12} /> Copy Link
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
