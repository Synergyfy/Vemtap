'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Mail, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PublicCustomerFormProps {
  isOpen: boolean;
  onSubmit: (customer: { name: string; phone: string; email?: string }) => void;
  onClose: () => void;
}

export default function PublicCustomerForm({ isOpen, onSubmit, onClose }: PublicCustomerFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const handleSubmit = () => {
    const newErrors: { name?: string; phone?: string } = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    onSubmit({ name: name.trim(), phone: phone.trim(), email: email.trim() || undefined });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
          >
            <div className="p-6 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-black text-slate-900">Your Details</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">We need your info to process the order</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-primary/5 rounded-lg text-slate-400 hover:text-primary transition-colors shrink-0 ml-4 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 pt-2 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Full Name *</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className={cn(
                      "w-full h-12 pl-10 pr-4 bg-gray-50 border rounded-xl font-bold text-sm outline-none transition-all",
                      errors.name ? "border-red-500" : "border-gray-200 focus:bg-white focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10"
                    )}
                  />
                </div>
                {errors.name && <p className="text-[10px] text-red-500 font-bold">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Phone Number *</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. +234 800 000 0000"
                    className={cn(
                      "w-full h-12 pl-10 pr-4 bg-gray-50 border rounded-xl font-bold text-sm outline-none transition-all",
                      errors.phone ? "border-red-500" : "border-gray-200 focus:bg-white focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10"
                    )}
                  />
                </div>
                {errors.phone && <p className="text-[10px] text-red-500 font-bold">{errors.phone}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. john@example.com"
                    className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:bg-white focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10 transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                className="w-full h-14 bg-[#066CF4] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all mt-2"
              >
                Continue to Order
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
