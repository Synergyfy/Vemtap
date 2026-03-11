'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Download, Link2, MoreVertical, Send, Share2, Star, X } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import EngagementTabs from '@/components/dashboard/engagement/EngagementTabs';
import PageHeader from '@/components/dashboard/PageHeader';
import Spinner from '@/components/ui/Spinner';
import { useBranches } from '@/services/branches/hooks';
import { useBusinessForms, useDeleteBusinessForm } from '@/services/business-forms/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { useFormPreferencesStore } from '@/store/useFormPreferencesStore';

export default function FormsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deleteMutation = useDeleteBusinessForm();
  const { data: branches = [] } = useBranches();
  const activeBranchId = useAuthStore((state) => state.activeBranchId);
  const userBranchId = useAuthStore((state) => state.user?.branchId);
  const branchScope = activeBranchId === 'all' ? null : (activeBranchId || userBranchId || null);
  const { data: forms = [], isLoading } = useBusinessForms({
    branchId: branchScope || undefined,
    allBranches: !branchScope,
  });

  const setDefaultForm = useFormPreferencesStore((state) => state.setDefaultForm);
  const getDefaultFormId = useFormPreferencesStore((state) => state.getDefaultFormId);
  const toggleActiveForm = useFormPreferencesStore((state) => state.toggleActiveForm);
  const isActiveForm = useFormPreferencesStore((state) => state.isActiveForm);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [shareForm, setShareForm] = useState<{ id: string; title: string; url: string } | null>(null);
  const focusFormId = searchParams.get('focus');

  const defaultFormId = getDefaultFormId(branchScope || 'global');
  const branchName = branches.find((branch) => branch.id === branchScope)?.name || (!branchScope ? 'Full Business' : branchScope);

  const scopedForms = useMemo(() => {
    if (!branchScope) return forms;
    return forms.filter((form) => form.branchId === branchScope);
  }, [forms, branchScope]);
  const branchNameById = useMemo(
    () => new Map(branches.map((branch) => [branch.id, branch.name])),
    [branches]
  );

  const statusOf = (form: { isPublished?: boolean; isActive?: boolean }) => {
    if (!form.isPublished) return { label: 'Draft (Not Published)', tone: 'bg-slate-100 text-slate-700' };
    if (!form.isActive) return { label: 'Archived (Inactive)', tone: 'bg-amber-100 text-amber-700' };
    return { label: 'Active (Published)', tone: 'bg-emerald-100 text-emerald-700' };
  };

  const getPublicFormKey = (formId: string, uniqueCode?: string) => uniqueCode || formId;

  const getFormUrl = (formId: string, uniqueCode?: string) => {
    const key = getPublicFormKey(formId, uniqueCode);
    typeof window !== 'undefined'
      ? `${window.location.origin}/forms/${key}`
      : `/forms/${key}`;
  };

  const getMessagingUrl = (formId: string) => {
    const params = new URLSearchParams();
    params.set('formId', formId);
    if (branchScope) params.set('branchId', branchScope);
    return `/dashboard/messaging/compose?${params.toString()}`;
  };

  const openShare = async (formId: string, title: string, uniqueCode?: string) => {
    const url = getFormUrl(formId, uniqueCode);
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


  useEffect(() => {
    if (!focusFormId) return;
    const target = document.getElementById(`form-card-${focusFormId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusFormId, scopedForms.length]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <PageHeader
        title="Forms"
        description="Manage default form, active user-step forms, and sharing actions."
      />

      <EngagementTabs
        tabs={[
          { label: 'Socials', href: '/dashboard/settings/engagement/socials' },
          { label: 'Form Creator', href: '/dashboard/settings/engagement/forms' },
          { label: 'Responses', href: '/dashboard/settings/engagement/forms/responses' },
        ]}
      />

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
        <p className="text-xs font-bold text-text-secondary">Current Scope: <span className="text-text-main">{branchName}</span></p>
        <p className="text-xs text-text-secondary mt-1">Set one default form and toggle multiple active forms for user-step buttons.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
        <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Where to use your form</p>
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs text-text-secondary">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-text-main font-bold">Share as link or QR</p>
            <p className="mt-1">Copy the public link and show the QR code for walk-ins to scan.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-text-main font-bold">Send via messaging</p>
            <p className="mt-1">Attach the form in Messaging to collect responses by SMS, WhatsApp, or Email.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-text-main font-bold">Use in user-step buttons</p>
            <p className="mt-1">Set a default form and toggle active forms to show during visitor flows.</p>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <Spinner size="md" />
          Loading forms...
        </div>
      )}
      {!isLoading && scopedForms.length === 0 && <p className="text-sm text-text-secondary">No forms for this branch scope.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {scopedForms.map((form) => {
          const isDefault = defaultFormId === form.id;
          const isActiveInUserStep = isActiveForm(branchScope || 'global', form.id);
          const status = statusOf(form);
          return (
            <div
              id={`form-card-${form.id}`}
              key={form.id}
              className={`group relative rounded-3xl bg-white border border-slate-200 shadow-sm p-7 sm:p-8 flex flex-col gap-4 overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 ${focusFormId === form.id ? 'ring-2 ring-primary/20 border-primary' : ''}`}
            >
              <QRCodeCanvas id={`form-qr-${form.id}`} value={getFormUrl(form.id, form.uniqueCode)} size={160} className="hidden" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />

                <div className="flex items-start justify-between gap-3">
                  <div className="bg-primary/10 text-primary p-3 rounded-2xl">
                    <Share2 size={20} />
                  </div>
                  <div className="flex items-center gap-2 relative">
                  <div className="flex items-center gap-2">
                    {isDefault && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-primary/10 text-primary">
                        Default Form
                      </span>
                    )}
                    {isActiveInUserStep && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-700">
                        Active in User Step
                      </span>
                    )}
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${status.tone}`}>{status.label}</span>
                  </div>
                  <button
                    onClick={() => setOpenMenuId((prev) => (prev === form.id ? null : form.id))}
                    className="h-9 w-9 rounded-xl border border-slate-200 inline-flex items-center justify-center text-slate-500"
                    aria-label="More form actions"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openMenuId === form.id && (
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-200 bg-white shadow-lg z-20 p-1">
                      <button onClick={() => openShare(form.id, form.title, form.uniqueCode)} className="w-full text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-gray-50">Copy Share Link and Show QR</button>
                      <button onClick={() => { router.push(getMessagingUrl(form.id)); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-gray-50">Share Form in Messaging</button>
                      <button onClick={() => { router.push(`/dashboard/settings/engagement/forms?edit=${encodeURIComponent(form.id)}`); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-gray-50">Edit Form</button>
                      <button onClick={async () => { try { await deleteMutation.mutateAsync({ id: form.id, branchId: form.branchId }); toast.success('Form deleted'); setOpenMenuId(null); } catch (e: any) { toast.error(e?.message || 'Delete failed'); } }} className="w-full text-left px-3 py-2 text-xs font-bold rounded-lg text-red-600 hover:bg-red-50">Delete Form</button>
                    </div>
                  )}
                </div>
              </div>

                <div className={isActiveInUserStep ? '' : 'opacity-90'}>
                <p className="text-xl font-black text-slate-900">{form.title}</p>
                <p className="text-xs text-slate-500 mt-1">{form.description || 'No description yet.'}</p>
                <p className="text-[11px] text-slate-400 mt-2">Branch: <span className="font-semibold text-slate-700">{branchNameById.get(form.branchId) || 'Unknown Branch'}</span></p>
              </div>

                <div className="mt-auto pt-5 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => openShare(form.id, form.title, form.uniqueCode)}
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
                      setDefaultForm(branchScope || 'global', form.id);
                      toast.success('Default form updated');
                    }}
                    className="relative group/tooltip p-2.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-primary/10 hover:text-primary transition-colors"
                    aria-label={isDefault ? 'This is the default form' : 'Set as default form'}
                  >
                    <Star size={18} className={isDefault ? 'text-primary' : 'text-slate-500'} fill={isDefault ? 'currentColor' : 'none'} />
                    <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 group-hover/tooltip:opacity-100 transition-opacity">
                      {isDefault ? 'Default Form (Current)' : 'Set as Default Form'}
                    </span>
                  </button>

                  <button
                    onClick={() => router.push(getMessagingUrl(form.id))}
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
                      toggleActiveForm(branchScope || 'global', form.id);
                      toast.success(isActiveInUserStep ? 'Removed from user-step buttons' : 'Added to user-step buttons');
                    }}
                    className={`relative group/tooltip p-2.5 rounded-lg transition-colors ${isActiveInUserStep ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'}`}
                    aria-label={isActiveInUserStep ? 'Active in user-step buttons' : 'Toggle active in user-step buttons'}
                  >
                    <CheckCircle2 size={18} />
                    <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 group-hover/tooltip:opacity-100 transition-opacity">
                      {isActiveInUserStep ? 'Active in User Step' : 'Toggle Active in User Step'}
                    </span>
                  </button>
                </div>

                  <div className="flex items-center justify-end">
                    <Link
                      href={`/dashboard/settings/engagement/forms/${form.id}`}
                      className="h-10 px-4 rounded-full border border-slate-200 text-xs font-black text-slate-600 inline-flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                    >
                      Preview Form
                    </Link>
                  </div>
                </div>
            </div>
          );
        })}
      </div>

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
