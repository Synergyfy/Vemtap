'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Modal from '@/components/ui/Modal';
import { Category, useCreateCatalogueCategory, useUpdateCatalogueCategory } from '@/services/catalogue/hooks';
import toast from 'react-hot-toast';
import { Loader2, Save } from 'lucide-react';

const categorySchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    category?: Category | null;
}

export default function CategoryModal({ isOpen, onClose, category }: CategoryModalProps) {
    const createMutation = useCreateCatalogueCategory();
    const updateMutation = useUpdateCatalogueCategory();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: '',
        },
    });

    useEffect(() => {
        if (category) {
            reset({
                name: category.name,
            });
        } else {
            reset({
                name: '',
            });
        }
    }, [category, reset, isOpen]);

    const onSubmit = async (values: CategoryFormValues) => {
        try {
            if (category) {
                await updateMutation.mutateAsync({ id: category.id, data: values });
                toast.success('Category updated successfully');
            } else {
                await createMutation.mutateAsync(values);
                toast.success('Category created successfully');
            }
            onClose();
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={category ? 'Edit Category' : 'Add Category'}
            size="sm"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest">
                        Category Name
                    </label>
                    <input 
                        {...register('name')}
                        placeholder="e.g. Appetizers, Drinks, Main Course"
                        className={`w-full h-12 bg-gray-50 border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all`}
                    />
                    {errors.name && (
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">{errors.name.message}</p>
                    )}
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 h-12 bg-gray-50 text-text-secondary font-bold text-sm rounded-xl hover:bg-gray-100 border border-gray-200 transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex-1 h-12 bg-primary text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isPending ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        {category ? 'Update' : 'Create'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
