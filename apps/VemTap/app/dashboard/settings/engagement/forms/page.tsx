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
    const [reviewPreviewMode, setReviewPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
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
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <div className="xl:col-span-7 space-y-4">
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
                            <div key={field.id} className="border border-gray-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-3 bg-white">
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

                    <div className="xl:col-span-5">
                        <div className="sticky top-28">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-primary text-lg">smartphone</span>
                                <span className="text-[11px] font-black uppercase tracking-widest text-text-secondary">Live Preview</span>
                            </div>

                            <div className="relative mx-auto w-full max-w-[320px] aspect-[9/19] bg-slate-900 rounded-[2.5rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-800 rounded-b-2xl z-20"></div>
                                <div className="absolute inset-0 bg-gray-50 p-5 overflow-y-auto">
                                    <div className="mt-6 space-y-4">
                                        <div>
                                            <h4 className="text-base font-black text-text-main leading-tight">{title || 'Form title preview'}</h4>
                                            <p className="text-[10px] text-text-secondary mt-1">Please share your feedback.</p>
                                        </div>
                                        {fields.slice(0, 4).map((field) => (
                                            <div key={`pv-${field.id}`} className="space-y-1">
                                                <label className="text-[11px] font-bold text-slate-700">{field.label || 'Untitled field'}</label>
                                                <div className="h-9 rounded-lg border border-gray-200 bg-white" />
                                            </div>
                                        ))}
                                        {fields.length > 4 && (
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">+ {fields.length - 4} more fields</p>
                                        )}
                                        <button className="w-full h-10 rounded-lg bg-primary text-white text-xs font-black uppercase tracking-wider">Submit</button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 bg-primary/5 rounded-2xl p-4 border border-primary/10">
                                <p className="text-xs font-bold text-text-main">Preview Tip</p>
                                <p className="text-xs text-text-secondary mt-1">Preview updates instantly as field labels change.</p>
                            </div>
                        </div>
                    </div>
                </div>
                )}

                {wizardStep === 4 && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                            <div className="xl:col-span-4 space-y-4">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-primary">
                                        <span className="material-symbols-outlined text-base">verified</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Step 3 of 3</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-text-main tracking-tight">Review &amp; Publish</h3>
                                    <p className="text-sm text-text-secondary">Verify your configuration. Once submitted, admin will review it before it goes live.</p>
                                </div>

                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-sm font-semibold text-text-secondary">Completion Status</span>
                                        <span className="text-sm font-bold text-primary">100% Ready</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                        <div className="bg-primary h-full w-full" />
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                                        <h4 className="font-bold text-text-main">Configuration Summary</h4>
                                        <button className="text-primary text-xs font-bold hover:underline">Edit All</button>
                                    </div>
                                    <div className="p-5 flex flex-col gap-4">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest">Form Title</label>
                                            <p className="text-sm font-medium text-text-main">{title || 'Untitled form'}</p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest">Type</label>
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary text-sm">public</span>
                                                <p className="text-sm font-medium text-text-main">{useCustomType ? (customTypeLabel || 'Custom') : TYPE_OPTIONS.find((t) => t.value === predefinedType)?.label}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest">Field Count</label>
                                            <p className="text-sm font-medium text-text-main">{fields.length} Active Fields</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <div className="px-5 py-4 bg-gray-50">
                                        <h4 className="text-sm font-bold text-text-main uppercase tracking-wide">Component Checklist</h4>
                                    </div>
                                    <div className="p-4 flex flex-col gap-3">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 size={18} className="text-green-500" />
                                            <div>
                                                <p className="text-sm font-semibold text-text-main">Input Validation</p>
                                                <p className="text-xs text-text-secondary">{fields.some((f) => f.type === 'email') ? 'Email field checks included' : 'Basic required-field checks included'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 border-t border-gray-100 pt-3">
                                            <CheckCircle2 size={18} className="text-green-500" />
                                            <div>
                                                <p className="text-sm font-semibold text-text-main">Response Routing</p>
                                                <p className="text-xs text-text-secondary">Configured via {channels.join(', ') || 'email'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 border-t border-gray-100 pt-3">
                                            <CheckCircle2 size={18} className="text-green-500" />
                                            <div>
                                                <p className="text-sm font-semibold text-text-main">Form URL</p>
                                                <p className="text-xs text-text-secondary">Set to /forms/{buildKey(key || title) || 'your-form-key'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 relative group">
                                    <button
                                        onClick={handleCreateForm}
                                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all"
                                    >
                                        Submit for Approval
                                        <span className="material-symbols-outlined text-sm">send</span>
                                    </button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-text-main text-white text-[11px] p-3 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl">
                                        <p className="font-bold mb-1">Administrative Review Required</p>
                                        Admin will review branding and response flow before this form goes live.
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-text-main"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="xl:col-span-8 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-text-secondary">visibility</span>
                                        <h4 className="font-bold text-text-main">Live Preview</h4>
                                    </div>
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        <button
                                            onClick={() => setReviewPreviewMode('desktop')}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold ${
                                                reviewPreviewMode === 'desktop' ? 'bg-white shadow-sm text-text-main' : 'text-text-secondary'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-sm">desktop_windows</span> Desktop
                                        </button>
                                        <button
                                            onClick={() => setReviewPreviewMode('mobile')}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold ${
                                                reviewPreviewMode === 'mobile' ? 'bg-white shadow-sm text-text-main' : 'text-text-secondary'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-sm">smartphone</span> Mobile
                                        </button>
                                    </div>
                                </div>

                                {reviewPreviewMode === 'desktop' ? (
                                    <div className="flex-1 min-h-[600px] border border-gray-200 rounded-2xl overflow-hidden shadow-2xl bg-white flex flex-col">
                                        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-4">
                                            <div className="flex gap-1.5">
                                                <div className="size-3 rounded-full bg-gray-300"></div>
                                                <div className="size-3 rounded-full bg-gray-300"></div>
                                                <div className="size-3 rounded-full bg-gray-300"></div>
                                            </div>
                                            <div className="flex-1 bg-white border border-gray-200 rounded-md py-1 px-3 text-[10px] text-text-secondary flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[14px]">lock</span>
                                                {`https://preview.vemtap.io/forms/${buildKey(key || title) || 'your-form-key'}`}
                                            </div>
                                            <span className="material-symbols-outlined text-text-secondary text-sm">open_in_new</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto bg-gray-50/60 p-8 md:p-12">
                                            <div className="max-w-2xl mx-auto bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
                                                <div className="h-24 bg-gradient-to-r from-primary/10 to-primary/30"></div>
                                                <div className="p-8">
                                                    <h4 className="text-2xl font-bold text-text-main mb-2">{title || 'Customer Feedback Survey 2024'}</h4>
                                                    <p className="text-text-secondary text-sm mb-8">We value your opinion. Please take 2 minutes to fill out this form to help us improve our services.</p>
                                                    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
                                                        {fields.slice(0, 4).map((field) => (
                                                            <div key={`review-desktop-${field.id}`} className="flex flex-col gap-2">
                                                                <label className="text-sm font-semibold text-text-main">
                                                                    {field.label || 'Untitled field'} {field.required ? <span className="text-red-500">*</span> : null}
                                                                </label>
                                                                <input
                                                                    className="w-full rounded-lg border-gray-200 text-sm"
                                                                    placeholder={field.type === 'email' ? 'john@example.com' : 'Type here...'}
                                                                    type={field.type === 'email' ? 'email' : 'text'}
                                                                    readOnly
                                                                />
                                                            </div>
                                                        ))}
                                                        <button className="w-full bg-primary text-white font-bold py-3 rounded-lg mt-2 opacity-80 cursor-not-allowed">
                                                            Submit Feedback
                                                        </button>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mx-auto w-full max-w-[360px] rounded-[2rem] border border-gray-200 bg-white p-4 shadow-lg">
                                        <div className="relative mx-auto w-full max-w-[320px] aspect-[9/19] bg-slate-900 rounded-[2.5rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden">
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-800 rounded-b-2xl z-20"></div>
                                            <div className="absolute inset-0 bg-gray-50 p-5 overflow-y-auto">
                                                <div className="mt-6 space-y-4">
                                                    <div>
                                                        <h4 className="text-base font-black text-text-main leading-tight">{title || 'Form title preview'}</h4>
                                                        <p className="text-[10px] text-text-secondary mt-1">Please share your feedback.</p>
                                                    </div>
                                                    {fields.slice(0, 4).map((field) => (
                                                        <div key={`review-mobile-${field.id}`} className="space-y-1">
                                                            <label className="text-[11px] font-bold text-text-main">{field.label || 'Untitled field'}</label>
                                                            <div className="h-9 rounded-lg border border-gray-200 bg-white" />
                                                        </div>
                                                    ))}
                                                    <button className="w-full h-10 rounded-lg bg-primary text-white text-xs font-black uppercase tracking-wider">Submit</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="lg:hidden sticky bottom-0 bg-white border border-gray-200 rounded-xl p-4 flex gap-3 z-10">
                            <button
                                onClick={goPrevStep}
                                className="flex-1 bg-gray-100 text-text-main font-bold py-3 rounded-xl"
                            >
                                Previous
                            </button>
                            <button
                                onClick={handleCreateForm}
                                className="flex-[2] bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20"
                            >
                                Submit for Approval
                            </button>
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
                    ) : null}
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
