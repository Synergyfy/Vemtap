'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUsersApi } from '@/lib/api/admin';
import { notify } from '@/lib/notify';
import { User, Shield, CheckCircle, XCircle, Search, Filter, Loader2 } from 'lucide-react';

export default function AdminAgentsPage() {
    const [searchQuery, setSearchQuery] = useState('');
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
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-display font-bold text-text-main tracking-tight">Agent Management</h1>
                    <p className="text-text-secondary font-medium mt-1">Assign and monitor support agents across the platform</p>
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
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
