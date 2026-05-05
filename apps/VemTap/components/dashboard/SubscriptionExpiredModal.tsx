'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import { AlertCircle, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionExpiredModalProps {
  isOpen: boolean;
}

export default function SubscriptionExpiredModal({ 
  isOpen
}: SubscriptionExpiredModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={() => {}} showClose={false}>
      <div className="p-8 text-center relative">
        <div className="size-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-6">
          <AlertCircle size={32} />
        </div>

        <h2 className="text-2xl font-headline font-bold text-slate-900 mb-3">
          Subscription Expired
        </h2>
        <p className="text-slate-500 font-medium mb-8">
          Your current plan has expired. To continue using our services and access your dashboard, please renew your subscription or select a new plan.
        </p>

        <div className="space-y-4">
          <Link
            href="/dashboard/settings/subscription"
            className="w-full flex items-center justify-center gap-2 h-14 bg-red-600 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-200"
          >
            <Zap size={18} />
            Renew Subscription
          </Link>

          <Link
            href="/dashboard/settings/subscription"
            className="w-full flex items-center justify-center gap-2 h-14 bg-white border-2 border-slate-100 text-slate-900 font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-slate-50 transition-all"
          >
            Select a Different Plan
            <ArrowRight size={16} />
          </Link>
        </div>

        <p className="mt-8 text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] leading-relaxed">
            Your data is safe. Simply renew to resume all business activities.
        </p>
      </div>
    </Modal>
  );
}
