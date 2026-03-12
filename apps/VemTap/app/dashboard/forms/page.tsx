'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Pencil,
  Plus,
  QrCode,
  Search,
  Send,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import EngagementTabs from '@/components/dashboard/engagement/EngagementTabs';
import PageHeader from '@/components/dashboard/PageHeader';
import Spinner from '@/components/ui/Spinner';
import { useBranches } from '@/services/branches/hooks';
import { useBusinessForms, useDeleteBusinessForm } from '@/services/business-forms/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { useFormPreferencesStore } from '@/store/useFormPreferencesStore';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

type ViewMode = 'grid' | 'list';

type ShareMethod = 'qr' | 'link' | 'messaging';

interface ShareExplainerState {
  method: ShareMethod;
  formId: string;
  formTitle: string;
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'Ã¢â‚¬â€';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Ã¢â‚¬â€';
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Ã¢â‚¬â€';
  }
}

function formatDateTime(dateString?: string): string {
  if (!dateString) return 'Ã¢â‚¬â€';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Ã¢â‚¬â€';
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Ã¢â‚¬â€';
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

export default function FormsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deleteMutation = useDeleteBusinessForm();
  const { data: branches = [] } = useBranches();
  const activeBranchId = useAuthStore((state) => state.activeBranchId);
  const userBranchId = useAuthStore((state) => state.user?.branchId);
  const branchScope = activeBranchId === 'all' ? null : (activeBranchId || userBranchId || null);

  const { data: forms = [], isLoading } = useBusinessForms({
    branchId: branchScope || userBranchId || branches[0]?.id || undefined,
    allBranches: !branchScope,
  });

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [shareForm, setShareForm] = useState<{ id: string; title: string; url: string } | null>(null);
  const [shareExplainer, setShareExplainer] = useState<ShareExplainerState | null>(null);
  const [defaultFormExplainer, setDefaultFormExplainer] = useState<{ id: string; title: string; branchId: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string; branchId?: string } | null>(null);
  const focusFormId = searchParams.get('focus');

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
    staleTime: 60000, // 1 minute
  });

  const responseCountByFormId = useMemo(() => {
    const map = new Map<string, number>();
    responsesSummary.forEach((item) => map.set(item.formId, item.count));
    return map;
  }, [responsesSummary]);

  const { setDefaultForm, getDefaultFormId, clearDefaultForm } = useFormPreferencesStore();

  const branchName =
    branches.find((branch) => branch.id === branchScope)?.name ||
    (!branchScope ? 'All Branches' : branchScope);

  const branchNameById = useMemo(
    () => new Map(branches.map((branch) => [branch.id, branch.name])),
    [branches]
  );

  const scopedForms = useMemo(() => {
    let result = forms;
    if (branchScope) {
      result = forms.filter((form) => form.branchId === branchScope);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (form) =>
          form.title.toLowerCase().includes(q) ||
          (form.description || '').toLowerCase().includes(q) ||
          (branchNameById.get(form.branchId) || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [forms, branchScope, searchQuery, branchNameById]);

  const statusOf = (form: { isPublished?: boolean; isActive?: boolean }) => {
    if (!form.isPublished)
      return { label: 'Draft', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
    if (!form.isActive)
      return { label: 'Inactive', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400' };
    return { label: 'Active', color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' };
  };

  const getPublicFormKey = (formId: string, uniqueCode?: string) => uniqueCode || formId;

  const getFormUrl = (formId: string, uniqueCode?: string): string => {
  const key = getPublicFormKey(formId, uniqueCode);

  return typeof window !== 'undefined'
    ? `${window.location.origin}/forms/${key}`
    : `/forms/${key}`;
};

  const getMessagingUrl = (formId: string) => {
    const params = new URLSearchParams();
    params.set('formId', formId);
    if (branchScope) params.set('branchId', branchScope);
    return `/dashboard/messaging/compose?${params.toString()}`;
  };

  const handleShareAction = async (method: ShareMethod, formId: string, formTitle: string) => {
  setShareExplainer(null);
  const form = scopedForms.find((f) => f.id === formId);
  if (!form) return;

  if (method === 'link') {
    const url = getFormUrl(form.id, form.uniqueCode);
    await navigator.clipboard.writeText(url);
    toast.success('Form link copied to clipboard!');
  } 
  else if (method === 'qr') {
    const url = getFormUrl(form.id, form.uniqueCode);
    setShareForm({ id: formId, title: formTitle, url });
  } 
  else if (method === 'messaging') {
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
    const safeName = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const link = document.createElement('a');
    link.download = `vemtap-form-${safeName || formId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteConfirm.id, branchId: deleteConfirm.branchId });
      toast.success('Form deleted successfully');
      setDeleteConfirm(null);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete form');
    }
  };

  useEffect(() => {
    if (!focusFormId) return;
    const target = document.getElementById(`form-card-${focusFormId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusFormId, scopedForms.length]);

  // Close menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-form-menu]')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openMenuId]);


  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Forms</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create, manage, and share forms with your customers across all your branches.
          </p>
        </div>
        <Link
          href="/dashboard/settings/engagement/forms"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-primary text-white text-sm font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={18} />
          Create Form
        </Link>
      </div>

      {/* Quick Nav */}
      <EngagementTabs
        tabs={[
          { label: 'Socials', href: '/dashboard/settings/engagement/socials' },
          { label: 'Form Creator', href: '/dashboard/settings/engagement/forms' },
          { label: 'Responses', href: '/dashboard/settings/engagement/forms/responses' },
        ]}
      />

      {/* How it works - Collapsed helper */}
      <details className="group rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none hover:bg-gray-50 transition-colors">
          <div className="size-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Info size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">How to use Forms</p>
            <p className="text-xs text-gray-500">Click to learn about the three ways to share your forms</p>
          </div>
          <svg
            className="size-5 text-gray-400 transition-transform group-open:rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="px-5 pb-5 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl bg-gray-50 p-4 flex gap-3">
              <div className="size-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <QrCode size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">QR Code</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Generate a scannable QR code. Perfect for printouts, receipts, table tents, or in-store displays.
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 flex gap-3">
              <div className="size-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Link2 size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Direct Link</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Copy a URL that opens the form. Share via chat, email, social media, or embed on your website.
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 flex gap-3">
              <div className="size-9 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                <MessageSquare size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Messaging</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Send the form directly to contacts using built-in SMS, WhatsApp, or Email messaging.
                </p>
              </div>
            </div>
          </div>
        </div>
      </details>

      {/* Toolbar: Scope badge, Search, View toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
          <div className="size-2 rounded-full bg-primary" />
          Viewing: {branchName}
        </div>

        <div className="flex-1 flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search forms..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              aria-label="Grid view"
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              aria-label="List view"
            >
              <LayoutList size={16} />
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          {scopedForms.length} form{scopedForms.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Spinner size="md" />
          <p className="text-sm text-gray-500">Loading your forms...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && scopedForms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="size-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <FileText size={28} className="text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-gray-900">No forms found</p>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              {searchQuery
                ? `No forms match "${searchQuery}". Try a different search.`
                : `You haven't created any forms ${branchScope ? 'for this branch' : ''} yet. Create your first form to start collecting responses.`}
            </p>
          </div>
          {!searchQuery && (
            <Link
              href="/dashboard/settings/engagement/forms"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-primary text-white text-sm font-semibold shadow-md"
            >
              <Plus size={16} />
              Create your first form
            </Link>
          )}
        </div>
      )}

      {/* Grid View */}
      {!isLoading && scopedForms.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {scopedForms.map((form) => {
            const status = statusOf(form);
            const branchLabel = branchNameById.get(form.branchId) || 'Unknown Branch';
            return (
              <div
                id={`form-card-${form.id}`}
                key={form.id}
                className={`group relative bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all hover:shadow-lg hover:border-gray-300 ${focusFormId === form.id ? 'ring-2 ring-primary/30 border-primary' : ''
                  }`}
              >
                <QRCodeCanvas
                  id={`form-qr-${form.id}`}
                  value={getFormUrl(form.id, form.uniqueCode)}
                  size={160}
                  className="hidden"
                />

                {/* Top color bar */}
                <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />

                <div className="p-5">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-xl bg-primary/8 text-primary flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{form.title}</h3>
                        <p className="text-xs text-gray-500 truncate">{branchLabel}</p>
                      </div>
                    </div>

                    {/* Menu trigger */}
                    <div className="relative" data-form-menu>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId((prev) => (prev === form.id ? null : form.id));
                        }}
                        className="size-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 flex items-center justify-center transition-colors"
                        aria-label="More actions"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openMenuId === form.id && (
                        <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-gray-200 bg-white shadow-xl z-30 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                          <button
                            onClick={() => openShareExplainer('link', form.id, form.title)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Link2 size={16} className="text-gray-400" />
                            Copy share link
                          </button>
                          <button
                            onClick={() => openShareExplainer('qr', form.id, form.title)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <QrCode size={16} className="text-gray-400" />
                            Generate QR code
                          </button>
                          <button
                            onClick={() => openShareExplainer('messaging', form.id, form.title)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Send size={16} className="text-gray-400" />
                            Send via messaging
                          </button>
                          <div className="h-px bg-gray-100 my-1" />
                          <button
                            onClick={() => {
                              router.push(`/dashboard/settings/engagement/forms/${form.id}`);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Eye size={16} className="text-gray-400" />
                            Preview form
                          </button>
                          <button
                            onClick={() => {
                              router.push(
                                `/dashboard/settings/engagement/forms?edit=${encodeURIComponent(form.id)}`
                              );
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Pencil size={16} className="text-gray-400" />
                            Edit form
                          </button>
                          <div className="h-px bg-gray-100 my-1" />
                          <button
                            onClick={() => {
                              setDeleteConfirm({ id: form.id, title: form.title, branchId: form.branchId });
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={16} />
                            Delete form
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {form.description && (
                    <p className="text-xs text-gray-500 mt-3 line-clamp-2">{form.description}</p>
                  )}

                  {/* Status + Date */}
                  <div className="flex items-center justify-between mt-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}
                    >
                      <div className={`size-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-xs font-semibold text-primary/80" title="Engagement metrics: number of people who have filled this form">
                        <CheckCircle2 size={12} />
                        {responseCountByFormId.get(form.id) || 0} filled
                      </div>
                      <span className="text-xs text-gray-400" title={formatDateTime(form.createdAt)}>
                        {form.createdAt ? timeAgo(form.createdAt) : 'Ã¢â‚¬â€'}
                      </span>
                    </div>
                  </div>

                  {/* Default Submission Feature */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-[10px] font-bold text-gray-900 uppercase tracking-tight truncate">Show after basic info</span>
                        <button
                          onClick={() => setDefaultFormExplainer({ id: form.id, title: form.title, branchId: form.branchId })}
                          className="shrink-0 size-4 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-700 flex items-center justify-center transition-colors"
                        >
                          <Info size={10} />
                        </button>
                      </div>
                      <p className="text-[9px] text-gray-500 leading-tight mt-0.5">Automate this form to show after name/phone capture</p>
                    </div>
                    <button
                      onClick={() => {
                        const isCurrentlyDefault = getDefaultFormId(form.branchId) === form.id;
                        if (isCurrentlyDefault) {
                          clearDefaultForm(form.branchId);
                          toast.success('Sequence automation disabled');
                        } else {
                          setDefaultFormExplainer({ id: form.id, title: form.title, branchId: form.branchId });
                        }
                      }}
                      className={`shrink-0 h-7 px-3 rounded-lg text-[10px] font-black uppercase transition-all ${getDefaultFormId(form.branchId) === form.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      {getDefaultFormId(form.branchId) === form.id ? 'Enabled' : 'Enable'}
                    </button>
                  </div>

                  {/* Date metadata */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1" title={`Created: ${formatDateTime(form.createdAt)}`}>
                      <Calendar size={12} />
                      Created {formatDate(form.createdAt)}
                    </span>
                    {form.updatedAt && form.updatedAt !== form.createdAt && (
                      <span title={`Updated: ${formatDateTime(form.updatedAt)}`}>
                        Ã‚Â· Updated {formatDate(form.updatedAt)}
                      </span>
                    )}
                  </div>

                  {/* Quick actions */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1">
                    <button
                      onClick={() => openShareExplainer('link', form.id, form.title)}
                      className="flex-1 h-8 rounded-lg text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 inline-flex items-center justify-center gap-1.5 transition-colors"
                      title="Copy share link"
                    >
                      <Link2 size={14} />
                      Link
                    </button>
                    <button
                      onClick={() => openShareExplainer('qr', form.id, form.title)}
                      className="flex-1 h-8 rounded-lg text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 inline-flex items-center justify-center gap-1.5 transition-colors"
                      title="Show QR code"
                    >
                      <QrCode size={14} />
                      QR
                    </button>
                    <button
                      onClick={() => openShareExplainer('messaging', form.id, form.title)}
                      className="flex-1 h-8 rounded-lg text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 inline-flex items-center justify-center gap-1.5 transition-colors"
                      title="Send via messaging"
                    >
                      <Send size={14} />
                      Send
                    </button>
                    <Link
                      href={`/dashboard/settings/engagement/forms/${form.id}`}
                      className="flex-1 h-8 rounded-lg text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 inline-flex items-center justify-center gap-1.5 transition-colors"
                      title="Preview form"
                    >
                      <Eye size={14} />
                      Preview
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {!isLoading && scopedForms.length > 0 && viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Table header */}
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
            {scopedForms.map((form) => {
              const status = statusOf(form);
              const branchLabel = branchNameById.get(form.branchId) || 'Unknown';
              return (
                <div
                  id={`form-card-${form.id}`}
                  key={form.id}
                  className={`grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 items-center hover:bg-gray-50 transition-colors ${focusFormId === form.id ? 'bg-primary/5' : ''
                    }`}
                >
                  <QRCodeCanvas
                    id={`form-qr-${form.id}`}
                    value={getFormUrl(form.id, form.uniqueCode)}
                    size={160}
                    className="hidden"
                  />value={getFormUrl(form.id, form.uniqueCode)}

                  {/* Form info */}
                  <div className="sm:col-span-3 flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-lg bg-primary/8 text-primary flex items-center justify-center shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{form.title}</p>
                      {form.description && (
                        <p className="text-xs text-gray-500 truncate">{form.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Branch */}
                  <div className="sm:col-span-2">
                    <span className="text-xs text-gray-600 truncate block">{branchLabel}</span>
                  </div>

                  {/* Status */}
                  <div className="sm:col-span-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                    >
                      <div className={`size-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>

                  {/* Engagement */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary/80" title="Total responses for this form">
                      <CheckCircle2 size={14} />
                      {responseCountByFormId.get(form.id) || 0}
                      <span className="font-normal text-gray-400 ml-1">filled</span>
                    </div>
                  </div>

                  {/* Created */}
                  <div className="sm:col-span-1 text-xs text-gray-500" title={formatDateTime(form.createdAt)}>
                    {formatDate(form.createdAt)}
                  </div>

                  {/* Updated */}
                  <div className="sm:col-span-1 text-xs text-gray-500" title={formatDateTime(form.updatedAt)}>
                    {form.updatedAt ? timeAgo(form.updatedAt) : 'Ã¢â‚¬â€'}
                  </div>

                  {/* Actions */}
                  <div className="sm:col-span-2 flex items-center justify-end gap-1">
                    <button
                      onClick={() => {
                        const isCurrentlyDefault = getDefaultFormId(form.branchId) === form.id;
                        if (isCurrentlyDefault) {
                          clearDefaultForm(form.branchId);
                          toast.success('Sequence automation disabled');
                        } else {
                          setDefaultFormExplainer({ id: form.id, title: form.title, branchId: form.branchId });
                        }
                      }}
                      className={`size-8 rounded-lg flex items-center justify-center transition-colors ${getDefaultFormId(form.branchId) === form.id
                        ? 'bg-primary/10 text-primary shadow-inner'
                        : 'text-gray-400 hover:bg-gray-100'
                        }`}
                      title={getDefaultFormId(form.branchId) === form.id ? 'Disable Sequence' : 'Enable Sequence'}
                    >
                      <CheckCircle2 size={14} />
                    </button>
                    <button
                      onClick={() => openShareExplainer('link', form.id, form.title)}
                      className="size-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors"
                      title="Copy share link"
                    >
                      <Link2 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        router.push(`/dashboard/settings/engagement/forms?edit=${encodeURIComponent(form.id)}`);
                      }}
                      className="size-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors"
                      title="Edit form"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirm({ id: form.id, title: form.title, branchId: form.branchId });
                      }}
                      className="size-8 rounded-lg text-red-400 hover:bg-red-50 flex items-center justify-center transition-colors"
                      title="Delete form"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="relative" data-form-menu>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId((prev) => (prev === form.id ? null : form.id));
                      }}
                      className="size-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 flex items-center justify-center transition-colors"
                      aria-label="More actions"
                    >
                      <MoreVertical size={15} />
                    </button>

                    {openMenuId === form.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-gray-200 bg-white shadow-xl z-30 py-1">
                        <button
                          onClick={() => openShareExplainer('messaging', form.id, form.title)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Send size={14} className="text-gray-400" />
                          Send via messaging
                        </button>
                        <button
                          onClick={() => {
                            router.push(
                              `/dashboard/settings/engagement/forms?edit=${encodeURIComponent(form.id)}`
                            );
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil size={14} className="text-gray-400" />
                          Edit form
                        </button>
                        <div className="h-px bg-gray-100" />
                        <button
                          onClick={() => {
                            setDeleteConfirm({
                              id: form.id,
                              title: form.title,
                              branchId: form.branchId,
                            });
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                          Delete form
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Share Explainer Modal Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {
        shareExplainer && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShareExplainer(null)}>
            <div
              className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  {SHARE_EXPLAINERS[shareExplainer.method].icon}
                </div>
                <button
                  onClick={() => setShareExplainer(null)}
                  className="size-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {SHARE_EXPLAINERS[shareExplainer.method].title}
                </h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  {SHARE_EXPLAINERS[shareExplainer.method].description}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">Form being shared</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{shareExplainer.formTitle}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShareExplainer(null)}
                  className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleShareAction(shareExplainer.method, shareExplainer.formId, shareExplainer.formTitle)
                  }
                  className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-semibold shadow-md shadow-primary/20 hover:shadow-lg transition-all"
                >
                  {SHARE_EXPLAINERS[shareExplainer.method].action}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ QR Code Modal Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {
        shareForm && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShareForm(null)}>
            <div
              className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">QR Code</p>
                  <h3 className="text-lg font-semibold text-gray-900 mt-1">{shareForm.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Customers can scan this QR code with their phone camera to open the form.
                  </p>
                </div>
                <button
                  onClick={() => setShareForm(null)}
                  className="size-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="rounded-2xl bg-gray-50 p-6 flex flex-col items-center gap-3">
                <QRCodeCanvas value={shareForm.url} size={200} level="H" />
                <p className="text-xs text-gray-500 text-center break-all max-w-[200px]">{shareForm.url}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => downloadQrCode(shareForm.id, shareForm.title)}
                  className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-md shadow-primary/20"
                >
                  <Download size={16} />
                  Download
                </button>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(shareForm.url);
                    toast.success('Link copied!');
                  }}
                  className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 inline-flex items-center justify-center gap-2 hover:bg-gray-50"
                >
                  <Copy size={16} />
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Delete Confirmation Modal Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {
        deleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
            <div
              className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="size-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete form?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  <strong>&quot;{deleteConfirm.title}&quot;</strong> will be permanently deleted. Any shared
                  links or QR codes for this form will stop working. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 h-10 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Form'}
                </button>
              </div>
            </div>
          </div>
        )
      }
      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Default Form Explainer Modal Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {
        defaultFormExplainer && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 transition-all" onClick={() => setDefaultFormExplainer(null)}>
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
                  <h3 className="text-xl font-black text-gray-900 leading-tight">Sequence Automation</h3>
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
                      <p className="text-sm font-bold text-gray-800">Then: "{defaultFormExplainer.title}"</p>
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
                    onClick={() => {
                      setDefaultForm(defaultFormExplainer.branchId, defaultFormExplainer.id);
                      setDefaultFormExplainer(null);
                      toast.success('Sequence automation enabled!');
                    }}
                    className="flex-3 h-11 rounded-xl bg-primary text-white text-sm font-black hover:bg-primary/90 transition-shadow shadow-md shadow-primary/20"
                  >
                    Enable Automation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
}
