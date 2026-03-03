'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Plus, Send, Calendar, Clock, Edit, Loader2 } from 'lucide-react';
import { Message } from '@/lib/store/mockDashboardStore';
import Modal from '@/components/ui/Modal';

interface CreateMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    isLoading: boolean;
    initialData?: Partial<Message> | null;
    isEditing?: boolean;
}

export default function CreateMessageModal({ isOpen, onClose, onSubmit, isLoading, initialData, isEditing = false }: CreateMessageModalProps) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: initialData ? {
            name: initialData.name,
            type: initialData.type,
            audience: initialData.audience,
            status: initialData.status,
            content: initialData.content,
        } : {
            type: 'WhatsApp',
            audience: 'All Customers',
            status: 'Active',
            content: '',
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
            title={isEditing ? 'Edit Message' : 'Create Message'}
            description={isEditing ? 'Update your message details' : 'Reach your customers with targeted messaging'}
            size="lg"
        >
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Message Name</label>
                    <input
                        {...register('name', { required: 'Name is required' })}
                        placeholder="e.g. Weekend Flash Sale"
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-bold text-sm"
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1 ml-1 font-bold">{errors.name.message as string}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Channel</label>
                        <select
                            {...register('type')}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-bold text-sm appearance-none cursor-pointer"
                        >
                            <option value="WhatsApp">WhatsApp</option>
                            <option value="SMS">SMS</option>
                            <option value="Email">Email</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Status</label>
                        <select
                            {...register('status')}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-bold text-sm appearance-none cursor-pointer"
                        >
                            <option value="Active">Send Now (Active)</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Draft">Draft</option>
                            <option value="Recurring">Recurring</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Target Audience</label>
                    <select
                        {...register('audience')}
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all font-bold text-sm appearance-none cursor-pointer"
                    >
                        <option value="All Customers">All Customers</option>
                        <option value="New Customers">New Customers Only</option>
                        <option value="Frequent Visitors">Frequent Visitors (3+ visits)</option>
                        <option value="Inactive Customers">Inactive (30+ days)</option>
                        <option value="VIP Members">VIP Members Only</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Message Content</label>
                    <textarea
                        {...register('content', { required: 'Message content is required' })}
                        placeholder="Hi {name}, welcome to our store..."
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
                                {isEditing ? <Edit size={20} /> : <Plus size={20} />}
                                {isEditing ? 'Update Message' : 'Create Message'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

