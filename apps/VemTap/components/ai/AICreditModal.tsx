'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import { Coins, AlertTriangle } from 'lucide-react';

interface AICreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cost: number;
  remaining: number;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export default function AICreditModal({
  isOpen,
  onClose,
  onConfirm,
  cost,
  remaining,
  title = 'Confirm AI Analysis',
  description = 'This action will consume AI credits from your account.',
  isLoading = false,
}: AICreditModalProps) {
  const router = useRouter();
  const insufficient = remaining < cost;

  const handleConfirm = () => {
    if (insufficient) {
      router.push('/dashboard/settings/subscription');
    } else {
      onConfirm();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center">
        <div
          className={`size-16 rounded-2xl flex items-center justify-center mb-6 ${
            insufficient ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'
          }`}
        >
          {insufficient ? <AlertTriangle size={32} /> : <Coins size={32} />}
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">{description}</p>

        <div className="w-full bg-gray-50 rounded-2xl p-5 space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-600">Cost</span>
            <span className={`text-sm font-bold ${insufficient ? 'text-red-500' : 'text-gray-900'}`}>
              {cost} Credit{cost !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="h-px bg-gray-200" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-600">Remaining</span>
            <span className={`text-sm font-bold ${insufficient ? 'text-red-500' : 'text-emerald-600'}`}>
              {remaining} Credit{remaining !== 1 ? 's' : ''}
            </span>
          </div>
          {insufficient && (
            <p className="text-xs text-red-500 font-medium pt-1">
              Insufficient credits. Please upgrade your plan.
            </p>
          )}
        </div>

        <div className="flex flex-col w-full gap-3">
          <button
            onClick={handleConfirm}
            disabled={insufficient ? false : isLoading}
            className="h-14 w-full rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : insufficient ? (
              'Upgrade Plan'
            ) : (
              `Consume ${cost} Credit${cost !== 1 ? 's' : ''} & Continue`
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="h-14 w-full bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
