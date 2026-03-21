'use client';

import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUsersApi } from '@/lib/api/admin';
import { notify } from '@/lib/notify';
import { User, Shield, Search, Loader2, UserPlus, Link2, Mail, AlertCircle, Check } from 'lucide-react';

export default function AdminAgentsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteForm, setInviteForm] = useState({ name: '', email: '', phone: '' });
    const [invites, setInvites] = useState<Array<{ id: string; name: string; email: string; phone: string; status: 'Pending' | 'Sent' | 'Accepted'; createdAt: string }>>([]);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        agentId: string;
        agentName: string;
        currentPermissions: string[];
    }>({
        isOpen: false,
        agentId: '',
        agentName: '',
        currentPermissions: []
    });
    const queryClient = useQueryClient();

    const { data: userData, isLoading } = useQuery({
        queryKey: ['admin-agents'],
        queryFn: () => adminUsersApi.getAll({ limit: 100 }),
    });

    const toggleAgentMutation = useMutation({
        mutationFn: ({ id, permissions }: { id: string, permissions: string[] }) =>
            adminUsersApi.update(id, { permissions }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
        },
        onError: (err: any) => {
            notify.error(err.message || 'Failed to update agent status');
        }
    });

    const staffList = (userData?.data || []).filter((u: any) => u.role !== 'Customer');

    const toggleAgentStatus = (id: string, currentPermissions: string[], name: string) => {
        const isAgent = currentPermissions.includes('agent');
        const newPermissions = isAgent
            ? currentPermissions.filter(p => p !== 'agent')
            : [...currentPermissions, 'agent'];

        toggleAgentMutation.mutate(
            { id, permissions: newPermissions },
            {
                onSuccess: () => {
                    notify.success(`${name} is ${!isAgent ? 'now an active' : 'no longer a'} support agent.`);
                }
            }
        );
    };

    const filteredStaff = staffList.filter((s: any) =>
        (s.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (s.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    const inviteLink = useMemo(() => {
        if (!inviteForm.email) return '';
        const token = Math.random().toString(36).slice(2, 10);
        return `${window.location.origin}/get-started?role=agent&invite=${token}`;
    }, [inviteForm.email]);

    const handleInvite = () => {
        if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
            notify.error('Name and email are required');
            return;
        }
        const newInvite = {
            id: `inv-${Date.now()}`,
            name: inviteForm.name.trim(),
            email: inviteForm.email.trim(),
            phone: inviteForm.phone.trim(),
            status: 'Sent' as const,
            createdAt: new Date().toLocaleString(),
        };
        setInvites((prev) => [newInvite, ...prev]);
        setInviteForm({ name: '', email: '', phone: '' });
        setIsInviteOpen(false);
        notify.success('Signup link generated and ready to send');
    };

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-display font-bold text-text-main tracking-tight">Agent Management</h1>
                    <p className="text-text-secondary font-medium mt-1">Assign and monitor support agents across the platform</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsInviteOpen(true)}
                        className="px-5 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95"
                    >
                        <UserPlus size={18} />
                        Invite Agent
                    </button>
                </div>
            </div>

            {/* Invite List */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-8">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Pending Invites</p>
                        <p className="text-sm text-text-secondary font-medium">Track agent signup links and statuses</p>
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-text-secondary">
                        {invites.length} Invite{invites.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50">
                            <tr className="text-left text-[10px] font-black uppercase tracking-widest text-text-secondary border-b border-gray-100">
                                <th className="px-6 py-4">Agent</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {invites.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-text-secondary font-bold">No invites yet</td>
                                </tr>
                            ) : (
                                invites.map((invite) => (
                                    <tr key={invite.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-text-main text-sm">{invite.name}</p>
                                            <p className="text-xs text-text-secondary">{invite.email}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-text-secondary">{invite.phone || '—'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600">
                                                {invite.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-secondary">{invite.createdAt}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search staff by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-4 text-sm font-bold text-text-secondary">
                        <span className="flex items-center gap-1.5"><Shield size={16} className="text-primary" /> {staffList.filter((s: any) => s.permissions?.includes('agent')).length} Active Agents</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50">
                            <tr className="text-left text-[10px] font-black uppercase tracking-widest text-text-secondary border-b border-gray-100">
                                <th className="px-6 py-4">Staff Member</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Chats</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-8 h-24 bg-gray-50/20"></td>
                                    </tr>
                                ))
                            ) : filteredStaff.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-text-secondary font-bold">
                                        No staff members found
                                    </td>
                                </tr>
                            ) : (
                                filteredStaff.map((person: any) => {
                                    const isAgent = person.permissions?.includes('agent');
                                    return (
                                        <tr key={person.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-text-main text-sm">{person.name}</p>
                                                        <p className="text-xs text-text-secondary">{person.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">{person.role}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${person.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                                                    }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${person.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                    {person.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-text-main">0 Active</p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        if (isAgent) {
                                                            toggleAgentStatus(person.id, person.permissions || [], person.name);
                                                        } else {
                                                            setConfirmModal({
                                                                isOpen: true,
                                                                agentId: person.id,
                                                                agentName: person.name,
                                                                currentPermissions: person.permissions || []
                                                            });
                                                        }
                                                    }}
                                                    disabled={toggleAgentMutation.isPending}
                                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${isAgent
                                                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                                                        }`}
                                                >
                                                    {toggleAgentMutation.isPending && (toggleAgentMutation.variables as any)?.id === person.id ? (
                                                        <Loader2 size={14} className="animate-spin mx-auto" />
                                                    ) : (
                                                        isAgent ? 'Revoke Access' : 'Assign as Agent'
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invite Modal */}
            {isInviteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsInviteOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-text-main">Invite Agent</h2>
                                <p className="text-sm text-text-secondary font-medium mt-1">Send a signup link for the support dashboard</p>
                            </div>
                            <button onClick={() => setIsInviteOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <span className="material-icons-round text-gray-400">close</span>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Agent Name</label>
                                <input
                                    value={inviteForm.name}
                                    onChange={(e) => setInviteForm((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="Amara Obi"
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={inviteForm.email}
                                    onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                                    placeholder="agent@vemtap.com"
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Phone Number</label>
                                <input
                                    value={inviteForm.phone}
                                    onChange={(e) => setInviteForm((prev) => ({ ...prev, phone: e.target.value }))}
                                    placeholder="+234 801 234 5678"
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Signup Link</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        readOnly
                                        value={inviteLink || 'Enter email to generate link'}
                                        className="flex-1 h-10 px-3 bg-white border border-gray-200 rounded-lg text-xs font-mono"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => inviteLink && navigator.clipboard.writeText(inviteLink)}
                                        className="h-10 px-3 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-1"
                                    >
                                        <Link2 size={14} />
                                        Copy
                                    </button>
                                </div>
                                <p className="text-[10px] text-text-secondary mt-2">Send this link to the agent to complete signup.</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsInviteOpen(false)}
                                    className="flex-1 h-12 bg-gray-100 text-text-secondary font-bold rounded-xl hover:bg-gray-200 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleInvite}
                                    className="flex-1 h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm active:scale-95"
                                >
                                    <Mail size={16} />
                                    Send Invite
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} />
                    <div className="relative w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300 text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Shield className="text-primary" size={32} />
                        </div>
                        <h2 className="text-2xl font-display font-bold text-text-main mb-2">Assign Agent</h2>
                        <p className="text-sm text-text-secondary font-medium mb-8">
                            Are you sure you want to assign <span className="font-bold text-text-main">{confirmModal.agentName}</span> as a support agent? They will have access to the agent dashboard and active chats.
                        </p>
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                className="flex-1 h-12 bg-gray-100 text-text-secondary font-bold rounded-xl hover:bg-gray-200 transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    toggleAgentStatus(confirmModal.agentId, confirmModal.currentPermissions, confirmModal.agentName);
                                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                }}
                                className="flex-1 h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm active:scale-95"
                            >
                                <Check size={18} />
                                Confirm Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
