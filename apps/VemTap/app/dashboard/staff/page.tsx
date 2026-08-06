'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import {
  Users, Plus, MoreVertical, X, Loader2, Check, Trash2, Edit3, Crown, ArrowRight,
  Activity, Clock, UserCheck, LogIn, Shield, Calendar, Settings, ChevronRight,
  ChevronDown, Home, CreditCard, Package, MessageSquare, Globe2, FileText, QrCode,
  Palette, Users2, Globe, BarChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStaff, useInviteStaff, useUpdateStaff, useRemoveStaff } from '@/services/users/hooks';
import type { UpdateStaffRequest } from '@/services/users/types';
import { useCapabilities } from '@/services/subscriptions/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'react-hot-toast';
import type { StaffMember } from '@/services/users/types';
import { NAVIGATION_SECTIONS } from '@/constants/ownerNavigation';
import type { NavSection, MenuItem, SubmenuItem } from '@/constants/ownerNavigation';

const ALL_PERMISSIONS = [
  // Top-level
  'dashboard', 'inventory', 'pos', 'visitors', 'messages', 'engagement',
  'customer-experience', 'marketing', 'discovery', 'analytics', 'staff',
  'settings', 'qrthrive',
  // Sales (pos) sub-permissions
  'pos:sales-dashboard', 'pos:pos-home', 'pos:orders', 'pos:settings', 'pos:help',
  // Inventory sub-permissions
  'inventory:overview', 'inventory:catalogue', 'inventory:inventory',
  // Visitors sub-permissions
  'visitors:overview', 'visitors:customer-list', 'visitors:loyalty', 'visitors:visitors',
  // Discovery sub-permissions
  'discovery:get-customers', 'discovery:business-partnership',
  // Analytics sub-permissions
  'analytics:overview', 'analytics:ai-reports', 'analytics:sales-reports',
  'analytics:inventory-reports', 'analytics:customers', 'analytics:discovery',
  'analytics:footfall', 'analytics:marketing', 'analytics:peak-times',
  // Settings sub-permissions
  'settings:profile', 'settings:subscription', 'settings:support', 'settings:compliance',
] as const;
const PERMISSION_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', inventory: 'Products & Stock', pos: 'Sales & POS',
  visitors: 'Customers', messages: 'In-App Chat', engagement: 'Forms',
  'customer-experience': 'My Business QR', marketing: 'Marketing Kit',
  discovery: 'Get Customers', analytics: 'Advanced Analytics', staff: 'Staff',
  settings: 'Settings & Locations', qrthrive: 'Explore QRThrive',
};

const SECTION_ICONS: Record<string, any> = {
  'section-commerce': Package,
  'section-engagement': MessageSquare,
  'section-experience': QrCode,
  'section-discovery': BarChart,
  'section-analytics': BarChart,
  'section-manage': Users2,
  'section-qrthrive': QrCode,
  'section-settings': Settings,
};

function getSubPermission(parentPermission: string, subLabel: string): string {
  return `${parentPermission}:${subLabel.toLowerCase().replace(/\s+/g, '-')}`;
}

function getPageIcon(pageId: string): any {
  const map: Record<string, any> = {
    overview: Home, sales: CreditCard, 'products-stock': Package,
    'commerce-customers': Users, 'in-app-chat': MessageSquare,
    channels: Globe2, 'manage-forms': FileText, 'my-business-qr': QrCode,
    'marketing-assets': Palette, discovery: BarChart, 'analytics-overview': BarChart,
    staff: Users2, branches: Globe, 'qr-codes': QrCode, preferences: Settings,
  };
  return map[pageId] || Shield;
}

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
  const [inviteStep, setInviteStep] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [originalStaff, setOriginalStaff] = useState<StaffMember | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(p => p[sectionId] ? {} : { [sectionId]: true });
  };

  const ROLE_SUGGESTIONS = ['Manager', 'Cashier', 'Supervisor', 'Inventory', 'Marketing', 'Support', 'Accountant', 'HR'];

  const selectRole = (role: string) => {
    setForm(p => ({ ...p, role }));
  };

  const togglePermission = (perm: string) => {
    setForm(p => {
      const isAdding = !p.permissions.includes(perm);
      let updated = isAdding ? [...p.permissions, perm] : p.permissions.filter(x => x !== perm);
      if (perm.includes(':')) {
        const parentKey = perm.split(':')[0];
        if (isAdding && !updated.includes(parentKey)) {
          updated.push(parentKey);
        } else if (!isAdding) {
          const hasOtherSubItems = updated.some(x => x.startsWith(parentKey + ':') && x !== perm);
          if (!hasOtherSubItems) {
            updated = updated.filter(x => x !== parentKey);
          }
        }
      }
      return { ...p, permissions: updated };
    });
  };

  const getPageSubPermissions = useCallback((item: MenuItem): string[] => {
    if (!item.submenu) return [];
    return item.submenu.map(sub => getSubPermission(item.permission || item.id, sub.label));
  }, []);

  const getAllPagePermissions = useCallback((item: MenuItem): string[] => {
    const perms = [item.permission || item.id];
    if (item.submenu) {
      perms.push(...item.submenu.map(sub => getSubPermission(item.permission || item.id, sub.label)));
    }
    return perms;
  }, []);

  const isPageFullyChecked = useCallback((item: MenuItem): boolean => {
    const all = getAllPagePermissions(item);
    return all.every(p => form.permissions.includes(p));
  }, [form.permissions, getAllPagePermissions]);

  const isPagePartiallyChecked = useCallback((item: MenuItem): boolean => {
    const all = getAllPagePermissions(item);
    const checked = all.filter(p => form.permissions.includes(p));
    return checked.length > 0 && checked.length < all.length;
  }, [form.permissions, getAllPagePermissions]);

  const togglePagePermissions = (item: MenuItem) => {
    const parentPerm = item.permission || item.id;
    setForm(p => {
      if (p.permissions.includes(parentPerm)) {
        const all = getAllPagePermissions(item);
        return { ...p, permissions: p.permissions.filter(x => !all.includes(x)) };
      }
      return { ...p, permissions: [...p.permissions, parentPerm] };
    });
  };

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

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) return;
    const cleanPermissions = form.permissions.filter(p => ALL_PERMISSIONS.includes(p as any));
    try {
      await inviteMutation.mutateAsync({
        firstName: form.firstName, lastName: form.lastName, email: form.email,
        phone: form.phone || undefined, role: form.role as any,
        permissions: cleanPermissions, branchId: activeBranchId ?? '',
      });
      toast.success('Invitation sent!');
      setShowInviteModal(false);
      setInviteStep(1);
      setForm(emptyForm);
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || '';
      const displayMsg = Array.isArray(msg) ? msg.join(', ') : msg;
      if (typeof displayMsg === 'string' && displayMsg.toLowerCase().includes('limit') && displayMsg.toLowerCase().includes('team')) {
        setShowInviteModal(false);
        setForm(emptyForm);
        setShowLimitModal(true);
      } else if (msg.toLowerCase().includes('already exist') || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('in use') || msg.toLowerCase().includes('taken')) {
        toast.error('This email already exists. Please use a different email address.');
      } else {
        toast.error(displayMsg || 'Failed to send invitation');
      }
    }
  };

  const openEditModal = (staff: StaffMember) => {
    setEditTarget(staff.id);
    setOriginalStaff(staff);
    const validPermissions = (staff.permissions || []).filter(p => ALL_PERMISSIONS.includes(p as any));
    setForm({
      firstName: staff.firstName || '', lastName: staff.lastName || '',
      email: staff.email || '', phone: staff.phone || '',
      role: staff.role || 'Staff', permissions: validPermissions,
    });
    setShowEditModal(true);
    setOpenDropdown(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    const updates: Record<string, any> = {};

    const newName = `${form.firstName} ${form.lastName}`.trim();
    const origName = originalStaff ? `${originalStaff.firstName || ''} ${originalStaff.lastName || ''}`.trim() : '';

    if (newName !== origName) {
      updates.name = newName;
    }

    if (originalStaff && form.role !== originalStaff.role) {
      updates.role = form.role;
    }

    const cleanPermissions = form.permissions.filter(p => ALL_PERMISSIONS.includes(p as any));
    const origPermissions = (originalStaff?.permissions || []).filter(p => ALL_PERMISSIONS.includes(p as any));

    const permissionsChanged =
      cleanPermissions.length !== origPermissions.length ||
      cleanPermissions.some(p => !origPermissions.includes(p));

    if (permissionsChanged) {
      updates.permissions = cleanPermissions;
    }

    if (Object.keys(updates).length === 0) {
      toast('No changes to save');
      setShowEditModal(false);
      setEditTarget(null);
      setOriginalStaff(null);
      setForm(emptyForm);
      return;
    }

    try {
      await updateStaffMutation.mutateAsync({
        id: editTarget,
        updates,
        branchId: activeBranchId ?? undefined,
      });
      toast.success('Staff updated!');
      setShowEditModal(false);
      setEditTarget(null);
      setOriginalStaff(null);
      setForm(emptyForm);
    } catch (err: any) {
      const rawMsg = err?.response?.data?.message || err?.message || '';
      const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : rawMsg;
      if (typeof msg === 'string' && (msg.toLowerCase().includes('already exist') || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('in use') || msg.toLowerCase().includes('taken'))) {
        toast.error('This email already exists. Please use a different email address.');
      } else {
        toast.error(msg || 'Failed to update staff');
      }
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
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowInviteModal(false); setForm(emptyForm); setInviteStep(1); }} />
          <div className="relative w-full sm:max-w-xl bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden max-h-[96dvh] sm:max-h-[90dvh] flex flex-col">
            <div className="flex items-center justify-between p-5 sm:p-7 border-b border-gray-100 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  {[1, 2].map(s => (
                    <span key={s} className={cn("rounded-full transition-all", s === inviteStep ? "bg-blue-500 w-6 h-2" : s < inviteStep ? "bg-blue-300 w-2 h-2" : "bg-gray-200 w-2 h-2")} />
                  ))}
                </div>
                <h2 className="text-lg sm:text-xl font-black text-gray-900">{inviteStep === 1 ? 'Invite Staff' : 'Set Permissions'}</h2>
                <p className="text-[11px] font-bold text-gray-400 mt-0.5">{inviteStep === 1 ? 'Enter the staff member\'s details' : `Step 2 of 2 — ${form.permissions.length} permission${form.permissions.length !== 1 ? 's' : ''} selected`}</p>
              </div>
              <button onClick={() => { setShowInviteModal(false); setForm(emptyForm); setInviteStep(1); }} className="size-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
            {inviteStep === 1 && (
              <form key="step1" onSubmit={e => { e.preventDefault(); setInviteStep(2); }}>
                <div className="p-5 sm:p-7 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                        First Name <span className="text-red-400">*</span>
                        <span title="Staff member's legal first name" className="size-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 cursor-help text-[8px] font-bold ml-auto">?</span>
                      </label>
                      <input required value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                        placeholder="e.g. John" className="w-full h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                        Last Name <span className="text-red-400">*</span>
                        <span title="Staff member's legal last name" className="size-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 cursor-help text-[8px] font-bold ml-auto">?</span>
                      </label>
                      <input required value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                        placeholder="e.g. Doe" className="w-full h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                      Email Address <span className="text-red-400">*</span>
                      <span title="We'll send the invitation link to this email" className="size-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 cursor-help text-[8px] font-bold ml-auto">?</span>
                    </label>
                    <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="staff@company.com" className="w-full h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                      Phone Number
                      <span title="Optional. Used for account recovery" className="size-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 cursor-help text-[8px] font-bold ml-auto">?</span>
                    </label>
                    <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="e.g. +234 801 234 5678" className="w-full h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all" />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                      Role Title <span className="text-red-400">*</span>
                      <span title="Their position or job title within your organization" className="size-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 cursor-help text-[8px] font-bold ml-auto">?</span>
                    </label>
                    <input value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                      placeholder="Type a role or select below"
                      className="w-full h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all" />
                    <div className="flex flex-wrap gap-2">
                      {ROLE_SUGGESTIONS.map(role => (
                        <button key={role} type="button" onClick={() => selectRole(role)}
                          className={cn("px-3.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all",
                            form.role === role
                              ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                              : "bg-white text-gray-600 border-gray-200 hover:border-blue-200 hover:text-blue-600"
                          )}>{role}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-5 sm:p-7 pt-0 sm:pt-0">
                  <button type="submit" disabled={!form.firstName || !form.lastName || !form.email}
                    className="w-full h-14 rounded-2xl bg-[#066CF4] text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20">
                    Next Step — Permissions <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            )}
            {inviteStep === 2 && (
              <form key="step2" onSubmit={handleInviteSubmit}>
                <div className="p-5 sm:p-7 pt-2 space-y-2.5">
                  {NAVIGATION_SECTIONS.map(section => {
                    const sectionItems = section.items.filter(item => item.id !== 'staff');
                    if (sectionItems.length === 0) return null;
                    const allSectionPerms = sectionItems.flatMap(item => getAllPagePermissions(item));
                    const sectionCheckedCount = allSectionPerms.filter(p => form.permissions.includes(p)).length;
                    const sectionTotal = allSectionPerms.length;
                    const isExpanded = expandedSections[section.id] ?? false;
                    const sectionLabel = section.label || sectionItems.map(i => i.label).join(', ');
                    return (
                      <div key={section.id} className="border border-gray-100 rounded-2xl overflow-hidden">
                        <button type="button" onClick={() => toggleSection(section.id)}
                          className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-2.5">
                            {isExpanded ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
                            <span className="text-[11px] font-black uppercase tracking-widest text-gray-600">{sectionLabel}</span>
                          </div>
                          <span className={cn("text-[10px] font-bold", sectionCheckedCount > 0 ? "text-blue-500" : "text-gray-400")}>{sectionCheckedCount}/{sectionTotal}</span>
                        </button>
                        {isExpanded && (
                          <div className="p-2.5 space-y-1">
                            {sectionItems.map(item => {
                              const Icon = getPageIcon(item.id);
                              const allPerms = getAllPagePermissions(item);
                              const itemCheckedCount = allPerms.filter(p => form.permissions.includes(p)).length;
                              const fullyChecked = itemCheckedCount === allPerms.length;
                              const partiallyChecked = itemCheckedCount > 0 && itemCheckedCount < allPerms.length;
                              return (
                                <div key={item.id}>
                                  <button type="button" onClick={() => togglePagePermissions(item)}
                                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-blue-50 transition-colors group">
                                    <div className={cn("size-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                                      fullyChecked ? "border-blue-500 bg-blue-500" : partiallyChecked ? "border-blue-400 bg-blue-100" : "border-gray-300 group-hover:border-blue-300"
                                    )}>
                                      {fullyChecked && <Check size={11} className="text-white" />}
                                      {partiallyChecked && <div className="size-2 rounded-sm bg-blue-500" />}
                                    </div>
                                    <Icon size={15} className={cn("shrink-0", fullyChecked ? "text-blue-500" : "text-gray-400")} />
                                    <span className={cn("text-sm font-bold flex-1 text-left", fullyChecked ? "text-blue-700" : "text-gray-700")}>{item.label}</span>
                                    <span className="text-[10px] text-gray-400">{itemCheckedCount}/{allPerms.length}</span>
                                  </button>
                                  {item.submenu && (
                                    <div className="ml-9 pl-3.5 border-l-2 border-gray-100 space-y-0.5 mb-1">
                                      {item.submenu.map(sub => {
                                        const subPerm = getSubPermission(item.permission || item.id, sub.label);
                                        const isChecked = form.permissions.includes(subPerm);
                                        return (
                                          <button type="button" key={sub.label} onClick={() => togglePermission(subPerm)}
                                            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg hover:bg-blue-50 transition-colors group">
                                            <div className={cn("size-4 rounded border-2 flex items-center justify-center transition-all shrink-0",
                                              isChecked ? "border-blue-500 bg-blue-500" : "border-gray-300 group-hover:border-blue-300"
                                            )}>
                                              {isChecked && <Check size={9} className="text-white" />}
                                            </div>
                                            <span className={cn("text-xs font-medium flex-1 text-left", isChecked ? "text-blue-600" : "text-gray-500")}>{sub.label}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="p-5 sm:p-7 pt-3 flex gap-3 border-t border-gray-50">
                  <button type="button" onClick={() => setInviteStep(1)}
                    className="h-14 px-6 rounded-2xl bg-gray-100 text-gray-600 font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors shrink-0">Back</button>
                  <button type="submit" disabled={inviteMutation.isPending}
                    className="flex-1 h-14 rounded-2xl bg-[#066CF4] text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20">
                    {inviteMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : null}
                    {inviteMutation.isPending ? 'Sending Invitation...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowEditModal(false); setForm(emptyForm); }} />
          <div className="relative w-full sm:max-w-xl bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden max-h-[96dvh] sm:max-h-[90dvh] flex flex-col">
            <div className="flex items-center justify-between p-5 sm:p-7 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-gray-900">Edit Staff</h2>
                <p className="text-[11px] font-bold text-gray-400 mt-0.5">Update role & permissions — {form.permissions.length} selected</p>
              </div>
              <button onClick={() => { setShowEditModal(false); setForm(emptyForm); }} className="size-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0"><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">First Name <span title="Staff member's legal first name" className="size-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 cursor-help text-[8px] font-bold ml-auto">?</span></label>
                    <input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                      className="w-full h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">Last Name <span title="Staff member's legal last name" className="size-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 cursor-help text-[8px] font-bold ml-auto">?</span></label>
                    <input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                      className="w-full h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all" />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">Role Title <span title="Their position or job title" className="size-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 cursor-help text-[8px] font-bold ml-auto">?</span></label>
                  <input value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all" />
                  <div className="flex flex-wrap gap-2">
                    {ROLE_SUGGESTIONS.map(role => (
                      <button key={role} type="button" onClick={() => selectRole(role)}
                        className={cn("px-3.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all",
                          form.role === role
                            ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                            : "bg-white text-gray-600 border-gray-200 hover:border-blue-200 hover:text-blue-600"
                        )}>{role}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">Permissions <span title="Granular access control for each page" className="size-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 cursor-help text-[8px] font-bold">?</span></label>
                  </div>
                  {NAVIGATION_SECTIONS.map(section => {
                    const sectionItems = section.items.filter(item => item.id !== 'staff');
                    if (sectionItems.length === 0) return null;
                    const allSectionPerms = sectionItems.flatMap(item => getAllPagePermissions(item));
                    const sectionCheckedCount = allSectionPerms.filter(p => form.permissions.includes(p)).length;
                    const sectionTotal = allSectionPerms.length;
                    const isExpanded = expandedSections[section.id] ?? false;
                    const sectionLabel = section.label || sectionItems.map(i => i.label).join(', ');
                    return (
                      <div key={section.id} className="border border-gray-100 rounded-2xl overflow-hidden">
                        <button type="button" onClick={() => toggleSection(section.id)}
                          className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-2.5">
                            {isExpanded ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
                            <span className="text-[11px] font-black uppercase tracking-widest text-gray-600">{sectionLabel}</span>
                          </div>
                          <span className={cn("text-[10px] font-bold", sectionCheckedCount > 0 ? "text-blue-500" : "text-gray-400")}>{sectionCheckedCount}/{sectionTotal}</span>
                        </button>
                        {isExpanded && (
                          <div className="p-2.5 space-y-1">
                            {sectionItems.map(item => {
                              const Icon = getPageIcon(item.id);
                              const allPerms = getAllPagePermissions(item);
                              const itemCheckedCount = allPerms.filter(p => form.permissions.includes(p)).length;
                              const fullyChecked = itemCheckedCount === allPerms.length;
                              const partiallyChecked = itemCheckedCount > 0 && itemCheckedCount < allPerms.length;
                              return (
                                <div key={item.id}>
                                  <button type="button" onClick={() => togglePagePermissions(item)}
                                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-blue-50 transition-colors group">
                                    <div className={cn("size-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                                      fullyChecked ? "border-blue-500 bg-blue-500" : partiallyChecked ? "border-blue-400 bg-blue-100" : "border-gray-300 group-hover:border-blue-300"
                                    )}>
                                      {fullyChecked && <Check size={11} className="text-white" />}
                                      {partiallyChecked && <div className="size-2 rounded-sm bg-blue-500" />}
                                    </div>
                                    <Icon size={15} className={cn("shrink-0", fullyChecked ? "text-blue-500" : "text-gray-400")} />
                                    <span className={cn("text-sm font-bold flex-1 text-left", fullyChecked ? "text-blue-700" : "text-gray-700")}>{item.label}</span>
                                    <span className="text-[10px] text-gray-400">{itemCheckedCount}/{allPerms.length}</span>
                                  </button>
                                  {item.submenu && (
                                    <div className="ml-9 pl-3.5 border-l-2 border-gray-100 space-y-0.5 mb-1">
                                      {item.submenu.map(sub => {
                                        const subPerm = getSubPermission(item.permission || item.id, sub.label);
                                        const isChecked = form.permissions.includes(subPerm);
                                        return (
                                          <button type="button" key={sub.label} onClick={() => togglePermission(subPerm)}
                                            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg hover:bg-blue-50 transition-colors group">
                                            <div className={cn("size-4 rounded border-2 flex items-center justify-center transition-all shrink-0",
                                              isChecked ? "border-blue-500 bg-blue-500" : "border-gray-300 group-hover:border-blue-300"
                                            )}>
                                              {isChecked && <Check size={9} className="text-white" />}
                                            </div>
                                            <span className={cn("text-xs font-medium flex-1 text-left", isChecked ? "text-blue-600" : "text-gray-500")}>{sub.label}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="p-5 sm:p-7 pt-0 sm:pt-0 shrink-0">
                <button type="submit" disabled={updateStaffMutation.isPending}
                  className="w-full h-14 rounded-2xl bg-[#066CF4] text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20">
                  {updateStaffMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : null}
                  {updateStaffMutation.isPending ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
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
