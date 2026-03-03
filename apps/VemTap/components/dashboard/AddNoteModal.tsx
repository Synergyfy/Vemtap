'use client';

import { Loader2 } from 'lucide-react';

import React from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/ui/Modal';

interface AddNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { note: string }) => void;
    isLoading?: boolean;
}

export default function AddNoteModal({ isOpen, onClose, onSubmit, isLoading }: AddNoteModalProps) {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<{ note: string }>();

    const handleFormSubmit = (data: { note: string }) => {
        onSubmit(data);
        reset();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Administrative Note"
            description="Keep track of specific preferences or issues for this customer."
            size="xl"
        >
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">
                        Note Content
                    </label>
                    <textarea
                        {...register('note', { required: 'Note content is required' })}
                        rows={4}
                        placeholder="e.g. Likes specific table, mentioned interest in upcoming event..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 transition-all resize-none"
                    />
                    {errors.note && (
                        <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.note.message}</p>
                    )}
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-2 px-6 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-all text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <Loader2 size={18} className="animate-spin text-white" />
                        ) : (
                            'Save Note'
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

