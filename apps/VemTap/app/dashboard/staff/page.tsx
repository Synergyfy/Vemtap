'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import { useStaff, useInviteStaff, useUpdateStaff, useRemoveStaff } from '@/services/users/hooks';
import { StaffMember, UserRole } from '@/services/users/types';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import { UserPlus, Shield, Edit3, Trash2, Eye, MessageSquare, BarChart3, Users as UsersIcon, Settings as SettingsIcon } from 'lucide-react';
import Modal from '@/components/ui/Modal';

const PERMISSIONS = [
    { id: 'dashboard', label: 'Dashboard', icon: Eye },
    { id: 'visitors', label: 'Visitors', icon: UsersIcon },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'staff', label: 'Team', icon: UsersIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function StaffManagementPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [staffToDelete, setStaffToDelete] = useState<{ id: string, name: string } | null>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['dashboard', 'visitors']);

    const { data: staffMembers, isLoading } = useStaff();
    const inviteMutation = useInviteStaff();
    const updateMutation = useUpdateStaff();
    const removeMutation = useRemoveStaff();

    React.useEffect(() => {
        if (!isLoading && user && user.role !== 'owner') {
            router.push('/dashboard');
        }
    }, [user, isLoading, router]);

    const handleInviteStaff = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const roleValue = formData.get('role') as string;
        const role: UserRole = roleValue === 'Manager' ? 'manager' : 'staff';

        const staffData = {
            firstName: formData.get('firstName') as string,
            lastName: formData.get('lastName') as string,
            email: formData.get('email') as string,
            role,
            businessId: user?.businessId || '',
            branchId: user?.branchId || '',
            permissions: selectedPermissions,
        };

        inviteMutation.mutate(staffData, {
            onSuccess: () => {
                setIsInviteModalOpen(false);
                setSelectedPermissions(['dashboard', 'visitors']);
                toast.success('Staff member invited successfully');
            },
            onError: () => {
                toast.error('Failed to invite staff member');
            }
        });
    };

    const handleUpdateRole = (id: string, role: string) => {
        const roleMap: Record<string, UserRole> = {
            'Owner': 'owner',
            'Manager': 'manager',
            'Staff': 'staff',
        };
        updateMutation.mutate({ id, updates: { role: roleMap[role] || 'staff' } }, {
            onSuccess: () => {
                toast.success('Staff role updated');
            }
        });
    };

    const confirmDelete = () => {
        if (staffToDelete) {
            removeMutation.mutate(staffToDelete.id, {
                onSuccess: () => {
                    setStaffToDelete(null);
                    toast.success('Staff member removed');
                }
            });
        }
    };

    const columns: Column<StaffMember>[] = [
        {
            header: 'Staff Member',
            accessor: (item: StaffMember) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase border border-primary/20">
                        {item.firstName[0]}{item.lastName[0]}
                    </div>
                    <div>
                        <p className="font-bold text-text-main leading-none mb-1">{item.firstName} {item.lastName}</p>
                        <p className="text-xs text-text-secondary font-medium">{item.email}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Role',
            accessor: (item: StaffMember) => (
                <div className="flex items-center gap-2">
                    <Shield size={14} className={item.role === 'owner' ? 'text-primary' : 'text-gray-400'} />
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${item.role === 'owner' ? 'bg-primary/10 text-primary' :
                        item.role === 'manager' ? 'bg-blue-50 text-blue-600' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                        {item.role}
                    </span>
                </div>
            )
        },
        {
            header: 'Status',
            accessor: (item: StaffMember) => (
                <div className="flex items-center gap-2">
                    <div className={`size-1.5 rounded-full ${item.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm font-bold text-text-main capitalize">{item.status}</span>
                </div>
            )
        },
        {
            header: 'Actions',
            accessor: (item: StaffMember) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setEditingStaff(item)}
                        className="p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                        title="Change Role"
                    >
                        <Edit3 size={18} />
                    </button>
                    <button
                        onClick={() => setStaffToDelete({ id: item.id, name: `${item.firstName} ${item.lastName}` })}
                        className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Remove Staff"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <>
            <div className="p-8">
                <PageHeader
                    title="Staff Management"
                    description="Invite and manage your team members and their permissions"
                    actions={
                        <button
                            onClick={() => setIsInviteModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-all text-sm shadow-lg shadow-primary/20 active:scale-95"
                        >
                            <UserPlus size={18} />
                            Invite Staff
                        </button>
                    }
                />

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    {isLoading ? (
                        <div className="p-20 flex justify-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <DataTable columns={columns} data={staffMembers || []} />
                    )}
                </div>

                <div className="mt-8 bg-linear-to-r from-primary/5 to-transparent border border-primary/10 rounded-2xl p-6">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Shield className="text-primary" size={24} />
                        </div>
                        <div>
                            <h4 className="font-display font-bold text-text-main mb-2 text-lg">Permissions Overview</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-primary uppercase tracking-tighter">Business Owner</p>
                                    <p className="text-xs text-text-secondary leading-relaxed font-medium">Full administrative access, billing, and settings control.</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-blue-600 uppercase tracking-tighter">Manager</p>
                                    <p className="text-xs text-text-secondary leading-relaxed font-medium">Manage visitors, issue rewards, and view detailed analytics.</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-gray-600 uppercase tracking-tighter">Staff Member</p>
                                    <p className="text-xs text-text-secondary leading-relaxed font-medium">Restricted to visitor check-ins and basic loyalty actions.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invite Modal */}
            <Modal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                title="Invite Staff Member"
                description="Add a new teammate to your business and define their access."
                size="lg"
            >
                <form onSubmit={handleInviteStaff} className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">First Name</label>
                            <input name="firstName" required className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all font-bold text-sm" placeholder="e.g. John" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Last Name</label>
                            <input name="lastName" required className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all font-bold text-sm" placeholder="e.g. Doe" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Job Title</label>
                            <input name="jobTitle" className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all font-bold text-sm" placeholder="e.g. Head of Sales" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Email Address</label>
                            <input name="email" type="email" required className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all font-bold text-sm" placeholder="john@example.com" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Access Level</label>
                        <select name="role" className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all font-bold text-sm appearance-none">
                            <option value="Staff">Staff Member (Limited Access)</option>
                            <option value="Manager">Manager (Full Dashboard)</option>
                        </select>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Module Access & Permissions</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {PERMISSIONS.map((p) => {
                                const Icon = p.icon;
                                const isSelected = selectedPermissions.includes(p.id);
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setSelectedPermissions(prev =>
                                            isSelected ? prev.filter(id => id !== p.id) : [...prev, p.id]
                                        )}
                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all group ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-50 hover:border-gray-100 bg-gray-50/50'}`}
                                    >
                                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-primary text-white' : 'bg-white text-text-secondary border border-gray-100'}`}>
                                            <Icon size={14} />
                                        </div>
                                        <span className={`text-[11px] font-bold ${isSelected ? 'text-primary' : 'text-text-secondary'}`}>{p.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsInviteModalOpen(false)} className="flex-1 h-14 border border-gray-100 text-text-main font-bold rounded-2xl hover:bg-gray-50 transition-all text-base active:scale-95">Cancel</button>
                        <button disabled={inviteMutation.isPending} className="flex-2 h-14 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 text-base">
                            {inviteMutation.isPending ? (<div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>) : (<><UserPlus size={20} />Send Invitation</>)}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Role Modal */}
            <Modal
                isOpen={!!editingStaff}
                onClose={() => setEditingStaff(null)}
                title="Edit Access"
                description={`Modify role for ${editingStaff?.firstName} ${editingStaff?.lastName}`}
                size="lg"
            >
                <div className="space-y-6 py-4">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Staff Role</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['Staff', 'Manager', 'Owner'].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => {
                                        if (editingStaff) {
                                            handleUpdateRole(editingStaff.id, role);
                                        }
                                    }}
                                    className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${editingStaff?.role === role.toLowerCase() ? 'border-primary bg-primary/5' : 'border-gray-50 hover:border-gray-100 bg-gray-50/50'}`}
                                >
                                    <Shield size={20} className={editingStaff?.role === role.toLowerCase() ? 'text-primary' : 'text-gray-300'} />
                                    <span className={`text-[11px] font-black uppercase mt-2 ${editingStaff?.role === role.toLowerCase() ? 'text-primary' : 'text-text-secondary'}`}>{role}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4">
                        <button onClick={() => setEditingStaff(null)} className="w-full h-14 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95 text-base">
                            Done
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!staffToDelete}
                onClose={() => setStaffToDelete(null)}
                title="Remove Staff Member"
                description={`Are you sure you want to remove ${staffToDelete?.name}? This action cannot be undone.`}
            >
                <div className="flex gap-3 py-4">
                    <button onClick={() => setStaffToDelete(null)} className="flex-1 h-12 border-2 border-primary/20 text-primary font-bold rounded-lg hover:bg-primary/5 hover:border-primary/30 transition-all text-sm">
                        Cancel
                    </button>
                    <button onClick={confirmDelete} disabled={removeMutation.isPending} className="flex-1 h-12 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 text-sm disabled:opacity-50">
                        {removeMutation.isPending ? 'Removing...' : 'Remove'}
                    </button>
                </div>
            </Modal>
        </>
    );
}
