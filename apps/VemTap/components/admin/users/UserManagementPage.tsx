'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { notify } from '@/lib/notify';
import { adminUsersApi } from '@/lib/api/admin';
import { Search, UserPlus, Edit2, Lock, Ban, Loader2, RefreshCw, CheckCircle, Trash2 } from 'lucide-react';
const DEFAULT_PAGE_SIZE = 10;


interface AdminUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    status: string;
    lastActive: string | null;
    createdAt: string;
    phone?: string;
}

type UserManagementPageProps = {
    title: string;
    description: string;
    roleFilter?: string | string[];
    hideRoleFilter?: boolean;
};

export default function UserManagementPage({
    title,
    description,
    roleFilter,
    hideRoleFilter = false,
}: UserManagementPageProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverStats, setServerStats] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'suspend' | 'activate' | 'delete' | 'reset_password';
        user: AdminUser | null;
    }>({ isOpen: false, type: 'suspend', user: null });
    const [confirmReason, setConfirmReason] = useState('');


    const normalizeRole = (role?: string) => (role || '').toLowerCase().replace(/\s+/g, '_');

    const scopedRoles = useMemo(() => {
        if (!roleFilter) return null;
        return Array.isArray(roleFilter) ? roleFilter : [roleFilter];
    }, [roleFilter]);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await adminUsersApi.getAll({
                search: searchQuery || undefined,
                role: typeof roleFilter === 'string' ? normalizeRole(roleFilter) : (filterRole ? normalizeRole(filterRole) : undefined),
                status: filterStatus || undefined,
                limit: 1000,
            });

            const userList = Array.isArray(response) ? response : (response.data || response.users || []);

            const mappedUsers = userList.map((u: any) => ({
                ...u,
                firstName: u.firstName || (u.name ? u.name.split(' ')[0] : ''),
                lastName: u.lastName || (u.name ? u.name.split(' ').slice(1).join(' ') : ''),
                lastActive: u.lastActive || (u.lastLogin && u.lastLogin !== 'Never' ? u.lastLogin : null),
                createdAt: u.createdAt || u.joined || new Date().toISOString(),
            }));

            const scopedUsers = scopedRoles
                ? mappedUsers.filter((u: any) => {
                    const role = normalizeRole(u.role);
                    return scopedRoles.some((allowedRole) => {
                        const normalizedAllowed = normalizeRole(allowedRole);
                        if (normalizedAllowed === 'owner') {
                            return role === 'owner' || role === 'business_owner';
                        }
                        return role === normalizedAllowed;
                    });
                })
                : mappedUsers;

            setUsers(scopedUsers);
            if (response.stats) setServerStats(response.stats);
        } catch (error: any) {
            notify.error(error.message || 'Failed to load users');
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, filterRole, filterStatus, roleFilter, scopedRoles]);

    useEffect(() => {
        const debounce = setTimeout(() => fetchUsers(), 400);
        return () => clearTimeout(debounce);
    }, [fetchUsers]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterRole, filterStatus, roleFilter]);

    const totalPages = Math.max(1, Math.ceil(users.length / pageSize));
    const paginatedUsers = users.slice((currentPage - 1) * pageSize, currentPage * pageSize);


    const scopedStats = [
        { label: `${title}`, value: users.length, icon: 'people', color: 'blue' },
        { label: 'Active', value: users.filter(u => normalizeRole(u.status) === 'active').length, icon: 'check_circle', color: 'green' },
        { label: 'Invited', value: users.filter(u => normalizeRole(u.status) === 'invited').length, icon: 'mail', color: 'yellow' },
        { label: 'Suspended', value: users.filter(u => normalizeRole(u.status) === 'suspended').length, icon: 'block', color: 'red' },
    ];

    const defaultStats = [
        { label: 'Total Users', value: serverStats?.total ?? users.length, icon: 'people', color: 'blue' },
        { label: 'Owners', value: serverStats?.owners ?? users.filter(u => normalizeRole(u.role).includes('owner')).length, icon: 'store', color: 'purple' },
        { label: 'Customers', value: serverStats?.customers ?? users.filter(u => normalizeRole(u.role) === 'customer').length, icon: 'person', color: 'green' },
        { label: 'Staff', value: serverStats?.staff ?? users.filter(u => normalizeRole(u.role) === 'staff' || normalizeRole(u.role) === 'manager').length, icon: 'badge', color: 'orange' },
    ];


    const stats = scopedRoles ? scopedStats : defaultStats;

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const fd = new FormData(e.currentTarget);
        const fullName = fd.get('firstName') as string;
        const nameParts = fullName.trim().split(' ');
        const payload = {
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || 'User',
            email: fd.get('email') as string,
            role: fd.get('role') as string,
            status: fd.get('status') as string,
            password: (fd.get('password') as string) || 'Vemtap@123',
        };
        try {
            if (selectedUser) {
                await adminUsersApi.update(selectedUser.id, payload);
                notify.success('User updated successfully');
            } else {
                await adminUsersApi.create(payload);
                notify.success('User created successfully');
            }
            setIsModalOpen(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (err: any) {
            notify.error(err.message || 'Operation failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const executeAction = async () => {
        if (!confirmModal.user) return;
        setIsSubmitting(true);
        try {
            switch (confirmModal.type) {
                case 'suspend':
                    await adminUsersApi.suspend(confirmModal.user.id);
                    notify.success('Account suspended');
                    break;
                case 'activate':
                    await adminUsersApi.activate(confirmModal.user.id);
                    notify.success('Account activated');
                    break;
                case 'delete':
                    await adminUsersApi.delete(confirmModal.user.id);
                    notify.success('Account deleted permanently');
                    break;
                case 'reset_password':
                    await adminUsersApi.resetPassword(confirmModal.user.email);
                    notify.success(`Password reset link sent to ${confirmModal.user.email}`);
                    break;
            }
            fetchUsers();
            setConfirmModal({ isOpen: false, type: 'suspend', user: null });
            setConfirmReason('');
        } catch (err: any) {
            notify.error(err.message || 'Operation failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSuspend = (user: AdminUser) => {
        setConfirmModal({ isOpen: true, type: 'suspend', user });
    };

    const handleActivate = (user: AdminUser) => {
        setConfirmModal({ isOpen: true, type: 'activate', user });
    };

    const handleDelete = (user: AdminUser) => {
        setConfirmModal({ isOpen: true, type: 'delete', user });
    };

    const handleResetPassword = (user: AdminUser) => {
        setConfirmModal({ isOpen: true, type: 'reset_password', user });
    };

    const getRoleBadge = (role: string) => {
        const r = normalizeRole(role);
        if (r === 'admin') return 'bg-red-50 text-red-600';
        if (r === 'owner' || r === 'business_owner') return 'bg-purple-50 text-purple-600';
        if (r === 'manager') return 'bg-blue-50 text-blue-600';
        if (r === 'staff') return 'bg-orange-50 text-orange-600';
        if (r === 'customer') return 'bg-green-50 text-green-600';
        return 'bg-gray-100 text-gray-500';
    };


    const getStatusBadge = (status: string) => {
        const s = status?.toLowerCase();
        const map: Record<string, string> = {
            active: 'bg-green-50 text-green-600',
            invited: 'bg-yellow-50 text-yellow-600',
            pending: 'bg-yellow-50 text-yellow-600',
            suspended: 'bg-red-50 text-red-600',
            inactive: 'bg-gray-100 text-gray-500',
        };
        return map[s] || 'bg-gray-100 text-gray-500';
    };

    const sectionOptions = [
        { label: 'All Users', value: '/admin/users' },
        { label: 'Businesses', value: '/admin/users/business' },
        { label: 'Customers', value: '/admin/users/customers' },
        { label: 'Agents', value: '/admin/users/agents' },
    ];

    const currentSection = sectionOptions.find((opt) => pathname?.startsWith(opt.value))?.value || '/admin/users';

    return (
        <div className="p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">User Management</p>
                    <h1 className="text-3xl font-display font-bold text-text-main mb-1">{title}</h1>
                    <p className="text-text-secondary font-medium text-sm">{description}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <select
                        value={currentSection}
                        onChange={(e) => router.push(e.target.value)}
                        className="h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        {sectionOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <button onClick={fetchUsers} className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors" title="Refresh">
                        <RefreshCw size={18} className="text-text-secondary" />
                    </button>
                    <button
                        onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}
                        className="px-5 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95"
                    >
                        <UserPlus size={18} />
                        Add User
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color === 'green' ? 'bg-green-50 text-green-600' : stat.color === 'purple' ? 'bg-purple-50 text-purple-600' : stat.color === 'orange' ? 'bg-orange-50 text-orange-600' : stat.color === 'red' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                <span className="material-icons-round text-lg">{stat.icon}</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary">{stat.label}</p>
                                <p className="text-2xl font-display font-bold text-text-main">{isLoading ? '—' : stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                        />
                    </div>
                    {!hideRoleFilter && !scopedRoles && (
                        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20">
                            <option value="">All Roles</option>
                            <option value="Admin">Admin</option>
                            <option value="Owner">Owner</option>
                            <option value="Manager">Manager</option>
                            <option value="Staff">Staff</option>
                            <option value="Customer">Customer</option>
                        </select>
                    )}
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Invited">Invited</option>
                        <option value="Pending">Pending</option>
                        <option value="Suspended">Suspended</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">User</th>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Contact</th>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Role</th>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Status</th>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Last Active</th>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Joined</th>
                                <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center">
                                        <Loader2 className="animate-spin mx-auto text-primary" size={32} />
                                        <p className="text-text-secondary text-sm mt-3 font-bold">Fetching users...</p>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center text-text-secondary text-sm font-medium">No users found.</td>
                                </tr>
                            ) : (
                                paginatedUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                                                    <span className="material-icons-round text-primary text-sm group-hover:text-white">person</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-text-main">
                                                        {user.firstName || user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email.split('@')[0]}
                                                    </p>
                                                    <p className="text-text-secondary text-xs font-medium">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-text-secondary font-medium">
                                            {user.phone || 'No phone'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getRoleBadge(user.role)}`}>
                                                {user.role}
                                            </span>

                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusBadge(user.status)}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-text-secondary font-medium">
                                            {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-text-secondary font-medium">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => { setSelectedUser(user); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Edit">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleResetPassword(user)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Reset Password">
                                                    <Lock size={16} />
                                                </button>
                                                {(user.status?.toLowerCase() === 'active' || user.status?.toLowerCase() === 'pending' || user.status?.toLowerCase() === 'invited') ? (
                                                    <button onClick={() => handleSuspend(user)} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all" title="Suspend">
                                                        <Ban size={16} />
                                                    </button>
                                                ) : user.status?.toLowerCase() === 'suspended' ? (
                                                    <button onClick={() => handleActivate(user)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all" title="Activate">
                                                        <CheckCircle size={16} />
                                                    </button>
                                                ) : null}
                                                <button onClick={() => handleDelete(user)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Permanently Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    <p className="text-xs text-text-secondary font-black uppercase tracking-widest">
                        {isLoading ? 'Loading...' : `${users.length} user${users.length !== 1 ? 's' : ''} found`}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-bold disabled:opacity-40"
                        >
                            Prev
                        </button>
                        {users.length > DEFAULT_PAGE_SIZE && pageSize === DEFAULT_PAGE_SIZE && (
                            <button
                                onClick={() => {
                                    setPageSize(users.length);
                                    setCurrentPage(1);
                                }}
                                className="h-8 px-3 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
                            >
                                Show All ({users.length})
                            </button>
                        )}
                        {pageSize > DEFAULT_PAGE_SIZE && (
                            <button
                                onClick={() => {
                                    setPageSize(DEFAULT_PAGE_SIZE);
                                    setCurrentPage(1);
                                }}
                                className="h-8 px-3 rounded-lg bg-gray-100 text-text-secondary text-xs font-bold hover:bg-gray-200 transition-colors"
                            >
                                Show Less
                            </button>
                        )}

                        <span className="text-xs font-bold text-text-secondary">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-bold disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => { setIsModalOpen(false); setSelectedUser(null); }} />
                    <div className="relative w-full max-w-lg bg-white rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center justify-between mb-7">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-text-main">{selectedUser ? 'Edit User' : 'Create User'}</h2>
                                <p className="text-sm text-text-secondary font-medium mt-1">{selectedUser ? 'Modify account permissions' : 'Onboard a new user to the platform'}</p>
                            </div>
                            <button onClick={() => { setIsModalOpen(false); setSelectedUser(null); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <span className="material-icons-round text-gray-400">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleFormSubmit} className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Full Name</label>
                                <input name="firstName" defaultValue={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}`.trim() : ''} required placeholder="John Doe" className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Email Address</label>
                                <input name="email" type="email" defaultValue={selectedUser?.email} required placeholder="john@example.com" className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all" />
                            </div>
                            {!selectedUser && (
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Password</label>
                                    <input name="password" type="password" placeholder="Min. 8 characters" className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all" />
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Role</label>
                                    <select name="role" defaultValue={selectedUser?.role || (scopedRoles?.[0] ?? 'Customer')} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all">
                                        <option value="Admin">Admin</option>
                                        <option value="Owner">Owner</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Staff">Staff</option>
                                        <option value="Customer">Customer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Status</label>
                                    <select name="status" defaultValue={selectedUser?.status || 'Active'} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all">
                                        <option value="Active">Active</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Suspended">Suspended</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setIsModalOpen(false); setSelectedUser(null); }} className="flex-1 h-12 bg-gray-100 text-text-secondary font-bold rounded-xl hover:bg-gray-200 transition-all text-sm">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm active:scale-95 disabled:opacity-70">
                                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                    {selectedUser ? 'Save Changes' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} />
                    <div className="relative w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${confirmModal.type === 'delete' ? 'bg-red-50 text-red-600' :
                                confirmModal.type === 'suspend' ? 'bg-orange-50 text-orange-600' :
                                    confirmModal.type === 'activate' ? 'bg-green-50 text-green-600' :
                                        'bg-blue-50 text-blue-600'
                            }`}>
                            <span className="material-icons-round text-3xl">
                                {confirmModal.type === 'delete' ? 'delete_forever' :
                                    confirmModal.type === 'suspend' ? 'block' :
                                        confirmModal.type === 'activate' ? 'check_circle' :
                                            'lock_reset'}
                            </span>
                        </div>

                        <h3 className="text-xl font-display font-bold text-text-main mb-2">
                            {confirmModal.type === 'delete' && 'Delete Account'}
                            {confirmModal.type === 'suspend' && 'Suspend Account'}
                            {confirmModal.type === 'activate' && 'Activate Account'}
                            {confirmModal.type === 'reset_password' && 'Reset Password'}
                        </h3>
                        <p className="text-text-secondary font-medium text-sm mb-6">
                            {confirmModal.type === 'delete' && `Are you sure you want to permanently delete the account for ${confirmModal.user?.firstName} ${confirmModal.user?.lastName}? This action cannot be undone.`}
                            {confirmModal.type === 'suspend' && `Suspend account for ${confirmModal.user?.firstName} ${confirmModal.user?.lastName}? They will be logged out and restricted.`}
                            {confirmModal.type === 'activate' && `Reactivate account for ${confirmModal.user?.firstName} ${confirmModal.user?.lastName}?`}
                            {confirmModal.type === 'reset_password' && `Send a password reset link to ${confirmModal.user?.email}?`}
                        </p>

                        {(confirmModal.type === 'suspend' || confirmModal.type === 'delete') && (
                            <div className="mb-6">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Reason for {confirmModal.type}</label>
                                <textarea
                                    value={confirmReason}
                                    onChange={(e) => setConfirmReason(e.target.value)}
                                    placeholder="Please state the reason..."
                                    className="w-full h-24 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all resize-none"
                                    required={confirmModal.type === 'delete'}
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                                className="flex-1 h-12 bg-gray-100 text-text-secondary font-bold rounded-xl hover:bg-gray-200 transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeAction}
                                disabled={isSubmitting || (confirmModal.type === 'delete' && !confirmReason.trim())}
                                className={`flex-1 h-12 text-white font-bold rounded-xl transition-all shadow-lg text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${confirmModal.type === 'delete' ? 'bg-red-600 shadow-red-200' :
                                        confirmModal.type === 'suspend' ? 'bg-orange-600 shadow-orange-200' :
                                            confirmModal.type === 'activate' ? 'bg-green-600 shadow-green-200' :
                                                'bg-primary shadow-primary/20'
                                    }`}
                            >
                                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                Confirm Action
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
