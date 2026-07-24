'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import {
  Users, Plus, MoreVertical, X, Loader2, Check, Trash2, Edit3, Crown, ArrowRight,
  Activity, Clock, UserCheck, LogIn, Shield, Calendar, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStaff, useInviteStaff, useUpdateStaff, useRemoveStaff } from '@/services/users/hooks';
import { useCapabilities } from '@/services/subscriptions/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'react-hot-toast';
import type { StaffMember } from '@/services/users/types';

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

function buildActivityLog(staff: StaffMember) {
  const entries: { id: string; icon: any; iconBg: string; iconColor: string; title: string; description: string; timestamp: string }[] = [];
  let idx = 0;

  if (staff.createdAt) {
    entries.push({
      id: `created-${idx++}`, icon: UserCheck, iconBg: 'bg-blue-50', iconColor: 'text-blue-600',
      title: 'Account Created',
      description: 'Staff member was invited to the team',
      timestamp: staff.createdAt,
    });
  }

  if (staff.lastActive) {
    entries.push({
      id: `active-${idx++}`, icon: LogIn, iconBg: 'bg-green-50', iconColor: 'text-green-600',
      title: 'Last Login',
      description: 'Staff member last accessed the dashboard',
      timestamp: staff.lastActive,
    });
  }

  if (staff.updatedAt && staff.updatedAt !== staff.createdAt) {
    entries.push({
      id: `updated-${idx++}`, icon: Settings, iconBg: 'bg-gray-50', iconColor: 'text-gray-600',
      title: 'Profile Updated',
      description: 'Staff details or permissions were modified',
      timestamp: staff.updatedAt,
    });
  }

  if (staff.permissions && staff.permissions.length > 0) {
    staff.permissions.forEach(p => {
      entries.push({
        id: `perm-${idx++}-${p}`, icon: Shield, iconBg: 'bg-purple-50', iconColor: 'text-purple-600',
        title: `Permission Granted: ${PERMISSION_LABELS[p] || p}`,
        description: `Has access to ${PERMISSION_LABELS[p] || p} module`,
        timestamp: staff.updatedAt || staff.createdAt,
      });
    });
  }

  if (staff.status) {
    const statusLabel = staff.status === 'ACTIVE' || staff.status === 'Active' ? 'Activated' :
      staff.status === 'INVITED' || staff.status === 'Invited' ? 'Invited' :
      staff.status === 'SUSPENDED' || staff.status === 'Suspended' ? 'Suspended' : 'Status Changed';
    entries.push({
      id: `status-${idx++}`, icon: Activity, iconBg: 'bg-amber-50', iconColor: 'text-amber-600',
      title: `Account ${statusLabel}`,
      description: `Current status: ${staff.status}`,
      timestamp: staff.updatedAt || staff.createdAt,
    });
  }

  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return entries;
}

function formatDate(dateStr: string | undefined | null) {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(dateStr: string | undefined | null) {
  if (!dateStr) return '';
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

export default function StaffDirectory() {
  const { activeBranchId } = useActiveBranch();
  const { data: staffMembers = [], isLoading } = useStaff();
  const inviteMutation = useInviteStaff();
  const updateStaffMutation = useUpdateStaff();
  const removeStaffMutation = useRemoveStaff(activeBranchId ?? undefined);
  const { data: capabilities } = useCapabilities();
  const teamLimit = capabilities?.capabilities?.teamMembers;

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [detailStaffId, setDetailStaffId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const detailStaff = useMemo(
    () => (detailStaffId ? staffMembers.find(s => s.id === detailStaffId) ?? null : null),
    [detailStaffId, staffMembers],
  );

  const activityLog = useMemo(() => {
    if (!detailStaff) return [];
    return buildActivityLog(detailStaff as StaffMember);
  }, [detailStaff]);

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

  const openEditModal = (staff: StaffMember) => {
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
          name: `${form.firstName} ${form.lastName}`.trim(),
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
      if (detailStaffId === id) setDetailStaffId(null);
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
          <div className="flex items-center gap-3">
            {teamLimit && (
              <div className="h-10 md:h-12 px-4 rounded-2xl bg-gray-100 flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Used</span>
                  <span className={cn(
                    "text-sm font-black tabular-nums",
                    teamLimit.remaining !== 'unlimited' && teamLimit.remaining <= 2 ? "text-red-500" : "text-gray-900"
                  )}>
                    {teamLimit.used}
                  </span>
                </div>
                <div className="w-px h-4 bg-gray-300" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Limit</span>
                  <span className="text-sm font-black tabular-nums text-gray-900">
                    {teamLimit.limit === 'unlimited' ? '∞' : teamLimit.limit}
                  </span>
                </div>
              </div>
            )}
            <button onClick={() => { setForm(emptyForm); setShowInviteModal(true); }}
              className="h-10 md:h-12 px-4 md:px-6 rounded-2xl bg-[#066CF4] text-white flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all">
              <Plus size={18} />
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest hidden sm:inline">Invite Member</span>
            </button>
          </div>
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
                <tr key={staff.id}
                  onClick={() => setDetailStaffId(detailStaffId === staff.id ? null : staff.id)}
                  className={cn(
                    "hover:bg-gray-50/50 transition-colors cursor-pointer",
                    detailStaffId === staff.id && "bg-blue-50/50"
                  )}>
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
                    <button onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === staff.id ? null : staff.id); }}
                      className="p-2 rounded-xl hover:bg-gray-200 text-gray-400 transition-colors">
                      <MoreVertical size={18} />
                    </button>
                    {openDropdown === staff.id && (
                      <div ref={dropdownRef} className="absolute right-4 top-12 z-50 w-40 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { openEditModal(staff); setOpenDropdown(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
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

      {detailStaff && (
        <StaffDetailPanel
          staff={detailStaff}
          activityLog={activityLog}
          onEdit={() => { openEditModal(detailStaff as StaffMember); }}
          onDelete={() => { setShowDeleteConfirm(detailStaff.id); setDetailStaffId(null); }}
          onClose={() => setDetailStaffId(null)}
        />
      )}

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
                className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-600 font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Close</button>
              <a href="/dashboard/settings/subscription"
                className="flex-1 h-12 rounded-2xl bg-[#066CF4] text-white font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                Upgrade <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      )}

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

function StaffDetailPanel({ staff, activityLog, onEdit, onDelete, onClose }: {
  staff: StaffMember; activityLog: ReturnType<typeof buildActivityLog>; onEdit: () => void; onDelete: () => void; onClose: () => void;
}) {
  const displayName = `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || staff.email || 'Unnamed';
  const isActive = staff.status === 'Active' || staff.status === 'ACTIVE';
  const perms = staff.permissions || [];

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white shadow-2xl overflow-y-auto animate-slide-in">
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100 flex items-center justify-between p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-[16px] bg-blue-50 text-blue-600 font-black flex items-center justify-center border border-blue-100 text-lg">
              {displayName.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">{displayName}</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{staff.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="size-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          <div className="flex gap-2">
            <button onClick={onEdit}
              className="flex-1 h-11 rounded-2xl bg-[#066CF4] text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20">
              <Edit3 size={14} /> Edit Role & Permissions
            </button>
            <button onClick={onDelete}
              className="h-11 px-5 rounded-2xl bg-red-50 text-red-500 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-100 transition-all">
              <Trash2 size={14} /> Remove
            </button>
          </div>

          <div className="bg-gray-50 rounded-[24px] p-5 space-y-4">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-500">Profile Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">First Name</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{staff.firstName || '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Last Name</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{staff.lastName || '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Email</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{staff.email || '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Phone</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{staff.phone || '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Role</p>
                <span className={cn("inline-block mt-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                  staff.role === 'Owner' ? "bg-purple-100 text-purple-600" :
                  staff.role === 'Manager' ? "bg-blue-100 text-blue-600" :
                  "bg-gray-200 text-gray-600"
                )}>{staff.role || 'Staff'}</span>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Status</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={cn("size-2.5 rounded-full", isActive ? "bg-emerald-500" : "bg-gray-300")} />
                  <span className="text-sm font-bold text-gray-900">{staff.status}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-[24px] p-5 space-y-3">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-500">Permissions</h3>
            {perms.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {perms.map(p => (
                  <span key={p} className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[9px] font-bold flex items-center gap-1">
                    {PERMISSION_LABELS[p] || p}
                  </span>
                ))}
              </div>
            ) : <p className="text-xs text-gray-400 italic">No permissions assigned</p>}
          </div>

          <div className="bg-gray-50 rounded-[24px] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                <Activity size={12} /> Activity Log
              </h3>
            </div>
            {activityLog.length > 0 ? (
              <div className="space-y-0">
                {activityLog.map((entry, i) => (
                  <div key={entry.id} className="relative flex gap-4 pb-5 last:pb-0">
                    {i < activityLog.length - 1 && (
                      <div className="absolute left-[15px] top-9 bottom-0 w-px bg-gray-200" />
                    )}
                    <div className={cn("size-8 rounded-xl flex items-center justify-center shrink-0", entry.iconBg)}>
                      <entry.icon size={14} className={entry.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-black text-gray-900 truncate">{entry.title}</p>
                        <span className="text-[8px] font-bold text-gray-400 shrink-0">{timeAgo(entry.timestamp)}</span>
                      </div>
                      <p className="text-[9px] font-bold text-gray-400 mt-0.5">{entry.description}</p>
                      <p className="text-[8px] text-gray-300 mt-0.5">{formatDate(entry.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Clock size={24} className="mx-auto mb-2 text-gray-200" />
                <p className="text-[10px] font-bold text-gray-400">No activity recorded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
