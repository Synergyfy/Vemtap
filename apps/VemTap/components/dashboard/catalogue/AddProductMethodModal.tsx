'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Upload, Scan } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddProductMethodModalProps {
  isOpen: boolean;
  onSelectMethod: (method: 'manual' | 'bulk' | 'barcode') => void;
  onClose: () => void;
}

const methods = [
  {
    id: 'manual' as const,
    icon: FileText,
    title: 'Manual Entry',
    description: 'Fill in product details by hand using our step-by-step form',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-100',
    hoverBorderColor: 'hover:border-blue-300',
    gradient: 'from-blue-500/10 to-blue-600/5',
  },
  {
    id: 'bulk' as const,
    icon: Upload,
    title: 'Bulk Import',
    description: 'Import multiple products at once using a CSV or Excel file',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-100',
    hoverBorderColor: 'hover:border-emerald-300',
    gradient: 'from-emerald-500/10 to-emerald-600/5',
  },
  {
    id: 'barcode' as const,
    icon: Scan,
    title: 'Barcode Scan',
    description: 'Scan a product barcode to automatically fetch product details',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-100',
    hoverBorderColor: 'hover:border-amber-300',
    gradient: 'from-amber-500/10 to-amber-600/5',
  },
];

export default function AddProductMethodModal({ isOpen, onSelectMethod, onClose }: AddProductMethodModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
          >
            <div className="p-8 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-display font-black text-slate-900">Add Product</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Choose how you'd like to create your product</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-primary/5 rounded-lg text-slate-400 hover:text-primary transition-colors shrink-0 ml-4 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 pt-4 space-y-3">
              {methods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => onSelectMethod(method.id)}
                    className={cn(
                      "relative w-full p-5 rounded-2xl border-2 text-left transition-all group active:scale-[0.98] cursor-pointer overflow-hidden",
                      method.borderColor, method.hoverBorderColor, `bg-gradient-to-br ${method.gradient}`
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn("size-14 rounded-xl flex items-center justify-center shrink-0 border", method.bgColor, method.borderColor, "transition-transform group-hover:scale-110")}>
                        <Icon size={24} className={method.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-black text-gray-900">{method.title}</h4>
                        <p className="text-xs text-gray-500 font-medium mt-1">{method.description}</p>
                      </div>
                      <div className={cn("size-8 rounded-lg flex items-center justify-center shrink-0 border transition-all group-hover:bg-white", method.bgColor, method.borderColor)}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={method.color}>
                          <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
