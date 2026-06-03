"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTemplateStyles, useCreateTemplateStyle, useUpdateTemplateStyle, useDeleteTemplateStyle } from '@/services/marketing-assets/hooks';
import { Palette, Plus, Trash2, Edit, Save, X, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function AdminTemplateStylesPage() {
  const { data: styles, isLoading } = useTemplateStyles(true);
  const createMutation = useCreateTemplateStyle();
  const updateMutation = useUpdateTemplateStyle();
  const deleteMutation = useDeleteTemplateStyle();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [accentColor, setAccentColor] = useState('#1E293B');
  const [borderColor, setBorderColor] = useState('#CBD5E1');
  const [qrFgColor, setQrFgColor] = useState('#0F172A');
  const [qrBgColor, setQrBgColor] = useState('#FFFFFF');
  const [textColor, setTextColor] = useState('#0F172A');

  const resetForm = () => {
    setName('');
    setSlug('');
    setDescription('');
    setBgColor('#FFFFFF');
    setAccentColor('#1E293B');
    setBorderColor('#CBD5E1');
    setQrFgColor('#0F172A');
    setQrBgColor('#FFFFFF');
    setTextColor('#0F172A');
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (s: any) => {
    setName(s.name);
    setSlug(s.slug || '');
    setDescription(s.description || '');
    setBgColor(s.bgColor || '#FFFFFF');
    setAccentColor(s.accentColor || '#1E293B');
    setBorderColor(s.borderColor || '#CBD5E1');
    setQrFgColor(s.qrFgColor || '#0F172A');
    setQrBgColor(s.qrBgColor || '#FFFFFF');
    setTextColor(s.textColor || '#0F172A');
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Style name is required');
      return;
    }
    const payload: any = {
      name: name.trim(),
      description: description.trim() || undefined,
      bgColor, accentColor, borderColor, qrFgColor, qrBgColor, textColor,
    };
    if (slug.trim()) payload.slug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, updates: payload });
        toast.success('Style updated');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Style created');
      }
      resetForm();
    } catch {
      toast.error(editingId ? 'Failed to update style' : 'Failed to create style');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this style? This cannot be undone.')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Style deleted');
    } catch {
      toast.error('Failed to delete style');
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, updates: { isActive: !current } });
      toast.success(`Style ${!current ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Palette className="text-primary size-5" />
            Template Styles
          </h3>
          <Button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
            className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold gap-2">
            {showForm ? <X size={16} /> : <Plus size={16} className="stroke-[3px]" />}
            {showForm ? 'Cancel' : 'Add Style'}
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 p-5 rounded-2xl border border-gray-100 mb-6 space-y-4 overflow-hidden"
            >
              <h4 className="font-extrabold text-gray-800 text-sm">
                {editingId ? 'Edit Style' : 'New Style'}
              </h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Name *</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Classic" className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Slug</label>
                    <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="classic" className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Description</label>
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Simple & Professional" className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Background', value: bgColor, set: setBgColor },
                    { label: 'Accent', value: accentColor, set: setAccentColor },
                    { label: 'Border', value: borderColor, set: setBorderColor },
                    { label: 'QR Foreground', value: qrFgColor, set: setQrFgColor },
                    { label: 'QR Background', value: qrBgColor, set: setQrBgColor },
                    { label: 'Text', value: textColor, set: setTextColor },
                  ].map((field) => (
                    <div key={field.label} className="space-y-1">
                      <label className="text-[10px] text-gray-500 font-bold">{field.label}</label>
                      <div className="flex gap-1.5 items-center">
                        <input type="color" value={field.value} onChange={(e) => field.set(e.target.value)} className="size-7 rounded border border-gray-200 cursor-pointer shrink-0" />
                        <input type="text" value={field.value} onChange={(e) => field.set(e.target.value)} className="flex-1 px-2 py-1.5 text-[10px] border border-gray-100 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono uppercase" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200/50">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-primary text-white rounded-xl text-xs font-bold gap-2">
                    <Save size={12} />
                    {editingId ? 'Save Changes' : 'Create Style'}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}
          </div>
        ) : !styles || styles.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="inline-flex size-14 bg-gray-50 text-gray-400 rounded-full items-center justify-center">
              <Palette size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-gray-900">No styles yet</h4>
              <p className="text-xs text-gray-500">Create your first design style preset.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-extrabold uppercase text-gray-400">
                  <th className="pb-3 pl-2">Style</th>
                  <th className="pb-3">Slug</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Colors</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
                {styles.map((s) => (
                  <tr key={s.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pl-2 font-bold text-gray-900">{s.name}</td>
                    <td className="py-4 text-xs font-mono text-gray-400">{s.slug || '-'}</td>
                    <td className="py-4 text-xs text-gray-500">{s.description || '-'}</td>
                    <td className="py-4">
                      <div className="flex gap-1">
                        <span className="size-4 rounded border border-gray-200" style={{ backgroundColor: s.bgColor }} title={`Bg: ${s.bgColor}`} />
                        <span className="size-4 rounded border border-gray-200" style={{ backgroundColor: s.accentColor }} title={`Accent: ${s.accentColor}`} />
                        <span className="size-4 rounded border border-gray-200" style={{ backgroundColor: s.borderColor }} title={`Border: ${s.borderColor}`} />
                        <span className="size-4 rounded border border-gray-200" style={{ backgroundColor: s.qrFgColor }} title={`QR FG: ${s.qrFgColor}`} />
                        <span className="size-4 rounded border border-gray-200" style={{ backgroundColor: s.qrBgColor }} title={`QR BG: ${s.qrBgColor}`} />
                        <span className="size-4 rounded border border-gray-200" style={{ backgroundColor: s.textColor }} title={`Text: ${s.textColor}`} />
                      </div>
                    </td>
                    <td className="py-4">
                      <button onClick={() => handleToggleActive(s.id, s.isActive)} className="focus:outline-none hover:scale-[1.05] transition-transform text-left">
                        {s.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-200">
                            <CheckCircle size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-400 border border-gray-200">
                            <XCircle size={12} /> Inactive
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-4 pr-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button onClick={() => openEdit(s)} variant="outline" className="rounded-xl border-gray-100 text-gray-700 hover:bg-gray-50 font-bold text-xs gap-1 h-9">
                          <Edit size={12} /> Edit
                        </Button>
                        <Button onClick={() => handleDelete(s.id)} variant="outline" className="rounded-xl border-rose-50 text-rose-600 hover:bg-rose-50/50 font-bold text-xs gap-1.5 h-9">
                          <Trash2 size={12} /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
