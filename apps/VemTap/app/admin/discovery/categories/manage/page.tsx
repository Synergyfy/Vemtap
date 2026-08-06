'use client';

import React, { useState } from 'react';
import { 
    Boxes, Plus, Edit3, Trash2, Search, 
    Filter, CheckCircle2, XCircle, Info,
    ChevronLeft, Tag
} from 'lucide-react';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import { 
    useAdminCategoryTypes, 
    useCreateAdminCategoryType, 
    useUpdateAdminCategoryType, 
    useDeleteAdminCategoryType 
} from '@/services/discovery/hooks';
import type { AdminCategoryType } from '@/services/discovery/types';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';

export default function ManageOfferCategoriesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<AdminCategoryType | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', status: 'Active' });

    const { data: response, isLoading } = useAdminCategoryTypes({ page: 1, limit: 50 });
    const categoryTypes = response?.data ?? [];
    const createMutation = useCreateAdminCategoryType();
    const updateMutation = useUpdateAdminCategoryType();
    const deleteMutation = useDeleteAdminCategoryType();

    const handleOpenCreate = () => {
        setEditingCat(null);
        setFormData({ name: '', description: '', status: 'Active' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (cat: AdminCategoryType) => {
        setEditingCat(cat);
        setFormData({ name: cat.name, description: cat.desc, status: cat.status });
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        if (editingCat) {
            updateMutation.mutate(
                { id: editingCat.id, name: formData.name, description: formData.description, status: formData.status },
                { onSuccess: () => setIsModalOpen(false) }
            );
        } else {
            createMutation.mutate(
                { name: formData.name, description: formData.description, status: formData.status },
                { onSuccess: () => setIsModalOpen(false) }
            );
        }
    };

    const handleDelete = (id: string) => {
        deleteMutation.mutate(id);
    };

    if (isLoading) {
        return (
            <div className="p-8">
                <DiscoveryNav current="/admin/discovery/categories" />
                <div className="flex items-center justify-between mb-6">
                    <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                    <div className="h-12 w-40 bg-gray-100 rounded-2xl animate-pulse" />
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50">
                        <div className="h-5 w-48 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="p-6 space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <Link 
                    href="/admin/discovery/categories"
                    className="flex items-center gap-2 text-text-secondary hover:text-text-main transition-colors text-xs font-black uppercase tracking-widest"
                >
                    <ChevronLeft size={16} /> Back to Analytics
                </Link>
                <button 
                    onClick={handleOpenCreate}
                    className="h-12 px-6 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    <Plus size={16} /> Create Category
                </button>
            </div>

            <Link href="/admin/discovery/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-main transition-colors mb-6">
                <ChevronLeft size={14} /> Back to Discovery
            </Link>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <h2 className="text-lg font-display font-bold text-text-main">Offer Category Types</h2>
                    <p className="text-xs font-medium text-text-secondary">Define what types of offers businesses can create.</p>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Category Name</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Description</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Active Offers</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {categoryTypes.map((cat) => (
                                <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                                <Tag size={16} />
                                            </div>
                                            <p className="font-bold text-text-main">{cat.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-text-secondary font-medium italic max-w-xs truncate">
                                        {cat.desc}
                                    </td>
                                    <td className="px-6 py-4 text-center font-black text-text-main">
                                        {cat.count}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            cat.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {cat.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleOpenEdit(cat)}
                                                className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-primary/10 hover:text-primary transition-all"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(cat.id)}
                                                className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-rose-50 hover:text-rose-600 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={editingCat ? 'Edit Category' : 'Create Category'}
            >
                <div className="p-8">
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="size-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                            <Tag size={32} />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-text-main">{editingCat ? 'Modify Category' : 'New Offer Type'}</h3>
                        <p className="text-sm font-medium text-text-secondary">Define the rules for this offer segment.</p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Category Name</label>
                            <input 
                                type="text" 
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Seasonal Flash Sale"
                                className="w-full h-12 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold text-text-main focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Internal Description</label>
                            <textarea 
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Explain the purpose of this category..."
                                className="w-full h-24 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                            />
                        </div>
                        <div 
                            className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer"
                            onClick={() => setFormData({ ...formData, status: formData.status === 'Active' ? 'Inactive' : 'Active' })}
                        >
                            <div>
                                <p className="text-xs font-bold text-text-main">Enable Category</p>
                                <p className="text-[10px] text-text-secondary font-medium mt-0.5">Allow businesses to select this type.</p>
                            </div>
                            <div className={`size-10 rounded-xl flex items-center justify-center text-white cursor-pointer shadow-lg transition-all ${
                                formData.status === 'Active' ? 'bg-primary shadow-primary/20' : 'bg-gray-300'
                            }`}>
                                <CheckCircle2 size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-10">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 h-12 rounded-2xl border border-gray-200 text-text-main text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSubmit}
                            disabled={!formData.name || createMutation.isPending || updateMutation.isPending}
                            className="flex-[1.5] h-12 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {createMutation.isPending || updateMutation.isPending
                                ? 'Saving...'
                                : editingCat ? 'Save Changes' : 'Create Category'
                            }
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
