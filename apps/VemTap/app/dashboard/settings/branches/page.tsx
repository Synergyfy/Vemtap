'use client';

import React, { useState, Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import PageHeader from '@/components/dashboard/PageHeader';
import { 
    Building2, Plus, MapPin, Phone, Mail, 
    MoreVertical, Trash2, Edit2, Lock, X, CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useMyBusiness } from '@/services/businesses/hooks';

import { useBranches, useCreateBranch, useDeleteBranch, useUpdateBranch, useRequestDeleteBranchOtp } from '@/services/branches/hooks';
import { Branch } from '@/services/branches/types';
import { Loader2 } from 'lucide-react';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import UsageIndicator from '@/components/dashboard/UsageIndicator';
import UpgradeModal from '@/components/dashboard/UpgradeModal';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';

const LocationSetupModal = dynamic(() => import('@/components/dashboard/branches/LocationSetupModal'), { ssr: false });

function BranchesContent() {
    const pathname = usePathname();
    const { storeName } = useCustomerFlowStore();
    const { data: business } = useMyBusiness();
    const { data: branchesData, isLoading } = useBranches();
    const { capabilities, isLimitReached } = useSubscriptionStore();
    const createBranchMutation = useCreateBranch();
    const updateBranchMutation = useUpdateBranch();
    const deleteBranchMutation = useDeleteBranch();
    const requestOtpMutation = useRequestDeleteBranchOtp();

    const branches = branchesData || [];
    const businessName = business?.name || storeName;
    const resolveBranchName = (branch: Branch) => {
        const normalized = (branch.name || '').trim();
        const isDefaultLabel = /^main\s*branch$/i.test(normalized);
        if (branch.isMainBranch && (isDefaultLabel || !normalized) && businessName) return businessName;
        return normalized || businessName || 'Main Branch';
    };
    const branchLimitReached = isLimitReached('branches');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [branchToEdit, setBranchToEdit] = useState<Branch | null>(null);
    const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
    const [otp, setOtp] = useState('');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [locationSetupFor, setLocationSetupFor] = useState<'create' | 'edit' | null>(null);

    // Close upgrade modal on navigation
    useEffect(() => {
        setShowUpgradeModal(false);
    }, [pathname]);
    const [newBranch, setNewBranch] = useState<Partial<Branch>>({
        name: '',
        address: '',
        phone: '',
        officialEmail: '',
        isActive: true
    });

    const handleCreateBranch = () => {
        if (branchLimitReached) {
            setShowUpgradeModal(true);
            toast.error('Branch limit reached. Please upgrade your plan.');
            return;
        }

        if (!newBranch.name || !newBranch.address) {
            toast.error('Please fill in required fields');
            return;
        }

        createBranchMutation.mutate({
            name: newBranch.name!,
            address: newBranch.address,
            phone: newBranch.phone,
            officialEmail: newBranch.officialEmail,
            latitude: newBranch.latitude,
            longitude: newBranch.longitude,
        }, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                setNewBranch({ name: '', address: '', phone: '', officialEmail: '', isActive: true });
                toast.success('Branch added successfully');
            },
            onError: () => {
                toast.error('Failed to create branch');
            }
        });
    };

    const handleEditClick = (branch: Branch) => {
        setBranchToEdit(branch);
        setIsEditModalOpen(true);
    };

    const handleUpdateBranch = () => {
        if (!branchToEdit?.name || !branchToEdit?.address) {
            toast.error('Please fill in required fields');
            return;
        }

        updateBranchMutation.mutate({
            id: branchToEdit.id,
            updates: {
                name: branchToEdit.name,
                address: branchToEdit.address,
                phone: branchToEdit.phone,
                officialEmail: branchToEdit.officialEmail,
                latitude: branchToEdit.latitude,
                longitude: branchToEdit.longitude,
            }
        }, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setBranchToEdit(null);
                toast.success('Branch updated successfully');
            },
            onError: () => {
                toast.error('Failed to update branch');
            }
        });
    };

    const handleDeleteClick = (branch: Branch) => {
        setBranchToDelete(branch);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!branchToDelete) return;
        setIsDeleteModalOpen(false);
        setIsOtpModalOpen(true);
        requestOtpMutation.mutate(branchToDelete.id, {
            onSuccess: (res) => {
                toast.success(res.message || 'Verification code sent for branch deletion');
            },
            onError: () => {
                toast.error('Failed to request verification code');
            }
        });
    };

    const handleVerifyOtp = () => {
        if (otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        if (branchToDelete) {
            deleteBranchMutation.mutate({ id: branchToDelete.id, otp }, {
                onSuccess: () => {
                    toast.success('Branch deleted successfully');
                    setIsOtpModalOpen(false);
                    setBranchToDelete(null);
                    setOtp('');
                },
                onError: (err: any) => {
                    toast.error(err?.message || 'Failed to delete branch');
                }
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <PageLockWrapper feature="branches" featureName="Multi-branch Management">
            <div className="p-8 max-w-6xl mx-auto">
                <PageHeader
                    title="Business Branches"
                    description="Manage multiple locations and outlets for your business."
                    actions={
                        <button
                            onClick={() => {
                                if (branchLimitReached) {
                                    setShowUpgradeModal(true);
                                } else {
                                    setIsCreateModalOpen(true);
                                }
                            }}
                            className={`flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm shadow-md shadow-primary/20 ${branchLimitReached ? 'opacity-70' : ''}`}
                        >
                            {branchLimitReached ? <Lock size={18} /> : <Plus size={18} />}
                            Add New Branch
                        </button>
                    }
                />

                <div className="mt-8 max-w-md">
                    <UsageIndicator
                        label="Active Branches"
                        usage={capabilities?.capabilities.branches}
                        icon={<Building2 size={20} />}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                    {branches.map((branch) => (
                        <div key={branch.id} className="bg-white rounded-3xl border border-gray-200 p-6 hover:shadow-xl transition-all group relative overflow-hidden">
                            {branch.isMainBranch && (
                                <div className="absolute top-0 right-0 px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-bl-2xl">
                                    Main Location
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-6">
                                <div className="size-14 rounded-2xl bg-gray-50 flex items-center justify-center text-text-secondary group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                    <Building2 size={24} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xl font-display font-bold text-text-main group-hover:text-primary transition-colors">
                                        {resolveBranchName(branch)}
                                    </h3>
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
                                    {branch.officialEmail && (
                                        <div className="flex items-center gap-3 text-text-secondary">
                                            <Mail size={16} className="shrink-0" />
                                            <span className="text-xs font-medium">{branch.officialEmail}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                        <div className="grid grid-cols-2 gap-3 mt-8 pt-4">
                            <button 
                                onClick={() => handleEditClick(branch)}
                                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-100 text-[11px] font-bold text-text-secondary hover:bg-gray-50 transition-all"
                            >
                                <Edit2 size={14} />
                                Edit Details
                            </button>
                            <button 
                                onClick={() => handleDeleteClick(branch)}
                                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 text-[11px] font-bold text-red-600 hover:bg-red-100 transition-all"
                            >
                                <Trash2 size={14} />
                                Delete Branch
                            </button>
                        </div>
                    </div>
                ))}

                    {/* Empty State / Add Branch Card */}
                    <button
                        onClick={() => {
                            if (branchLimitReached) {
                                setShowUpgradeModal(true);
                            } else {
                                setIsCreateModalOpen(true);
                            }
                        }}
                        className="bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 p-12 flex flex-col items-center justify-center text-center hover:bg-white hover:border-primary/20 transition-all group lg:min-h-[350px]"
                    >
                        <div className="size-20 rounded-full bg-white border border-gray-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">     
                            {branchLimitReached ? <Lock size={32} className="text-gray-300" /> : <Plus size={32} className="text-gray-300 group-hover:text-primary transition-colors" />}
                        </div>
                        <h3 className="text-lg font-display font-bold text-text-main mb-2">Expand Your Reach</h3>
                        <p className="text-sm text-text-secondary max-w-xs mx-auto">
                            {branchLimitReached ? 'You have reached your branch limit. Upgrade to add more locations.' : 'Add a new branch to manage its NFC campaigns and visitor data separately.'}
                        </p>
                    </button>
                </div>

                {/* Create Branch Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-text-main/40 backdrop-blur-sm"  />
                        <div className="relative bg-white rounded-[2.5rem] w-full max-w-xl p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                            <h3 className="text-3xl font-display font-bold text-text-main mb-2">Add New Branch</h3>
                            <p className="text-text-secondary text-base mb-10 font-medium">Create a new location for {storeName}.</p>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Branch Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={newBranch.name}
                                            onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                                            placeholder="e.g. Lekki Heights Showroom"
                                            className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Full Address <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={newBranch.address}
                                                onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                                                placeholder="Enter complete physical address"
                                                className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl pl-5 pr-14 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setLocationSetupFor('create')}
                                                title="Set location coordinates"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-xl bg-gray-100 hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center text-gray-400"
                                            >
                                                <MapPin size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Phone Number</label>
                                            <input
                                                type="tel"
                                                value={newBranch.phone}
                                                onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value.replace(/\D/g, '') })}
                                                placeholder="+234 801 234 5678"
                                                className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Official Email</label>
                                            <input
                                                type="email"
                                                value={newBranch.officialEmail}
                                                onChange={(e) => setNewBranch({ ...newBranch, officialEmail: e.target.value })}
                                                placeholder="branch@business.com"
                                                className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                            />
                                        </div>
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

            {/* Edit Branch Modal */}
            {isEditModalOpen && branchToEdit && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-text-main/40 backdrop-blur-sm"  />
                    <div className="relative bg-white rounded-[2.5rem] w-full max-w-xl p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-3xl font-display font-bold text-text-main mb-2">Edit Branch</h3>
                        <p className="text-text-secondary text-base mb-10 font-medium">Update details for {resolveBranchName(branchToEdit)}.</p>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Branch Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={branchToEdit.name}
                                        onChange={(e) => setBranchToEdit({ ...branchToEdit, name: e.target.value })}
                                        placeholder="e.g. Lekki Heights Showroom"
                                        className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Full Address <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={branchToEdit.address}
                                            onChange={(e) => setBranchToEdit({ ...branchToEdit, address: e.target.value })}
                                            placeholder="Enter complete physical address"
                                            className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl pl-5 pr-14 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setLocationSetupFor('edit')}
                                            title="Set location coordinates"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-xl bg-gray-100 hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center text-gray-400"
                                        >
                                            <MapPin size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={branchToEdit.phone || ''}
                                            onChange={(e) => setBranchToEdit({ ...branchToEdit, phone: e.target.value.replace(/\D/g, '') })}
                                            placeholder="+234 801 234 5678"
                                            className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Official Email</label>
                                        <input
                                            type="email"
                                            value={branchToEdit.officialEmail || ''}
                                            onChange={(e) => setBranchToEdit({ ...branchToEdit, officialEmail: e.target.value })}
                                            placeholder="branch@business.com"
                                            className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-8">
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="h-14 bg-gray-100 text-text-main font-bold rounded-2xl hover:bg-gray-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdateBranch}
                                        disabled={updateBranchMutation.isPending}
                                        className="h-14 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {updateBranchMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <Edit2 size={20} />}
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && branchToDelete && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-text-main/40 backdrop-blur-sm"  />
                    <div className="relative bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
                        <div className="size-20 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={40} />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-text-main mb-2">Delete Branch?</h3>
                        <p className="text-text-secondary text-sm mb-10 font-medium">
                            Are you sure you want to delete <strong>{resolveBranchName(branchToDelete)}</strong>? This action cannot be undone and all associated data will be lost.
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="h-14 bg-gray-100 text-text-main font-bold rounded-2xl hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="h-14 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 shadow-xl shadow-red-200 transition-all"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* OTP Verification Modal */}
            {isOtpModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-text-main/40 backdrop-blur-sm"  />
                    <div className="relative bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-display font-bold text-text-main">Verify Deletion</h3>
                                <p className="text-text-secondary text-xs font-medium mt-1">Enter the 6-digit code sent to your email</p>
                            </div>
                            <button onClick={() => setIsOtpModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 text-center block">Enter 6-Digit Verification Code</label>
                                <input
                                    type="text"
                                    placeholder="000000"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    className="w-full h-16 bg-gray-50 border-2 border-gray-200 rounded-2xl px-5 text-2xl font-bold text-center tracking-[0.5em] focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                                />
                                <p className="text-[10px] text-text-secondary text-center mt-4">
                                    Didn't receive the code? <button type="button" className="text-primary font-bold hover:underline">Resend Code</button>
                                </p>
                            </div>

                            <button
                                onClick={handleVerifyOtp}
                                disabled={deleteBranchMutation.isPending}
                                className="w-full h-14 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {deleteBranchMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                                Confirm Deletion
                            </button>
                        </div>
                    </div>
                </div>
            )}

                <LocationSetupModal
                    isOpen={locationSetupFor !== null}
                    onClose={() => setLocationSetupFor(null)}
                    addressHint={locationSetupFor === 'create' ? newBranch.address : branchToEdit?.address}
                    onLocationSet={(lat, lng) => {
                        if (locationSetupFor === 'create') {
                            setNewBranch(prev => ({ ...prev, latitude: lat, longitude: lng }));
                        } else if (locationSetupFor === 'edit' && branchToEdit) {
                            setBranchToEdit({ ...branchToEdit, latitude: lat, longitude: lng });
                        }
                        setLocationSetupFor(null);
                    }}
                />

                <UpgradeModal 
                    isOpen={showUpgradeModal} 
                    onClose={() => setShowUpgradeModal(false)} 
                    featureName="Business Locations" 
                />
            </div>
        </PageLockWrapper>
    );
}

export default function BranchesPage() {
    return (
        <Suspense fallback={null}>
            <BranchesContent />
        </Suspense>
    );
}
