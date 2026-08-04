'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/ui/Modal';
import { MessageSquare, AlertCircle, LifeBuoy } from 'lucide-react';

interface CreateTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TicketFormData) => void;
    isLoading?: boolean;
    userType: 'business' | 'customer';
}

export interface TicketFormData {
    subject: string;
    category: string;
    priority: string;
    description: string;
}

export default function CreateTicketModal({ isOpen, onClose, onSubmit, isLoading, userType }: CreateTicketModalProps) {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<TicketFormData>();

    const handleFormSubmit = (data: TicketFormData) => {
        onSubmit(data);
        reset();
    };

    const categories = userType === 'business' 
        ? ['Hardware Issue', 'Billing', 'Account Access', 'Feature Request', 'API/Integration', 'Other']
        : ['Points Inquiry', 'Redemption Issue', 'Account Privacy', 'Business Complaint', 'Feedback', 'Other'];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create Support Ticket"
            description="Tell us what's happening and our team will get back to you within 24 hours."
            size="2xl"
        >
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Subject */}
                    <div className="md:col-span-2 space-y-2">
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">
                            Subject
                        </label>
                        <input
                            {...register('subject', { required: 'Subject is required' })}
                            type="text"
                            placeholder="Briefly describe the issue"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 transition-all"
                        />
                        {errors.subject && (
                            <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.subject.message}</p>
                        )}
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">
                            Category
                        </label>
                        <select
                            {...register('category', { required: 'Category is required' })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Select category</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        {errors.category && (
                            <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.category.message}</p>
                        )}
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">
                            Urgency Level
                        </label>
                        <select
                            {...register('priority', { required: 'Priority is required' })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 transition-all appearance-none cursor-pointer"
                        >
                            <option value="Low">Low - General Inquiry</option>
                            <option value="Normal">Normal - Affecting Experience</option>
                            <option value="High">High - Critical Issue</option>
                            <option value="Urgent">Urgent - Service Down</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2 space-y-2">
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">
                            Detailed Description
                        </label>
                        <textarea
                            {...register('description', { required: 'Description is required' })}
                            rows={5}
                            placeholder="Provide as much detail as possible..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 transition-all resize-none"
                        />
                        {errors.description && (
                            <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.description.message}</p>
                        )}
                    </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all text-sm"
                    >
                        Discard
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-2 px-6 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-all text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <LifeBuoy size={18} />
                                Submit Ticket
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
