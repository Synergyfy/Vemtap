import React, { useState } from 'react';
import { Tag, X, Percent, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDiscount: (discount: { type: 'percentage' | 'fixed'; value: number } | null) => void;
  currentDiscount: { type: 'percentage' | 'fixed'; value: number } | null;
  subtotal: number;
}

export function DiscountModal({ isOpen, onClose, onApplyDiscount, currentDiscount, subtotal }: DiscountModalProps) {
  const [type, setType] = useState<'percentage' | 'fixed'>(currentDiscount?.type || 'percentage');
  const [value, setValue] = useState(currentDiscount?.value.toString() || '');

  if (!isOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      onApplyDiscount(null);
    } else {
      onApplyDiscount({ type, value: numValue });
    }
    onClose();
  };

  const handleRemove = () => {
    onApplyDiscount(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"  />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm relative overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-gray-900">Add Discount</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Apply to entire cart</p>
          </div>
          <button onClick={onClose} className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleApply} className="p-6 space-y-6">
          <div className="flex p-1 bg-gray-50 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('percentage')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                type === 'percentage' ? "bg-white text-[#066CF4] shadow-sm" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Percent size={14} />
              Percentage
            </button>
            <button
              type="button"
              onClick={() => setType('fixed')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                type === 'fixed' ? "bg-white text-[#066CF4] shadow-sm" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Hash size={14} />
              Fixed Amount
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
              Discount {type === 'percentage' ? 'Percentage (%)' : 'Amount (₦)'}
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                {type === 'percentage' ? <Percent size={18} /> : <span className="font-bold">₦</span>}
              </div>
              <input 
                type="number" 
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={type === 'percentage' ? 'e.g. 10' : 'e.g. 1500'} 
                min="0"
                max={type === 'percentage' ? "100" : subtotal.toString()}
                step="any"
                className="w-full h-14 pl-12 pr-4 rounded-2xl border border-gray-200 text-lg font-black focus:outline-none focus:border-[#066CF4] focus:ring-4 focus:ring-[#066CF4]/10 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {currentDiscount && (
              <button 
                type="button"
                onClick={handleRemove}
                className="h-14 px-6 bg-red-50 text-red-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
              >
                Remove
              </button>
            )}
            <button 
              type="submit"
              disabled={!value || parseFloat(value) <= 0}
              className="flex-1 h-14 bg-[#066CF4] text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-600 disabled:opacity-50 disabled:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Tag size={16} />
              Apply Discount
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
