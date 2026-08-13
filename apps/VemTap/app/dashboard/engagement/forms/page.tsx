'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  Calendar,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Grid3X3,
  Info,
  LayoutList,
  Link2,
  MessageSquare,
  MoreVertical,
  BarChart3,
  Pencil,
  Plus,
  QrCode,
  Search,
  Send,
  Share2,
  Trash2,
  X,
  ArrowLeft,
  Building2,
  LayoutTemplate,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { StepBusinessForm } from '@/components/visitor/StepBusinessForm';
import Spinner from '@/components/ui/Spinner';
import { useAuthStore } from '@/store/useAuthStore';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { buildBrandCssVars } from '@/lib/brandColor';
import { useBranches } from '@/services/branches/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import {
  useBusinessForms,
  useCreateBusinessForm,
  useDeleteBusinessForm,
  useFormTemplates,
  useUpdateBusinessForm,
} from '@/services/business-forms/hooks';
import { useFormPreferencesStore } from '@/store/useFormPreferencesStore';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { ApiFormFieldType, BusinessForm, CreateBusinessFormRequest } from '@/services/business-forms/types';

type FormsViewType = 'grid' | 'list';
type ShareMethod = 'qr' | 'link' | 'messaging';

interface ShareExplainerState {
  method: ShareMethod;
  formId: string;
  formTitle: string;
}

function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatDateTime(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function timeAgo(dateString?: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return formatDate(dateString);
  } catch {
    return '';
  }
}

const SHARE_EXPLAINERS: Record<ShareMethod, { title: string; icon: React.ReactNode; description: string; action: string }> = {
  qr: {
    title: 'Share via QR Code',
    icon: <QrCode size={24} />,
    description:
      'A QR code will be generated for this form. Print it or display it on a screen so walk-in customers can scan it with their phone camera to open and fill out the form instantly.',
    action: 'Generate QR Code',
  },
  link: {
    title: 'Share via Link',
    icon: <Link2 size={24} />,
    description:
      'A direct URL link to this form will be copied to your clipboard. You can paste it into any chat, email, social media post, or website to share the form with anyone.',
    action: 'Copy Link to Clipboard',
  },
  messaging: {
    title: 'Share via Messaging',
    icon: <MessageSquare size={24} />,
    description:
      'You will be taken to the Messaging Compose page with this form pre-attached. From there you can send it directly to contacts via SMS, WhatsApp, or Email.',
    action: 'Open Messaging',
  },
};

type ViewMode = 'forms' | 'path' | 'templates' | 'builder';
type FormTab = 'all' | 'active' | 'draft' | 'archived';
type BuilderStep = 1 | 2 | 3 | 4;
type FieldDraft = { id: string; question: string; type: ApiFormFieldType; required: boolean; options: string };

const fieldTypes: ApiFormFieldType[] = ['text', 'textarea', 'number', 'select', 'radio', 'checkbox', 'date', 'date-no-year'];
const makeField = (n: number): FieldDraft => ({ id: `f-${n}`, question: '', type: 'text', required: false, options: '' });

const statusOf = (form: BusinessForm): FormTab => {
  if (!form.isPublished) return 'draft';
  if (!form.isActive) return 'archived';
  return 'active';
};

const statusBadgeOf = (form: { isPublished?: boolean; isActive?: boolean }) => {
  if (!form.isPublished)
    return { label: 'Draft', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
  if (!form.isActive)
    return { label: 'Inactive', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400' };
  return { label: 'Active', color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' };
};

export default function EngagementFormsBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const activeBranchId = useAuthStore((s) => s.activeBranchId);
  const userBranchId = useAuthStore((s) => s.user?.branchId);
  const { data: myBusiness } = useMyBusiness();
  const engagementSettings = useCustomerFlowStore((state) => state.engagementSettings);

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
    branchId: branchScope || userBranchId || branches[0]?.id || undefined,
    allBranches: !branchScope,
  });

  const { data: responsesSummary = [] } = useQuery<
    Array<{ formId: string; count: number }>,
    Error
  >({
    queryKey: ['business-forms', 'responses-summary', forms.map((f) => f.id).join(',')],
    queryFn: async () => {
      const summary = await Promise.all(
        forms.map(async (form) => {
          try {
            const response = await api.get(`/business-forms/${form.id}/responses?branchId=${form.branchId}`);
            const rows = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
            return { formId: form.id, count: rows.length };
          } catch {
            return { formId: form.id, count: 0 };
          }
        })
      );
      return summary;
    },
    enabled: forms.length > 0,
    staleTime: 60000,
  });

  const responseCountByFormId = useMemo(() => {
    const map = new Map<string, number>();
    responsesSummary.forEach((item) => map.set(item.formId, item.count));
    return map;
  }, [responsesSummary]);

  const { setDefaultForm, getDefaultFormId, clearDefaultForm, getActiveFormIds, toggleActiveForm } = useFormPreferencesStore();
  const brandColor = engagementSettings?.brandColor || '#2563eb';
  const brandVars = useMemo(
    () => buildBrandCssVars(brandColor),
    [brandColor]
  );

  const [viewMode, setViewMode] = useState<ViewMode>('forms');
  const [formsViewType, setFormsViewType] = useState<FormsViewType>('grid');
  const [tab, setTab] = useState<FormTab>('all');
  const [query, setQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [shareForm, setShareForm] = useState<{ id: string; title: string; url: string } | null>(null);
  const [shareExplainer, setShareExplainer] = useState<ShareExplainerState | null>(null);
  const [defaultFormExplainer, setDefaultFormExplainer] = useState<{ id: string; title: string; branchId: string } | null>(null);
  const [disableConfirm, setDisableConfirm] = useState<{ id: string; title: string; branchId: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string; branchId?: string } | null>(null);

  const [builderStep, setBuilderStep] = useState<BuilderStep>(1);
  const [editing, setEditing] = useState<BusinessForm | null>(null);
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [requiresAuth, setRequiresAuth] = useState(true);
  const [fields, setFields] = useState<FieldDraft[]>([makeField(1)]);
  const [fieldCount, setFieldCount] = useState(1);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const updateMutation = useUpdateBusinessForm(editing?.id || '');

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const selectedBranch = branches.find((b) => b.id === branchId);
  const selectedBranchName = selectedBranch?.name || branchId || 'Main Branch';
  const displayBranchName = (selectedBranch?.isMainBranch && selectedBranchName === 'Main Branch')
    ? businessName
    : selectedBranchName;
  const showBranchName = displayBranchName && displayBranchName !== businessName;
  const branchNameById = useMemo(
    () => new Map(branches.map((branch) => [branch.id, branch.name])),
    [branches]
  );

  const getPublicFormCode = (uniqueCode?: string) => uniqueCode?.trim() || '';

  const getFormUrl = (uniqueCode?: string) => {
    const code = getPublicFormCode(uniqueCode);
    if (!code) return '';
    return typeof window !== 'undefined'
      ? `${window.location.origin}/forms/${code}`
      : `/forms/${code}`;
  };

  const requireFormUrl = (uniqueCode?: string) => {
    const url = getFormUrl(uniqueCode);
    if (!url) {
      toast.error('This form is missing a public code. Please republish the form to generate one.');
    }
    return url;
  };

  const getMessagingUrl = (formId: string) => {
    const params = new URLSearchParams();
    params.set('formId', formId);
    if (branchScope) params.set('branchId', branchScope);
    return `/dashboard/messaging/compose?${params.toString()}`;
  };

  const getResponsesUrl = (form: BusinessForm) => {
    const params = new URLSearchParams();
    if (form.branchId) params.set('branchId', form.branchId);
    return `/dashboard/engagement/forms/responses/${form.id}${params.toString() ? `?${params.toString()}` : ''}`;
  };

  const handleShareAction = async (method: ShareMethod, formId: string, formTitle: string) => {
    setShareExplainer(null);
    const form = forms.find((f) => f.id === formId);
    if (!form) return;

    if (method === 'link') {
      const url = requireFormUrl(form.uniqueCode);
      if (!url) return;
      await navigator.clipboard.writeText(url);
      toast.success('Form link copied to clipboard!');
    } else if (method === 'qr') {
      const url = requireFormUrl(form.uniqueCode);
      if (!url) return;
      setShareForm({ id: formId, title: formTitle, url });
    } else if (method === 'messaging') {
      router.push(getMessagingUrl(formId));
    }
    setOpenMenuId(null);
  };

  const openShareExplainer = (method: ShareMethod, formId: string, formTitle: string) => {
    setShareExplainer({ method, formId, formTitle });
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
    setRequiresAuth(true);
    setFields([makeField(1)]);
    setFieldCount(1);
    setSuccessTitle('');
    setSuccessMessage('');
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
    setRequiresAuth(form.requiresAuth ?? true);
    setFields((form.fields || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((f, i) => ({
      id: f.id || `f-${i + 1}`,
      question: f.question,
      type: f.type,
      required: !!f.isRequired,
      options: (f.options || []).join(', '),
    })) || [makeField(1)]);
    setFieldCount(Math.max(form.fields?.length || 1, 1));
    setSuccessTitle(form.successTitle || '');
    setSuccessMessage(form.successMessage || '');
    setViewMode('builder');
  };

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || forms.length === 0) return;
    const form = forms.find((item) => item.id === editId);
    if (!form) return;
    openEdit(form);
  }, [forms, searchParams]);

  const handleUseTemplate = (templateId: string) => {
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
    setSuccessTitle(template.successTitle || '');
    setSuccessMessage(template.successMessage || '');
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
      showAfterLeadCapture: editing?.showAfterLeadCapture,
      requiresAuth,
      fields: fields.map((f, i) => ({
        type: f.type,
        question: f.question.trim(),
        options: f.options.split(',').map((x) => x.trim()).filter(Boolean),
        isRequired: f.required,
        order: i + 1,
      })),
      successTitle: successTitle.trim() || undefined,
      successMessage: successMessage.trim() || undefined,
    };

    try {
      let savedForm: BusinessForm | null = null;
      if (editing) {
        savedForm = await updateMutation.mutateAsync({ id: editing.id, payload });
        toast.success(publish ? 'Form updated and published' : 'Form updated as draft');
      } else {
        savedForm = await createMutation.mutateAsync(payload);
        toast.success(publish ? 'Form published' : 'Draft saved');
      }
      resetBuilder();
      router.push('/dashboard/engagement/forms');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save form');
    }
  };

  const toggleShowAfterLeadCapture = async (form: BusinessForm) => {
    const isCurrentlyEnabled = !!form.showAfterLeadCapture;
    try {
      await updateMutation.mutateAsync({
        id: form.id,
        payload: { showAfterLeadCapture: !isCurrentlyEnabled, branchId: form.branchId }
      });
      toast.success(!isCurrentlyEnabled ? 'Sequence automation enabled!' : 'Sequence automation disabled');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update automation');
    }
  };

  const previewForm = useMemo(
    () => ({
      id: editing?.id || 'preview-form',
      title: title.trim() || 'Untitled Form',
      description: description.trim() || 'No description provided yet.',
      businessName,
      businessLogo,
      branchName: displayBranchName,
      fields: fields.map((f, i) => ({
        id: f.id || `field-${i + 1}`,
        type: f.type,
        question: f.question.trim() || `Question ${i + 1}`,
        options: f.options.split(',').map((x) => x.trim()).filter(Boolean),
        isRequired: f.required,
        order: i + 1,
      })),
    }),
    [businessLogo, businessName, description, editing?.id, fields, displayBranchName, title]
  );

  return (
    <>
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Navigation handled in sidebar under Engagement */}

      {viewMode === 'forms' && (
        <section className="space-y-6 md:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight uppercase">My Forms</h1>
              <p className="text-xs md:text-sm text-gray-500 mt-1">Create and manage business forms from Engagement.</p>
            </div>
            <button
              onClick={() => setViewMode('path')}
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-primary text-white text-sm font-bold uppercase tracking-wider shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-0.5 active:scale-95"
            >
              <Plus size={18} />
              Create New Form
            </button>
          </div>

          {/* How it works - Collapsed helper */}
          <details className="group rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <summary className="flex items-center gap-3 px-4 md:px-5 py-4 cursor-pointer select-none hover:bg-gray-50 transition-colors">
              <div className="size-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Info size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-bold text-gray-900 uppercase tracking-tight">How to use Forms</p>
                <p className="text-[10px] md:text-xs text-gray-500 font-medium">Click to learn about sharing your forms</p>
              </div>
              <svg className="size-5 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-5 pb-5 pt-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl bg-gray-50 p-4 flex gap-3">
                  <div className="size-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0"><QrCode size={18} /></div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">QR Code</p>
                    <p className="text-xs text-gray-500 mt-0.5">Generate a scannable QR code for printouts or in-store displays.</p>
                  </div>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 flex gap-3">
                  <div className="size-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Link2 size={18} /></div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Direct Link</p>
                    <p className="text-xs text-gray-500 mt-0.5">Copy a URL to share via chat, email, or social media.</p>
                  </div>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 flex gap-3">
                  <div className="size-9 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0"><MessageSquare size={18} /></div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Messaging</p>
                    <p className="text-xs text-gray-500 mt-0.5">Send the form directly using built-in SMS or WhatsApp.</p>
                  </div>
                </div>
              </div>
            </div>
          </details>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
              <div className="size-2 rounded-full bg-primary" />
              Scope: {branchScope ? branchNameById.get(branchScope) : 'All Branches'}
            </div>

            <div className="flex-1 flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search forms..."
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setFormsViewType('grid')}
                  className={`p-2 transition-colors ${formsViewType === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  aria-label="Grid view"
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  onClick={() => setFormsViewType('list')}
                  className={`p-2 transition-colors ${formsViewType === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  aria-label="List view"
                >
                  <LayoutList size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <div className="flex gap-6 overflow-x-auto">
              {(['all', 'active', 'draft', 'archived'] as FormTab[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`pb-3 px-1 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${tab === k ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  {k === 'all' ? 'All Forms' : k[0].toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {formsLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Spinner size="md" />
              <p className="text-sm text-gray-500">Loading your forms...</p>
            </div>
          )}

          {!formsLoading && filteredForms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="size-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400"><FileText size={24} /></div>
              <p className="text-sm text-gray-500">No forms match your current filters.</p>
            </div>
          )}

          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {!formsLoading && filteredForms.length > 0 && (
              filteredForms.map((f) => {
                const status = statusBadgeOf(f);
                const branchLabel = branchNameById.get(f.branchId) || 'Unknown';
                const formUrl = getFormUrl(f.uniqueCode);
                const isExpanded = openMenuId === f.id;

                return (
                  <div 
                    key={f.id} 
                    className={`bg-white rounded-2xl border transition-all overflow-hidden ${isExpanded ? 'border-primary ring-1 ring-primary/10 shadow-lg' : 'border-gray-200 shadow-sm'}`}
                  >
                    {/* Header - Always Visible */}
                    <div 
                      onClick={() => setOpenMenuId(isExpanded ? null : f.id)}
                      className="p-4 flex items-center justify-between gap-3 active:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isExpanded ? 'bg-primary text-white' : 'bg-primary/8 text-primary'}`}>
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 truncate tracking-tight">{f.title}</h3>
                          <p className="text-[10px] text-gray-500 truncate font-medium uppercase tracking-wider">{branchLabel}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${status.color}`}>
                          {status.label}
                        </span>
                        <svg 
                          className={`size-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 border-t border-gray-100 bg-gray-50/30 animate-in slide-in-from-top-2 duration-200">
                        {f.description && (
                          <p className="text-xs text-gray-500 leading-relaxed mt-3">{f.description}</p>
                        )}

                        <div className="flex items-center gap-4 py-2 border-y border-gray-100">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-primary/80">
                            <CheckCircle2 size={13} />
                            {responseCountByFormId.get(f.id) || 0} responses
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tight flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(f.createdAt)}
                          </div>
                        </div>

                        {/* Automation */}
                        <div className="p-3 bg-white rounded-xl border border-gray-100 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold text-gray-900 uppercase tracking-wider">Auto-Sequence</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); setDefaultFormExplainer({ id: f.id, title: f.title, branchId: f.branchId }); }}
                                className="size-3.5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center"
                              >
                                <Info size={8} />
                              </button>
                            </div>
                            <p className={`text-[9px] mt-0.5 font-bold uppercase tracking-tighter ${f.showAfterLeadCapture ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {f.showAfterLeadCapture ? 'Enabled' : 'Disabled'}
                            </p>
                          </div>
                          <button
                            disabled={updateMutation.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (f.showAfterLeadCapture) {
                                setDisableConfirm({ id: f.id, title: f.title, branchId: f.branchId });
                              } else {
                                setDefaultFormExplainer({ id: f.id, title: f.title, branchId: f.branchId });
                              }
                            }}
                            className={`h-7 px-3 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${f.showAfterLeadCapture ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-gray-100 text-gray-900 border border-gray-200 hover:border-primary hover:text-primary'}`}
                          >
                            {updateMutation.isPending ? <Spinner size="sm" /> : (f.showAfterLeadCapture ? 'Disable' : 'Enable')}
                          </button>
                        </div>

                        {/* Quick actions */}
                        <div className="grid grid-cols-4 gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); openShareExplainer('link', f.id, f.title); }}
                            className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider text-gray-500 bg-white border border-gray-100"
                          >
                            <Link2 size={14} />
                            <span>Link</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openShareExplainer('qr', f.id, f.title); }}
                            className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider text-gray-500 bg-white border border-gray-100"
                          >
                            <QrCode size={14} />
                            <span>QR</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(getMessagingUrl(f.id)); }}
                            className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider text-gray-500 bg-white border border-gray-100"
                          >
                            <Send size={14} />
                            <span>Send</span>
                          </button>
                          <Link
                            href={getResponsesUrl(f)}
                            className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider text-white bg-primary shadow-sm"
                          >
                            <BarChart3 size={14} />
                            <span>Stats</span>
                          </Link>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); openEdit(f); }}
                            className="flex-1 h-9 bg-gray-100 text-gray-900 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-gray-200 flex items-center justify-center gap-2"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ id: f.id, title: f.title, branchId: f.branchId }); }}
                            className="flex-1 h-9 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-red-100 flex items-center justify-center gap-2"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Grid View */}
          <div className="hidden md:block">
            {!formsLoading && filteredForms.length > 0 && formsViewType === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredForms.map((f) => {
                  const status = statusBadgeOf(f);
                  const branchLabel = branchNameById.get(f.branchId) || 'Unknown';
                  const formUrl = getFormUrl(f.uniqueCode);
                  return (
                    <div key={f.id} className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all hover:shadow-xl shadow-sm">
                      {formUrl ? (
                        <QRCodeCanvas id={`form-qr-${f.id}`} value={formUrl} size={160} className="hidden" />
                      ) : null}
                      <div className="h-1.5 bg-gradient-to-r from-primary to-primary/60" />
                      <div className="p-5 md:p-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="size-11 rounded-xl bg-primary/8 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                              <FileText size={22} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm md:text-base font-bold text-gray-900 truncate tracking-tight">{f.title}</h3>
                              <p className="text-[10px] md:text-xs text-gray-500 truncate font-medium uppercase tracking-wider">{branchLabel}</p>
                            </div>
                          </div>
                          <div className="relative" data-form-menu>
                            <button
                              onClick={() => setOpenMenuId((prev) => prev === f.id ? null : f.id)}
                              className="size-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {openMenuId === f.id && (
                              <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-gray-200 bg-white shadow-xl z-30 py-1">
                                <button onClick={() => openShareExplainer('link', f.id, f.title)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Link2 size={14} className="text-gray-400" /> Copy share link</button>
                                <button onClick={() => openShareExplainer('qr', f.id, f.title)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><QrCode size={14} className="text-gray-400" /> Generate QR code</button>
                                <button onClick={() => { router.push(getMessagingUrl(f.id)); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Send size={14} className="text-gray-400" /> Messaging</button>
                                <Link href={getResponsesUrl(f)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                  <BarChart3 size={14} className="text-gray-400" />
                                  View responses
                                </Link>
                                <div className="h-px bg-gray-100 my-1" />
                                <button onClick={() => openEdit(f)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Pencil size={14} className="text-gray-400" /> Edit form</button>
                                <button onClick={() => { setDeleteConfirm({ id: f.id, title: f.title, branchId: f.branchId }); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={14} /> Delete</button>
                              </div>
                            )}
                          </div>
                        </div>
                        {f.description && <p className="text-xs text-gray-500 mt-4 line-clamp-2 leading-relaxed">{f.description}</p>}
                        
                        <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.color}`}
                          >
                            <div className={`size-1.5 rounded-full ${status.dot} animate-pulse`} />
                            {status.label}
                          </span>
                          <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400">
                            <span className="inline-flex items-center gap-1 text-primary/80 uppercase tracking-tighter">
                              <CheckCircle2 size={12} />
                              {responseCountByFormId.get(f.id) || 0} responses
                            </span>
                          </div>
                        </div>

                        {/* Automation */}
                        <div className="mt-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Automation</span>
                              <button
                                onClick={() => setDefaultFormExplainer({ id: f.id, title: f.title, branchId: f.branchId })}
                                className="shrink-0 size-4 rounded-full bg-gray-200 text-gray-500 hover:bg-primary hover:text-white flex items-center justify-center transition-all"
                              >
                                <Info size={10} />
                              </button>
                            </div>
                            <p className="text-[10px] mt-1 font-medium text-gray-500">
                              Status: <span className={`font-bold uppercase tracking-tighter ${f.showAfterLeadCapture ? 'text-emerald-600' : 'text-gray-400'}`}>
                                {f.showAfterLeadCapture ? 'Enabled' : 'Disabled'}
                              </span>
                            </p>
                          </div>
                          <button
                            disabled={updateMutation.isPending}
                            onClick={() => {
                              if (f.showAfterLeadCapture) {
                                setDisableConfirm({ id: f.id, title: f.title, branchId: f.branchId });
                              } else {
                                setDefaultFormExplainer({ id: f.id, title: f.title, branchId: f.branchId });
                              }
                            }}
                            className={`shrink-0 h-8 px-4 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${f.showAfterLeadCapture
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 shadow-sm'
                              : 'bg-white text-gray-900 border border-gray-200 shadow-sm hover:border-primary hover:text-primary'
                              } disabled:opacity-70 active:scale-95`}
                          >
                            {updateMutation.isPending ? <Spinner size="sm" /> : (f.showAfterLeadCapture ? 'Disable' : 'Enable')}
                          </button>
                        </div>

                        {/* Quick actions */}
                        <div className="mt-5 grid grid-cols-3 sm:grid-cols-5 gap-2">
                          <button
                            onClick={() => openShareExplainer('link', f.id, f.title)}
                            className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"
                            title="Copy share link"
                          >
                            <Link2 size={16} />
                            <span>Link</span>
                          </button>
                          <button
                            onClick={() => openShareExplainer('qr', f.id, f.title)}
                            className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50 hover:bg-purple-50 hover:text-purple-600 transition-all border border-transparent hover:border-purple-100"
                            title="Show QR code"
                          >
                            <QrCode size={16} />
                            <span>QR</span>
                          </button>
                          <button
                            onClick={() => { router.push(getMessagingUrl(f.id)); }}
                            className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-transparent hover:border-emerald-100"
                            title="Send via messaging"
                          >
                            <Send size={16} />
                            <span>Send</span>
                          </button>
                          <Link
                            href={getResponsesUrl(f)}
                            className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider text-white bg-primary hover:bg-primary/90 transition-all shadow-md shadow-primary/10 active:scale-95"
                            title="View responses"
                          >
                            <BarChart3 size={16} />
                            <span>Stats</span>
                          </Link>
                          <Link
                            href={`/dashboard/engagement/forms/${f.id}`}
                            className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/5 hover:bg-primary/10 transition-all border border-primary/10"
                            title="Preview form"
                          >
                            <Eye size={16} />
                            <span>View</span>
                          </Link>
                        </div>

                        {/* Date metadata */}
                        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-medium uppercase tracking-tight">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            Created {formatDate(f.createdAt)}
                          </span>
                          <span className="font-bold text-gray-300">
                            {f.createdAt ? timeAgo(f.createdAt) : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Desktop List View */}
            {!formsLoading && filteredForms.length > 0 && formsViewType === 'list' && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-3">Form</div>
                  <div className="col-span-2">Branch</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-2">Engagement</div>
                  <div className="col-span-1">Created</div>
                  <div className="col-span-1">Updated</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                <div className="divide-y divide-gray-100">
                  {filteredForms.map((f) => (
                    <div key={f.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-gray-50 transition-colors">
                      <div className="sm:col-span-3 flex items-center gap-3 min-w-0">
                        <div className="size-9 rounded-lg bg-primary/8 text-primary flex items-center justify-center shrink-0"><FileText size={18} /></div>
                        <div className="min-w-0"><p className="text-sm font-semibold text-gray-900 truncate">{f.title}</p></div>
                      </div>
                      <div className="sm:col-span-2 text-xs text-gray-600 truncate">{branchNameById.get(f.branchId) || 'Unknown'}</div>
                      <div className="sm:col-span-1">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeOf(f).color}`}>
                          <div className={`size-1.5 rounded-full ${statusBadgeOf(f).dot}`} />
                          {statusBadgeOf(f).label}
                        </span>
                      </div>
                      <div className="sm:col-span-2 text-xs text-primary/80 font-bold flex items-center gap-1.5">
                        <CheckCircle2 size={13} />
                        {responseCountByFormId.get(f.id) || 0} <span className="font-normal text-gray-400">responses</span>
                      </div>
                      <div className="sm:col-span-1 text-xs text-gray-500" title={formatDateTime(f.createdAt)}>{formatDate(f.createdAt)}</div>
                      <div className="sm:col-span-1 text-xs text-gray-500" title={formatDateTime(f.updatedAt)}>{f.updatedAt ? timeAgo(f.updatedAt) : '—'}</div>
                      <div className="sm:col-span-2 flex justify-end items-center gap-1">
                        <button
                          disabled={updateMutation.isPending}
                          onClick={() => {
                            if (f.showAfterLeadCapture) {
                              setDisableConfirm({ id: f.id, title: f.title, branchId: f.branchId });
                            } else {
                              setDefaultFormExplainer({ id: f.id, title: f.title, branchId: f.branchId });
                            }
                          }}
                          className={`size-8 rounded-lg flex items-center justify-center transition-colors ${f.showAfterLeadCapture
                            ? 'bg-primary/10 text-primary shadow-inner'
                            : 'text-gray-400 hover:bg-gray-100'
                            }`}
                          title={f.showAfterLeadCapture ? 'Disable Sequence' : 'Enable Sequence'}
                        >
                          {updateMutation.isPending ? <Spinner size="sm" /> : <CheckCircle2 size={14} />}
                        </button>
                        <Link
                          href={getResponsesUrl(f)}
                          className="h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-primary text-white hover:bg-primary/90 inline-flex items-center gap-1.5"
                          title="View responses"
                        >
                          <BarChart3 size={14} />
                          Responses ({responseCountByFormId.get(f.id) || 0})
                        </Link>
                        <button onClick={() => openShareExplainer('link', f.id, f.title)} className="size-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors"><Link2 size={14} /></button>
                        <button onClick={() => openEdit(f)} className="size-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors"><Pencil size={14} /></button>
                        <button
                          onClick={() => setDeleteConfirm({ id: f.id, title: f.title, branchId: f.branchId })}
                          className="size-8 rounded-lg text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                          title="Delete form"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {viewMode === 'path' && (
        <section className="max-w-4xl mx-auto w-full space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-slate-900">Choose Form Creation Path</h2>
            <p className="text-sm text-slate-500">Start from scratch or load an admin template.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <button onClick={() => { resetBuilder(); setViewMode('builder'); }} className="text-left rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="size-12 rounded-2xl bg-slate-900 text-yellow-300 flex items-center justify-center mb-4"><Plus size={22} /></div>
              <h3 className="text-xl font-bold text-slate-900">Create from Scratch</h3>
              <p className="text-sm text-slate-600 mt-2">Build your own custom form.</p>
            </button>
            <button onClick={() => setViewMode('templates')} className="text-left rounded-2xl border border-primary bg-primary p-6 text-white shadow-sm">
              <div className="size-12 rounded-2xl bg-white/15 text-white flex items-center justify-center mb-4"><LayoutTemplate size={22} /></div>
              <h3 className="text-xl font-bold">Use Admin Template</h3>
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
              <h2 className="text-3xl font-bold text-slate-900">Admin Templates</h2>
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
                <h3 className="text-lg font-bold text-slate-900">{template.name}</h3>
                <p className="text-sm text-slate-500">{template.description || 'No description'}</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{template.fields?.length || 0} fields</p>
                <button onClick={() => handleUseTemplate(template.id)} className="w-full h-10 rounded-xl bg-primary text-white text-sm font-bold">Use Template</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {viewMode === 'builder' && (
        <section className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">{editing ? 'Edit Form' : 'Create Form'}</h2>
              <p className="text-sm text-slate-600">Step 1: details, Step 2: questions, Step 3: after submission message, Step 4: preview & publish.</p>
            </div>
            <button onClick={() => { resetBuilder(); setViewMode('forms'); }} className="h-10 px-4 rounded-xl border border-slate-200 text-sm font-bold inline-flex items-center gap-2"><ArrowLeft size={14} /> My Forms</button>
          </div>

          {/* ─── Compact Step Indicators ─── */}
          <div className="flex items-center justify-center gap-4 max-w-sm mx-auto mb-2">
            {[1, 2, 3, 4].map((step) => (
              <React.Fragment key={step}>
                <button
                  onClick={() => {
                    if (step >= 2 && (!title.trim() || !branchId)) return;
                    if (step >= 3 && invalidFields) return;
                    setBuilderStep(step as BuilderStep);
                  }}
                  className={`size-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    builderStep === step
                      ? 'bg-primary text-white shadow-lg shadow-primary/25 ring-4 ring-primary/10 scale-110'
                      : builderStep > step
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-100'
                        : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}
                  title={step === 1 ? 'Details' : step === 2 ? 'Questions' : step === 3 ? 'Success Message' : 'Preview'}
                >
                  {builderStep > step ? <CheckCircle2 size={18} /> : step}
                </button>
                {step < 4 && (
                  <div className={`h-1 w-12 rounded-full transition-colors ${builderStep > step ? 'bg-emerald-200' : 'bg-slate-100'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {(builderStep === 1 || builderStep === 2 || builderStep === 3) && (
            <div className="flex flex-col xl:flex-row gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Left Column: Form Configuration */}
              <div className="w-full xl:flex-1 space-y-6">
                {builderStep === 1 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
                    <div className="border-b border-slate-50 pb-4">
                      <h3 className="text-xl font-bold text-slate-900">Step 1: Basic Details</h3>
                      <p className="text-sm text-slate-500 mt-1">Set the foundation of your form.</p>
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 ml-1">Form Title</label>
                        <input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all active:scale-[0.99]"
                          placeholder="e.g. Customer Satisfaction Survey"
                        />
  
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 ml-1">Description (Optional)</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full min-h-[100px] rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          placeholder="Tell users what this form is for..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 ml-1">Assign to Branch</label>
                        <select
                          value={branchId}
                          onChange={(e) => setBranchId(e.target.value)}
                          className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                        >
                          <option value="">Select a branch</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div
                        className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/30 cursor-pointer select-none"
                        onClick={() => setIsActive(!isActive)}
                      >
                        <div className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${isActive ? 'bg-primary' : 'bg-gray-200'}`}>
                          <span
                            className={`inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">
                          Keep this form active after saving
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/30 cursor-pointer select-none"
                        onClick={() => setRequiresAuth(!requiresAuth)}
                      >
                        <div className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${requiresAuth ? 'bg-primary' : 'bg-gray-200'}`}>
                          <span
                            className={`inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${requiresAuth ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">
                          Require customers to be logged in
                        </span>
                      </div>

                    </div>

                    <div className="pt-4">
                      <button
                        onClick={() => {
                          if (!title.trim()) return toast.error('Title is required');
                          if (!branchId) return toast.error('Branch is required');
                          setBuilderStep(2);
                        }}
                        className="w-full h-12 rounded-2xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                      >
                        Continue to Questions
                      </button>
                    </div>
                  </div>
                ) : builderStep === 2 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
                    <div className="border-b border-slate-50 pb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Step 2: Questions</h3>
                        <p className="text-sm text-slate-500 mt-1">Add fields to collect information.</p>
                      </div>
                      <button
                        onClick={() => {
                          const n = fieldCount + 1;
                          setFieldCount(n);
                          setFields((p) => [...p, makeField(n)]);
                        }}
                        className="h-10 px-4 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/10 hover:shadow-lg transition-all"
                      >
                        Add New Field
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {fields.map((f) => (
                        <div key={f.id} className="group relative rounded-2xl border border-slate-200 bg-slate-50/20 p-4 space-y-3 transition-colors hover:border-slate-300">
                          <div className="flex gap-2">
                            <select
                              value={f.type}
                              onChange={(e) => setFields((p) => p.map((x) => (x.id === f.id ? { ...x, type: e.target.value as ApiFormFieldType } : x)))}
                              className="flex-1 h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold focus:ring-primary/20 focus:border-primary bg-white cursor-pointer"
                            >
                              <optgroup label="Standard Fields">
                                <option value="text">TEXT INPUT</option>
                                <option value="textarea">LONG TEXT (TEXTAREA)</option>
                                <option value="number">NUMBER ONLY</option>
                                <option value="select">DROPDOWN (SELECT)</option>
                                <option value="radio">SINGLE CHOICE (RADIO)</option>
                                <option value="checkbox">MULTIPLE CHOICE (CHECKBOX)</option>
                              </optgroup>
                              <optgroup label="Date Fields">
                                <option value="date">FULL DATE (MONTH, DAY, YEAR)</option>
                                <option value="date-no-year">PARTIAL DATE (MONTH, DAY ONLY)</option>
                              </optgroup>
                            </select>
                            {fields.length > 1 && (
                              <button
                                onClick={() => setFields((p) => p.filter((x) => x.id !== f.id))}
                                className="size-10 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                          <input
                            value={f.question}
                            onChange={(e) => setFields((p) => p.map((x) => (x.id === f.id ? { ...x, question: e.target.value } : x)))}
                            className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:ring-primary/20 focus:border-primary"
                            placeholder="Type your question here..."
                          />
                          {(f.type === 'select' || f.type === 'radio' || f.type === 'checkbox') && (
                            <input
                              value={f.options}
                              onChange={(e) => setFields((p) => p.map((x) => (x.id === f.id ? { ...x, options: e.target.value } : x)))}
                              className="w-full h-10 rounded-xl border border-slate-200 px-4 text-xs font-medium bg-white"
                              placeholder="Options (e.g. Yes, No, Maybe)"
                            />
                          )}
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500 flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={f.required}
                                onChange={(e) => setFields((p) => p.map((x) => (x.id === f.id ? { ...x, required: e.target.checked } : x)))}
                                className="size-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                              />
                              Required
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-4">
                      <button
                        onClick={() => setBuilderStep(1)}
                        className="flex-1 h-12 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Back to Details
                      </button>
                      <button
                        onClick={() => {
                          if (invalidFields) return toast.error('Each field needs a question');
                          setBuilderStep(3);
                        }}
                        className="flex-[1.5] h-12 rounded-2xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
                      >
                        Continue to After Submission
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
                    <div className="border-b border-slate-50 pb-4">
                      <h3 className="text-xl font-bold text-slate-900">Step 3: After Submission Message</h3>
                      <p className="text-sm text-slate-500 mt-1">Customize the success screen visitors see after they submit.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 ml-1">Success Title</label>
                        <input
                          value={successTitle}
                          onChange={(e) => setSuccessTitle(e.target.value)}
                          className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          placeholder="e.g. Form Submitted Successfully"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 ml-1">Success Description</label>
                        <textarea
                          value={successMessage}
                          onChange={(e) => setSuccessMessage(e.target.value)}
                          className="w-full min-h-[100px] rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          placeholder="e.g. Thank you for your feedback!"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      <button
                        onClick={() => setBuilderStep(2)}
                        className="flex-1 h-12 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Back to Questions
                      </button>
                      <button
                        onClick={() => setBuilderStep(4)}
                        className="flex-[1.5] h-12 rounded-2xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
                      >
                        Continue to Preview
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Persistent Live Preview */}
              <div className="w-full xl:w-[380px] xl:sticky xl:top-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-center gap-2">
                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Live Phone Preview</p>
                  </div>
                  <div className="flex justify-center scale-[0.95] origin-top" style={brandVars}>
                    <PhoneFrame title="Real-time Preview">
                      <div className="min-h-full bg-gradient-to-b from-white via-slate-50 to-slate-100 py-6 px-3 space-y-3">
                        {/* ─── Header: Business branding + Form title ─── */}
                        <div className="bg-white/95 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                          <div className="h-1.5" style={{ backgroundColor: brandColor }} />
                          <div className="px-4 pt-3 pb-4">
                            <div className="flex items-center gap-2 mb-2.5">
                              {businessLogo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={businessLogo}
                                  alt={businessName}
                                  className="size-6 rounded-full object-cover border border-gray-200 shrink-0"
                                />
                              ) : (
                                <div 
                                  className="size-6 rounded-full flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: `${brandColor}15` }}
                                >
                                  <Building2 size={12} style={{ color: brandColor }} />
                                </div>
                              )}
                              <span className="text-[10px] font-semibold text-slate-500 truncate">
                                {businessName}
                                {showBranchName ? (
                                  <span className="text-slate-300 mx-1">·</span>
                                ) : null}
                                {showBranchName && (
                                  <span className="text-slate-400 font-medium">{displayBranchName}</span>
                                )}
                              </span>
                            </div>

                            <h1 className="text-[15px] font-display font-bold text-slate-900 tracking-tight leading-tight">
                              {previewForm.title || 'Untitled Form'}
                            </h1>

                            {previewForm.description && (
                              <p className="mt-1 text-[11px] text-slate-500 font-medium leading-relaxed">
                                {previewForm.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* ─── Body: Form or Success Preview ─── */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm min-h-[120px] flex flex-col items-center justify-center text-center">
                          {builderStep === 1 && !fields.some(f => f.question) ? (
                            <div className="space-y-2 py-4">
                              <LayoutTemplate className="size-8 text-slate-200 mx-auto" />
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-normal">
                                Fill in details to see<br />form layout
                              </p>
                            </div>
                          ) : builderStep === 3 ? (
                            <div className="flex flex-col items-center text-center gap-2">
                              <div className="size-9 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                <CheckCircle2 size={18} />
                              </div>
                              <p className="text-sm font-bold text-slate-900">
                                {successTitle.trim() || 'Thank you!'}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {successMessage.trim() || 'We appreciate your feedback.'}
                              </p>
                            </div>
                          ) : (
                            <StepBusinessForm
                              form={previewForm}
                              hideHeader
                              brandColor={brandColor}
                              onComplete={() => toast.success('Preview submission captured')}
                              onSkip={() => {}}
                            />
                          )}
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-center text-[8px] font-medium text-slate-400">
                          Powered by <span className="font-bold" style={{ color: brandColor }}>{myBusiness?.name || 'VemTap'}</span>
                        </div>
                      </div>
                    </PhoneFrame>
                  </div>
                  <p className="text-[9px] text-slate-400 text-center px-4 leading-relaxed">
                    This is how your form appears on mobile devices. Details update live as you type.
                  </p>
                </div>
              </div>
            </div>
          )}

          {builderStep === 4 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Preview & Publish</p>
                <h3 className="text-2xl font-bold text-slate-900">{previewForm.title}</h3>
                <p className="text-sm text-slate-600">{previewForm.description}</p>
                <div className="text-sm text-slate-600 space-y-1">
                  <p><span className="font-bold text-slate-900">Business:</span> {businessName}</p>
                  <p><span className="font-bold text-slate-900">Branch:</span> {displayBranchName}</p>
                  <p><span className="font-bold text-slate-900">Fields:</span> {previewForm.fields.length}</p>
                  <p><span className="font-bold text-slate-900">Success Message:</span> {successTitle.trim() || 'Default'}</p>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button onClick={() => setBuilderStep(3)} className="h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold">Back to After Submission</button>
                  <button onClick={() => saveForm(false)} disabled={isSaving} className="h-11 px-4 rounded-xl border border-slate-300 text-sm font-bold disabled:opacity-60">{editing ? 'Update as Draft' : 'Save Draft'}</button>
                  <button onClick={() => saveForm(true)} disabled={isSaving} className="h-11 px-4 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-60">{editing ? 'Update & Publish' : 'Publish Form'}</button>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-center gap-2">
                  <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Final Phone Preview</p>
                </div>
                <div className="flex justify-center scale-[0.98] origin-top" style={brandVars}>
                  <PhoneFrame title="Final Preview">
                    <div className="min-h-full bg-gradient-to-b from-white via-slate-50 to-slate-100 py-6 px-3 space-y-3">
                      <div className="bg-white/95 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="h-1.5" style={{ backgroundColor: brandColor }} />
                        <div className="px-4 pt-3 pb-4">
                          <div className="flex items-center gap-2 mb-2.5">
                            {businessLogo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={businessLogo}
                                alt={businessName}
                                className="size-6 rounded-full object-cover border border-gray-200 shrink-0"
                              />
                            ) : (
                              <div 
                                className="size-6 rounded-full flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${brandColor}15` }}
                              >
                                <Building2 size={12} style={{ color: brandColor }} />
                              </div>
                            )}
                            <span className="text-[10px] font-semibold text-slate-500 truncate">
                              {businessName}
                              {showBranchName ? (
                                <span className="text-slate-300 mx-1">·</span>
                              ) : null}
                              {showBranchName && (
                                <span className="text-slate-400 font-medium">{displayBranchName}</span>
                              )}
                            </span>
                          </div>

                          <h1 className="text-[15px] font-display font-bold text-slate-900 tracking-tight leading-tight">
                            {previewForm.title || 'Untitled Form'}
                          </h1>

                          {previewForm.description && (
                            <p className="mt-1 text-[11px] text-slate-500 font-medium leading-relaxed">
                              {previewForm.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                        <StepBusinessForm
                          form={previewForm}
                          hideHeader
                          brandColor={brandColor}
                          onComplete={() => toast.success('Preview submission captured')}
                          onSkip={() => {}}
                        />
                      </div>

                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
                        <div className="size-9 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
                          <CheckCircle2 size={18} />
                        </div>
                        <p className="mt-2 text-sm font-bold text-slate-900">
                          {successTitle.trim() || 'Thank you!'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {successMessage.trim() || 'We appreciate your feedback.'}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-center text-[8px] font-medium text-slate-400">
                        Powered by <span className="font-bold" style={{ color: brandColor }}>{myBusiness?.name || 'VemTap'}</span>
                      </div>
                    </div>
                  </PhoneFrame>
                </div>
                <p className="text-[9px] text-slate-400 text-center px-4 leading-relaxed">
                  This is the final experience visitors will see on their phone.
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ─── Share Explainer Modal ─── */}
      {shareExplainer && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" >
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                {SHARE_EXPLAINERS[shareExplainer.method].icon}
              </div>
              <button onClick={() => setShareExplainer(null)} className="size-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center"><X size={16} /></button>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{SHARE_EXPLAINERS[shareExplainer.method].title}</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">{SHARE_EXPLAINERS[shareExplainer.method].description}</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">Form being shared</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{shareExplainer.formTitle}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShareExplainer(null)} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleShareAction(shareExplainer.method, shareExplainer.formId, shareExplainer.formTitle)} className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-semibold shadow-md shadow-primary/20 hover:shadow-lg transition-all">{SHARE_EXPLAINERS[shareExplainer.method].action}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── QR Code Modal ─── */}
      {shareForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" >
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">QR Code</p>
                <h3 className="text-lg font-semibold text-gray-900 mt-1">{shareForm.title}</h3>
                <p className="text-xs text-gray-500 mt-1">Customers can scan this QR code to open the form.</p>
              </div>
              <button onClick={() => setShareForm(null)} className="size-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="rounded-2xl bg-gray-50 p-6 flex flex-col items-center gap-3">
              <QRCodeCanvas value={shareForm.url} size={200} level="H" />
              <p className="text-xs text-gray-500 text-center break-all max-w-[200px]">{shareForm.url}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => downloadQrCode(shareForm.id, shareForm.title)} className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-md shadow-primary/20"><Download size={16} /> Download</button>
              <button onClick={async () => { await navigator.clipboard.writeText(shareForm.url); toast.success('Link copied!'); }} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 inline-flex items-center justify-center gap-2 hover:bg-gray-50"><Copy size={16} /> Copy Link</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" >
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="size-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><Trash2 size={24} /></div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete form?</h3>
              <p className="text-sm text-gray-500 mt-1">
                <strong>&quot;{deleteConfirm.title}&quot;</strong> will be permanently deleted. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => { deleteMutation.mutate({ id: deleteConfirm.id, branchId: deleteConfirm.branchId }); setDeleteConfirm(null); toast.success('Form deleted'); }} className="flex-1 h-10 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">Delete Form</button>
            </div>
          </div>
        </div>
      )}
      {/* ─── Default Form Explainer Modal ─── */}
      {defaultFormExplainer && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 transition-all" >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 bg-primary" />
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="size-12 rounded-xl bg-primary/8 text-primary flex items-center justify-center">
                  <LayoutList size={24} />
                </div>
                <button
                  onClick={() => setDefaultFormExplainer(null)}
                  className="size-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-tight">Sequence Automation</h3>
                <p className="text-sm text-gray-500 mt-2">Display this form after initial customer submission.</p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="shrink-0 size-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">1</div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Basic Info First</p>
                    <p className="text-xs text-gray-500 mt-0.5">Customers scan NFC and submit basic details (Name, Phone, etc.).</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="shrink-0 size-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">2</div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Then: &quot;{defaultFormExplainer.title}&quot;</p>
                    <p className="text-xs text-gray-500 mt-0.5">Once they hit submit, this specific form will appear automatically to collect deeper feedback.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex gap-3">
                <Info size={16} className="text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-primary/80 leading-relaxed">
                  <strong>When enabled:</strong> This form will display to customers immediately after they complete the default submission. In messaging platforms, it will display within the messaging context.
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDefaultFormExplainer(null)}
                  className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await updateMutation.mutateAsync({
                        id: defaultFormExplainer.id,
                        payload: { showAfterLeadCapture: true, branchId: defaultFormExplainer.branchId }
                      });
                      setDefaultForm(defaultFormExplainer.branchId, defaultFormExplainer.id);
                      setDefaultFormExplainer(null);
                      toast.success('Sequence automation enabled!');
                    } catch (e: any) {
                      toast.error(e?.message || 'Failed to enable automation');
                    }
                  }}
                  className="flex-3 h-11 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-shadow shadow-md shadow-primary/20"
                >
                  Enable Automation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ─── Disable Confirmation Modal ─── */}
      {disableConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 transition-all" >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 bg-amber-500" />
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="size-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Info size={24} />
                </div>
                <button
                  onClick={() => setDisableConfirm(null)}
                  className="size-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-tight">Disable sequence?</h3>
                <p className="text-sm text-gray-500 mt-2">
                  <strong>&quot;{disableConfirm.title}&quot;</strong> will no longer be shown automatically after the initial contact form.
                </p>
              </div>

              {(() => {
                const bKey = disableConfirm.branchId || branchScope || userBranchId || 'global';
                const seqIds = getActiveFormIds(bKey);
                const isInSequence = seqIds.includes(disableConfirm.id);
                return isInSequence ? (
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex gap-3">
                    <Info size={16} className="text-red-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-red-700/80 leading-relaxed">
                      <strong>Warning:</strong> This form is currently in the <strong>Additional Forms sequence</strong> under User Experience. Disabling it will also remove it from the sequence.
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                    <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-700/80 leading-relaxed">
                      Accidental tapping can happen on mobile. This confirmation ensures you intentionally want to stop this form from appearing in the post-submission flow.
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-3">
                <button
                  onClick={() => setDisableConfirm(null)}
                  className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await updateMutation.mutateAsync({
                        id: disableConfirm.id,
                        payload: { showAfterLeadCapture: false, branchId: disableConfirm.branchId }
                      });
                      clearDefaultForm(disableConfirm.branchId);
                      // Also remove from sequence if present
                      const bKey = disableConfirm.branchId || branchScope || userBranchId || 'global';
                      const seqIds = getActiveFormIds(bKey);
                      if (seqIds.includes(disableConfirm.id)) {
                        toggleActiveForm(bKey, disableConfirm.id);
                      }
                      setDisableConfirm(null);
                      toast.success('Sequence automation disabled');
                    } catch (e: any) {
                      toast.error(e?.message || 'Failed to disable automation');
                    }
                  }}
                  className="flex-3 h-11 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-shadow shadow-md shadow-gray-200"
                >
                  Disable Automation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
