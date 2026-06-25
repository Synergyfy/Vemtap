'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
interface CreateTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    isLoading: boolean;
    initialData?: { title: string; category: string; type: string; content: string; } | null;
}

export default function CreateTemplateModal({ isOpen, onClose, onSubmit, isLoading, initialData }: CreateTemplateModalProps) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: initialData ? {
            title: initialData.title,
            category: initialData.category,
            type: initialData.type,
            content: initialData.content,
        } : {
            type: 'Any',
            category: 'Marketing',
        }
    });

    const handleFormSubmit = (data: any) => {
        onSubmit(data);
        reset();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Edit Template' : 'Create Template'}
            description="Design a reusable message format for your team."
            size="lg"
        >
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Template Title</label>
                    <input
                        {...register('title', { required: 'Title is required' })}
                        placeholder="e.g. Welcome Series #1"
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-bold text-sm"
                    />
                    {errors.title && <p className="text-xs text-red-500 mt-1 ml-1 font-bold">{errors.title.message as string}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Category</label>
                        <select
                            {...register('category')}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-bold text-sm appearance-none cursor-pointer"
                        >
                            <option value="Promo offers">Promo offers</option>
                            <option value="Thank-you messages">Thank-you messages</option>
                            <option value="Survey invites">Survey invites</option>
                            <option value="Review requests">Review requests</option>
                            <option value="Reminders">Reminders</option>
                            <option value="Custom">Custom</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Channel Type</label>
                        <select
                            {...register('type')}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-bold text-sm appearance-none cursor-pointer"
                        >
                            <option value="Any">Any Channel</option>
                            <option value="WhatsApp">WhatsApp</option>
                            <option value="SMS">SMS</option>
                            <option value="Email">Email</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Template Content</label>
                    <textarea
                        {...register('content', { required: 'Content is required' })}
                        placeholder="Hello {name}, ..."
                        className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-medium text-sm resize-none"
                    />
                    <p className="text-[10px] text-slate-400 font-bold text-right">Supported variables: {'{name}'}, {'{business}'}</p>
                    {errors.content && <p className="text-xs text-red-500 mt-1 ml-1 font-bold">{errors.content.message as string}</p>}
                </div>

                <div className="pt-4 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 h-14 border-2 border-primary/20 text-primary font-bold rounded-lg hover:bg-primary/5 hover:border-primary/30 transition-all text-sm active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-3 h-14 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 size={20} className="animate-spin text-white" />
                        ) : (
                            <>
                                {initialData ? <Edit size={20} /> : <Plus size={20} />}
                                {initialData ? 'Update Template' : 'Save Template'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

