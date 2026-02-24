'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { toast } from 'react-hot-toast';
import {
    Zap, Plus, Trash2, Play, Pause, ChevronRight,
    MessageSquare, Mail, Star, Users, Award, Loader2
} from 'lucide-react';
import { Gift, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    useAutomations,
    useCreateAutomation,
    useUpdateAutomation,
    useDeleteAutomation
} from '@/services/messaging/hooks';
import {
    TriggerType,
    ActionType,
    AutomationRule
} from '@/services/messaging/types';
import { useAuthStore } from '@/store/useAuthStore';

const EVENT_OPTIONS = [
    { id: TriggerType.FIRST_TAG, label: 'First-time Tag', icon: Users, desc: 'When a new customer taps' },
    { id: TriggerType.REPEAT_TAG, label: 'Repeat Tag', icon: Zap, desc: 'When a returning customer taps' },
    { id: TriggerType.REWARD_EARNED, label: 'Reward Earned', icon: Award, desc: 'When loyalty threshold is reached' },
    { id: TriggerType.SURVEY_COMPLETED, label: 'Survey Completed', icon: MessageSquare, desc: 'When a survey is submitted' },
];

const ACTION_OPTIONS = [
    { id: ActionType.SEND_SMS, label: 'Send SMS', icon: MessageSquare, color: 'bg-blue-500' },
    { id: ActionType.SEND_WHATSAPP, label: 'Send WhatsApp', icon: MessageSquare, color: 'bg-emerald-500' },
    { id: ActionType.SEND_EMAIL, label: 'Send Email', icon: Mail, color: 'bg-purple-500' },
    { id: ActionType.PUSH_REVIEW, label: 'Push Review Link', icon: Star, color: 'bg-amber-500' },
];

const DELAY_OPTIONS = [
    { id: 'immediate', label: 'Immediately', seconds: 0 },
    { id: '1_hour', label: 'After 1 Hour', seconds: 3600 },
    { id: '24_hours', label: 'After 24 Hours', seconds: 86400 },
    { id: '3_days', label: 'After 3 Days', seconds: 259200 },
    { id: '7_days', label: 'After 7 Days', seconds: 604800 },
    { id: '30_days', label: 'After 30 Days', seconds: 2592000 },
];

export default function AutomationsPage() {
    const { user, activeBranchId } = useAuthStore();
    const { data: rules = [], isLoading } = useAutomations();

    const createMutation = useCreateAutomation();
    const deleteMutation = useDeleteAutomation();

    const [isAdding, setIsAdding] = useState(false);
    const [newRule, setNewRule] = useState({
        name: '',
        triggerType: TriggerType.FIRST_TAG,
        actionType: ActionType.SEND_SMS,
        delayId: 'immediate',
    });

    const addRule = () => {
        if (!newRule.name) {
            toast.error('Please enter a name for the automation');
            return;
        }

        if (!user?.businessId) return;

        const delay = DELAY_OPTIONS.find(d => d.id === newRule.delayId);

        createMutation.mutate({
            businessId: user.businessId,
            branchId: activeBranchId && activeBranchId !== 'all' ? activeBranchId : undefined,
            name: newRule.name,
            triggerType: newRule.triggerType,
            actionType: newRule.actionType,
            delaySeconds: delay?.seconds || 0,
            isActive: true,
            actionConfig: {}
        }, {
            onSuccess: () => {
                setIsAdding(false);
                setNewRule({
                    name: '',
                    triggerType: TriggerType.FIRST_TAG,
                    actionType: ActionType.SEND_SMS,
                    delayId: 'immediate',
                });
                toast.success('Automation rule created!');
            }
        });
    };

    const deleteRule = (id: string) => {
        if (confirm('Are you sure you want to delete this automation?')) {
            deleteMutation.mutate(id, {
                onSuccess: () => {
                    toast.success('Rule deleted');
                }
            });
        }
    };

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
                <PageHeader
                    title="Automation Rules"
                    description="Set up triggers to engage customers automatically without lifting a finger"
                />
                <button
                    onClick={() => setIsAdding(true)}
                    className="h-12 px-6 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-2"
                >
                    <Plus size={18} />
                    Create New Rule
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Rules List */}
                <div className="lg:col-span-2 space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {rules.map((rule) => {
                                const eventInfo = EVENT_OPTIONS.find(e => e.id === rule.triggerType);
                                const actionInfo = ACTION_OPTIONS.find(a => a.id === rule.actionType);
                                const delayInfo = DELAY_OPTIONS.find(d => d.seconds === rule.delaySeconds) || DELAY_OPTIONS[0];

                                return (
                                    <motion.div
                                        key={rule.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className={`bg-white rounded-lg border ${rule.isActive ? 'border-gray-200 shadow-sm' : 'border-gray-100 opacity-60'} p-6 transition-all`}
                                    >
                                        <div className="flex items-center justify-between gap-6">
                                            <div className="flex items-center gap-6 flex-1">
                                                <div className={`size-12 rounded-lg ${rule.isActive ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'} flex items-center justify-center shrink-0`}>
                                                    {eventInfo?.icon && <eventInfo.icon size={24} />}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-text-main flex items-center gap-2">
                                                        {rule.name}
                                                        {!rule.isActive && <span className="text-[8px] font-black uppercase tracking-widest bg-gray-200 text-text-secondary px-2 py-0.5 rounded">Paused</span>}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">If {eventInfo?.label}</span>
                                                        <ChevronRight size={12} className="text-gray-200" />
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${actionInfo?.color.replace('bg-', 'text-')}`}>Then {actionInfo?.label}</span>
                                                        <span className="text-[9px] font-bold text-gray-400 ml-2 italic">({delayInfo.label})</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <RuleToggle rule={rule} />
                                                <button
                                                    onClick={() => deleteRule(rule.id)}
                                                    className="size-10 rounded-lg bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}

                    {!isLoading && rules.length === 0 && (
                        <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <Zap size={48} className="mx-auto text-gray-200 mb-4" />
                            <p className="text-sm font-bold text-text-secondary">No automation rules yet</p>
                        </div>
                    )}
                </div>

                {/* Quick Stats / Guide */}
                <div className="space-y-6">
                    <div className="bg-text-main rounded-lg p-8 text-white relative overflow-hidden">
                        <Zap className="absolute -right-4 -top-4 size-32 text-white/5 rotate-12" />
                        <h4 className="text-lg font-black mb-4">Automation Success</h4>
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/60 font-medium">Messages Sent</span>
                                <span className="font-bold">1,284</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/60 font-medium">Review Clicks</span>
                                <span className="font-bold">142</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/60 font-medium">Capture Rate</span>
                                <span className="font-bold text-emerald-400">+12%</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-8">
                        <h4 className="text-xs font-black uppercase tracking-widest text-text-main mb-4">Popular Recipes</h4>
                        <div className="space-y-3">
                            {[
                                { label: 'Birthday Offer', icon: Gift },
                                { label: 'Lost Customer Flow', icon: Timer },
                                { label: 'VIP Welcome', icon: Star }
                            ].map((r, i) => (
                                <button key={i} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all text-left">
                                    <div className="size-8 rounded-md bg-gray-100 flex items-center justify-center text-text-secondary">
                                        <r.icon size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-text-secondary">{r.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Rule Modal */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAdding(false)}
                            className="absolute inset-0 bg-text-main/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white w-full max-w-lg rounded-lg shadow-2xl overflow-hidden"
                        >
                            <div className="p-8">
                                <h3 className="text-xl font-bold text-text-main mb-6">Create New Automation</h3>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Rule Name</label>
                                        <input
                                            type="text"
                                            value={newRule.name}
                                            onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                            placeholder="e.g. Welcome Message"
                                            className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">When this happens</label>
                                            <select
                                                value={newRule.triggerType}
                                                onChange={(e) => setNewRule({ ...newRule, triggerType: e.target.value as TriggerType })}
                                                className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none font-medium"
                                            >
                                                {EVENT_OPTIONS.map(opt => (
                                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Do this action</label>
                                            <select
                                                value={newRule.actionType}
                                                onChange={(e) => setNewRule({ ...newRule, actionType: e.target.value as ActionType })}
                                                className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none font-medium"
                                            >
                                                {ACTION_OPTIONS.map(opt => (
                                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Time Delay</label>
                                        <select
                                            value={newRule.delayId}
                                            onChange={(e) => setNewRule({ ...newRule, delayId: e.target.value })}
                                            className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none font-medium"
                                        >
                                            {DELAY_OPTIONS.map(opt => (
                                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            onClick={() => setIsAdding(false)}
                                            className="flex-1 h-12 bg-gray-50 text-text-secondary font-bold rounded-lg hover:bg-gray-100 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={addRule}
                                            disabled={createMutation.isPending}
                                            className="flex-1 h-12 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                                        >
                                            {createMutation.isPending ? 'Creating...' : 'Create Rule'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function RuleToggle({ rule }: { rule: AutomationRule }) {
    const updateMutation = useUpdateAutomation(rule.id);

    const handleToggle = () => {
        updateMutation.mutate({ isActive: !rule.isActive }, {
            onSuccess: () => {
                toast.success(`Rule ${!rule.isActive ? 'activated' : 'paused'}`);
            }
        });
    };

    return (
        <button
            onClick={handleToggle}
            disabled={updateMutation.isPending}
            className={`size-10 rounded-lg flex items-center justify-center transition-all ${rule.isActive ? 'bg-amber-50 text-amber-500 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100'} disabled:opacity-50`}
        >
            {updateMutation.isPending ? (
                <Loader2 className="animate-spin text-primary" size={18} />
            ) : rule.isActive ? (
                <Pause size={18} />
            ) : (
                <Play size={18} />
            )}
        </button>
    );
}
