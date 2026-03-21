'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminProductsApi } from '@/lib/api/admin';
import { notify } from '@/lib/notify';
import {
    Tag, Plus, Trash2, Edit, Search, Save, X,
    MoreVertical, Package, Layers, Loader2
} from 'lucide-react';
import Modal from '@/components/ui/Modal';

export default function ProductTypesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<any>(null);

    // Form state
    const [typeName, setTypeName] = useState('');
    const [typeSlug, setTypeSlug] = useState('');
    const [typeDescription, setTypeDescription] = useState('');

    const queryClient = useQueryClient();

    const { data: types, isLoading } = useQuery({
        queryKey: ['admin-product-types'],
        queryFn: () => adminProductsApi.getAllTypes(),
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => adminProductsApi.createType(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-product-types'] });
            notify.success('Category created successfully');
            closeModal();
        },
        onError: (err: any) => {
            notify.error(err.message || 'Failed to create category');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => adminProductsApi.updateType(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-product-types'] });
            notify.success('Category updated successfully');
            closeModal();
        },
        onError: (err: any) => {
            notify.error(err.message || 'Failed to update category');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminProductsApi.deleteType(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-product-types'] });
            notify.success('Category deleted successfully');
        },
        onError: (err: any) => {
            notify.error(err.message || 'Failed to delete category');
        }
    });

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this category? This might affect products linked to it.')) {
            deleteMutation.mutate(id);
        }
    };

    const handleEdit = (type: any) => {
        setSelectedType(type);
        setTypeName(type.name);
        setTypeSlug(type.slug || '');
        setTypeDescription(type.description || '');
        setIsCreateModalOpen(true);
    };

    const handleSubmit = () => {
        if (!typeName) {
            notify.error('Name is required');
            return;
        }

        let finalSlug = typeSlug || typeName.toLowerCase().replace(/\s+/g, '-');
        if (!finalSlug.startsWith('nfc-')) {
            finalSlug = `nfc-${finalSlug}`;
        }

        const data = {
            name: typeName,
            slug: finalSlug,
            description: typeDescription
        };

        if (selectedType) {
            updateMutation.mutate({ id: selectedType.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const closeModal = () => {
        setIsCreateModalOpen(false);
        setSelectedType(null);
        setTypeName('');
        setTypeSlug('');
        setTypeDescription('');
    };

    const filteredTypes = (types || []).filter((t: any) =>
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.slug?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 text-primary mb-2">
                        <Layers size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Inventory Setup</span>
                    </div>
                    <h1 className="text-4xl font-display font-bold text-text-main">Product Categories</h1>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-12 px-6 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> Add New Category
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] font-black uppercase tracking-widest text-text-secondary border-b border-gray-100 bg-gray-50/50">
                                <th className="px-8 py-6">Category Name</th>
                                <th className="px-8 py-6">Slug</th>
                                <th className="px-8 py-6">Description</th>
                                <th className="px-8 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="px-8 py-8 h-20 bg-gray-50/20"></td>
                                    </tr>
                                ))
                            ) : filteredTypes.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-text-secondary font-bold">
                                        No categories found. Start by adding one!
                                    </td>
                                </tr>
                            ) : (
                                filteredTypes.map((type: any) => (
                                    <tr key={type.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                                                    <Tag size={18} />
                                                </div>
                                                <span className="font-bold text-text-main">{type.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-mono font-bold text-gray-400">/{type.slug}</span>
                                        </td>
                                        <td className="px-8 py-6 max-w-xs">
                                            <p className="text-sm text-text-secondary truncate">{type.description || 'No description'}</p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(type)}
                                                    className="p-2 hover:bg-white border border-transparent hover:border-gray-100 rounded-lg transition-all text-slate-400 hover:text-primary"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(type.id)}
                                                    className="p-2 hover:bg-white border border-transparent hover:border-gray-100 rounded-lg transition-all text-slate-400 hover:text-red-500"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isCreateModalOpen}
                onClose={closeModal}
                title={selectedType ? 'Edit Category' : 'Create New Category'}
                description="Categories help organize your hardware inventory."
                size="md"
            >
                <div className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Category Name</label>
                        <input
                            type="text"
                            value={typeName}
                            onChange={(e) => setTypeName(e.target.value)}
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 font-bold transition-all"
                            placeholder="e.g. NFC Readers"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Slug (Optional)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">/</span>
                            <input
                                type="text"
                                value={typeSlug}
                                onChange={(e) => setTypeSlug(e.target.value)}
                                className="w-full h-12 pl-8 pr-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 font-mono text-sm transition-all"
                                placeholder="nfc-readers"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Description</label>
                        <textarea
                            value={typeDescription}
                            onChange={(e) => setTypeDescription(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 text-sm font-medium resize-none transition-all"
                            placeholder="Describe what items belong in this category..."
                            rows={4}
                        />
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-100 mt-8">
                        <button
                            onClick={handleSubmit}
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="flex-1 h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {(createMutation.isPending || updateMutation.isPending) ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <><Save size={18} /> {selectedType ? 'Update Category' : 'Create Category'}</>
                            )}
                        </button>
                        <button
                            onClick={closeModal}
                            className="px-6 h-12 bg-white border border-gray-200 text-text-main font-bold rounded-xl"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
