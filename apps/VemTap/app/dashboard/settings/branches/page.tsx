'use client';

import React, { useState, Suspense } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { Building2, Plus, MapPin, Phone, Mail, MoreVertical, Trash2, Edit2, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';

import { useBranches, useCreateBranch } from '@/services/branches/hooks';
import { Branch } from '@/services/branches/types';
import { Loader2 } from 'lucide-react';

function BranchesContent() {
    const { storeName } = useCustomerFlowStore();
    const { data: branchesData, isLoading } = useBranches();
    const createBranchMutation = useCreateBranch();

    const branches = branchesData || [];

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newBranch, setNewBranch] = useState<Partial<Branch>>({
        name: '',
        address: '',
        phone: '',
        isActive: true
    });

    const handleCreateBranch = () => {
        if (!newBranch.name || !newBranch.address) {
            toast.error('Please fill in required fields');
            return;
        }

        createBranchMutation.mutate({
            name: newBranch.name!,
            address: newBranch.address,
            phone: newBranch.phone,
        }, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                setNewBranch({ name: '', address: '', phone: '', isActive: true });
                toast.success('Branch added successfully');
            },
            onError: () => {
                toast.error('Failed to create branch');
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <PageHeader
                title="Business Branches"
                description="Manage multiple locations and outlets for your business."
                actions={
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm shadow-md shadow-primary/20"
                    >
                        <Plus size={18} />
                        Add New Branch
                    </button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                {branches.map((branch, i) => (
                    <div key={branch.id} className="bg-white rounded-3xl border border-gray-200 p-6 hover:shadow-xl transition-all group relative overflow-hidden">
                        {i === 0 && (
                            <div className="absolute top-0 right-0 px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-bl-2xl">
                                Main Location
                            </div>
                        )}

                        <div className="flex items-start justify-between mb-6">
                            <div className="size-14 rounded-2xl bg-gray-50 flex items-center justify-center text-text-secondary group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                <Building2 size={24} />
                            </div>
                            <button className="p-2 text-gray-400 hover:text-text-main transition-colors">
                                <MoreVertical size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xl font-display font-bold text-text-main group-hover:text-primary transition-colors">{branch.name}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`size-2 rounded-full ${branch.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{branch.isActive ? 'active' : 'inactive'}</span>
                                </div>
                            </div>

                            <div className="space-y-2.5 pt-4 border-t border-gray-50">
                                {branch.address && (
                                    <div className="flex items-center gap-3 text-text-secondary">
                                        <MapPin size={16} className="shrink-0" />
                                        <span className="text-xs font-medium">{branch.address}</span>
                                    </div>
                                )}
                                {branch.phone && (
                                    <div className="flex items-center gap-3 text-text-secondary">
                                        <Phone size={16} className="shrink-0" />
                                        <span className="text-xs font-medium">{branch.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-8 pt-4">
                            <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-100 text-[11px] font-bold text-text-secondary hover:bg-gray-50 transition-all">
                                <Edit2 size={14} />
                                Edit Details
                            </button>
                            <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 text-[11px] font-bold text-text-main hover:bg-gray-100 transition-all">
                                <ExternalLink size={14} />
                                View Dashboard
                            </button>
                        </div>
                    </div>
                ))}

                {/* Empty State / Add Branch Card */}
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 p-12 flex flex-col items-center justify-center text-center hover:bg-white hover:border-primary/20 transition-all group lg:min-h-[350px]"
                >
                    <div className="size-20 rounded-full bg-white border border-gray-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">     
                        <Plus size={32} className="text-gray-300 group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="text-lg font-display font-bold text-text-main mb-2">Expand Your Reach</h3>
                    <p className="text-sm text-text-secondary max-w-xs mx-auto">Add a new branch to manage its NFC campaigns and visitor data separately.</p>
                </button>
            </div>

            {/* Create Branch Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-text-main/40 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
                    <div className="relative bg-white rounded-[2.5rem] w-full max-w-xl p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-3xl font-display font-bold text-text-main mb-2">Add New Branch</h3>
                        <p className="text-text-secondary text-base mb-10 font-medium">Create a new location for {storeName}.</p>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Branch Name</label>
                                    <input
                                        type="text"
                                        value={newBranch.name}
                                        onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                                        placeholder="e.g. Lekki Heights Showroom"
                                        className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Full Address</label>
                                    <input
                                        type="text"
                                        value={newBranch.address}
                                        onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                                        placeholder="Enter complete physical address"
                                        className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-8">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="h-14 bg-gray-100 text-text-main font-bold rounded-2xl hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateBranch}
                                disabled={createBranchMutation.isPending}
                                className="h-14 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {createBranchMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                                Add Branch
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BranchesPage() {
    return (
        <Suspense fallback={null}>
            <BranchesContent />
        </Suspense>
    );
}

