'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { notify } from '@/lib/notify';
import { useAdminUsers, useAdminCreateUser, useAdminUpdateUser, useAdminDeleteUser } from '@/services/users/hooks';

export default function AdminUsersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    const { data, isLoading } = useAdminUsers({
        search: searchQuery,
        role: filterRole === 'all' ? undefined : filterRole,
        status: filterStatus === 'all' ? undefined : filterStatus,
        page
    });

    const createUserMutation = useAdminCreateUser();
    const updateUserMutation = useAdminUpdateUser();
    const deleteUserMutation = useAdminDeleteUser();

    const users = data?.items || [];
    const totalCount = data?.total || 0;

    const handleDelete = (id: string) => {
        const user = users.find((u: any) => u.id === id);
        if (window.confirm(`Are you sure you want to disable the account for ${user?.name}?`)) {
            deleteUserMutation.mutate(id, {
                onSuccess: () => notify.success(`Account for ${user?.name} has been removed.`),
                onError: () => notify.error('Failed to delete user')
            });
        }
    };

    const handlePasswordReset = (email: string) => {
        notify.success(`Password reset link sent to ${email}`);
    };

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const uiRole = formData.get('role') as string;

        let mappedRole = 'staff';
        if (uiRole === 'Admin') mappedRole = 'admin';
        else if (uiRole === 'Business Owner') mappedRole = 'owner';
        else if (uiRole === 'Customer') mappedRole = 'customer';
        else if (uiRole === 'Staff') mappedRole = 'staff';

        const userData = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            role: mappedRole,
            status: formData.get('status') as string,
            password: formData.get('password') as string || undefined,
        };

        if (selectedUser) {
            updateUserMutation.mutate({ id: selectedUser.id, updates: userData }, {
                onSuccess: () => {
                    notify.success('User updated successfully');
                    setIsAddModalOpen(false);
                    setSelectedUser(null);
                },
                onError: () => notify.error('Failed to update user')
            });
        } else {
            createUserMutation.mutate(userData, {
                onSuccess: () => {
                    notify.success('New user created successfully');
                    setIsAddModalOpen(false);
                },
                onError: () => notify.error('Failed to create user')
            });
        }
    };

    const stats = [
        { label: 'Total Users', value: totalCount.toString(), icon: 'people', color: 'blue' },
        { label: 'Business Owners', value: (data?.stats?.owners || 0).toString(), icon: 'store', color: 'purple' },
        { label: 'Customers', value: (data?.stats?.customers || 0).toString(), icon: 'person', color: 'green' },
        { label: 'Staff Members', value: (data?.stats?.staff || 0).toString(), icon: 'badge', color: 'orange' },
    ];

    const filteredUsers = users; // Server side filtered

    return (
        <div className="p-8">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-text-main mb-2">User Management</h1>
                    <p className="text-text-secondary font-medium">Manage and monitor all platform users</p>
                </div>
                <button
                    onClick={() => { setSelectedUser(null); setIsAddModalOpen(true); }}
                    className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95"
                >
                    <span className="material-icons-round">person_add</span>
                    Add User
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color === 'green' ? 'bg-green-50 text-green-600' :
                                stat.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                                    stat.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                                        'bg-blue-50 text-blue-600'
                                }`}>
                                <span className="material-icons-round text-xl">{stat.icon}</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">{stat.label}</p>
                                <p className="text-2xl font-display font-bold text-text-main">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Search by name, email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-inner"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="business_owner">Business Owner</option>
                            <option value="staff">Staff</option>
                            <option value="customer">Customer</option>
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="suspended">Suspended</option>
                        </select>
                        <button
                            onClick={() => notify.info('Preparing user data export...')}
                            className="h-12 px-6 bg-white border border-gray-200 text-text-main font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                            <span className="material-icons-round text-lg">file_download</span>
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-text-secondary">
                                    <input type="checkbox" className="rounded accent-primary" />
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-text-secondary">User</th>
                                <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-text-secondary">Role</th>
                                <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-text-secondary">Status</th>
                                <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-text-secondary">Last Login</th>
                                <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-text-secondary">Joined</th>
                                <th className="text-right py-4 px-6 text-xs font-black uppercase tracking-wider text-text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-text-secondary font-medium">
                                        No users found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="py-4 px-6">
                                            <input type="checkbox" className="rounded accent-primary" />
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                                                    <span className="material-icons-round text-primary text-sm group-hover:text-white">person</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-text-main">{user.name}</p>
                                                    <p className="text-text-secondary text-xs font-medium">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${user.role === 'Admin' ? 'bg-red-50 text-red-600' :
                                                user.role === 'Business Owner' ? 'bg-purple-50 text-purple-600' :
                                                    user.role === 'Staff' ? 'bg-orange-50 text-orange-600' :
                                                        'bg-green-50 text-green-600'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${user.status === 'active' ? 'bg-green-50 text-green-600' :
                                                user.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-50 text-red-600'
                                                }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-text-main font-bold">{user.lastLogin}</td>
                                        <td className="py-4 px-6 text-sm text-text-secondary font-bold">{user.joined}</td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setIsAddModalOpen(true);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                                    title="Edit User"
                                                >
                                                    <span className="material-icons-round text-lg">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handlePasswordReset(user.email)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Reset Password"
                                                >
                                                    <span className="material-icons-round text-lg">lock_reset</span>
                                                </button>
                                                <button
                                                    onClick={() => user.id && handleDelete(user.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Disable Account"
                                                >
                                                    <span className="material-icons-round text-lg">no_accounts</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    <p className="text-xs text-text-secondary font-black uppercase tracking-widest">
                        Showing {filteredUsers.length} of {users.length} users
                    </p>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-black uppercase tracking-widest text-text-secondary hover:bg-white transition-all">
                            Previous
                        </button>
                        <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-black uppercase tracking-widest text-text-main hover:border-primary/50 transition-all">
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Add/Edit User Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => { setIsAddModalOpen(false); setSelectedUser(null); }}></div>
                    <div className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-text-main">
                                    {selectedUser ? 'Edit User' : 'Create New User'}
                                </h2>
                                <p className="text-sm text-text-secondary font-medium mt-1">
                                    {selectedUser ? 'Modify user permissions and details' : 'Manually onboard a new user to the platform'}
                                </p>
                            </div>
                            <button onClick={() => { setIsAddModalOpen(false); setSelectedUser(null); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <span className="material-icons-round text-gray-400">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">Full Name</label>
                                <div className="relative">
                                    <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">person</span>
                                    <input
                                        name="name"
                                        defaultValue={selectedUser?.name}
                                        required
                                        className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 focus:bg-white transition-all font-bold text-sm"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">Email Address</label>
                                <div className="relative">
                                    <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">mail</span>
                                    <input
                                        name="email"
                                        defaultValue={selectedUser?.email}
                                        type="email"
                                        required
                                        className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 focus:bg-white transition-all font-bold text-sm"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            {!selectedUser && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">Password</label>
                                    <div className="relative">
                                        <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">lock</span>
                                        <input
                                            name="password"
                                            type="password"
                                            required
                                            className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 focus:bg-white transition-all font-bold text-sm"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 ml-1">The user will use this password to log in.</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">Role</label>
                                    <select
                                        name="role"
                                        defaultValue={selectedUser?.role}
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 focus:bg-white transition-all font-bold text-sm"
                                    >
                                        <option value="Admin">Admin</option>
                                        <option value="Business Owner">Business Owner</option>
                                        <option value="Staff">Staff</option>
                                        <option value="Customer">Customer</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">Status</label>
                                    <select
                                        name="status"
                                        defaultValue={selectedUser?.status}
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 focus:bg-white transition-all font-bold text-sm"
                                    >
                                        <option value="active">Active</option>
                                        <option value="pending">Pending</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => { setIsAddModalOpen(false); setSelectedUser(null); }}
                                    className="flex-1 h-14 bg-gray-100 text-text-secondary font-bold rounded-2xl hover:bg-gray-200 transition-all text-sm active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-2 h-14 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <span className="material-icons-round">{selectedUser ? 'save' : 'person_add'}</span>
                                    {selectedUser ? 'Update User' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
