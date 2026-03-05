'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/dashboard/PageHeader';
import Tooltip from '@/components/ui/Tooltip';
import { useAuthStore } from '@/store/useAuthStore';
import {
    useBusinessFormsStore,
    BusinessFormType,
    PredefinedBusinessFormType,
    FormFieldType,
    ResponseActor,
    ResponseChannel
} from '@/store/useBusinessFormsStore';
import { useMyBusiness } from '@/services/businesses/hooks';
import { Copy, Plus, Trash2, CheckCircle2, Clock3, XCircle, X, CircleHelp, MessageSquare, Megaphone, Share2, Sparkles } from 'lucide-react';
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

const TYPE_OPTIONS: Array<{ label: string; value: PredefinedBusinessFormType; icon: React.ElementType; description: string }> = [
    { label: 'Survey', value: 'survey', icon: MessageSquare, description: 'Gather structured feedback and ratings.' },
    { label: 'Complaint', value: 'complaint', icon: Megaphone, description: 'Track grievances and support issues.' },
    { label: 'Social Media', value: 'social', icon: Share2, description: 'Capture social profile and engagement intent.' }
];

const WIZARD_STEPS = [
    { id: 1, title: 'Basics' },
    { id: 2, title: 'Response Setup' },
    { id: 3, title: 'Fields' },
    { id: 4, title: 'Review' }
] as const;

const makeField = (id: string, label = '', type: FormFieldType = 'short_text', required = false, optionsText = ''): DraftField => ({
    id,
    label,
    type,
    required,
    optionsText
});

const TooltippedLabel = ({ label, tip }: { label: string; tip: string }) => (
    <div className="flex items-center gap-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{label}</label>
        <Tooltip content={tip}>
            <span className="inline-flex items-center text-text-secondary cursor-help">
                <CircleHelp size={12} />
            </span>
        </Tooltip>
    </div>
);

export default function EngagementFormsBuilderPage() {
    const { user } = useAuthStore();
    const { data: myBusiness } = useMyBusiness();
    const createForm = useBusinessFormsStore((state) => state.createForm);
    const forms = useBusinessFormsStore((state) => state.forms);
    const customTypeOptionsByBusiness = useBusinessFormsStore((state) => state.customTypeOptionsByBusiness);
    const addCustomTypeOption = useBusinessFormsStore((state) => state.addCustomTypeOption);
    const removeCustomTypeOption = useBusinessFormsStore((state) => state.removeCustomTypeOption);
    const businessId = myBusiness?.id || user?.businessId || 'demo-business-id';
    const businessName = myBusiness?.name || user?.businessName || 'My Business';

    const [useCustomType, setUseCustomType] = useState(false);
    const [predefinedType, setPredefinedType] = useState<PredefinedBusinessFormType>('survey');
    const [customTypeLabel, setCustomTypeLabel] = useState('');
    const [newTypeOption, setNewTypeOption] = useState('');
    const [title, setTitle] = useState('');
    const [key, setKey] = useState('');
    const [responseActor, setResponseActor] = useState<ResponseActor>('agent');
    const [channels, setChannels] = useState<ResponseChannel[]>(['email']);
    const [wizardStep, setWizardStep] = useState(1);
    const [fieldCounter, setFieldCounter] = useState(2);
    const [fields, setFields] = useState<DraftField[]>([
        makeField('fld-1', 'How was your experience?', 'rating', true, '')
    ]);

    const businessForms = useMemo(
        () => forms.filter((f) => f.businessId === businessId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        [forms, businessId]
    );
    const customTypeOptions = customTypeOptionsByBusiness[businessId] || [];

    const addField = () => {
        const nextId = `fld-${fieldCounter}`;
        setFieldCounter((prev) => prev + 1);
        setFields((prev) => [
            ...prev,
            makeField(nextId)
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

    const validateStep = (step: number) => {
        if (step === 1) {
            if (!title.trim()) {
                toast.error('Form title is required');
                return false;
            }
            if (useCustomType && !customTypeLabel.trim()) {
                toast.error('Custom form type name is required');
                return false;
            }
        }

        if (step === 2 && channels.length === 0) {
            toast.error('Select at least one response channel');
            return false;
        }

        if (step === 3) {
            if (!fields.length) {
                toast.error('Add at least one field');
                return false;
            }
            if (fields.some((field) => !field.label.trim())) {
                toast.error('All fields must have a label');
                return false;
            }
            if (fields.some((field) => field.type === 'choice' && !field.optionsText.trim())) {
                toast.error('Choice fields need options');
                return false;
            }
        }

        return true;
    };

    const goNextStep = () => {
        if (!validateStep(wizardStep)) return;
        setWizardStep((prev) => Math.min(4, prev + 1));
    };

    const goPrevStep = () => {
        setWizardStep((prev) => Math.max(1, prev - 1));
    };

    const handleCreateForm = () => {
        if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;
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
        const selectedType: BusinessFormType = useCustomType ? 'custom' : predefinedType;
        const resolvedTypeLabel =
            selectedType === 'custom'
                ? customTypeLabel.trim()
                : TYPE_OPTIONS.find((option) => option.value === selectedType)?.label || selectedType;

        if (selectedType === 'custom' && !resolvedTypeLabel) {
            toast.error('Custom form type name is required');
            return;
        }

        if (selectedType === 'custom') {
            addCustomTypeOption(businessId, resolvedTypeLabel);
        }

        createForm({
            businessId,
            businessName,
            type: selectedType,
            typeLabel: resolvedTypeLabel,
            title,
            key: payloadKey,
            fields: mappedFields,
            responseChannels: channels,
            responseActor
        });

        setTitle('');
        setKey('');
        setUseCustomType(false);
        setPredefinedType('survey');
        setCustomTypeLabel('');
        setNewTypeOption('');
        setWizardStep(1);
        setResponseActor('agent');
        setChannels(['email']);
        setFieldCounter(2);
        setFields([makeField('fld-1')]);
        toast.success('Form submitted for admin approval');
    };

    const copyFormLink = async (formKey: string) => {
        const link = `${window.location.origin}/forms/${formKey}`;
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
                description="Create Survey, Complaint, Social, or custom forms with a guided step-by-step flow."
            />

            <div className="flex items-center gap-3">
                <Link href="/dashboard/settings/engagement/socials" className="px-4 h-10 rounded-xl bg-white border border-gray-200 text-sm font-bold text-text-secondary flex items-center">Socials</Link>
                <span className="px-4 h-10 rounded-xl bg-primary text-white text-sm font-black flex items-center">Form Creator</span>
                <Link href="/dashboard/settings/engagement/forms/responses" className="px-4 h-10 rounded-xl bg-white border border-gray-200 text-sm font-bold text-text-secondary flex items-center">Form Responses</Link>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                    {WIZARD_STEPS.map((step) => {
                        const isActive = wizardStep === step.id;
                        const isDone = wizardStep > step.id;
                        return (
                            <div
                                key={step.id}
                                className={`h-11 rounded-xl border px-3 flex items-center gap-2 ${
                                    isActive
                                        ? 'bg-primary border-primary text-white'
                                        : isDone
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                            : 'bg-white border-gray-200 text-text-secondary'
                                }`}
                            >
                                <span className="text-xs font-black">{step.id}</span>
                                <span className="text-[10px] md:text-xs font-black uppercase tracking-wider">{step.title}</span>
                            </div>
                        );
                    })}
                </div>

                {wizardStep === 1 && (
                <>
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-3xl font-display font-black text-text-main">Choose Your Form Type</h2>
                        <p className="text-sm text-text-secondary mt-1">Select a template or start with a custom form type.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {TYPE_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            const selected = !useCustomType && predefinedType === option.value;
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        setUseCustomType(false);
                                        setPredefinedType(option.value);
                                    }}
                                    className={`text-left rounded-2xl border p-5 transition-all ${
                                        selected
                                            ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                                            : 'border-gray-200 hover:border-primary/30 hover:-translate-y-0.5'
                                    }`}
                                >
                                    <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                                        <Icon size={22} />
                                    </div>
                                    <p className="text-lg font-black text-text-main">{option.label}</p>
                                    <p className="text-xs text-text-secondary mt-1">{option.description}</p>
                                    <span className={`mt-4 inline-flex h-8 items-center px-3 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                        selected ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary'
                                    }`}>
                                        {selected ? 'Selected' : 'Select'}
                                    </span>
                                </button>
                            );
                        })}

                        <button
                            onClick={() => setUseCustomType(true)}
                            className={`text-left rounded-2xl border p-5 transition-all ${
                                useCustomType
                                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                                    : 'border-gray-200 hover:border-primary/30 hover:-translate-y-0.5'
                            }`}
                        >
                            <div className="size-12 rounded-xl bg-gray-100 text-text-secondary flex items-center justify-center mb-4">
                                <Sparkles size={22} />
                            </div>
                            <p className="text-lg font-black text-text-main">Custom</p>
                            <p className="text-xs text-text-secondary mt-1">Build a unique form flow for your business use case.</p>
                            <span className={`mt-4 inline-flex h-8 items-center px-3 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                useCustomType ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary'
                            }`}>
                                {useCustomType ? 'Selected' : 'Select'}
                            </span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <TooltippedLabel label="Form Title" tip="Internal title visible to your team and admin reviewers." />
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Customer Satisfaction Survey"
                                className="mt-2 w-full h-11 rounded-xl border border-gray-200 px-3 text-sm font-medium"
                            />
                        </div>
                        <div>
                            <TooltippedLabel label="Form Key (Link ID)" tip="Public path used in the form URL." />
                            <input
                                value={key}
                                onKeyDown={(e) => {
                                    if (!useCustomType && predefinedType === 'survey' && e.key === ' ') e.preventDefault();
                                }}
                                onChange={(e) => {
                                    const value = !useCustomType && predefinedType === 'survey' ? e.target.value.replace(/\s+/g, '') : e.target.value;
                                    setKey(value);
                                }}
                                placeholder="customer-survey"
                                className="mt-2 w-full h-11 rounded-xl border border-gray-200 px-3 text-sm font-medium"
                            />
                            {!useCustomType && predefinedType === 'survey' && (
                                <p className="mt-1 text-[10px] text-amber-600 font-bold">Survey key does not allow spaces.</p>
                            )}
                        </div>
                    </div>
                </div>

                {useCustomType && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Custom Form Type Setup (Business-specific)</p>
                    <div>
                        <TooltippedLabel label="Custom Form Type Name" tip="Name shown on this form, e.g. Passenger Intake." />
                        <input
                            value={customTypeLabel}
                            onChange={(e) => setCustomTypeLabel(e.target.value)}
                            placeholder="e.g. Passenger Manifest, Intake, Booking"
                            className="mt-2 w-full h-11 rounded-xl border border-gray-200 px-3 text-sm font-medium"
                        />
                    </div>
                    <div className="flex flex-col md:flex-row gap-3">
                        <input
                            value={newTypeOption}
                            onChange={(e) => setNewTypeOption(e.target.value)}
                            placeholder="Add a type e.g. Passenger Intake, Booking, Warranty Claim"
                            className="flex-1 h-10 rounded-lg border border-gray-200 px-3 text-sm"
                        />
                        <button
                            onClick={() => {
                                if (!newTypeOption.trim()) return;
                                addCustomTypeOption(businessId, newTypeOption);
                                setCustomTypeLabel(newTypeOption.trim());
                                setNewTypeOption('');
                                toast.success('Custom form type added');
                            }}
                            className="h-10 px-4 rounded-lg bg-primary text-white text-xs font-black uppercase tracking-widest"
                        >
                            Add Type
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {customTypeOptions.length === 0 && (
                            <p className="text-xs text-text-secondary font-medium">No custom types yet.</p>
                        )}
                        {customTypeOptions.map((label) => (
                            <button
                                key={label}
                                onClick={() => {
                                    setCustomTypeLabel(label);
                                }}
                                className="h-8 px-3 rounded-full bg-white border border-gray-200 text-xs font-bold text-text-main flex items-center gap-2"
                            >
                                <span>{label}</span>
                                <span
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeCustomTypeOption(businessId, label);
                                        toast.success('Custom form type removed');
                                    }}
                                    className="text-text-secondary hover:text-red-500"
                                >
                                    <X size={12} />
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
                )}
                </>
                )}

                {wizardStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <TooltippedLabel label="Response Owner" tip="Bot for automation, Agent for manual handling." />
                        <select value={responseActor} onChange={(e) => setResponseActor(e.target.value as ResponseActor)} className="mt-2 w-full h-11 rounded-xl border-gray-200 text-sm font-bold">
                            <option value="agent">Agent</option>
                            <option value="bot">Bot</option>
                        </select>
                    </div>
                    <div>
                        <TooltippedLabel label="Respond Via" tip="Select one or more channels for responses." />
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
                )}

                {wizardStep === 3 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary">Form Fields</h3>
                            <Tooltip content="Add customer questions. Multiple choice fields require comma-separated options.">
                                <span className="inline-flex items-center text-text-secondary cursor-help">
                                    <CircleHelp size={13} />
                                </span>
                            </Tooltip>
                        </div>
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
                )}

                {wizardStep === 4 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-gray-200 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Form Summary</p>
                            <div className="space-y-1.5 text-sm text-text-main">
                                <p><span className="font-bold">Type:</span> {useCustomType ? (customTypeLabel || 'Custom') : TYPE_OPTIONS.find((t) => t.value === predefinedType)?.label}</p>
                                <p><span className="font-bold">Title:</span> {title || '-'}</p>
                                <p><span className="font-bold">Key:</span> {buildKey(key || title) || '-'}</p>
                                <p><span className="font-bold">Fields:</span> {fields.length}</p>
                            </div>
                        </div>
                        <div className="rounded-xl border border-gray-200 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Response Setup</p>
                            <div className="space-y-1.5 text-sm text-text-main">
                                <p><span className="font-bold">Owner:</span> {responseActor}</p>
                                <p><span className="font-bold">Channels:</span> {channels.join(', ') || '-'}</p>
                                <p className="text-xs text-text-secondary mt-2">This form is sent to admin for approval after submission.</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <button
                        onClick={goPrevStep}
                        disabled={wizardStep === 1}
                        className="h-11 px-5 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    {wizardStep < 4 ? (
                        <button onClick={goNextStep} className="h-11 px-5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest">
                            Next Step
                        </button>
                    ) : (
                        <button onClick={handleCreateForm} className="h-11 px-6 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest">
                            Save for Approval
                        </button>
                    )}
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
                                    {(form.typeLabel || (form.type === 'custom' ? 'CUSTOM' : form.type.toUpperCase()))} - {`/forms/${form.key}`}
                                </p>
                                <p className="text-[10px] text-text-secondary font-medium mt-1">
                                    ID: {form.id}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusBadge(form.status)}`}>
                                    {statusIcon(form.status)}
                                    {form.status}
                                </span>
                                <Link
                                    href={`/dashboard/settings/engagement/forms/${form.id}`}
                                    className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-black uppercase tracking-widest text-text-secondary flex items-center gap-1"
                                >
                                    Preview
                                </Link>
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
