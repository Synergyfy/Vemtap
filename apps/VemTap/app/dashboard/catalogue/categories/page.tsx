'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import EmptyState from '@/components/dashboard/EmptyState';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useCatalogueCategories, useDeleteCatalogueCategory, Category } from '@/services/catalogue/hooks';
import toast from 'react-hot-toast';
import CategoryModal from '@/components/dashboard/catalogue/CategoryModal';

export default function CategoriesPage() {
    const { data: categories = [], isLoading } = useCatalogueCategories();
    const deleteMutation = useDeleteCatalogueCategory();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    const handleEdit = (category: Category) => {
        setSelectedCategory(category);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this category?')) {
            try {
                await deleteMutation.mutateAsync(id);
                toast.success('Category deleted successfully');
            } catch (error) {
                toast.error('Failed to delete category');
            }
        }
    };

    const handleAdd = () => {
        setSelectedCategory(null);
        setIsModalOpen(true);
    };

    const columns: Column<Category>[] = [
        {
            header: 'Name',
            accessor: (item: Category) => (
                <div className="font-bold text-text-main">{item.name}</div>
            )
        },
        {
            header: 'Created At',
            accessor: (item: Category) => item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'
        },
        {
            header: 'Actions',
            accessor: (item: Category) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all cursor-pointer"
                        title="Edit"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="p-4 md:p-8">
            <PageHeader
                title="Product Categories"
                description="Organize your products into groups"
                actions={
                    <button 
                        onClick={handleAdd} 
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm shadow-lg shadow-primary/20 cursor-pointer"
                    >
                        <Plus size={18} />
                        Add Category
                    </button>
                }
            />

            <DataTable
                columns={columns}
                data={categories}
                isLoading={isLoading}
                emptyState={
                    <EmptyState
                        icon="layout"
                        title="No categories found"
                        description="Start by adding your first product category."
                    />
                }
            />

            <CategoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                category={selectedCategory}
            />
        </div>
    );
}
