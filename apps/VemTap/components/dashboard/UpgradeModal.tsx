'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import { Lock, Zap, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  description?: string;
}

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  featureName = 'this feature',
  description = 'Upgrade to a Premium plan to access this and other advanced growth tools.'
}: UpgradeModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} showClose={false}>
      <div className="p-8 text-center relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-text-secondary hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
          <Lock size={32} />
        </div>

        <h2 className="text-2xl font-display font-bold text-text-main mb-3">
          Unlock {featureName}
        </h2>
        <p className="text-text-secondary font-medium mb-8">
          {description}
        </p>

        <div className="space-y-4">
          <Link
            href="/dashboard/settings/subscription"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
          >
            <Zap size={18} />
            View Premium Plans
          </Link>

          <button
            onClick={() => {
                onClose();
                window.location.href = 'mailto:hello@vemtap.com?subject=Premium Trial Request';
            }}
            className="w-full flex items-center justify-center gap-2 h-12 bg-white border border-gray-200 text-text-main font-bold rounded-xl hover:bg-gray-50 transition-all"
          >
            Contact Sales for a Trial
            <ArrowRight size={16} />
          </button>
        </div>

        <p className="mt-6 text-[10px] text-text-secondary/60 font-medium uppercase tracking-widest">
            Available on Basic, Premium & Enterprise tiers
        </p>
      </div>
    </Modal>
  );
}
