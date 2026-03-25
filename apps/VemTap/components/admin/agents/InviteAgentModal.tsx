'use client';

import React, { useState } from 'react';
import { 
    User, Mail, Phone, Lock, ShieldCheck, 
    ArrowRight, ArrowLeft, Loader2, Eye, EyeOff, CheckCircle2
} from 'lucide-react';
import { cn, suggestPassword } from '@/lib/utils';
import PasswordValidation from '@/components/shared/PasswordValidation';

interface Permission {
    id: string;
    label: string;
    icon: any;
}

interface InviteAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInvite: (data: any) => Promise<void>;
    isSubmitting: boolean;
    permissions: Permission[];
}

export default function InviteAgentModal({ 
    isOpen, 
    onClose, 
    onInvite, 
    isSubmitting,
    permissions 
}: InviteAgentModalProps) {
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: suggestPassword(),
        permissions: ['admin:dashboard', 'admin:support'] as string[]
    });

    if (!isOpen) return null;

    const handleNext = () => setStep(s => Math.min(s + 1, 3));
    const handleBack = () => setStep(s => Math.max(s - 1, 1));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step < 3) {
            handleNext();
            return;
        }
        await onInvite(formData);
    };

    const isStepValid = () => {
        if (step === 1) return formData.name.trim().length > 0 && formData.email.includes('@');
        if (step === 2) return formData.password.length >= 8;
        return formData.permissions.length > 0;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                    <div 
                        className="h-full bg-primary transition-all duration-500" 
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                <div className="p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                    step === 1 ? "bg-primary/10 text-primary" : "bg-emerald-100 text-emerald-700"
                                )}>
                                    Step {step} of 3
                                </span>
                                {step > 1 && <CheckCircle2 size={12} className="text-emerald-500" />}
                            </div>
                            <h2 className="text-2xl font-display font-bold text-text-main">
                                {step === 1 && "Agent Profile"}
                                {step === 2 && "Security Credentials"}
                                {step === 3 && "Access Control"}
                            </h2>
                            <p className="text-sm text-text-secondary font-medium mt-1">
                                {step === 1 && "Basic information for the new support agent"}
                                {step === 2 && "Set a secure password for the agent account"}
                                {step === 3 && "Define specific areas this agent can manage"}
                            </p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                        >
                            <span className="material-icons-round">close</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Step 1: Identity */}
                        {step === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. John Smith"
                                            className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-4 focus:ring-primary/10 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="john@company.com"
                                            className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-4 focus:ring-primary/10 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Phone Number</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+234 801 234 5678"
                                            className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-4 focus:ring-primary/10 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Security */}
                        {step === 2 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Account Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary group-focus-within:text-primary transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full h-12 pl-11 pr-12 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-4 focus:ring-primary/10 focus:bg-white outline-none transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <PasswordValidation 
                                        password={formData.password}
                                        onSuggest={(p) => setFormData({ ...formData, password: p })}
                                        showAlways={true}
                                    />
                                </div>
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1">Security Note</p>
                                    <p className="text-[10px] text-amber-800 leading-tight">Agents will be required to change their password upon first login if your security policy enforces rotation.</p>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Permissions */}
                        {step === 3 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block">Permission Scope</label>
                                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200">
                                    {permissions.map((perm) => {
                                        const isSelected = formData.permissions.includes(perm.id);
                                        return (
                                            <button
                                                key={perm.id}
                                                type="button"
                                                onClick={() => {
                                                    const newPerms = isSelected
                                                        ? formData.permissions.filter(p => p !== perm.id)
                                                        : [...formData.permissions, perm.id];
                                                    setFormData({ ...formData, permissions: newPerms });
                                                }}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all",
                                                    isSelected 
                                                        ? "border-primary bg-primary/5 shadow-sm" 
                                                        : "border-gray-50 bg-gray-50/50 hover:border-gray-100"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0",
                                                    isSelected ? "bg-primary text-white" : "bg-white text-gray-400 border border-gray-100"
                                                )}>
                                                    <perm.icon size={16} />
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase tracking-tight line-clamp-1",
                                                    isSelected ? "text-primary" : "text-text-secondary"
                                                )}>
                                                    {perm.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-6 border-t border-gray-100">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="flex-1 h-14 bg-gray-100 text-text-secondary font-bold rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={18} />
                                    Back
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 h-14 bg-gray-100 text-text-secondary font-bold rounded-2xl hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                            )}
                            
                            <button
                                type="submit"
                                disabled={isSubmitting || !isStepValid()}
                                className="flex-[2] h-14 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        {step === 3 ? (
                                            <>
                                                <ShieldCheck size={20} />
                                                Confirm & Create
                                            </>
                                        ) : (
                                            <>
                                                Continue
                                                <ArrowRight size={20} />
                                            </>
                                        )}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
