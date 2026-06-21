'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useCustomerStore } from '@/store/useCustomerStore';
import { toast } from 'react-hot-toast';
import { UserPlus, Save, Loader2 } from 'lucide-react';

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CustomerModal({ isOpen, onClose }: CustomerModalProps) {
    const { addCustomer } = useCustomerStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            if (!formData.name) {
                toast.error('Name is required');
                setIsSubmitting(false);
                return;
            }

            addCustomer({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                tags: []
            });

            toast.success('Customer added successfully!');
            onClose();
            setFormData({ name: '', email: '', phone: '' });
        } catch (error) {
            toast.error('Failed to add customer');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Customer" size="md">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Full Name *</label>
                        <input 
                            type="text" 
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:bg-white focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/20 transition-all"
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Phone Number</label>
                        <input 
                            type="tel" 
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:bg-white focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/20 transition-all"
                            placeholder="+234 800 000 0000"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Email Address</label>
                        <input 
                            type="email" 
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:bg-white focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/20 transition-all"
                            placeholder="john@example.com"
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="flex-1 h-12 bg-gray-50 text-gray-500 font-bold text-sm rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 h-12 bg-[#066CF4] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Customer
                    </button>
                </div>
            </form>
        </Modal>
    );
}
