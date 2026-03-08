'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleHelp, Copy, Ellipsis, MessageSquareText, Pencil, Plus, QrCode, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/dashboard/PageHeader';
import EngagementTabs from '@/components/dashboard/engagement/EngagementTabs';
import Tooltip2 from '@/components/ui/Tooltip2';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { StepBusinessForm } from '@/components/visitor/StepBusinessForm';
import { useAuthStore } from '@/store/useAuthStore';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useBranches } from '@/services/branches/hooks';
import { useBusinessForms, useCreateBusinessForm, useCreateFormTemplate, useDeleteBusinessForm, useFormTemplates, useUpdateBusinessForm } from '@/services/business-forms/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import type { ApiFormFieldType, BusinessForm, CreateBusinessFormRequest } from '@/services/business-forms/types';

type DraftField = { id: string; type: ApiFormFieldType; question: string; optionsText: string; isRequired: boolean };
const TYPES: ApiFormFieldType[] = ['text', 'textarea', 'number', 'select', 'radio', 'checkbox', 'date'];
const TARGETS = ['Messaging Center', 'Instagram bio', 'Google review flow', 'Post-subscription onboarding'];
const MODES: Array<'link' | 'qr' | 'messaging'> = ['link', 'qr', 'messaging'];
const mkField = (n: number): DraftField => ({ id: `draft-${n}`, type: 'text', question: '', optionsText: '', isRequired: false });
const shareLink = (id: string) => (typeof window === 'undefined' ? `/forms/${id}` : `${window.location.origin}/forms/${id}`);

const L = ({ label, tip }: { label: string; tip: string }) => (
    <div className="flex items-center gap-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{label}</label>
        <Tooltip2 content={tip} side="right"><span className="inline-flex cursor-help text-text-secondary"><CircleHelp size={12} /></span></Tooltip2>
    </div>
);

export default function EngagementFormsBuilderPage() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const { data: myBusiness } = useMyBusiness();
    const updateEngagementSettings = useCustomerFlowStore((s) => s.updateEngagementSettings);
    const existingEngagementSettings = useCustomerFlowStore((s) => s.engagementSettings);
    const activeBranchId = useAuthStore((s) => s.activeBranchId);
    const userBranchId = useAuthStore((s) => s.user?.branchId);
    const { data: branches = [] } = useBranches();
    const { data: forms = [], isLoading: formsLoading } = useBusinessForms();
    const { data: templates = [] } = useFormTemplates();
    const createMutation = useCreateBusinessForm();
    const createTemplateMutation = useCreateFormTemplate();
    const deleteMutation = useDeleteBusinessForm();

    const defaultBranchId = activeBranchId && activeBranchId !== 'all' ? activeBranchId : userBranchId || branches[0]?.id || '';
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [editingId, setEditingId] = useState<string | null>(null);
    const updateMutation = useUpdateBusinessForm(editingId || '');
    const [branchId, setBranchId] = useState(defaultBranchId);
    const [templateId, setTemplateId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [instructions, setInstructions] = useState('Configure your business after tapping. Share the form by link, QR code, or Messaging Center.');
    const [redirectLabel, setRedirectLabel] = useState('Thank You Page');
    const [redirectUrl, setRedirectUrl] = useState('');
    const [usageModes, setUsageModes] = useState<Array<'link' | 'qr' | 'messaging'>>(['link', 'qr', 'messaging']);
    const [linkedTargets, setLinkedTargets] = useState<string[]>(['Messaging Center']);
    const [fields, setFields] = useState<DraftField[]>([{ ...mkField(1), question: 'What was the reason for your visit?', isRequired: true }]);
    const [fieldCounter, setFieldCounter] = useState(2);
    const [saveAsTemplate, setSaveAsTemplate] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [qrFormId, setQrFormId] = useState<string | null>(null);
    const [postSubmitFormIds, setPostSubmitFormIds] = useState<string[]>([]);

    useEffect(() => { if (!branchId && defaultBranchId) setBranchId(defaultBranchId); }, [branchId, defaultBranchId]);
    useEffect(() => {
        const ids = Array.isArray(user?.engagement?.postSubmitFormIds)
            ? user.engagement.postSubmitFormIds
            : [];
        setPostSubmitFormIds(ids);
    }, [user?.engagement?.postSubmitFormIds]);

    const selectedTemplate = useMemo(() => templates.find((t) => t.id === templateId) || null, [templates, templateId]);
    useEffect(() => {
        if (!selectedTemplate) return;
        setDescription(selectedTemplate.description || '');
        setInstructions(selectedTemplate.instructions || '');
        setRedirectLabel(selectedTemplate.redirectLabel || 'Thank You Page');
        setRedirectUrl(selectedTemplate.redirectUrl || '');
        setUsageModes(selectedTemplate.usageModes?.length ? selectedTemplate.usageModes : ['link', 'qr', 'messaging']);
        setLinkedTargets(selectedTemplate.linkedTargets?.length ? selectedTemplate.linkedTargets : []);
        setFields(selectedTemplate.fields.map((f, i) => ({ id: `draft-${i + 1}`, type: f.type, question: f.question, optionsText: (f.options || []).join(', '), isRequired: f.isRequired })));
        setFieldCounter(selectedTemplate.fields.length + 1);
    }, [selectedTemplate]);

    const branchName = useMemo(() => branches.find((b) => b.id === branchId)?.name || branchId || 'No Branch', [branchId, branches]);
    const currentBusinessName = myBusiness?.name || user?.businessName || 'Your Business';
    const currentBusinessLogo = myBusiness?.logoUrl || user?.businessLogo;
    const previewForm = useMemo(() => ({
        id: 'preview', title: title || 'Form title', description, instructions, branchName, businessName: currentBusinessName, businessLogo: currentBusinessLogo, redirectLabel, redirectUrl: redirectUrl || undefined,
        fields: fields.map((f, i) => ({ id: f.id, type: f.type, question: f.question || `Question ${i + 1}`, options: f.optionsText.split(',').map((x) => x.trim()).filter(Boolean), isRequired: f.isRequired, order: i + 1 })),
    }), [branchName, currentBusinessLogo, currentBusinessName, description, fields, instructions, redirectLabel, redirectUrl, title]);

    const valid = () => {
        if (!title.trim()) return toast.error('Title is required'), false;
        if (!branchId) return toast.error('Branch is required'), false;
        if (fields.some((f) => !f.question.trim())) return toast.error('Each field needs a question'), false;
        if (fields.some((f) => (f.type === 'radio' || f.type === 'select' || f.type === 'checkbox') && !f.optionsText.trim())) return toast.error('Select, radio, and checkbox fields require options'), false;
        return true;
    };
    const payload = (): CreateBusinessFormRequest => ({
        title: title.trim(), description: description.trim() || undefined, instructions: instructions.trim() || undefined, redirectLabel: redirectLabel.trim() || undefined, redirectUrl: redirectUrl.trim() || undefined,
        branchId, businessId: user?.businessId, businessName: currentBusinessName, businessLogo: currentBusinessLogo, isActive: true, isPublished: true, templateId: templateId || undefined, templateName: selectedTemplate?.name, templateScope: selectedTemplate?.scope, usageModes, linkedTargets,
        fields: fields.map((f, i) => ({ type: f.type, question: f.question.trim(), options: f.optionsText.split(',').map((x) => x.trim()).filter(Boolean), isRequired: f.isRequired, order: i + 1 })),
    });

    const reset = () => { setEditingId(null); setTemplateId(''); setTitle(''); setDescription(''); setInstructions('Configure your business after tapping. Share the form by link, QR code, or Messaging Center.'); setRedirectLabel('Thank You Page'); setRedirectUrl(''); setUsageModes(['link', 'qr', 'messaging']); setLinkedTargets(['Messaging Center']); setFields([{ ...mkField(1), question: 'What was the reason for your visit?', isRequired: true }]); setFieldCounter(2); setSaveAsTemplate(false); setTemplateName(''); setStep(1); };
    const startEdit = (form: BusinessForm) => { setEditingId(form.id); setTemplateId(form.templateId || ''); setTitle(form.title || ''); setDescription(form.description || ''); setInstructions(form.instructions || ''); setRedirectLabel(form.redirectLabel || 'Thank You Page'); setRedirectUrl(form.redirectUrl || ''); setBranchId(form.branchId || defaultBranchId); setUsageModes(form.usageModes?.length ? form.usageModes : ['link', 'qr', 'messaging']); setLinkedTargets(form.linkedTargets?.length ? form.linkedTargets : []); setFields((form.fields || []).map((f, i) => ({ id: f.id || `draft-${i + 1}`, type: f.type, question: f.question, optionsText: (f.options || []).join(', '), isRequired: f.isRequired }))); setFieldCounter((form.fields || []).length + 1); setStep(1); };

    const save = async () => {
        if (!valid()) return;
        try {
            if (editingId) {
                await updateMutation.mutateAsync(payload());
                toast.success('Form updated');
                setEditingId(null);
            } else {
                const created = await createMutation.mutateAsync(payload());
                if (saveAsTemplate && templateName.trim()) await createTemplateMutation.mutateAsync({ name: templateName.trim(), description: description.trim() || undefined, branchId, scope: 'branch', fields: payload().fields, redirectLabel: redirectLabel.trim() || undefined, redirectUrl: redirectUrl.trim() || undefined, usageModes, linkedTargets, instructions: instructions.trim() || undefined });
                toast.success('Form created');
                setQrFormId(created.id);
            }
        } catch (e: any) {
            toast.error(e?.message || 'Failed to save form');
        }
    };

    const onDelete = async (id: string) => {
        try {
            await deleteMutation.mutateAsync(id);
            toast.success('Form deleted');
            if (editingId === id) reset();
        } catch (e: any) {
            toast.error(e?.message || 'Failed to delete form');
        }
    };

    const savePostSubmitForms = async (ids: string[]) => {
        const nextEngagement = {
            ...(user?.engagement || {}),
            ...(existingEngagementSettings || {}),
            postSubmitFormIds: ids,
        };

        try {
            const { usersApi } = await import('@/lib/api/users');
            await usersApi.updateEngagement(nextEngagement);
        } catch (e) {
            // Keep local state in sync even if the endpoint role policy blocks this request.
            console.warn('Failed to persist post-submit form ids:', e);
        }

        await useAuthStore.getState().updateUser({ engagement: nextEngagement });
        updateEngagementSettings({ postSubmitFormIds: ids });
    };

    const togglePostSubmitForm = async (formId: string) => {
        const exists = postSubmitFormIds.includes(formId);
        const nextIds = exists
            ? postSubmitFormIds.filter((id) => id !== formId)
            : [...postSubmitFormIds, formId];
        setPostSubmitFormIds(nextIds);
        await savePostSubmitForms(nextIds);
        toast.success(
            exists
                ? 'Removed from post-submit journey'
                : 'Form attached to post-submit journey'
        );
    };

    const downloadQrCode = (id: string) => {
        const svg = document.getElementById(`form-qr-${id}`) as SVGSVGElement | null;
        if (!svg) {
            toast.error('QR not ready');
            return;
        }
        const source = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${id}-qr.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('QR downloaded');
    };

    const formsWithLink = forms.map((f) => ({ ...f, s: shareLink(f.id) }));

    return (
        <div className="p-8 space-y-8">
            <PageHeader title="Visitor Forms" description="Step-by-step form creator with mobile review and publishing." />
            <EngagementTabs tabs={[{ label: 'Socials', href: '/dashboard/settings/engagement/socials' }, { label: 'Form Creator', active: true }, { label: 'Responses', href: '/dashboard/settings/engagement/forms/responses' }]} />

            <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Engagement Overview</p>
                        <h2 className="text-lg font-black text-text-main">How this form flow works</h2>
                    </div>
                    <button onClick={() => router.push('/bussinesss')} className="h-10 px-4 rounded-xl border border-primary/20 text-xs font-black text-primary hover:bg-primary/5">Open Tutorial Docs</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                        {
                            title: '1. Build Form',
                            desc: 'Create fields, branch assignment, and submit behavior.',
                            cta: 'Go to Builder Step',
                            action: () => setStep(1),
                        },
                        {
                            title: '2. Share Form',
                            desc: 'Copy public form links or attach forms in messaging.',
                            cta: 'Open Messaging',
                            action: () => router.push('/dashboard/messaging/compose'),
                        },
                        {
                            title: '3. Track Responses',
                            desc: 'Monitor responses and optimize your engagement journey.',
                            cta: 'View Responses',
                            action: () => router.push('/dashboard/settings/engagement/forms/responses'),
                        },
                    ].map((card) => (
                        <div key={card.title} className="rounded-xl border border-gray-200 p-4">
                            <p className="text-sm font-black text-text-main">{card.title}</p>
                            <p className="text-xs text-text-secondary mt-1 mb-3">{card.desc}</p>
                            <button onClick={card.action} className="text-xs font-black text-primary hover:underline">{card.cta}</button>
                        </div>
                    ))}
                </div>
                <div className="mt-3">
                    <button onClick={() => router.push('/bussinesss')} className="text-xs font-black text-text-secondary hover:text-primary">
                        Read full walkthrough in Tutorial Dashboard
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                {[1, 2, 3].map((n) => <button key={n} onClick={() => setStep(n as 1 | 2 | 3)} className={`h-11 rounded-xl text-xs font-black uppercase tracking-widest ${step === n ? 'bg-primary text-white' : 'border border-gray-200 text-text-secondary'}`}>Step {n}</button>)}
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-[1.05fr,0.95fr] gap-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                    {editingId && <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 flex items-center justify-between"><span>Editing existing form</span><button onClick={reset} className="underline">Create new</button></div>}
                    {step === 1 && <>
                        <L label="Template" tip="Choose a branch template or create from scratch." />
                        <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"><option value="">Create from scratch</option>{templates.filter((t) => !t.branchId || !branchId || t.branchId === branchId).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                        <L label="Title" tip="Customer-facing form title." /><input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm" />
                        <L label="Description" tip="Help text shown above the form." /><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full min-h-20 rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                        <L label="Branch" tip="This form is assigned to one branch." />
                        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"><option value="">Select branch</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
                        <L label="Instructions" tip="Explain what customer should do." /><textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} className="w-full min-h-24 rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                    </>}
                    {step === 2 && <>
                        <L label="Usage Modes" tip="Enable where this form should run." />
                        <div className="grid grid-cols-3 gap-2">{MODES.map((m) => <button key={m} onClick={() => setUsageModes((p) => p.includes(m) ? p.filter((x) => x !== m) : [...p, m])} className={`h-11 rounded-xl border text-xs font-black uppercase tracking-widest ${usageModes.includes(m) ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-text-secondary'}`}>{m}</button>)}</div>
                        <L label="Linked Targets" tip="Choose journey destinations linked with this form." />
                        <div className="flex flex-wrap gap-2">{TARGETS.map((t) => <button key={t} onClick={() => setLinkedTargets((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t])} className={`px-3 h-9 rounded-full border text-xs font-black ${linkedTargets.includes(t) ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-text-secondary'}`}>{t}</button>)}</div>
                        <L label="Auto Redirect" tip="Optional redirect after form submit." />
                        <input value={redirectLabel} onChange={(e) => setRedirectLabel(e.target.value)} className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm" placeholder="Thank You Page" />
                        <input value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm" placeholder="https://yourbusiness.com/thank-you" />
                        <div className="rounded-xl border border-gray-200 p-4 space-y-3">
                            <div className="flex items-center justify-between"><L label="Fields" tip="Add and structure fields for this form." /><button onClick={() => { const n = fieldCounter + 1; setFieldCounter(n); setFields((p) => [...p, mkField(n)]); }} className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-black"><Plus size={12} /></button></div>
                            {fields.map((f) => <div key={f.id} className="rounded-xl border border-gray-200 p-3 space-y-2"><select value={f.type} onChange={(e) => setFields((p) => p.map((x) => x.id === f.id ? { ...x, type: e.target.value as ApiFormFieldType } : x))} className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm">{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select><input value={f.question} onChange={(e) => setFields((p) => p.map((x) => x.id === f.id ? { ...x, question: e.target.value } : x))} className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm" placeholder="Question" />{(f.type === 'radio' || f.type === 'select' || f.type === 'checkbox') && <input value={f.optionsText} onChange={(e) => setFields((p) => p.map((x) => x.id === f.id ? { ...x, optionsText: e.target.value } : x))} className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm" placeholder="Options (comma separated)" />}<div className="flex items-center justify-between"><label className="text-xs text-text-secondary flex items-center gap-2"><input type="checkbox" checked={f.isRequired} onChange={(e) => setFields((p) => p.map((x) => x.id === f.id ? { ...x, isRequired: e.target.checked } : x))} />Required</label>{fields.length > 1 && <button onClick={() => setFields((p) => p.filter((x) => x.id !== f.id))} className="text-red-600"><Trash2 size={14} /></button>}</div></div>)}
                        </div>
                        {!editingId && <><label className="flex items-center gap-2 text-sm font-medium text-text-main"><input type="checkbox" checked={saveAsTemplate} onChange={(e) => setSaveAsTemplate(e.target.checked)} />Save this as a branch template</label>{saveAsTemplate && <input value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm" placeholder="Branch Feedback Template" />}</>}
                    </>}
                    {step === 3 && <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div className="rounded-xl border border-gray-200 p-3 flex items-center gap-3"><div className="size-12 rounded-xl border border-gray-200 overflow-hidden bg-white flex items-center justify-center">{user?.businessLogo ? <img src={user.businessLogo} alt={user.businessName || 'Business'} className="w-full h-full object-cover" /> : <span className="text-sm font-black text-slate-900">{(user?.businessName || 'B').charAt(0)}</span>}</div><div><p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Current Business</p><p className="text-sm font-bold text-text-main">{user?.businessName || 'Your Business'}</p></div></div><div className="rounded-xl border border-gray-200 p-3"><p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Branch</p><p className="text-sm font-bold text-text-main">{branchName}</p></div></div>}
                    <div className="flex items-center justify-between pt-2"><button onClick={() => setStep((s) => s === 1 ? 1 : ((s - 1) as 1 | 2 | 3))} className="h-10 px-4 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest text-text-secondary">Back</button><div className="flex items-center gap-2">{step < 3 && <button onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)} className="h-10 px-4 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest">Next</button>}{step === 3 && <button onClick={save} disabled={createMutation.isPending || createTemplateMutation.isPending || updateMutation.isPending} className="h-10 px-4 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest disabled:opacity-60">{editingId ? 'Update Form' : 'Publish Form'}</button>}</div></div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-6"><p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-4">Mobile Preview</p><div className="flex justify-center"><PhoneFrame title="Current form on mobile"><div className="px-4 pb-8 pt-2"><StepBusinessForm form={previewForm} onComplete={() => toast.success('Preview submission captured')} onSkip={() => toast('Preview skipped')} /></div></PhoneFrame></div></div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100"><p className="text-sm font-black uppercase tracking-widest text-text-secondary">Existing Forms</p></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="text-[10px] uppercase tracking-widest text-text-secondary border-b border-gray-100"><th className="px-5 py-3 font-black">Form</th><th className="px-5 py-3 font-black">Branch</th><th className="px-5 py-3 font-black">Usage</th><th className="px-5 py-3 font-black">Redirect</th><th className="px-5 py-3 font-black text-right">Actions</th></tr></thead>
                        <tbody>
                            {formsLoading && <tr><td colSpan={5} className="px-5 py-6 text-sm text-text-secondary">Loading forms...</td></tr>}
                            {!formsLoading && formsWithLink.length === 0 && <tr><td colSpan={5} className="px-5 py-6 text-sm text-text-secondary">No forms yet.</td></tr>}
                            {formsWithLink.map((form) => {
                                const isAttached = postSubmitFormIds.includes(form.id);
                                return (
                                    <tr key={form.id} className="border-b border-gray-50">
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-bold text-text-main">{form.title}</p>
                                            <p className="text-xs text-text-secondary">{form.description || 'No description'}</p>
                                            {isAttached && (
                                                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                                    Added after default submission
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-xs text-text-secondary">{form.branchId}</td>
                                        <td className="px-5 py-4 text-xs text-text-secondary">{(form.usageModes || []).join(', ')}</td>
                                        <td className="px-5 py-4 text-xs text-text-secondary">{form.redirectLabel || 'Stay in flow'}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end">
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setOpenMenuId((c) => c === form.id ? null : form.id)}
                                                        className="size-9 rounded-xl border border-gray-200 flex items-center justify-center text-text-secondary"
                                                    >
                                                        <Ellipsis size={16} />
                                                    </button>
                                                    {openMenuId === form.id && (
                                                        <div className="absolute right-0 top-11 z-20 w-64 rounded-2xl border border-gray-200 bg-white shadow-xl p-2 space-y-1">
                                                            <button onClick={() => { startEdit(form); setOpenMenuId(null); toast('Loaded form in editor'); }} className="w-full h-10 px-3 rounded-xl text-left text-sm font-medium hover:bg-gray-50 flex items-center gap-2"><Pencil size={14} /> Edit Form</button>
                                                            <button onClick={async () => { await navigator.clipboard.writeText(shareLink(form.id)); toast.success('Link copied'); setOpenMenuId(null); }} className="w-full h-10 px-3 rounded-xl text-left text-sm font-medium hover:bg-gray-50 flex items-center gap-2"><Copy size={14} /> Copy Link</button>
                                                            <button onClick={() => { setQrFormId(form.id); setOpenMenuId(null); }} className="w-full h-10 px-3 rounded-xl text-left text-sm font-medium hover:bg-gray-50 flex items-center gap-2"><QrCode size={14} /> Show QR</button>
                                                            <button onClick={async () => { setOpenMenuId(null); await togglePostSubmitForm(form.id); }} className={`w-full h-10 px-3 rounded-xl text-left text-sm font-medium hover:bg-gray-50 flex items-center gap-2 ${isAttached ? 'text-emerald-700' : ''}`}><MessageSquareText size={14} /> {isAttached ? 'Remove After Default Submit' : 'Use After Default Submit'}</button>
                                                            <button onClick={() => router.push(`/dashboard/messaging/compose?formId=${form.id}`)} className="w-full h-10 px-3 rounded-xl text-left text-sm font-medium hover:bg-gray-50 flex items-center gap-2"><MessageSquareText size={14} /> Send To Messaging</button>
                                                            <button onClick={async () => { setOpenMenuId(null); await onDelete(form.id); }} className="w-full h-10 px-3 rounded-xl text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {qrFormId && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/30" onClick={() => setQrFormId(null)} /><div className="relative bg-white rounded-3xl border border-gray-200 shadow-2xl p-8 w-full max-w-md text-center space-y-4"><p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">QR Share</p><div className="rounded-3xl bg-gray-50 border border-gray-100 p-6 flex justify-center"><QRCodeSVG id={`form-qr-${qrFormId}`} value={shareLink(qrFormId)} size={220} /></div><p className="text-xs text-text-secondary break-all">{shareLink(qrFormId)}</p><button onClick={() => downloadQrCode(qrFormId)} className="h-10 px-4 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest text-text-secondary">Download QR</button></div></div>}
        </div>
    );
}
