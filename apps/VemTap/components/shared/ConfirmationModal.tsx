'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    isLoading = false
}: ConfirmationModalProps) {
    const variantColors = {
        danger: 'bg-red-500 hover:bg-red-600 shadow-red-100 text-white',
        warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-100 text-white',
        info: 'bg-primary hover:bg-primary-dark shadow-primary/10 text-white',
    };

    const iconColors = {
        danger: 'text-red-500 bg-red-50',
        warning: 'text-amber-500 bg-amber-50',
        info: 'text-primary bg-primary/5',
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${iconColors[variant]}`}>
                    <AlertTriangle size={32} />
                </div>
                
                <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">
                    {title}
                </h3>
                
                <p className="text-slate-500 font-medium leading-relaxed mb-8">
                    {message}
                </p>
                
                <div className="flex flex-col w-full gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`h-14 w-full rounded-xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${variantColors[variant]} active:scale-95 disabled:opacity-70 disabled:pointer-events-none`}
                    >
                        {isLoading && <Loader2 size={18} className="animate-spin" />}
                        {confirmText}
                    </button>
                    
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="h-14 w-full bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
