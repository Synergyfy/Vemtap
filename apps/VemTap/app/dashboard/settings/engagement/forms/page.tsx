'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CircleHelp, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/dashboard/PageHeader';
import Tooltip from '@/components/ui/Tooltip';
import { useAuthStore } from '@/store/useAuthStore';
import { useBranches } from '@/services/branches/hooks';
import {
    useBusinessForms,
    useCreateBusinessForm,
    useDeleteBusinessForm,
} from '@/services/business-forms/hooks';
import type { ApiFormFieldType } from '@/services/business-forms/types';

type DraftField = {
    id: string;
    type: ApiFormFieldType;
    question: string;
    optionsText: string;
    isRequired: boolean;
};

const FIELD_TYPES: Array<{ label: string; value: ApiFormFieldType }> = [
    { label: 'Text', value: 'text' },
    { label: 'Textarea', value: 'textarea' },
    { label: 'Number', value: 'number' },
    { label: 'Select', value: 'select' },
    { label: 'Radio', value: 'radio' },
    { label: 'Checkbox', value: 'checkbox' },
    { label: 'Date', value: 'date' },
];

const WIZARD_STEPS = [
    { id: 1, title: 'Basics' },
    { id: 2, title: 'Fields' },
    { id: 3, title: 'Preview & Publish' },
] as const;

const createDraftField = (index: number): DraftField => ({
    id: `draft-${index}`,
    type: 'text',
    question: '',
    optionsText: '',
    isRequired: false,
});

const LabelWithTip = ({ label, tip }: { label: string; tip: string }) => (
    <div className="flex items-center gap-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{label}</label>
        <Tooltip content={tip}>
            <span className="text-text-secondary inline-flex cursor-help">
                <CircleHelp size={12} />
            </span>
        </Tooltip>
    </div>
);

function FieldPreview({ field }: { field: DraftField }) {
    if (field.type === 'radio' || field.type === 'select' || field.type === 'checkbox') {
        const options = field.optionsText
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        return (
            <div className="space-y-2">
                {(options.length ? options : ['Option 1', 'Option 2']).map((option) => (
                    <div key={`${field.id}-${option}`} className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 flex items-center text-xs text-text-secondary">
                        {option}
                    </div>
                ))}
            </div>
        );
    }

    if (field.type === 'textarea') {
        return <div className="h-20 rounded-lg border border-gray-200 bg-gray-50" />;
    }

    if (field.type === 'date') {
        return <div className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 flex items-center text-xs text-text-secondary">YYYY-MM-DD</div>;
    }

    return <div className="h-10 rounded-lg border border-gray-200 bg-gray-50" />;
}

export default function EngagementFormsBuilderPage() {
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const userBranchId = useAuthStore((state) => state.user?.branchId);

    const { data: branches = [] } = useBranches();
    const { data: forms = [], isLoading: formsLoading } = useBusinessForms();
    const createMutation = useCreateBusinessForm();
    const deleteMutation = useDeleteBusinessForm();

    const defaultBranchId = activeBranchId || userBranchId || branches[0]?.id || '';

    const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isPublished, setIsPublished] = useState(true);
    const [branchId, setBranchId] = useState(defaultBranchId);
    const [fieldCounter, setFieldCounter] = useState(2);
    const [fields, setFields] = useState<DraftField[]>([
        { ...createDraftField(1), question: 'What was the reason for your visit?', isRequired: true },
    ]);

    const orderedFieldsPreview = useMemo(
        () =>
            fields.map((field, index) => ({
                ...field,
                order: index + 1,
                label: field.question.trim() || `Question ${index + 1}`,
            })),
        [fields]
    );

    useEffect(() => {
        if (!branchId && defaultBranchId) {
            setBranchId(defaultBranchId);
        }
    }, [branchId, defaultBranchId]);

    const updateField = (id: string, updates: Partial<DraftField>) => {
        setFields((prev) => prev.map((field) => (field.id === id ? { ...field, ...updates } : field)));
    };

    const addField = () => {
        const next = fieldCounter + 1;
        setFieldCounter(next);
        setFields((prev) => [...prev, createDraftField(next)]);
    };

    const removeField = (id: string) => {
        setFields((prev) => prev.filter((field) => field.id !== id));
    };

    const validateStep = (step: number) => {
        if (step === 1) {
            if (!title.trim()) {
                toast.error('Title is required');
                return false;
            }
            if (!branchId) {
                toast.error('Branch is required');
                return false;
            }
        }

        if (step === 2) {
            if (fields.length === 0) {
                toast.error('Add at least one field');
                return false;
            }
            if (fields.some((field) => !field.question.trim())) {
                toast.error('Every field needs a question');
                return false;
            }
            if (fields.some((field) => (field.type === 'radio' || field.type === 'select' || field.type === 'checkbox') && !field.optionsText.trim())) {
                toast.error('Select/Radio/Checkbox fields require options');
                return false;
            }
        }

        return true;
    };

    const onNextStep = () => {
        if (!validateStep(wizardStep)) return;
        setWizardStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
    };

    const onPrevStep = () => {
        setWizardStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
    };

    const onCreateForm = async () => {
        if (!validateStep(1) || !validateStep(2)) return;

        try {
            await createMutation.mutateAsync({
                title: title.trim(),
                description: description.trim() || undefined,
                isActive,
                isPublished,
                branchId,
                fields: fields.map((field, index) => ({
                    type: field.type,
                    question: field.question.trim(),
                    options:
                        field.type === 'radio' || field.type === 'select' || field.type === 'checkbox'
                            ? field.optionsText
                                  .split(',')
                                  .map((option) => option.trim())
                                  .filter(Boolean)
                            : undefined,
                    isRequired: field.isRequired,
                    order: index + 1,
                })),
            });

            setTitle('');
            setDescription('');
            setIsActive(true);
            setIsPublished(true);
            setFields([{ ...createDraftField(1), question: 'What was the reason for your visit?', isRequired: true }]);
            setFieldCounter(2);
            setWizardStep(1);
            toast.success('Form created');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to create form');
        }
    };

    const onDeleteForm = async (id: string) => {
        try {
            await deleteMutation.mutateAsync(id);
            toast.success('Form deleted');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to delete form');
        }
    };

    return (
        <div className="p-8 space-y-8">
            <PageHeader
                title="Business Forms"
                description="Create and manage forms using the business-forms API."
            />

            <div className="flex items-center gap-3">
                <Link href="/dashboard/settings/engagement/socials" className="px-4 h-10 rounded-xl bg-white border border-gray-200 text-sm font-bold text-text-secondary flex items-center">Socials</Link>
                <span className="px-4 h-10 rounded-xl bg-primary text-white text-sm font-black flex items-center">Form Creator</span>
                <Link href="/dashboard/settings/engagement/forms/responses" className="px-4 h-10 rounded-xl bg-white border border-gray-200 text-sm font-bold text-text-secondary flex items-center">Form Responses</Link>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
                <div className="grid grid-cols-3 gap-3">
                    {WIZARD_STEPS.map((step) => {
                        const isActiveStep = wizardStep === step.id;
                        const isDone = wizardStep > step.id;
                        return (
                            <div
                                key={step.id}
                                className={`h-11 rounded-xl border px-3 flex items-center gap-2 ${isActiveStep ? 'bg-primary text-white border-primary' : isDone ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'border-gray-200 text-text-secondary'}`}
                            >
                                <span className="text-xs font-black">{step.id}</span>
                                <span className="text-xs font-black uppercase tracking-wider">{step.title}</span>
                            </div>
                        );
                    })}
                </div>

                {wizardStep === 1 && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <LabelWithTip label="Title" tip="Public form title shown to users." />
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"
                                placeholder="Customer Feedback"
                            />

                            <LabelWithTip label="Description" tip="Optional description shown under the title." />
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full min-h-20 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                placeholder="Let us know how your visit went"
                            />

                            <LabelWithTip label="Branch" tip="API requires a branchId for form creation." />
                            <select
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"
                            >
                                <option value="">Select branch</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="h-11 border border-gray-200 rounded-xl px-3 text-sm flex items-center justify-between">
                                    <span className="font-semibold">Active</span>
                                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                                </label>
                                <label className="h-11 border border-gray-200 rounded-xl px-3 text-sm flex items-center justify-between">
                                    <span className="font-semibold">Published</span>
                                    <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
                                </label>
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Quick Summary</p>
                            <h3 className="text-lg font-bold text-text-main mt-2">{title || 'Form title'}</h3>
                            <p className="text-sm text-text-secondary mt-1">{description || 'Form description'}</p>
                            <p className="text-xs text-text-secondary mt-4">Branch: {branchId || 'Not selected'}</p>
                        </div>
                    </div>
                )}

                {wizardStep === 2 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Fields</p>
                                <Tooltip content="These fields map directly to API field objects.">
                                    <span className="text-text-secondary inline-flex cursor-help"><CircleHelp size={12} /></span>
                                </Tooltip>
                            </div>
                            <button onClick={addField} className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-black uppercase tracking-widest">
                                Add Field
                            </button>
                        </div>

                        {fields.map((field, index) => (
                            <div key={field.id} className="rounded-xl border border-gray-200 p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-black text-text-main">Field {index + 1}</p>
                                    {fields.length > 1 && (
                                        <button onClick={() => removeField(field.id)} className="text-red-600">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                                <select
                                    value={field.type}
                                    onChange={(e) => updateField(field.id, { type: e.target.value as ApiFormFieldType })}
                                    className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm"
                                >
                                    {FIELD_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                                <input
                                    value={field.question}
                                    onChange={(e) => updateField(field.id, { question: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm"
                                    placeholder="Question"
                                />
                                {(field.type === 'radio' || field.type === 'select' || field.type === 'checkbox') && (
                                    <input
                                        value={field.optionsText}
                                        onChange={(e) => updateField(field.id, { optionsText: e.target.value })}
                                        className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm"
                                        placeholder="Options (comma separated)"
                                    />
                                )}
                                <label className="text-xs text-text-secondary flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={field.isRequired}
                                        onChange={(e) => updateField(field.id, { isRequired: e.target.checked })}
                                    />
                                    Required
                                </label>
                            </div>
                        ))}
                    </div>
                )}

                {wizardStep === 3 && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div className="rounded-xl border border-gray-200 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Desktop Preview</p>
                            <div className="mt-3 rounded-xl border border-gray-200 p-4 bg-gray-50">
                                <h3 className="text-lg font-bold text-text-main">{title || 'Form title'}</h3>
                                <p className="text-sm text-text-secondary mt-1">{description || 'Form description'}</p>
                                <div className="mt-4 space-y-3">
                                    {orderedFieldsPreview.map((field) => (
                                        <div key={`${field.id}-desktop`} className="space-y-1">
                                            <p className="text-sm font-semibold text-text-main">
                                                {field.order}. {field.label} {field.isRequired ? <span className="text-red-500">*</span> : null}
                                            </p>
                                            <FieldPreview field={field} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Mobile Preview (Before Publish)</p>
                            <div className="mx-auto mt-3 w-full max-w-[360px] rounded-[2rem] border border-gray-200 bg-white p-4 shadow-lg">
                                <div className="relative mx-auto w-full max-w-[320px] aspect-[9/19] bg-slate-900 rounded-[2.5rem] border-[8px] border-slate-800 overflow-hidden">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-800 rounded-b-2xl z-20"></div>
                                    <div className="absolute inset-0 bg-gray-50 p-4 overflow-y-auto">
                                        <h4 className="text-sm font-black text-text-main mt-6">{title || 'Form title'}</h4>
                                        <p className="text-[10px] text-text-secondary mt-1">{description || 'Form description'}</p>
                                        <div className="mt-4 space-y-3">
                                            {orderedFieldsPreview.slice(0, 5).map((field) => (
                                                <div key={`${field.id}-mobile`} className="space-y-1">
                                                    <p className="text-[11px] font-semibold text-text-main">{field.label}</p>
                                                    <FieldPreview field={field} />
                                                </div>
                                            ))}
                                        </div>
                                        <button className="mt-4 w-full h-9 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-widest opacity-90 cursor-not-allowed">
                                            Submit
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onCreateForm}
                                disabled={createMutation.isPending}
                                className="mt-4 w-full h-11 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest disabled:opacity-60"
                            >
                                {createMutation.isPending ? 'Publishing...' : 'Publish Form'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <button
                        onClick={onPrevStep}
                        disabled={wizardStep === 1}
                        className="h-11 px-5 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    {wizardStep < 3 && (
                        <button onClick={onNextStep} className="h-11 px-5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest">
                            Next Step
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-sm font-black uppercase tracking-widest text-text-secondary">Existing Forms</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-widest text-text-secondary border-b border-gray-100">
                                <th className="px-5 py-3 font-black">Title</th>
                                <th className="px-5 py-3 font-black">Branch</th>
                                <th className="px-5 py-3 font-black">State</th>
                                <th className="px-5 py-3 font-black">Fields</th>
                                <th className="px-5 py-3 font-black text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formsLoading && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-6 text-sm text-text-secondary">Loading forms...</td>
                                </tr>
                            )}
                            {!formsLoading && forms.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-6 text-sm text-text-secondary">No forms yet.</td>
                                </tr>
                            )}
                            {forms.map((form) => (
                                <tr key={form.id} className="border-b border-gray-50">
                                    <td className="px-5 py-4">
                                        <p className="text-sm font-bold text-text-main">{form.title}</p>
                                        <p className="text-xs text-text-secondary">{form.description || 'No description'}</p>
                                    </td>
                                    <td className="px-5 py-4 text-xs text-text-secondary">{form.branchId}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${form.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {form.isPublished ? 'Published' : 'Draft'}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${form.isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {form.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm font-bold text-text-main">{form.fields?.length}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex justify-end items-center gap-2">
                                            <Link href={`/dashboard/settings/engagement/forms/${form.id}`} className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-bold text-text-secondary flex items-center">
                                                Preview
                                            </Link>
                                            <Link href={`/dashboard/settings/engagement/forms/responses/${form.id}`} className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-bold text-text-secondary flex items-center">
                                                Responses
                                            </Link>
                                            <button
                                                onClick={() => onDeleteForm(form.id)}
                                                className="h-8 px-3 rounded-lg border border-red-200 text-xs font-bold text-red-600"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
