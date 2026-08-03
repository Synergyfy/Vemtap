'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Save, MoveUp, MoveDown, Sparkles, Megaphone, Zap, Gift, Loader2, Briefcase, Users, Search, Tag, Link2, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { adminBannersApi } from '@/lib/api/admin';
import type { BannerPlacement, BannerTargetType } from '@/lib/api/banners';
import { getPublicOffers } from '@/services/deals/hooks';
import type { DealOffer } from '@/services/deals/types';

const ICON_OPTIONS = [
    { name: 'Sparkles', icon: Sparkles },
    { name: 'Megaphone', icon: Megaphone },
    { name: 'Zap', icon: Zap },
    { name: 'Gift', icon: Gift },
];

const COLOR_OPTIONS = [
    { name: 'Emerald', class: 'bg-gradient-to-r from-emerald-600 to-teal-500' },
    { name: 'Blue', class: 'bg-gradient-to-r from-blue-600 to-indigo-500' },
    { name: 'Rose', class: 'bg-gradient-to-r from-rose-500 to-orange-400' },
    { name: 'Purple', class: 'bg-gradient-to-r from-purple-600 to-pink-500' },
    { name: 'Amber', class: 'bg-gradient-to-r from-amber-500 to-orange-500' },
];

interface BannerSlide {
    id: string;
    title: string;
    description: string;
    iconName: string;
    actionLabel?: string;
    actionUrl?: string;
    color: string;
    sortOrder: number;
    isActive: boolean;
    placement: BannerPlacement;
    targetType?: BannerTargetType;
    targetId?: string;
}

const TARGET_OPTIONS: { value: BannerTargetType; label: string; icon: LucideIcon; description: string }[] = [
    { value: 'custom', label: 'Custom Link', icon: Link2, description: 'Use the Action URL below as-is.' },
    { value: 'deals-page', label: 'Deals Page', icon: Search, description: 'Link to the customer deals/discover page.' },
    { value: 'deal', label: 'Specific Deal', icon: Tag, description: 'Pick a deal campaign to feature.' },
];

const dealUrl = (offer: DealOffer) =>
    offer.business?.slug ? `/deals/${offer.business.slug}/${offer.id}` : `/promotions/${offer.id}`;

const PLACEMENT_TABS: { value: BannerPlacement; label: string; icon: LucideIcon; description: string }[] = [
    { value: 'business', label: 'Business Dashboards', icon: Briefcase, description: 'Banners shown on the business owner dashboard.' },
    { value: 'customer', label: 'Customer App', icon: Users, description: 'Banners shown on the customer dashboard.' },
];

export default function AdminBannerManagementPage() {
    const [slides, setSlides] = useState<BannerSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<BannerSlide>>({});
    const [placement, setPlacement] = useState<BannerPlacement>('business');
    const [dealSearch, setDealSearch] = useState('');
    const [dealResults, setDealResults] = useState<DealOffer[]>([]);
    const [dealSearching, setDealSearching] = useState(false);
    const [dealSearchOpen, setDealSearchOpen] = useState(false);
    const dealSearchRef = React.useRef<HTMLDivElement>(null);

    const searchDeals = async (query: string) => {
        if (!query.trim()) {
            setDealResults([]);
            return;
        }
        setDealSearching(true);
        try {
            const res = await getPublicOffers({ search: query.trim(), limit: 8 });
            setDealResults(Array.isArray(res) ? res : res?.data || []);
        } catch {
            setDealResults([]);
        } finally {
            setDealSearching(false);
        }
    };

    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dealSearchRef.current && !dealSearchRef.current.contains(e.target as Node)) {
                setDealSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selectDeal = (offer: DealOffer) => {
        const url = dealUrl(offer);
        setEditForm((prev) => ({
            ...prev,
            targetType: 'deal',
            targetId: offer.id,
            actionUrl: url,
            actionLabel: prev.actionLabel || 'View Deal',
            title: prev.title || offer.name,
            description: prev.description || `${offer.business?.name || 'A business'} — ${(offer.description || '').slice(0, 90)}`,
        }));
        setDealSearch('');
        setDealResults([]);
        setDealSearchOpen(false);
    };

    const setTargetType = (value: BannerTargetType) => {
        if (value === 'deals-page') {
            setEditForm((prev) => ({
                ...prev,
                targetType: value,
                targetId: undefined,
                actionUrl: '/customer/discover',
                actionLabel: prev.actionLabel || 'Browse Deals',
            }));
            return;
        }
        if (value === 'custom') {
            setEditForm((prev) => ({ ...prev, targetType: value, targetId: undefined }));
            return;
        }
        setEditForm((prev) => ({ ...prev, targetType: value }));
    };

    const fetchBanners = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminBannersApi.list(placement);
            setSlides(Array.isArray(data) ? data : data?.data || []);
        } catch {
            toast.error('Failed to load banners');
        } finally {
            setLoading(false);
        }
    }, [placement]);

    useEffect(() => {
        fetchBanners();
    }, [fetchBanners]);

    const isTempId = (id: string) => id.startsWith('new-');

    const handleAdd = () => {
        const tempId = `new-${Date.now()}`;
        const newSlide: BannerSlide = {
            id: tempId,
            title: '',
            description: '',
            iconName: 'Megaphone',
            color: 'bg-gradient-to-r from-emerald-600 to-teal-500',
            sortOrder: slides.length,
            isActive: true,
            placement,
            targetType: 'custom',
        };
        setSlides(prev => [...prev, newSlide]);
        setEditingId(tempId);
        setEditForm(newSlide);
    };

    const handleAddWelcome = () => {
        const tempId = `new-${Date.now()}`;
        const newSlide: BannerSlide = {
            id: tempId,
            title: placement === 'customer' ? 'Hi {firstName}! 👋' : 'Welcome to {businessName} Dashboard',
            description: placement === 'customer'
                ? 'Welcome to VemTap! Tap at any location to earn points, unlock rewards, and discover deals near you.'
                : 'Track visitors, loyalty, and messaging all in one place. Use the menu to manage your day-to-day.',
            iconName: 'Sparkles',
            color: 'bg-gradient-to-r from-[#066CF4] to-[#4293FF]',
            sortOrder: slides.length,
            isActive: true,
            placement,
            targetType: 'custom',
        };
        setSlides(prev => [...prev, newSlide]);
        setEditingId(tempId);
        setEditForm(newSlide);
    };

    const handleEdit = (slide: BannerSlide) => {
        setEditingId(slide.id);
        setEditForm(slide);
    };

    const handleCancel = () => {
        if (editingId && isTempId(editingId)) {
            setSlides(prev => prev.filter(s => s.id !== editingId));
        }
        setEditingId(null);
    };

    const handleSave = async () => {
        if (!editingId || !editForm) return;
        try {
            const payload = {
                title: editForm.title || 'New Announcement',
                description: editForm.description || '',
                iconName: editForm.iconName || 'Megaphone',
                actionLabel: editForm.actionLabel,
                actionUrl: editForm.actionUrl,
                color: editForm.color || 'bg-gradient-to-r from-emerald-600 to-teal-500',
                placement,
                targetType: editForm.targetType || 'custom',
                targetId: editForm.targetId,
            };
            if (isTempId(editingId)) {
                await adminBannersApi.create(payload);
                toast.success('Slide created!');
            } else {
                await adminBannersApi.update(editingId, payload);
                toast.success('Slide updated!');
            }
            setEditingId(null);
            await fetchBanners();
        } catch {
            toast.error('Failed to save slide');
        }
    };

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= slides.length) return;

        const reordered = [...slides];
        [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

        try {
            await adminBannersApi.reorder(reordered.map(s => s.id));
            setSlides(reordered);
        } catch {
            toast.error('Failed to reorder');
            await fetchBanners();
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this slide?')) return;
        if (isTempId(id)) {
            setSlides(prev => prev.filter(s => s.id !== id));
            if (editingId === id) setEditingId(null);
            toast.success('Slide discarded');
            return;
        }
        try {
            await adminBannersApi.delete(id);
            toast.success('Slide deleted');
            await fetchBanners();
        } catch {
            toast.error('Failed to delete slide');
        }
    };

    if (loading) {
        return (
            <div className="p-4 md:p-8 max-w-5xl mx-auto">
                <div className="flex items-center justify-center py-32">
                    <Loader2 size={32} className="animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold text-text-main">Banner Management</h1>
                    <p className="text-sm text-text-secondary">Manage announcement banners for business dashboards and the customer app separately.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleAddWelcome}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-text-main rounded-xl text-xs font-black uppercase tracking-widest hover:border-primary/30 hover:text-primary shadow-sm transition-all"
                    >
                        <Sparkles size={16} />
                        Welcome Banner
                    </button>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
                    >
                        <Plus size={16} />
                        Add Slide
                    </button>
                </div>
            </div>

            {/* Placement Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PLACEMENT_TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.value}
                            onClick={() => {
                                setPlacement(tab.value);
                                setEditingId(null);
                                setEditForm({});
                            }}
                            className={cn(
                                "flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all",
                                placement === tab.value
                                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                    : "border-gray-100 bg-white hover:border-gray-200"
                            )}
                        >
                            <div className={cn(
                                "size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                placement === tab.value ? "bg-primary text-white" : "bg-gray-50 text-gray-400"
                            )}>
                                <Icon size={18} />
                            </div>
                            <div>
                                <p className={cn("text-sm font-black", placement === tab.value ? "text-primary" : "text-text-main")}>
                                    {tab.label}
                                </p>
                                <p className="text-xs text-text-secondary mt-0.5 leading-snug">{tab.description}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="space-y-4">
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={cn(
                            "bg-white rounded-2xl border transition-all overflow-hidden",
                            editingId === slide.id ? "border-primary ring-4 ring-primary/5" : "border-gray-100 hover:border-gray-200"
                        )}
                    >
                        {editingId === slide.id ? (
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Title</label>
                                        <input
                                            type="text"
                                            value={editForm.title || ''}
                                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                            placeholder={placement === 'business' ? 'e.g. Welcome to {businessName} Dashboard' : 'e.g. Hi {firstName}!'}
                                            className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        />
                                        <p className="text-[10px] font-medium text-text-secondary leading-snug ml-1">
                                            Tip: use <span className="font-black text-primary">{"{businessName}"}</span> on business banners or <span className="font-black text-primary">{"{firstName}"}</span> on customer banners to insert the user's name.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Action Label (Optional)</label>
                                        <input
                                            type="text"
                                            value={editForm.actionLabel || ''}
                                            onChange={(e) => setEditForm({ ...editForm, actionLabel: e.target.value })}
                                            placeholder="e.g. Learn More"
                                            className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Action URL (Optional)</label>
                                        <input
                                            type="text"
                                            value={editForm.actionUrl || ''}
                                            onChange={(e) => setEditForm({ ...editForm, actionUrl: e.target.value })}
                                            placeholder="e.g. /dashboard/visitors/all"
                                            disabled={editForm.targetType === 'deals-page'}
                                            className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Link Target</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            {TARGET_OPTIONS.map((opt) => {
                                                const Icon = opt.icon;
                                                const isActive = (editForm.targetType || 'custom') === opt.value;
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => setTargetType(opt.value)}
                                                        className={cn(
                                                            "flex items-start gap-2 p-3 rounded-xl border-2 text-left transition-all",
                                                            isActive
                                                                ? "border-primary bg-primary/5 text-primary"
                                                                : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                                                        )}
                                                    >
                                                        <Icon size={16} className="mt-0.5 shrink-0" />
                                                        <span className="min-w-0">
                                                            <span className="block text-xs font-black uppercase tracking-widest">{opt.label}</span>
                                                            <span className="block text-[10px] font-medium text-text-secondary mt-0.5 leading-snug">{opt.description}</span>
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {(editForm.targetType || 'custom') === 'deal' && (
                                            <div className="relative mt-2" ref={dealSearchRef}>
                                                <div className="flex items-center gap-2">
                                                    <div className="relative flex-1">
                                                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            value={dealSearch}
                                                            onChange={(e) => {
                                                                setDealSearch(e.target.value);
                                                                setDealSearchOpen(true);
                                                                searchDeals(e.target.value);
                                                            }}
                                                            onFocus={() => setDealSearchOpen(true)}
                                                            placeholder={editForm.targetId ? 'Search another deal…' : 'Search deals by name…'}
                                                            className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                        />
                                                    </div>
                                                    {editForm.targetId && (
                                                        <button
                                                            onClick={() => setEditForm({ ...editForm, targetId: undefined, actionUrl: '' })}
                                                            className="flex items-center gap-1 px-3 h-11 text-xs font-black uppercase tracking-widest text-text-secondary hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-xl transition-all"
                                                        >
                                                            <X size={14} />
                                                            Clear
                                                        </button>
                                                    )}
                                                </div>
                                                {dealSearchOpen && (dealSearch.trim() || dealSearching) && (
                                                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                                        {dealSearching ? (
                                                            <div className="p-4 flex items-center justify-center gap-2 text-text-secondary text-xs font-bold">
                                                                <Loader2 size={14} className="animate-spin" />
                                                                Searching…
                                                            </div>
                                                        ) : dealResults.length > 0 ? (
                                                            dealResults.map((offer) => (
                                                                <button
                                                                    key={offer.id}
                                                                    onClick={() => selectDeal(offer)}
                                                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                                                                >
                                                                    {offer.mainImage ? (
                                                                        // eslint-disable-next-line @next/next/no-img-element
                                                                        <img src={offer.mainImage} alt="" className="size-9 rounded-lg object-cover shrink-0" />
                                                                    ) : (
                                                                        <div className="size-9 rounded-lg bg-primary/5 text-primary flex items-center justify-center shrink-0">
                                                                            <Tag size={14} />
                                                                        </div>
                                                                    )}
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-[13px] font-bold text-text-main truncate">{offer.name}</p>
                                                                        <p className="text-[11px] text-text-secondary truncate">
                                                                            {offer.business?.name || 'Business'}{offer.isTrending ? ' • 🔥 Trending' : ''}
                                                                        </p>
                                                                    </div>
                                                                    <Link2 size={14} className="text-gray-300 shrink-0" />
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 text-center text-xs font-bold text-text-secondary">No deals found.</div>
                                                        )}
                                                    </div>
                                                )}
                                                {editForm.targetId && !dealSearchOpen && (
                                                    <p className="mt-1.5 text-[11px] font-bold text-primary flex items-center gap-1">
                                                        <Tag size={12} />
                                                        Deal selected — link set automatically.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Placement</label>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1 px-3 h-12 rounded-xl bg-gray-50 border border-gray-100 text-xs font-black uppercase tracking-widest text-gray-500">
                                                {placement === 'customer' ? <Users size={14} /> : <Briefcase size={14} />}
                                                {placement === 'customer' ? 'Customer' : 'Business'}
                                            </span>
                                            <p className="text-[11px] font-medium text-text-secondary leading-snug">Controlled by the tab you're on.</p>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Description</label>
                                        <textarea
                                            value={editForm.description || ''}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            rows={3}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Icon</label>
                                        <div className="flex flex-wrap gap-2">
                                            {ICON_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.name}
                                                    onClick={() => setEditForm({ ...editForm, iconName: opt.name as any })}
                                                    className={cn(
                                                        "p-3 rounded-xl border transition-all",
                                                        editForm.iconName === opt.name
                                                            ? "bg-primary/10 border-primary text-primary"
                                                            : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                                                    )}
                                                >
                                                    <opt.icon size={20} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Color Theme</label>
                                        <div className="flex flex-wrap gap-2">
                                            {COLOR_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.name}
                                                    onClick={() => setEditForm({ ...editForm, color: opt.class })}
                                                    className={cn(
                                                        "size-10 rounded-xl border-4 transition-all",
                                                        opt.class,
                                                        editForm.color === opt.class ? "border-primary" : "border-transparent"
                                                    )}
                                                    title={opt.name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-50">
                                    <button
                                        onClick={handleCancel}
                                        className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-text-secondary hover:bg-gray-50 rounded-xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
                                    >
                                        <Save size={16} />
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-4">
                                    <div className={cn("size-16 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg", slide.color)}>
                                        {React.createElement(ICON_OPTIONS.find(o => o.name === slide.iconName)?.icon || Megaphone, { size: 32 })}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h3 className="text-base font-bold text-text-main">{slide.title}</h3>
                                            <span className={cn(
                                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                slide.placement === 'customer' ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
                                            )}>
                                                {slide.placement === 'customer' ? <Users size={9} /> : <Briefcase size={9} />}
                                                {slide.placement === 'customer' ? 'Customer' : 'Business'}
                                            </span>
                                            {slide.targetType === 'deals-page' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-sky-50 text-sky-600">
                                                    <Search size={9} />
                                                    Deals Page
                                                </span>
                                            )}
                                            {slide.targetType === 'deal' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-orange-50 text-orange-600">
                                                    <Tag size={9} />
                                                    Deal
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-text-secondary line-clamp-2 max-w-xl">{slide.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                                    <div className="flex items-center gap-1 mr-2">
                                        <button
                                            disabled={index === 0}
                                            onClick={() => handleMove(index, 'up')}
                                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 disabled:opacity-30 rounded-lg"
                                        >
                                            <MoveUp size={16} />
                                        </button>
                                        <button
                                            disabled={index === slides.length - 1}
                                            onClick={() => handleMove(index, 'down')}
                                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 disabled:opacity-30 rounded-lg"
                                        >
                                            <MoveDown size={16} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleEdit(slide)}
                                        className="p-2.5 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(slide.id)}
                                        className="p-2.5 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {slides.length === 0 && (
                    <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <div className="size-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                            {placement === 'customer' ? <Users size={32} /> : <Megaphone size={32} />}
                        </div>
                        <h3 className="text-base font-bold text-text-main">No {placement === 'customer' ? 'Customer' : 'Business'} Slides Found</h3>
                        <p className="text-sm text-text-secondary mt-1">Create your first banner announcement to display on {placement === 'customer' ? 'the customer app' : 'business dashboards'}.</p>
                        <button
                            onClick={handleAdd}
                            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-primary/30 hover:text-primary transition-all shadow-sm"
                        >
                            <Plus size={16} />
                            Create Slide
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
