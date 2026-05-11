"use client";

import React from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Zap, Users, Gift, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface AwardPointsConfirmationProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    programName: string;
    points: number;
    customerCount: number;
    isLoading: boolean;
}

export default function AwardPointsConfirmation({
    isOpen,
    onClose,
    onConfirm,
    programName,
    points,
    customerCount,
    isLoading
}: AwardPointsConfirmationProps) {
    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            size="md"
        >
            <div className="-m-8"> {/* Negative margin to counteract Modal's default padding for full-width header */}
                <div className="bg-primary/5 p-8 text-center border-b border-primary/10 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                    
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="size-20 bg-primary rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20 relative z-10"
                    >
                        <Zap size={36} className="text-white fill-white" />
                    </motion.div>
                    
                    <h2 className="text-2xl font-black text-gray-900 text-center mb-1">Confirm Award</h2>
                    <p className="text-gray-500 font-medium text-center">
                        You are about to issue loyalty points.
                    </p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                <Users size={12} /> Customers
                            </div>
                            <div className="text-xl font-black text-gray-900">{customerCount}</div>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                            <div className="flex items-center gap-2 text-xs font-bold text-yellow-600 uppercase tracking-wider mb-1">
                                <Zap size={12} /> Points Total
                            </div>
                            <div className="text-xl font-black text-yellow-700">{(points * customerCount).toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                <Gift size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Program Context</p>
                                <p className="text-sm font-bold text-gray-900">{programName}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs font-medium text-amber-700 leading-relaxed">
                                This action will immediately update the points balance for all selected customers. This cannot be undone automatically.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-0 flex flex-col sm:flex-row gap-3">
                    <Button 
                        variant="ghost" 
                        className="flex-1 h-14 rounded-2xl font-bold text-gray-500 hover:bg-gray-100"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : 'Confirm & Send'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
