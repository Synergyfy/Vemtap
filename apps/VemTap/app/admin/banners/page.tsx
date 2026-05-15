'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Save, MoveUp, MoveDown, Sparkles, Megaphone, Zap, Gift, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { adminBannersApi } from '@/lib/api/admin';

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
}

export default function AdminBannerManagementPage() {
    const [slides, setSlides] = useState<BannerSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<BannerSlide>>({});

    const fetchBanners = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminBannersApi.list();
            setSlides(Array.isArray(data) ? data : data?.data || []);
        } catch {
            toast.error('Failed to load banners');
        } finally {
            setLoading(false);
        }
    }, []);

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
            if (isTempId(editingId)) {
                await adminBannersApi.create({
                    title: editForm.title || 'New Announcement',
                    description: editForm.description || '',
                    iconName: editForm.iconName || 'Megaphone',
                    actionLabel: editForm.actionLabel,
                    actionUrl: editForm.actionUrl,
                    color: editForm.color || 'bg-gradient-to-r from-emerald-600 to-teal-500',
                });
                toast.success('Slide created!');
            } else {
                await adminBannersApi.update(editingId, {
                    title: editForm.title,
                    description: editForm.description,
                    iconName: editForm.iconName,
                    actionLabel: editForm.actionLabel,
                    actionUrl: editForm.actionUrl,
                    color: editForm.color,
                });
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
                    <p className="text-sm text-text-secondary">Manage the announcement banners shown on business dashboards.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
                >
                    <Plus size={16} />
                    Add Slide
                </button>
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
                                            className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        />
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
                                            className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        />
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
                                        <h3 className="text-base font-bold text-text-main mb-1">{slide.title}</h3>
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
                            <Megaphone size={32} />
                        </div>
                        <h3 className="text-base font-bold text-text-main">No Slides Found</h3>
                        <p className="text-sm text-text-secondary mt-1">Create your first banner announcement to display on business dashboards.</p>
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
