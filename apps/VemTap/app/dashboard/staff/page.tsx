'use client';

import React, { useState, useRef, useEffect } from 'react';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Users, Plus, MoreVertical, X, Loader2, Check, ChevronDown, Trash2, Edit3, Crown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStaff, useInviteStaff, useUpdateStaff, useRemoveStaff } from '@/services/users/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'react-hot-toast';

const ALL_PERMISSIONS = [
  'dashboard', 'inventory', 'pos', 'visitors', 'messages', 'engagement',
  'customer-experience', 'marketing', 'discovery', 'analytics', 'staff',
  'settings', 'qrthrive',
] as const;
const PERMISSION_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', inventory: 'Products & Stock', pos: 'Sales & POS',
  visitors: 'Customers', messages: 'In-App Chat', engagement: 'Forms',
  'customer-experience': 'My Business QR', marketing: 'Marketing Kit',
  discovery: 'Get Customers', analytics: 'Advanced Analytics', staff: 'Staff',
  settings: 'Settings & Locations', qrthrive: 'Explore QRThrive',
};

interface FormState {
  firstName: string; lastName: string; email: string; phone: string; role: string; permissions: string[];
}

const emptyForm: FormState = { firstName: '', lastName: '', email: '', phone: '', role: 'Staff', permissions: [] };

export default function StaffDirectory() {
  const { activeBranchId } = useActiveBranch();
  const { data: staffMembers = [], isLoading } = useStaff();
  const inviteMutation = useInviteStaff();
  const updateStaffMutation = useUpdateStaff();
  const removeStaffMutation = useRemoveStaff(activeBranchId ?? undefined);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePermission = (perm: string) => {
    setForm(p => ({
      ...p,
      permissions: p.permissions.includes(perm) ? p.permissions.filter(x => x !== perm) : [...p.permissions, perm],
    }));
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) return;
    try {
      await inviteMutation.mutateAsync({
        firstName: form.firstName, lastName: form.lastName, email: form.email,
        phone: form.phone || undefined, role: form.role as any,
        permissions: form.permissions, branchId: activeBranchId ?? '',
      });
      toast.success('Invitation sent!');
      setShowInviteModal(false);
      setForm(emptyForm);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('limit') && msg.toLowerCase().includes('team')) {
        setShowInviteModal(false);
        setForm(emptyForm);
        setShowLimitModal(true);
      } else {
        toast.error(msg || 'Failed to send invitation');
      }
    }
  };

  const openEditModal = (staff: any) => {
    setEditTarget(staff.id);
    setForm({
      firstName: staff.firstName || '', lastName: staff.lastName || '',
      email: staff.email || '', phone: staff.phone || '',
      role: staff.role || 'Staff', permissions: staff.permissions || [],
    });
    setShowEditModal(true);
    setOpenDropdown(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    try {
      await updateStaffMutation.mutateAsync({
        id: editTarget,
        updates: {
          firstName: form.firstName, lastName: form.lastName,
          role: form.role as any, permissions: form.permissions,
        },
      });
      toast.success('Staff updated!');
      setShowEditModal(false);
      setEditTarget(null);
      setForm(emptyForm);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update staff');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeStaffMutation.mutateAsync(id);
      toast.success('Staff removed');
      setShowDeleteConfirm(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to remove staff');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20 min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const formFields = ({ buttonLabel, isPending }: { buttonLabel: string; isPending: boolean }) => (
    <div className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">First Name</label>
          <input required value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
            placeholder="John" className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Last Name</label>
          <input required value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
            placeholder="Doe" className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all" />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email</label>
        <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          placeholder="staff@example.com" className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all" />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Phone</label>
        <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
          placeholder="+2348012345678" className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all" />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Role Title</label>
        <input value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
          placeholder="e.g. Cashier, Manager, Supervisor"
          className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all" />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Permissions</label>
          <button type="button" onClick={() =>
            setForm(p => ({ ...p, permissions: p.permissions.length === ALL_PERMISSIONS.length ? [] : [...ALL_PERMISSIONS] }))
          } className="text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600">
            {form.permissions.length === ALL_PERMISSIONS.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
          {ALL_PERMISSIONS.map(p => (
            <label key={p} className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all text-xs font-bold",
              form.permissions.includes(p) ? "border-blue-200 bg-blue-50 text-blue-700" : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"
            )}>
              <div className={cn("size-4 rounded-md border-2 flex items-center justify-center transition-all",
                form.permissions.includes(p) ? "border-blue-500 bg-blue-500" : "border-gray-300"
              )}>
                {form.permissions.includes(p) && <Check size={10} className="text-white" />}
              </div>
              <span>{PERMISSION_LABELS[p] || p}</span>
              <input type="checkbox" checked={form.permissions.includes(p)} onChange={() => togglePermission(p)} className="hidden" />
            </label>
          ))}
        </div>
      </div>
      <button type="submit" disabled={isPending || !form.firstName || !form.lastName || !form.email}
        className="w-full h-12 rounded-2xl bg-[#066CF4] text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-50 transition-all">
        {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
        {isPending ? 'Saving...' : buttonLabel}
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader
        title="Staff Directory"
        subtitle="Manage user access and roles"
        actions={
          <button onClick={() => { setForm(emptyForm); setShowInviteModal(true); }}
            className="h-10 md:h-12 px-4 md:px-6 rounded-2xl bg-[#066CF4] text-white flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all">
            <Plus size={18} />
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest hidden sm:inline">Invite Member</span>
          </button>
        }
      />

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-gray-50/90 backdrop-blur border-b border-gray-100 z-10">
              <tr>
                <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Staff Member</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Role</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hidden sm:table-cell">Permissions</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">Status</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staffMembers.length > 0 ? staffMembers.map(staff => {
                const displayName = `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || staff.email || 'Unnamed';
                const isActive = staff.status === 'Active' || staff.status === 'ACTIVE';
                const perms = staff.permissions || [];
                return (
                <tr key={staff.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-[12px] bg-blue-50 text-blue-600 font-black flex items-center justify-center border border-blue-100 shrink-0">
                        {displayName.charAt(0)}
                      </div>
                      <div>
                        <span className="text-sm font-black text-gray-900 block">{displayName}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{staff.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={cn("inline-block px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                      staff.role === 'Owner' ? "bg-purple-100 text-purple-600" :
                      staff.role === 'Manager' ? "bg-blue-100 text-blue-600" :
                      "bg-gray-100 text-gray-600"
                    )}>{staff.role || 'Staff'}</span>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1 max-w-[280px]">
                      {perms.length > 0 ? perms.slice(0, 4).map((perm: string) => (
                        <span key={perm} className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[8px] font-bold uppercase tracking-wider">
                          {PERMISSION_LABELS[perm] || perm}
                        </span>
                      )) : <span className="text-[10px] text-gray-400 italic">None</span>}
                      {perms.length > 4 && <span className="text-[8px] font-black text-gray-400">+{perms.length - 4}</span>}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={cn("inline-block size-3 rounded-full", isActive ? "bg-emerald-500" : "bg-gray-300")} />
                  </td>
                  <td className="p-4 text-right relative">
                    <button onClick={() => setOpenDropdown(openDropdown === staff.id ? null : staff.id)}
                      className="p-2 rounded-xl hover:bg-gray-200 text-gray-400 transition-colors">
                      <MoreVertical size={18} />
                    </button>
                    {openDropdown === staff.id && (
                      <div ref={dropdownRef} className="absolute right-4 top-12 z-50 w-40 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
                        <button onClick={() => openEditModal(staff)} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                          <Edit3 size={14} /> Edit Role & Permissions
                        </button>
                        <button onClick={() => { setShowDeleteConfirm(staff.id); setOpenDropdown(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 size={14} /> Remove Staff
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Users size={48} className="mx-auto mb-4 text-gray-200" />
                    <p className="text-sm font-bold text-gray-400">No staff members yet</p>
                    <p className="text-xs text-gray-400 mt-1">Invite team members to get started.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => { setShowInviteModal(false); setForm(emptyForm); }} />
          <div className="relative w-full max-w-lg bg-white rounded-[32px] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div><h2 className="text-lg font-black text-gray-900">Invite Member</h2><p className="text-xs font-bold text-gray-400 mt-0.5">Send an invitation email</p></div>
              <button onClick={() => { setShowInviteModal(false); setForm(emptyForm); }} className="size-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"><X size={16} /></button>
            </div>
            <form onSubmit={handleInviteSubmit}>{formFields({ buttonLabel: 'Send Invitation', isPending: inviteMutation.isPending })}</form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => { setShowEditModal(false); setForm(emptyForm); }} />
          <div className="relative w-full max-w-lg bg-white rounded-[32px] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div><h2 className="text-lg font-black text-gray-900">Edit Staff</h2><p className="text-xs font-bold text-gray-400 mt-0.5">Update role & permissions</p></div>
              <button onClick={() => { setShowEditModal(false); setForm(emptyForm); }} className="size-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"><X size={16} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>{formFields({ buttonLabel: 'Save Changes', isPending: updateStaffMutation.isPending })}</form>
          </div>
        </div>
      )}

      {/* Limit Reached Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowLimitModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-xl p-8 text-center">
            <div className="size-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5 border border-amber-200">
              <Crown size={36} className="text-amber-500" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Team Member Limit Reached</h2>
            <p className="text-sm font-bold text-gray-500 mb-6 leading-relaxed">
              You have reached the maximum number of team members allowed on your current plan. 
              Upgrade to add more staff members and unlock additional features.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowLimitModal(false)}
                className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-600 font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
                Close
              </button>
              <a href="/dashboard/settings/subscription"
                className="flex-1 h-12 rounded-2xl bg-[#066CF4] text-white font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                Upgrade <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-[32px] shadow-xl p-6 text-center">
            <div className="size-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Trash2 size={28} className="text-red-500" />
            </div>
            <h2 className="text-lg font-black text-gray-900 mb-1">Remove Staff</h2>
            <p className="text-sm font-bold text-gray-500 mb-6">This action cannot be undone. Are you sure?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-600 font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} disabled={removeStaffMutation.isPending}
                className="flex-1 h-12 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-600 disabled:opacity-50 transition-all">
                {removeStaffMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                {removeStaffMutation.isPending ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
