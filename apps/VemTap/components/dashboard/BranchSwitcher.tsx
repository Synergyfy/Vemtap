'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, MapPin, Building2, Check, Plus, Layers, X, Save, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useBranches, useCreateBranch, useDeleteBranch } from '@/services/branches/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useAuthStore } from '@/store/useAuthStore';

export default function BranchSwitcher() {
    const { activeBranchId, setActiveBranch } = useActiveBranch();
    const { data: branches = [], isLoading } = useBranches();
    const createBranchMutation = useCreateBranch();
    const deleteBranchMutation = useDeleteBranch();
    const businessName = useAuthStore((state) => state.user?.businessName);
    const businessLogo = useAuthStore((state) => state.user?.businessLogo);
    const router = useRouter();

    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');
    const [newBranchAddress, setNewBranchAddress] = useState('');
    const [newBranchPhone, setNewBranchPhone] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const activeBranch = branches.find(b => b.id === activeBranchId);
    const formatBranchName = (branchName?: string, isMainBranch?: boolean) => {
        const normalized = (branchName || '').trim();
        const isDefaultLabel = /^main\s*branch$/i.test(normalized);
        if (isMainBranch && (isDefaultLabel || !normalized) && businessName) return businessName;
        return normalized || businessName || 'Main Branch';
    };

    // Auto-resolve single branch if none selected
    useEffect(() => {
        if (!isLoading && branches.length === 1 && !activeBranchId) {
            setActiveBranch(branches[0].id);
        }
    }, [branches, activeBranchId, setActiveBranch, isLoading]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsCreating(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCreateBranch = async () => {
        if (!newBranchName.trim()) {
            toast.error('Branch name is required');
            return;
        }
        try {
            const created = await createBranchMutation.mutateAsync({
                name: newBranchName.trim(),
                address: newBranchAddress.trim() || undefined,
                phone: newBranchPhone.trim() || undefined,
            });
            // Auto-switch to the new branch
            setActiveBranch(created.id);
            toast.success(`"${created.name}" branch created`);
            setNewBranchName('');
            setNewBranchAddress('');
            setNewBranchPhone('');
            setIsCreating(false);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to create branch');
        }
    };

    const handleDelete = async (e: React.MouseEvent, branchId: string, branchName: string) => {
        e.stopPropagation();
        if (!confirm(`Delete "${branchName}"? This cannot be undone.`)) return;
        try {
            await deleteBranchMutation.mutateAsync({ id: branchId });
            if (activeBranchId === branchId) setActiveBranch(null);
            toast.success(`Branch deleted`);
        } catch {
            toast.error('Failed to delete branch');
        }
    };

    if (!isLoading && branches.length <= 1) {
        return (
            <button onClick={() => router.push('/dashboard/settings/branches')} className="flex items-center gap-2 w-full cursor-pointer">
                <div className="flex-1 flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-primary/20 transition-all duration-200">
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary overflow-hidden shrink-0">
                        {businessLogo ? (
                            <img src={businessLogo} alt="Logo" className="size-full object-cover p-1" />
                        ) : (
                            <Building2 size={18} />
                        )}
                    </div>
                    <div className="text-left block flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-primary leading-none mb-1 truncate">
                            Location
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-text-main truncate">
                                {formatBranchName(branches[0]?.name, branches[0]?.isMainBranch)}
                            </span>
                        </div>
                    </div>
                </div>
            </button>
        );
    }

    const displayName = !activeBranchId
        ? 'All Locations'
        : formatBranchName(activeBranch?.name, activeBranch?.isMainBranch) || 'Select Location';

    const handleSelectBranch = (branchId: string | null) => {
        setActiveBranch(branchId);
        setIsOpen(false);
        router.push('/dashboard/settings/branches');
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div className="flex items-center gap-2 w-full">
                <button
                    onClick={() => { setIsOpen(!isOpen); setIsCreating(false); }}
                    className="flex-1 flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-primary/20 transition-all duration-200 group"
                >
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Building2 size={18} />}
                    </div>
                    <div className="text-left block flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-primary leading-none mb-1 truncate">
                            Active Location
                        </p>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-text-main truncate">
                                {displayName}
                            </span>
                            <ChevronDown
                                size={14}
                                className={`text-text-secondary shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                            />
                        </div>
                    </div>
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 overflow-hidden"
                    >
                        {!isCreating ? (
                            <>
                                <div className="px-3 py-2 mb-1 flex items-center justify-between">
                                    <p className="text-[10px] font-semibold text-gray-500">
                                        Switch Location
                                    </p>
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        {branches.length} Location{branches.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                <div className="space-y-1 max-h-64 overflow-y-auto">
                                    {/* All Branches Option */}
                                    <button
                                        onClick={() => handleSelectBranch(null)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${!activeBranchId
                                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                            : 'hover:bg-gray-50 text-text-main font-bold'
                                            }`}
                                    >
                                        <div className={`size-8 rounded-lg flex items-center justify-center ${!activeBranchId ? 'bg-white/20' : 'bg-gray-100 text-text-secondary'}`}>
                                            <Layers size={16} />
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className={`text-sm font-bold truncate ${!activeBranchId ? 'text-white' : 'text-text-main'}`}>
                                                All Locations
                                            </p>
                                            <p className={`text-[10px] truncate ${!activeBranchId ? 'text-white/80' : 'text-text-secondary'}`}>
                                                View aggregate data
                                            </p>
                                        </div>
                                        {!activeBranchId && <Check size={16} className="text-white" />}
                                    </button>

                                    {/* Individual Branches */}
                                    {branches.map((branch) => (
                                        <div
                                            key={branch.id}
                                            onClick={() => handleSelectBranch(branch.id)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group/item cursor-pointer ${activeBranchId === branch.id
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                : 'hover:bg-gray-50 text-text-main'
                                                }`}
                                        >
                                            <div className={`size-8 rounded-lg flex items-center justify-center ${activeBranchId === branch.id ? 'bg-white/20' : 'bg-gray-100 text-text-secondary'}`}>
                                                <MapPin size={16} />
                                            </div>
                                            <div className="text-left flex-1 min-w-0">
                                                <p className={`text-sm font-bold truncate ${activeBranchId === branch.id ? 'text-white' : 'text-text-main'}`}>
                                                    {formatBranchName(branch.name, branch.isMainBranch)}
                                                </p>
                                                <p className={`text-[10px] truncate ${activeBranchId === branch.id ? 'text-white/80' : 'text-text-secondary'}`}>
                                                    {branch.address || 'No address set'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {activeBranchId === branch.id && (
                                                    <Check size={16} className="text-white" />
                                                )}
                                                <button
                                                    onClick={(e) => handleDelete(e, branch.id, formatBranchName(branch.name, branch.isMainBranch))}
                                                    title="Delete branch"
                                                    className={`opacity-0 group-hover/item:opacity-100 p-1 rounded-lg transition-all ${activeBranchId === branch.id
                                                        ? 'hover:bg-white/20 text-white'
                                                        : 'hover:bg-red-50 text-red-400 hover:text-red-600'
                                                        }`}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                                    <button
                                        onClick={() => { setIsOpen(false); router.push('/dashboard/settings/branches'); }}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-500 hover:bg-gray-50 transition-all duration-200"
                                    >
                                        <div className="size-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                            <Layers size={18} className="text-gray-500" />
                                        </div>
                                        <span className="text-sm font-bold">Manage Locations</span>
                                    </button>
                                    <button
                                        onClick={() => setIsCreating(true)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl text-primary hover:bg-primary/5 transition-all duration-200"
                                    >
                                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Plus size={18} />
                                        </div>
                                        <span className="text-sm font-bold">Add New Branch</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* Create Branch Form */
                            <div className="p-3 space-y-3">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] font-semibold text-gray-500">New Branch</p>
                                    <button
                                        onClick={() => setIsCreating(false)}
                                        className="size-6 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <X size={14} className="text-text-secondary" />
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Branch name *"
                                    value={newBranchName}
                                    onChange={(e) => setNewBranchName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateBranch()}
                                    autoFocus
                                    className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                                <input
                                    type="text"
                                    placeholder="Address (optional)"
                                    value={newBranchAddress}
                                    onChange={(e) => setNewBranchAddress(e.target.value)}
                                    className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                                <input
                                    type="text"
                                    placeholder="Phone (optional)"
                                    value={newBranchPhone}
                                    onChange={(e) => setNewBranchPhone(e.target.value.replace(/\D/g, ''))}
                                    className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => setIsCreating(false)}
                                        className="flex-1 h-9 bg-gray-50 text-text-secondary font-bold text-xs rounded-xl hover:bg-gray-100 border border-gray-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateBranch}
                                        disabled={createBranchMutation.isPending}
                                        className="flex-1 h-9 bg-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {createBranchMutation.isPending ? (
                                            <Loader2 size={13} className="animate-spin" />
                                        ) : (
                                            <Save size={13} />
                                        )}
                                        {createBranchMutation.isPending ? 'Creating...' : 'Create'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
