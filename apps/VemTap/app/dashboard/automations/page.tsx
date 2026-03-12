'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Users, Timer, Settings, Loader2 } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import {
    useAutomations,
    useCreateAutomation,
    useUpdateAutomation,
    useWhatsAppConnectionStatus,
    useAutomationPerformance
} from '@/services/messaging/hooks';
import {
    TriggerType,
    ActionType,
    AutomationRule
} from '@/services/messaging/types';
import AutomationConfigModal from '@/components/messaging/AutomationConfigModal';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';

const AUTOMATION_TEMPLATES = [
    {
        id: 'welcome',
        name: 'New Customer Welcome',
        description: 'Automatically greet new customers after their first NFC tap and offer a welcome bonus.',
        triggerType: TriggerType.FIRST_TAG,
        icon: Users,
        color: 'text-blue-600',
        bg: 'bg-blue-50'
    },
    {
        id: 'repeat',
        name: 'Repeat Visit Reward',
        description: 'Engage returning customers with special offers when they tap again.',
        triggerType: TriggerType.REPEAT_TAG,
        icon: Zap,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50'
    },
    {
        id: 'inactive',
        name: 'Inactive Customer Reminder',
        description: 'Win back customers who haven’t visited in 30 days with a personalized reminder.',
        triggerType: TriggerType.INACTIVE_CUSTOMER || 'INACTIVE_CUSTOMER',
        icon: Timer,
        color: 'text-amber-600',
        bg: 'bg-amber-50'
    }
];

export default function AutomationsPage() {
    const { user, activeBranchId } = useAuthStore();
    const { data: rules = [], isLoading } = useAutomations();
    const { data: connStatus } = useWhatsAppConnectionStatus();
    const { data: performance } = useAutomationPerformance();
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
                    <PageHeader
                        title="Automation Settings"
                        description="Activate and configure smart automations to grow your business automatically."
                    />
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-100 shadow-sm">
                            <div className={`w-2 h-2 rounded-full ${connStatus?.status === 'Connected' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                            <span className="text-[10px] font-black uppercase tracking-wider">
                                {connStatus?.status === 'Connected' ? 'WhatsApp Connected' : 'WhatsApp Disconnected'}
                            </span>
                        </div>
                        {user?.phone && (
                            <span className="text-[10px] font-bold text-text-secondary pr-2">
                                {user.phone}
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                    {AUTOMATION_TEMPLATES.map((template) => {
                        const rule = rules.find(r => r.triggerType === template.triggerType);
                        const isActive = rule?.isActive || false;

                        return (
                            <motion.div
                                key={template.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all flex flex-col h-full group" 
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-4 rounded-3xl ${template.bg} ${template.color} shadow-lg shadow-current/5 group-hover:scale-110 transition-transform`}>
                                        <template.icon size={28} />
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <TemplateToggle rule={rule} template={template} />
                                        <span className={`text-[10px] font-black uppercase tracking-wider mt-2 ${isActive ? 'text-emerald-500' : 'text-gray-400'}`}>
                                            {isActive ? 'Active' : 'Paused'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-xl font-display font-black text-text-main mb-3">{template.name}</h3>
                                    <p className="text-sm text-text-secondary leading-relaxed mb-6">
                                        {template.description}
                                    </p>
                                </div>

                                <button
                                    onClick={() => setSelectedTemplate({ ...template, ruleId: rule?.id })}
                                    className="w-full h-14 bg-gray-50 text-text-main font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-gray-100 hover:text-primary transition-all flex items-center justify-center gap-2 border border-gray-100"
                                >
                                    <Settings size={18} />
                                    Configure Automation
                                </button>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Performance Quick Look */}
                <div className="mt-12 bg-text-main rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                    <Zap className="absolute -right-8 -top-8 size-64 text-white/5 rotate-12" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div>
                            <h4 className="text-2xl font-display font-black mb-2">Automation Impact</h4>
                            <p className="text-white/60">Your active automations are boosting retention by <span className="text-emerald-400 font-black">+18%</span> this month.</p>
                        </div>
                        <div className="flex gap-12">
                            <div className="text-center">
                                <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">Messages</p>
                                <p className="text-3xl font-display font-black">{performance?.totalMessagesSent?.toLocaleString() || '0'}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">Engaged</p>
                                <p className="text-3xl font-display font-black">{performance?.totalReplies?.toLocaleString() || '0'}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">Loyalty Given</p>
                                <p className="text-3xl font-display font-black">{performance?.loyaltyPointsIssued?.toLocaleString() || '0'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {selectedTemplate && (
                        <AutomationConfigModal
                            template={selectedTemplate}
                            rule={rules.find(r => r.id === selectedTemplate.ruleId)}
                            onClose={() => setSelectedTemplate(null)}
                        />
                    )}
                </AnimatePresence>
            </div>
    );
}

function TemplateToggle({ rule, template }: { rule?: AutomationRule, template: any }) {
    const { user, activeBranchId } = useAuthStore();
    const createMutation = useCreateAutomation();
    const updateMutation = useUpdateAutomation(rule?.id || '');

    const handleToggle = () => {
        if (!rule) {
            // Create the rule if it doesn't exist
            if (!user?.businessId) return;
            createMutation.mutate({
                businessId: user.businessId,
                branchId: activeBranchId || undefined,
                name: template.name,
                triggerType: template.triggerType as any,
                actionType: ActionType.SEND_WHATSAPP,
                delaySeconds: 0,
                isActive: true,
                actionConfig: {}
            });
        } else {
            updateMutation.mutate({ isActive: !rule.isActive });
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`w-14 h-8 rounded-full relative transition-all ${rule?.isActive ? 'bg-emerald-500' : 'bg-gray-200'} ${isLoading ? 'opacity-50' : ''}`}
        >
            <motion.div
                animate={{ x: rule?.isActive ? 24 : 4 }}
                className="absolute top-1 size-6 bg-white rounded-full shadow-sm flex items-center justify-center"
            >
                {isLoading && <Loader2 className="animate-spin text-primary" size={12} />}
            </motion.div>
        </button>
    );
}


