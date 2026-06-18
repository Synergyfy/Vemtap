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
import { FaWhatsapp } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import { buildBrandCssVars } from '@/lib/brandColor';

const SYSTEM_ACTIONS = [
    { id: 'system:order', title: 'Place Order', subtitle: 'Default Action', icon: 'shopping_bag', color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'system:service', title: 'Book Service', subtitle: 'Default Action', icon: 'calendar_month', color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'system:offers', title: 'See Offers', subtitle: 'Default Action', icon: 'redeem', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'system:whatsapp', title: 'WhatsApp', subtitle: 'Default Action', icon: 'chat', color: 'text-green-500', bg: 'bg-green-50' },
];

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
    const brandVars = React.useMemo(() => buildBrandCssVars(brandColor), [brandColor]);

    const previewBusinessName = branch?.name || business?.name || 'Your Business';
    const previewBusinessLogo = business?.logoUrl || null;

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
                    { label: 'Default Form', href: '/dashboard/engagement/experience/default-form' },
                    { label: 'Default Success', href: '/dashboard/engagement/experience/default-success' },
                    { label: 'Additional Items', href: '/dashboard/engagement/experience/additional-forms' },
                    { label: 'Appearance', active: true },
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
                    <div className="flex justify-center" style={brandVars}>
                        <PhoneFrame title="UBL Preview">
                            <div className="min-h-full bg-slate-50 py-4 px-3 space-y-2">
                                <div className="flex items-center gap-2 mb-3 border-b border-slate-100/50 pb-3">
                                    {previewBusinessLogo ? (
                                        <div className="size-8 rounded-full border border-white shadow-sm overflow-hidden bg-white shrink-0">
                                            <img src={previewBusinessLogo} alt={previewBusinessName} className="size-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/VEMTAP_PNG.png'; }} />
                                        </div>
                                    ) : (
                                        <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white shadow-sm shrink-0">
                                            <span className="text-[10px] font-black uppercase">{previewBusinessName.charAt(0)}</span>
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-slate-900 truncate leading-tight">Welcome to {previewBusinessName}</p>
                                        <p className="text-[8px] text-slate-400 italic truncate">Select an option below</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5">
                                    {SYSTEM_ACTIONS.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm"
                                        >
                                            <div className={cn("size-7 rounded-lg flex items-center justify-center shrink-0", item.bg)}>
                                                {item.id === 'system:whatsapp' ? (
                                                    <FaWhatsapp className={cn("text-[14px]", item.color)} />
                                                ) : (
                                                    <span className={cn("material-symbols-outlined !text-[14px]", item.color)}>{item.icon}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <span 
                                                    className="text-[9px] font-bold truncate block leading-tight"
                                                    style={{ color: brandColor || '#0f172a' }}
                                                >
                                                    {item.title}
                                                </span>
                                                <span className="text-[7px] font-bold uppercase tracking-widest text-slate-400 block truncate">{item.subtitle}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-center gap-3 py-2 opacity-30">
                                    <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Verified</span>
                                    <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Instant Service</span>
                                </div>
                                <p className="text-center text-[7px] font-medium text-slate-400">
                                    Powered by <span className="font-bold" style={{ color: brandColor }}>{previewBusinessName}</span>
                                </p>
                            </div>
                        </PhoneFrame>
                    </div>
                    
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
