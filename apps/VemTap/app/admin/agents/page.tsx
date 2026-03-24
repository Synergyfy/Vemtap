'use client';

import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUsersApi } from '@/lib/api/admin';
import { notify } from '@/lib/notify';
import { 
    User, Shield, Search, Loader2, UserPlus, Link2, Mail, AlertCircle, Check, X, 
    BarChart, Settings, MessageSquare, CreditCard, Nfc, Package, Gift, 
    Workflow, Eye, EyeOff, Activity, Home, Store, Users, ShieldCheck, FileText, Tag 
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { cn, suggestPassword } from '@/lib/utils';
import PasswordValidation from '@/components/shared/PasswordValidation';



const ADMIN_PERMISSIONS = [
    { id: 'admin:dashboard', label: 'Dashboard', icon: Home },
    { id: 'admin:businesses', label: 'Businesses', icon: Store },
    { id: 'admin:customers', label: 'Customers', icon: Users },
    { id: 'admin:agents', label: 'Agents Management', icon: ShieldCheck },
    { id: 'admin:devices', label: 'Devices', icon: Nfc },
    { id: 'admin:subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'admin:products', label: 'Products & Orders', icon: Package },
    { id: 'admin:analytics', label: 'Analytics', icon: BarChart },
    { id: 'admin:loyalty', label: 'Loyalty Control', icon: Gift },
    { id: 'admin:support', label: 'Support Tickets', icon: MessageSquare },
    { id: 'admin:forms', label: 'Form Approvals', icon: FileText },
    { id: 'admin:messaging', label: 'WhatsApp', icon: MessageSquare },
    { id: 'admin:flow-engine', label: 'Flow Engine', icon: Workflow },
    { id: 'admin:control-tower', label: 'Control Tower', icon: Eye },
    { id: 'admin:pricing', label: 'Pricing Plans', icon: Tag },
    { id: 'admin:health', label: 'System Health', icon: Activity },
    { id: 'admin:settings', label: 'Settings', icon: Settings },
];

export default function AdminAgentsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inviteForm, setInviteForm] = useState({ 
        name: '', 
        email: '', 
        phone: '', 
        password: suggestPassword(),
        permissions: ['admin:dashboard', 'admin:support'] as string[] 
    });
    const [invites, setInvites] = useState<Array<{ id: string; name: string; email: string; phone: string; status: 'Pending' | 'Sent' | 'Accepted'; createdAt: string }>>([]);
    const [editingAgent, setEditingAgent] = useState<{
        id: string;
        name: string;
        permissions: string[];
    } | null>(null);

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
        const isAgent = currentPermissions.some(p => p.startsWith('admin:')) || currentPermissions.includes('agent');
        
        if (isAgent) {
            // Revoke all admin permissions
            const newPermissions = currentPermissions.filter(p => !p.startsWith('admin:') && p !== 'agent');
            toggleAgentMutation.mutate(
                { id, permissions: newPermissions },
                {
                    onSuccess: () => {
                        notify.success(`${name} is no longer a support agent.`);
                    }
                }
            );
        } else {
            // Open permissions modal to assign initial permissions
            setEditingAgent({ id, name, permissions: ['admin:dashboard', 'admin:support'] });
        }
    };

    const filteredStaff = staffList.filter((s: any) =>
        (s.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (s.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    const handleInvite = async () => {
        if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
            notify.error('Name and email are required');
            return;
        }
        
        setIsSubmitting(true);
        try {
            const nameParts = inviteForm.name.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || '-';

            await adminUsersApi.create({
                firstName,
                lastName,
                email: inviteForm.email,
                password: inviteForm.password,
                role: 'Agent',
                status: 'Active',
                permissions: inviteForm.permissions
            });

            const newInvite = {
                id: `inv-${Date.now()}`,
                name: inviteForm.name.trim(),
                email: inviteForm.email.trim(),
                phone: inviteForm.phone.trim(),
                status: 'Accepted' as const,
                createdAt: new Date().toLocaleString(),
            };
            
            setInvites((prev) => [newInvite, ...prev]);
            setInviteForm({ 
                name: '', 
                email: '', 
                phone: '', 
                password: suggestPassword(),
                permissions: ['admin:dashboard', 'admin:support'] 
            });
            setIsInviteOpen(false);
            notify.success(`Agent ${inviteForm.name} created and activated!`);
            queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
        } catch (err: any) {
            notify.error(err.message || 'Failed to create agent');
        } finally {
            setIsSubmitting(false);
        }
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
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setEditingAgent({ id: person.id, name: person.name, permissions: person.permissions || [] })}
                                                        className="p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                                        title="Edit Permissions"
                                                    >
                                                        <Settings size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleAgentStatus(person.id, person.permissions || [], person.name)}
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
                                                </div>
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
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={inviteForm.name}
                                            onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                                            placeholder="e.g. John Smith"
                                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={inviteForm.email}
                                            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                            placeholder="john@company.com"
                                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Initial Permissions</label>
                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
                                        {ADMIN_PERMISSIONS.map((perm) => (
                                            <label
                                                key={perm.id}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                                                    inviteForm.permissions.includes(perm.id)
                                                        ? "bg-white border-primary shadow-sm"
                                                        : "bg-transparent border-transparent hover:bg-white/50"
                                                )}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={inviteForm.permissions.includes(perm.id)}
                                                    onChange={(e) => {
                                                        const newPerms = e.target.checked
                                                            ? [...inviteForm.permissions, perm.id]
                                                            : inviteForm.permissions.filter(p => p !== perm.id);
                                                        setInviteForm({ ...inviteForm, permissions: newPerms });
                                                    }}
                                                    className="hidden"
                                                />
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                    inviteForm.permissions.includes(perm.id)
                                                        ? "bg-primary text-white"
                                                        : "bg-gray-100 text-gray-400"
                                                )}>
                                                    <perm.icon size={16} />
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase tracking-tight",
                                                    inviteForm.permissions.includes(perm.id) ? "text-text-main" : "text-text-secondary"
                                                )}>
                                                    {perm.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={inviteForm.password}
                                        onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                                        className="w-full h-12 pl-4 pr-11 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all mb-2"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-6 -translate-y-1/2 text-gray-400 hover:text-text-main transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <PasswordValidation 
                                    password={inviteForm.password}
                                    onSuggest={(p) => setInviteForm({ ...inviteForm, password: p })}
                                    showAlways={true}
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
                            </div>

                            <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Immediate Access</p>
                                <p className="text-[10px] text-text-secondary">The agent account is created instantly. Give them their password to log in.</p>
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
                                    disabled={isSubmitting}
                                    className="flex-1 h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm active:scale-95 disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                                    Create Agent
                                </button>

                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Permissions Modal */}
            <Modal
                isOpen={!!editingAgent}
                onClose={() => setEditingAgent(null)}
                title="Manage Agent Permissions"
                description={`Define specific access areas for ${editingAgent?.name}`}
                size="lg"
            >
                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {ADMIN_PERMISSIONS.map((perm) => {
                            const Icon = perm.icon;
                            const isSelected = editingAgent?.permissions.includes(perm.id);
                            return (
                                <button
                                    key={perm.id}
                                    type="button"
                                    onClick={() => {
                                        if (editingAgent) {
                                            const newPerms = isSelected
                                                ? editingAgent.permissions.filter(p => p !== perm.id)
                                                : [...editingAgent.permissions, perm.id];
                                            setEditingAgent({ ...editingAgent, permissions: newPerms });
                                        }
                                    }}
                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all group ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-50 hover:border-gray-100 bg-gray-50/50'}`}
                                >
                                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-primary text-white' : 'bg-white text-text-secondary border border-gray-100'}`}>
                                        <Icon size={14} />
                                    </div>
                                    <span className={`text-[11px] font-bold ${isSelected ? 'text-primary' : 'text-text-secondary'}`}>{perm.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            onClick={() => setEditingAgent(null)}
                            className="flex-1 h-14 bg-gray-50 text-text-secondary font-bold rounded-2xl hover:bg-gray-100 transition-all text-base"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={toggleAgentMutation.isPending}
                            onClick={() => {
                                if (editingAgent) {
                                    toggleAgentMutation.mutate({
                                        id: editingAgent.id,
                                        permissions: editingAgent.permissions
                                    }, {
                                        onSuccess: () => {
                                            notify.success(`Permissions updated for ${editingAgent.name}`);
                                            setEditingAgent(null);
                                        }
                                    });
                                }
                            }}
                            className="flex-2 h-14 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 text-base disabled:opacity-50"
                        >
                            {toggleAgentMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : 'Save Permissions'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
