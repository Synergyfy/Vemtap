'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, MoreVertical } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import EngagementTabs from '@/components/dashboard/engagement/EngagementTabs';
import PageHeader from '@/components/dashboard/PageHeader';
import { useBranches } from '@/services/branches/hooks';
import { useBusinessForms, useDeleteBusinessForm } from '@/services/business-forms/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { useFormPreferencesStore } from '@/store/useFormPreferencesStore';

export default function FormsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: forms = [], isLoading } = useBusinessForms();
  const deleteMutation = useDeleteBusinessForm();
  const { data: branches = [] } = useBranches();
  const activeBranchId = useAuthStore((state) => state.activeBranchId);
  const userBranchId = useAuthStore((state) => state.user?.branchId);

  const setDefaultForm = useFormPreferencesStore((state) => state.setDefaultForm);
  const getDefaultFormId = useFormPreferencesStore((state) => state.getDefaultFormId);
  const toggleActiveForm = useFormPreferencesStore((state) => state.toggleActiveForm);
  const isActiveForm = useFormPreferencesStore((state) => state.isActiveForm);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const focusFormId = searchParams.get('focus');

  const branchScope = activeBranchId === 'all' ? null : (activeBranchId || userBranchId || null);
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

  const getFormUrl = (formId: string) =>
    typeof window !== 'undefined'
      ? `${window.location.origin}/forms/${formId}`
      : `/forms/${formId}`;

  const copyLink = async (formId: string) => {
    await navigator.clipboard.writeText(getFormUrl(formId));
    toast.success('Form link copied');
    setOpenMenuId(null);
  };

  const copyQrCode = async (formId: string) => {
    const canvas = document.getElementById(`form-qr-${formId}`) as HTMLCanvasElement | null;
    if (!canvas) {
      toast.error('QR not ready yet');
      return;
    }

    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Failed to generate QR image');
          return;
        }
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          toast.success('QR code copied');
          setOpenMenuId(null);
        } catch {
          await navigator.clipboard.writeText(getFormUrl(formId));
          toast.success('QR link copied');
          setOpenMenuId(null);
        }
      });
      return;
    }

    await navigator.clipboard.writeText(getFormUrl(formId));
    toast.success('QR link copied');
    setOpenMenuId(null);
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

      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
        <p className="text-xs font-bold text-text-secondary">Current Scope: <span className="text-text-main">{branchName}</span></p>
        <p className="text-xs text-text-secondary mt-1">Set one default form and toggle multiple active forms for user-step buttons.</p>
      </div>

      {isLoading && <p className="text-sm text-text-secondary">Loading forms...</p>}
      {!isLoading && scopedForms.length === 0 && <p className="text-sm text-text-secondary">No forms for this branch scope.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {scopedForms.map((form) => {
          const isDefault = defaultFormId === form.id;
          const isActiveInUserStep = isActiveForm(branchScope || 'global', form.id);
          return (
            <div id={`form-card-${form.id}`} key={form.id} className={`relative rounded-2xl bg-white border p-5 sm:p-6 shadow-sm space-y-4 ${focusFormId === form.id ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'}`}>
              <QRCodeCanvas id={`form-qr-${form.id}`} value={getFormUrl(form.id)} size={160} className="hidden" />

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-text-main">{form.title}</p>
                  <p className="text-xs text-text-secondary mt-1">{form.description || 'No description'}</p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId((prev) => prev === form.id ? null : form.id)}
                    className="h-9 w-9 rounded-xl border border-gray-200 inline-flex items-center justify-center text-text-secondary"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openMenuId === form.id && (
                    <div className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-200 bg-white shadow-lg z-20 p-1">
                      <button onClick={() => copyLink(form.id)} className="w-full text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-gray-50">Copy as link</button>
                      <button onClick={() => { router.push(`/dashboard/messaging/compose?formId=${encodeURIComponent(form.id)}`); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-gray-50">Share to messaging</button>
                      <button onClick={() => copyQrCode(form.id)} className="w-full text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-gray-50">Copy QR code</button>
                      <button onClick={() => { router.push(`/dashboard/settings/engagement/forms?edit=${encodeURIComponent(form.id)}`); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-gray-50">Edit</button>
                      <button onClick={async () => { try { await deleteMutation.mutateAsync(form.id); toast.success('Form deleted'); setOpenMenuId(null); } catch (e: any) { toast.error(e?.message || 'Delete failed'); } }} className="w-full text-left px-3 py-2 text-xs font-bold rounded-lg text-red-600 hover:bg-red-50">Delete</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-text-secondary space-y-1">
                <p>Branch: <span className="font-semibold text-text-main">{branchNameById.get(form.branchId) || 'Unknown Branch'}</span></p>
                <p>Fields: <span className="font-semibold text-text-main">{form.fields?.length || 0}</span></p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setDefaultForm(branchScope || 'global', form.id);
                    toast.success('Default form updated');
                  }}
                  className={`w-full h-10 px-4 rounded-xl text-xs font-black inline-flex items-center justify-center gap-2 ${isDefault ? 'bg-primary text-white' : 'border border-gray-300 text-text-secondary bg-white'}`}
                >
                  <CheckCircle2 size={14} />
                  {isDefault ? 'Default Form' : 'Set as Default'}
                </button>

                <button
                  onClick={() => {
                    toggleActiveForm(branchScope || 'global', form.id);
                    toast.success(isActiveInUserStep ? 'Removed from user-step buttons' : 'Added to user-step buttons');
                  }}
                  className={`w-full h-10 px-4 rounded-xl text-xs font-black ${isActiveInUserStep ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'border border-gray-300 text-text-secondary bg-white'}`}
                >
                  {isActiveInUserStep ? 'Active in User Step' : 'Toggle Active in User Step'}
                </button>
              </div>

              <Link
                href={`/dashboard/settings/engagement/forms/${form.id}`}
                className="block text-center h-10 leading-10 rounded-xl border border-gray-300 text-xs font-black text-text-secondary"
              >
                Preview
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => router.push(`/dashboard/settings/engagement/forms?edit=${encodeURIComponent(form.id)}`)}
                  className="h-10 rounded-xl border border-gray-300 text-xs font-black text-text-secondary"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    try {
                      await deleteMutation.mutateAsync(form.id);
                      toast.success('Form deleted');
                    } catch (e: any) {
                      toast.error(e?.message || 'Delete failed');
                    }
                  }}
                  className="h-10 rounded-xl bg-red-50 text-red-700 text-xs font-black"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
