'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePosStore } from '@/store/usePosStore';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Lock, Unlock, Banknote, Calculator, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function RegisterManagementScreen() {
  const router = useRouter();
  const { isRegisterOpen, registerOpenedAt, openingCash, openRegister, closeRegister, getTodaysSales } = usePosStore();
  
  const [openingAmount, setOpeningAmount] = useState('50000');
  
  // For closing
  const [actualCash, setActualCash] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [closeReport, setCloseReport] = useState<{ expectedCash: number; totalSales: number; transactionCount: number } | null>(null);

  // Auto update expected cash logic
  const todaySales = getTodaysSales();
  const cashSalesTotal = todaySales.filter(s => s.payment.method === 'cash').reduce((acc, s) => acc + s.total, 0);
  const expectedCashAmount = openingCash + cashSalesTotal;

  const handleOpen = () => {
    openRegister(Number(openingAmount));
    router.push('/dashboard/pos');
  };

  const handleClose = () => {
    if (actualCash === '') return;
    const report = closeRegister();
    setCloseReport(report);
    setIsClosing(true);
  };

  if (isClosing && closeReport) {
    const variance = Number(actualCash) - closeReport.expectedCash;
    
    return (
      <div className="max-w-2xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0">
        <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm flex flex-col items-center text-center mt-12">
          <div className="size-20 bg-gray-900 rounded-[24px] flex items-center justify-center mb-6 shadow-xl shadow-gray-900/20">
            <Lock size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Register Closed</h2>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-8">Shift ended successfully</p>

          <div className="w-full space-y-4 mb-8">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total Sales</span>
              <span className="text-lg font-black text-gray-900">₦{closeReport.totalSales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Transactions</span>
              <span className="text-lg font-black text-gray-900">{closeReport.transactionCount}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Expected Cash</span>
              <span className="text-lg font-black text-gray-900">₦{closeReport.expectedCash.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Counted Cash</span>
              <span className="text-lg font-black text-gray-900">₦{Number(actualCash).toLocaleString()}</span>
            </div>
            <div className={cn("flex justify-between items-center p-4 rounded-2xl border-2", variance === 0 ? "border-emerald-200 bg-emerald-50 text-emerald-600" : variance < 0 ? "border-red-200 bg-red-50 text-red-600" : "border-amber-200 bg-amber-50 text-amber-600")}>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cash Variance</span>
              <span className="text-xl font-black">{variance > 0 ? '+' : ''}{variance.toLocaleString()}</span>
            </div>
          </div>

          <button onClick={() => router.push('/dashboard/pos')} className="w-full h-14 bg-gray-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!isRegisterOpen) {
    return (
      <div className="max-w-md mx-auto h-full flex flex-col justify-center px-4 md:px-0">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-xl flex flex-col items-center text-center">
          <div className="size-20 bg-emerald-50 text-emerald-500 rounded-[24px] flex items-center justify-center mb-6">
            <Unlock size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Open Register</h2>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-8 leading-relaxed">
            Enter the starting cash amount (float) in the drawer to begin the shift.
          </p>

          <div className="w-full text-left mb-8">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Opening Cash Float</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-gray-400">₦</span>
              <input
                type="number" value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)}
                className="w-full h-16 pl-10 pr-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 text-2xl font-black text-emerald-700 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>
          </div>

          <button onClick={handleOpen} className="w-full h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 hover:bg-emerald-600 transition-all active:scale-95">
            <Unlock size={20} />
            <span className="text-[12px] font-black uppercase tracking-widest">Open Shift</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader 
        title="Register Management" 
        subtitle="Manage the current cash drawer shift"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Col - Status */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="size-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                <Unlock size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900">Register is Open</h3>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Since {new Date(registerOpenedAt!).toLocaleTimeString()}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Opening Float</span>
                <span className="text-sm font-bold text-gray-900">₦{openingCash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Cash Sales</span>
                <span className="text-sm font-bold text-emerald-500">+₦{cashSalesTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Expected Cash in Drawer</span>
                <span className="text-xl font-black text-[#066CF4]">₦{expectedCashAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 text-white border border-gray-800 rounded-[32px] p-6 shadow-xl shadow-gray-900/10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors">
                <Banknote size={20} className="text-gray-300" />
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">Cash Drop</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors">
                <FileText size={20} className="text-gray-300" />
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">Print Z-Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col - Close Form */}
        <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-black text-gray-900 mb-2">Close Register</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Count the physical cash in the drawer to close the shift.</p>

          <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 mb-8">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-3">Actual Cash Counted (₦)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-blue-400">₦</span>
              <input
                type="number" value={actualCash} onChange={(e) => setActualCash(e.target.value)}
                className="w-full h-16 pl-10 pr-4 rounded-2xl border-2 border-blue-200 bg-white text-2xl font-black text-gray-900 focus:outline-none focus:border-[#066CF4]"
                placeholder="0"
              />
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={actualCash === ''}
            className={cn(
              "w-full h-16 mt-auto rounded-2xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] transition-all shadow-xl",
              actualCash !== '' 
                ? "bg-red-500 text-white shadow-red-500/25 hover:bg-red-600 active:scale-95" 
                : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
            )}
          >
            <Lock size={18} />
            Close Shift & Print Summary
          </button>
        </div>
      </div>
    </div>
  );
}
