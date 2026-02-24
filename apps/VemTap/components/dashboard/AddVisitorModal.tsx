'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Branch } from '@/services/branches/types';

interface AddVisitorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: VisitorFormData) => void;
    isLoading?: boolean;
    branches?: Branch[];
    defaultBranchId?: string;
}

export interface VisitorFormData {
    name: string;
    email: string;
    phone: string;
    status: string;
    branchId: string;
}

import Modal from '@/components/ui/Modal';

export default function AddVisitorModal({ isOpen, onClose, onSubmit, isLoading, branches = [], defaultBranchId }: AddVisitorModalProps) {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<VisitorFormData>({
        defaultValues: {
            branchId: defaultBranchId
        }
    });

    const handleFormSubmit = (data: VisitorFormData) => {
        onSubmit(data);
        reset();
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Add New Visitor"
            description="Create a new customer profile manually in your database."
            size="2xl"
        >
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">
                            Full Name
                        </label>
                        <input
                            {...register('name', { required: 'Name is required' })}
                            type="text"
                            placeholder="e.g. John Doe"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 transition-all"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">
                            Email Address
                        </label>
                        <input
                            {...register('email', {
                                required: 'Email is required',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Invalid email address'
                                }
                            })}
                            type="email"
                            placeholder="visitor@example.com"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 transition-all"
                        />
                        {errors.email && (
                            <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">
                            Phone Number
                        </label>
                        <input
                            {...register('phone', { required: 'Phone is required' })}
                            type="tel"
                            placeholder="+234 800 000 0000"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 transition-all"
                        />
                        {errors.phone && (
                            <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.phone.message}</p>
                        )}
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">
                            Current Status
                        </label>
                        <select
                            {...register('status', { required: 'Status is required' })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Select status</option>
                            <option value="New">New Visitor</option>
                            <option value="Active">Active Regular</option>
                            <option value="Returning">Returning Customer</option>
                            <option value="VIP">VIP Client</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                        {errors.status && (
                            <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.status.message}</p>
                        )}
                    </div>

                    {/* Branch */}
                    <div className="space-y-2">
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">
                            Assign to Branch
                        </label>
                        <select
                            {...register('branchId', { required: 'Branch is required' })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Select branch</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                        </select>
                        {errors.branchId && (
                            <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.branchId.message}</p>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                    <p className="text-[11px] text-primary font-bold leading-relaxed">
                        Note: Adding a visitor manually will include them in your next automated message targeting their specific segment.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4 border-t border-slate-50">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all text-sm active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-2 px-6 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-all text-sm shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            'Confirm & Add Visitor'
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
