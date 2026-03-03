import React from 'react';
import Modal from '@/components/ui/Modal';
import { AlertCircle, Loader2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    isLoading?: boolean;
}

export default function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    isLoading = false
}: DeleteConfirmationModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={description}
            size="sm"
        >
            <div className="flex flex-col items-center pt-4">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle size={32} />
                </div>

                <div className="flex w-full gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 h-12 border border-gray-100 text-slate-600 font-bold rounded-xl hover:bg-gray-50 transition-all text-sm uppercase tracking-wider"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 h-12 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

