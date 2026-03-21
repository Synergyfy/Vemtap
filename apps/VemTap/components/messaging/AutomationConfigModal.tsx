'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Award, Clock, AlertCircle, Info, Check, FileText, Plus, Loader2 } from 'lucide-react';
import { useUpdateAutomation } from '@/services/messaging/hooks';
import { toast } from 'react-hot-toast';
import { useBusinessForms } from '@/services/business-forms/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { useBranches } from '@/services/branches/hooks';

interface AutomationConfigModalProps {
    template: any;
    rule: any;
    onClose: () => void;
}

const VARIABLES = [
    { label: 'Business Name', value: '{{business_name}}' },
    { label: 'Visitor Name', value: '{{visitor_name}}' },
    { label: 'Loyalty Points', value: '{{loyalty_points}}' },
    { label: 'Branch Name', value: '{{branch_name}}' },
    { label: 'Form Link', value: '{{form_link}}' },
];

export default function AutomationConfigModal({ template, rule, onClose }: AutomationConfigModalProps) {
    const updateMutation = useUpdateAutomation(rule?.id || '');
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const user = useAuthStore((state) => state.user);
    const { data: branches = [] } = useBranches();
    
    const branchScope = activeBranchId === 'all' ? null : (activeBranchId || user?.branchId || null);
    const { data: forms = [] } = useBusinessForms({
        branchId: branchScope || user?.branchId || branches[0]?.id || undefined,
        allBranches: !branchScope,
    });

    const publishedForms = forms.filter(f => f.isPublished);

    const [config, setConfig] = useState({
        message: rule?.actionConfig?.message || template.defaultMessage || `Hi {{visitor_name}}, welcome to {{business_name}}! 🎉`,
        points: rule?.actionConfig?.points || 50,
        delay: rule?.delaySeconds || 0,
        formId: rule?.actionConfig?.formId || '',
    });

    const handleSave = () => {
        if (!rule?.id) {
            toast.error('Please activate the automation first.');
            return;
        }

        updateMutation.mutate({
            actionConfig: {
                ...rule.actionConfig,
                message: config.message,
                points: config.points,
                formId: config.formId,
            },
            delaySeconds: config.delay,
        }, {
            onSuccess: () => {
                toast.success('Configuration saved!');
                onClose();
            }
        });
    };

    const insertVariable = (variable: string) => {
        setConfig({ ...config, message: config.message + ' ' + variable });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-text-main/40 backdrop-blur-md"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${template.bg} ${template.color}`}>
                            <template.icon size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-display font-black text-text-main">Configure {template.name}</h3>
                            <p className="text-xs text-text-secondary">Customize how this automation engages your customers.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
                        <X size={24} className="text-text-secondary" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10">
                    {/* Message Customization */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-black uppercase tracking-widest text-text-main flex items-center gap-2">
                                <MessageSquare size={14} className="text-primary" />
                                WhatsApp Message Text
                            </label>
                            <span className="text-[10px] font-bold text-text-secondary">
                                {config.message.length} characters
                            </span>
                        </div>

                        <div className="relative">
                            <textarea
                                value={config.message}
                                onChange={(e) => setConfig({ ...config, message: e.target.value })}
                                className="w-full h-40 p-6 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium text-sm leading-relaxed resize-none"
                                placeholder="Enter your message here..."
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {VARIABLES.map((v) => (
                                <button
                                    key={v.value}
                                    onClick={() => insertVariable(v.value)}
                                    className="px-3 py-1.5 bg-white border border-gray-100 rounded-full text-[10px] font-bold text-text-secondary hover:border-primary hover:text-primary transition-all flex items-center gap-1"
                                >
                                    <Plus size={10} />
                                    {v.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-text-secondary italic flex items-center gap-1">
                            <Info size={10} />
                            Variables will be replaced with actual values when the message is sent.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Loyalty Points */}
                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-widest text-text-main flex items-center gap-2">
                                <Award size={14} className="text-emerald-500" />
                                Loyalty Points Reward
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={config.points}
                                    onChange={(e) => setConfig({ ...config, points: parseInt(e.target.value) || 0 })}
                                    className="w-full h-14 pl-6 pr-14 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-black text-lg"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary uppercase tracking-widest">Points</span>
                            </div>
                        </div>

                        {/* Delay */}
                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-widest text-text-main flex items-center gap-2">
                                <Clock size={14} className="text-amber-500" />
                                Time Delay
                            </label>
                            <select
                                value={config.delay}
                                onChange={(e) => setConfig({ ...config, delay: parseInt(e.target.value) })}
                                className="w-full h-14 px-6 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 appearance-none font-bold text-sm cursor-pointer"
                            >
                                <option value={0}>Immediately</option>
                                <option value={3600}>After 1 Hour</option>
                                <option value={86400}>After 24 Hours</option>
                                <option value={259200}>After 3 Days</option>
                                <option value={604800}>After 7 Days</option>
                            </select>
                        </div>
                    </div>

                    {/* Form Selection */}
                    <div className="space-y-4 p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <FileText size={14} />
                                Attach Business Form
                            </label>
                            {config.formId && (
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">
                                    Linked
                                </span>
                            )}
                        </div>
                        
                        <div className="space-y-2">
                            <select
                                value={config.formId}
                                onChange={(e) => setConfig({ ...config, formId: e.target.value })}
                                className="w-full h-14 px-6 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 appearance-none font-bold text-sm cursor-pointer shadow-sm"
                            >
                                <option value="">No form attached</option>
                                {publishedForms.map((form) => (
                                    <option key={form.id} value={form.id}>
                                        {form.title}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[10px] text-text-secondary italic px-2">
                                When a form is selected, you can use the <strong className="text-primary font-bold">{"{{form_link}}"}</strong> variable in your message to direct customers to this form.
                            </p>
                        </div>
                    </div>

                    {!rule?.id && (
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                            <AlertCircle className="text-amber-500 shrink-0" size={20} />
                            <p className="text-xs text-amber-900 leading-relaxed">
                                <strong>Note:</strong> You need to enable this automation on the main dashboard before you can save changes.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-gray-50 flex gap-4 bg-gray-50/30">
                    <button
                        onClick={onClose}
                        className="flex-1 h-16 bg-white border border-gray-100 text-text-main font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-gray-50 transition-all"
                    >
                        Discard Changes
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={updateMutation.isPending || !rule?.id}
                        className="flex-[2] h-16 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                    >
                        {updateMutation.isPending ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                <Check size={20} />
                                Save Configuration
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
