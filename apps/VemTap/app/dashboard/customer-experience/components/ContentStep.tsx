'use client';

import React, { useState, useEffect } from 'react';
import { Type, Save, Loader2, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useBranch, useUpdateBranch } from '@/services/branches/hooks';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export function ContentStep() {
    const { activeBranchId } = useActiveBranch();
    const { data: branch, isLoading: branchLoading } = useBranch(activeBranchId || '');
    
    const { updateEngagementSettings, engagementSettings } = useCustomerFlowStore();
    const updateBranchMutation = useUpdateBranch();
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!activeBranchId) return;
        setIsSaving(true);
        try {
            await updateBranchMutation.mutateAsync({
                id: activeBranchId,
                updates: {
                    engagement: engagementSettings
                }
            });
            toast.success('Content settings saved successfully');
        } catch (error) {
            console.error('Failed to save content', error);
            toast.error('Failed to save content settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Text & Messaging</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Customize the wording on your visitor portals</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving || branchLoading}
                    className="h-10 px-6 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Content
                </button>
            </div>

            <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 p-8 space-y-8">
                {/* Default Form (Check-in) Settings */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="size-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Type size={16} />
                        </div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">New Visitor Form (Check-In)</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Welcome Tag (Pre-title)</label>
                            <input 
                                type="text"
                                value={engagementSettings.customWelcomeTag || ''}
                                onChange={(e) => updateEngagementSettings({ customWelcomeTag: e.target.value })}
                                placeholder="e.g. Welcome to"
                                className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 ring-primary/20 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Welcome Title</label>
                            <input 
                                type="text"
                                value={engagementSettings.customWelcomeTitle || ''}
                                onChange={(e) => updateEngagementSettings({ customWelcomeTitle: e.target.value })}
                                placeholder="e.g. Synergyfy Global"
                                className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 ring-primary/20 transition-all"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Welcome Message (Subtitle)</label>
                            <input 
                                type="text"
                                value={engagementSettings.customWelcomeMessage || ''}
                                onChange={(e) => updateEngagementSettings({ customWelcomeMessage: e.target.value })}
                                placeholder="e.g. Please check in to get started"
                                className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 ring-primary/20 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Submit Button Label</label>
                            <input 
                                type="text"
                                value={engagementSettings.submitLabel || ''}
                                onChange={(e) => updateEngagementSettings({ submitLabel: e.target.value })}
                                placeholder="e.g. Continue"
                                className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 ring-primary/20 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Privacy Message</label>
                            <input 
                                type="text"
                                value={engagementSettings.customPrivacyMessage || ''}
                                onChange={(e) => updateEngagementSettings({ customPrivacyMessage: e.target.value })}
                                placeholder="e.g. We respect your privacy"
                                className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 ring-primary/20 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="w-full h-px bg-slate-200" />

                {/* Default Success Settings */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="size-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 size={16} />
                        </div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Goal Screen (Success)</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Success Title</label>
                            <input 
                                type="text"
                                value={engagementSettings.customSuccessTitle || ''}
                                onChange={(e) => updateEngagementSettings({ customSuccessTitle: e.target.value })}
                                placeholder="e.g. You're all set!"
                                className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 ring-primary/20 transition-all"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Success Message</label>
                            <textarea 
                                value={engagementSettings.customSuccessMessage || ''}
                                onChange={(e) => updateEngagementSettings({ customSuccessMessage: e.target.value })}
                                placeholder="e.g. Thanks for checking in today."
                                rows={3}
                                className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 ring-primary/20 transition-all resize-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
