'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, RefreshCw, Copy, CheckCircle2 } from 'lucide-react';
import { notify } from '@/lib/notify';

interface PasswordValidationProps {
    password: string;
    onSuggest?: (password: string) => void;
    showAlways?: boolean;
}

import { PASSWORD_REQUIREMENTS, checkRequirement, calculateStrength, suggestPassword } from '@/lib/utils';


export default function PasswordValidation({ password, onSuggest, showAlways = false }: PasswordValidationProps) {
    const [showRequirements, setShowRequirements] = useState(false);
    const strength = calculateStrength(password);

    const handleSuggest = () => {
        const suggested = suggestPassword();
        if (onSuggest) {
            onSuggest(suggested);
            notify.success('Strong password suggested');
        }
    };

    const isVisible = showAlways || showRequirements || password.length > 0;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={handleSuggest}
                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-hover flex items-center gap-1.5 transition-colors"
                >
                    <RefreshCw size={12} className="shrink-0" />
                    Suggest Strong Password
                </button>
            </div>

            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden"
                    >
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Strength: {strength.label}</span>
                                <span className="text-[10px] font-black text-text-main">{Math.round(strength.percentage)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <motion.div 
                                    className={`h-full ${strength.color}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${strength.percentage}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-1.5 p-3 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                            {PASSWORD_REQUIREMENTS.map((req, idx) => {
                                const isMet = checkRequirement(password, req.regex);
                                return (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className={`size-4 rounded-full flex items-center justify-center transition-all ${isMet ? 'bg-green-500 text-white shadow-sm shadow-green-200' : 'bg-gray-200 text-gray-400'}`}>
                                            {isMet ? <Check size={10} strokeWidth={3} /> : <span className="text-[10px] font-bold">×</span>}
                                        </div>
                                        <span className={`text-[10px] font-bold tracking-tight transition-colors ${isMet ? 'text-green-600' : 'text-text-secondary'}`}>
                                            {req.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
