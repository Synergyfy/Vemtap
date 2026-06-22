'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, ClipboardCheck } from 'lucide-react';
import { useBranches } from '@/services/branches/hooks';
import type { Branch } from '@/services/branches/types';
import { useCreateCountSession } from '@/services/inventory-counting/hooks';

interface NewCountSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (sessionId: string) => void;
}

export default function NewCountSessionModal({
  isOpen,
  onClose,
  onCreated,
}: NewCountSessionModalProps) {
  const { data: branches = [] } = useBranches();
  const createSession = useCreateCountSession();

  const [branchId, setBranchId] = useState('');
  const [isBlind, setIsBlind] = useState(true);
  const [zone, setZone] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) return;

    const result = await createSession.mutateAsync({
      branchId,
      isBlind,
      zone: zone || undefined,
      notes: notes || undefined,
    });

    onCreated(result.id);
    onClose();
    setBranchId('');
    setZone('');
    setNotes('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-[32px] shadow-2xl p-6 md:p-8 w-full max-w-lg border border-gray-100"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 size-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="size-14 rounded-[20px] bg-blue-50 flex items-center justify-center mb-4 border border-blue-100">
              <ClipboardCheck size={28} className="text-[#066CF4]" />
            </div>

            <h2 className="text-xl font-black text-gray-900 mb-1">New Count Session</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">
              Start a physical stock count
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                  Branch
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  required
                  className="w-full h-12 px-4 rounded-2xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10 bg-white"
                >
                  <option value="">Select a branch</option>
                  {branches.map((b: Branch) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3">
                  {isBlind ? (
                    <EyeOff size={20} className="text-[#066CF4]" />
                  ) : (
                    <Eye size={20} className="text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-black text-gray-900">Blind Count</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                      Staff won&apos;t see system quantities
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBlind(!isBlind)}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    isBlind ? 'bg-[#066CF4]' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition-transform ${
                      isBlind ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                  Zone / Area (optional)
                </label>
                <input
                  type="text"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  placeholder="e.g. Aisle 3, Back storage"
                  className="w-full h-12 px-4 rounded-2xl border border-gray-200 text-sm font-bold placeholder:font-medium focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any notes about this count session"
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-bold placeholder:font-medium focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!branchId || createSession.isPending}
                className="w-full h-14 rounded-2xl bg-[#066CF4] text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createSession.isPending ? 'Creating...' : 'Create Count Session'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
