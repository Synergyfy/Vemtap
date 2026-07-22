'use client';

import React from 'react';
import Modal from './Modal';
import { useConflictStore } from '@/store/useConflictStore';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ConflictModal() {
    const { isOpen, message, closeConflict } = useConflictStore();
    const router = useRouter();

    return (
        <Modal
            isOpen={isOpen}
            onClose={closeConflict}
            size="md"
        >
            <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle size={32} />
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    Already Exists
                </h3>
                
                <p className="text-slate-600 mb-8 leading-relaxed">
                    {message || "The email or phone number you provided already exists in our system. Please try a different one."}
                </p>

                <div className="w-full flex flex-col gap-3">
                    <button
                        onClick={closeConflict}
                        className="w-full py-3 px-4 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
                    >
                        Change Details
                    </button>
                    
                    <button
                        onClick={() => {
                            closeConflict();
                            router.push('/login');
                        }}
                        className="w-full py-3 px-4 bg-slate-50 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        Log In Instead
                    </button>
                </div>
            </div>
        </Modal>
    );
}
