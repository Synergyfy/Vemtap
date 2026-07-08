'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Users, Shield, Activity, Plus, MoreVertical, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStaff, useInviteStaff } from '@/services/users/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'react-hot-toast';

export default function StaffDirectory() {
  const router = useRouter();
  const { activeBranchId } = useActiveBranch();
  const { data: staffMembers = [], isLoading } = useStaff();
  const inviteMutation = useInviteStaff();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ firstName: '', lastName: '', email: '', phone: '', role: 'Staff' as const });

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.firstName || !inviteForm.lastName || !inviteForm.email) return;
    try {
      await inviteMutation.mutateAsync({
        ...inviteForm,
        branchId: activeBranchId ?? '',
      });
      toast.success('Invitation sent!');
      setShowInviteModal(false);
      setInviteForm({ firstName: '', lastName: '', email: '', phone: '', role: 'Staff' });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send invitation');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20 min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader 
        title="Staff Directory" 
        subtitle="Manage user access and roles"
        actions={
          <div className="flex gap-2">
            <button 
              onClick={() => router.push('/dashboard/staff/roles')}
              className="h-10 md:h-12 px-4 rounded-2xl bg-gray-100 text-gray-600 flex items-center gap-2 hover:bg-gray-200 transition-colors"
            >
              <Shield size={18} />
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest hidden sm:inline">Roles & Permissions</span>
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="h-10 md:h-12 px-4 md:px-6 rounded-2xl bg-[#066CF4] text-white flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all"
            >
              <Plus size={18} />
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest hidden sm:inline">Invite Staff</span>
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
                <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hidden sm:table-cell">Contact</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">Status</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staffMembers.length > 0 ? staffMembers.map(staff => {
                const displayName = `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || staff.email || 'Unnamed';
                const isActive = staff.status === 'Active' || staff.status === 'ACTIVE';
                return (
                <tr key={staff.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-[12px] bg-blue-50 text-blue-600 font-black flex items-center justify-center border border-blue-100 shrink-0">
                         {displayName.charAt(0)}
                      </div>
                      <div>
                        <span className="text-sm font-black text-gray-900 block">{displayName}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Active {staff.lastActive || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "inline-block px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                      staff.role === 'Owner' ? "bg-purple-100 text-purple-600" :
                      staff.role === 'Manager' ? "bg-blue-100 text-blue-600" :
                      "bg-gray-100 text-gray-600"
                    )}>
                      {staff.role || 'Staff'}
                    </span>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <p className="text-xs font-bold text-gray-900">{staff.phone || 'N/A'}</p>
                    <p className="text-[10px] font-bold text-gray-400">{staff.email || 'N/A'}</p>
                  </td>
                  <td className="p-4 text-center">
                    <span className={cn(
                      "inline-block px-2 py-1 rounded-full size-3",
                      isActive ? "bg-emerald-500" : "bg-gray-300"
                    )} />
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 rounded-xl hover:bg-gray-200 text-gray-400 transition-colors">
                      <MoreVertical size={18} />
                    </button>
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

      {/* Invite Staff Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowInviteModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-black text-gray-900">Invite Staff</h2>
                <p className="text-xs font-bold text-gray-400 mt-0.5">Send an invitation email</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="size-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">First Name</label>
                  <input
                    type="text"
                    required
                    value={inviteForm.firstName}
                    onChange={(e) => setInviteForm(p => ({ ...p, firstName: e.target.value }))}
                    placeholder="John"
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Last Name</label>
                  <input
                    type="text"
                    required
                    value={inviteForm.lastName}
                    onChange={(e) => setInviteForm(p => ({ ...p, lastName: e.target.value }))}
                    placeholder="Doe"
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="staff@example.com"
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Phone (Optional)</label>
                <input
                  type="tel"
                  value={inviteForm.phone}
                  onChange={(e) => setInviteForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+2348012345678"
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={inviteMutation.isPending || !inviteForm.firstName || !inviteForm.lastName || !inviteForm.email}
                className="w-full h-12 rounded-2xl bg-[#066CF4] text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-50 transition-all"
              >
                {inviteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
