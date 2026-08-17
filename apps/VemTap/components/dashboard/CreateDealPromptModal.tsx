'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Tag, ArrowRight, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface CreateDealPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateDealPromptModal({ isOpen, onClose }: CreateDealPromptModalProps) {
    const router = useRouter();

    const handleCreate = () => {
        onClose();
        router.push('/dashboard/discovery/deals');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm" showClose={false}>
            <div className="text-center p-2">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 size-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                >
                    <X size={16} />
                </button>

                <div className="mx-auto size-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-5">
                    <Tag size={28} className="text-orange-500" />
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Create Your First Deal
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-[260px] mx-auto">
                    Deals help you attract new customers and bring them back again. Set up your first offer to get started.
                </p>

                <button
                    onClick={handleCreate}
                    className="w-full h-12 rounded-xl bg-[#066CF4] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                >
                    Create a Deal
                    <ArrowRight size={16} />
                </button>

                <button
                    onClick={onClose}
                    className="w-full h-12 rounded-xl bg-gray-50 text-gray-500 text-sm font-semibold mt-2 hover:bg-gray-100 transition-colors"
                >
                    Maybe Later
                </button>
            </div>
        </Modal>
    );
}
