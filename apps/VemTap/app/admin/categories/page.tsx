'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { toast } from 'react-hot-toast';
import {
    Plus,
    Trash2,
    Settings,
    ChevronRight,
    Layers,
    Info,
    LayoutGrid,
    Save,
    X,
    GripVertical,
    Search,
    Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Subcategory {
    id: string;
    name: string;
}

interface Category {
    id: string;
    name: string;
    description: string;
    subcategories: Subcategory[];
}

import { useCategories, useCreateCategory, useDeleteCategory, useCreateSubcategory } from '@/services/categories/hooks';
import { Loader2 } from 'lucide-react';

export default function AdminCategoriesPage() {
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination / Search can be updated via state if desired. For now, max limit.
    const { data: categoryData, isLoading } = useCategories({ search: searchTerm, limit: 100 });
    const categories = categoryData?.items || [];

    const createCategoryMutation = useCreateCategory();
    const deleteCategoryMutation = useDeleteCategory();
    const createSubcategoryMutation = useCreateSubcategory();

    const [newCategory, setNewCategory] = useState({
        name: '',
        description: '',
        subcategoriesText: ''
    });

    const handleAddCategory = async () => {
        if (!newCategory.name || !newCategory.description) {
            toast.error('Please fill name and description');
            return;
        }

        try {
            const created = await createCategoryMutation.mutateAsync({
                name: newCategory.name,
                description: newCategory.description
            });

            const subNames = newCategory.subcategoriesText
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);

            if (subNames.length > 0) {
                await Promise.all(subNames.map(subName =>
                    createSubcategoryMutation.mutateAsync({
                        name: subName,
                        categoryId: created.id
                    })
                ));
            }

            setNewCategory({ name: '', description: '', subcategoriesText: '' });
            setIsAddingCategory(false);
            toast.success('Category added successfully');
        } catch (error) {
            toast.error('Failed to create category');
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;
        try {
            await deleteCategoryMutation.mutateAsync(id);
            toast.success('Category removed');
        } catch (error) {
            toast.error('Failed to delete category');
        }
    };

    const filteredCategories = categories.filter((c: Category) => {
        const nameMatch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
        const subMatch = (c.subcategories || []).some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return nameMatch || subMatch;
    });

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <PageHeader
                title="Business Sectors & Types"
                description="Manage business sectors/types and the categories within each."
                actions={
                    <button
                        onClick={() => setIsAddingCategory(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm shadow-lg shadow-primary/20"
                    >
                        <Plus size={18} />
                        Add New Sector/Type
                    </button>
                }
            />

            {/* Search and Stats */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search sectors/types..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all outline-none"
                    />
                </div>
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-primary/5 text-primary rounded-xl text-xs font-bold border border-primary/10 flex items-center gap-2 uppercase tracking-tight">
                        <LayoutGrid size={14} />
                        {categories.length} Total Sectors/Types
                    </div>
                </div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                    {isLoading ? (
                        <div className="col-span-1 md:col-span-2 flex items-center justify-center p-12">
                            <Loader2 size={32} className="animate-spin text-primary" />
                        </div>
                    ) : (
                        filteredCategories.map((category: Category) => (
                            <motion.div
                                layout
                                key={category.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-4xl border border-gray-200 shadow-sm overflow-hidden group hover:shadow-xl hover:border-primary/20 transition-all duration-300"
                            >
                                <div className="p-8 space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                                <Layers size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-display font-bold text-text-main text-lg group-hover:text-primary transition-colors">
                                                    {category.name}
                                                </h3>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                                    {category.subcategories.length} Categories
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(category.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 flex gap-4">
                                        <div className="shrink-0 pt-0.5">
                                            <Info size={16} className="text-primary" />
                                        </div>
                                        <p className="text-xs text-text-secondary font-medium leading-relaxed italic">
                                            "{category.description}"
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Categories Under This Sector</label>
                                        <div className="flex flex-wrap gap-2">
                                            {category.subcategories.map((sub) => (
                                                <span
                                                    key={sub.id}
                                                    className="px-3 py-1.5 bg-white border border-gray-100 rounded-xl text-[10px] font-bold text-text-secondary shadow-sm hover:border-primary/30 hover:text-primary transition-all cursor-default"
                                                >
                                                    {sub.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )))}
                </AnimatePresence>
            </div>

            {/* Empty State */}
            {!isLoading && filteredCategories.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-4xl border-2 border-dashed border-gray-100">
                    <div className="size-20 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300 mb-6">
                        <LayoutGrid size={40} />
                    </div>
                    <h3 className="font-bold text-text-main text-xl">No sectors/types found</h3>
                    <p className="text-sm text-text-secondary mt-2">Try searching for something else or create a new one.</p>
                </div>
            )}

            {/* Add Category Modal */}
            <AnimatePresence>
                {isAddingCategory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setIsAddingCategory(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative w-full max-w-2xl bg-white rounded-4xl shadow-2xl overflow-hidden border border-white/20"
                        >
                            <div className="px-10 py-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
                                        <Plus size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-display font-bold text-text-main text-xl">Create Business Sector/Type</h3>
                                        <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest mt-1">Platform Settings • VemTap Engine</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsAddingCategory(false)}
                                    className="size-10 flex items-center justify-center hover:bg-gray-200 rounded-xl transition-all text-gray-400 hover:text-text-main"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-10 space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Sector/Type Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Technology & Digital Services"
                                        value={newCategory.name}
                                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                        className="w-full h-16 bg-gray-50 border border-gray-200 rounded-2xl px-8 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Short Description (Customer-facing)</label>
                                    <textarea
                                        rows={3}
                                        placeholder="e.g. Restaurants, cafes, bakeries, catering services, food trucks, meal prep services"
                                        value={newCategory.description}
                                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-8 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Categories List</label>
                                        <span className="text-[10px] text-primary font-black uppercase">Separate entries by commas</span>
                                    </div>
                                    <textarea
                                        rows={4}
                                        placeholder="Software Development, Website Development, IT Support..."
                                        value={newCategory.subcategoriesText}
                                        onChange={(e) => setNewCategory({ ...newCategory, subcategoriesText: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-8 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                                    />
                                </div>
                            </div>

                            <div className="px-10 py-8 bg-gray-50/80 border-t border-gray-100 flex gap-4">
                                <button
                                    onClick={() => setIsAddingCategory(false)}
                                    className="flex-1 h-14 border border-gray-200 text-text-secondary font-bold rounded-2xl hover:bg-white hover:border-gray-300 transition-all text-sm"
                                >
                                    Discard Changes
                                </button>
                                <button
                                    onClick={handleAddCategory}
                                    disabled={createCategoryMutation.isPending || createSubcategoryMutation.isPending}
                                    className="flex-[2] h-14 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/30 hover:bg-primary-hover hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {(createCategoryMutation.isPending || createSubcategoryMutation.isPending) ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        <Save size={20} />
                                    )}
                                    Save & Publish Sector/Type
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
