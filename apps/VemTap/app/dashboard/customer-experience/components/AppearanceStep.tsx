'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Save, Loader2, Info, CheckCircle2 } from 'lucide-react';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranch } from '@/services/branches/hooks';
import { useUpdateBranchFormSettings } from '@/services/business-forms/hooks';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
    '#2563eb', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#f97316', // Orange
    '#64748b', // Slate
    '#000000', // Black
];

export function AppearanceStep() {
    const { activeBranchId } = useActiveBranch();
    const { data: business } = useMyBusiness();
    const mainBranch = business?.branches?.find((b) => b.isMainBranch);
    const { data: branch, isLoading: branchLoading } = useBranch(activeBranchId || '');
    
    const { updateEngagementSettings, engagementSettings } = useCustomerFlowStore();
    const updateMutation = useUpdateBranchFormSettings(activeBranchId || mainBranch?.id);
    const [isSaving, setIsSaving] = useState(false);

    // Initial color sync
    useEffect(() => {
        const initialColor = branch?.formAppearanceColor || business?.brandColor;
        if (initialColor && !engagementSettings.brandColor) {
            updateEngagementSettings({ brandColor: initialColor });
        }
    }, [branch?.formAppearanceColor, business?.brandColor]);

    const brandColor = engagementSettings.brandColor || '#2563eb';

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateMutation.mutateAsync({
                formAppearanceColor: brandColor,
            });
            toast.success('Appearance settings saved successfully');
        } catch (error) {
            console.error('Failed to save appearance', error);
            toast.error('Failed to save appearance settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Brand Visuals</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Customize the global interface for your customers</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving || branchLoading}
                    className="h-10 px-6 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Appearance
                </button>
            </div>

            <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary Brand Color</label>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                This color will be applied to buttons, accents, and icons across your customer's mobile journey.
                            </p>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <input
                                    type="color"
                                    value={brandColor}
                                    onChange={(e) => updateEngagementSettings({ brandColor: e.target.value })}
                                    className="size-20 rounded-[2rem] border-4 border-white shadow-xl cursor-pointer p-0 overflow-hidden appearance-none"
                                />
                                <div className="absolute -bottom-2 -right-2 size-8 rounded-xl bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-400 pointer-events-none">
                                    <Palette size={16} />
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">HEX Code</p>
                                <span className="text-lg font-black text-slate-900 font-mono tracking-tight">{brandColor.toUpperCase()}</span>
                            </div>
                        </div>

                        <div className="pt-4 space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Presets</p>
                            <div className="flex flex-wrap gap-3">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => updateEngagementSettings({ brandColor: color })}
                                        className={cn(
                                            "size-10 rounded-xl transition-all relative border-2 border-transparent",
                                            brandColor === color ? "scale-90 border-white ring-2 ring-primary" : "hover:scale-110 shadow-sm"
                                        )}
                                        style={{ backgroundColor: color }}
                                    >
                                        {brandColor === color && (
                                            <div className="absolute inset-0 flex items-center justify-center text-white">
                                                <div className="size-2 bg-white rounded-full" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                                <Info size={20} />
                            </div>
                            <h4 className="text-sm font-black text-slate-900">Why color matters?</h4>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Consistent branding builds trust. Our system automatically generates safe contrasting text colors based on your choice to ensure maximum legibility.
                        </p>
                        <ul className="space-y-2">
                            {['Buttons & Actions', 'Active State Icons', 'Form Field Accents', 'Success Animations'].map(item => (
                                <li key={item} className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                    <CheckCircle2 size={12} style={{ color: brandColor }} />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
