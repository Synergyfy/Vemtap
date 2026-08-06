'use client';

import React, { useState, useMemo } from 'react';
import { Layers, Plus, Save, Loader2, GripVertical, FileText, Gift, Info, Star, ChevronDown, CheckCircle2, LayoutTemplate, ShoppingBag, Calendar, MessageCircle, ClipboardList, Share2, Link2 } from 'lucide-react';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useBusinessForms } from '@/services/business-forms/hooks';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useUpdateBranch } from '@/services/branches/hooks';
import { toast } from 'react-hot-toast';
import DraggableButtonList from '@/components/dashboard/engagement/DraggableButtonList';
import { cn } from '@/lib/utils';

interface SequenceStepProps {
    branchId?: string;
}

export function SequenceStep({ branchId }: SequenceStepProps) {
    const { engagementSettings, updateEngagementSettings } = useCustomerFlowStore();
    const { activeBranchId } = useActiveBranch();
    const resolvedBranchId = branchId || activeBranchId || undefined;
    
    const { data: allForms = [], isLoading: formsLoading } = useBusinessForms({ branchId: resolvedBranchId });
    const updateBranchMutation = useUpdateBranch();
    const [isSaving, setIsSaving] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
        core: false,
        forms: false,
        rewards: false,
        qrcodes: false
    });

    const toggleSection = (section: string) => {
        setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const { data: qrCodes = [], isLoading: qrLoading } = useQuery<any[]>({
        queryKey: ['qr-thrive-codes', resolvedBranchId],
        queryFn: async () => {
            const response = await api.get(`/qr-thrive/branches/${resolvedBranchId}/qr-codes`);
            return response?.data || response || [];
        },
        enabled: !!resolvedBranchId
    });

    const { data: rewards = [], isLoading: rewardsLoading } = useQuery<any[]>({
        queryKey: ['loyalty-rewards', resolvedBranchId],
        queryFn: async () => {
            const response = await api.get(`/loyalty/rewards/branches/${resolvedBranchId}`);
            return response?.data || response || [];
        },
        enabled: !!resolvedBranchId
    });

    const defaultSequence = useMemo(() => [
        'system:order',
        'system:service',
        'system:offers',
        'system:whatsapp',
        'system:forms',
        ...qrCodes.map(q => q.id),
        'system:engagement'
    ], [qrCodes]);

    const sequenceIds = engagementSettings.ublSequence && engagementSettings.ublSequence.length > 0 
        ? engagementSettings.ublSequence 
        : defaultSequence;

    const sequenceItems = sequenceIds.map((id, idx) => {
        const customTitle = engagementSettings.ublSequenceLabels?.[id];
        
        if (id === 'loyalty') return { id: 'loyalty', title: customTitle || 'Join Loyalty', subtitle: 'REWARDS SYSTEM', icon: <Gift size={12} className="text-emerald-500" /> };
        if (id === 'google_review') return { id: 'google_review', title: customTitle || 'Google Review', subtitle: 'REPUTATION', icon: <Star size={12} className="text-amber-500" /> };
        
        if (id === 'system:order') return { id, title: customTitle || 'Place Order', subtitle: 'CORE ACTION', icon: <ShoppingBag size={12} className="text-orange-500" /> };
        if (id === 'system:service') return { id, title: customTitle || 'Book Service', subtitle: 'CORE ACTION', icon: <Calendar size={12} className="text-blue-500" /> };
        if (id === 'system:offers') return { id, title: customTitle || 'See Offers', subtitle: 'CORE ACTION', icon: <Gift size={12} className="text-emerald-500" /> };
        if (id === 'system:whatsapp') return { id, title: customTitle || 'WhatsApp', subtitle: 'CORE ACTION', icon: <MessageCircle size={12} className="text-green-500" /> };
        if (id === 'system:forms') return { id, title: customTitle || 'Fill Feedback', subtitle: 'CORE ACTION', icon: <ClipboardList size={12} className="text-purple-500" /> };
        if (id === 'system:engagement') return { id, title: customTitle || 'Social Connect', subtitle: 'CORE ACTION', icon: <Share2 size={12} className="text-pink-500" /> };
        
        const reward = rewards.find(r => r.id === id);
        if (reward) return {
            id,
            title: customTitle || reward.name || 'Reward',
            subtitle: 'REWARD',
            icon: <Gift size={12} className="text-emerald-500" />
        };
        
        const qr = qrCodes.find(q => q.id === id);
        if (qr) return {
            id,
            title: customTitle || qr.name || 'QR Code',
            subtitle: qr.type?.toUpperCase() || 'QR',
            icon: qr.type === 'pdf' ? <FileText size={12} className="text-blue-500" /> : 
                  <Link2 size={12} className="text-blue-500" />
        };

        const form = allForms.find(f => f.id === id);
        return {
            id,
            title: customTitle || form?.title || 'Unknown Item',
            subtitle: form ? 'CUSTOM FORM' : 'ADDITIONAL ITEM',
            icon: <FileText size={12} className="text-blue-500" />
        };
    }).filter(item => item.id === 'loyalty' || item.id === 'google_review' || item.id.startsWith('system:') || allForms.some(f => f.id === item.id) || rewards.some(r => r.id === item.id) || qrCodes.some(q => q.id === item.id) || !item.title.includes('Unknown'));

    const availableForms = allForms.filter(f => !sequenceIds.includes(f.id));
    const availableRewards = rewards.filter(r => !sequenceIds.includes(r.id));
    const availableQrCodes = qrCodes.filter(q => !sequenceIds.includes(q.id));

    const handleReorder = (sourceIndex: number, targetIndex: number) => {
        const newSequence = [...sequenceIds];
        const [removed] = newSequence.splice(sourceIndex, 1);
        newSequence.splice(targetIndex, 0, removed);
        updateEngagementSettings({ ublSequence: newSequence });
    };

    const handleRemove = (id: string) => {
        const newSequence = sequenceIds.filter(sid => sid !== id);
        updateEngagementSettings({ ublSequence: newSequence });
    };

    const handleRename = (id: string, newTitle: string) => {
        const currentLabels = engagementSettings.ublSequenceLabels || {};
        updateEngagementSettings({ 
            ublSequenceLabels: {
                ...currentLabels,
                [id]: newTitle
            }
        });
    };

    const handleAdd = (id: string) => {
        if (sequenceIds.includes(id)) return;
        updateEngagementSettings({ ublSequence: [...sequenceIds, id] });
    };

    const handleSave = async () => {
        if (!resolvedBranchId) return;
        setIsSaving(true);
        try {
            await updateBranchMutation.mutateAsync({
                id: resolvedBranchId,
                updates: {
                    engagement: {
                        ...engagementSettings,
                        ublSequence: sequenceIds
                    }
                }
            });
            toast.success("Your customer journey is ready. Every step brings them closer to coming back.");
        } catch (error) {
            console.error('Failed to save sequence', error);
            toast.error('Failed to save sequence flow');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Active Sequence</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Drag to reorder the customer journey steps</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-10 px-6 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Flow
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Active Sequence List */}
                <div className="space-y-4">
                    <div className="bg-slate-50 rounded-[2rem] border border-slate-100 p-6 min-h-[300px]">
                        {sequenceItems.length > 0 ? (
                            <DraggableButtonList 
                                items={sequenceItems} 
                                onReorder={handleReorder} 
                                onRemove={handleRemove} 
                                onRename={handleRename}
                            />
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center text-center">
                                <LayoutTemplate size={48} className="text-slate-200 mb-4" />
                                <p className="text-sm font-bold text-slate-400">Your sequence is empty</p>
                                <p className="text-xs text-slate-400 max-w-[200px] mt-1">Add items from the library to build your flow.</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                        <Info size={16} className="text-blue-500 shrink-0" />
                        <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                            The sequence starts <span className="font-bold underline">after</span> the initial check-in form. Customers will see these items in the exact order shown here.
                        </p>
                    </div>
                </div>

                {/* Available Items Library */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Flow Library</h3>
                    
                    <div className="grid grid-cols-1 gap-3">
                        {/* Core Actions */}
                        <div className="pt-2">
                             <button onClick={() => toggleSection('core')} className="flex items-center justify-between w-full px-2 mb-3">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Core Actions</p>
                                 <ChevronDown size={14} className={cn("text-slate-400 transition-transform", collapsedSections.core && "rotate-180")} />
                             </button>
                             
                             <div className={cn("grid grid-cols-1 gap-3 overflow-hidden transition-all", collapsedSections.core ? "h-0 opacity-0" : "h-auto opacity-100")}>
                                {!sequenceIds.includes('loyalty') && (
                                    <button 
                                        onClick={() => handleAdd('loyalty')}
                                        className="flex items-center justify-between p-4 bg-white rounded-2xl border border-emerald-100 hover:border-emerald-500 hover:shadow-lg transition-all group"
                                    >
                                        <div className="flex items-center gap-3 text-left">
                                            <div className="size-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                                <Gift size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 leading-none mb-1">Join Loyalty</p>
                                                <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">Rewards System</p>
                                            </div>
                                        </div>
                                        <Plus size={18} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                    </button>
                                )}

                                {!sequenceIds.includes('google_review') && (
                                    <button 
                                        onClick={() => handleAdd('google_review')}
                                        className="flex items-center justify-between p-4 bg-white rounded-2xl border border-amber-100 hover:border-amber-500 hover:shadow-lg transition-all group"
                                    >
                                        <div className="flex items-center gap-3 text-left">
                                            <div className="size-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                                                <Star size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 leading-none mb-1">Google Review</p>
                                                <p className="text-[9px] text-amber-600 font-black uppercase tracking-widest">Reputation</p>
                                            </div>
                                        </div>
                                        <Plus size={18} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
                                    </button>
                                )}

                                {[
                                    { id: 'system:order', label: 'Place Order', icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-50' },
                                    { id: 'system:service', label: 'Book Service', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
                                    { id: 'system:offers', label: 'See Offers', icon: Gift, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                    { id: 'system:whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-500', bg: 'bg-green-50' },
                                    { id: 'system:forms', label: 'Fill Feedback', icon: ClipboardList, color: 'text-purple-500', bg: 'bg-purple-50' },
                                    { id: 'system:engagement', label: 'Social Connect', icon: Share2, color: 'text-pink-500', bg: 'bg-pink-50' },
                                ].filter(sys => !sequenceIds.includes(sys.id)).map(sys => (
                                    <button 
                                        key={sys.id}
                                        onClick={() => handleAdd(sys.id)}
                                        className={`flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-slate-300 hover:shadow-lg transition-all group text-left`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`size-10 rounded-xl ${sys.bg} ${sys.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                                                <sys.icon size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 leading-none mb-1">{sys.label}</p>
                                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Core Feature</p>
                                            </div>
                                        </div>
                                        <Plus size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                                    </button>
                                ))}
                             </div>
                        </div>

                        {/* Custom Forms */}
                        <div className="pt-4 border-t border-slate-100">
                             <button onClick={() => toggleSection('forms')} className="flex items-center justify-between w-full px-2 mb-3">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Available Custom Forms</p>
                                 <ChevronDown size={14} className={cn("text-slate-400 transition-transform", collapsedSections.forms && "rotate-180")} />
                             </button>
                             <div className={cn("overflow-hidden transition-all", collapsedSections.forms ? "h-0 opacity-0" : "h-auto opacity-100")}>
                                 {formsLoading ? (
                                    <div className="py-10 flex justify-center"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
                                 ) : availableForms.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-2">
                                        {availableForms.map(form => (
                                            <button 
                                                key={form.id}
                                                onClick={() => handleAdd(form.id)}
                                                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-primary hover:shadow-lg transition-all group text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                                        <FileText size={20} />
                                                    </div>
                                                     <div>
                                                         <p className="text-sm font-black text-slate-900 leading-none mb-1">{form.title}</p>
                                                         <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Custom Engagement</p>
                                                     </div>
                                                </div>
                                                <Plus size={18} className="text-slate-300 group-hover:text-primary transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                 ) : (
                                    <p className="text-[10px] text-slate-400 italic px-2 pb-2">No additional forms available.</p>
                                 )}
                             </div>
                        </div>

                        {/* Custom Rewards */}
                        {(rewardsLoading || availableRewards.length > 0) && (
                        <div className="pt-4 border-t border-slate-100">
                             <button onClick={() => toggleSection('rewards')} className="flex items-center justify-between w-full px-2 mb-3">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Custom Rewards</p>
                                 <ChevronDown size={14} className={cn("text-slate-400 transition-transform", collapsedSections.rewards && "rotate-180")} />
                             </button>
                             <div className={cn("overflow-hidden transition-all", collapsedSections.rewards ? "h-0 opacity-0" : "h-auto opacity-100")}>
                                 {rewardsLoading ? (
                                    <div className="py-4 flex justify-center"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
                                 ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                        {availableRewards.map(reward => (
                                            <button 
                                                key={reward.id}
                                                onClick={() => handleAdd(reward.id)}
                                                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-emerald-500 hover:shadow-lg transition-all group text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                                                        <Gift size={20} />
                                                    </div>
                                                     <div>
                                                         <p className="text-sm font-black text-slate-900 leading-none mb-1">{reward.name}</p>
                                                         <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">Reward Strategy</p>
                                                     </div>
                                                </div>
                                                <Plus size={18} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                 )}
                             </div>
                        </div>
                        )}

                        {/* QR Codes */}
                        {(qrLoading || availableQrCodes.length > 0) && (
                        <div className="pt-4 border-t border-slate-100">
                             <button onClick={() => toggleSection('qrcodes')} className="flex items-center justify-between w-full px-2 mb-3">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">QRThrive Links</p>
                                 <ChevronDown size={14} className={cn("text-slate-400 transition-transform", collapsedSections.qrcodes && "rotate-180")} />
                             </button>
                             <div className={cn("overflow-hidden transition-all", collapsedSections.qrcodes ? "h-0 opacity-0" : "h-auto opacity-100")}>
                                 {qrLoading ? (
                                    <div className="py-4 flex justify-center"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
                                 ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                        {availableQrCodes.map(qr => (
                                            <button 
                                                key={qr.id}
                                                onClick={() => handleAdd(qr.id)}
                                                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-500 hover:shadow-lg transition-all group text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                                                        {qr.type === 'pdf' ? <FileText size={20} /> : <Link2 size={20} />}
                                                    </div>
                                                     <div>
                                                         <p className="text-sm font-black text-slate-900 leading-none mb-1">{qr.name}</p>
                                                         <p className="text-[9px] text-blue-600 font-black uppercase tracking-widest">{qr.type}</p>
                                                     </div>
                                                </div>
                                                <Plus size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                 )}
                             </div>
                        </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
