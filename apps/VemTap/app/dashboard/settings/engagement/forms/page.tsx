'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { CheckCircle2, Download, Link2, MoreVertical, Send, Share2, Star, X, ArrowLeft, LayoutTemplate, Plus, Search, Trash2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import EngagementTabs from '@/components/dashboard/engagement/EngagementTabs';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { StepBusinessForm } from '@/components/visitor/StepBusinessForm';
import Spinner from '@/components/ui/Spinner';
import { useAuthStore } from '@/store/useAuthStore';
import { useBranches } from '@/services/branches/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useFormPreferencesStore } from '@/store/useFormPreferencesStore';
import {
  useBusinessForms,
  useCreateBusinessForm,
  useDeleteBusinessForm,
  useFormTemplates,
  useUpdateBusinessForm,
} from '@/services/business-forms/hooks';
import type { ApiFormFieldType, BusinessForm, CreateBusinessFormRequest } from '@/services/business-forms/types';

type ViewMode = 'forms' | 'path' | 'templates' | 'builder';
type FormTab = 'all' | 'active' | 'draft' | 'archived';
type BuilderStep = 1 | 2 | 3;
type FieldDraft = { id: string; question: string; type: ApiFormFieldType; required: boolean; options: string };

const fieldTypes: ApiFormFieldType[] = ['text', 'textarea', 'number', 'select', 'radio', 'checkbox', 'date'];
const makeField = (n: number): FieldDraft => ({ id: `f-${n}`, question: '', type: 'text', required: false, options: '' });

const statusOf = (form: BusinessForm): FormTab => {
  if (!form.isPublished) return 'draft';
  if (!form.isActive) return 'archived';
  return 'active';
};

const statusBadgeOf = (form: { isPublished?: boolean; isActive?: boolean }) => {
  if (!form.isPublished) return { label: 'Draft (Not Published)', tone: 'bg-slate-100 text-slate-700' };
  if (!form.isActive) return { label: 'Archived (Inactive)', tone: 'bg-amber-100 text-amber-700' };
  return { label: 'Active (Published)', tone: 'bg-emerald-100 text-emerald-700' };
};

export default function EngagementFormsBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const activeBranchId = useAuthStore((s) => s.activeBranchId);
  const userBranchId = useAuthStore((s) => s.user?.branchId);
  const { data: myBusiness } = useMyBusiness();

  const { data: branches = [] } = useBranches();
  const { data: templates = [], isLoading: templatesLoading } = useFormTemplates();

  const createMutation = useCreateBusinessForm();
  const deleteMutation = useDeleteBusinessForm();

  const mainBranch = myBusiness?.branches?.find((b) => b.isMainBranch);
  const businessName = myBusiness?.name || user?.businessName || 'Your Business';
  const businessLogo = myBusiness?.logoUrl || mainBranch?.logoUrl || user?.businessLogo;
  const defaultBranchId = activeBranchId && activeBranchId !== 'all' ? activeBranchId : userBranchId || branches[0]?.id || '';
  const branchScope = activeBranchId === 'all' ? null : (activeBranchId || userBranchId || null);
  const { data: forms = [], isLoading: formsLoading } = useBusinessForms({
    branchId: branchScope || undefined,
    allBranches: !branchScope,
  });
  const getDefaultFormId = useFormPreferencesStore((state) => state.getDefaultFormId);
  const setDefaultForm = useFormPreferencesStore((state) => state.setDefaultForm);
  const toggleActiveForm = useFormPreferencesStore((state) => state.toggleActiveForm);
  const isActiveForm = useFormPreferencesStore((state) => state.isActiveForm);
  const defaultFormId = getDefaultFormId(branchScope || 'global');

  const [viewMode, setViewMode] = useState<ViewMode>('forms');
  const [tab, setTab] = useState<FormTab>('all');
  const [query, setQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [shareForm, setShareForm] = useState<{ id: string; title: string; url: string } | null>(null);

  const [builderStep, setBuilderStep] = useState<BuilderStep>(1);
  const [editing, setEditing] = useState<BusinessForm | null>(null);
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [fields, setFields] = useState<FieldDraft[]>([makeField(1)]);
  const [fieldCount, setFieldCount] = useState(1);
  const updateMutation = useUpdateBusinessForm(editing?.id || '');

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const selectedBranchName = branches.find((b) => b.id === branchId)?.name || branchId || 'Main Branch';
  const branchNameById = useMemo(
    () => new Map(branches.map((branch) => [branch.id, branch.name])),
    [branches]
  );

  const getFormUrl = (formId: string) =>
    typeof window !== 'undefined'
      ? `${window.location.origin}/forms/${formId}`
      : `/forms/${formId}`;

  const getMessagingUrl = (formId: string) => {
    const params = new URLSearchParams();
    params.set('formId', formId);
    if (branchScope) params.set('branchId', branchScope);
    return `/dashboard/messaging/compose?${params.toString()}`;
  };

  const openShare = async (formId: string, title: string) => {
    const url = getFormUrl(formId);
    await navigator.clipboard.writeText(url);
    toast.success('Form link copied');
    setShareForm({ id: formId, title, url });
    setOpenMenuId(null);
  };

  const downloadQrCode = (formId: string, title: string) => {
    const canvas = document.getElementById(`form-qr-${formId}`) as HTMLCanvasElement | null;
    if (!canvas) {
      toast.error('QR not ready yet');
      return;
    }
    const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const link = document.createElement('a');
    link.download = `vemtap-form-${safeName || formId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const resetBuilder = () => {
    setEditing(null);
    setBuilderStep(1);
    setBranchId(defaultBranchId);
    setTitle('');
    setDescription('');
    setIsActive(true);
    setFields([makeField(1)]);
    setFieldCount(1);
  };

  const filteredForms = useMemo(() => {
    const k = query.trim().toLowerCase();
    return forms.filter((f) => {
      const tabOk = tab === 'all' ? true : statusOf(f) === tab;
      const queryOk = k ? `${f.title} ${f.description || ''}`.toLowerCase().includes(k) : true;
      return tabOk && queryOk;
    });
  }, [forms, query, tab]);

  const openEdit = (form: BusinessForm) => {
    setEditing(form);
    setBuilderStep(1);
    setBranchId(form.branchId || defaultBranchId);
    setTitle(form.title || '');
    setDescription(form.description || '');
    setIsActive(!!form.isActive);
    setFields((form.fields || []).map((f, i) => ({
      id: f.id || `f-${i + 1}`,
      question: f.question,
      type: f.type,
      required: !!f.isRequired,
      options: (f.options || []).join(', '),
    })) || [makeField(1)]);
    setFieldCount(Math.max(form.fields?.length || 1, 1));
    setViewMode('builder');
  };

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || forms.length === 0) return;
    const form = forms.find((item) => item.id === editId);
    if (!form) return;
    openEdit(form);
  }, [forms, searchParams]);

  const useTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    resetBuilder();
    setTitle(template.name || '');
    setDescription(template.description || '');
    setFields((template.fields || []).map((f, i) => ({
      id: `f-${i + 1}`,
      question: f.question,
      type: f.type,
      required: !!f.isRequired,
      options: (f.options || []).join(', '),
    })) || [makeField(1)]);
    setFieldCount(Math.max(template.fields?.length || 1, 1));
    setBuilderStep(2);
    setViewMode('builder');
  };

  const invalidFields = fields.some((f) => !f.question.trim());

  const saveForm = async (publish: boolean) => {
    if (!title.trim()) return toast.error('Title is required');
    if (!branchId) return toast.error('Branch is required');
    if (invalidFields) return toast.error('Each field needs a question');

    const payload: CreateBusinessFormRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      branchId,
      isActive,
      isPublished: publish,
      fields: fields.map((f, i) => ({
        type: f.type,
        question: f.question.trim(),
        options: f.options.split(',').map((x) => x.trim()).filter(Boolean),
        isRequired: f.required,
        order: i + 1,
      })),
    };

    try {
      let savedForm: BusinessForm | null = null;
      if (editing) {
        savedForm = await updateMutation.mutateAsync(payload);
        toast.success(publish ? 'Form updated and published' : 'Form updated as draft');
      } else {
        savedForm = await createMutation.mutateAsync(payload);
        toast.success(publish ? 'Form published' : 'Draft saved');
      }
      resetBuilder();
      router.push(savedForm?.id ? `/dashboard/forms?focus=${encodeURIComponent(savedForm.id)}` : '/dashboard/forms');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save form');
    }
  };

  const previewForm = useMemo(
    () => ({
      id: editing?.id || 'preview-form',
      title: title.trim() || 'Untitled Form',
      description: description.trim() || 'No description provided yet.',
      businessName,
      businessLogo,
      branchName: selectedBranchName,
      fields: fields.map((f, i) => ({
        id: f.id || `field-${i + 1}`,
        type: f.type,
        question: f.question.trim() || `Question ${i + 1}`,
        options: f.options.split(',').map((x) => x.trim()).filter(Boolean),
        isRequired: f.required,
        order: i + 1,
      })),
    }),
    [businessLogo, businessName, description, editing?.id, fields, selectedBranchName, title]
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <EngagementTabs
        tabs={[
          { label: 'Socials', href: '/dashboard/settings/engagement/socials' },
          { label: 'Form Creator', active: true },
          { label: 'Responses', href: '/dashboard/settings/engagement/forms/responses' },
        ]}
      />

      {viewMode === 'forms' && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">My Forms</h1>
              <p className="text-slate-500">Create and manage business forms from Engagement.</p>
            </div>
            <button onClick={() => setViewMode('path')} className="h-11 px-5 rounded-xl bg-primary text-white text-sm font-semibold inline-flex items-center gap-2"><Plus size={16} /> Create New Form</button>
          </div>

          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 h-11 max-w-md"><Search size={16} className="text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search forms..." className="w-full bg-transparent outline-none text-sm" /></div>
          <div className="border-b border-slate-200"><div className="flex gap-6 overflow-x-auto">{(['all', 'active', 'draft', 'archived'] as FormTab[]).map((k) => <button key={k} onClick={() => setTab(k)} className={`pb-3 px-1 text-sm font-bold border-b-2 whitespace-nowrap ${tab === k ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>{k === 'all' ? 'All Forms' : k[0].toUpperCase() + k.slice(1)}</button>)}</div></div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {formsLoading && (
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Spinner size="md" />
                Loading forms...
              </div>
            )}
            {!formsLoading && filteredForms.length === 0 && <p className="text-sm text-slate-500">No forms found.</p>}
            {filteredForms.map((f) => (
              <div
                key={f.id}
                id={`form-card-${f.id}`}
                className="group relative rounded-3xl bg-white border border-slate-200 shadow-sm p-7 sm:p-8 flex flex-col gap-4 overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <QRCodeCanvas id={`form-qr-${f.id}`} value={getFormUrl(f.id)} size={160} className="hidden" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />

                <div className="flex items-start justify-between gap-3">
                  <div className="bg-primary/10 text-primary p-3 rounded-2xl">
                    <Share2 size={20} />
                  </div>
                  <div className="flex items-center gap-2 relative">
                    <div className="flex items-center gap-2">
                      {defaultFormId === f.id && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-primary/10 text-primary">
                          Default Form
                        </span>
                      )}
                      {isActiveForm(branchScope || 'global', f.id) && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-700">
                          Active in User Step
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${statusBadgeOf(f).tone}`}>{statusBadgeOf(f).label}</span>
                    </div>
                    <button
                      onClick={() => setOpenMenuId((prev) => prev === f.id ? null : f.id)}
                      className="h-9 w-9 rounded-xl border border-slate-200 inline-flex items-center justify-center text-slate-500"
                      aria-label="More form actions"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenuId === f.id && (
                      <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-200 bg-white shadow-lg z-20 p-1">
                        <button onClick={() => openShare(f.id, f.title)} className="w-full text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-gray-50">Copy Share Link and Show QR</button>
                        <button onClick={() => { router.push(getMessagingUrl(f.id)); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-gray-50">Share Form in Messaging</button>
                        <button onClick={() => { router.push(`/dashboard/settings/engagement/forms?edit=${encodeURIComponent(f.id)}`); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-gray-50">Edit Form</button>
                        <button onClick={async () => { try { await deleteMutation.mutateAsync({ id: f.id, branchId: f.branchId }); toast.success('Form deleted'); setOpenMenuId(null); } catch (e: any) { toast.error(e?.message || 'Delete failed'); } }} className="w-full text-left px-3 py-2 text-xs font-bold rounded-lg text-red-600 hover:bg-red-50">Delete Form</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className={isActiveForm(branchScope || 'global', f.id) ? '' : 'opacity-90'}>
                  <h3 className="text-xl font-black text-slate-900">{f.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{f.description || 'No description yet.'}</p>
                  <p className="text-[11px] text-slate-400 mt-2">Branch: <span className="font-semibold text-slate-700">{branchNameById.get(f.branchId) || 'Unknown Branch'}</span></p>
                </div>

                <div className="mt-auto pt-5 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => openShare(f.id, f.title)}
                      className="relative group/tooltip p-2.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-primary/10 hover:text-primary transition-colors"
                      aria-label="Copy share link and show QR"
                    >
                      <Share2 size={18} />
                      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 group-hover/tooltip:opacity-100 transition-opacity">
                        Copy Share Link and Show QR
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setDefaultForm(branchScope || 'global', f.id);
                        toast.success('Default form updated');
                      }}
                      className="relative group/tooltip p-2.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-primary/10 hover:text-primary transition-colors"
                      aria-label={defaultFormId === f.id ? 'This is the default form' : 'Set as default form'}
                    >
                      <Star size={18} className={defaultFormId === f.id ? 'text-primary' : 'text-slate-500'} fill={defaultFormId === f.id ? 'currentColor' : 'none'} />
                      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 group-hover/tooltip:opacity-100 transition-opacity">
                        {defaultFormId === f.id ? 'Default Form (Current)' : 'Set as Default Form'}
                      </span>
                    </button>

                    <button
                      onClick={() => router.push(getMessagingUrl(f.id))}
                      className="relative group/tooltip p-2.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-primary/10 hover:text-primary transition-colors"
                      aria-label="Share form in messaging"
                    >
                      <Send size={18} />
                      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 group-hover/tooltip:opacity-100 transition-opacity">
                        Share Form in Messaging
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        const currentlyActive = isActiveForm(branchScope || 'global', f.id);
                        toggleActiveForm(branchScope || 'global', f.id);
                        toast.success(currentlyActive ? 'Removed from user-step buttons' : 'Added to user-step buttons');
                      }}
                      className={`relative group/tooltip p-2.5 rounded-lg transition-colors ${isActiveForm(branchScope || 'global', f.id) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'}`}
                      aria-label={isActiveForm(branchScope || 'global', f.id) ? 'Active in user-step buttons' : 'Toggle active in user-step buttons'}
                    >
                      <CheckCircle2 size={18} />
                      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 group-hover/tooltip:opacity-100 transition-opacity">
                        {isActiveForm(branchScope || 'global', f.id) ? 'Active in User Step' : 'Toggle Active in User Step'}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center justify-end">
                    <Link
                      href={`/dashboard/settings/engagement/forms/${f.id}`}
                      className="h-10 px-4 rounded-full border border-slate-200 text-xs font-black text-slate-600 inline-flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                    >
                      Preview Form
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {viewMode === 'path' && (
        <section className="max-w-4xl mx-auto w-full space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-900">Choose Form Creation Path</h2>
            <p className="text-sm text-slate-500">Start from scratch or load an admin template.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <button onClick={() => { resetBuilder(); setViewMode('builder'); }} className="text-left rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="size-12 rounded-2xl bg-slate-900 text-yellow-300 flex items-center justify-center mb-4"><Plus size={22} /></div>
              <h3 className="text-xl font-black text-slate-900">Create from Scratch</h3>
              <p className="text-sm text-slate-600 mt-2">Build your own custom form.</p>
            </button>
            <button onClick={() => setViewMode('templates')} className="text-left rounded-2xl border border-primary bg-primary p-6 text-white shadow-sm">
              <div className="size-12 rounded-2xl bg-white/15 text-white flex items-center justify-center mb-4"><LayoutTemplate size={22} /></div>
              <h3 className="text-xl font-black">Use Admin Template</h3>
              <p className="text-sm text-slate-300 mt-2">Pick from fetched templates.</p>
            </button>
          </div>
          <div className="flex justify-center">
            <button onClick={() => setViewMode('forms')} className="h-10 px-4 rounded-xl border border-slate-200 text-sm font-bold inline-flex items-center gap-2"><ArrowLeft size={14} /> Back to My Forms</button>
          </div>
        </section>
      )}

      {viewMode === 'templates' && (
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black text-slate-900">Admin Templates</h2>
              <p className="text-sm text-slate-500">Everything here is fetched live from templates API.</p>
            </div>
            <button onClick={() => setViewMode('path')} className="h-10 px-4 rounded-xl border border-slate-200 text-sm font-bold inline-flex items-center gap-2"><ArrowLeft size={14} /> Back</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {templatesLoading && (
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Spinner size="md" />
                Loading templates...
              </div>
            )}
            {!templatesLoading && templates.length === 0 && <p className="text-sm text-slate-500">No templates available.</p>}
            {templates.map((template) => (
              <div key={template.id} className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-3">
                <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><LayoutTemplate size={18} /></div>
                <h3 className="text-lg font-black text-slate-900">{template.name}</h3>
                <p className="text-sm text-slate-500">{template.description || 'No description'}</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{template.fields?.length || 0} fields</p>
                <button onClick={() => useTemplate(template.id)} className="w-full h-10 rounded-xl bg-primary text-white text-sm font-black">Use Template</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {viewMode === 'builder' && (
        <section className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900">{editing ? 'Edit Form' : 'Create Form'}</h2>
              <p className="text-sm text-slate-600">Step 1: details, Step 2: fields + live preview, Step 3: publish.</p>
            </div>
            <button onClick={() => { resetBuilder(); setViewMode('forms'); }} className="h-10 px-4 rounded-xl border border-slate-200 text-sm font-bold inline-flex items-center gap-2"><ArrowLeft size={14} /> My Forms</button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {([1, 2, 3] as BuilderStep[]).map((step) => (
              <button
                key={step}
                onClick={() => {
                  if (step === 2 && (!title.trim() || !branchId)) return;
                  if (step === 3 && invalidFields) return;
                  setBuilderStep(step);
                }}
                className={`h-11 rounded-xl text-xs sm:text-sm font-black ${builderStep === step ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-slate-700'}`}
              >
                {step === 1 ? 'First Step' : step === 2 ? 'Second Step + Preview' : 'Publish'}
              </button>
            ))}
          </div>

          {builderStep === 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Customer Feedback Form" /></div>
              <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full min-h-20 rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Short summary shown on the form" /></div>
              <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Branch</label><select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="mt-1 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm"><option value="">Select branch</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              <div className="flex items-center gap-2 text-sm"><input id="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /><label htmlFor="isActive" className="font-semibold text-slate-700">Keep this form active after save</label></div>
              <div className="flex justify-end">
                <button onClick={() => { if (!title.trim()) return toast.error('Title is required'); if (!branchId) return toast.error('Branch is required'); setBuilderStep(2); }} className="h-11 px-5 rounded-xl bg-primary text-white text-sm font-black">Continue to Second Step</button>
              </div>
            </div>
          )}

          {builderStep === 2 && (
            <div className="flex flex-col xl:flex-row gap-6 items-start">
              <div className="w-full xl:flex-1 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between"><h3 className="text-lg font-black text-slate-900">Form Fields + Live Preview</h3><button onClick={() => { const n = fieldCount + 1; setFieldCount(n); setFields((p) => [...p, makeField(n)]); }} className="h-9 px-3 rounded-xl bg-primary text-white text-xs font-black">Add Field</button></div>
                {fields.map((f) => <div key={f.id} className="rounded-xl border border-slate-200 p-3 space-y-2"><select value={f.type} onChange={(e) => setFields((p) => p.map((x) => x.id === f.id ? { ...x, type: e.target.value as ApiFormFieldType } : x))} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm">{fieldTypes.map((t) => <option key={t} value={t}>{t}</option>)}</select><input value={f.question} onChange={(e) => setFields((p) => p.map((x) => x.id === f.id ? { ...x, question: e.target.value } : x))} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm" placeholder="Question" />{(f.type === 'select' || f.type === 'radio' || f.type === 'checkbox') && <input value={f.options} onChange={(e) => setFields((p) => p.map((x) => x.id === f.id ? { ...x, options: e.target.value } : x))} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm" placeholder="Options (comma separated)" />}<div className="flex justify-between"><label className="text-xs text-slate-600 flex gap-2 items-center"><input type="checkbox" checked={f.required} onChange={(e) => setFields((p) => p.map((x) => x.id === f.id ? { ...x, required: e.target.checked } : x))} />Required</label>{fields.length > 1 && <button onClick={() => setFields((p) => p.filter((x) => x.id !== f.id))} className="text-red-600"><Trash2 size={14} /></button>}</div></div>)}
                <div className="flex flex-wrap justify-between gap-3">
                  <button onClick={() => setBuilderStep(1)} className="h-11 px-5 rounded-xl border border-slate-200 text-sm font-black">Back to First Step</button>
                  <button onClick={() => { if (invalidFields) return toast.error('Each field needs a question'); setBuilderStep(3); }} className="h-11 px-5 rounded-xl bg-primary text-white text-sm font-black">Continue to Publish</button>
                </div>
              </div>

              <div className="w-full xl:w-[380px] xl:sticky xl:top-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Messaging-Style Phone Preview</p>
                  <div className="flex justify-center">
                    <PhoneFrame title="Live Form Preview">
                      <div className="px-5 pb-8 pt-2">
                        <StepBusinessForm
                          form={previewForm}
                          onComplete={() => toast.success('Preview submission captured')}
                          onSkip={() => toast('Preview skipped')}
                        />
                      </div>
                    </PhoneFrame>
                  </div>
                </div>
              </div>
            </div>
          )}

          {builderStep === 3 && (
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 max-w-3xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Final Check</p>
                <h3 className="text-2xl font-black text-slate-900">{previewForm.title}</h3>
                <p className="text-sm text-slate-600">{previewForm.description}</p>
                <div className="text-sm text-slate-600 space-y-1">
                  <p><span className="font-bold text-slate-900">Business:</span> {businessName}</p>
                  <p><span className="font-bold text-slate-900">Branch:</span> {selectedBranchName}</p>
                  <p><span className="font-bold text-slate-900">Fields:</span> {previewForm.fields.length}</p>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button onClick={() => setBuilderStep(2)} className="h-11 px-4 rounded-xl border border-slate-200 text-sm font-black">Back to Second Step</button>
                  <button onClick={() => saveForm(false)} disabled={isSaving} className="h-11 px-4 rounded-xl border border-slate-300 text-sm font-black disabled:opacity-60">{editing ? 'Update as Draft' : 'Save Draft'}</button>
                  <button onClick={() => saveForm(true)} disabled={isSaving} className="h-11 px-4 rounded-xl bg-primary text-white text-sm font-black disabled:opacity-60">{editing ? 'Update & Publish' : 'Publish Form'}</button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {shareForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Form Share</p>
                <h3 className="text-xl font-black text-slate-900">{shareForm.title}</h3>
                <p className="text-xs text-slate-500 mt-1">Link copied. Share or let visitors scan the QR below.</p>
              </div>
              <button onClick={() => setShareForm(null)} className="h-9 w-9 rounded-xl border border-slate-200 inline-flex items-center justify-center text-slate-500">
                <X size={16} />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col items-center gap-3">
              <QRCodeCanvas value={shareForm.url} size={180} />
              <p className="text-xs font-bold text-slate-700">Scan to open: {shareForm.title}</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => downloadQrCode(shareForm.id, shareForm.title)}
                className="w-full h-11 rounded-xl bg-primary text-white text-sm font-black inline-flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Download QR (named)
              </button>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(shareForm.url);
                  toast.success('Link copied');
                }}
                className="w-full h-11 rounded-xl border border-slate-300 text-sm font-black text-slate-700 inline-flex items-center justify-center gap-2"
              >
                <Link2 size={16} />
                Copy Link Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
