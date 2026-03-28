'use client';

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import EngagementTabs from '@/components/dashboard/engagement/EngagementTabs';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useBranch } from '@/services/branches/hooks';
import { useUpdateBranchFormSettings } from '@/services/business-forms/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { toast } from 'react-hot-toast';
import { Loader2, Save, Palette, Info, Star, MessageSquare, Heart } from 'lucide-react';

export default function UserExperienceAppearancePage() {
    const { activeBranchId } = useActiveBranch();
    const { data: business } = useMyBusiness();
    const mainBranch = business?.branches?.find((b) => b.isMainBranch);
    const { data: branch, isLoading } = useBranch(activeBranchId || '');
    const { updateEngagementSettings, engagementSettings } = useCustomerFlowStore();
    
    const updateMutation = useUpdateBranchFormSettings(activeBranchId || mainBranch?.id);
    const [isSaving, setIsSaving] = React.useState(false);

    // Use store value primarily for UI responsiveness, fall back to branch/business settings
    const brandColor = engagementSettings?.brandColor || branch?.formAppearanceColor || business?.brandColor || '#2563eb';

    // Sync brandColor to store when data is available
    React.useEffect(() => {
        const initialColor = branch?.formAppearanceColor || business?.brandColor;
        if (initialColor) {
            updateEngagementSettings({ brandColor: initialColor });
        }
    }, [branch?.formAppearanceColor, business?.brandColor]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateMutation.mutateAsync({
                formAppearanceColor: brandColor,
            });
            toast.success('Appearance settings saved');
        } catch (error) {
            console.error('Failed to save appearance', error);
            toast.error('Failed to save appearance settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto">
            <PageHeader
                title="Appearance"
                description="Set the global look and feel for your customer forms."
            />

            <EngagementTabs
                tabs={[
                    { label: 'Appearance', active: true },
                    { label: 'Default Form', href: '/dashboard/engagement/experience/default-form' },
                    { label: 'Default Success', href: '/dashboard/engagement/experience/default-success' },
                    { label: 'Additional Forms', href: '/dashboard/engagement/experience/additional-forms' },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Configuration Column */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-8 shadow-sm">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                    <Palette size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Global Form Appearance</h3>
                                    <p className="text-xs text-gray-500 font-medium">Customize how your forms look across {activeBranchId ? 'this branch' : 'all branches'}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || isLoading}
                                className="h-10 px-4 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save Changes
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50/30 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-gray-900">Brand Primary Color</p>
                                        <p className="text-xs text-gray-500 font-medium leading-normal max-w-sm">
                                            This color is the heart of your brand identity. It's used for primary buttons, 
                                            active states, and key decorative elements.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">HEX CODE</p>
                                            <span className="text-xs font-mono font-bold text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded-md">{brandColor.toUpperCase()}</span>
                                        </div>
                                        <input
                                            type="color"
                                            value={brandColor}
                                            onChange={(e) => updateEngagementSettings({ brandColor: e.target.value })}
                                            className="size-12 rounded-xl border-4 border-white shadow-md cursor-pointer p-0 overflow-hidden"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Quick Presets</p>
                                    <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                                        {['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#64748b', '#000000'].map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => updateEngagementSettings({ brandColor: color })}
                                                className={`aspect-square rounded-xl transition-all relative ${brandColor === color ? 'ring-2 ring-offset-2 ring-primary scale-90' : 'hover:scale-110 shadow-sm'}`}
                                                style={{ backgroundColor: color }}
                                            >
                                                {brandColor === color && <div className="absolute inset-0 flex items-center justify-center text-white"><div className="size-1.5 bg-white rounded-full shadow-sm" /></div>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex gap-4">
                                <div className="size-10 rounded-xl bg-amber-100 text-amber-600 flex-shrink-0 flex items-center justify-center">
                                    <Palette size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-900">Consistency Matters</p>
                                    <p className="text-xs text-amber-700 font-medium leading-relaxed mt-1">
                                        Your primary color will be automatically applied to the "Join Loyalty" form, 
                                        check-in screens, and email headers sent to your customers.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Column */}
                <div className="lg:col-span-5 flex flex-col items-center">
                    <PhoneFrame title="Live Customer Preview">
                        <div className="min-h-full bg-slate-50 py-6 px-3 space-y-3 flex flex-col items-stretch">
                            {/* ─── Header Container — Matching Additional Forms style ─── */}
                            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                                {/* Top brand accent bar */}
                                <div 
                                    className="h-1 flex-shrink-0" 
                                    style={{ backgroundColor: brandColor }}
                                />

                                <div className="px-4 pt-3 pb-4 text-left">
                                    <div className="flex items-center gap-2 mb-2.5">
                                        <div className="size-8 rounded-lg bg-white border border-gray-100 overflow-hidden flex items-center justify-center p-0.5 shrink-0 shadow-sm relative">
                                            <div className="absolute inset-0 bg-slate-50 flex items-center justify-center opacity-50" />
                                            <Palette size={14} className="text-slate-300 relative z-10" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h2 className="text-[11px] font-black text-slate-400 tracking-tight leading-tight truncate uppercase">
                                                Your Business
                                            </h2>
                                        </div>
                                    </div>

                                    <h1 className="text-base font-display font-black text-slate-900 tracking-tight leading-tight">
                                        Join Our Community
                                    </h1>
                                    <p className="mt-1 text-[11px] text-slate-500 font-medium leading-relaxed">
                                        Sign up to receive rewards and exclusive updates.
                                    </p>
                                </div>
                            </div>

                            {/* ─── Form Elements Container ─── */}
                            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-left flex-1 space-y-4">
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
                                        <div className="h-11 w-full bg-slate-50 border border-slate-100 rounded-xl px-4 flex items-center">
                                            <div className="h-2 w-24 bg-slate-200 rounded animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                                        <div className="h-11 w-full bg-slate-50 border border-slate-100 rounded-xl px-4 flex items-center">
                                            <div className="h-2 w-32 bg-slate-200 rounded animate-pulse" />
                                        </div>
                                    </div>
                                    
                                    <button 
                                        className="w-full h-12 rounded-2xl text-white font-bold text-xs shadow-lg transition-all mt-4 hover:brightness-110 active:scale-95"
                                        style={{ 
                                            backgroundColor: brandColor,
                                            boxShadow: `0 10px 15px -3px ${brandColor}20` 
                                        }}
                                    >
                                        Continue & Finish
                                    </button>
                                </div>

                                {/* Sample Post-Submit Previews */}
                                <div className="pt-4 border-t border-slate-50 space-y-3">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] text-center mb-1">Preview Accents</p>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 bg-slate-50 p-2 rounded-xl flex flex-col items-center gap-1 border border-slate-100">
                                            <Heart size={12} style={{ color: brandColor }} />
                                            <span className="text-[8px] font-bold text-slate-500 uppercase">Like</span>
                                        </div>
                                        <div className="flex-1 bg-slate-50 p-2 rounded-xl flex flex-col items-center gap-1 border border-slate-100">
                                            <Star size={12} style={{ color: brandColor }} />
                                            <span className="text-[8px] font-bold text-slate-500 uppercase">Review</span>
                                        </div>
                                        <div className="flex-1 bg-slate-50 p-2 rounded-xl flex flex-col items-center gap-1 border border-slate-100">
                                            <MessageSquare size={12} style={{ color: brandColor }} />
                                            <span className="text-[8px] font-bold text-slate-500 uppercase">Feedback</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Powered by tag */}
                            <p className="text-center text-[8px] font-bold text-slate-300 uppercase tracking-widest pt-2">
                                Powered by <span style={{ color: brandColor }}>VemTap</span>
                            </p>
                        </div>
                    </PhoneFrame>
                    
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 mt-8 max-w-[280px]">
                        <p className="text-[10px] text-blue-600 font-medium leading-relaxed italic text-center">
                            This preview uses the <span className="font-bold underline">real component layout</span> that your customers see. Use it to ensure your brand color doesn't clash with content.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
